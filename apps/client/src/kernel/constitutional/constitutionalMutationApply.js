import { POLICY_SLOTS } from "./constitutionalPolicies.js";
import { clamp01 } from "./constitutionalState.js";

/**
 * @param {object} o
 * @param {Float32Array} o.policyWeights
 * @param {{ targetPolicy: string, delta: number, id: string }} o.intent
 * @param {{ intentId: string } | null} o.mutationSeal
 * @param {number} o.now
 * @param {number} o.lastMutationAt
 * @param {number} o.minMutationInterval
 */
export function applyMutation(o) {
  if (!o.mutationSeal) {
    return {
      applied: false,
      rejectedReason: "mutation_unsealed",
      nextWeights: new Float32Array(o.policyWeights),
      deltaMax: 0
    };
  }
  if (o.mutationSeal.intentId !== o.intent.id) {
    return {
      applied: false,
      rejectedReason: "mutation_seal_mismatch",
      nextWeights: new Float32Array(o.policyWeights),
      deltaMax: 0
    };
  }
  if (o.now - o.lastMutationAt < o.minMutationInterval) {
    return {
      applied: false,
      rejectedReason: "mutation_cooldown",
      nextWeights: new Float32Array(o.policyWeights),
      deltaMax: 0
    };
  }
  const idx = POLICY_SLOTS.indexOf(o.intent.targetPolicy);
  if (idx < 0) {
    return {
      applied: false,
      rejectedReason: "unknown_policy",
      nextWeights: new Float32Array(o.policyWeights),
      deltaMax: 0
    };
  }
  const nextWeights = new Float32Array(o.policyWeights);
  const prev = nextWeights[idx];
  nextWeights[idx] = clamp01(prev + o.intent.delta);
  const deltaMax = Math.abs(nextWeights[idx] - prev);
  return { applied: true, rejectedReason: null, nextWeights, deltaMax };
}
