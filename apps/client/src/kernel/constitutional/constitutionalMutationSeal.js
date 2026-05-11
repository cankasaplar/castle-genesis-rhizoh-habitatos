import { clamp01 } from "./constitutionalState.js";

/**
 * @param {object} o
 * @param {string} o.intentId
 * @param {number} o.tier
 * @param {number} o.confidence
 * @param {number} o.reviewScore
 * @param {number} o.timestamp
 */
export function createMutationSeal(o) {
  return Object.freeze({
    sealId: `mseal_${o.timestamp}_${o.intentId}`,
    intentId: o.intentId,
    tier: o.tier,
    confidence: clamp01(o.confidence),
    reviewScore: clamp01(o.reviewScore),
    timestamp: o.timestamp
  });
}

/**
 * @param {Array<{ mutationSeal?: { sealId: string } | null }>} trace
 */
export function hashMutationHistory(trace) {
  let x = 2166136261;
  for (const item of trace) {
    const sealId = item?.mutationSeal?.sealId || "none";
    for (let i = 0; i < sealId.length; i++) {
      x ^= sealId.charCodeAt(i);
      x = Math.imul(x, 16777619) >>> 0;
    }
  }
  return `0x${x.toString(16)}`;
}
