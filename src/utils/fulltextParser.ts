export interface FlexCardItem {
  type: 'explicit' | 'raw';
  params?: string;
  content: string;
  rawFullMatch?: string;
  startIndex: number;
  endIndex: number;
}

export function parseFlexboxContent(flexContent: string): FlexCardItem[] {
  const items: FlexCardItem[] = [];
  const cardRegex = /\[CARD(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END CARD\]/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(flexContent)) !== null) {
    const matchStart = match.index;
    const matchEnd = cardRegex.lastIndex;

    const beforeText = flexContent.substring(lastIndex, matchStart);
    if (beforeText.trim()) {
      const rawBlocks = beforeText.split(/\n\s*\n/);
      let searchOffset = lastIndex;
      for (const block of rawBlocks) {
        const trimmed = block.trim();
        if (trimmed) {
          const bIdx = flexContent.indexOf(trimmed, searchOffset);
          const bStart = bIdx !== -1 ? bIdx : searchOffset;
          const bEnd = bStart + trimmed.length;
          items.push({
            type: 'raw',
            content: trimmed,
            startIndex: bStart,
            endIndex: bEnd,
          });
          searchOffset = bEnd;
        }
      }
    }

    items.push({
      type: 'explicit',
      params: match[1] || '',
      content: match[2],
      rawFullMatch: match[0],
      startIndex: matchStart,
      endIndex: matchEnd,
    });

    lastIndex = matchEnd;
  }

  const remainingText = flexContent.substring(lastIndex);
  if (remainingText.trim()) {
    const rawBlocks = remainingText.split(/\n\s*\n/);
    let searchOffset = lastIndex;
    for (const block of rawBlocks) {
      const trimmed = block.trim();
      if (trimmed) {
        const bIdx = flexContent.indexOf(trimmed, searchOffset);
        const bStart = bIdx !== -1 ? bIdx : searchOffset;
        const bEnd = bStart + trimmed.length;
        items.push({
          type: 'raw',
          content: trimmed,
          startIndex: bStart,
          endIndex: bEnd,
        });
        searchOffset = bEnd;
      }
    }
  }

  return items;
}

export function extractThemeVariantClasses(paramsStr: string): string {
  if (!paramsStr) return '';
  const isAccent2 = /accent2/i.test(paramsStr);
  const isAccent = !isAccent2 && /accent/i.test(paramsStr);
  const isPrimary = /primary/i.test(paramsStr);
  const isSoft = /soft/i.test(paramsStr);
  const isMuted = /muted/i.test(paramsStr);
  const isBg2 = /bg2/i.test(paramsStr);
  const isBrass = /brass/i.test(paramsStr);
  const isCopperGreen = /copper-green|copper_green|coppergreen/i.test(paramsStr);
  const isTitaniumBlue = /titanium-blue|titanium_blue|titaniumblue/i.test(paramsStr);
  const isLinen = /linen/i.test(paramsStr);
  const isDeepOlive = /deep-olive|deep_olive|deepolive/i.test(paramsStr);
  const isGradient = /gradient/i.test(paramsStr);
  const isGlass = /glass/i.test(paramsStr);
  const isOutline = /outline/i.test(paramsStr);
  const isAccentFill = /accent-fill|accent-filled/i.test(paramsStr);
  const isAccent2Fill = /accent2-fill|accent2-filled/i.test(paramsStr);
  const isPrimaryFill = /primary-fill|primary-filled/i.test(paramsStr);

  return [
    isAccentFill ? 'variant-accent-fill' : isAccent ? 'variant-accent' : '',
    isAccent2Fill ? 'variant-accent2-fill' : isAccent2 ? 'variant-accent2' : '',
    isPrimaryFill ? 'variant-primary-fill' : isPrimary ? 'variant-primary' : '',
    isSoft ? 'variant-soft' : '',
    isMuted ? 'variant-muted' : '',
    isBg2 ? 'variant-bg2' : '',
    isBrass ? 'variant-brass' : '',
    isCopperGreen ? 'variant-copper-green' : '',
    isTitaniumBlue ? 'variant-titanium-blue' : '',
    isLinen ? 'variant-linen' : '',
    isDeepOlive ? 'variant-deep-olive' : '',
    isGradient ? 'variant-gradient' : '',
    isGlass ? 'variant-glass' : '',
    isOutline ? 'variant-outline' : '',
  ].filter(Boolean).join(' ');
}

