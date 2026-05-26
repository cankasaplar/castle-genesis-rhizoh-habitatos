/**
 * RESEARCH-ONLY: Epistemic Identity Continuity & Subject Persistence (Phase 9 lab)
 *
 * Frozen core, IDB v3, and production watchdog MUST NOT import this module.
 * Serves as foundational spec + pure logical simulation.
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "../walHashChainV0.js";

export const EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0 =
  "castle.rhizoh.epistemic_identity_continuity.research.v0";

export const WITNESS_SEMANTICS_SCHEMA_V0 = "castle.rhizoh.witness_semantics.research.v0";

/** @readonly */
export const IDENTITY_CONTINUITY_VERDICT_V0 = Object.freeze({
  SAME_SUBJECT: "same_subject",
  SAME_SUBJECT_LOW_CONFIDENCE: "same_subject_low_confidence",
  LINEAGE_OK_IDENTITY_FORK: "lineage_ok_identity_fork",
  IDENTITY_DRIFT: "identity_drift",
  UNRELATED: "unrelated"
});

/**
 * Arbitration hints only — NOT execution gates.
 * @readonly
 */
export const IDENTITY_ARBITRATION_ACTION_V0 = Object.freeze({
  ALLOW_AS_SAME_SUBJECT: "ALLOW_AS_SAME_SUBJECT",
  ALLOW_DEGRADED_OBSERVABILITY: "ALLOW_DEGRADED_OBSERVABILITY",
  GENERATE_TEMPORAL_IDENTITY_ID: "GENERATE_TEMPORAL_IDENTITY_ID",
  OBSERVE_ONLY: "OBSERVE_ONLY",
  RECOMMEND_QUARANTINE: "RECOMMEND_QUARANTINE"
});

/** Confidence at or above → same_subject */
export const IDENTITY_CONFIDENCE_HIGH_V0 = 0.92;
/** Between low and high → same_subject_low_confidence */
export const IDENTITY_CONFIDENCE_LOW_V0 = 0.62;
/** Witness weight drift within this band → identity_drift */
export const WITNESS_DRIFT_SOFT_MAX_V0 = 2;
export const WITNESS_DRIFT_HARD_MAX_V0 = 6;

/**
 * @typedef {Object} WitnessAnchorInputV0
 * @property {number} [weight]
 * @property {string} [class]
 * @property {number} [decayRate]
 * @property {number} [lastWitnessAtMs]
 */

/**
 * @typedef {Object} WitnessSemanticsV0
 * @property {string} schema
 * @property {number} aggregateWeight
 * @property {number} decayScore
 * @property {number} stabilityScore
 * @property {string} semanticsDigest
 */

/**
 * @typedef {Object} EpistemicFingerprintV0
 * @property {string} schema
 * @property {string} epistemicFingerprintId
 * @property {string} observabilityBoundaryDigest
 * @property {number} derivedAtMs
 * @property {WitnessSemanticsV0} witnessSemantics
 */

/**
 * Formal witness meaning — prevents identity_drift from looking like a model bug.
 *
 * @param {WitnessAnchorInputV0 | null | undefined} witnessAnchor
 * @param {{ nowMs?: number }} [opts]
 */
export function deriveWitnessSemanticsV0(witnessAnchor, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  const weight = Math.max(0, Number(witnessAnchor?.weight) || 0);
  const decayRate = Math.max(0, Math.min(1, Number(witnessAnchor?.decayRate) || 0));
  const anchorClass = String(witnessAnchor?.class || "unspecified");
  const lastWitnessAtMs = Number(witnessAnchor?.lastWitnessAtMs) || nowMs;
  const ageMs = Math.max(0, nowMs - lastWitnessAtMs);
  const decayScore = Math.min(1, decayRate + ageMs / 3_600_000);
  const stabilityScore = Math.max(0, 1 - decayScore);

  const semanticsDigest = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    weight,
    decayRate,
    anchorClass,
    ageMs: Math.floor(ageMs)
  });

  return {
    schema: WITNESS_SEMANTICS_SCHEMA_V0,
    aggregateWeight: weight,
    decayScore,
    stabilityScore,
    semanticsDigest
  };
}

