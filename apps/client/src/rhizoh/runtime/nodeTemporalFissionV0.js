/**
 * Node Temporal Fission v0 — break "one node, many timestamps" collapse.
 * Same base node_id + different atMs → versioned evolution line (not temporal spam).
 */

export const NODE_TEMPORAL_FISSION_SCHEMA_V0 = "castle.rhizoh.node_temporal_fission.v0";

/** @type {Map<string, { version: number, atMs: number, semanticSeed: string }>} */
const evolutionLineByBaseIdV0 = new Map();

/**
 * @param {string} seed
 */
function fnv1a32HexV0(seed) {
  let h = 0x811c9dc5;
  const s = String(seed || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * @param {string} baseNodeId
 */
export function stripNodeVersionSuffixV0(baseNodeId) {
  const id = String(baseNodeId || "").trim();
  const idx = id.indexOf(":v");
  if (idx > 0 && /^:v\d+$/.test(id.slice(idx))) return id.slice(0, idx);
  return id;
}

/**
 * Deterministic hash id when version suffix is not desired.
 * @param {{ atMs: number, semanticSeed?: string }} input
 */
export function deriveTemporalFissionHashIdV0(input) {
  const atMs = Math.floor(Number(input.atMs) || 0);
  const seed = String(input.semanticSeed || "genesis").trim();
  const digest = fnv1a32HexV0(`${atMs}|${seed}`);
  return `nid_${digest}`;
}

/**
 * Versioned node id: base:vN — breaks temporal clone collapse while preserving lineage.
 * @param {{ baseNodeId: string, atMs: number, semanticSeed?: string }} input
 */
export function resolveVersionedEvolutionNodeIdV0(input) {
  const base = stripNodeVersionSuffixV0(input.baseNodeId);
  if (!base) return { nodeId: "", version: 0, evolved: false, reason: "missing_base" };

  const atMs = Math.floor(Number(input.atMs) || Date.now());
  const semanticSeed = String(input.semanticSeed || "spatial").trim();
  const prev = evolutionLineByBaseIdV0.get(base);

  if (!prev) {
    evolutionLineByBaseIdV0.set(base, { version: 1, atMs, semanticSeed });
    return Object.freeze({ nodeId: `${base}:v1`, version: 1, evolved: false, baseNodeId: base });
  }

  if (prev.atMs === atMs && prev.semanticSeed === semanticSeed) {
    return Object.freeze({
      nodeId: `${base}:v${prev.version}`,
      version: prev.version,
      evolved: false,
      baseNodeId: base
    });
  }

  const nextVersion = prev.version + 1;
  evolutionLineByBaseIdV0.set(base, { version: nextVersion, atMs, semanticSeed });
  return Object.freeze({
    nodeId: `${base}:v${nextVersion}`,
    version: nextVersion,
    evolved: true,
    baseNodeId: base,
    priorVersion: prev.version
  });
}

/**
 * Detect temporal clones: same node_id, multiple distinct atMs (graph topology absent).
 * @param {ReadonlyArray<{ nodeId?: string, id?: string, atMs?: number }>} rows
 */
export function detectTemporalNodeClonesV0(rows) {
  /** @type {Map<string, Set<number>>} */
  const atMsById = new Map();
  for (const row of rows || []) {
    const id = stripNodeVersionSuffixV0(String(row.nodeId || row.id || "").trim());
    const atMs = Math.floor(Number(row.atMs) || 0);
    if (!id || !atMs) continue;
    if (!atMsById.has(id)) atMsById.set(id, new Set());
    atMsById.get(id).add(atMs);
  }

  /** @type {object[]} */
  const clones = [];
  for (const [nodeId, times] of atMsById) {
    if (times.size > 1) {
      clones.push(
        Object.freeze({
          nodeId,
          distinctAtMs: Object.freeze([...times].sort((a, b) => a - b)),
          cloneCount: times.size,
          issue: "temporal_clone_collapse"
        })
      );
    }
  }

  return Object.freeze({
    cloneCount: clones.length,
    temporalSpam: clones.length > 0,
    clones: Object.freeze(clones)
  });
}

/**
 * Rewrite rows with versioned node ids — one evolution line per base id.
 * @param {ReadonlyArray<{ nodeId?: string, id?: string, atMs?: number, semanticSeed?: string, [key: string]: unknown }>} rows
 */
export function dedupeTemporalNodeRowsV0(rows) {
  /** @type {object[]} */
  const out = [];
  let fissionCount = 0;

  for (const row of rows || []) {
    const base = stripNodeVersionSuffixV0(String(row.nodeId || row.id || "").trim());
    const atMs = Math.floor(Number(row.atMs) || Date.now());
    if (!base) {
      out.push(row);
      continue;
    }
    const resolved = resolveVersionedEvolutionNodeIdV0({
      baseNodeId: base,
      atMs,
      semanticSeed: String(row.semanticSeed || row.kind || "row")
    });
    if (resolved.evolved) fissionCount += 1;
    out.push(
      Object.freeze({
        ...row,
        nodeId: resolved.nodeId,
        id: resolved.nodeId,
        evolutionLine: Object.freeze({
          baseNodeId: base,
          version: resolved.version,
          fissionApplied: resolved.evolved
        })
      })
    );
  }

  return Object.freeze({
    rows: Object.freeze(out),
    fissionCount,
    inputCount: (rows || []).length
  });
}

/** @internal vitest */
export function __resetNodeTemporalFissionForTestV0() {
  evolutionLineByBaseIdV0.clear();
}
