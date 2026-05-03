/**
 * Identity ↔ physics closure — inject at N-body (pairwise) layer only, not grid / room tension.
 * recall → CSIL micro-shift → edge F_ij → future recall weighting.
 */

const CLOSURE_TTL_MS = 180_000;

/**
 * @param {unknown} closure
 * @param {number} [now]
 */
export function isRecallClosureActive(closure, now = Date.now()) {
  if (!closure || typeof closure !== "object") return false;
  const t = Number(now) || Date.now();
  const age = t - Number(closure.at || 0);
  return Number.isFinite(age) && age >= 0 && age <= CLOSURE_TTL_MS;
}

/**
 * @param {Record<string, unknown>} closure
 */
export function closureTrustFamSum(closure) {
  const td = Number(closure.trustDelta) || 0;
  const fd = Number(closure.familiarityDelta) || 0;
  return td + fd;
}

/**
 * @param {Record<string, unknown>} feedback — computeIdentityFeedbackFromRecall output
 */
export function recallClosurePayloadForMeta(feedback) {
  if (!feedback || typeof feedback !== "object") return null;
  return {
    trustDelta: feedback.trustDelta,
    familiarityDelta: feedback.familiarityDelta,
    diversityPenalty: feedback.diversityPenalty,
    anchorSkew: feedback.anchorSkew,
    at: Date.now()
  };
}
