import { clamp01 } from "./constitutionalState.js";

/**
 * @param {object} o
 * @param {{ targetPolicy: string, delta: number }} o.intent
 * @param {number} o.epsilon
 * @param {string[]} [o.allowedPolicies]
 */
export function runConstitutionalReview({ intent, epsilon, allowedPolicies = [] }) {
  const legality = allowedPolicies.length === 0 || allowedPolicies.includes(intent.targetPolicy) ? 1 : 0;
  const scope = Math.abs(intent.delta) <= epsilon ? 1 : 0;
  const proportionality = clamp01(1 - Math.max(0, Math.abs(intent.delta) - epsilon) / (epsilon || 1));
  const reversibility = clamp01(1 - Math.abs(intent.delta) / Math.max(epsilon * 2, 0.001));
  const reviewScore = clamp01(0.35 * legality + 0.25 * scope + 0.25 * proportionality + 0.15 * reversibility);
  const pass = legality > 0 && scope > 0 && reviewScore >= 0.6;
  return {
    pass,
    reviewScore,
    checks: { legality, scope, proportionality, reversibility },
    rejectedReason: pass ? null : "constitutional_review_failed"
  };
}
