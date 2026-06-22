/**
 * Match ingress session router v0 — /match/:id deep link + hash/query fallbacks.
 * RESEARCH-ONLY
 */

export const MATCH_INGRESS_SESSION_ROUTER_SCHEMA_V0 =
  "castle.rhizoh.match_ingress_session_router.v0";

export const MATCH_REALITY_SYNC_JOIN_EVENT_V0 = "rhizoh:match-reality-sync-join-v0";

/**
 * @param {string} [href]
 * @returns {{ sessionId: string, role?: string, playerId?: string, source: string } | null}
 */
export function parseMatchSessionFromLocationV0(href) {
  if (typeof window === "undefined" && !href) return null;
  const raw = String(href || window.location?.href || "");
  if (!raw) return null;

  try {
    const u = new URL(raw, "http://localhost");

    const pathMatch = u.pathname.match(/\/match\/([^/?#]+)/i);
    if (pathMatch?.[1]) {
      return Object.freeze({
        sessionId: decodeURIComponent(pathMatch[1]),
        role: u.searchParams.get("role") || undefined,
        playerId: u.searchParams.get("playerId") || u.searchParams.get("player") || undefined,
        source: "path"
      });
    }

    const hashMatch = u.hash.match(/(?:#|\/)match\/([^/?&]+)/i);
    if (hashMatch?.[1]) {
      return Object.freeze({
        sessionId: decodeURIComponent(hashMatch[1]),
        role: u.searchParams.get("role") || undefined,
        playerId: u.searchParams.get("playerId") || undefined,
        source: "hash"
      });
    }

    const querySession = u.searchParams.get("match") || u.searchParams.get("sessionId");
    if (querySession) {
      return Object.freeze({
        sessionId: String(querySession).trim(),
        role: u.searchParams.get("role") || undefined,
        playerId: u.searchParams.get("playerId") || undefined,
        source: "query"
      });
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * @param {{ sessionId: string, role?: string, playerId?: string }} input
 */
export function buildMatchSessionShareUrlV0(input = {}) {
  const sessionId = String(input.sessionId || "").trim();
  if (!sessionId || typeof window === "undefined") return "";
  const u = new URL(window.location.href);
  u.pathname = `/match/${encodeURIComponent(sessionId)}`;
  if (input.role) u.searchParams.set("role", String(input.role));
  if (input.playerId) u.searchParams.set("playerId", String(input.playerId));
  return u.toString();
}

export function publishMatchIngressRouteV0(parsed) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.matchIngressRoute = Object.freeze({
    schema: MATCH_INGRESS_SESSION_ROUTER_SCHEMA_V0,
    parsed,
    atMs: Date.now(),
    interpretationOnly: true
  });
}
