import React, { useCallback, useEffect, useState } from 'react';
import { UploadCloud, X, ExternalLink } from 'lucide-react';

// Mirrors the publish flow in Agent-Builder's src/components/HtmlPreview.tsx:
// agent-worker mints a host-scoped publish token and POSTs the html-node's
// content to https://<host>/__html/publish, writing html:<host> into the
// shared brand-worker's HTML_PAGES KV. That worker records the live host(s)
// back onto the node's references/bibl as https://<host>/ on success.
const AGENT_API = 'https://agent.vegvisr.org';

function getAuthToken(): string {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').emailVerificationToken || '';
  } catch {
    return '';
  }
}

function hostFromRef(r: unknown): string {
  const s = String(r ?? '');
  try {
    return new URL(s).hostname.toLowerCase();
  } catch {
    return s.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  }
}

interface NodeRefs {
  references?: unknown[];
  bibl?: unknown[];
  path?: string;
}

function extractPublishedHosts(node: NodeRefs | null | undefined): string[] {
  if (!node) return [];
  const src = [
    ...(Array.isArray(node.references) ? node.references : []),
    ...(Array.isArray(node.bibl) ? node.bibl : []),
    ...(node.path ? [node.path] : []),
  ];
  return [...new Set(src.map(hostFromRef).filter((h) => h && h.includes('.') && !h.includes(' ')))];
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphId: string;
  nodeId: string;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, graphId, nodeId }) => {
  const [publishedHosts, setPublishedHosts] = useState<string[]>([]);
  const [publishHost, setPublishHost] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  // Wrong-host guard: the node is already associated with a different live host.
  // The API rejects the retarget unless force:true is passed explicitly — this is
  // the one case that stays a manual confirmation, since it overrides an existing
  // live binding. Every other failure (missing DNS/route) is handled automatically.
  const [publishWrongHost, setPublishWrongHost] = useState<string[] | null>(null);

  const loadPublishedHosts = useCallback(async () => {
    if (!graphId || !nodeId) {
      setPublishedHosts([]);
      return;
    }
    try {
      const res = await fetch(`https://knowledge.vegvisr.org/getknowgraph?id=${encodeURIComponent(graphId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const node = (data.nodes || []).find((n: { id: string }) => n.id === nodeId);
      setPublishedHosts(extractPublishedHosts(node));
    } catch {
      /* non-fatal — publish still works, just no prefill */
    }
  }, [graphId, nodeId]);

  useEffect(() => {
    if (isOpen) loadPublishedHosts();
  }, [isOpen, loadPublishedHosts]);

  useEffect(() => {
    if (isOpen && !publishHost) setPublishHost(publishedHosts[0] || '');
  }, [isOpen, publishedHosts, publishHost]);

  useEffect(() => {
    if (!isOpen) {
      setPublishMsg('');
      setPublishWrongHost(null);
    }
  }, [isOpen]);

  // Creates <subdomain>.<root_domain> (routes it to brand-worker) — no-ops with
  // an error surfaced if it can't be derived or the API call fails.
  const createSubdomain = async (target: string): Promise<{ ok: boolean; error?: string }> => {
    const [subdomain, ...rest] = target.split('.');
    const root_domain = rest.join('.');
    if (!subdomain || !root_domain.includes('.')) {
      return { ok: false, error: 'Cannot derive subdomain + root domain from that host.' };
    }
    try {
      const res = await fetch(`${AGENT_API}/create-subdomain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain, root_domain, authToken: getAuthToken() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        return { ok: false, error: String(data?.error || `Could not create the subdomain (HTTP ${res.status})`) };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: `Subdomain creation failed: ${e.message || e}` };
    }
  };

  // Publishes to `host`. On any routing failure (host doesn't exist / doesn't route
  // to brand-worker yet) this creates the subdomain itself and retries — no manual
  // "create it first" step. The one failure that stays manual is the wrong-host
  // guard (this node is already live elsewhere): that needs an explicit force.
  const runPublish = async (host: string, force = false, _autoCreated = false) => {
    const target = host.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!target || !target.includes('.')) {
      setPublishMsg('Enter a valid host, e.g. universi.vegvisr.org');
      return;
    }
    setPublishing(true);
    setPublishMsg(_autoCreated ? `Publishing to ${target}…` : 'Publishing…');
    setPublishWrongHost(null);
    try {
      const res = await fetch(`${AGENT_API}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graphId, nodeId, host: target, force, authToken: getAuthToken() }),
      });
      const data = await res.json().catch(() => null);
      const needsRoute =
        (res.ok && data?.success && data.hostRoutes === false) ||
        (!(res.ok && data?.success) &&
          !(Array.isArray(data?.associatedHosts) && data.associatedHosts.length > 0) &&
          /create_subdomain|does not route|create it first|route to brand-worker/i.test(
            String(data?.error || '')
          ));

      if (needsRoute) {
        if (_autoCreated) {
          // Already tried creating it once for this call — avoid looping.
          setPublishMsg(`${target} still does not resolve after creating the subdomain. Try again shortly (DNS propagation).`);
          setPublishing(false);
          return;
        }
        setPublishMsg(`${target} isn't set up yet — creating it…`);
        const created = await createSubdomain(target);
        if (!created.ok) {
          setPublishMsg(created.error || `Could not create ${target}.`);
          setPublishing(false);
          return;
        }
        await runPublish(target, force, true);
        return;
      }

      if (res.ok && data?.success) {
        setPublishMsg(`Published · ${target} is live`);
        loadPublishedHosts();
        setPublishing(false);
        return;
      }

      const err = String(data?.error || `HTTP ${res.status}`);
      if (Array.isArray(data?.associatedHosts) && data.associatedHosts.length > 0) {
        setPublishWrongHost(data.associatedHosts);
        setPublishMsg(err);
      } else {
        setPublishMsg(err);
      }
      setPublishing(false);
    } catch (e: any) {
      setPublishMsg(`Publish failed: ${e.message || e}`);
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="text-lg font-bold text-slate-100">Publish to Domain</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Push the saved layout's composed HTML page live to a host.
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {publishedHosts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-slate-400">Live at:</span>
            {publishedHosts.map((h) => (
              <a
                key={h}
                href={`https://${h}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                {h}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Target host</label>
          <input
            type="text"
            value={publishHost}
            onChange={(e) => {
              setPublishHost(e.target.value);
              setPublishWrongHost(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !publishing) runPublish(publishHost);
            }}
            placeholder="e.g. universi.vegvisr.org"
            spellCheck={false}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          />
        </div>

        {publishMsg && <div className="text-xs text-slate-300">{publishMsg}</div>}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
          >
            Close
          </button>
          {publishWrongHost && (
            <button
              onClick={() => runPublish(publishHost, true)}
              disabled={publishing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-100 bg-amber-600/80 hover:bg-amber-500 disabled:opacity-40 transition-all cursor-pointer"
              title={`This page is already published to ${publishWrongHost.join(', ')}. Force publishing to a second host anyway.`}
            >
              Publish anyway (force)
            </button>
          )}
          <button
            onClick={() => runPublish(publishHost)}
            disabled={publishing || !publishHost.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>
              {publishing
                ? 'Publishing…'
                : publishedHosts.includes(publishHost.trim().toLowerCase())
                ? 'Republish'
                : 'Publish'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