export function parseCssParams(
  paramsStr: string,
  options?: { ignoreStaticColors?: boolean }
): string {
  if (!paramsStr) return '';
  const shouldIgnoreStatic = options?.ignoreStaticColors === true;
  const styles: string[] = [];
  const parts = paramsStr.split(/;|\n/);

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) continue;

    // Direct hex color parameter (e.g. #1e5f8d or #8c4e2a)
    if (/^#[0-9a-fA-F]{3,8}$/.test(part)) {
      if (!shouldIgnoreStatic) {
        styles.push(`background-color: ${part}`);
        const hex = part.replace('#', '');
        const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0, 2), 16);
        const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2, 4), 16);
        const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          styles.push(`color: ${brightness < 140 ? '#ffffff' : '#0f172a'}`);
        }
      }
      continue;
    }

    let k = '', v = '';
    const colonIndex = part.indexOf(':');
    const eqIndex = part.indexOf('=');

    if (colonIndex !== -1 && (eqIndex === -1 || colonIndex < eqIndex)) {
      k = part.substring(0, colonIndex).trim();
      v = part.substring(colonIndex + 1).trim();
    } else if (eqIndex !== -1) {
      k = part.substring(0, eqIndex).trim();
      v = part.substring(eqIndex + 1).trim();
    } else {
      continue;
    }

    // Strip single/double quotes around v
    v = v.replace(/^['"]|['"]$/g, '').trim();
    k = k.replace(/([A-Z])/g, '-$1').toLowerCase();

    if ((k === 'cols' || k === 'columns') && /^\d+$/.test(v)) {
      k = 'grid-template-columns';
      v = `repeat(${v}, minmax(0, 1fr))`;
    }

    // Map common user aliases to standard CSS properties
    if (k === 'bg' || k === 'background' || k === 'bg-color') k = 'background-color';
    if (k === 'text' || k === 'text-color') k = 'color';
    if (k === 'border') k = 'border-color';
    if (k === 'font' || k === 'font-family') {
      k = 'font-family';
      const vLower = v.toLowerCase();
      if (['display', 'sans', 'script', 'mono'].includes(vLower)) {
        v = `var(--font-${vLower})`;
      }
    }
    if (k === 'color') {
      const vLower = v.toLowerCase();
      if (['accent', 'accent2', 'primary', 'text', 'muted'].includes(vLower)) {
        v = `var(--${vLower})`;
      }
    }

    // If shouldIgnoreStatic is active, skip hardcoded background-color/color hex or rgb values so element respects active theme
    if (shouldIgnoreStatic && (k === 'background-color' || k === 'color')) {
      if (
        /^#[0-9a-fA-F]{3,8}$/.test(v) ||
        /^rgb/i.test(v) ||
        /^hsl/i.test(v) ||
        /^(black|white|navy|dark|light|slate|gray|grey|red|green|blue|yellow|purple|brown)$/i.test(v)
      ) {
        continue;
      }
    }

    // Auto contrast when user sets background-color with hex (only if not ignoring static)
    if (k === 'background-color' && /^#[0-9a-fA-F]{3,8}$/.test(v) && !shouldIgnoreStatic) {
      const hex = v.replace('#', '');
      const r = parseInt(hex.length === 3 ? hex[0]+hex[0] : hex.substring(0, 2), 16);
      const g = parseInt(hex.length === 3 ? hex[1]+hex[1] : hex.substring(2, 4), 16);
      const b = parseInt(hex.length === 3 ? hex[2]+hex[2] : hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (!paramsStr.includes('color')) {
          styles.push(`color: ${brightness < 140 ? '#ffffff' : '#0f172a'}`);
        }
      }
    }

    if (k && v) {
      styles.push(`${k}: ${v}`);
    }
  }
  return styles.join('; ');
}

export function renderInlineMarkdownSimple(src: string): string {
  if (!src) return '';
  return src
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--accent, #60a5fa); text-decoration: underline;">$1</a>');
}

