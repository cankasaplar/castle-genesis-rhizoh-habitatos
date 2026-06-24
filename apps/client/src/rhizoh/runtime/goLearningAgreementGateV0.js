/**
 * Go learning agreement gate — reject noisy / low-confidence positions.
 * learning = f(agreement, not events)
 * RESEARCH-ONLY
 */

export const GO_LEARNING_AGREEMENT_GATE_SCHEMA_V0 =
  "castle.rhizoh.go_learning_agreement_gate.v0";

/** Heuristic confidence floor until KataGo bridge lands. */
export const GO_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0 = 0.55;

let acceptedCountV0 = 0;
let rejectedCountV0 = 0;

/**
 * @param {{
 *   confidence?: number | null,
 *   sourceCount?: number,
 *   previewOnly?: boolean
 * }} [evalRow]
 */
export function evaluateGoLearningAgreementGateV0(evalRow = {}) {
  if (evalRow.previewOnly === true) {
    return Object.freeze({
      schema: GO_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      reason: "heuristic_preview",
      confidence: null,
      threshold: GO_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
      atMs: Date.now()
    });
  }

  const confidence = Number(evalRow.confidence);
  const sourceCount = Number(evalRow.sourceCount) || 0;

  if (!Number.isFinite(confidence) || sourceCount < 1) {
    rejectedCountV0 += 1;
    return Object.freeze({
      schema: GO_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      reason: "no_eval",
      confidence: Number.isFinite(confidence) ? confidence : null,
      threshold: GO_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
      atMs: Date.now()
    });
  }

  if (confidence < GO_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0) {
    rejectedCountV0 += 1;
    return Object.freeze({
      schema: GO_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      reason: "low_confidence",
      confidence,
      threshold: GO_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
      atMs: Date.now()
    });
  }

  acceptedCountV0 += 1;
  return Object.freeze({
    schema: GO_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
    accepted: true,
    learningEligible: true,
    reason: "agreement_ok",
    confidence,
    threshold: GO_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
    atMs: Date.now()
  });
}

export function getGoLearningAgreementGateSnapshotV0() {
  return Object.freeze({
    schema: `${GO_LEARNING_AGREEMENT_GATE_SCHEMA_V0}.snapshot`,
    accepted: acceptedCountV0,
    rejected: rejectedCountV0,
    threshold: GO_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function resetGoLearningAgreementGateForTestV0() {
  acceptedCountV0 = 0;
  rejectedCountV0 = 0;
}
