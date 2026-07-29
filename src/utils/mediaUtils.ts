/**
 * Media resolution for knowledge-graph nodes.
 *
 * Graph nodes carry their media pointer in `path` (sometimes `url` / `videoUrl` /
 * `publicUrl`), while `info` holds a human description. The node `type` is an open
 * string — the openapi.json `Node.type` enum (fulltext|image|link|video|audio) is
 * NOT exhaustive; real graphs contain `cloudflare-video`, `realtime-video`,
 * `youtube-video`, `html-node`, `mermaid-diagram`, `chart`, ...
 *
 * Add new media node types to the registries below.
 */

export type MediaKind = 'video' | 'audio' | 'youtube';

export interface MediaSource {
  url: string;
  /** Empty when the extension is unknown — the <source> then omits `type`. */
  mime: string;
}

export interface ResolvedMedia {
  kind: MediaKind;
  label: string;
  /** Playable sources for this node's own media pointer. */
  sources: MediaSource[];
  /** YouTube embed URL (kind === 'youtube'). */
  embedUrl?: string;
  /** Media URLs found in `bibl` — related recordings, NOT fallbacks for `sources`. */
  alternates: string[];
  /** Raw path values that could not be turned into a URL (e.g. bare Stream IDs). */
  unresolved: string[];
}

// --- node type registries -------------------------------------------------

const VIDEO_NODE_TYPES = new Set(['video', 'cloudflare-video', 'realtime-video']);
const AUDIO_NODE_TYPES = new Set(['audio']);
const YOUTUBE_NODE_TYPES = new Set(['youtube-video', 'youtube']);

// --- extension -> mime ----------------------------------------------------

const VIDEO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
  mov: 'video/quicktime',
  ogv: 'video/ogg',
};

const AUDIO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
};

/** `.ogg` is ambiguous — resolved by the node type / surrounding context. */
const AMBIGUOUS_MIME: Record<string, { video: string; audio: string }> = {
  ogg: { video: 'video/ogg', audio: 'audio/ogg' },
};

/** Bucket that serves bare `recordings/…` and `audio/…` paths. */
const REALTIME_BUCKET = 'https://realtimevideos.vegvisr.org';

function extOf(url: string): string {
  const clean = url.split('#')[0].split('?')[0];
  const dot = clean.lastIndexOf('.');
  const slash = clean.lastIndexOf('/');
  if (dot < 0 || dot < slash) return '';
  return clean.substring(dot + 1).toLowerCase();
}

function mimeFor(url: string, kind: MediaKind): string {
  const ext = extOf(url);
  if (!ext) return '';
  if (AMBIGUOUS_MIME[ext]) {
    return kind === 'audio' ? AMBIGUOUS_MIME[ext].audio : AMBIGUOUS_MIME[ext].video;
  }
  return (kind === 'audio' ? AUDIO_MIME[ext] : VIDEO_MIME[ext]) || '';
}

function isVideoExt(url: string): boolean {
  const ext = extOf(url);
  return !!VIDEO_MIME[ext] || ext === 'ogg';
}

function isAudioExt(url: string): boolean {
  return !!AUDIO_MIME[extOf(url)];
}

/**
 * Turn a node path into an absolute URL.
 * Returns null when the value is not resolvable on its own (e.g. a bare
 * Cloudflare Stream ID) — the caller surfaces it as `unresolved` instead of
 * inventing a host.
 */
