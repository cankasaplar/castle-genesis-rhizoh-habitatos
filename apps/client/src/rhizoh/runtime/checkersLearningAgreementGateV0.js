/**
 * Checkers learning agreement gate — RESEARCH-ONLY
 */

export const CHECKERS_LEARNING_AGREEMENT_GATE_SCHEMA_V0 =
  "castle.rhizoh.checkers_learning_agreement_gate.v0";

export const CHECKERS_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0 = 0.55;

let acceptedCountV0 = 0;
let rejectedCountV0 = 0;

/**
 * @param {{ confidence?: number | null, sourceCount?: number, previewOnly?: boolean }} [evalRow]
 */
export function evaluateCheckersLearningAgreementGateV0(evalRow = {}) {
  if (evalRow.previewOnly === true) {
    return Object.freeze({
      schema: CHECKERS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      reason: "heuristic_preview",
      confidence: null,
      threshold: CHECKERS_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
      atMs: Date.now()
    });
  }

  const confidence = Number(evalRow.confidence);
  const sourceCount = Number(evalRow.sourceCount) || 0;

  if (!Number.isFinite(confidence) || sourceCount < 1) {
    rejectedCountV0 += 1;
    return Object.freeze({
      schema: CHECKERS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      reason: "no_eval",
      confidence: Number.isFinite(confidence) ? confidence : null,
      threshold: CHECKERS_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
      atMs: Date.now()
    });
  }

  if (confidence < CHECKERS_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0) {
    rejectedCountV0 += 1;
    return Object.freeze({
      schema: CHECKERS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      reason: "low_confidence",
      confidence,
      threshold: CHECKERS_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
      atMs: Date.now()
    });
  }

  acceptedCountV0 += 1;
  return Object.freeze({
    schema: CHECKERS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
    accepted: true,
    learningEligible: true,
    reason: "agreement_ok",
    confidence,
    threshold: CHECKERS_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
    atMs: Date.now()
  });
}

export function getCheckersLearningAgreementGateSnapshotV0() {
  return Object.freeze({
    schema: `${CHECKERS_LEARNING_AGREEMENT_GATE_SCHEMA_V0}.snapshot`,
    accepted: acceptedCountV0,
    rejected: rejectedCountV0,
    threshold: CHECKERS_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function resetCheckersLearningAgreementGateForTestV0() {
  acceptedCountV0 = 0;
  rejectedCountV0 = 0;
}
