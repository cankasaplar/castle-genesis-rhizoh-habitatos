/**
 * Rhizoh Fast Speech Mode v0 — speech-first scheduling (reorganization, not new architecture).
 * HOT PATH (0–300ms target): companion → speech skeleton → minimal MF → publish.
 * SOFT PATH (async): full MF, CLAG/BEA/IPMP/SFR, depth, influence — never blocks hot path.
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  extractMeaningFrameV0,
  extractMeaningFrameMinimalV0,
  collapseMeaningFrameV0
} from "./rhizohMeaningFrameV0.js";
import { pushContinuityFrameV0, getContinuityCacheSnapshotV0 } from "./rhizohContinuityCacheV0.js";
import { routeFastConversationV0, FAST_ROUTE_V0 } from "./rhizohFastConversationRouterV0.js";
import { projectMeaningFrameV0 } from "./rhizohGlobalMeaningProjectorV0.js";
import {
  resolveCompanionLayerV0,
  applyCompanionToProjectionV0,
  collapseCompanionPresenceV0,
  mergeCompanionIntoConversationBehaviorV0,
  resolveCompanionFlowAckV0
} from "./rhizohCompanionLayerV0.js";
import { segmentSpeechTextV0 } from "./rhizohSpeechSentenceSegmenterV0.js";
import {
  buildVoiceStreamShapeV0,
  collapseSpeechShapeV0
} from "./rhizohVoiceStreamEngineV0.js";
import { publishRuntimeStabilityV0 } from "./rhizohRuntimeStabilityLayerV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "./rhizohClagTemporalBeaV0.js";
import { ingestClagTurnContextV0 } from "./rhizohCrossLayerAwarenessGraphV0.js";
import { CLAG_TRAVERSAL_PROFILE_V0 } from "./rhizohClagTraversalPolicyV0.js";
import { resolveClagPrimaryActiveSovereignNodeV0 } from "./rhizohClagNodeRegistryV0.js";
import { getRhizohCalibrationRootAnchorV0 } from "../spatial/geographicAnchorsV0.js";
import { mergeSpeechResonanceIntoBehaviorV0 } from "./rhizohSpeechMeaningEngineV0.js";
import {
  collapseMicroRhythmFeelV0,
  mergeMicroRhythmFeelIntoBehaviorV0
} from "./rhizohMicroRhythmBiasV0.js";
import { RHIZOH_CONVERSATION_VOICING_V0 } from "./rhizohConversationVoicingV0.js";
import { resolveRhizohConversationDepthV0 } from "./rhizohConversationDepthV0.js";
import {
  buildRhizohTurnInfluencePreLlmV0,
  buildInfluenceObservabilityBundleV0,
  emitRhizohInfluenceObservabilityV0
} from "./rhizohConversationInfluenceInstrumentationV0.js";
import { isClagMemoryShapingEnabledV0 } from "./rhizohCrossLayerAwarenessGraphV0.js";
import { prewarmSpeechSynthesisV0 } from "./prewarmSpeechSynthesisV0.js";
export const RHIZOH_FAST_SPEECH_MODE_SCHEMA_V0 = "castle.rhizoh.fast_speech_mode.v0";
const EXPRESSION_SCHEMA_V0 = "castle.rhizoh.global_meaning_engine.v0";

/** @type {Promise<void>} */
let softIntelligenceChainV0 = Promise.resolve();
/** @type {object | null} */
let lastSoftIntelligenceSnapshotV0 = null;

/**
 * @returns {boolean}
 */
export function isRhizohFastSpeechModeEnabledV0() {
  try {
    if (String(import.meta.env?.VITE_RHIZOH_FAST_SPEECH_MODE || "1") === "0") return false;
    return true;
  } catch {
    return true;
  }
}

function mfToMinimalClagGraphV0(mf) {
  const phase =
    mf.emotionVector.tension > 0.55
      ? TEMPORAL_BEA_PHASE_V0.CONSERVE
      : mf.emotionVector.curiosity > 0.6
        ? TEMPORAL_BEA_PHASE_V0.RELEASE
        : TEMPORAL_BEA_PHASE_V0.ACCUMULATE;
  return Object.freeze({
    traceId: mf.traceId,
    sessionId: null,
    activeSovereignNodeCount: 2,
    boundedEmergence: Object.freeze({
      temporal: Object.freeze({ strategicFlow: Object.freeze({ phase }) }),
      controlledSurpriseInjected: false
    }),
    memoryShapingHints: Object.freeze({
      storyContinuityScore: mf.continuityHook ? 0.5 : 0.3,
      activeSovereignNodes: Object.freeze([])
    }),
    graphContamination: Object.freeze({ detected: false })
  });
}

