/**
 * Chess cluster memory graph — spatial-independent pattern storage.
 * RESEARCH-ONLY observability layer.
 */

export const CHESS_CLUSTER_MEMORY_GRAPH_SCHEMA_V0 = "castle.rhizoh.chess_cluster_memory_graph.v0";

const MAX_NODES_V0 = 512;
/** @type {object[]} */
let nodesV0 = [];

/**
 * @param {{ kind: string, slotId?: number, matchId?: string, observation?: object, summary?: string, reinforcement?: number }} row
 */
export function writeChessClusterMemoryNodeV0(row) {
  const node = Object.freeze({
    schema: CHESS_CLUSTER_MEMORY_GRAPH_SCHEMA_V0,
    id: `ccm_${nodesV0.length}_${Date.now().toString(36)}`,
    kind: String(row.kind || "observation"),
    slotId: row.slotId ?? null,
    matchId: row.matchId || null,
    observation: row.observation || null,
    summary: row.summary || null,
    reinforcement: Number(row.reinforcement) || 0,
    spatialBound: false,
    atMs: Date.now()
  });
  nodesV0.push(node);
  while (nodesV0.length > MAX_NODES_V0) nodesV0.shift();
  publishChessClusterMemoryGraphV0();
  return node;
}

export function listChessClusterMemoryNodesV0(opts = {}) {
  const limit = Math.max(1, Math.min(128, Number(opts.limit) || 32));
  return Object.freeze(nodesV0.slice(-limit));
}

export function getChessClusterMemoryGraphSnapshotV0() {
  return Object.freeze({
    schema: CHESS_CLUSTER_MEMORY_GRAPH_SCHEMA_V0,
    nodeCount: nodesV0.length,
    recent: listChessClusterMemoryNodesV0({ limit: 16 }),
    atMs: Date.now()
  });
}

function publishChessClusterMemoryGraphV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessClusterMemory = getChessClusterMemoryGraphSnapshotV0();
}

/** @internal vitest */
export function __resetChessClusterMemoryGraphForTestV0() {
  nodesV0 = [];
  publishChessClusterMemoryGraphV0();
}