export function normalizeMediaUrl(raw: string): string | null {
  const value = (raw || '').trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (/^(recordings|audio)\//i.test(value)) return `${REALTIME_BUCKET}/${value}`;
  if (value.startsWith('/')) return value;
  return null;
}

const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;

export function youtubeEmbedUrl(url: string): string | null {
  const m = url.match(YOUTUBE_RE);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/**
 * Decide whether a graph node carries playable media and where it lives.
 * Returns null for non-media nodes (fulltext, image, link, ...).
 */
export function resolveMedia(node: any): ResolvedMedia | null {
  if (!node) return null;

  const nodeType = String(node.type || '').toLowerCase();
  const label = node.label || node.name || node.id || 'Media';

  const rawCandidates: string[] = [
    node.publicUrl,
    node.path,
    node.url,
    node.videoUrl,
    node.audioUrl,
    node.src,
  ]
    .map((v: any) => String(v || '').trim())
    .filter(Boolean);

  const biblRaw: string[] = Array.isArray(node.bibl)
    ? node.bibl.map((v: any) => String(v || '').trim()).filter(Boolean)
    : [];

  const resolved: string[] = [];
  const unresolved: string[] = [];
  rawCandidates.forEach((raw) => {
    const url = normalizeMediaUrl(raw);
    if (url) {
      if (!resolved.includes(url)) resolved.push(url);
    } else if (!unresolved.includes(raw)) {
      unresolved.push(raw);
    }
  });

  // --- kind ---------------------------------------------------------------
  let kind: MediaKind | null = null;
  const youtubeCandidate = resolved.find((u) => YOUTUBE_RE.test(u));

  if (YOUTUBE_NODE_TYPES.has(nodeType) || youtubeCandidate) kind = 'youtube';
  else if (AUDIO_NODE_TYPES.has(nodeType)) kind = 'audio';
  else if (VIDEO_NODE_TYPES.has(nodeType)) kind = 'video';
  else if (resolved.some(isAudioExt)) kind = 'audio';
  else if (resolved.some(isVideoExt)) kind = 'video';

  if (!kind) return null;

  if (kind === 'youtube') {
    const embedUrl = youtubeCandidate ? youtubeEmbedUrl(youtubeCandidate) : null;
    if (!embedUrl) {
      // youtube-typed node without a usable URL — still a media node, report it.
      return { kind, label, sources: [], alternates: [], unresolved: unresolved.concat(resolved) };
    }
    return { kind, label, embedUrl, sources: [], alternates: [], unresolved };
  }

  const matchesKind = (u: string) => (kind === 'audio' ? isAudioExt(u) : isVideoExt(u));
  // Keep extension-less URLs: the server may still serve the right content type.
  const usable = resolved.filter((u) => matchesKind(u) || !extOf(u));
  const sources: MediaSource[] = (usable.length ? usable : resolved).map((url) => ({
    url,
    mime: mimeFor(url, kind as MediaKind),
  }));

  const alternates = biblRaw
    .map((raw) => normalizeMediaUrl(raw))
    .filter((u): u is string => !!u && (isVideoExt(u) || isAudioExt(u)))
    .filter((u) => !sources.some((s) => s.url === u));

  return { kind, label, sources, alternates, unresolved };
}

// --- rendering ------------------------------------------------------------

function esc(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SHELL =
  'width: 100%; margin: 1.25em auto; overflow: hidden; border-radius: var(--radius, 12px); border: 1px solid var(--card-border, #334155); background: var(--card-bg, #020617); padding: 8px;';
const META =
  'margin-top: 6px; font-size: 0.78em; color: var(--muted, #94a3b8); display: flex; flex-wrap: wrap; gap: 8px; align-items: center;';

function alternatesHtml(alternates: string[]): string {
  if (!alternates.length) return '';
  const links = alternates
    .map(
      (u, i) =>
        `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" style="color: var(--accent, #60a5fa); font-weight: 600;">Related recording ${
          i + 1
        } &#8599;</a>`
    )
    .join(' ');
  return `<div style="${META}">${links}</div>`;
}

/**
 * Single-line HTML — renderMarkdownToHtml() passes a raw HTML block through only
 * when its open/close tags balance, which they do on one line.
 */
export function renderMediaHtml(media: ResolvedMedia): string {
  if (media.kind === 'youtube' && media.embedUrl) {
    return `<div class="fulltext-youtube" style="aspect-ratio: 16/9; width: 100%; max-width: 680px; margin: 1.5em auto; overflow: hidden; border-radius: var(--radius, 12px); box-shadow: 0 4px 16px rgba(0,0,0,0.2);"><iframe src="${esc(
      media.embedUrl
    )}" title="${esc(media.label)}" style="width: 100%; height: 100%; border: none;" allowfullscreen></iframe></div>`;
  }

  if (!media.sources.length) {
    const detail = media.unresolved.length
      ? `Unresolved path: <code>${esc(media.unresolved.join(', '))}</code>`
      : 'No media URL on this node.';
    return `<div class="fulltext-media-missing" style="${SHELL} text-align: center;"><div style="font-weight: 600; font-size: 0.9em; color: var(--accent, #60a5fa); margin-bottom: 4px;">${esc(
      media.label
    )}</div><div style="font-size: 0.8em; color: var(--muted, #94a3b8);">${detail}</div></div>`;
  }

  const sourceTags = media.sources
    .map((s) => `<source src="${esc(s.url)}"${s.mime ? ` type="${s.mime}"` : ''} />`)
    .join('');
  const primary = media.sources[0].url;
  const openLink = `<a href="${esc(
    primary
  )}" target="_blank" rel="noopener noreferrer" style="color: var(--accent, #60a5fa); font-weight: 600;">Open ${
    media.kind === 'audio' ? 'audio' : 'video'
  } &#8599;</a>`;

  if (media.kind === 'audio') {
    return `<div class="fulltext-audio" style="${SHELL}"><audio controls preload="metadata" style="width: 100%;">${sourceTags}Your browser does not support audio playback.</audio><div style="${META}">${openLink}</div>${alternatesHtml(
      media.alternates
    )}</div>`;
  }

  return `<div class="fulltext-video" style="${SHELL}"><video controls preload="metadata" style="width: 100%; max-height: 440px; border-radius: 8px; background: #000;">${sourceTags}Your browser does not support video playback.</video><div style="${META}">${openLink}</div>${alternatesHtml(
    media.alternates
  )}</div>`;
}
