/**
 * Global Multilingual Meaning Engine v0 — expression model (voice-first product layer).
 * Flow: FAST ROUTER → MF-0 → Companion → projection → speech shape → (optional) CLAG background.
 * CLAG-independent core; consumes CLAG only when route = full_pipeline.
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { extractMeaningFrameV0, collapseMeaningFrameV0 } from "./rhizohMeaningFrameV0.js";
import {
  pushContinuityFrameV0,
  priorThreadsFromContinuityCacheV0,
  resetContinuityCacheV0,
  getContinuityCacheSnapshotV0
} from "./rhizohContinuityCacheV0.js";
import { routeFastConversationV0, FAST_ROUTE_V0 } from "./rhizohFastConversationRouterV0.js";
import { projectMeaningFrameV0 } from "./rhizohGlobalMeaningProjectorV0.js";
import {
  resolveCompanionLayerV0,
  applyCompanionToProjectionV0,
  collapseCompanionPresenceV0,
  mergeCompanionIntoConversationBehaviorV0,
  resolveCompanionFlowAckV0
} from "./rhizohCompanionLayerV0.js";
import { RHIZOH_CONVERSATION_VOICING_V0 } from "./rhizohConversationVoicingV0.js";
import {
  collapseMicroRhythmFeelV0,
  mergeMicroRhythmFeelIntoBehaviorV0
} from "./rhizohMicroRhythmBiasV0.js";
import {
  buildVoiceStreamShapeV0,
  collapseSpeechShapeV0
} from "./rhizohVoiceStreamEngineV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "./rhizohClagTemporalBeaV0.js";
import { publishRuntimeStabilityV0 } from "./rhizohRuntimeStabilityLayerV0.js";
import { ingestClagTurnContextV0 } from "./rhizohCrossLayerAwarenessGraphV0.js";
import { CLAG_TRAVERSAL_PROFILE_V0 } from "./rhizohClagTraversalPolicyV0.js";
import { resolveClagPrimaryActiveSovereignNodeV0 } from "./rhizohClagNodeRegistryV0.js";
import { getRhizohCalibrationRootAnchorV0 } from "../spatial/geographicAnchorsV0.js";
import { mergeSpeechResonanceIntoBehaviorV0 } from "./rhizohSpeechMeaningEngineV0.js";
import { isClagMemoryShapingEnabledV0 } from "./rhizohCrossLayerAwarenessGraphV0.js";
import { resolveRhizohConversationDepthV0 } from "./rhizohConversationDepthV0.js";
import {
  buildRhizohTurnInfluencePreLlmV0,
  buildInfluenceObservabilityBundleV0,
  emitRhizohInfluenceObservabilityV0
} from "./rhizohConversationInfluenceInstrumentationV0.js";

export const RHIZOH_GLOBAL_MEANING_ENGINE_SCHEMA_V0 = "castle.rhizoh.global_meaning_engine.v0";

/** @type {object | null} */
let lastExpressionSnapshotV0 = null;

/**
 * @param {ReturnType<typeof extractMeaningFrameV0>} mf
 */
function mfToConversationDepthHintsV0(mf) {
  const modeMap = {
    ask: "explore",
    reflect: "greet",
    challenge: "debate",
    narrate: "narrative"
  };
  return Object.freeze({
    conversationMode: modeMap[mf.intent] || "explore",
    depthLevel: mf.depth,
    continuityStrength: mf.continuityHook ? 0.55 : 0.35,
    phraseChunking: mf.depth >= 3
  });
}

/**
 * @param {ReturnType<typeof extractMeaningFrameV0>} mf
 */
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
      controlledSurpriseInjected: mf.emotionVector.curiosity > 0.7
    }),
    memoryShapingHints: Object.freeze({
      storyContinuityScore: mf.continuityHook ? 0.58 : 0.32,
      activeSovereignNodes: Object.freeze([])
    }),
    graphContamination: Object.freeze({ detected: false }),
    interPhaseMemory: Object.freeze({
      explicitMeaningTransfer: Object.freeze({ carriedIntoThisPhase: mf.unresolvedThreads })
    })
  });
}

function isExpressionVerboseV0() {
  try {
    if (import.meta.env?.DEV) return true;
    return String(import.meta.env?.VITE_RHIZOH_STABILITY_VERBOSE || "") === "1";
  } catch {
    return false;
  }
}

