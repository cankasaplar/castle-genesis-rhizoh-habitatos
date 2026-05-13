/**
 * Hub ↔ Academy bidirectional bağlam (salt URL; çıkarım yok).
 * @see genesisSemanticBridgeV1.js
 */

export const GENESIS_HUB_QUERY_CONTEXT_SCHEMA = "castle.genesis.hub_query_context.v1";

export const GENESIS_HUB_PATH = "/genesis/hub";

/** Kısa query anahtarları (URL uzunluğu) */
const Q = {
  ctx: "ctx",
  anchor: "a",
  eventType: "t",
  seqMin: "smin",
  seqMax: "smax",
  window: "w"
};

/**
 * @param {{ anchor?: string, eventType?: string, seqMin?: number | null, seqMax?: number | null, window?: number }} o
 * @returns {string} `/genesis/hub?...`
 */
export function buildHubLiveContextHref(o = {}) {
  const p = new URLSearchParams();
  p.set(Q.ctx, "1");
  const anchor = String(o.anchor || "").trim();
  const et = String(o.eventType || "").trim();
  if (anchor) p.set(Q.anchor, anchor);
  if (et) p.set(Q.eventType, et);
  const smin = Number(o.seqMin);
  const smax = Number(o.seqMax);
  if (Number.isFinite(smin)) p.set(Q.seqMin, String(Math.max(0, Math.floor(smin))));
  if (Number.isFinite(smax)) p.set(Q.seqMax, String(Math.max(0, Math.floor(smax))));
  const w = Number(o.window);
  if (Number.isFinite(w)) p.set(Q.window, String(Math.min(512, Math.max(1, Math.floor(w)))));
  const qs = p.toString();
  return qs ? `${GENESIS_HUB_PATH}?${qs}` : GENESIS_HUB_PATH;
}

/**
 * @param {string} search — `location.search` veya `?ctx=1&...`
 * @returns {null | { anchor: string | null, eventType: string | null, seqMin: number | null, seqMax: number | null, window: number | null }}
 */
export function parseHubLiveContextSearch(search) {
  const raw = String(search || "").trim();
  const q = raw.startsWith("?") ? raw.slice(1) : raw;
  const p = new URLSearchParams(q);
  if (p.get(Q.ctx) !== "1") return null;
  const anchor = String(p.get(Q.anchor) || "").trim() || null;
  const eventType = String(p.get(Q.eventType) || "").trim() || null;
  const smin = parseInt(String(p.get(Q.seqMin) || ""), 10);
  const smax = parseInt(String(p.get(Q.seqMax) || ""), 10);
  const win = parseInt(String(p.get(Q.window) || ""), 10);
  return {
    anchor,
    eventType,
    seqMin: Number.isFinite(smin) ? smin : null,
    seqMax: Number.isFinite(smax) ? smax : null,
    window: Number.isFinite(win) ? win : null
  };
}

/** Bu anchor id'leri Hub'da continuity paneline kaydırır (operasyonel bağlam). */
export const HUB_CONTINUITY_CONTEXT_ANCHORS = Object.freeze(
  new Set([
    "seq",
    "stream-transport",
    "sse-errors",
    "tick-advanced",
    "seal-issued",
    "ledger-advanced",
    "replay-state",
    "presence-mesh",
    "infra-health",
    "spiral-ws",
    "replay-fingerprint",
    "runtime-capability",
    "continuity-unknown"
  ])
);

export function hubScrollTargetForAnchor(anchorId) {
  const a = String(anchorId || "").trim();
  if (!a) return "hub-continuity-panel";
  if (a === "runtime-surface" || a === "health-live") return "hub-runtime-panel";
  if (a === "checkpoint-tools" || a === "checkpoint-vs-stream") return "hub-checkpoint-panel";
  if (a === "temporal-field-map") return "hub-temporal-field-map";
  if (a === "epistemic-field" || a === "snorm") return "hub-epistemic-panel";
  if (a === "diagnostics") return "hub-diagnostics-panel";
  if (a === "resolver-bundle") return "hub-runtime-panel";
  if (HUB_CONTINUITY_CONTEXT_ANCHORS.has(a)) return "hub-continuity-panel";
  return "hub-continuity-panel";
}

/**
 * Gateway continuity-event JSONL archive (GET). Açık: `CASTLE_GENESIS_EVENT_ARCHIVE=1` + disk persist.
 * @param {string} gatewayOrigin
 * @param {{ seqMin?: number | null, seqMax?: number | null, eventType?: string | null }} hubQueryContext
 * @param {{ limit?: number }} [opts]
 * @returns {string} Tam URL veya seq aralığı yoksa ""
 */
export function buildGenesisContinuityEventArchiveQueryUrl(gatewayOrigin, hubQueryContext, opts = {}) {
  const o = String(gatewayOrigin || "").trim().replace(/\/+$/, "");
  if (!o || !hubQueryContext) return "";
  const smin = hubQueryContext.seqMin;
  const smax = hubQueryContext.seqMax;
  if (!Number.isFinite(smin) || !Number.isFinite(smax)) return "";
  const p = new URLSearchParams();
  p.set("from", String(Math.max(1, Math.floor(smin))));
  p.set("to", String(Math.max(1, Math.floor(smax))));
  const et = String(hubQueryContext.eventType || "").trim();
  if (et) p.set("type", et);
  const lim = Number(opts.limit);
  p.set("limit", String(Number.isFinite(lim) ? Math.min(256, Math.max(1, Math.floor(lim))) : 128));
  return `${o}/rhizoh/genesis/continuity/events?${p.toString()}`;
}

/**
 * @param {string} gatewayOrigin
 * @param {{ from: number, to: number, type?: string | null, checkpoints?: boolean }} p
 */
export function buildGenesisReplayRouterUrl(gatewayOrigin, p) {
  const o = String(gatewayOrigin || "").trim().replace(/\/+$/, "");
  if (!o || !p) return "";
  const from = Math.floor(Number(p.from) || 0);
  const to = Math.floor(Number(p.to) || 0);
  if (from <= 0 || to <= 0) return "";
  const q = new URLSearchParams();
  q.set("from", String(from));
  q.set("to", String(to));
  const et = String(p.type || "").trim();
  if (et) q.set("type", et);
  if (p.checkpoints === false) q.set("checkpoints", "0");
  return `${o}/rhizoh/genesis/replay?${q.toString()}`;
}

/**
 * @param {string} gatewayOrigin
 * @param {{ from: number, to: number, type?: string | null }} p
 */
export function buildGenesisReplayTemporalDiffUrl(gatewayOrigin, p) {
  const o = String(gatewayOrigin || "").trim().replace(/\/+$/, "");
  if (!o || !p) return "";
  const from = Math.floor(Number(p.from) || 0);
  const to = Math.floor(Number(p.to) || 0);
  if (from <= 0 || to <= 0) return "";
  const q = new URLSearchParams();
  q.set("from", String(from));
  q.set("to", String(to));
  const et = String(p.type || "").trim();
  if (et) q.set("type", et);
  return `${o}/rhizoh/genesis/replay/diff?${q.toString()}`;
}