/**
 * Chunk plan only — no full speech-meaning engine on hot path.
 */
function buildSpeechSkeletonFastV0({ text, route, companion, projection }) {
  const seg = segmentSpeechTextV0(text, { maxClauseChars: 96 });
  const chunks = seg.segments.map((s) => s.text);
  const firstAudioMs = Math.min(route?.targetFirstAudioMs ?? 280, 220);
  return Object.freeze({
    schema: "castle.rhizoh.speech_skeleton_fast.v0",
    chunkPlan: Object.freeze(chunks.slice(0, 4)),
    chunkCount: chunks.length,
    pacing: projection?.pacing ?? "calm",
    targetFirstAudioMs: firstAudioMs,
    skeletonReadyMs: 120,
    companionPresence: companion?.presenceMode ?? "adaptive",
    preCommit: true
  });
}

function publishHotExpressionV0(payload) {
  lastExpressionSnapshotV0 = payload.expression;
  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_EXPRESSION__ = payload.expression;
    window.__CASTLE_RHIZOH_HOT_SPEECH__ = Object.freeze({
      skeleton: payload.speechSkeleton,
      instantAckPhrase: payload.instantAckPhrase,
      hotPathMs: payload.hotPathMs
    });
  }
}

/** @type {object | null} */
let lastExpressionSnapshotV0 = null;

/**
 * Speech-first hot path — synchronous.
 * Order: route signals → companion → projection → speech skeleton → minimal MF stability.
 */
export function runRhizohHotSpeechPathV0(input = {}) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const text = String(input.text || input.message || "").trim();
  const cohort = input.cohortFrame && typeof input.cohortFrame === "object" ? input.cohortFrame : {};

  const mfMinimal = extractMeaningFrameMinimalV0({
    text,
    traceId: input.traceId,
    cohortLanguage: cohort.language
  });

  const route = routeFastConversationV0({
    text,
    meaningFrame: mfMinimal,
    depthLevel: mfMinimal.depth,
    userTurnCount: input.userTurnCount,
    voiceTurn: input.voiceTurn === true
  });

  const companion = resolveCompanionLayerV0({
    meaningFrame: mfMinimal,
    route,
    userTurnCount: input.userTurnCount,
    voiceTurn: input.voiceTurn === true
  });

  const projection = applyCompanionToProjectionV0(
    projectMeaningFrameV0(mfMinimal, { cohortRhythmPreference: cohort.rhythmPreference }),
    companion
  );

  const speechSkeleton = buildSpeechSkeletonFastV0({ text, route, companion, projection });

  const conversationDepthLight = Object.freeze({
    conversationMode: mfMinimal.depth <= 2 ? "explore" : "narrative",
    depthLevel: mfMinimal.depth,
    continuityStrength: mfMinimal.continuityHook ? 0.5 : 0.35,
    storySnapshot: null
  });

  const stability = publishRuntimeStabilityV0({
    mode: "llm_turn",
    clagGraph: mfToMinimalClagGraphV0(mfMinimal),
    conversationDepth: conversationDepthLight,
    traceId: input.traceId,
    sessionId: input.sessionId,
    skipSpeechMeaning: true
  });

  let conversationBehavior = mergeCompanionIntoConversationBehaviorV0(
    stability.conversationBehavior,
    companion
  );
  conversationBehavior = mergeMicroRhythmFeelIntoBehaviorV0(conversationBehavior, {
    whenYouHearMs: speechSkeleton.targetFirstAudioMs,
    breathGapMs: 160,
    hesitationMs: route.fastPath ? 40 : 70,
    canInterrupt: mfMinimal.intent === "ask",
    preemptiveStart01: route.fastPath ? 0.18 : 0.08,
    breakStyle: "hot_skeleton"
  });

  prewarmSpeechSynthesisV0();

  const instantAckPhrase =
    route.route === FAST_ROUTE_V0.FAST_GREET
      ? resolveCompanionFlowAckV0(projection.language)
      : null;

  const hotPathMs = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0
  );

  const expression = Object.freeze({
    schema: EXPRESSION_SCHEMA_V0,
    fastSpeechMode: true,
    traceId: input.traceId ?? mfMinimal.traceId,
    route: Object.freeze({
      id: route.route,
      fastPath: route.fastPath,
      reason: route.reason,
      targetFirstAudioMs: speechSkeleton.targetFirstAudioMs,
      clagEnrichment: "async_scheduled",
      softIntelligence: "pending"
    }),
    flowModel: "shared_speech_field",
    scheduling: "speech_first",
    meaningFrame: collapseMeaningFrameV0(mfMinimal),
    companion: Object.freeze({
      ...collapseCompanionPresenceV0(companion),
      renderingBias: true
    }),
    projection: Object.freeze({
      language: projection.language,
      pacing: projection.pacing,
      discourseStyle: projection.discourseStyle
    }),
    speechShape: Object.freeze({
      pacing: speechSkeleton.pacing,
      chunkCount: speechSkeleton.chunkCount,
      earlyTtsEligible: true,
      targetFirstAudioMs: speechSkeleton.targetFirstAudioMs,
      microRhythmFeel: conversationBehavior.microRhythmFeel,
      skeletonPreCommit: true
    }),
    speechSkeleton,
    conversationBehavior,
    hotPathMs
  });

  publishHotExpressionV0({ expression, speechSkeleton, instantAckPhrase, hotPathMs });

  logCastleLifecycleV0("fast_speech_hot", Object.freeze({
    traceId: expression.traceId,
    route: expression.route.id,
    hotPathMs,
    targetFirstAudioMs: speechSkeleton.targetFirstAudioMs,
    chunkCount: speechSkeleton.chunkCount
  }));

  return Object.freeze({
    expression,
    meaningFrame: mfMinimal,
    companion,
    route,
    projection,
    speechSkeleton,
    stability: Object.freeze({ ...stability, conversationBehavior }),
    conversationDepth: conversationDepthLight,
    instantAckPhrase,
    hotPathMs,
    clagGraph: mfToMinimalClagGraphV0(mfMinimal)
  });
}

