/**
 * Projection-safe influence reduction — meta layers cannot carry simulation sovereign echo
 * into active runtime shaper scores (soft contamination guard).
 */

import { isClagSimulationGeographicAnchorIdV0 } from "./rhizohClagNodeRegistryV0.js";

export const RHIZOH_CLAG_PROJECTION_SAFE_INFLUENCE_SCHEMA_V0 =
  "castle.rhizoh.clag_projection_safe_influence.v0";

const META_LAYER_KEYS_V0 = Object.freeze(["narrative", "academy"]);
const REDUCTION_WHEN_CONTAMINATION_V0 = 0.45;
const REDUCTION_WHEN_SOFT_RISK_V0 = 0.25;

/**
 * @param {Record<string, unknown> | null | undefined} clagSnap
 */
function assessSoftContaminationRiskV0(clagSnap) {
  if (!clagSnap || typeof clagSnap !== "object") {
    return Object.freeze({ softRisk: false, reasons: Object.freeze([]) });
  }

  /** @type {string[]} */
  const reasons = [];
  const contamination = clagSnap.graphContamination;
  if (contamination?.detected === true) {
    reasons.push("graph_contamination_detected");
  }

  const hints = clagSnap.memoryShapingHints;
  const spatial = String(hints?.spatialEcho || "");
  if (isClagSimulationGeographicAnchorIdV0(spatial) || /sariyer/i.test(spatial)) {
    reasons.push("spatial_echo_simulation_anchor");
  }

  const blocked = contamination?.blockedNodeIds;
  if (Array.isArray(blocked) && blocked.length > 0) {
    reasons.push("blocked_nodes_in_full_graph");
  }

  return Object.freeze({
    softRisk: reasons.length > 0,
    reasons: Object.freeze(reasons)
  });
}

/**
 * @param {Record<string, number>} scores
 * @param {number} factor
 */
function reduceMetaLayerScoresV0(scores, factor) {
  const out = { ...scores };
  for (const key of META_LAYER_KEYS_V0) {
    if (out[key] != null) {
      out[key] = Math.round(Number(out[key]) * factor * 1000) / 1000;
    }
  }
  return out;
}

/**
 * @param {string} dominant
 * @param {Record<string, number>} scores
 */
function pickDominantFromScoresV0(dominant, scores) {
  const entries = Object.entries(scores || {}).filter(([, v]) => Number(v) > 0);
  if (!entries.length) return dominant || "unknown";
  entries.sort((a, b) => Number(b[1]) - Number(a[1]));
  const top = Number(entries[0][1]);
  const tied = entries.filter(([, v]) => Number(v) >= top * 0.92).map(([k]) => k);
  if (tied.length > 1) return tied.join("+");
  return entries[0][0];
}

/**
 * @param {ReturnType<import("./rhizohConversationInfluenceInstrumentationV0.js").buildRhizohTurnInfluencePreLlmV0>} pre
 * @param {Record<string, unknown> | null | undefined} [clagSnap]
 */
export function applyProjectionSafeInfluenceReductionV0(pre, clagSnap = null) {
  const snap =
    clagSnap ||
    (typeof window !== "undefined" ? window.__CASTLE_RHIZOH_CLAG_INTERNAL__ : null);
  const risk = assessSoftContaminationRiskV0(snap);
  const rawScores =
    pre?.shaperScores && typeof pre.shaperScores === "object" ? { ...pre.shaperScores } : {};

  if (!risk.softRisk) {
    return Object.freeze({
      schema: RHIZOH_CLAG_PROJECTION_SAFE_INFLUENCE_SCHEMA_V0,
      projectionSafe: true,
      softContaminationRisk: false,
      reductionApplied: false,
      shaperScores: Object.freeze(rawScores),
      dominantShaper: pre?.dominantShaper ?? "unknown",
      shapingAnswer: pre?.shapingAnswer ?? null,
      risk
    });
  }

  const factor =
    snap?.graphContamination?.detected === true
      ? REDUCTION_WHEN_CONTAMINATION_V0
      : REDUCTION_WHEN_SOFT_RISK_V0;
  const reduced = reduceMetaLayerScoresV0(rawScores, factor);
  const dominantShaper = pickDominantFromScoresV0(pre?.dominantShaper, reduced);

  return Object.freeze({
    schema: RHIZOH_CLAG_PROJECTION_SAFE_INFLUENCE_SCHEMA_V0,
    projectionSafe: true,
    softContaminationRisk: true,
    reductionApplied: true,
    reductionFactor: factor,
    reducedLayers: META_LAYER_KEYS_V0,
    shaperScores: Object.freeze(reduced),
    dominantShaper,
    shapingAnswer:
      dominantShaper.includes("narrative") || dominantShaper.includes("academy")
        ? "projection_safe_meta_damped_active_sovereign_only"
        : pre?.shapingAnswer ?? null,
    risk
  });
}
