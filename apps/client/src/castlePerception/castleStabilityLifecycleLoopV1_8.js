/**
 * Castle Stability Lifecycle Loop v1.8 — traceable learning + lifecycle physics.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_8.md
 */

import { applyStabilityMemoryLoopV1_7 } from "./castleStabilityMemoryLoopV1_7.js";
import { observeImplicitBiasV1_8 } from "./castleImplicitBiasLearningV1_8.js";
import {
  appendLearningTraceV1_8,
  getLearningTraceV1_8,
  LEARNING_TRACE_KIND_V1_8
} from "./castleStabilityLearningTraceV1_8.js";
import {
  loadPhysicsLifecycleV1_8,
  persistPhysicsLifecycleV1_8,
  runPhysicsLifecycleMaintenanceV1_8
} from "./castleStabilityPhysicsLifecycleV1_8.js";
import { parseStabilityFeedbackV1_6 } from "./castleStabilityHumanLoopV1_6.js";

export const CASTLE_STABILITY_LIFECYCLE_LOOP_SCHEMA_V1_8 = "castle.stability_lifecycle_loop.v1.8";

let lifecycleBootstrappedV1_8 = false;

function ensureLifecycleBootstrapV1_8(ownerId, atMs) {
  if (lifecycleBootstrappedV1_8) return;
  loadPhysicsLifecycleV1_8(ownerId, atMs);
  lifecycleBootstrappedV1_8 = true;
}

export function applyStabilityLifecycleLoopV1_8(realityStability, input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const ownerId = String(
    input.ownerId || realityStability.dynamics?.contextualIdentity?.ownerId || "user_local"
  );

  ensureLifecycleBootstrapV1_8(ownerId, atMs);
  runPhysicsLifecycleMaintenanceV1_8(ownerId, atMs);

  const memoryResult = applyStabilityMemoryLoopV1_7(realityStability, input);

  const explicitParsed = input.userInitiated
    ? parseStabilityFeedbackV1_6(input.text || input.preview || "")
    : null;

  const implicitBias = observeImplicitBiasV1_8(ownerId, {
    atMs,
    modality: memoryResult.modality,
    timeBucket: memoryResult.timeBucket,
    userInitiated: input.userInitiated === true,
    explicitStabilitySignal: Boolean(input.stabilityFeedback || explicitParsed),
    spikeSalience: input.spikeSalience ?? input.intentWeight,
    intentWeight: input.intentWeight,
    correlationId: input.correlationId
  });

  if (memoryResult.memoryObservation?.overrideRecorded || memoryResult.memoryObservation?.profile) {
    appendLearningTraceV1_8(ownerId, {
      atMs,
      kind: LEARNING_TRACE_KIND_V1_8.MEMORY_OBSERVE,
      reason: memoryResult.memoryObservation.overrideRecorded
        ? "explicit_override_recorded"
        : "physics_observation_tick",
      modality: memoryResult.modality,
      timeBucket: memoryResult.timeBucket,
      source: memoryResult.humanLoop?.feedback?.source || "passive_tick",
      deltas: Object.freeze({
        observationCount: memoryResult.userPhysicsProfile?.observationCount,
        overrideRecorded: memoryResult.memoryObservation?.overrideRecorded === true
      }),
      correlationId: input.correlationId
    });
  }

  if (memoryResult.learnedPhysicsApplied) {
    appendLearningTraceV1_8(ownerId, {
      atMs,
      kind: LEARNING_TRACE_KIND_V1_8.PRIOR_APPLIED,
      reason: "learned_physics_prior_applied_before_interaction",
      modality: memoryResult.modality,
      timeBucket: memoryResult.timeBucket,
      source: "memory_priors",
      deltas: Object.freeze({
        phaseIndexPrior: memoryResult.memoryPriors?.phaseIndexPrior,
        speechPriority: memoryResult.memoryPriors?.speechPriority,
        userInfluencePrior: memoryResult.memoryPriors?.userInfluencePrior
      }),
      correlationId: input.correlationId
    });
  }

  const persistResult =
    memoryResult.userPhysicsProfile?.observationCount > 0
      ? persistPhysicsLifecycleV1_8(ownerId, atMs)
      : Object.freeze({ persisted: false, reason: "no_observations" });

  const learningTrace = getLearningTraceV1_8(ownerId, 12);

  return Object.freeze({
    ...memoryResult,
    implicitBias,
    learningTrace,
    lifecycle: Object.freeze({
      persisted: persistResult.persisted === true,
      bootstrapLoaded: lifecycleBootstrappedV1_8,
      traceable: true
    }),
    predictiveCoProcessor: memoryResult.learnedPhysicsApplied === true,
    schema: CASTLE_STABILITY_LIFECYCLE_LOOP_SCHEMA_V1_8
  });
}

export function getStabilityLifecycleLoopSnapshotV1_8() {
  return Object.freeze({
    schema: CASTLE_STABILITY_LIFECYCLE_LOOP_SCHEMA_V1_8,
    identity: "personal_reality_co_processor"
  });
}

/** @internal vitest */
export function __resetStabilityLifecycleLoopForTestV1_8() {
  lifecycleBootstrappedV1_8 = false;
}
