/**
 * Castle Stability Memory Graph v1.7 — learned personal physics profile.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_7.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { REALITY_PHASE_V1_5 } from "./castleRealityPhaseEngineV1_5.js";

export const CASTLE_STABILITY_MEMORY_GRAPH_SCHEMA_V1_7 = "castle.stability_memory_graph.v1.7";

export const MODALITY_V1_7 = Object.freeze({
  CO_WATCH: "co_watch",
  SOCIAL: "social",
  FOCUS: "focus",
  VIDEO: "video",
  GENERAL: "general"
});

export const TIME_BUCKET_V1_7 = Object.freeze({
  MORNING: "morning",
  AFTERNOON: "afternoon",
  EVENING: "evening",
  NIGHT: "night"
});

const LEARNING_RATE_V1_7 = 0.12;
const DRIFT_RING_MAX_V1_7 = 32;
const OVERRIDE_THRESHOLD_V1_7 = 0.14;

/** @type {Map<string, object>} */
const userPhysicsProfileV1_7 = new Map();

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function emaV1_7(prior, next, rate = LEARNING_RATE_V1_7) {
  return Number(clamp01(prior * (1 - rate) + next * rate).toFixed(4));
}

function defaultModalityBiasV1_7() {
  return Object.freeze({
    [MODALITY_V1_7.CO_WATCH]: Object.freeze({
      focusBias: 0.68,
      speechPriority: 0.52,
      memoryPriority: 0.32,
      phaseIndex: 0.28
    }),
    [MODALITY_V1_7.SOCIAL]: Object.freeze({
      focusBias: 0.48,
      speechPriority: 0.62,
      memoryPriority: 0.38,
      phaseIndex: 0.58
    }),
    [MODALITY_V1_7.FOCUS]: Object.freeze({
      focusBias: 0.78,
      speechPriority: 0.28,
      memoryPriority: 0.55,
      phaseIndex: 0.22
    }),
    [MODALITY_V1_7.VIDEO]: Object.freeze({
      focusBias: 0.62,
      speechPriority: 0.38,
      memoryPriority: 0.4,
      phaseIndex: 0.35
    }),
    [MODALITY_V1_7.GENERAL]: Object.freeze({
      focusBias: 0.5,
      speechPriority: 0.5,
      memoryPriority: 0.35,
      phaseIndex: 0.45
    })
  });
}

function defaultProfileV1_7(ownerId) {
  return Object.freeze({
    schema: CASTLE_STABILITY_MEMORY_GRAPH_SCHEMA_V1_7,
    ownerId: String(ownerId),
    stabilityPreferenceCurve: Object.freeze({
      [TIME_BUCKET_V1_7.MORNING]: 0.62,
      [TIME_BUCKET_V1_7.AFTERNOON]: 0.52,
      [TIME_BUCKET_V1_7.EVENING]: 0.44,
      [TIME_BUCKET_V1_7.NIGHT]: 0.36
    }),
    interruptionToleranceMap: Object.freeze({
      [MODALITY_V1_7.CO_WATCH]: 0.42,
      [MODALITY_V1_7.SOCIAL]: 0.72,
      [MODALITY_V1_7.FOCUS]: 0.82,
      [MODALITY_V1_7.VIDEO]: 0.48,
      [MODALITY_V1_7.GENERAL]: 0.55
    }),
    modalityBiasGraph: defaultModalityBiasV1_7(),
    contextSwitchLatencyProfile: Object.freeze({
      meanMs: 4800,
      overrideRate: 0,
      sampleCount: 0,
      lastOverrideAtMs: null
    }),
    driftEvents: Object.freeze([]),
    observationCount: 0,
    personalityPhysicsActive: false,
    lastActiveAtMs: null,
    lastDecayAtMs: null,
    lifecycleSchema: "castle.stability_physics_lifecycle.v1.8"
  });
}

function ensureProfileV1_7(ownerId) {
  const key = String(ownerId);
  if (!userPhysicsProfileV1_7.has(key)) {
    userPhysicsProfileV1_7.set(key, defaultProfileV1_7(key));
  }
  return userPhysicsProfileV1_7.get(key);
}