/**
 * Slow-changing observability boundary — NOT ontological truth of a subject.
 *
 * @param {{
 *   livingWorldId?: string | null,
 *   issuancePath?: string | null,
 *   lineageRoot?: string | null,
 *   witnessAnchor?: WitnessAnchorInputV0 | null,
 *   nowMs?: number
 * }} input
 */
export function deriveEpistemicFingerprintV0(input) {
  const witnessSemantics = deriveWitnessSemanticsV0(input.witnessAnchor, {
    nowMs: input.nowMs
  });
  const boundaryPayload = {
    livingWorldId: String(input.livingWorldId || ""),
    issuancePath: String(input.issuancePath || ""),
    lineageRoot: String(input.lineageRoot || ""),
    witnessSemanticsDigest: witnessSemantics.semanticsDigest
  };
  const observabilityBoundaryDigest = foldWalSegmentHashV0(
    WAL_HASH_CHAIN_GENESIS_V0,
    boundaryPayload
  );
  const epistemicFingerprintId = foldWalSegmentHashV0(observabilityBoundaryDigest, {
    layer: "epistemic_fingerprint_v0"
  });

  return {
    schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0,
    epistemicFingerprintId,
    observabilityBoundaryDigest,
    derivedAtMs: Number(input.nowMs) || Date.now(),
    witnessSemantics
  };
}

/**
 * @param {EpistemicFingerprintV0 | null | undefined} prior
 * @param {EpistemicFingerprintV0 | null | undefined} current
 */
export function computeIdentityConfidenceV0(prior, current) {
  if (!prior || !current) {
    return { confidence: 0, components: { missing: true } };
  }

  const fingerprintMatch =
    prior.epistemicFingerprintId === current.epistemicFingerprintId ? 1 : 0;
  const boundaryMatch =
    prior.observabilityBoundaryDigest === current.observabilityBoundaryDigest ? 1 : 0;
  const weightDrift = Math.abs(
    (prior.witnessSemantics?.aggregateWeight ?? 0) -
      (current.witnessSemantics?.aggregateWeight ?? 0)
  );
  const stability =
    ((prior.witnessSemantics?.stabilityScore ?? 0) +
      (current.witnessSemantics?.stabilityScore ?? 0)) /
    2;
  const witnessPenalty = Math.min(1, weightDrift / WITNESS_DRIFT_HARD_MAX_V0);

  const confidence = Math.max(
    0,
    Math.min(
      1,
      fingerprintMatch * 0.45 +
        boundaryMatch * 0.25 +
        stability * 0.2 +
        (1 - witnessPenalty) * 0.1
    )
  );

  return {
    confidence,
    components: {
      fingerprintMatch,
      boundaryMatch,
      stability,
      weightDrift,
      witnessPenalty
    }
  };
}

/**
 * Cross-session subject continuity judgment — arbitration input only.
 *
 * @param {{
 *   priorFingerprint?: EpistemicFingerprintV0 | null,
 *   currentFingerprint?: EpistemicFingerprintV0 | null,
 *   bootSealVersion?: number,
 *   lineageEquivalent?: boolean
 * }} input
 */
