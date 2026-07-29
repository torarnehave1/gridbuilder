import { getUserFromLocalStorage } from './vegvisrAuth';

/**
 * Single seam for every Vegvisr Knowledge Graph API call.
 *
 * Calls go straight from the browser to knowledge.vegvisr.org. The worker sends
 * CORS for any origin (verified for https://studio.vegr.ai and http://localhost:3000),
 * so this is the same code path in dev and in production.
 *
 * The previous `/api/vegvisr/proxy/*` route only exists in `server.ts`, the local
 * Express dev wrapper. On the static Pages deploy it falls through to index.html,
 * so every call returned the SPA shell as text/html and `res.json()` threw.
 *
 * Auth is the caller's own session (x-user-email / x-user-role) — attribution, not
 * a shared service token. Unauthenticated reads return published graphs only.
 */
export const VEGVISR_KNOWLEDGE_BASE = 'https://knowledge.vegvisr.org';

export function vegvisrAuthHeaders(): Record<string, string> {
  const user = getUserFromLocalStorage();
  if (!user?.email) return {};
  return {
    'x-user-email': user.email,
    ...(user.role ? { 'x-user-role': user.role } : {}),
  };
}

export async function vegvisrFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${VEGVISR_KNOWLEDGE_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...vegvisrAuthHeaders(),
    ...((init.headers as Record<string, string>) || {}),
  };

  return fetch(url, { ...init, headers });
}