export function inferTimeBucketV1_7(atMs = Date.now()) {
  const hour = new Date(Number(atMs)).getHours();
  if (hour >= 6 && hour < 11) return TIME_BUCKET_V1_7.MORNING;
  if (hour >= 11 && hour < 17) return TIME_BUCKET_V1_7.AFTERNOON;
  if (hour >= 17 && hour < 22) return TIME_BUCKET_V1_7.EVENING;
  return TIME_BUCKET_V1_7.NIGHT;
}

export function inferModalityV1_7(realityStability = {}) {
  const lens =
    realityStability.dynamics?.contextualIdentity?.contextLens ||
    realityStability.dynamics?.attentionInertia?.currentLens ||
    realityStability.dynamics?.attentionInertia?.laggedLens ||
    "";

  const normalized = String(lens).toLowerCase();
  if (normalized.includes("co_watch") || normalized.includes("sport") || normalized.includes("match")) {
    return MODALITY_V1_7.CO_WATCH;
  }
  if (normalized.includes("social") || normalized.includes("conversation") || normalized.includes("chat")) {
    return MODALITY_V1_7.SOCIAL;
  }
  if (normalized.includes("audiobook") || normalized.includes("book") || normalized.includes("focus")) {
    return MODALITY_V1_7.FOCUS;
  }
  if (normalized.includes("video") || normalized.includes("youtube") || normalized.includes("stream")) {
    return MODALITY_V1_7.VIDEO;
  }

  const dominantTopic = (realityStability.stabilizedFrame?.threads || []).reduce(
    (best, n) => ((n.stabilizedShare ?? 0) > (best?.stabilizedShare ?? 0) ? n : best),
    null
  )?.topicLabel;

  if (dominantTopic) {
    const topic = String(dominantTopic).toLowerCase();
    if (topic.includes("co_watch") || topic.includes("sport")) return MODALITY_V1_7.CO_WATCH;
    if (topic.includes("social") || topic.includes("conversation")) return MODALITY_V1_7.SOCIAL;
    if (topic.includes("audiobook") || topic.includes("book")) return MODALITY_V1_7.FOCUS;
    if (topic.includes("video") || topic.includes("youtube")) return MODALITY_V1_7.VIDEO;
  }

  return MODALITY_V1_7.GENERAL;
}

function phaseToIndexV1_7(phase) {
  switch (phase) {
    case REALITY_PHASE_V1_5.LOCKED:
      return 0;
    case REALITY_PHASE_V1_5.STABLE:
      return 0.33;
    case REALITY_PHASE_V1_5.TRANSITIONAL:
      return 0.66;
    case REALITY_PHASE_V1_5.VOLATILE:
      return 1;
    default:
      return 0.45;
  }
}

export function getStabilityMemoryPriorsV1_7(ownerId, context = {}) {
  const profile = ensureProfileV1_7(ownerId);
  const modality = context.modality || MODALITY_V1_7.GENERAL;
  const timeBucket = context.timeBucket || inferTimeBucketV1_7(context.atMs);
  const modalityBias = profile.modalityBiasGraph[modality] || profile.modalityBiasGraph[MODALITY_V1_7.GENERAL];
  const timeStability = profile.stabilityPreferenceCurve[timeBucket] ?? 0.5;
  const interruptionTolerance = profile.interruptionToleranceMap[modality] ?? 0.55;

  const phaseIndexPrior = Number(
    clamp01(modalityBias.phaseIndex * 0.65 + timeStability * 0.35).toFixed(4)
  );

  const userInfluencePrior = Number(
    clamp01(0.18 + (1 - interruptionTolerance) * 0.35 + profile.contextSwitchLatencyProfile.overrideRate * 0.4).toFixed(4)
  );

  return Object.freeze({
    schema: "castle.stability_memory_priors.v1.7",
    focusBias: modalityBias.focusBias,
    speechPriority: modalityBias.speechPriority,
    memoryPriority: modalityBias.memoryPriority,
    phaseIndexPrior,
    userInfluencePrior,
    interruptionTolerance,
    timeStability,
    modality,
    timeBucket,
    learnedPhysicsActive: profile.observationCount > 0,
    observationCount: profile.observationCount
  });
}

