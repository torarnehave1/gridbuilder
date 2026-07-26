export interface ThemeFontOption {
  id: 'display' | 'sans' | 'script' | 'mono';
  label: string;
  varName: '--font-display' | '--font-sans' | '--font-script' | '--font-mono';
  cssVar: string;
  fontFamilyName: string;
  category: string;
}

export interface ThemeColorOption {
  id: string;
  label: string;
  varName: string;
  cssVar: string;
}

/**
 * Extracts human-readable font name from a CSS font-family string like:
 * "'Playfair Display', Georgia, serif" -> "Playfair Display"
 */
export function cleanFontFamilyName(rawFontStr: string, fallback: string): string {
  if (!rawFontStr) return fallback;
  const firstFont = rawFontStr.split(',')[0].trim();
  const cleaned = firstFont.replace(/['"]/g, '');
  return cleaned || fallback;
}

/**
 * Reads current computed font variables from CSS Theme on document.documentElement
 */
export function getThemeFontOptions(): ThemeFontOption[] {
  let displayRaw = '';
  let sansRaw = '';
  let scriptRaw = '';
  let monoRaw = '';

  if (typeof window !== 'undefined' && document.documentElement) {
    const computed = getComputedStyle(document.documentElement);
    displayRaw = computed.getPropertyValue('--font-display').trim();
    sansRaw = computed.getPropertyValue('--font-sans').trim();
    scriptRaw = computed.getPropertyValue('--font-script').trim();
    monoRaw = computed.getPropertyValue('--font-mono').trim();
  }

  return [
    {
      id: 'display',
      label: 'Display / Title Font',
      varName: '--font-display',
      cssVar: 'var(--font-display)',
      fontFamilyName: cleanFontFamilyName(displayRaw, 'Display Serif'),
      category: 'Headings & Hero Titles',
    },
    {
      id: 'sans',
      label: 'Sans-Serif / Body Font',
      varName: '--font-sans',
      cssVar: 'var(--font-sans)',
      fontFamilyName: cleanFontFamilyName(sansRaw, 'Sans-Serif'),
      category: 'Primary Reading',
    },
    {
      id: 'script',
      label: 'Script / Handwritten',
      varName: '--font-script',
      cssVar: 'var(--font-script)',
      fontFamilyName: cleanFontFamilyName(scriptRaw, 'Cursive / Script'),
      category: 'Accents & Highlights',
    },
    {
      id: 'mono',
      label: 'Monospace / Code',
      varName: '--font-mono',
      cssVar: 'var(--font-mono)',
      fontFamilyName: cleanFontFamilyName(monoRaw, 'Monospace'),
      category: 'Data & Code Snippets',
    },
  ];
}

/**
 * Reads theme colors from CSS variables
 */
export function getThemeColorOptions(): ThemeColorOption[] {
  return [
    { id: 'accent', label: 'Accent Color', varName: '--accent', cssVar: 'var(--accent)' },
    { id: 'accent2', label: 'Accent 2 Color', varName: '--accent2', cssVar: 'var(--accent2)' },
    { id: 'primary', label: 'Primary Brand', varName: '--primary', cssVar: 'var(--primary)' },
    { id: 'text', label: 'Main Text', varName: '--text', cssVar: 'var(--text)' },
    { id: 'muted', label: 'Muted Subtitle', varName: '--muted', cssVar: 'var(--muted)' },
  ];
}

/**
 * Applies font, color, or markdown formatting to selected text inside full markdown string.
 */
export function applyStyleToSelectedText(
  markdown: string,
  selectedText: string,
  styleType: 'font' | 'color' | 'bold' | 'italic' | 'code' | 'highlight' | 'h1' | 'h2' | 'h3' | 'script-embellish' | 'overlay' | 'clear',
  styleValue?: string
): string {
  if (!markdown || !selectedText) return markdown;

  const trimmedTarget = selectedText.trim();
  if (!trimmedTarget) return markdown;

  // Helper to create a fresh non-global RegExp matching <span style="...">selectedText</span>
  const getSpanRegex = () =>
    new RegExp(
      `<span\\s+style="([^"]*)"\\s*>(${escapeRegExp(trimmedTarget)})<\\/span>`,
      'i'
    );

  let updated = markdown;

  if (styleType === 'font') {
    // If target is an OVERLAY tag or contains OVERLAY header
    if (/^\[OVERLAY/i.test(trimmedTarget)) {
      return updated.replace(/\[OVERLAY(?:\s*\|\s*([^\]]*))?\]/i, (_, existingParams) => {
        const clean = (existingParams || '').replace(/font-family:[^;]+;?/gi, '').trim();
        const newParams = `font-family: ${styleValue}${clean ? '; ' + clean : ''}`;
        return `[OVERLAY | ${newParams}]`;
      });
    }

    if (getSpanRegex().test(updated)) {
      updated = updated.replace(getSpanRegex(), (match, existingStyle, text) => {
        const cleanStyle = existingStyle.replace(/font-family:[^;]+;?/gi, '').trim();
        const newStyle = `font-family: ${styleValue}${cleanStyle ? '; ' + cleanStyle : ''}`.trim();
        return `<span style="${newStyle}">${text}</span>`;
      });
    } else {
      const replacement = `<span style="font-family: ${styleValue}">${trimmedTarget}</span>`;
      updated = updated.replace(trimmedTarget, replacement);
    }
    return updated;
  }

  if (styleType === 'color') {
    // If target is an OVERLAY tag or contains OVERLAY header
    if (/^\[OVERLAY/i.test(trimmedTarget)) {
      return updated.replace(/\[OVERLAY(?:\s*\|\s*([^\]]*))?\]/i, (_, existingParams) => {
        const clean = (existingParams || '').replace(/color:[^;]+;?/gi, '').trim();
        const newParams = `color: ${styleValue}${clean ? '; ' + clean : ''}`;
        return `[OVERLAY | ${newParams}]`;
      });
    }

    if (getSpanRegex().test(updated)) {
      updated = updated.replace(getSpanRegex(), (match, existingStyle, text) => {
        const cleanStyle = existingStyle.replace(/color:[^;]+;?/gi, '').trim();
        const newStyle = `color: ${styleValue}${cleanStyle ? '; ' + cleanStyle : ''}`.trim();
        return `<span style="${newStyle}">${text}</span>`;
      });
    } else {
      const replacement = `<span style="color: ${styleValue}">${trimmedTarget}</span>`;
      updated = updated.replace(trimmedTarget, replacement);
    }
    return updated;
  }

  if (styleType === 'bold') {
    const replacement = `**${trimmedTarget}**`;
    return updated.replace(trimmedTarget, replacement);
  }

  if (styleType === 'italic') {
    const replacement = `*${trimmedTarget}*`;
    return updated.replace(trimmedTarget, replacement);
  }

  if (styleType === 'code') {
    const replacement = `\`${trimmedTarget}\``;
    return updated.replace(trimmedTarget, replacement);
  }

  if (styleType === 'highlight') {
    const replacement = `<mark style="background: color-mix(in srgb, var(--accent) 30%, transparent); color: var(--text); padding: 0 4px; border-radius: 4px;">${trimmedTarget}</mark>`;
    return updated.replace(trimmedTarget, replacement);
  }

  if (styleType === 'h1') {
    const replacement = `# ${trimmedTarget}`;
    return updated.replace(trimmedTarget, replacement);
  }

  if (styleType === 'h2') {
    const replacement = `## ${trimmedTarget}`;
    return updated.replace(trimmedTarget, replacement);
  }

  if (styleType === 'h3') {
    const replacement = `### ${trimmedTarget}`;
    return updated.replace(trimmedTarget, replacement);
  }

  if (styleType === 'script-embellish') {
    // Maya Knight style angled script overlay/embellishment
    const replacement = `<span style="font-family: var(--font-script); display: inline-block; transform: rotate(-6deg) translateY(-2px); color: var(--accent); font-weight: 600; line-height: 1.1; margin: 0 2px;">${trimmedTarget}</span>`;
    return updated.replace(trimmedTarget, replacement);
  }

  if (styleType === 'overlay') {
    // Wrap in [OVERLAY] ... [END OVERLAY] block so text/title superimposes over image
    let targetToWrap = trimmedTarget;

    // Check if trimmedTarget is inside an HTML span wrapper in markdown
    const spanPattern = new RegExp(`<span\\s+style="[^"]*"\\s*>[^<]*${escapeRegExp(trimmedTarget)}[^<]*<\\/span>`, 'gi');
    const spanMatch = markdown.match(spanPattern);
    if (spanMatch && spanMatch.length > 0) {
      targetToWrap = spanMatch[0];
    } else {
      // Check if inside a heading line e.g. "# ... selectedText ..."
      const headingPattern = new RegExp(`^#+\\s+.*${escapeRegExp(trimmedTarget)}.*$`, 'm');
      const headingMatch = markdown.match(headingPattern);
      if (headingMatch) {
        targetToWrap = headingMatch[0];
      }
    }

    // Check if an image tag ![alt](url) immediately follows targetToWrap in markdown
    let matchedImageTag = '';
    const targetIdx = markdown.indexOf(targetToWrap);
    if (targetIdx !== -1) {
      const restAfterTarget = markdown.slice(targetIdx + targetToWrap.length);
      const imageMatch = restAfterTarget.match(/^\s*(?!\[(?:OVERLAY|END OVERLAY)\])(!\[[^\]]*\]\([^)\s]+\))/i);
      if (imageMatch) {
        matchedImageTag = imageMatch[1];
      }
    }

    let textContent = targetToWrap.trim();
    let imageContent = matchedImageTag.trim();

    // If targetToWrap itself already contained an image tag
    if (!imageContent) {
      const imgInTarget = targetToWrap.match(/!\[([^\]]*)\]\(([^)\s]+)\)/);
      if (imgInTarget) {
        imageContent = imgInTarget[0];
        textContent = targetToWrap.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/, '').trim();
      }
    }

    // Strip any nested/leftover overlay tags
    textContent = textContent.replace(/\[\/?OVERLAY\]/gi, '').trim();

    const overlayBlock = `\n[OVERLAY]\n${textContent}${imageContent ? `\n\n${imageContent}` : ''}\n[END OVERLAY]\n`;

    if (matchedImageTag && markdown.includes(targetToWrap)) {
      const startPos = markdown.indexOf(targetToWrap);
      const imgPos = markdown.indexOf(matchedImageTag, startPos);
      if (startPos !== -1 && imgPos !== -1) {
        const fullMatchedRange = markdown.slice(startPos, imgPos + matchedImageTag.length);
        return markdown.replace(fullMatchedRange, overlayBlock);
      }
    }

    return markdown.replace(targetToWrap, overlayBlock);
  }

  if (styleType === 'clear') {
    // Strip span or mark wrappers around trimmedTarget
    if (getSpanRegex().test(updated)) {
      updated = updated.replace(getSpanRegex(), trimmedTarget);
    }
    const markRegex = new RegExp(`<mark[^>]*>(${escapeRegExp(trimmedTarget)})<\\/mark>`, 'gi');
    updated = updated.replace(markRegex, trimmedTarget);
    const boldRegex = new RegExp(`\\*\\*(${escapeRegExp(trimmedTarget)})\\*\\*`, 'gi');
    updated = updated.replace(boldRegex, trimmedTarget);
    return updated;
  }

  return updated;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
