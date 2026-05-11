import { CapabilityToken } from "../sovereignChronos.js";
import { POLICY_ACTION_MUTATE, POLICY_SLOTS } from "./constitutionalPolicies.js";
import { clamp01 } from "./constitutionalState.js";

/**
 * @param {object} o
 * @param {Float32Array} o.policyWeights
 * @param {number} o.driftSignal
 * @param {number} o.contradiction
 * @param {number} o.discomfort
 * @param {number} o.resonance
 * @param {number} o.proofPressure
 * @param {number} o.now
 * @param {number} o.simTime
 * @param {CapabilityToken | null} o.capability
 * @param {string} o.reason
 */
export function createMutationIntent(o) {
  const reason = (o.reason || "").trim();
  if (!reason) {
    return { ok: false, rejectedReason: "missing_reason", intent: null };
  }
  const cap = o.capability;
  if (!cap || !(cap instanceof CapabilityToken) || !cap.allows(POLICY_ACTION_MUTATE, o.simTime)) {
    return { ok: false, rejectedReason: "capability_denied", intent: null };
  }

  const score = clamp01(o.driftSignal * 0.45 + o.contradiction * 0.35 + o.discomfort * 0.2);
  const targetIdx = score >= 0.66 ? 2 : score >= 0.42 ? 0 : 1;
  const current = o.policyWeights[targetIdx] ?? 0.5;
  const sign = targetIdx === 2 ? -1 : 1;
  const magnitude = clamp01(score * 0.03 + (1 - o.resonance) * 0.01);
  const delta = sign * magnitude;
  const intent = Object.freeze({
    id: `intent_${o.now}_${targetIdx}`,
    targetPolicy: POLICY_SLOTS[targetIdx],
    delta,
    reason,
    proofPressure: clamp01(o.proofPressure),
    contradiction: clamp01(o.contradiction),
    discomfort: clamp01(o.discomfort),
    resonance: clamp01(o.resonance),
    createdAt: o.now
  });
  return { ok: true, rejectedReason: null, intent, targetIndex: targetIdx, current };
}