function recordDriftEventV1_7(profile, event) {
  const ring = [...(profile.driftEvents || []), event];
  while (ring.length > DRIFT_RING_MAX_V1_7) ring.shift();
  return Object.freeze(ring);
}

function updateModalityBiasV1_7(profile, modality, observation) {
  const prior = profile.modalityBiasGraph[modality] || profile.modalityBiasGraph[MODALITY_V1_7.GENERAL];
  const resolvedIndex = phaseToIndexV1_7(observation.resolvedPhase);
  const userBias = observation.userStabilityBias ?? 0.5;

  const next = Object.freeze({
    focusBias: emaV1_7(prior.focusBias, userBias),
    speechPriority: emaV1_7(
      prior.speechPriority,
      observation.speakShare ?? prior.speechPriority
    ),
    memoryPriority: emaV1_7(
      prior.memoryPriority,
      observation.memoryShare ?? prior.memoryPriority
    ),
    phaseIndex: emaV1_7(prior.phaseIndex, resolvedIndex)
  });

  return Object.freeze({
    ...profile.modalityBiasGraph,
    [modality]: next
  });
}

function updateTimeCurveV1_7(profile, timeBucket, stabilityIndex) {
  return Object.freeze({
    ...profile.stabilityPreferenceCurve,
    [timeBucket]: emaV1_7(profile.stabilityPreferenceCurve[timeBucket] ?? 0.5, stabilityIndex, 0.08)
  });
}

function updateInterruptionToleranceV1_7(profile, modality, overrideOccurred) {
  const prior = profile.interruptionToleranceMap[modality] ?? 0.55;
  const next = overrideOccurred
    ? emaV1_7(prior, 0.35, 0.15)
    : emaV1_7(prior, 0.72, 0.06);
  return Object.freeze({
    ...profile.interruptionToleranceMap,
    [modality]: next
  });
}

function updateLatencyProfileV1_7(profile, atMs, overrideOccurred) {
  const prior = profile.contextSwitchLatencyProfile;
  const sampleCount = prior.sampleCount + 1;
  let meanMs = prior.meanMs;
  let overrideRate = prior.overrideRate;

  if (overrideOccurred && prior.lastOverrideAtMs) {
    const delta = atMs - prior.lastOverrideAtMs;
    meanMs = Math.round(prior.meanMs * 0.85 + delta * 0.15);
  }

  overrideRate = Number(
    emaV1_7(prior.overrideRate, overrideOccurred ? 1 : 0, 0.1).toFixed(4)
  );

  return Object.freeze({
    meanMs,
    overrideRate,
    sampleCount,
    lastOverrideAtMs: overrideOccurred ? atMs : prior.lastOverrideAtMs
  });
}

export function observeStabilityMemoryV1_7(ownerId, observation = {}) {
  const key = String(ownerId);
  const profile = ensureProfileV1_7(key);
  const atMs = Number(observation.atMs) || Date.now();
  const modality = observation.modality || MODALITY_V1_7.GENERAL;
  const timeBucket = observation.timeBucket || inferTimeBucketV1_7(atMs);

  const systemPhase = observation.systemPhase;
  const resolvedPhase = observation.resolvedPhase;
  const negotiationMagnitude = observation.negotiationMagnitude ?? 0;
  const overrideOccurred =
    observation.overrideOccurred === true ||
    (observation.feedbackSignal &&
      systemPhase &&
      resolvedPhase &&
      systemPhase !== resolvedPhase &&
      negotiationMagnitude >= OVERRIDE_THRESHOLD_V1_7);

  let driftEvents = profile.driftEvents;
  if (overrideOccurred) {
    driftEvents = recordDriftEventV1_7(profile, Object.freeze({
      atMs,
      modality,
      systemPhase,
      resolvedPhase,
      signal: observation.feedbackSignal || null,
      negotiationMagnitude: Number(negotiationMagnitude.toFixed(4))
    }));
  }

  const modalityBiasGraph = observation.coGovernanceActive
    ? updateModalityBiasV1_7(profile, modality, observation)
    : profile.modalityBiasGraph;

  const stabilityPreferenceCurve = updateTimeCurveV1_7(
    profile,
    timeBucket,
    phaseToIndexV1_7(resolvedPhase || systemPhase)
  );

  const interruptionToleranceMap = updateInterruptionToleranceV1_7(
    profile,
    modality,
    overrideOccurred
  );

  const contextSwitchLatencyProfile = updateLatencyProfileV1_7(profile, atMs, overrideOccurred);

  const next = Object.freeze({
    ...profile,
    modalityBiasGraph,
    stabilityPreferenceCurve,
    interruptionToleranceMap,
    contextSwitchLatencyProfile,
    driftEvents,
    observationCount: profile.observationCount + 1,
    personalityPhysicsActive: true,
    lastActiveAtMs: atMs
  });

  userPhysicsProfileV1_7.set(key, next);

  if (overrideOccurred || observation.coGovernanceActive) {
    logVoiceInfoV0("STABILITY_MEMORY_GRAPH", {
      ownerId: key,
      modality,
      timeBucket,
      overrideOccurred,
      overrideRate: contextSwitchLatencyProfile.overrideRate,
      observationCount: next.observationCount,
      driftEventCount: driftEvents.length
    });
  }

  return Object.freeze({
    schema: CASTLE_STABILITY_MEMORY_GRAPH_SCHEMA_V1_7,
    profile: next,
    overrideRecorded: overrideOccurred,
    driftEventCount: driftEvents.length
  });
}

