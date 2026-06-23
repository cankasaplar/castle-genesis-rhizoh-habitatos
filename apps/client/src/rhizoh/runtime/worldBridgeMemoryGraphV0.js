/**
 * World Bridge memory graph v0 — shadow ingress → observation nodes (RESEARCH-ONLY).
 * Interpretation-only projection; no execution authority; no WAL write.
 */

export const WORLD_BRIDGE_MEMORY_GRAPH_SCHEMA_V0 = "castle.rhizoh.world_bridge_memory_graph.v0";

const MAX_NODES_V0 = 256;
/** @type {object[]} */
const nodesV0 = [];

/**
 * @param {{
 *   source: string,
 *   sourceId?: string,
 *   branchId?: string,
 *   title?: string,
 *   summary?: string,
 *   outcomeScore01?: number | null,
 *   foxSignals?: object | null
 * }} row
 */
export function writeWorldBridgeMemoryNodeV0(row) {
  const node = Object.freeze({
    schema: WORLD_BRIDGE_MEMORY_GRAPH_SCHEMA_V0,
    id: `wbm_${nodesV0.length}_${Date.now().toString(36)}`,
    source: String(row.source || "world_bridge"),
    sourceId: row.sourceId || null,
    branchId: row.branchId || null,
    title: row.title ? String(row.title).slice(0, 120) : null,
    summary: row.summary ? String(row.summary).slice(0, 240) : null,
    outcomeScore01:
      row.outcomeScore01 != null && Number.isFinite(Number(row.outcomeScore01))
        ? Number(row.outcomeScore01)
        : null,
    foxSignals: row.foxSignals ? Object.freeze({ ...row.foxSignals }) : null,
    spatialBound: false,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
  nodesV0.unshift(node);
  if (nodesV0.length > MAX_NODES_V0) nodesV0.length = MAX_NODES_V0;
  publishWorldBridgeMemoryGraphV0();
  return node;
}

/**
 * @param {object} shadowEntry — calendar or media shadow timeline entry
 * @param {"calendar"|"media"} source
 */
export function recordWorldBridgeShadowMemoryV0(shadowEntry, source) {
  const shadow = shadowEntry?.shadow || {};
  return writeWorldBridgeMemoryNodeV0({
    source,
    sourceId: shadowEntry?.eventId || shadowEntry?.mediaId || null,
    branchId: shadow.branchId || null,
    title: shadowEntry?.title || null,
    summary: shadow.narrative || null,
    outcomeScore01: shadow.outcomeScore01 ?? shadow.attentionScore01 ?? null,
    foxSignals: shadowEntry?.foxSignals || null
  });
}

export function listWorldBridgeMemoryNodesV0(opts = {}) {
  const limit = Math.max(1, Math.min(64, Number(opts.limit) || 16));
  return Object.freeze(nodesV0.slice(0, limit));
}

export function getWorldBridgeMemoryGraphSnapshotV0() {
  const bySource = nodesV0.reduce((acc, node) => {
    const key = node.source || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  return Object.freeze({
    schema: `${WORLD_BRIDGE_MEMORY_GRAPH_SCHEMA_V0}.snapshot`,
    nodeCount: nodesV0.length,
    bySource: Object.freeze(bySource),
    recent: listWorldBridgeMemoryNodesV0({ limit: 12 }),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function ensureWorldBridgeMemoryGraphDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldBridgeMemory = () => getWorldBridgeMemoryGraphSnapshotV0();
  return window.__rhizoh.worldBridgeMemory;
}

/** @internal vitest */
export function resetWorldBridgeMemoryGraphForTestV0() {
  nodesV0.length = 0;
  publishWorldBridgeMemoryGraphV0();
}

function publishWorldBridgeMemoryGraphV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldBridgeMemory = () => getWorldBridgeMemoryGraphSnapshotV0();
}
