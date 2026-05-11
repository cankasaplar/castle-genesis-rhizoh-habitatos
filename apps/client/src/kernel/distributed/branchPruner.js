/**
 * vNext-537 — Branch pruning: cap lineage entropy before explosion (1→8→64…).
 * Pure: returns canonical / retained / pruned + collapsed artifact fingerprint.
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

function fnv1a32Hex(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `0x${h.toString(16)}`;
}

/**
 * @typedef {object} BranchHead
 * @property {string} epochHash
 * @property {string} [lineageBranchId]
 * @property {number} [consensusScore]
 * @property {number} [lineageDepth]
 * @property {string} [parentEpochHash]
 */

/**
 * @param {object} o
 * @param {BranchHead[]} o.branches
 * @param {number} [o.maxRetain] max active branches after prune (default 4)
 * @param {number} [o.minScoreToKeep] drop weak heads (default 0.32)
 * @param {number} [o.entropyCap] soft cap on branch count before aggressive prune (default 16)
 */
export function pruneBranchLineage(o) {
  const branches = o.branches || [];
  const maxRetain = o.maxRetain ?? 4;
  const minScore = o.minScoreToKeep ?? 0.32;
  const entropyCap = o.entropyCap ?? 16;

  const sorted = [...branches].sort(
    (a, b) => (b.consensusScore ?? 0) - (a.consensusScore ?? 0)
  );

  let limit = maxRetain;
  if (branches.length > entropyCap) {
    limit = Math.max(2, Math.min(maxRetain, Math.floor(entropyCap / 4)));
  }

  const retained = sorted
    .slice(0, limit)
    .filter((b) => (b.consensusScore ?? 0) >= minScore);

  const retainedSet = new Set(retained.map((b) => b.epochHash));
  const pruned = branches.filter((b) => !retainedSet.has(b.epochHash));

  const canonical = retained[0] ?? null;
  const collapsedArtifactHash = hashCollapsedBranches(pruned);
  const branchEntropy = clamp01(branches.length / Math.max(1, entropyCap));

  return Object.freeze({
    canonical,
    retained: Object.freeze(retained),
    pruned: Object.freeze(pruned),
    collapsedArtifactHash,
    branchEntropy,
    prunedCount: pruned.length,
    prunePolicy: branches.length > entropyCap ? "aggressive_entropy_cap" : "score_top_k"
  });
}

/**
 * “Gift artifact” / archive fingerprint for collapsed forks (deterministic).
 * @param {BranchHead[]} pruned
 */
export function hashCollapsedBranches(pruned) {
  const ids = pruned
    .map((b) => `${b.epochHash}:${b.lineageBranchId ?? "?"}`)
    .sort()
    .join("|");
  return fnv1a32Hex(ids || "empty");
}
