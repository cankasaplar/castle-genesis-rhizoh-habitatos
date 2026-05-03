/**
 * Castle Runtime Merge Layer (v0)
 *
 * Target architecture (CASTLE GENESIS):
 *   Studio (control room) → Runtime Core (this layer + temporal spine) → SpiralMMO (social graph) → UI/L10
 *
 * v0 scope:
 * - Explicit merge-commit scope for continuity writes (single logical transaction per tick).
 * - Lightweight runtime “heads” snapshot for debugging / future Studio coupling.
 * - LLM + tick interleaving: callers may nest the same scope when identity + continuity must align.
 *
 * Not yet: full atomic localStorage across identity + continuity (browser has no true TX).
 * Next: enqueue exclusive async chain for tick vs async LLM persist.
 */

export const RUNTIME_MERGE_CONTRACT_VERSION = 1;

/** @type {number} */
let _mergeDepth = 0;
/** @type {number} */
let _mergeSeq = 0;

export function isInsideRuntimeMergeCommit() {
  return _mergeDepth > 0;
}

export function getLastRuntimeMergeId() {
  try {
    return typeof window !== "undefined" ? window.__CASTLE_LAST_MERGE_ID__ || null : null;
  } catch {
    return null;
  }
}

/**
 * Marks a synchronous bundle of continuity / registry updates as one logical commit.
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function withRuntimeMergeCommit(fn) {
  const mergeId = `rm_${Date.now().toString(36)}_${(_mergeSeq++).toString(36)}`;
  try {
    if (typeof window !== "undefined") window.__CASTLE_LAST_MERGE_ID__ = mergeId;
  } catch {
    /* noop */
  }
  _mergeDepth += 1;
  try {
    return fn();
  } finally {
    _mergeDepth -= 1;
  }
}

/**
 * @param {{
 *   readClientContinuity: () => { meta?: Record<string, unknown> },
 *   readIdentityGraph?: () => { updatedAt?: number }
 * }} io
 */
export function snapshotRuntimeHeadsV0(io) {
  const disk = io.readClientContinuity && typeof io.readClientContinuity === "function" ? io.readClientContinuity() : {};
  const meta = disk.meta && typeof disk.meta === "object" ? disk.meta : {};
  const tcee = meta.tceeBoot && typeof meta.tceeBoot === "object" ? meta.tceeBoot : {};
  let identityAt = null;
  try {
    const ig = io.readIdentityGraph && typeof io.readIdentityGraph === "function" ? io.readIdentityGraph() : null;
    identityAt = ig && typeof ig.updatedAt === "number" ? ig.updatedAt : null;
  } catch {
    identityAt = null;
  }
  return {
    contractVersion: RUNTIME_MERGE_CONTRACT_VERSION,
    continuityMetaKeys: Object.keys(meta).length,
    tceePhase: tcee.phase != null ? String(tcee.phase) : null,
    memoryClockEpoch: tcee.memoryClockEpoch != null ? Number(tcee.memoryClockEpoch) : null,
    identityUpdatedAt: identityAt,
    insideMergeCommit: isInsideRuntimeMergeCommit()
  };
}