export function getDefaultPhysicsProfileV1_7(ownerId) {
  return defaultProfileV1_7(ownerId);
}

export function updatePhysicsProfileV1_7(ownerId, updater) {
  const key = String(ownerId);
  const current = ensureProfileV1_7(key);
  const next = updater(current);
  userPhysicsProfileV1_7.set(
    key,
    Object.freeze({
      ...next,
      ownerId: key,
      schema: CASTLE_STABILITY_MEMORY_GRAPH_SCHEMA_V1_7
    })
  );
  return userPhysicsProfileV1_7.get(key);
}

export function replacePhysicsProfileV1_7(ownerId, profile) {
  const key = String(ownerId);
  userPhysicsProfileV1_7.set(
    key,
    Object.freeze({
      ...profile,
      ownerId: key,
      schema: CASTLE_STABILITY_MEMORY_GRAPH_SCHEMA_V1_7
    })
  );
  return userPhysicsProfileV1_7.get(key);
}

export function getUserPhysicsProfileV1_7(ownerId) {
  const profile = ensureProfileV1_7(ownerId);
  return Object.freeze({
    schema: CASTLE_STABILITY_MEMORY_GRAPH_SCHEMA_V1_7,
    ownerId: String(ownerId),
    stabilityPreferenceCurve: profile.stabilityPreferenceCurve,
    interruptionToleranceMap: profile.interruptionToleranceMap,
    modalityBiasGraph: profile.modalityBiasGraph,
    contextSwitchLatencyProfile: profile.contextSwitchLatencyProfile,
    driftEvents: profile.driftEvents,
    observationCount: profile.observationCount,
    personalityPhysicsActive: profile.personalityPhysicsActive,
    lastActiveAtMs: profile.lastActiveAtMs,
    lastDecayAtMs: profile.lastDecayAtMs
  });
}

export function getContextDriftSummaryV1_7(ownerId) {
  const profile = ensureProfileV1_7(ownerId);
  const byModality = Object.create(null);
  for (const event of profile.driftEvents) {
    byModality[event.modality] = (byModality[event.modality] || 0) + 1;
  }
  return Object.freeze({
    schema: "castle.context_drift_summary.v1.7",
    ownerId: String(ownerId),
    totalDriftEvents: profile.driftEvents.length,
    overrideRate: profile.contextSwitchLatencyProfile.overrideRate,
    meanSwitchLatencyMs: profile.contextSwitchLatencyProfile.meanMs,
    driftByModality: Object.freeze(byModality)
  });
}

export function getStabilityMemoryGraphSnapshotV1_7() {
  return Object.freeze({
    schema: CASTLE_STABILITY_MEMORY_GRAPH_SCHEMA_V1_7,
    identity: "stability_memory_learning_loop",
    profileOwners: Object.freeze([...userPhysicsProfileV1_7.keys()])
  });
}

/** @internal vitest */
export function __resetStabilityMemoryGraphForTestV1_7() {
  userPhysicsProfileV1_7.clear();
}
