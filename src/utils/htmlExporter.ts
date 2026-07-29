import { SlotData, Theme, NodeItem } from '../types';
import { renderMarkdownToHtml } from './markdown';

export interface HtmlExportOptions {
  pageTitle?: string;
  pageBgImage?: string;
  pageBgOverlay?: number;
  pageBgFit?: 'cover' | 'contain' | 'repeat';
}

function buildLayoutBodyHtml(slots: SlotData[], nodes: NodeItem[]): string {
  const nodeMap = new Map<string, NodeItem>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  let bodyHtml = '';

  slots.forEach((slot, sIdx) => {
    if (slot.grids.length === 0) return;

    const slotBgStyle = slot.bgImage
      ? `background-image: url('${slot.bgImage}'); background-size: ${slot.bgFit || 'cover'}; background-position: center; background-repeat: ${slot.bgFit === 'repeat' ? 'repeat' : 'no-repeat'}; position: relative; border-radius: 24px; padding: 24px; overflow: hidden;`
      : '';

    bodyHtml += `  <!-- Slot ${sIdx + 1}: ${slot.title} -->\n`;
    bodyHtml += `  <section class="slot-wrap" style="${slotBgStyle}">\n`;
    if (slot.bgImage) {
      bodyHtml += `    <div className="bg-overlay" style="position: absolute; inset: 0; background-color: #000; opacity: ${slot.bgOverlay ?? 0.25}; pointer-events: none; z-index: 0; border-radius: 24px;"></div>\n`;
      bodyHtml += `    <div style="position: relative; z-index: 1;">\n`;
    }

    slot.grids.forEach((grid) => {
      const filledCells = grid.cells.filter((c) => !!c.nodeId || !!c.customMarkdown?.trim());
      if (filledCells.length === 0) return;

      const numCols = grid.cols || grid.size || 1;

      const gridBgStyle = grid.bgImage
        ? `background-image: url('${grid.bgImage}'); background-size: ${grid.bgFit || 'cover'}; background-position: center; background-repeat: ${grid.bgFit === 'repeat' ? 'repeat' : 'no-repeat'}; position: relative; border-radius: 20px; padding: 20px; overflow: hidden;`
        : '';

      bodyHtml += `    <div class="grid-block" style="${gridBgStyle}">\n`;
      if (grid.bgImage) {
        bodyHtml += `      <div class="bg-overlay" style="position: absolute; inset: 0; background-color: #000; opacity: ${grid.bgOverlay ?? 0.25}; pointer-events: none; z-index: 0; border-radius: 20px;"></div>\n`;
        bodyHtml += `      <div style="position: relative; z-index: 1;">\n`;
      }

      bodyHtml += `      <div class="grid" style="grid-template-columns: repeat(${numCols}, 1fr);">\n`;

      grid.cells.forEach((cell) => {
        const hasContent = !!cell.nodeId || !!cell.customMarkdown?.trim();
        if (!hasContent) {
          bodyHtml += `        <div class="cell-empty"></div>\n`;
          return;
        }

        const node = cell.nodeId ? nodeMap.get(cell.nodeId) : undefined;
        const markdown = cell.customMarkdown || node?.info || '';
        const renderedMd = renderMarkdownToHtml(markdown);

        const alignStyle = cell.align ? `text-align: ${cell.align};` : '';
        const fontStyle = cell.font
          ? `font-family: var(--font-${cell.font});`
          : '';
        const colorStyle = cell.color ? `color: var(${cell.color});` : '';

        const styleAttr = [alignStyle, fontStyle, colorStyle]
          .filter(Boolean)
          .join(' ');

        const isSeamless = cell.transparentBg || grid.transparentBg || slot.transparentBg;
        const cellClass = isSeamless ? 'cell seamless' : 'cell';

        const cellBgStyle = cell.bgImage
          ? `background-image: url('${cell.bgImage}'); background-size: ${cell.bgFit || 'cover'}; background-position: center; background-repeat: ${cell.bgFit === 'repeat' ? 'repeat' : 'no-repeat'}; position: relative; overflow: hidden;`
          : '';

        bodyHtml += `        <div class="${cellClass}" style="${cellBgStyle}">\n`;
        if (cell.bgImage) {
          bodyHtml += `          <div class="bg-overlay" style="position: absolute; inset: 0; background-color: #000; opacity: ${cell.bgOverlay ?? 0.25}; pointer-events: none; z-index: 0;"></div>\n`;
        }
        bodyHtml += `          <div class="cell-content" style="${styleAttr} position: relative; z-index: 1;">\n`;
        bodyHtml += `            <div class="md">${renderedMd}</div>\n`;
        bodyHtml += `          </div>\n`;
        bodyHtml += `        </div>\n`;
      });

      bodyHtml += `      </div>\n`;
      if (grid.bgImage) {
        bodyHtml += `      </div>\n`;
      }
      bodyHtml += `    </div>\n`;
    });

    if (slot.bgImage) {
      bodyHtml += `    </div>\n`;
    }
    bodyHtml += `  </section>\n\n`;
  });

  return bodyHtml;
}