/**
 * @param {{
 *   text?: string,
 *   traceId?: string | null,
 *   sessionId?: string | null,
 *   message?: string,
 *   conversationPhase?: string,
 *   userTurnCount?: number,
 *   layerSpec?: { id?: number, code?: string },
 *   pathname?: string,
 *   continuity?: Record<string, unknown>,
 *   rhizohRouter?: Record<string, unknown> | null,
 *   narrativeThread?: Record<string, unknown> | null,
 *   turnInfluencePre?: Record<string, unknown> | null,
 *   spiralAgreement?: Record<string, unknown> | null,
 *   persona?: { firstName?: string, displayName?: string },
 *   studioEventType?: string | null,
 *   socialPulse?: Record<string, unknown> | null,
 *   cohortFrame?: {
 *     language?: string,
 *     rhythmPreference?: string,
 *     depthPreference?: number,
 *     toleranceLatencyMs?: number
 *   } | null,
 *   clagEnrichment?: Record<string, unknown> | null
 * }} input
 */
import {
  isRhizohFastSpeechModeEnabledV0,
  runRhizohHotSpeechPathV0,
  scheduleRhizohSoftIntelligencePathV0,
  awaitRhizohSoftIntelligenceV0,
  getLastExpressionFromFastSpeechV0
} from "./rhizohFastSpeechModeV0.js";

