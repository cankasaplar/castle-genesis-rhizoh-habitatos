/**
 * Unified Chess Memory Graph — single notebook for all learning layers.
 * Node kinds: PositionNode (FEN)
 * Edge kinds: MoveEdge (SAN), EvalEdge (engine/history/corpus), WeightUpdateEdge (learning signal)
 * RESEARCH-ONLY — observation / merge only; no execution authority.
 */

export const CHESS_UNIFIED_MEMORY_GRAPH_SCHEMA_V0 = "castle.rhizoh.chess_unified_memory_graph.v0";
export const CHESS_UNIFIED_MEMORY_GRAPH_LS_KEY_V0 = "rhizoh.chess.unified_memory_graph.v0";
export const CHESS_UNIFIED_MEMORY_GRAPH_VERSION_V0 = 2;
export const CHESS_UNIFIED_MEMORY_GRAPH_EVENT_V0 = "rhizoh:chess-unified-memory-graph-v0";

export const CHESS_UNIFIED_NODE_KIND_V0 = Object.freeze({
  POSITION: "position"
});

export const CHESS_UNIFIED_EDGE_KIND_V0 = Object.freeze({
  MOVE: "move",
  EVAL: "eval",
  WEIGHT_UPDATE: "weight_update"
});

const MAX_POSITION_NODES_V0 = 1024;
const MAX_EDGES_V0 = 2048;

/** @type {object | null} */
let cachedGraphV0 = null;

function nowIso() {
  return new Date().toISOString();
}

function hashKeyV0(text) {
  const src = String(text || "");
  let h = 0;
  for (let i = 0; i < src.length; i += 1) {
    h = (h * 31 + src.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export function positionIdFromFenV0(fen) {
  const key = String(fen || "").trim();
  if (!key) return null;
  return `pos_${hashKeyV0(key)}`;
}

function edgeIdV0(kind, parts) {
  return `${kind}_${hashKeyV0(parts.join("|"))}`;
}

function emptyGraphV0() {
  return {
    schema: CHESS_UNIFIED_MEMORY_GRAPH_SCHEMA_V0,
    graphVersion: CHESS_UNIFIED_MEMORY_GRAPH_VERSION_V0,
    nodes: [],
    edges: [],
    stats: Object.freeze({
      positionCount: 0,
      moveEdgeCount: 0,
      evalEdgeCount: 0,
      weightUpdateCount: 0,
      lastMergedAt: null,
      lastProjectedAt: null
    }),
    migratedAt: nowIso(),
    updatedAt: nowIso()
  };
}

function readRawGraphV0() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHESS_UNIFIED_MEMORY_GRAPH_LS_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function migrateGraphV0(raw) {
  const base = emptyGraphV0();
  if (!raw) return base;
  const version = Number(raw.graphVersion) || 0;
  if (version < CHESS_UNIFIED_MEMORY_GRAPH_VERSION_V0) {
    return {
      ...base,
      nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
      edges: Array.isArray(raw.edges) ? raw.edges : [],
      stats: { ...base.stats, ...(raw.stats || {}) },
      migratedAt: nowIso()
    };
  }
  return {
    ...base,
    ...raw,
    nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
    edges: Array.isArray(raw.edges) ? raw.edges : [],
    stats: { ...base.stats, ...(raw.stats || {}) }
  };
}

function recountStatsV0(graph) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  return Object.freeze({
    positionCount: nodes.filter((n) => n.kind === CHESS_UNIFIED_NODE_KIND_V0.POSITION).length,
    moveEdgeCount: edges.filter((e) => e.kind === CHESS_UNIFIED_EDGE_KIND_V0.MOVE).length,
    evalEdgeCount: edges.filter((e) => e.kind === CHESS_UNIFIED_EDGE_KIND_V0.EVAL).length,
    weightUpdateCount: edges.filter((e) => e.kind === CHESS_UNIFIED_EDGE_KIND_V0.WEIGHT_UPDATE).length,
    lastMergedAt: graph.stats?.lastMergedAt || null,
    lastProjectedAt: graph.stats?.lastProjectedAt || nowIso()
  });
}

function trimGraphV0(graph) {
  const nodes = [...(graph.nodes || [])];
  const edges = [...(graph.edges || [])];

  if (nodes.length > MAX_POSITION_NODES_V0) {
    nodes.sort((a, b) => (Number(b.visitCount) || 0) - (Number(a.visitCount) || 0));
    graph.nodes = nodes.slice(0, MAX_POSITION_NODES_V0);
  }
  if (edges.length > MAX_EDGES_V0) {
    edges.sort((a, b) => (Number(b.atMs) || 0) - (Number(a.atMs) || 0));
    graph.edges = edges.slice(0, MAX_EDGES_V0);
  }
  graph.stats = recountStatsV0(graph);
  return graph;
}

function writeGraphV0(graph) {
  const next = Object.freeze({
    ...trimGraphV0({ ...graph }),
    schema: CHESS_UNIFIED_MEMORY_GRAPH_SCHEMA_V0,
    graphVersion: CHESS_UNIFIED_MEMORY_GRAPH_VERSION_V0,
    updatedAt: nowIso()
  });
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(CHESS_UNIFIED_MEMORY_GRAPH_LS_KEY_V0, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }
  cachedGraphV0 = next;
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CHESS_UNIFIED_MEMORY_GRAPH_EVENT_V0, { detail: next.stats }));
    } catch {
      /* noop */
    }
  }
  return next;
}

