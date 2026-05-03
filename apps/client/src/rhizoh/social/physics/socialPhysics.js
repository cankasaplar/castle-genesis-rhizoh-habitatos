import { reduceSocialPhysicsState } from "./socialStateReducer.js";

export function createInitialSocialPhysicsState() {
  return {
    phase: "stable",
    trustRegime: "observe-only",
    attentionDirection: "self_anchor",
    stabilityScore: 0.5,
    driftScore: 0.22,
    reconciliationNeed: 0.18,
    interactionMomentum: 0,
    coPresenceMomentum: 0,
    trustMean: 0,
    familiarityMean: 0,
    trustFlux: 0,
    reconcilePhaseSinceAt: null,
    reconcileDurationMs: 0,
    quietStateProbability: 0.1,
    interactionEnergy: 0.9,
    observationMode: 0.25,
    tsgeLocalGravityMean: 0,
    tsgeSpawnMitosisHint: false,
    tsgeAttentionCurvatureVariance: 0,
    tsgeStableAttractorHint: false,
    updatedAt: Date.now(),
    lastPhase: null
  };
}

/**
 * @param {unknown} prev
 * @param {{ contextTimeline?: unknown, relationships?: unknown, presenceTelemetry?: unknown }} input
 */
export function advanceSocialPhysics(prev, input) {
  const base = createInitialSocialPhysicsState();
  const p = prev && typeof prev === "object" ? prev : base;
  return reduceSocialPhysicsState(p, input);
}