export function assertIdentityContinuityV0(input) {
  const bootSealVersion = Number(input.bootSealVersion) || 0;
  const prior = input.priorFingerprint ?? null;
  const current = input.currentFingerprint ?? null;
  const lineageEquivalent = input.lineageEquivalent !== false;

  if (!prior || !current) {
    return {
      schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0,
      verdict: IDENTITY_CONTINUITY_VERDICT_V0.UNRELATED,
      action: IDENTITY_ARBITRATION_ACTION_V0.RECOMMEND_QUARANTINE,
      confidence: 0,
      bootSealVersion,
      hardGate: false,
      reason: "Missing fingerprint — cannot establish observability boundary."
    };
  }

  const { confidence, components } = computeIdentityConfidenceV0(prior, current);
  const weightDrift = components.weightDrift ?? 0;

  if (
    prior.epistemicFingerprintId === current.epistemicFingerprintId &&
    confidence >= IDENTITY_CONFIDENCE_HIGH_V0
  ) {
    return {
      schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0,
      verdict: IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT,
      action: IDENTITY_ARBITRATION_ACTION_V0.ALLOW_AS_SAME_SUBJECT,
      confidence,
      bootSealVersion,
      hardGate: false,
      reason: "Perfect temporal fingerprint and witness stability."
    };
  }

  if (
    confidence >= IDENTITY_CONFIDENCE_LOW_V0 &&
    confidence < IDENTITY_CONFIDENCE_HIGH_V0
  ) {
    return {
      schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0,
      verdict: IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT_LOW_CONFIDENCE,
      action: IDENTITY_ARBITRATION_ACTION_V0.ALLOW_DEGRADED_OBSERVABILITY,
      confidence,
      bootSealVersion,
      hardGate: false,
      reason: "Same subject under degraded observability — not unrelated."
    };
  }

  if (lineageEquivalent && prior.epistemicFingerprintId !== current.epistemicFingerprintId) {
    return {
      schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0,
      verdict: IDENTITY_CONTINUITY_VERDICT_V0.LINEAGE_OK_IDENTITY_FORK,
      action: IDENTITY_ARBITRATION_ACTION_V0.GENERATE_TEMPORAL_IDENTITY_ID,
      confidence,
      bootSealVersion,
      hardGate: false,
      reason: "Chronology continuous; epistemic subject bifurcated."
    };
  }

  if (weightDrift > 0 && weightDrift <= WITNESS_DRIFT_SOFT_MAX_V0) {
    return {
      schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0,
      verdict: IDENTITY_CONTINUITY_VERDICT_V0.IDENTITY_DRIFT,
      action: IDENTITY_ARBITRATION_ACTION_V0.OBSERVE_ONLY,
      confidence,
      bootSealVersion,
      hardGate: false,
      reason: "Witness anchor decay within soft band — epistemic ambiguity."
    };
  }

  return {
    schema: EPISTEMIC_IDENTITY_CONTINUITY_SCHEMA_V0,
    verdict: IDENTITY_CONTINUITY_VERDICT_V0.UNRELATED,
    action: IDENTITY_ARBITRATION_ACTION_V0.RECOMMEND_QUARANTINE,
    confidence,
    bootSealVersion,
    hardGate: false,
    reason: "No lineage or identity equivalence — foreign temporal identity ingress."
  };
}

/**
 * @param {import('../temporalIdentityBindingV0.js').TimeOwnershipContractV0} timeOwnershipContract
 * @param {string} temporalIdentityId
 */
export function bindTemporalIdentityToContractV0(timeOwnershipContract, temporalIdentityId) {
  const seed = String(
    timeOwnershipContract.jurisdictionId ||
      timeOwnershipContract.diskKey ||
      timeOwnershipContract.nodeId ||
      ""
  );
  const reconciliationKey = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    seed,
    temporalIdentityId: String(temporalIdentityId || "")
  });

  return {
    ...timeOwnershipContract,
    boundIdentity: {
      temporalIdentityId: String(temporalIdentityId || ""),
      boundAtMs: Date.now(),
      reconciliationKey
    }
  };
}

/**
 * Explicit research invariant — import sites should assert this in reviews.
 */
export const IDENTITY_CONTINUITY_NEVER_HARD_GATE_V0 = Object.freeze({
  statement:
    "Identity continuity is arbitration input only; execution permission remains mayRehydrate + version layer."
});