export function generateStandaloneHtml(
  slots: SlotData[],
  nodes: NodeItem[],
  activeTheme: Theme,
  pageTitleOrOptions: string | HtmlExportOptions = 'My Grid Page'
): string {
  const options: HtmlExportOptions =
    typeof pageTitleOrOptions === 'string'
      ? { pageTitle: pageTitleOrOptions }
      : pageTitleOrOptions;

  const pageTitle = options.pageTitle || 'My Grid Page';
  const { pageBgImage, pageBgOverlay = 0.25, pageBgFit = 'cover' } = options;

  const fontImport = activeTheme.vars['--font-import']
    ? `<link rel="stylesheet" href="${activeTheme.vars['--font-import']}">`
    : '';

  const varsCss = Object.entries(activeTheme.vars)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join('\n');

  const bodyHtml = buildLayoutBodyHtml(slots, nodes);

  const pageBgStyle = pageBgImage
    ? `background-image: url('${pageBgImage}'); background-size: ${pageBgFit}; background-position: center; background-repeat: ${pageBgFit === 'repeat' ? 'repeat' : 'no-repeat'}; position: relative; min-height: 100vh;`
    : '';

  return `<!DOCTYPE html>
<html lang="en" data-mode="view">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  ${fontImport}
  <style>
  :root {
${varsCss}
  }

  * { box-sizing: border-box; }
  
  body {
    margin: 0;
    padding: clamp(24px, 5vw, 64px) 16px;
    font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
    color: var(--text);
    background: radial-gradient(circle at top, color-mix(in srgb, var(--accent) 12%, transparent), transparent 50%),
                linear-gradient(160deg, var(--bg1), var(--bg2));
    min-height: 100vh;
    ${pageBgStyle}
  }

  .container {
    max-width: 1120px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .page-overlay {
    position: fixed;
    inset: 0;
    background-color: #000;
    opacity: ${pageBgOverlay};
    pointer-events: none;
    z-index: 0;
  }

  .slot-wrap {
    margin-bottom: clamp(20px, 4vw, 44px);
  }

  .grid-block {
    margin-bottom: 20px;
  }

  .grid {
    display: grid;
    gap: clamp(14px, 2vw, 24px);
  }

  .cell {
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--card-border, #e2e8f0);
    border-radius: var(--radius, 16px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.06);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .cell.seamless,
  .cell.seamless .theme-card:not([class*="variant-"]):not([style*="background-color"]) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .cell:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.1);
  }

  .cell-content {
    padding: clamp(20px, 3vw, 36px);
  }

  .md {
    font-size: 16px;
    line-height: 1.65;
    color: var(--muted);
  }

  .md h1, .md h2, .md h3, .md h4 {
    margin: 0 0 12px;
    color: var(--text);
    line-height: 1.25;
    font-family: var(--font-display, inherit);
  }

  .md h1 { font-size: clamp(28px, 4vw, 48px); }
  .md h2 { font-size: clamp(22px, 3vw, 32px); }
  .md h3 { font-size: clamp(18px, 2vw, 24px); }

  .md p { margin: 0 0 12px; }
  .md ul, .md ol { margin: 0 0 16px; padding-left: 1.2em; }
  .md li { margin: 4px 0; }
  .md a { color: var(--accent); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
  .md img { display: block; width: 100%; max-width: 100%; height: auto; border-radius: calc(var(--radius, 16px) - 4px); margin: 12px 0; }
  .md blockquote { margin: 16px 0; padding: 10px 18px; border-left: 4px solid var(--accent2); color: var(--muted); background: color-mix(in srgb, var(--accent) 5%, transparent); border-radius: 0 8px 8px 0; }
  .md code { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--text); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono, monospace); font-size: 14px; }

  @media (max-width: 640px) {
    body { padding: 16px 12px; }
    .grid { grid-template-columns: 1fr !important; }
    .cell-content { padding: 20px 16px; }
  }
  </style>
</head>
<body>
  ${pageBgImage ? `<div class="page-overlay"></div>` : ''}
  <main class="container">
${bodyHtml}
  </main>
</body>
</html>`;
}

