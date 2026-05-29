/**
 * Phase 22 guard — Multi-observer entanglement risk (BLOCK coupling).
 *
 * Observer telemetry + resonance MUST NOT merge into self-correlating observation field.
 */

import { EPISTEMIC_EVENT_CLASS_V0 } from "../epistemicEventBusV0.js";

export const ENTANGLEMENT_GUARD_SCHEMA_V0 =
  "castle.rhizoh.multi_observer_entanglement_guard.v0.22";

export const ENTANGLEMENT_COUPLING_FORBIDDEN_V0 =
  "observer_resonance_merge_forbidden";

/**
 * @typedef {Object} EntanglementRiskAssessmentV0
 * @property {string} schema
 * @property {string} riskLevel
 * @property {number} riskScore
 * @property {boolean} entanglementCouplingAllowed
 * @property {boolean} entanglementLoopBlocked
 * @property {string} statement
 * @property {{ observerEventCount: number, physicsEventCount: number, resonancePairCount: number }} counts
 */

/**
 * Read-only risk assessment — never enables coupling.
 *
 * @param {{
 *   trace: readonly import('../epistemicEventBusV0.js').EpistemicEventEnvelopeV0[],
 *   resonanceReport?: { pairs?: unknown[] } | null,
 *   attemptedCoupling?: boolean
 * }} input
 */
export function assessObserverResonanceEntanglementRiskV0(input) {
  const trace = input.trace || [];
  const observerCount = trace.filter(
    (e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.OBSERVER
  ).length;
  const physicsCount = trace.filter(
    (e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.PHYSICS
  ).length;
  const pairCount = input.resonanceReport?.pairs?.length ?? 0;

  let riskScore = 0;
  if (observerCount > 0 && pairCount > 0) riskScore += 0.35;
  if (observerCount > 3 && physicsCount > 5) riskScore += 0.25;
  if (input.attemptedCoupling === true) riskScore = 1;

  const riskLevel =
    riskScore >= 0.75 ? "critical" : riskScore >= 0.45 ? "elevated" : "low";

  return Object.freeze({
    schema: ENTANGLEMENT_GUARD_SCHEMA_V0,
    riskLevel,
    riskScore: Number(riskScore.toFixed(4)),
    entanglementCouplingAllowed: false,
    entanglementLoopBlocked: true,
    statement:
      riskScore >= 0.45
        ? "Observer–resonance merge would create self-conditioning; coupling blocked by EFIR policy."
        : "No entanglement coupling requested; observation planes remain separated.",
    counts: {
      observerEventCount: observerCount,
      physicsEventCount: physicsCount,
      resonancePairCount: pairCount
    }
  });
}
