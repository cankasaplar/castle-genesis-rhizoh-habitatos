import { clamp01 } from "./constitutionalState.js";

/**
 * @param {object} o
 * @param {number} o.currentValue
 * @param {number} o.delta
 * @param {number} o.contradiction
 * @param {number} o.drift
 * @param {number} o.resonance
 * @param {number} o.stabilityHorizonMin
 */
export function verifyMutation(o) {
  const nextValue = clamp01(o.currentValue + o.delta);
  const invariantBroken = nextValue < 0 || nextValue > 1;
  const contradictionImproves = o.contradiction >= 0.5 ? o.delta < 0 : true;
  const runawayRisk = clamp01(o.drift * 0.55 + (1 - o.resonance) * 0.45);
  const stableHorizon = o.stabilityHorizonMin >= 3;
  const confidence = clamp01(
    0.35 * (invariantBroken ? 0 : 1) +
      0.25 * (contradictionImproves ? 1 : 0) +
      0.25 * (1 - runawayRisk) +
      0.15 * (stableHorizon ? 1 : 0)
  );
  const pass = !invariantBroken && contradictionImproves && runawayRisk < 0.72 && stableHorizon;
  return {
    pass,
    confidence,
    invariantBroken,
    contradictionImproves,
    runawayRisk,
    stabilityHorizon: o.stabilityHorizonMin,
    rejectedReason: pass ? null : "mutation_verification_failed"
  };
}
