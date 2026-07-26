import { preprocessFulltextElements } from './fulltextParser';
import { isImageUrl } from './imageUtils';

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderInlineMarkdown(src: string): string {
  if (!src) return '';
  return src
    // Pipe Images ![alt|styles](url)
    .replace(
      /!\[([^\]|]+)\|([^\]]+)\]\(([^)\s]+)\)/g,
      '<img alt="$1" src="$3" data-img-src="$3" data-img-alt="$1" data-img-styles="$2" class="interactive-md-img cursor-pointer hover:ring-2 hover:ring-amber-400/80 transition-all" style="max-width:100%; border-radius: calc(var(--radius) - 4px); margin: 8px 0;" />'
    )
    // Images ![alt](url)
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      '<img alt="$1" src="$2" data-img-src="$2" data-img-alt="$1" class="interactive-md-img cursor-pointer hover:ring-2 hover:ring-amber-400/80 transition-all" style="max-width:100%; border-radius: calc(var(--radius) - 4px); margin: 8px 0; border: 1px solid var(--card-border, #e2e8f0);" />'
    )
    // Links [text](url) -> if url looks like image, render as image!
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, text, url) => {
        if (isImageUrl(url)) {
          return `<img alt="${text}" src="${url}" data-img-src="${url}" data-img-alt="${text}" class="interactive-md-img cursor-pointer hover:ring-2 hover:ring-amber-400/80 transition-all" style="max-width:100%; border-radius: calc(var(--radius) - 4px); margin: 8px 0; border: 1px solid var(--card-border, #e2e8f0);" />`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
    )
    // Bold **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic *text* or _text_
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function renderMarkdownToHtml(markdownSource: string): string {
  if (!markdownSource) return '';

  // Preprocess fulltext element tags ([FANCY], [SECTION], [FLEXBOX-CARDS], etc.)
  const preprocessed = preprocessFulltextElements(markdownSource);

  const lines = preprocessed
    .replace(/\r\n/g, '\n')
    .split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Already formatted HTML blocks from fulltext elements or raw tags
    if (/^\s*<(div|blockquote|section|p|pre|iframe|img|hr|table|ul|ol|header|footer|video|source|audio|figure)/i.test(line.trim())) {
      const htmlBlockLines: string[] = [];
      let tagDepth = 0;
      while (i < lines.length) {
        const currentLine = lines[i];
        htmlBlockLines.push(currentLine);

        const openMatches = currentLine.match(/<(div|blockquote|section|p|pre|iframe|table|ul|ol|header|footer|video|audio|figure)[\s>]/gi);
        const closeMatches = currentLine.match(/<\/(div|blockquote|section|p|pre|iframe|table|ul|ol|header|footer|video|audio|figure)>/gi);
        
        tagDepth += (openMatches ? openMatches.length : 0) - (closeMatches ? closeMatches.length : 0);
        i++;

        // If tagDepth reaches <= 0 and we've seen at least 1 tag, or if next line doesn't look like part of HTML when depth is 0
        if (tagDepth <= 0) {
          break;
        }
      }
      out.push(htmlBlockLines.join('\n'));
      continue;
    }

    // Code blocks ``` lang ... ```
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing ```
      out.push(
        `<pre style="background: color-mix(in srgb, var(--accent) 10%, transparent); padding: 12px; border-radius: 8px; overflow-x: auto;"><code>${codeLines.join(
          '\n'
        )}</code></pre>`
      );
      continue;
    }

    // Headings #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInlineMarkdown(headingMatch[2]);
      out.push(`<h${level}>${content}</h${level}>`);
      i++;
      continue;
    }

    // Blockquotes >
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(
          renderInlineMarkdown(lines[i].replace(/^>\s?/, ''))
        );
        i++;
      }
      out.push(`<blockquote>${quoteLines.join('<br>')}</blockquote>`);
      continue;
    }

    // Unordered lists - or *
    if (/^\s*[-*+]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        listItems.push(
          `<li>${renderInlineMarkdown(
            lines[i].replace(/^\s*[-*+]\s+/, '')
          )}</li>`
        );
        i++;
      }
      out.push(`<ul>${listItems.join('')}</ul>`);
      continue;
    }

    // Ordered lists 1.
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(
          `<li>${renderInlineMarkdown(
            lines[i].replace(/^\s*\d+\.\s+/, '')
          )}</li>`
        );
        i++;
      }
      out.push(`<ol>${listItems.join('')}</ol>`);
      continue;
    }

    // Empty lines
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6}\s|>\s?|\s*[-*+]\s+|\s*\d+\.\s+|```)/.test(lines[i]) &&
      !/^\s*<(div|blockquote|section|p|pre|iframe|img|hr|table|ul|ol|video|source|audio|figure)/i.test(lines[i].trim())
    ) {
      paraLines.push(renderInlineMarkdown(lines[i]));
      i++;
    }
    out.push(`<p>${paraLines.join('<br>')}</p>`);
  }

  return out.join('');
}