/**
 * Soft path — CLAG + full depth + full speech shape (async).
 */
export async function runRhizohSoftIntelligencePathV0(input, hot) {
  const text = String(input.text || input.message || "").trim();
  const cohort = input.cohortFrame && typeof input.cohortFrame === "object" ? input.cohortFrame : {};

  const conversationDepth = resolveRhizohConversationDepthV0({
    message: text,
    conversationPhase: input.conversationPhase,
    userTurnCount: input.userTurnCount,
    narrativeThread: input.narrativeThread,
    traceId: input.traceId,
    depthLevel: cohort.depthPreference
  });

  const mf = extractMeaningFrameV0({
    text,
    traceId: input.traceId,
    depthLevel: cohort.depthPreference ?? conversationDepth.depthLevel,
    continuityStrength: conversationDepth.continuityStrength,
    conversationMode: conversationDepth.conversationMode,
    cohortLanguage: cohort.language
  });

  pushContinuityFrameV0(mf);

  const route = hot?.route ?? routeFastConversationV0({ text, meaningFrame: mf, conversationMode: conversationDepth.conversationMode, depthLevel: mf.depth, userTurnCount: input.userTurnCount });

  const turnInfluencePre =
    input.turnInfluencePre ||
    buildRhizohTurnInfluencePreLlmV0({
      traceId: input.traceId,
      layerSpec: input.layerSpec,
      conversationPhase: input.conversationPhase,
      continuity: input.continuity,
      conversationDepth,
      rhizohRouter: input.rhizohRouter,
      sourcePath: input.sourcePath || "fast_speech_soft"
    });

  let clagGraph = mfToMinimalClagGraphV0(mf);
  const needsFullClag = route.route === FAST_ROUTE_V0.FULL_PIPELINE || route.useClag === true;

  if (needsFullClag) {
    const primarySovereign = resolveClagPrimaryActiveSovereignNodeV0({
      persona: input.persona,
      pathname: input.pathname
    });
    const calibrationRef = getRhizohCalibrationRootAnchorV0()?.id || null;
    clagGraph = ingestClagTurnContextV0({
      traceId: input.traceId,
      sessionId: input.sessionId,
      conversationPhase: input.conversationPhase,
      layerSpec: input.layerSpec,
      pathname: input.pathname,
      conversationDepth,
      storySnapshot: conversationDepth.storySnapshot,
      turnInfluencePre,
      spiralAgreement: input.spiralAgreement,
      geographicAnchor: primarySovereign?.geographicAnchorId || primarySovereign?.id || null,
      calibrationAnchorReference: calibrationRef,
      persona: input.persona,
      studioEventType: input.studioEventType,
      socialPulse: input.socialPulse,
      traversalProfile: CLAG_TRAVERSAL_PROFILE_V0.LLM_TURN
    });
  }

  const stability = publishRuntimeStabilityV0({
    mode: "llm_turn",
    clagGraph,
    conversationDepth,
    traceId: input.traceId,
    sessionId: input.sessionId,
    skipSpeechMeaning: true
  });

  const companion = hot?.companion ?? resolveCompanionLayerV0({ meaningFrame: mf, route, conversationDepth, userTurnCount: input.userTurnCount });
  const projection =
    hot?.projection ??
    applyCompanionToProjectionV0(projectMeaningFrameV0(mf, { cohortRhythmPreference: cohort.rhythmPreference }), companion);

  const speechShape = buildVoiceStreamShapeV0({
    text,
    meaningFrame: mf,
    projection,
    route,
    companion,
    conversationBehavior: stability.conversationBehavior,
    role: RHIZOH_CONVERSATION_VOICING_V0.USER
  });

  let conversationBehavior = mergeSpeechResonanceIntoBehaviorV0(
    stability.conversationBehavior,
    { resonance: speechShape.resonance }
  );
  conversationBehavior = mergeCompanionIntoConversationBehaviorV0(conversationBehavior, companion);
  conversationBehavior = mergeMicroRhythmFeelIntoBehaviorV0(
    conversationBehavior,
    collapseMicroRhythmFeelV0(speechShape)
  );

  const expression = Object.freeze({
    ...hot.expression,
    meaningFrame: collapseMeaningFrameV0(mf),
    speechShape: collapseSpeechShapeV0(speechShape),
    conversationBehavior,
    continuityLens: getContinuityCacheSnapshotV0(),
    route: Object.freeze({
      ...hot.expression.route,
      clagEnrichment: needsFullClag ? "background_full" : "skipped",
      softIntelligence: "ready"
    })
  });

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_EXPRESSION__ = expression;
    window.__CASTLE_RHIZOH_RUNTIME_STABILITY__ = Object.freeze({
      ...window.__CASTLE_RHIZOH_RUNTIME_STABILITY__,
      conversationBehavior
    });
  }

  if (turnInfluencePre) {
    const bundle = buildInfluenceObservabilityBundleV0(turnInfluencePre);
    emitRhizohInfluenceObservabilityV0("pre_llm", {
      ...bundle,
      runtimeStability: Object.freeze({
        regime: stability.stability.regime,
        conversationBehavior,
        memoryShapingActive: isClagMemoryShapingEnabledV0()
      }),
      softPath: true
    });
  }

  logCastleLifecycleV0("fast_speech_soft", Object.freeze({
    traceId: input.traceId,
    clagEnrichment: needsFullClag ? "full" : "stub",
    nodeCount: clagGraph?.nodeCount ?? 0
  }));

  lastSoftIntelligenceSnapshotV0 = Object.freeze({
    expression,
    meaningFrame: mf,
    clagGraph,
    speechShape,
    stability: Object.freeze({ ...stability, conversationBehavior }),
    conversationDepth,
    turnInfluencePre
  });

  lastExpressionSnapshotV0 = expression;
  return lastSoftIntelligenceSnapshotV0;
}

/**
 * @param {Parameters<typeof runRhizohSoftIntelligencePathV0>[0]} input
 * @param {ReturnType<typeof runRhizohHotSpeechPathV0>} hot
 */
export function scheduleRhizohSoftIntelligencePathV0(input, hot) {
  softIntelligenceChainV0 = softIntelligenceChainV0
    .then(() => runRhizohSoftIntelligencePathV0(input, hot))
    .catch((err) => {
      logCastleLifecycleV0("fast_speech_soft_error", {
        traceId: input.traceId,
        message: String(err?.message || err)
      });
    });
  return softIntelligenceChainV0;
}

export function awaitRhizohSoftIntelligenceV0() {
  return softIntelligenceChainV0;
}

export function getLastSoftIntelligenceSnapshotV0() {
  return lastSoftIntelligenceSnapshotV0;
}

export function getLastExpressionFromFastSpeechV0() {
  return lastExpressionSnapshotV0;
}