export function readChessUnifiedMemoryGraphV0() {
  if (cachedGraphV0) return cachedGraphV0;
  cachedGraphV0 = Object.freeze(migrateGraphV0(readRawGraphV0()));
  return cachedGraphV0;
}

function mutateGraphV0(mutator) {
  const graph = {
    ...readChessUnifiedMemoryGraphV0(),
    nodes: [...readChessUnifiedMemoryGraphV0().nodes],
    edges: [...readChessUnifiedMemoryGraphV0().edges],
    stats: { ...readChessUnifiedMemoryGraphV0().stats }
  };
  mutator(graph);
  graph.stats = { ...graph.stats, lastProjectedAt: nowIso() };
  return writeGraphV0(graph);
}

function upsertSourceV0(sources = [], source) {
  const set = new Set(sources || []);
  if (source) set.add(String(source));
  return Object.freeze([...set]);
}

/**
 * @param {string} fen
 * @param {{ source?: string, openingBucket?: string, atMs?: number }} [meta]
 */
export function upsertChessPositionNodeV0(fen, meta = {}) {
  const id = positionIdFromFenV0(fen);
  if (!id) return null;
  return mutateGraphV0((graph) => {
    const idx = graph.nodes.findIndex((n) => n.id === id);
    const prev = idx >= 0 ? graph.nodes[idx] : null;
    const row = Object.freeze({
      kind: CHESS_UNIFIED_NODE_KIND_V0.POSITION,
      id,
      fen: String(fen).trim(),
      visitCount: (Number(prev?.visitCount) || 0) + 1,
      sources: upsertSourceV0(prev?.sources, meta.source),
      openingBucket: meta.openingBucket || prev?.openingBucket || null,
      lastSeenAt: nowIso(),
      atMs: meta.atMs || Date.now()
    });
    if (idx >= 0) graph.nodes[idx] = row;
    else graph.nodes.push(row);
  });
}

/**
 * @param {{ fromFen: string, toFen: string, san: string, source?: string, matchId?: string, gameId?: string, ply?: number, color?: string, agentId?: string, atMs?: number }} row
 */
export function upsertChessMoveEdgeV0(row = {}) {
  const fromId = positionIdFromFenV0(row.fromFen);
  const toId = positionIdFromFenV0(row.toFen);
  if (!fromId || !toId || !row.san) return null;

  upsertChessPositionNodeV0(row.fromFen, { source: row.source, atMs: row.atMs });
  upsertChessPositionNodeV0(row.toFen, { source: row.source, atMs: row.atMs });

  const id = edgeIdV0("mv", [fromId, toId, row.san, row.source || "", row.matchId || row.gameId || ""]);
  return mutateGraphV0((graph) => {
    const idx = graph.edges.findIndex((e) => e.id === id);
    const prev = idx >= 0 ? graph.edges[idx] : null;
    const edge = Object.freeze({
      kind: CHESS_UNIFIED_EDGE_KIND_V0.MOVE,
      id,
      fromPositionId: fromId,
      toPositionId: toId,
      san: String(row.san),
      ply: row.ply ?? prev?.ply ?? null,
      color: row.color ?? prev?.color ?? null,
      source: row.source || prev?.source || "live_rhizoh",
      matchId: row.matchId || prev?.matchId || null,
      gameId: row.gameId || prev?.gameId || null,
      agentId: row.agentId || prev?.agentId || null,
      playCount: (Number(prev?.playCount) || 0) + 1,
      atMs: row.atMs || Date.now()
    });
    if (idx >= 0) graph.edges[idx] = edge;
    else graph.edges.push(edge);
  });
}

/**
 * @param {{ fen: string, cp?: number, depth?: number, engine?: string, source?: string, atMs?: number }} row
 */
export function upsertChessEvalEdgeV0(row = {}) {
  const positionId = positionIdFromFenV0(row.fen);
  if (!positionId) return null;
  upsertChessPositionNodeV0(row.fen, { source: row.source, atMs: row.atMs });

  const id = edgeIdV0("eval", [
    positionId,
    row.engine || "heuristic",
    row.source || "",
    String(row.cp ?? "")
  ]);
  return mutateGraphV0((graph) => {
    const idx = graph.edges.findIndex((e) => e.id === id);
    const prev = idx >= 0 ? graph.edges[idx] : null;
    const edge = Object.freeze({
      kind: CHESS_UNIFIED_EDGE_KIND_V0.EVAL,
      id,
      positionId,
      cp: row.cp ?? prev?.cp ?? null,
      depth: row.depth ?? prev?.depth ?? null,
      engine: row.engine || prev?.engine || "heuristic",
      source: row.source || prev?.source || "corpus_proxy",
      sampleCount: (Number(prev?.sampleCount) || 0) + 1,
      atMs: row.atMs || Date.now()
    });
    if (idx >= 0) graph.edges[idx] = edge;
    else graph.edges.push(edge);
  });
}