export function renderBlockMarkdownSimple(content: string): string {
  if (!content) return '';

  const lines = content.trim().split('\n');
  const result: string[] = [];

  let inUnorderedList = false;
  let inOrderedList = false;
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const pText = currentParagraphLines
        .map(l => renderInlineMarkdownSimple(l))
        .join('<br>');
      result.push(`<p style="margin: 0.5em 0;">${pText}</p>`);
      currentParagraphLines = [];
    }
  };

  const flushLists = () => {
    if (inUnorderedList) {
      result.push('</ul>');
      inUnorderedList = false;
    }
    if (inOrderedList) {
      result.push('</ol>');
      inOrderedList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushLists();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushLists();
      const level = headingMatch[1].length;
      const text = renderInlineMarkdownSimple(headingMatch[2]);
      if (level === 1) {
        result.push(`<h1 style="margin: 0.6em 0 0.3em; font-size: 1.8em; font-weight: 700; color: var(--accent, inherit); line-height: 1.2;">${text}</h1>`);
      } else if (level === 2) {
        result.push(`<h2 style="margin: 0.6em 0 0.3em; font-size: 1.4em; font-weight: 700; color: var(--accent, inherit); line-height: 1.25;">${text}</h2>`);
      } else if (level === 3) {
        result.push(`<h3 style="margin: 0.5em 0 0.3em; font-size: 1.15em; font-weight: 600; color: var(--accent, inherit); line-height: 1.3;">${text}</h3>`);
      } else {
        result.push(`<h4 style="margin: 0.4em 0 0.2em; font-size: 1.0em; font-weight: 600; line-height: 1.3;">${text}</h4>`);
      }
      continue;
    }

    if (/^(---|\*\*\*|___)$/.test(line)) {
      flushParagraph();
      flushLists();
      result.push('<hr style="margin: 1em 0; border: none; border-top: 1px solid var(--card-border, rgba(0,0,0,0.15));" />');
      continue;
    }

    const ulMatch = line.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        result.push('<ul style="margin: 0.5em 0; padding-left: 1.25em; list-style-type: disc;">');
        inUnorderedList = true;
      }
      const itemText = renderInlineMarkdownSimple(ulMatch[1]);
      result.push(`<li style="margin: 0.25em 0;">${itemText}</li>`);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (inUnorderedList) {
        result.push('</ul>');
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        result.push('<ol style="margin: 0.5em 0; padding-left: 1.25em;">');
        inOrderedList = true;
      }
      const itemText = renderInlineMarkdownSimple(olMatch[1]);
      result.push(`<li style="margin: 0.25em 0;">${itemText}</li>`);
      continue;
    }

    flushLists();
    currentParagraphLines.push(rawLine);
  }

  flushParagraph();
  flushLists();

  return result.join('\n');
}

export function parseSingleCardHtml(cardContentRaw: string, defaultParamsStr: string = '', cardIndex?: number): string {
  let params = defaultParamsStr;
  let content = cardContentRaw;

  // Check if card has explicit [CARD | params] wrapper inside
  const cardMatch = cardContentRaw.match(/^\s*\[CARD(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END CARD\]\s*$/i);
  if (cardMatch) {
    params = [params, cardMatch[1]].filter(Boolean).join(';');
    content = cardMatch[2];
  } else {
    // Check if top of card text starts with [CARD | ...]
    const lineMatch = cardContentRaw.match(/^\s*\[CARD(?:\s*\|\s*([^\]]*))?\]\n?([\s\S]*)$/i);
    if (lineMatch) {
      params = [params, lineMatch[1]].filter(Boolean).join(';');
      content = lineMatch[2].replace(/\[END CARD\]/gi, '');
    }
  }

  const css = parseCssParams(params || '', { ignoreStaticColors: true });

  // Detect animation & hover options
  const isScale = /scale/i.test(params);
  const isGlow = /glow/i.test(params);
  const isPulse = /pulse/i.test(params);
  const noLift = /no-lift|static/i.test(params);

  const variantClasses = extractThemeVariantClasses(params);

  const classes = [
    'fulltext-card',
    'theme-card',
    !noLift && !isScale ? 'hover-lift' : '',
    isScale ? 'hover-scale' : '',
    isGlow ? 'hover-glow' : '',
    isPulse ? 'animate-pulse-subtle' : '',
    variantClasses,
  ].filter(Boolean).join(' ');

  const inner = renderBlockMarkdownSimple(content);

  const dataIndexAttr = cardIndex !== undefined
    ? `data-element-type="card" data-element-index="${cardIndex}" data-card-index="${cardIndex}"`
    : '';

  return `<div class="${classes}" ${dataIndexAttr} style="flex: 1 1 240px; min-width: 200px; ${css}">${inner}</div>`;
}

export function renderFlexOrGridContent(content: string): string {
  if (!content) return '';

  const blockRegex = /\[(CARD|SECTION|BOX|WNOTE|QUOTE)(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END \1\]/gi;
  const itemsHtml: string[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null) {
    const before = content.substring(lastIdx, match.index).trim();
    if (before) {
      const lines = before.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          let rendered = renderBlockMarkdownSimple(trimmed);
          if (/^<p[^>]*>(\s*<img[^>]*>\s*)<\/p>$/i.test(rendered)) {
            rendered = rendered.replace(/^<p[^>]*>(\s*<img[^>]*>\s*)<\/p>$/i, '$1').trim();
          }
          itemsHtml.push(`<div class="fulltext-grid-item" style="width: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center;">${rendered}</div>`);
        }
      }
    }

    const fullMatchedBlock = match[0];
    const renderedBlock = preprocessFulltextElements(fullMatchedBlock);
    itemsHtml.push(`<div class="fulltext-grid-item" style="width: 100%; box-sizing: border-box;">${renderedBlock}</div>`);
    lastIdx = blockRegex.lastIndex;
  }

  const remaining = content.substring(lastIdx).trim();
  if (remaining) {
    const lines = remaining.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        let rendered = renderBlockMarkdownSimple(trimmed);
        if (/^<p[^>]*>(\s*<img[^>]*>\s*)<\/p>$/i.test(rendered)) {
          rendered = rendered.replace(/^<p[^>]*>(\s*<img[^>]*>\s*)<\/p>$/i, '$1').trim();
        }
        itemsHtml.push(`<div class="fulltext-grid-item" style="width: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center;">${rendered}</div>`);
      }
    }
  }

  return itemsHtml.join('\n');
}

