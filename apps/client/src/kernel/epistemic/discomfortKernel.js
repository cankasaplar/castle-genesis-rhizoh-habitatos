/**
 * Epistemic discomfort — expected vs observed, policy vs action, memory vs reality, proof vs uncertainty.
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @param {object} signals
 * @param {number} [signals.expectedVsObserved]
 * @param {number} [signals.policyVsAction]
 * @param {number} [signals.memoryVsReality]
 * @param {number} [signals.proofVsUncertainty]
 */
export function measureDiscomfort(signals = {}) {
  const a = clamp01(signals.expectedVsObserved ?? 0.25);
  const b = clamp01(signals.policyVsAction ?? 0.22);
  const c = clamp01(signals.memoryVsReality ?? 0.2);
  const d = clamp01(signals.proofVsUncertainty ?? 0.28);
  return clamp01(0.28 * a + 0.26 * b + 0.24 * c + 0.22 * d);
}
