export interface ImgixParams {
  fit?: 'crop' | 'clip' | 'fill' | 'max' | 'scale' | 'min' | string;
  crop?: 'center' | 'faces' | 'entropy' | 'top' | 'bottom' | 'left' | 'right' | 'focalpoint' | string;
  w?: string;
  h?: string;
  auto?: string;
  q?: string;
  dpr?: string;
  bg?: string;
  rot?: string;
  [key: string]: string | undefined;
}

export interface StandardImageStyles {
  width?: string;
  height?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
  objectPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  borderRadius?: string;
  aspectRatio?: string;
  margin?: string;
  [key: string]: string | undefined;
}

export function isImgixUrl(url: string): boolean {
  if (!url) return false;
  return /imgix\.net/i.test(url) || /imgix/i.test(url);
}

export function isImageUrl(url: string): boolean {
  if (!url) return false;
  if (isImgixUrl(url)) return true;
  return /\.(?:jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)(?:\?.*)?$/i.test(url);
}

export function parseImgixUrl(fullUrl: string): { baseUrl: string; params: ImgixParams } {
  try {
    const urlObj = new URL(fullUrl, 'https://dummy.domain');
    const baseUrl = `${urlObj.origin}${urlObj.pathname}`.replace('https://dummy.domain', '');
    const params: ImgixParams = {};

    urlObj.searchParams.forEach((val, key) => {
      params[key] = val;
    });

    return { baseUrl, params };
  } catch (e) {
    const qIdx = fullUrl.indexOf('?');
    if (qIdx === -1) return { baseUrl: fullUrl, params: {} };
    const baseUrl = fullUrl.substring(0, qIdx);
    const queryString = fullUrl.substring(qIdx + 1);
    const params: ImgixParams = {};
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
    }
    return { baseUrl, params };
  }
}

export function buildImgixUrl(baseUrl: string, params: ImgixParams): string {
  const searchParams = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      searchParams.set(key, val);
    }
  });
  const qStr = searchParams.toString();
  return qStr ? `${baseUrl}?${qStr}` : baseUrl;
}

export function parseCssStyles(styleStr: string): StandardImageStyles {
  if (!styleStr) return {};
  const styles: StandardImageStyles = {};
  const rules = styleStr.split(';');
  for (const rule of rules) {
    const [prop, val] = rule.split(':').map((s) => s.trim());
    if (prop && val) {
      const camelProp = prop.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      styles[camelProp] = val;
      styles[prop] = val;
    }
  }
  return styles;
}

export function buildCssStyleString(styles: StandardImageStyles): string {
  const cssParts: string[] = [];
  if (styles.width) cssParts.push(`width: ${styles.width}`);
  if (styles.height) cssParts.push(`height: ${styles.height}`);
  if (styles.objectFit) cssParts.push(`object-fit: ${styles.objectFit}`);
  if (styles.objectPosition) cssParts.push(`object-position: ${styles.objectPosition}`);
  if (styles.borderRadius) cssParts.push(`border-radius: ${styles.borderRadius}`);
  if (styles.aspectRatio) cssParts.push(`aspect-ratio: ${styles.aspectRatio}`);

  Object.keys(styles).forEach((key) => {
    if (
      !['width', 'height', 'objectFit', 'objectPosition', 'borderRadius', 'aspectRatio', 'object-fit', 'object-position', 'border-radius', 'aspect-ratio'].includes(key)
    ) {
      const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (styles[key]) cssParts.push(`${kebab}: ${styles[key]}`);
    }
  });

  return cssParts.join('; ');
}

export function updateImageInMarkdown(
  markdown: string,
  targetOriginalUrl: string,
  newUrl: string,
  newAlt: string = 'Image',
  newPipeStyles: string = ''
): string {
  if (!markdown) return markdown;

  // Clean raw target URL without query string for fuzzy matching if needed
  const cleanTarget = targetOriginalUrl.split('?')[0];

  // 1. Try matching pipe image syntax: ![alt|styles](url)
  const pipeRegex = /!\[([^\]|]*)\|([^\]]*)\]\(([^)\s]+)\)/gi;
  let updated = false;

  let result = markdown.replace(pipeRegex, (match, alt, styles, url) => {
    if (url === targetOriginalUrl || url.split('?')[0] === cleanTarget) {
      updated = true;
      const finalAlt = newAlt || alt || 'Image';
      if (newPipeStyles) {
        return `![${finalAlt}|${newPipeStyles}](${newUrl})`;
      }
      return `![${finalAlt}](${newUrl})`;
    }
    return match;
  });

  if (updated) return result;

  // 2. Try matching standard markdown image syntax: ![alt](url)
  const stdRegex = /!\[([^\]]*)\]\(([^)\s]+)\)/gi;
  result = result.replace(stdRegex, (match, alt, url) => {
    if (url === targetOriginalUrl || url.split('?')[0] === cleanTarget) {
      updated = true;
      const finalAlt = newAlt || alt || 'Image';
      if (newPipeStyles) {
        return `![${finalAlt}|${newPipeStyles}](${newUrl})`;
      }
      return `![${finalAlt}](${newUrl})`;
    }
    return match;
  });

  if (updated) return result;

  // 3. Try matching markdown link syntax: [alt](url) where url is an image
  const linkRegex = /\[([^\]]*)\]\(([^)\s]+)\)/gi;
  result = result.replace(linkRegex, (match, alt, url) => {
    if (url === targetOriginalUrl || url.split('?')[0] === cleanTarget || isImageUrl(url)) {
      updated = true;
      const finalAlt = newAlt || alt || 'Image';
      if (newPipeStyles) {
        return `![${finalAlt}|${newPipeStyles}](${newUrl})`;
      }
      return `![${finalAlt}](${newUrl})`;
    }
    return match;
  });

  return result;
}
