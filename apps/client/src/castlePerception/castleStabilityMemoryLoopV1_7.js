/**
 * Castle Stability Memory Loop v1.7 — apply learned physics + record observations.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_7.md
 */

import { applyStabilityHumanLoopV1_6 } from "./castleStabilityHumanLoopV1_6.js";
import {
  getContextDriftSummaryV1_7,
  getStabilityMemoryPriorsV1_7,
  getUserPhysicsProfileV1_7,
  inferModalityV1_7,
  inferTimeBucketV1_7,
  observeStabilityMemoryV1_7
} from "./castleStabilityMemoryGraphV1_7.js";

export const CASTLE_STABILITY_MEMORY_LOOP_SCHEMA_V1_7 = "castle.stability_memory_loop.v1.7";

export function applyStabilityMemoryLoopV1_7(realityStability, input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const ownerId = String(
    input.ownerId || realityStability.dynamics?.contextualIdentity?.ownerId || "user_local"
  );
  const modality = inferModalityV1_7(realityStability);
  const timeBucket = inferTimeBucketV1_7(atMs);
  const memoryPriors = getStabilityMemoryPriorsV1_7(ownerId, { modality, timeBucket, atMs });

  const realityGovernance = applyStabilityHumanLoopV1_6(realityStability, {
    ...input,
    ownerId,
    atMs,
    memoryPriors
  });

  const coGovernance = realityGovernance.coGovernance || {};
  const agreement = realityGovernance.stabilityAgreement || {};
  const coState = coGovernance.coGovernorState || {};

  const memoryObservation = observeStabilityMemoryV1_7(ownerId, {
    atMs,
    modality,
    timeBucket,
    systemPhase: agreement.systemInferenceProfile?.phase || realityStability.phase?.phase,
    resolvedPhase:
      agreement.negotiatedPhaseRange?.resolvedPhase ||
      coGovernance.negotiatedPhase?.phase ||
      realityStability.phase?.phase,
    negotiationMagnitude: coState.negotiationField?.magnitude ?? 0,
    feedbackSignal: realityGovernance.humanLoop?.feedback?.signal || null,
    coGovernanceActive: coGovernance.negotiated === true,
    userStabilityBias: coState.userStabilityBias,
    speakShare: realityGovernance.governedPlan?.speakShare,
    memoryShare: realityGovernance.governedPlan?.memoryShare,
    overrideOccurred: coState.negotiationField?.magnitude >= 0.14 && coGovernance.negotiated
  });

  const userPhysicsProfile = getUserPhysicsProfileV1_7(ownerId);
  const contextDrift = getContextDriftSummaryV1_7(ownerId);

  return Object.freeze({
    schema: CASTLE_STABILITY_MEMORY_LOOP_SCHEMA_V1_7,
    ...realityGovernance,
    memoryPriors,
    memoryObservation,
    userPhysicsProfile,
    contextDrift,
    modality,
    timeBucket,
    learnedPhysicsApplied: memoryPriors.learnedPhysicsActive
  });
}

export function getStabilityMemoryLoopSnapshotV1_7() {
  return Object.freeze({
    schema: CASTLE_STABILITY_MEMORY_LOOP_SCHEMA_V1_7,
    identity: "stability_memory_learning_loop"
  });
}
