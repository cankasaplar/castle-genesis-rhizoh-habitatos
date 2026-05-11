/**
 * policyMutation — EMA policy nudges, epsilon-capped; capability-gated.
 */

import { CapabilityToken } from "../sovereignChronos.js";
import { clamp01 } from "./constitutionalState.js";
import { POLICY_ACTION_MUTATE } from "./constitutionalPolicies.js";

/**
 * @param {object} o
 * @param {Float32Array} o.policyWeights
 * @param {number} o.driftSignal
 * @param {number} o.contradiction
 * @param {CapabilityToken | null} o.capability
 * @param {number} o.simTime
 * @param {number} [o.epsilon]
 */
export function computePolicyMutation(o) {
  const epsilon = o.epsilon ?? 0.04;
  const cap = o.capability;
  if (!cap || !(cap instanceof CapabilityToken) || !cap.allows(POLICY_ACTION_MUTATE, o.simTime)) {
    return {
      applied: false,
      rejectedReason: "capability_denied",
      nextWeights: new Float32Array(o.policyWeights),
      deltaMax: 0
    };
  }

  const w = new Float32Array(o.policyWeights);
  const scale = clamp01(o.driftSignal * 0.55 + o.contradiction * 0.35);
  const targets = [
    clamp01(w[0] - scale * 0.02),
    clamp01(w[1] + scale * 0.015),
    clamp01(w[2] - scale * 0.025),
    clamp01(w[3] + scale * 0.01),
    clamp01(w[4] + scale * 0.018)
  ];

  let deltaMax = 0;
  for (let i = 0; i < w.length; i++) {
    let d = targets[i] - w[i];
    if (d > epsilon) d = epsilon;
    if (d < -epsilon) d = -epsilon;
    deltaMax = Math.max(deltaMax, Math.abs(d));
    w[i] = clamp01(w[i] + d);
  }

  return { applied: true, rejectedReason: null, nextWeights: w, deltaMax };
}