export function runRhizohGlobalMeaningTurnV0(input = {}) {
  if (isRhizohFastSpeechModeEnabledV0()) {
    const hot = runRhizohHotSpeechPathV0(input);
    scheduleRhizohSoftIntelligencePathV0(input, hot);
    return Object.freeze({
      expression: hot.expression,
      meaningFrame: hot.meaningFrame,
      companion: hot.companion,
      route: hot.route,
      projection: hot.projection,
      speechShape: hot.speechSkeleton,
      stability: hot.stability,
      clagGraph: hot.clagGraph,
      conversationDepth: hot.conversationDepth,
      turnInfluencePre: null,
      influenceBundle: null,
      instantAckPhrase: hot.instantAckPhrase,
      hotPathMs: hot.hotPathMs,
      softIntelligencePending: true,
      awaitSoftIntelligence: awaitRhizohSoftIntelligenceV0
    });
  }

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
    priorThreads: priorThreadsFromContinuityCacheV0(),
    cohortLanguage: cohort.language
  });

  pushContinuityFrameV0(mf);

  const turnInfluencePre =
    input.turnInfluencePre ||
    buildRhizohTurnInfluencePreLlmV0({
      traceId: input.traceId,
      layerSpec: input.layerSpec,
      conversationPhase: input.conversationPhase,
      continuity: input.continuity,
      conversationDepth,
      rhizohRouter: input.rhizohRouter,
      sourcePath: input.sourcePath || "global_meaning_turn"
    });

  const route = routeFastConversationV0({
    text,
    meaningFrame: mf,
    conversationMode: conversationDepth.conversationMode,
    depthLevel: mf.depth,
    userTurnCount: input.userTurnCount
  });

  const companion = resolveCompanionLayerV0({
    meaningFrame: mf,
    route,
    conversationDepth,
    userTurnCount: input.userTurnCount,
    voiceTurn: input.voiceTurn === true
  });

  const projection = applyCompanionToProjectionV0(
    projectMeaningFrameV0(mf, { cohortRhythmPreference: cohort.rhythmPreference }),
    companion
  );

  let clagGraph = null;

  if (route.useClag) {
    const primarySovereign = resolveClagPrimaryActiveSovereignNodeV0({
      persona: input.persona,
      pathname: input.pathname
    });
    const calibrationRef = getRhizohCalibrationRootAnchorV0()?.id || null;
    clagGraph =
      input.clagEnrichment ||
      ingestClagTurnContextV0({
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
  } else {
    clagGraph = mfToMinimalClagGraphV0({ ...mf, traceId: input.traceId ?? mf.traceId });
  }

  const stability = publishRuntimeStabilityV0({
    mode: "llm_turn",
    clagGraph,
    conversationDepth,
    traceId: input.traceId,
    sessionId: input.sessionId,
    skipSpeechMeaning: true
  });

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
  conversationBehavior = mergeCompanionIntoConversationBehaviorV0(
    conversationBehavior,
    companion
  );
  conversationBehavior = mergeMicroRhythmFeelIntoBehaviorV0(
    conversationBehavior,
    collapseMicroRhythmFeelV0(speechShape)
  );

  if (typeof window !== "undefined" && window.__CASTLE_RHIZOH_RUNTIME_STABILITY__) {
    window.__CASTLE_RHIZOH_RUNTIME_STABILITY__ = Object.freeze({
      ...window.__CASTLE_RHIZOH_RUNTIME_STABILITY__,
      conversationBehavior
    });
  }

  const expression = Object.freeze({
    schema: RHIZOH_GLOBAL_MEANING_ENGINE_SCHEMA_V0,
    traceId: input.traceId ?? mf.traceId,
    route: Object.freeze({
      id: route.route,
      fastPath: route.fastPath,
      reason: route.reason,
      targetFirstAudioMs: route.targetFirstAudioMs,
      clagEnrichment: route.useClag ? "background_full" : "skipped"
    }),
    flowModel: "shared_speech_field",
    meaningFrame: isExpressionVerboseV0() ? mf : collapseMeaningFrameV0(mf),
    companion: Object.freeze({
      ...collapseCompanionPresenceV0(companion),
      renderingBias: true
    }),
    projection: Object.freeze({
      language: projection.language,
      pacing: projection.pacing,
      discourseStyle: projection.discourseStyle,
      projectionDirective: projection.projectionDirective
    }),
    speechShape: collapseSpeechShapeV0(speechShape),
    conversationBehavior,
    continuityLens: getContinuityCacheSnapshotV0(),
    cohort: cohort.language
      ? Object.freeze({
          language: cohort.language,
          rhythmPreference: cohort.rhythmPreference ?? null
        })
      : null
  });

  lastExpressionSnapshotV0 = expression;

  logCastleLifecycleV0("global_meaning", Object.freeze({
    traceId: expression.traceId,
    route: expression.route.id,
    intent: expression.meaningFrame.intent,
    language: expression.projection.language,
    fastPath: expression.route.fastPath,
    targetFirstAudioMs: expression.route.targetFirstAudioMs,
    clagEnrichment: expression.route.clagEnrichment,
    companionPresence: expression.companion.presenceMode,
    relationalTone: expression.companion.relationalTone
  }));

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_EXPRESSION__ = expression;
    if (isExpressionVerboseV0()) {
      window.__CASTLE_RHIZOH_EXPRESSION_INTERNAL__ = Object.freeze({
        meaningFrame: mf,
        companion,
        speechShapeFull: speechShape,
        clagGraph
      });
    }
  }

  let influenceBundle = null;
  if (turnInfluencePre) {
    influenceBundle = buildInfluenceObservabilityBundleV0(turnInfluencePre);
    const bundleWithStability = Object.freeze({
      ...influenceBundle,
      expression: Object.freeze({ route: expression.route.id, language: expression.projection.language }),
      runtimeStability: Object.freeze({
        regime: stability.stability.regime,
        conversationBehavior,
        memoryShapingActive: isClagMemoryShapingEnabledV0()
      })
    });
    emitRhizohInfluenceObservabilityV0("pre_llm", bundleWithStability);
    influenceBundle = bundleWithStability;
  }

  return Object.freeze({
    expression,
    meaningFrame: mf,
    companion,
    route,
    projection,
    speechShape,
    stability: Object.freeze({ ...stability, conversationBehavior }),
    clagGraph,
    conversationDepth,
    turnInfluencePre,
    influenceBundle
  });
}

export function getLastRhizohExpressionSnapshotV0() {
  if (isRhizohFastSpeechModeEnabledV0()) {
    return getLastExpressionFromFastSpeechV0() || lastExpressionSnapshotV0;
  }
  return lastExpressionSnapshotV0;
}

export function resetRhizohGlobalMeaningEngineV0() {
  lastExpressionSnapshotV0 = null;
  resetContinuityCacheV0();
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_EXPRESSION__;
      delete window.__CASTLE_RHIZOH_EXPRESSION_INTERNAL__;
    } catch {
      /* noop */
    }
  }
}

export { resolveCompanionFlowAckV0, FAST_ROUTE_V0 };