export function preprocessFulltextElements(text: string): string {
  if (!text) return '';

  let out = text;
  let cardIndexCounter = 0;
  let sectionIndexCounter = 0;
  let boxIndexCounter = 0;
  let wnoteIndexCounter = 0;
  let quoteIndexCounter = 0;
  let commentIndexCounter = 0;
  let imagequoteIndexCounter = 0;
  let fancyIndexCounter = 0;
  let gridIndexCounter = 0;
  let flexIndexCounter = 0;

  // 1. YOUTUBE Embeds: ![YOUTUBE src=https://www.youtube.com/embed/ID]Title[END YOUTUBE]
  out = out.replace(/!\[YOUTUBE\s+src=([^\s\]]+)\]([^\[]*)\[END YOUTUBE\]/gi, (_, src, title) => {
    return `<div class="fulltext-youtube" style="aspect-ratio: 16/9; width: 100%; max-width: 680px; margin: 1.5em auto; overflow: hidden; border-radius: var(--radius, 12px); box-shadow: 0 4px 16px rgba(0,0,0,0.2);"><iframe src="${src}" title="${title || 'YouTube Video'}" style="width: 100%; height: 100%; border: none;" allowfullscreen></iframe></div>`;
  });

  // 1b. HTML5 Video Embeds: ![VIDEO src=...]Title[END VIDEO] or [VIDEO src=...]
  out = out.replace(/!\[VIDEO\s+src=([^\s\]]+)(?:\s+poster=([^\s\]]+))?\]([^\[]*)\[END VIDEO\]/gi, (_, src, poster, title) => {
    return `<div class="fulltext-video" style="width: 100%; margin: 1.25em auto; overflow: hidden; border-radius: var(--radius, 12px); border: 1px solid var(--card-border, #334155); background: #020617; padding: 8px;"><video controls src="${src}" ${poster ? `poster="${poster}"` : ''} style="width: 100%; max-height: 440px; border-radius: 8px; background: #000;"></video>${title ? `<div style="margin-top: 6px; font-size: 0.85em; color: var(--accent, #60a5fa); font-weight: 600;">${title}</div>` : ''}</div>`;
  });

  // 2. Custom Styled Pipe Images: ![AltText|styles](url)
  out = out.replace(/!\[([^\]|]+)\|([^\]]+)\]\(([^)\s]+)\)/g, (_, alt, styles, url) => {
    const css = parseCssParams(styles);
    return `<img alt="${alt}" src="${url}" data-img-src="${url}" data-img-alt="${alt}" data-img-styles="${styles}" class="interactive-md-img cursor-pointer hover:ring-2 hover:ring-amber-400/80 transition-all" style="max-width: 100%; box-sizing: border-box; ${css}" />`;
  });

  // 3. Page Break [pb]
  out = out.replace(/\[pb\]/gi, `<div class="fulltext-pagebreak" style="display: flex; align-items: center; justify-content: center; margin: 2em 0; opacity: 0.6;"><hr style="flex: 1; border: none; border-top: 1px dashed currentColor;" /><span style="padding: 0 12px; font-size: 0.75em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Page Break</span><hr style="flex: 1; border: none; border-top: 1px dashed currentColor;" /></div>`);

  // 4. FANCY / FANCY-GRAD / FANCY-IMG ... [END FANCY]
  out = out.replace(/\[FANCY(?:-[A-Z]+)?(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END FANCY(?:-[A-Z]+)?\]/gi, (_, params, content) => {
    const rawParams = params || '';
    const css = parseCssParams(rawParams);
    const variantClasses = extractThemeVariantClasses(rawParams);
    const classes = ['fulltext-fancy', variantClasses].filter(Boolean).join(' ');
    const innerHtml = renderBlockMarkdownSimple(content);
    const currentIdx = fancyIndexCounter++;
    return `<div class="${classes}" data-element-type="fancy" data-element-index="${currentIdx}" style="margin: 1.25em 0; font-weight: 700; line-height: 1.3; color: var(--accent); ${css}">${innerHtml}</div>`;
  });

  // 5. SECTION ... [END SECTION]
  out = out.replace(/\[SECTION(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END SECTION\]/gi, (_, params, content) => {
    const rawParams = params || '';
    const css = parseCssParams(rawParams);
    const variantClasses = extractThemeVariantClasses(rawParams);
    const classes = ['fulltext-section', 'theme-card', variantClasses].filter(Boolean).join(' ');

    const innerHtml = renderBlockMarkdownSimple(content);

    const currentIdx = sectionIndexCounter++;
    return `<div class="${classes}" data-element-type="section" data-element-index="${currentIdx}" style="margin: 1.25em 0; max-width: 100%; box-sizing: border-box; overflow-wrap: break-word; ${css}">${innerHtml}</div>`;
  });

  // 6. BOX / CONTAINER / HERO / BANNER / TILE ... [END BOX|CONTAINER|HERO|BANNER|TILE]
  out = out.replace(/\[(?:BOX|CONTAINER|HERO|BANNER|TILE)(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END (?:BOX|CONTAINER|HERO|BANNER|TILE)\]/gi, (_, params, content) => {
    const rawParams = params || '';
    const css = parseCssParams(rawParams);
    const variantClasses = extractThemeVariantClasses(rawParams);
    const classes = ['fulltext-box', 'theme-card', variantClasses].filter(Boolean).join(' ');

    const innerHtml = renderBlockMarkdownSimple(content);

    const currentIdx = boxIndexCounter++;
    return `<div class="${classes}" data-element-type="box" data-element-index="${currentIdx}" style="margin: 1.25em 0; max-width: 100%; box-sizing: border-box; overflow-wrap: break-word; ${css}">${innerHtml}</div>`;
  });

  // 7. FLEXBOX-CARDS ... [END FLEXBOX] / [END FLEXBOX-CARDS]
  out = out.replace(/\[FLEXBOX-CARDS(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END FLEXBOX(?:-CARDS)?\]/gi, (_, params, content) => {
    const containerCss = parseCssParams(params || '');
    const items = parseFlexboxContent(content);
    const cardHtmlList = items.map(item => {
      const cardParams = item.type === 'explicit' ? item.params || '' : params || '';
      const html = parseSingleCardHtml(item.content, cardParams, cardIndexCounter);
      cardIndexCounter++;
      return html;
    });

    return `<div class="fulltext-flexbox-cards" style="display: flex; flex-wrap: wrap; gap: 16px; margin: 1.5em 0; width: 100%; ${containerCss}">${cardHtmlList.join('\n')}</div>`;
  });

  // 8. Standalone [CARD ... ] ... [END CARD]
  out = out.replace(/\[CARD(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END CARD\]/gi, (_, params, content) => {
    const html = parseSingleCardHtml(content, params || '', cardIndexCounter);
    cardIndexCounter++;
    return html;
  });

  // 9. FLEXBOX / FLEXBOX-GRID / FLEXBOX-ROW / FLEXBOX-GALLERY / GRID / ROW ... [END FLEXBOX/GRID/ROW]
  out = out.replace(/\[(?:FLEXBOX|GRID|ROW)(?:-[A-Z0-9]+)?(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END (?:FLEXBOX|GRID|ROW)(?:-[A-Z0-9]+)?\]/gi, (fullMatch, params, content) => {
    const rawParams = params || '';
    const css = parseCssParams(rawParams);
    const tagUpper = fullMatch.toUpperCase();
    const isGrid = /GRID|GALLERY/i.test(tagUpper) || /grid/i.test(rawParams);

    const innerHtml = renderFlexOrGridContent(content);

    const hasExplicitGridCols = /grid-template-columns/i.test(css);
    let defaultGridStyle = '';
    if (isGrid && !hasExplicitGridCols) {
      defaultGridStyle = 'grid-template-columns: repeat(3, minmax(0, 1fr));';
    }

    const containerStyle = isGrid
      ? `display: grid; ${defaultGridStyle} gap: 16px; justify-items: center; align-items: start; margin: 1.5em 0; width: 100%; ${css}`
      : `display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: center; margin: 1.5em 0; width: 100%; ${css}`;

    const elementType = isGrid ? 'grid' : 'flexbox';
    const currentIdx = isGrid ? gridIndexCounter++ : flexIndexCounter++;

    return `<div class="fulltext-${elementType}" data-element-type="${elementType}" data-element-index="${currentIdx}" style="${containerStyle}">${innerHtml}</div>`;
  });

  // 10. QUOTE / BLOCKQUOTE ... [END QUOTE|BLOCKQUOTE]
  out = out.replace(/\[(?:QUOTE|BLOCKQUOTE)(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END (?:QUOTE|BLOCKQUOTE)\]/gi, (_, params, content) => {
    const rawParams = params || '';
    let cited = '';
    const match = rawParams.match(/Cited=['"]?([^'"]+)['"]?/i) || rawParams.match(/author=['"]?([^'"]+)['"]?/i);
    if (match) cited = match[1];

    const css = parseCssParams(rawParams);
    const variantClasses = extractThemeVariantClasses(rawParams);
    const classes = ['fulltext-quote', variantClasses].filter(Boolean).join(' ');
    const innerHtml = renderBlockMarkdownSimple(content);
    const currentIdx = quoteIndexCounter++;
    return `<blockquote class="${classes}" data-element-type="quote" data-element-index="${currentIdx}" style="border-left: 4px solid var(--accent, #d4af37); padding: 12px 18px; margin: 1.25em 0; background: color-mix(in srgb, var(--accent) 10%, var(--card-bg)); color: var(--text); border-radius: 0 8px 8px 0; font-style: italic; ${css}"><div>${innerHtml}</div>${cited ? `<cite style="display: block; text-align: right; font-style: normal; font-weight: 600; font-size: 0.85em; opacity: 0.85; margin-top: 8px;">— ${cited}</cite>` : ''}</blockquote>`;
  });

  // 11. WNOTE / NOTE / CALLOUT / INFO / WARNING / ALERT ... [END ...]
  out = out.replace(/\[(?:WNOTE|NOTE|CALLOUT|INFO|WARNING|ALERT)(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END (?:WNOTE|NOTE|CALLOUT|INFO|WARNING|ALERT)\]/gi, (_, params, content) => {
    const rawParams = params || '';
    let cited = '';
    const match = rawParams.match(/Cited=['"]?([^'"]+)['"]?/i) || rawParams.match(/author=['"]?([^'"]+)['"]?/i);
    if (match) cited = match[1];

    const css = parseCssParams(rawParams);
    const variantClasses = extractThemeVariantClasses(rawParams);
    const classes = ['fulltext-wnote', 'theme-card', variantClasses].filter(Boolean).join(' ');
    const innerHtml = renderBlockMarkdownSimple(content);
    const currentIdx = wnoteIndexCounter++;
    return `<div class="${classes}" data-element-type="wnote" data-element-index="${currentIdx}" style="border: 1px solid var(--accent2, #22c55e); background: color-mix(in srgb, var(--accent2) 12%, var(--card-bg)); color: var(--text); padding: 16px; border-radius: 12px; margin: 1.25em 0; ${css}"><strong style="color: var(--accent2); display: block; margin-bottom: 6px; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.05em;">Note</strong><div>${innerHtml}</div>${cited ? `<div style="text-align: right; font-size: 0.85em; margin-top: 8px; opacity: 0.8;">— ${cited}</div>` : ''}</div>`;
  });

  // 12. COMMENT ... [END COMMENT]
  out = out.replace(/\[COMMENT(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END COMMENT\]/gi, (_, params, content) => {
    const rawParams = params || '';
    const css = parseCssParams(rawParams);
    let author = '';
    const match = rawParams.match(/author=['"]?([^'"]+)['"]?/i);
    if (match) author = match[1];

    const innerHtml = renderBlockMarkdownSimple(content);
    const currentIdx = commentIndexCounter++;
    return `<div class="fulltext-comment theme-card variant-muted" data-element-type="comment" data-element-index="${currentIdx}" style="border: 1px dashed var(--card-border); padding: 12px 16px; border-radius: 8px; margin: 1.25em 0; font-size: 0.9em; ${css}">${author ? `<div style="font-weight: 600; font-size: 0.8em; opacity: 0.75; margin-bottom: 4px;">Comment by ${author}</div>` : ''}<div>${innerHtml}</div></div>`;
  });

  // 13. IMAGEQUOTE ... [END IMAGEQUOTE]
  out = out.replace(/\[IMAGEQUOTE(?:\s+([^\]]*))?\]([\s\S]*?)\[END IMAGEQUOTE\]/gi, (_, params, content) => {
    const rawParams = params || '';
    const css = parseCssParams(rawParams);
    const innerHtml = renderBlockMarkdownSimple(content);
    const currentIdx = imagequoteIndexCounter++;
    return `<div class="fulltext-imagequote theme-card variant-glass" data-element-type="imagequote" data-element-index="${currentIdx}" style="padding: 24px; border-radius: 12px; margin: 1.5em 0; background-size: cover; background-position: center; ${css}"><div>${innerHtml}</div></div>`;
  });

  // 14. OVERLAY / IMAGE-OVERLAY ... [END OVERLAY]
  out = out.replace(/\[(?:OVERLAY|IMAGE-OVERLAY)(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END (?:OVERLAY|IMAGE-OVERLAY)\]/gi, (_, params, content) => {
    const rawParams = params || '';
    const css = parseCssParams(rawParams);

    let imgUrl = '';
    let altText = '';
    const imgMatch = content.match(/!\[([^\]]*)\]\(([^)\s]+)\)/);
    if (imgMatch) {
      altText = imgMatch[1];
      imgUrl = imgMatch[2];
    }

    let cleanContent = content.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/, '').trim();
    if (cleanContent.startsWith('</span>')) {
      cleanContent = cleanContent.replace(/^<\/span>\s*/i, '');
    }
    const innerHtml = renderBlockMarkdownSimple(cleanContent);

    const hasExplicitColor = /color\s*:/i.test(css);
    const textColorStyle = hasExplicitColor ? '' : 'color: #ffffff;';

    return `<div class="fulltext-overlay" style="position: relative; overflow: hidden; border-radius: var(--radius, 12px); margin: 1.25em 0; border: 1px solid var(--card-border, rgba(255,255,255,0.15)); min-height: 240px; ${css}">
      ${imgUrl ? `<img src="${imgUrl}" alt="${altText}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; z-index: 1;" />` : ''}
      <div style="position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 60%, transparent 100%); ${textColorStyle} text-shadow: 0 2px 8px rgba(0,0,0,0.8); ${css}">
        ${innerHtml}
      </div>
    </div>`;
  });

  return out;
}

function updateCardParamsStr(oldParamsStr: string, newColorOption: { variant?: string; bg?: string }): string {
  const paramParts = oldParamsStr
    .split(/[;,]/)
    .map(p => p.trim())
    .filter(Boolean);

  const filteredParts = paramParts.filter(part => {
    const lower = part.toLowerCase();
    if (lower.startsWith('variant=')) return false;
    if (lower.startsWith('bg:') || lower.startsWith('bg=') || lower.startsWith('background:')) return false;
    if (/^#[0-9a-fA-F]{3,8}$/.test(lower)) return false;
    if (
      [
        'accent',
        'accent2',
        'primary',
        'soft',
        'muted',
        'bg2',
        'brass',
        'copper-green',
        'titanium-blue',
        'linen',
        'deep-olive',
        'gradient',
        'glass',
        'outline',
        'accent-fill',
        'accent2-fill',
        'primary-fill',
      ].includes(lower)
    ) {
      return false;
    }
    return true;
  });

  if (newColorOption.variant) {
    filteredParts.unshift(`variant=${newColorOption.variant}`);
  } else if (newColorOption.bg) {
    filteredParts.unshift(`bg: ${newColorOption.bg}`);
  }

  return filteredParts.join('; ');
}

export function updateCardColorInMarkdown(
  markdownText: string,
  cardIndex: number,
  newColorOption: { variant?: string; bg?: string },
  elementType: string = 'card'
): string {
  if (!markdownText) return markdownText;

  // Handle generic element types like section, box, wnote, quote, fancy, etc.
  if (elementType !== 'card') {
    let regex: RegExp;
    let tagPrefix = elementType.toUpperCase();

    switch (elementType) {
      case 'section':
        regex = /\[SECTION(?:\s*\|\s*([^\]]*))?\]/gi;
        tagPrefix = 'SECTION';
        break;
      case 'box':
        regex = /\[(?:BOX|CONTAINER|HERO|BANNER|TILE)(?:\s*\|\s*([^\]]*))?\]/gi;
        tagPrefix = 'SECTION'; // Default prefix or maintain whatever tag was matched
        break;
      case 'wnote':
        regex = /\[(?:WNOTE|NOTE|CALLOUT|INFO|WARNING|ALERT)(?:\s*\|\s*([^\]]*))?\]/gi;
        tagPrefix = 'WNOTE';
        break;
      case 'quote':
        regex = /\[(?:QUOTE|BLOCKQUOTE)(?:\s*\|\s*([^\]]*))?\]/gi;
        tagPrefix = 'QUOTE';
        break;
      case 'fancy':
        regex = /\[FANCY(?:-[A-Z]+)?(?:\s*\|\s*([^\]]*))?\]/gi;
        tagPrefix = 'FANCY';
        break;
      case 'comment':
        regex = /\[COMMENT(?:\s*\|\s*([^\]]*))?\]/gi;
        tagPrefix = 'COMMENT';
        break;
      case 'imagequote':
        regex = /\[IMAGEQUOTE(?:\s+([^\]]*))?\]/gi;
        tagPrefix = 'IMAGEQUOTE';
        break;
      case 'grid':
      case 'flexbox':
        regex = /\[(?:FLEXBOX|GRID|ROW)(?:-[A-Z0-9]+)?(?:\s*\|\s*([^\]]*))?\]/gi;
        tagPrefix = 'GRID';
        break;
      default:
        regex = new RegExp(`\\[${elementType}(?:\\s*\\|\\s*([^\\]]*))?\\]`, 'gi');
        break;
    }

    const matches = Array.from(markdownText.matchAll(regex));
    if (matches.length > 0 && cardIndex >= 0 && cardIndex < matches.length) {
      const targetMatch = matches[cardIndex];
      const matchIndex = targetMatch.index;
      if (matchIndex !== undefined) {
        const fullTag = targetMatch[0];
        // Extract actual tag name matched (e.g. SECTION, BOX, HERO, etc.)
        const actualTagName = fullTag.match(/^\[([A-Z0-9_-]+)/i)?.[1] || tagPrefix;
        const oldParamsStr = targetMatch[1] || '';
        const newParamsStr = updateCardParamsStr(oldParamsStr, newColorOption);
        const newTag = `[${actualTagName} | ${newParamsStr}]`;

        return (
          markdownText.substring(0, matchIndex) +
          newTag +
          markdownText.substring(matchIndex + fullTag.length)
        );
      }
    }
    return markdownText;
  }

  // Default: elementType === 'card'
  // 1. Check if cardIndex falls inside a [FLEXBOX-CARDS] block
  const flexboxRegex = /\[FLEXBOX-CARDS(?:\s*\|\s*([^\]]*))?\]([\s\S]*?)\[END FLEXBOX(?:-CARDS)?\]/gi;
  const flexMatches = Array.from(markdownText.matchAll(flexboxRegex));

  let currentCardIndexOffset = 0;

  for (const flexMatch of flexMatches) {
    const flexFullMatch = flexMatch[0];
    const flexStartTag = flexMatch[0].match(/^\[FLEXBOX-CARDS[^\]]*\]/i)?.[0] || '[FLEXBOX-CARDS]';
    const flexEndTag = flexMatch[0].match(/\[END FLEXBOX(?:-CARDS)?\]$/i)?.[0] || '[END FLEXBOX]';
    const flexContent = flexMatch[2];
    const flexMatchIndex = flexMatch.index;

    if (flexMatchIndex === undefined) continue;

    const items = parseFlexboxContent(flexContent);
    const flexCardCount = items.length;

    if (cardIndex >= currentCardIndexOffset && cardIndex < currentCardIndexOffset + flexCardCount) {
      const targetLocalIdx = cardIndex - currentCardIndexOffset;
      const targetItem = items[targetLocalIdx];

      let newFlexContent = flexContent;

      if (targetItem.type === 'explicit') {
        const newParams = updateCardParamsStr(targetItem.params || '', newColorOption);
        const newTag = `[CARD | ${newParams}]`;
        const updatedExplicitCard = flexContent
          .substring(targetItem.startIndex, targetItem.endIndex)
          .replace(/^\[CARD(?:\s*\|\s*([^\]]*))?\]/i, newTag);

        newFlexContent =
          flexContent.substring(0, targetItem.startIndex) +
          updatedExplicitCard +
          flexContent.substring(targetItem.endIndex);
      } else {
        const newParamStr = newColorOption.variant
          ? `variant=${newColorOption.variant}`
          : `bg: ${newColorOption.bg}`;
        const newCardBlock = `[CARD | ${newParamStr}]\n${targetItem.content}\n[END CARD]`;

        newFlexContent =
          flexContent.substring(0, targetItem.startIndex) +
          newCardBlock +
          flexContent.substring(targetItem.endIndex);
      }

      return (
        markdownText.substring(0, flexMatchIndex) +
        flexStartTag +
        newFlexContent +
        flexEndTag +
        markdownText.substring(flexMatchIndex + flexFullMatch.length)
      );
    }

    currentCardIndexOffset += flexCardCount;
  }

  // 2. If cardIndex is outside [FLEXBOX-CARDS], check standalone [CARD ...] tags
  const standaloneCardIndex = cardIndex - currentCardIndexOffset;
  const standaloneRegex = /\[CARD(?:\s*\|\s*([^\]]*))?\]/gi;
  const standaloneMatches = Array.from(markdownText.matchAll(standaloneRegex));

  if (standaloneMatches.length > 0 && standaloneCardIndex >= 0 && standaloneCardIndex < standaloneMatches.length) {
    const targetMatch = standaloneMatches[standaloneCardIndex];
    const matchIndex = targetMatch.index;
    if (matchIndex !== undefined) {
      const fullTag = targetMatch[0];
      const oldParamsStr = targetMatch[1] || '';
      const newParamsStr = updateCardParamsStr(oldParamsStr, newColorOption);
      const newTag = `[CARD | ${newParamsStr}]`;

      return (
        markdownText.substring(0, matchIndex) +
        newTag +
        markdownText.substring(matchIndex + fullTag.length)
      );
    }
  }

  return markdownText;
}

