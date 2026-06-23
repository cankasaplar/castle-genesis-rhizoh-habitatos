/**
 * FEN cluster memory — position embedding buckets for cluster-level learning.
 * RESEARCH-ONLY
 */

import { writeChessClusterMemoryNodeV0 } from "./chessClusterMemoryGraphV0.js";

export const CHESS_FEN_CLUSTER_MEMORY_SCHEMA_V0 = "castle.rhizoh.chess_fen_cluster_memory.v0";

const MAX_CLUSTERS_V0 = 512;
/** @type {Map<string, { clusterId: string, count: number, samples: object[], vector: number[] }>} */
const clusterIndexV0 = new Map();

/**
 * Normalize FEN to structural key (pieces + side + castling + ep).
 * @param {string} fen
 */
export function fenToStructuralKeyV0(fen) {
  const parts = String(fen || "").trim().split(/\s+/);
  if (parts.length < 4) return String(fen || "").slice(0, 80);
  return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
}

/**
 * Simple 8-dim piece-count vector from placement field.
 * @param {string} fen
 */
export function fenToEmbeddingVectorV0(fen) {
  const placement = String(fen || "").split(/\s+/)[0] || "";
  const counts = { P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0, p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
  for (const ch of placement) {
    if (counts[ch] != null) counts[ch] += 1;
  }
  const white = counts.P + counts.N + counts.B + counts.R + counts.Q + counts.K;
  const black = counts.p + counts.n + counts.b + counts.r + counts.q + counts.k;
  return Object.freeze([
    white / 16,
    black / 16,
    counts.N / 2,
    counts.B / 2,
    counts.R / 2,
    counts.Q,
    counts.n / 2,
    counts.r / 2
  ]);
}

/**
 * @param {string} fen
 */
export function fenToClusterIdV0(fen) {
  const key = fenToStructuralKeyV0(fen);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `fen_c_${hash.toString(36)}`;
}

/**
 * @param {string} fen
 * @param {object} observation
 */
export function rememberFenClusterObservationV0(fen, observation = {}) {
  const key = fenToStructuralKeyV0(fen);
  const clusterId = fenToClusterIdV0(fen);
  const vector = fenToEmbeddingVectorV0(fen);

  const prev = clusterIndexV0.get(key) || {
    clusterId,
    count: 0,
    samples: [],
    vector
  };
  prev.count += 1;
  prev.samples.push(Object.freeze({ ...observation, atMs: Date.now() }));
  while (prev.samples.length > 12) prev.samples.shift();
  clusterIndexV0.set(key, prev);

  while (clusterIndexV0.size > MAX_CLUSTERS_V0) {
    const first = clusterIndexV0.keys().next().value;
    clusterIndexV0.delete(first);
  }

  if (prev.count === 1 || prev.count % 8 === 0) {
    writeChessClusterMemoryNodeV0({
      kind: "fen_cluster",
      slotId: observation.slotId ?? null,
      matchId: observation.matchId ?? null,
      summary: `FEN cluster ${clusterId} · n=${prev.count}`,
      observation: Object.freeze({
        schema: CHESS_FEN_CLUSTER_MEMORY_SCHEMA_V0,
        clusterId,
        fenKey: key,
        vector,
        count: prev.count,
        last: observation
      })
    });
  }

  return Object.freeze({
    schema: CHESS_FEN_CLUSTER_MEMORY_SCHEMA_V0,
    clusterId,
    fenKey: key,
    vector,
    count: prev.count
  });
}

export function getChessFenClusterMemorySnapshotV0() {
  return Object.freeze({
    schema: CHESS_FEN_CLUSTER_MEMORY_SCHEMA_V0,
    clusterCount: clusterIndexV0.size,
    totalObservations: [...clusterIndexV0.values()].reduce((sum, c) => sum + c.count, 0),
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetChessFenClusterMemoryForTestV0() {
  clusterIndexV0.clear();
}
