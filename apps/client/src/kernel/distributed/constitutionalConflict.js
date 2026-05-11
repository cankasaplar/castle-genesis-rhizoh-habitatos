/**
 * vNext-537 — Conflict provenance: why did this merge / fork tension exist?
 * Pure classification for shared-world + multi-stream coordination.
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

export const CONFLICT_CLASSES = Object.freeze([
  "semantic_conflict",
  "legitimacy_conflict",
  "epistemic_conflict",
  "temporal_conflict",
  "identity_conflict",
  "resource_conflict"
]);

/**
 * @param {object} o
 * @param {object} o.left
 * @param {object} o.right
 * @param {{ constitutionalSimilarity?: number } | null} [o.mergeMeta] from mergeEpochLineages
 * @param {string} [o.leftBranchId]
 * @param {string} [o.rightBranchId]
 * @param {boolean} [o.sameParent] both heads share previousEpochHash
 * @param {number} [o.clockSkewMs] simulated or observed clock skew
 * @param {boolean} [o.storeHashCollision] same region / shard wrote divergent store
 * @param {Record<string, number> | null} [o.leftObservationFilter] e.g. coherenceLift, salienceBoost…
 * @param {Record<string, number> | null} [o.rightObservationFilter]
 */
export function classifyConstitutionalConflict(o) {
  const mergeMeta = o.mergeMeta || {};
  const sim = clamp01(mergeMeta.constitutionalSimilarity ?? 0.5);

  const cL = o.left?.atomicSnapshot?.constitution?.confidence ?? 0.5;
  const cR = o.right?.atomicSnapshot?.constitution?.confidence ?? 0.5;
  const kL = o.left?.atomicSnapshot?.constitution?.contradiction ?? 0.2;
  const kR = o.right?.atomicSnapshot?.constitution?.contradiction ?? 0.2;

  const legL = clamp01(o.left?.legitimacyResonance ?? 0.45);
  const legR = clamp01(o.right?.legitimacyResonance ?? 0.45);

  const semanticScore = clamp01((1 - sim) * 0.72 + Math.abs(kL - kR) * 0.28);
  const legitimacyScore = clamp01(Math.abs(legL - legR) * 1.15);
  const temporalScore = clamp01(Math.min(1, (o.clockSkewMs ?? 0) / 8000));
  const identityScore =
    o.sameParent && o.leftBranchId && o.rightBranchId && o.leftBranchId !== o.rightBranchId
      ? clamp01((1 - sim) * 0.55 + Math.abs(cL - cR) * 0.45)
      : 0;
  const resourceScore = o.storeHashCollision ? 1 : 0;
  const epistemicScore = observationFilterDivergence(o.leftObservationFilter, o.rightObservationFilter);

  /** @type {Record<string, number>} */
  const scores = {
    semantic_conflict: semanticScore,
    legitimacy_conflict: legitimacyScore,
    epistemic_conflict: epistemicScore,
    temporal_conflict: temporalScore,
    identity_conflict: identityScore,
    resource_conflict: resourceScore
  };

  let conflictClass = "semantic_conflict";
  let max = -1;
  for (const cls of CONFLICT_CLASSES) {
    const v = scores[cls] ?? 0;
    if (v > max) {
      max = v;
      conflictClass = cls;
    }
  }

  const severity = clamp01(max);
  const resolutionPath = pickResolutionPath(conflictClass, severity, sim);

  return Object.freeze({
    conflictClass,
    severity,
    resolutionPath,
    scores: Object.freeze({ ...scores })
  });
}

const OBS_FILTER_KEYS = Object.freeze([
  "coherenceLift",
  "uncertaintyDamp",
  "salienceBoost",
  "noveltyDamp",
  "conflictDamp"
]);

/**
 * Same substrate, different perception shaping — Rhizoh-specific.
 * @param {Record<string, number> | null | undefined} a
 * @param {Record<string, number> | null | undefined} b
 */
export function observationFilterDivergence(a, b) {
  if (!a || !b) return 0;
  let sum = 0;
  for (const k of OBS_FILTER_KEYS) {
    const x = typeof a[k] === "number" ? a[k] : 0;
    const y = typeof b[k] === "number" ? b[k] : 0;
    sum += Math.abs(x - y);
  }
  return clamp01((sum / OBS_FILTER_KEYS.length) * 1.8);
}

/**
 * @param {string} conflictClass
 * @param {number} severity
 * @param {number} similarity
 */
function pickResolutionPath(conflictClass, severity, similarity) {
  if (severity < 0.22) return "merge_auto";
  if (conflictClass === "semantic_conflict") {
    if (severity > 0.72 && similarity < 0.35) return "consensus_merge";
    if (severity > 0.55) return "re_verify_symbolic";
    return "merge_weighted_field";
  }
  if (conflictClass === "legitimacy_conflict") {
    return severity > 0.65 ? "legitimacy_review_tier" : "merge_legitimacy_average";
  }
  if (conflictClass === "epistemic_conflict") {
    if (severity > 0.68) return "perception_recalibrate_dual";
    if (severity > 0.42) return "observation_filter_blend_ema";
    return "merge_perception_soft";
  }
  if (conflictClass === "temporal_conflict") {
    return severity > 0.5 ? "chronos_reorder_partial" : "merge_timestamp_lww";
  }
  if (conflictClass === "identity_conflict") {
    return severity > 0.6 ? "fork_retain_dual_worldline" : "branch_rename_canonical";
  }
  if (conflictClass === "resource_conflict") {
    return "partition_shard_reconcile";
  }
  return "merge_auto";
}