/**
 * @param {{ matchId?: string, weightsBefore?: object, weightsAfter?: object, regret?: object, atMs?: number }} row
 */
export function upsertChessWeightUpdateEdgeV0(row = {}) {
  const before = row.weightsBefore || {};
  const after = row.weightsAfter || {};
  const id = edgeIdV0("wu", [
    row.matchId || "",
    before.matchesLearned ?? "",
    after.matchesLearned ?? "",
    String(row.atMs || Date.now())
  ]);

  function fingerprint(w) {
    return [w.matchesLearned, w.aggressionBias, w.winForcingWeight, w.riskPenaltyWeight]
      .map((n) => Number(n).toFixed(3))
      .join("|");
  }

  return mutateGraphV0((graph) => {
    const edge = Object.freeze({
      kind: CHESS_UNIFIED_EDGE_KIND_V0.WEIGHT_UPDATE,
      id,
      triggerMatchId: row.matchId || null,
      matchesLearnedBefore: Number(before.matchesLearned) || 0,
      matchesLearnedAfter: Number(after.matchesLearned) || 0,
      weightFingerprintBefore: fingerprint(before),
      weightFingerprintAfter: fingerprint(after),
      regretSummary: Object.freeze({
        forcedWinIgnored: Boolean(row.regret?.forcedWinIgnored),
        lossAvoidanceBias: Boolean(row.regret?.lossAvoidanceBias)
      }),
      atMs: row.atMs || Date.now()
    });
    graph.edges.push(edge);
  });
}

function maxStatV0(a, b) {
  return Math.max(Number(a) || 0, Number(b) || 0);
}

/**
 * Merge remote graph into live — never decreases visit/play/sample counts.
 */
export function mergeChessUnifiedMemoryGraphV0(remote = {}) {
  if (!remote?.nodes?.length && !remote?.edges?.length) {
    return readChessUnifiedMemoryGraphV0();
  }
  return mutateGraphV0((graph) => {
    const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
    for (const row of remote.nodes || []) {
      const prev = nodeById.get(row.id);
      if (!prev) {
        nodeById.set(row.id, Object.freeze({ ...row }));
        continue;
      }
      nodeById.set(
        row.id,
        Object.freeze({
          ...prev,
          ...row,
          visitCount: maxStatV0(prev.visitCount, row.visitCount),
          sources: upsertSourceV0(
            [...(prev.sources || []), ...(row.sources || [])],
            null
          )
        })
      );
    }
    graph.nodes = [...nodeById.values()];

    const edgeById = new Map(graph.edges.map((e) => [e.id, e]));
    for (const row of remote.edges || []) {
      const prev = edgeById.get(row.id);
      if (!prev) {
        edgeById.set(row.id, Object.freeze({ ...row }));
        continue;
      }
      if (row.kind === CHESS_UNIFIED_EDGE_KIND_V0.MOVE) {
        edgeById.set(
          row.id,
          Object.freeze({
            ...prev,
            ...row,
            playCount: maxStatV0(prev.playCount, row.playCount)
          })
        );
      } else if (row.kind === CHESS_UNIFIED_EDGE_KIND_V0.EVAL) {
        edgeById.set(
          row.id,
          Object.freeze({
            ...prev,
            ...row,
            sampleCount: maxStatV0(prev.sampleCount, row.sampleCount)
          })
        );
      } else {
        edgeById.set(row.id, Object.freeze({ ...prev, ...row }));
      }
    }
    graph.edges = [...edgeById.values()];
    graph.stats = { ...graph.stats, lastMergedAt: nowIso() };
  });
}

export function getChessUnifiedMemoryGraphSnapshotV0() {
  const graph = readChessUnifiedMemoryGraphV0();
  return Object.freeze({
    schema: `${CHESS_UNIFIED_MEMORY_GRAPH_SCHEMA_V0}.snapshot`,
    graphVersion: graph.graphVersion,
    stats: graph.stats,
    recentPositions: Object.freeze(
      [...graph.nodes]
        .sort((a, b) => (Number(b.visitCount) || 0) - (Number(a.visitCount) || 0))
        .slice(0, 16)
        .map((n) =>
          Object.freeze({
            id: n.id,
            fen: n.fen?.slice(0, 48),
            visitCount: n.visitCount,
            sources: n.sources
          })
        )
    ),
    recentEdges: Object.freeze(
      [...graph.edges]
        .sort((a, b) => (Number(b.atMs) || 0) - (Number(a.atMs) || 0))
        .slice(0, 16)
        .map((e) => Object.freeze({ kind: e.kind, id: e.id, atMs: e.atMs }))
    ),
    atMs: Date.now()
  });
}

/** @internal checkpoint / vitest */
export function invalidateChessUnifiedMemoryGraphCacheV0() {
  cachedGraphV0 = null;
}

/** @internal vitest */
export function __resetChessUnifiedMemoryGraphForTestV0() {
  cachedGraphV0 = null;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(CHESS_UNIFIED_MEMORY_GRAPH_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