/**
 * Renders the composed layout as a self-contained HTML fragment (not a full
 * document) suitable for a graph node's `info` field — the app's own
 * markdown renderer passes a well-formed `<div>` block through untouched.
 *
 * Selectors are scoped under `.gridbuilder-html-node` and theme vars are set
 * as inline custom properties on the wrapper (not a global `:root{}`) so
 * this can't leak into, or be overridden by, whatever theme is live in the
 * page it's later viewed in.
 *
 * Known limitation: page-level background (pageBgImage/Overlay/Fit) is not
 * part of SlotData, so it is not captured here — only slot/grid/cell-level
 * backgrounds are.
 */
export function generateLayoutFragment(
  slots: SlotData[],
  nodes: NodeItem[],
  activeTheme: Theme
): string {
  const bodyHtml = buildLayoutBodyHtml(slots, nodes);

  const themeVarsStyle = Object.entries(activeTheme.vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');

  const fontImportCss = activeTheme.vars['--font-import']
    ? `@import url('${activeTheme.vars['--font-import']}');`
    : '';

  return `<div class="gridbuilder-html-node" style="${themeVarsStyle} font-family: var(--font-sans, system-ui, -apple-system, sans-serif); color: var(--text);">
  <style>
  ${fontImportCss}
  .gridbuilder-html-node, .gridbuilder-html-node * { box-sizing: border-box; }

  .gridbuilder-html-node .slot-wrap {
    margin-bottom: clamp(20px, 4vw, 44px);
  }

  .gridbuilder-html-node .grid-block {
    margin-bottom: 20px;
  }

  .gridbuilder-html-node .grid {
    display: grid;
    gap: clamp(14px, 2vw, 24px);
  }

  .gridbuilder-html-node .cell {
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--card-border, #e2e8f0);
    border-radius: var(--radius, 16px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.06);
    overflow: hidden;
  }

  .gridbuilder-html-node .cell.seamless,
  .gridbuilder-html-node .cell.seamless .theme-card:not([class*="variant-"]):not([style*="background-color"]) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .gridbuilder-html-node .cell-content {
    padding: clamp(20px, 3vw, 36px);
  }

  .gridbuilder-html-node .md {
    font-size: 16px;
    line-height: 1.65;
    color: var(--muted);
  }

  .gridbuilder-html-node .md h1, .gridbuilder-html-node .md h2, .gridbuilder-html-node .md h3, .gridbuilder-html-node .md h4 {
    margin: 0 0 12px;
    color: var(--text);
    line-height: 1.25;
    font-family: var(--font-display, inherit);
  }

  .gridbuilder-html-node .md h1 { font-size: clamp(28px, 4vw, 48px); }
  .gridbuilder-html-node .md h2 { font-size: clamp(22px, 3vw, 32px); }
  .gridbuilder-html-node .md h3 { font-size: clamp(18px, 2vw, 24px); }

  .gridbuilder-html-node .md p { margin: 0 0 12px; }
  .gridbuilder-html-node .md ul, .gridbuilder-html-node .md ol { margin: 0 0 16px; padding-left: 1.2em; }
  .gridbuilder-html-node .md li { margin: 4px 0; }
  .gridbuilder-html-node .md a { color: var(--accent); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
  .gridbuilder-html-node .md img { display: block; width: 100%; max-width: 100%; height: auto; border-radius: calc(var(--radius, 16px) - 4px); margin: 12px 0; }
  .gridbuilder-html-node .md blockquote { margin: 16px 0; padding: 10px 18px; border-left: 4px solid var(--accent2); color: var(--muted); background: color-mix(in srgb, var(--accent) 5%, transparent); border-radius: 0 8px 8px 0; }
  .gridbuilder-html-node .md code { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--text); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono, monospace); font-size: 14px; }

  @media (max-width: 640px) {
    .gridbuilder-html-node .grid { grid-template-columns: 1fr !important; }
    .gridbuilder-html-node .cell-content { padding: 20px 16px; }
  }
  </style>
${bodyHtml}
</div>`;
}
