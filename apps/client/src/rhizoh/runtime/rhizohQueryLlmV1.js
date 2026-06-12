/**
 * Rhizoh LLM query — single client entry for text/voice turns (POST /rhizoh/llm).
 * RUNTIME INVARIANT: Gateway decides, client renders.
 * @see docs/RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md
 */

import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid } from "../useRhizohGatewayMonitor.js";
import { parseDSL, detectCastleIntentWithoutCoords } from "../../kernel/rhizohCommandParser.js";
import { enqueueCastleRuntimeTransaction, TCEE_PHASE } from "../boot/index.js";
import {
  createRhizohClientTraceIdV0,
  logCastleLifecycleV0,
  logVoiceInfoV0,
  resolveRhizohTurnTraceIdV0
} from "./rhizohProductionLogNamespacesV0.js";
import { evaluateVoiceTurnAcceptanceV0, voiceTurnAcceptanceLogDetailV0 } from "./voiceTurnAcceptanceGateV0.js";
import {
  runVoiceTranscriptWitnessPipelineV0,
  runVoiceTurnGateAfterWitnessV0
} from "./voiceTranscriptWitnessPipelineV0.js";
import {
  finalizeVoiceBehavioralCommitmentV0,
  publishVoiceBehavioralCommitmentV0
} from "./voiceBehavioralCommitmentV0.js";
import { publishRhizohVoiceTurnMetaDebugV0 } from "./rhizohVoiceTurnMetaDebugV0.js";
import { resolvePostGateCommitmentV0 } from "./voicePostGateConsistencyV0.js";
import { resolveSttGateConfidenceV0 } from "./sttGateConfidenceV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import { buildRhizohContinuityHealthDetailV0, publishRhizohTrustDebugV0 } from "./rhizohTrustDebugV0.js";
import { bindTurnIdentityV0 } from "./rhizohIdentityContinuityCoreV0.js";
import { recordReplyFormatDriftSampleV0, getReplyFormatDriftRollingV0 } from "./replyFormatDriftTrackerV0.js";
import {
  normalizeRhizohLlmGatewayResponseV0,
  resolveRhizohReplyForDisplayV0,
  toReplyFormatDriftSampleV0,
  publishRhizohLlmReplyNormalizedV0
} from "./rhizohLlmReplyNormalizeV0.js";
import { getRhizohCohortIdForRequestV0 } from "./rhizohCohortPinClientV0.js";
import { publishRhizohSchemaRuntimeAuditV0 } from "./rhizohSchemaRuntimeAuditV0.js";
import { describeRhizohNarrativeLayerCapabilityV0 } from "./rhizohNarrativeLayerCapabilityV0.js";
import {
  buildRhizohHealthState,
  computeRhizohHealthInfluence,
  blendRelationalToneWithHealthRecommended,
  adjustRelationalToneForHealthLatency,
  formatReliabilityEpisodesSummaryForLlm
} from "../reliability/index.js";
import { deriveRhizohPolicy } from "../policy/index.js";
import { routeRhizohInput } from "../router/routeRhizohInput.js";
import {
  applyTurnSovereigntyPromptScopeToContextV0,
  ensureTurnSovereigntyLockedV0,
  gateLlmInputForTurnV0,
  resolveTurnSovereigntyMaxTokensV0
} from "./turnSovereigntyWireV0.js";
import { SOVEREIGN_REALITY_V0 } from "./behavioralTurnSovereigntyV0.js";
import { isCompanionContinuityFirstV0 } from "./rhizohVoiceOperatingModeV0.js";
import { shouldBlockOnBoundaryViolationV0 } from "./turnSovereigntyEnforcementModeV0.js";
import {
  isLivingSurfaceFastPrecheckEligibleV1,
  isRhizohLivingConversationSurfaceV1,
  resolveFastReflexBridgeCopyV1
} from "../experience/rhizohLivingConversationSurfaceV1.js";
import {
  RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION,
  advanceRhizohConversationPhase,
  buildRhizohConversationLlmDirective,
  buildRhizohProductCapabilityEnvelope,
  describeRhizohPhaseExitProgressV0
} from "../product/rhizohConversationOrchestratorV1.js";
import { registerRhizohConversationRtlAfterTurnV0 } from "../product/rhizohConversationRtlBridgeV0.js";
import {
  buildLifeContinuityContextHintsV0,
  readUserAnchorV0
} from "./memoryAnchorSystemV0.js";
import {
  buildRhizohMultilingualPackV0,
  pushRhizohTurnContinuityPulseV0
} from "./rhizohMultilingualBridgeV0.js";
import {
  buildRhizohLanguagePropagationBundleV0,
  mergeRhizohLanguagePropagationHeadersV0,
  resolveRhizohLlmLanguageV0
} from "./rhizohLanguagePropagationV0.js";
import { trimRhizohLlmRequestBodyV0 } from "./rhizohLlmPayloadTrimV0.js";
import { pollRhizohLlmWorkerTaskV0, postRhizohLlmSyncFallbackV0 } from "./rhizohLlmWorkerPollV0.js";
import { tryResolveMemoryConsentTurnV1 } from "./rhizohMemoryConsentTurnV1.js";
import { tryLocalReflexReplyV0 } from "./rhizohLocalReflexLayerV0.js";
import {
  runFastPrecheckFromTextV0,
  publishFastPrecheckHitV0
} from "./rhizohFastPrecheckV0.js";
import { applyReflexEffectivenessFeedbackV0 } from "./rhizohConfidenceDecayGateV0.js";
import { commitFinalUserVisibleLanguageV0 } from "./rhizohFinalLanguageCommitV0.js";
import { extractPalAnchorFromLifeProjectionV0 } from "./expressiveRealityTransitionV0.js";
import {
  loadRhizohProductSession,
  readRhizohExplicitPowerUnlock,
  saveRhizohProductSession
} from "../product/rhizohProductSessionPersistenceV1.js";
import { inferRhizohUserGoalHint } from "../experience/index.js";
import {
  applyEmotionDelta,
  applyRepairOutcome,
  deriveRelationalTone,
  readOutcomeSessionFromMeta,
  DEFAULT_EMOTIONS
} from "../emotion/index.js";
import {
  selectWeightedMemoryTurns,
  computeIdentityFeedbackFromRecall,
  applyRecallFeedbackToIdentityGraph,
  recallClosurePayloadForMeta
} from "../memory/index.js";
import { buildRhizohDriftLogEntry } from "../telemetry/index.js";
import {
  getRhizohStabilityAnchorSnapshot,
  normalizeGovernorCalibration,
  softClampEmotionsToIdentityAnchor,
  clampRelationalToneToAnchor,
  applyMemoryDominanceCap
} from "../stability/index.js";
import { readIdentityGraph } from "../../kernel/rhizohIdentityKernelV1.js";
import { resolveRhizohLlmMaxTokensV0 } from "./rhizohLlmMaxTokensV0.js";
import { buildRhizohLlmDepthBundleV0 } from "./rhizohConversationDepthLlmBridgeV0.js";
import {
  applyFoxBehaviorGateV1,
  FOX_BEHAVIOR_OUTCOME_V1
} from "./foxBehaviorGateV1.js";
import {
  buildContinuityRecallBoostV0,
  collectContinuityRecallCandidatesV0,
  mergeRecallBoostIntoRecollectionV0,
  probeContinuityRecallIntentV0
} from "./rhizohContinuityRecallIntentV0.js";
import {
  applyAddressingFromUserMessageV0,
  buildAddressingPromptDirectiveV0,
  mergePersonaForLlmV0,
  resolveRhizohEffectivePersonaV0
} from "./rhizohPersonaAddressingV0.js";
import { writeRhizohContinuityPersonaV0 } from "./rhizohContinuityDiskMetaV0.js";
import { buildSportsLiveContextBoostV0, probeSportsLiveQueryV0 } from "./rhizohSportsLiveContextV0.js";
import { refreshWorldMapLiveFeedIfStaleV0 } from "./worldMapLiveFeedV0.js";
import {
  buildRhizohDialogueThreadSnapshotV1,
  advanceRhizohDialogueThreadV1,
  buildRhizohDialogueThreadPromptBlockV1
} from "./rhizohDialogueThreadV1.js";
import { buildGhostPresentationTonePromptBlockV1 } from "./ghostStateEngineV1.js";
import { noteProactiveFeedbackUserActivityV1, noteProactiveFeedbackEmotionalContextV1 } from "./foxProactiveAdaptationV1.js";


export const RHIZOH_QUERY_LLM_SCHEMA_V1 = "castle.rhizoh.query_llm.v1";
export const TEXT_LLM_TIMEOUT_MS = 32_000;

const RHIZOH_GENERATION_MODE_MAX = {
  FAST_DIALOGUE: 120,
  STANDARD: 320,
  REFLECTIVE: 480,
  NARRATIVE: 640,
  DEEP_REASONING: 900
};

/** @type {{ applyPersonalCastleDsl?: Function, readClientContinuity?: Function, patchRhizohEmotionDisk?: Function, getUiRuntimeHints?: Function }} */
let _deps = {};

export function registerRhizohQueryLlmDepsV0(deps = {}) {
  _deps = { ..._deps, ...deps };
}

function readClientContinuity() {
  if (typeof _deps.readClientContinuity === "function") return _deps.readClientContinuity();
  return { turns: [], persona: {}, meta: {} };
}

function patchRhizohEmotionDisk(emotions, relationalTone, outcomeResonance, outcomeSession, driftLogEntry) {
  if (typeof _deps.patchRhizohEmotionDisk === "function") {
    _deps.patchRhizohEmotionDisk(emotions, relationalTone, outcomeResonance, outcomeSession, driftLogEntry);
  }
}

function normalizeRhizohGenerationModeId(mode) {
  return String(mode || "STANDARD").trim().toUpperCase().replace(/-/g, "_");
}

function priorAssistantRepliesFromContinuity(cont) {
  const rt = Array.isArray(cont?.recentTurns) ? cont.recentTurns : [];
  return rt.map((x) => String(x?.assistant || "")).filter(Boolean).slice(-8);
}

function blendRelationalToneForHealth(emotionSource, healthState) {
  const base = deriveRelationalTone(emotionSource);
  if (!healthState || typeof healthState !== "object") {
    return clampRelationalToneToAnchor(base);
  }
  return clampRelationalToneToAnchor(
    adjustRelationalToneForHealthLatency(
      blendRelationalToneWithHealthRecommended(base, healthState),
      healthState
    )
  );
}

function finalizeRhizohAfterLlm(
  preLlmEmotions,
  {
    rhizohRouter,
    reply,
    source,
    runtimeHints,
    gatewayUx,
    persistRhizohEmotions,
    outcomeSession,
    priorAssistantReplies
  }
) {
  const { emotions: emotionsRaw, resonance, outcomeSession: nextOutcomeSession } = applyRepairOutcome({
    router: rhizohRouter,
    llmResult: { reply, source },
    gatewayUx: gatewayUx && typeof gatewayUx === "object" ? gatewayUx : {},
    runtime: runtimeHints,
    previousEmotion: preLlmEmotions,
    outcomeSession,
    priorAssistantReplies
  });
  const tonePreOutcome = deriveRelationalTone(emotionsRaw);
  const govCalPost = normalizeGovernorCalibration(readClientContinuity().meta?.rhizohGovernorCalibration);
  const emotions = softClampEmotionsToIdentityAnchor(emotionsRaw, "postOutcome", govCalPost);
  const hsPost =
    runtimeHints && typeof runtimeHints === "object" && runtimeHints.healthState ? runtimeHints.healthState : null;
  const relationalTone = blendRelationalToneForHealth(emotions, hsPost);
  const emotionUpdatedAt = Date.now();
  const driftPost = buildRhizohDriftLogEntry({
    phase: "postOutcome",
    emotionsPre: emotionsRaw,
    emotionsPost: emotions,
    tonePre: tonePreOutcome,
    tonePost: relationalTone,
    intent: rhizohRouter?.intent,
    source,
    resonance
  });
  patchRhizohEmotionDisk(emotions, relationalTone, resonance, nextOutcomeSession, driftPost);
  if (typeof persistRhizohEmotions === "function") {
    try {
      persistRhizohEmotions({
        emotions,
        relationalTone,
        emotionUpdatedAt,
        outcomeResonance: resonance,
        outcomeSession: nextOutcomeSession
      });
    } catch {
      /* noop */
    }
  }
  return {
    emotions,
    relationalTone,
    outcomeResonance: resonance,
    emotionUpdatedAt,
    outcomeSession: nextOutcomeSession
  };
}

export function logRhizohHealth(stage, detail = {}) {
  try {
    const meta = detail && typeof detail === "object" ? detail : {};
    logCastleLifecycleV0(String(stage || "unknown"), meta);
  } catch {
    /* noop */
  }
}

/** Uzak /rhizoh/llm hatt─▒ hatalar─▒n─▒ A/B/C s─▒n─▒flar─▒na ay─▒r─▒r (UI ve telemetri). */
function classifyRhizohLlmClientFailure(err, httpStatusFromBody) {
  const msg = String(err?.message || err || "");
  if (err?.rhizohFailureKind && typeof err.rhizohFailureKind === "string") {
    return {
      kind: err.rhizohFailureKind,
      httpStatus: err.providerHttpStatus ?? httpStatusFromBody ?? null
    };
  }
  if (/rhizoh_llm_timeout/i.test(msg) || /AbortError|aborted/i.test(msg)) {
    return { kind: "timeout", httpStatus: httpStatusFromBody ?? null };
  }
  const m = msg.match(/rhizoh_llm_http_(\d+)/i);
  if (m) {
    const st = Number(m[1]);
    if (st === 408 || st === 504) return { kind: "timeout", httpStatus: st };
    if (st === 429) return { kind: "rate_limit", httpStatus: st };
    return { kind: "provider_error", httpStatus: st };
  }
  if (/failed to fetch|NetworkError|network/i.test(msg)) return { kind: "network_error", httpStatus: null };
  if (/rhizoh_llm_bad_json|unexpected token|json\.parse|is not valid json/i.test(msg))
    return { kind: "provider_error", httpStatus: httpStatusFromBody ?? null };
  return { kind: "unknown", httpStatus: httpStatusFromBody ?? null };
}

export async function queryRhizohLLM({
  message,
  provider,
  connectionId,
  agentId,
  layerProfile,
  layerSpec,
  simTime,
  idToken,
  continuity,
  runtime,
  llmKeySource = "auto",
  /** @type {string} FAST_DIALOGUE | STANDARD | REFLECTIVE | NARRATIVE | DEEP_REASONING */
  generationMode = "STANDARD",
  /** When true, caller generationMode wins over cognition-derived adaptive mode. */
  pinGenerationMode = false,
  persistRhizohEmotions,
  gatewayUx,
  productDecisionOverlay,
  fetchTimeoutMs = TEXT_LLM_TIMEOUT_MS,
  slimVoicePath = false,
  voiceTurnMeta = null
}) {
  const trimmed = String(message || "").trim();
  if (trimmed) {
    noteProactiveFeedbackUserActivityV1({
      message: trimmed,
      voiceTurn: Boolean(voiceTurnMeta)
    });
  }
  const clientTraceId = createRhizohClientTraceIdV0();
  logRhizohHealth("ui_send", { traceId: clientTraceId, chars: trimmed.length });

  const consentTurn = tryResolveMemoryConsentTurnV1(trimmed, { traceId: clientTraceId });
  if (consentTurn?.reply) {
    logRhizohHealth("memory_consent_bypass", {
      traceId: clientTraceId,
      source: consentTurn.source,
      consentStatus: consentTurn.consentStatus
    });
    const committed = commitFinalUserVisibleLanguageV0(consentTurn.reply, {
      source: consentTurn.source,
      traceId: clientTraceId,
      lockKey: "language_commit_lock"
    });
    return {
      reply: committed.text,
      directive: "FOCUS_RHIZOH",
      source: consentTurn.source,
      traceId: clientTraceId,
      llmBypass: true,
      spatialAnchor: consentTurn.spatialAnchor || null
    };
  }

  applyReflexEffectivenessFeedbackV0(trimmed);

  if (probeSportsLiveQueryV0(trimmed).active) {
    await refreshWorldMapLiveFeedIfStaleV0({ force: true }).catch(() => null);
  }

  const livingSurface = isRhizohLivingConversationSurfaceV1();

  const precheck = runFastPrecheckFromTextV0(trimmed, { traceId: clientTraceId });
  if (precheck && (!livingSurface || isLivingSurfaceFastPrecheckEligibleV1(precheck.intent))) {
    publishFastPrecheckHitV0(precheck, { traceId: clientTraceId, channel: "text" });
    const committed = commitFinalUserVisibleLanguageV0(precheck.reply, {
      source: "fast_precheck",
      traceId: clientTraceId,
      lockKey: "language_commit_lock"
    });
    logRhizohHealth("fast_precheck_bypass", {
      traceId: clientTraceId,
      intent: precheck.intent,
      source: precheck.source,
      latencyMs: precheck.latencyMs
    });
    return {
      reply: committed.text,
      directive: "FOCUS_RHIZOH",
      source: "fast_precheck",
      traceId: clientTraceId,
      microIntent: precheck.intent,
      llmBypass: true,
      precheckLatencyMs: precheck.latencyMs
    };
  }

  const reflexReply = tryLocalReflexReplyV0(trimmed, { traceId: clientTraceId });
  if (reflexReply && !livingSurface) {
    logRhizohHealth("local_reflex_bypass", {
      traceId: clientTraceId,
      routeClass: reflexReply.routeClass,
      microIntent: reflexReply.microIntent,
      confidence: reflexReply.confidence
    });
    return {
      reply: reflexReply.reply,
      directive: reflexReply.directive,
      source: reflexReply.source,
      traceId: clientTraceId,
      routeClass: reflexReply.routeClass,
      microIntent: reflexReply.microIntent,
      llmBypass: true,
      reflexLatencyMs: reflexReply.latencyMs
    };
  }

  const dslParsed = parseDSL(trimmed);
  if (dslParsed) {
    if (typeof _deps.applyPersonalCastleDsl !== "function") {
      return { reply: "DSL komutu bu yuzeyde kullanilamiyor.", directive: "FOCUS_RHIZOH", source: "dsl-unavailable" };
    }
    const out = await _deps.applyPersonalCastleDsl(dslParsed);
    return {
      reply: out.reply,
      directive: out.directive || "FOCUS_RHIZOH",
      source: out.ok ? "dsl-castle" : "dsl-castle-error"
    };
  }
  if (detectCastleIntentWithoutCoords(trimmed)) {
    return {
      reply: "Kale kurulum ritüeli başlatılıyor — konum seçeneklerini onaylayın.",
      directive: "OPEN_CASTLE_INIT",
      source: "castle-init-gate"
    };
  }

  const cont = continuity && typeof continuity === "object" ? continuity : {};
  const diskSnapAddressing = readClientContinuity();
  const addressingPatch = applyAddressingFromUserMessageV0(trimmed, diskSnapAddressing.persona || cont.persona);
  if (addressingPatch) {
    writeRhizohContinuityPersonaV0(addressingPatch);
  }
  const diskIntro =
    typeof window !== "undefined" && window.localStorage.getItem("rhizoh_intro_seen_v1") === "1";
  const diskMetaEarly = readClientContinuity().meta || {};
  const rhizohProductSnap = loadRhizohProductSession(
    diskMetaEarly && typeof diskMetaEarly === "object" ? diskMetaEarly : {}
  );
  const relPhase = cont.relationship && typeof cont.relationship === "object" ? cont.relationship : {};
  const tuning = productDecisionOverlay?.phaseTuning && typeof productDecisionOverlay.phaseTuning === "object"
    ? productDecisionOverlay.phaseTuning
    : {};
  /** @type {ReturnType<typeof evaluateVoiceTurnAcceptanceV0>} */
  let turnAcceptance;
  const isVoiceTurn =
    voiceTurnMeta &&
    typeof voiceTurnMeta === "object" &&
    voiceTurnMeta.source &&
    voiceTurnMeta.source !== "text";
  /** @type {ReturnType<typeof finalizeVoiceBehavioralCommitmentV0> | null} */
  let pipelineCommitment = null;
  if (isVoiceTurn) {
    const dispatchRoute =
      voiceTurnMeta.dispatchRoute && typeof voiceTurnMeta.dispatchRoute === "object"
        ? voiceTurnMeta.dispatchRoute
        : null;
    const gateConfSnap = resolveSttGateConfidenceV0({
      temporal: voiceTurnMeta.temporal,
      confidence: voiceTurnMeta.confidence
    });

    if (dispatchRoute) {
      turnAcceptance = Object.freeze({
        accepted: dispatchRoute.executionAccepted === true,
        reason: String(dispatchRoute.reason || "dispatch_route"),
        source: voiceTurnMeta.source || "mic_v3"
      });
      const band =
        voiceTurnMeta.witnessed?.observation?.band ||
        voiceTurnMeta.band ||
        dispatchRoute.band ||
        VOICE_DIRECTED_SPEECH_BAND.UNKNOWN;
      pipelineCommitment = resolvePostGateCommitmentV0({
        route: dispatchRoute,
        turnAcceptance,
        band,
        source: voiceTurnMeta.source,
        gateConfidence: voiceTurnMeta.gateConfidence ?? gateConfSnap.gateConfidence,
        rawConfidence: voiceTurnMeta.rawConfidence ?? gateConfSnap.rawConfidence,
        dispatchAuthoritative: true
      }).commitment;
    } else if (voiceTurnMeta.witnessed) {
      const gateOut = runVoiceTurnGateAfterWitnessV0(voiceTurnMeta.witnessed, {
        ...(voiceTurnMeta && typeof voiceTurnMeta === "object" ? voiceTurnMeta : {}),
        text: trimmed,
        source: voiceTurnMeta.source || "mic",
        confidence: gateConfSnap.gateConfidence ?? voiceTurnMeta.confidence,
        recordedMs: voiceTurnMeta.recordedMs,
        stage: "turn_gate"
      });
      turnAcceptance = gateOut;
      pipelineCommitment = gateOut.commitment || null;
    } else {
      const pipe = runVoiceTranscriptWitnessPipelineV0({
        text: trimmed,
        confidence: voiceTurnMeta.confidence,
        strategy: voiceTurnMeta.strategy,
        maxRms: voiceTurnMeta.maxRms,
        source: voiceTurnMeta.source,
        stage: "turn_gate_full",
        checkRepeat: false,
        runTurnGate: true,
        skipTemporalIngest: Boolean(voiceTurnMeta.temporal),
        temporal: voiceTurnMeta.temporal,
        gateConfidence: gateConfSnap.gateConfidence,
        recordedMs: voiceTurnMeta.recordedMs
      });
      turnAcceptance =
        pipe.turnAcceptance ||
        evaluateVoiceTurnAcceptanceV0({
          text: trimmed,
          source: voiceTurnMeta.source || "mic"
        });
      pipelineCommitment = pipe.commitment || null;
    }
  } else {
    turnAcceptance = evaluateVoiceTurnAcceptanceV0({
      text: trimmed,
      source: "text"
    });
  }
  /** @type {ReturnType<typeof finalizeVoiceBehavioralCommitmentV0> | null} */
  let behavioralCommitment =
    voiceTurnMeta?.commitment && typeof voiceTurnMeta.commitment === "object"
      ? voiceTurnMeta.commitment
      : pipelineCommitment;
  if (isVoiceTurn && !behavioralCommitment) {
    const band =
      voiceTurnMeta.witnessed?.observation?.band ||
      voiceTurnMeta.band ||
      voiceTurnMeta.preCommitment?.band ||
      VOICE_DIRECTED_SPEECH_BAND.UNKNOWN;
    behavioralCommitment = finalizeVoiceBehavioralCommitmentV0({
      band,
      source: voiceTurnMeta.source,
      sanityAccepted: true,
      turnAccepted: turnAcceptance.accepted === true,
      turnReason: turnAcceptance.reason
    });
    publishVoiceBehavioralCommitmentV0(behavioralCommitment, { stage: "turn_gate", phase: "final" });
    publishRhizohVoiceTurnMetaDebugV0({
      witnessed: voiceTurnMeta.witnessed,
      band: voiceTurnMeta.band,
      preCommitment: voiceTurnMeta.preCommitment,
      commitment: behavioralCommitment,
      turnAccepted: turnAcceptance.accepted === true,
      turnReason: turnAcceptance.reason,
      source: voiceTurnMeta.source,
      preview: trimmed.slice(0, 96)
    });
  }
  const countsAsUserTurn = behavioralCommitment
    ? behavioralCommitment.turnCounts === true
    : turnAcceptance.accepted;
  const effectiveTurnCount = rhizohProductSnap.userTurnCount + (countsAsUserTurn ? 1 : 0);
  if (!turnAcceptance.accepted && turnAcceptance.reason !== "non_voice") {
    logVoiceInfoV0("GATE_TURN_SKIP", voiceTurnAcceptanceLogDetailV0(turnAcceptance));
    if (isVoiceTurn) {
      return Object.freeze({
        reply: "",
        directive: "",
        source: "voice_turn_skipped",
        traceId: "",
        turnSkipped: true,
        turnReason: turnAcceptance.reason
      });
    }
  }
  const rhizohPhaseBeforeTurn = rhizohProductSnap.conversationPhase;
  const rhizohPhaseForTurn = advanceRhizohConversationPhase(
    rhizohPhaseBeforeTurn,
    {
      trust: Number(relPhase.trust || 0),
      familiarity: Number(relPhase.familiarity || 0),
      userTurnCount: effectiveTurnCount,
      introSeen: diskIntro,
      explicitPowerUnlock: readRhizohExplicitPowerUnlock()
    },
    tuning
  );
  const bondGovernance01 =
    (Math.max(0, Math.min(1, Number(relPhase.trust) || 0)) +
      Math.max(0, Math.min(1, Number(relPhase.familiarity) || 0))) /
    2;
  const rhizohPhaseExitProgress = describeRhizohPhaseExitProgressV0(
    rhizohPhaseForTurn,
    {
      trust: Number(relPhase.trust || 0),
      familiarity: Number(relPhase.familiarity || 0),
      userTurnCount: effectiveTurnCount,
      introSeen: diskIntro
    },
    tuning
  );
  const rhizohCapabilityEnvelope = buildRhizohProductCapabilityEnvelope(rhizohPhaseForTurn, {
    governanceBond01: bondGovernance01,
    suppressGovernanceOpsBadgeUnlessBond01:
      productDecisionOverlay?.capabilityGates?.suppressGovernanceOpsBadgeUnlessBond01 ?? null
  });
  const rhizohLlmDirective = buildRhizohConversationLlmDirective(rhizohPhaseForTurn);
  const bumpRhizohProductSessionAfterReply = () => {
    const mayBumpSession = behavioralCommitment
      ? behavioralCommitment.sessionBumps === true
      : turnAcceptance.accepted;
    if (!mayBumpSession) {
      publishRhizohTrustDebugV0({
        phase: rhizohProductSnap.conversationPhase,
        turns: rhizohProductSnap.userTurnCount,
        turnsTarget: tuning.trustTurnsForNormal ?? 12,
        bond: bondGovernance01,
        bondTarget: tuning.trustBondForNormal ?? 0.34,
        trust: Number(relPhase.trust || 0),
        familiarity: Number(relPhase.familiarity || 0),
        voiceConfidence: turnAcceptance.confidence ?? voiceTurnMeta?.confidence ?? null,
        voiceSource: voiceTurnMeta?.source || "text",
        turnAccepted: false,
        turnReason: turnAcceptance.reason
      });
      return;
    }
    const gh = inferRhizohUserGoalHint(trimmed);
    saveRhizohProductSession({
      ...rhizohProductSnap,
      conversationPhase: rhizohPhaseForTurn,
      userTurnCount: rhizohProductSnap.userTurnCount + 1,
      userGoalHintBucket: gh.bucket,
      userGoalHintLabel: gh.label
    });
  };

  let runtimeHints = runtime && typeof runtime === "object" && !Array.isArray(runtime) ? { ...runtime } : {};
  if (Object.keys(runtimeHints).length === 0) {
    try {
      if (typeof _deps.getUiRuntimeHints === "function") {
        runtimeHints = { ...runtimeHints, ..._deps.getUiRuntimeHints() };
      }
    } catch {
      runtimeHints = {};
    }
  }
  const cr = cont.runtime;
  if (cr && typeof cr === "object" && !Array.isArray(cr)) {
    runtimeHints = { ...runtimeHints, ...cr };
  }
  if (gatewayUx && typeof gatewayUx === "object" && gatewayUx.phase) {
    runtimeHints = {
      ...runtimeHints,
      gatewayPhase: gatewayUx.phase,
      rhizohGatewayPhase: gatewayUx.phase
    };
  }
  const healthState = buildRhizohHealthState({
    gatewayPhase: gatewayUx?.phase,
    healthDeps: gatewayUx?.healthDeps,
    mapSurfaceActive: runtimeHints.mapSurfaceActive
  });
  const rhizohHealthInfluence = computeRhizohHealthInfluence(healthState);
  runtimeHints = { ...runtimeHints, healthState, rhizohHealthInfluence };
  const rhizohRouter = routeRhizohInput(trimmed, cont, runtimeHints);
  const diskSnapPreDepth = readClientContinuity();
  const diskMetaPreDepth =
    diskSnapPreDepth.meta && typeof diskSnapPreDepth.meta === "object" ? diskSnapPreDepth.meta : {};
  const relPreDepth = cont.relationship && typeof cont.relationship === "object" ? cont.relationship : {};
  const emotionsPreDepth =
    relPreDepth.emotions && typeof relPreDepth.emotions === "object" ? relPreDepth.emotions : null;
  const narrativeThreadPreDepth =
    cont.rhizohNarrativeThread && typeof cont.rhizohNarrativeThread === "object"
      ? cont.rhizohNarrativeThread
      : diskMetaPreDepth.rhizohNarrativeThread && typeof diskMetaPreDepth.rhizohNarrativeThread === "object"
        ? diskMetaPreDepth.rhizohNarrativeThread
        : null;
  const narrativeArcPreDepth =
    cont.rhizohNarrativeArc && typeof cont.rhizohNarrativeArc === "object"
      ? cont.rhizohNarrativeArc
      : diskMetaPreDepth.rhizohNarrativeArc && typeof diskMetaPreDepth.rhizohNarrativeArc === "object"
        ? diskMetaPreDepth.rhizohNarrativeArc
        : null;
  const memoryEpisodesPreDepth = Array.isArray(cont.rhizohMemoryEpisodes)
    ? cont.rhizohMemoryEpisodes
    : Array.isArray(diskMetaPreDepth.rhizohMemoryEpisodes)
      ? diskMetaPreDepth.rhizohMemoryEpisodes
      : [];
  const recentTurnsPreDepth = Array.isArray(cont.recentTurns)
    ? cont.recentTurns
    : Array.isArray(cont.turns)
      ? cont.turns
      : [];
  const dialogueThreadPre = buildRhizohDialogueThreadSnapshotV1({
    prev:
      cont.rhizohDialogueThread && typeof cont.rhizohDialogueThread === "object"
        ? cont.rhizohDialogueThread
        : diskMetaPreDepth.rhizohDialogueThread && typeof diskMetaPreDepth.rhizohDialogueThread === "object"
          ? diskMetaPreDepth.rhizohDialogueThread
          : null,
    narrativeThread: narrativeThreadPreDepth,
    narrativeArc: narrativeArcPreDepth,
    memoryEpisodes: memoryEpisodesPreDepth,
    recentTurns: recentTurnsPreDepth,
    emotions: emotionsPreDepth,
    userTurnCount: effectiveTurnCount
  });
  const llmDepthBundle = buildRhizohLlmDepthBundleV0({
    message: trimmed,
    conversationPhase: rhizohPhaseForTurn,
    userTurnCount: effectiveTurnCount,
    voiceTurn: isVoiceTurn,
    generationModeHint: generationMode,
    pinGenerationMode,
    callerGenerationMode: generationMode,
    narrativeThread: narrativeThreadPreDepth,
    narrativeArc: narrativeArcPreDepth,
    memoryEpisodes: memoryEpisodesPreDepth,
    recentTurns: recentTurnsPreDepth,
    persona: cont.persona,
    layerMission: layerProfile?.mission,
    traceId: clientTraceId,
    router: rhizohRouter,
    emotions: emotionsPreDepth,
    runtime: runtimeHints,
    continuity: cont,
    dialogueThread: dialogueThreadPre
  });
  const conversationDepth = llmDepthBundle.depth;
  const resolvedGenerationMode = llmDepthBundle.generationMode;
  logVoiceInfoV0("COGNITION_DEPTH_RESOLVED", {
    traceId: clientTraceId,
    conversationMode: conversationDepth.conversationMode,
    depthLevel: conversationDepth.depthLevel,
    continuityStrength: conversationDepth.continuityStrength,
    generationMode: resolvedGenerationMode,
    attentionScore: llmDepthBundle.attentionScore,
    foxComponents: llmDepthBundle.fox?.components || null,
    voiceTurn: isVoiceTurn
  });
  logVoiceInfoV0("FOX_ATTENTION_RESOLVED", {
    traceId: clientTraceId,
    attentionScore: llmDepthBundle.fox?.attentionScore ?? null,
    dominantSource: llmDepthBundle.foxAttentionField?.dominantSource ?? null,
    userSignal: llmDepthBundle.foxAttentionField?.userSignal ?? null,
    continuitySignal: llmDepthBundle.foxAttentionField?.continuitySignal ?? null,
    emotionalSignal: llmDepthBundle.foxAttentionField?.emotionalSignal ?? null,
    noveltySignal: llmDepthBundle.foxAttentionField?.noveltySignal ?? null,
    worldSignal: llmDepthBundle.foxAttentionField?.worldSignal ?? null,
    ghostBindings: llmDepthBundle.ghostAttentionBindings ?? null,
    recommendedConversationMode: llmDepthBundle.fox?.recommendedConversationMode ?? null,
    recommendedGenerationMode: llmDepthBundle.fox?.recommendedGenerationMode ?? null,
    significanceScore: llmDepthBundle.foxSignificanceField?.score ?? null,
    behaviorPosture: llmDepthBundle.foxBehaviorPosture?.posture ?? null,
    mayInitiate: llmDepthBundle.foxBehaviorPosture?.mayInitiate === true
  });

  const foxBehaviorGate = applyFoxBehaviorGateV1(llmDepthBundle, {
    traceId: clientTraceId,
    forceRecord: trimmed.length === 0
  });
  if (!foxBehaviorGate.outcome.mayProceedToLlm) {
    const gateSource =
      foxBehaviorGate.outcome.outcome === FOX_BEHAVIOR_OUTCOME_V1.INITIATE_QUEUED
        ? "fox_initiative_queued"
        : "fox_silent_observation";
    logVoiceInfoV0("FOX_BEHAVIOR_GATE_BLOCK", {
      traceId: clientTraceId,
      outcome: foxBehaviorGate.outcome.outcome,
      reason: foxBehaviorGate.outcome.reason,
      posture: llmDepthBundle.foxBehaviorPosture?.posture ?? null,
      ledgerRecorded: Boolean(foxBehaviorGate.ledgerEntry),
      initiativeQueued: Boolean(foxBehaviorGate.queueEntry)
    });
    return Object.freeze({
      reply: "",
      directive: "FOCUS_RHIZOH",
      source: gateSource,
      traceId: clientTraceId,
      llmBypass: true,
      foxBehaviorOutcome: foxBehaviorGate.outcome.outcome,
      foxBehaviorGate
    });
  }

  const sovereigntyWire = ensureTurnSovereigntyLockedV0({
    turnId: clientTraceId,
    text: trimmed,
    modality: isVoiceTurn ? "voice" : "text",
    continuity: cont,
    runtime: runtimeHints,
    router: rhizohRouter,
    depth: conversationDepth,
    conversationPhase: rhizohPhaseForTurn,
    userTurnCount: effectiveTurnCount,
    voice: isVoiceTurn
      ? {
          authority: voiceTurnMeta?.authority,
          commitment: behavioralCommitment,
          band:
            voiceTurnMeta?.witnessed?.observation?.band ||
            voiceTurnMeta?.band ||
            voiceTurnMeta?.preCommitment?.band,
          dispatchRoute: voiceTurnMeta?.dispatchRoute
        }
      : undefined
  });
  const turnSovereigntyLock = sovereigntyWire.lock;
  if (
    shouldBlockOnBoundaryViolationV0() &&
    !isCompanionContinuityFirstV0() &&
    turnSovereigntyLock?.sovereignReality === SOVEREIGN_REALITY_V0.PRESENCE_ACK &&
    turnSovereigntyLock.sovereignOutput?.text
  ) {
    const presenceReply = String(turnSovereigntyLock.sovereignOutput.text);
    logVoiceInfoV0("TURN_SOVEREIGNTY_PRESENCE_BYPASS", {
      traceId: clientTraceId,
      reason: turnSovereigntyLock.selectionReason
    });
    return Object.freeze({
      reply: presenceReply,
      directive: "FOCUS_RHIZOH",
      source: "turn_sovereignty_presence_ack",
      traceId: clientTraceId,
      llmBypass: true,
      turnSovereignty: turnSovereigntyLock
    });
  }
  const rhizohPolicy = deriveRhizohPolicy({ ...runtimeHints, rhizohRouter });
  runtimeHints = { ...runtimeHints, rhizohPolicy };
  enqueueCastleRuntimeTransaction({
    kind: "llm_turn",
    source: "chat",
    payload: {
      intent: String(rhizohRouter?.intent || "CHAT").slice(0, 32),
      msgLen: trimmed.length
    }
  });

  const relBase = cont.relationship && typeof cont.relationship === "object" ? cont.relationship : {};
  const emotionPrev =
    relBase.emotions && typeof relBase.emotions === "object" ? relBase.emotions : { ...DEFAULT_EMOTIONS };
  const emotionLastAt =
    typeof relBase.emotionUpdatedAt === "number" && Number.isFinite(relBase.emotionUpdatedAt)
      ? relBase.emotionUpdatedAt
      : null;
  const emotionsAfterDelta = applyEmotionDelta({
    current: emotionPrev,
    routerOutput: rhizohRouter,
    runtime: runtimeHints,
    continuity: cont,
    lastUpdatedAt: emotionLastAt
  });
  const tonePreGovernor = deriveRelationalTone(emotionsAfterDelta);
  const diskForPre = readClientContinuity();
  const diskMetaPre =
    diskForPre.meta && typeof diskForPre.meta === "object" ? diskForPre.meta : {};
  const govCalPre = normalizeGovernorCalibration(diskMetaPre.rhizohGovernorCalibration);
  const rhizohEmotions = softClampEmotionsToIdentityAnchor(emotionsAfterDelta, "preLlm", govCalPre);
  const relationalTone = blendRelationalToneForHealth(rhizohEmotions, healthState);
  const driftPre = buildRhizohDriftLogEntry({
    phase: "preLlm",
    emotionsPre: emotionsAfterDelta,
    emotionsPost: rhizohEmotions,
    tonePre: tonePreGovernor,
    tonePost: relationalTone,
    intent: rhizohRouter.intent,
    source: "input-turn",
    resonance: null
  });
  patchRhizohEmotionDisk(rhizohEmotions, relationalTone, undefined, undefined, driftPre);
  const emotionUpdatedAt = Date.now();
  const diskSnap = readClientContinuity();
  const diskMeta = diskSnap.meta && typeof diskSnap.meta === "object" ? diskSnap.meta : {};
  const tceeBootPhase = String(diskMeta.tceeBoot?.phase || TCEE_PHASE.PRE_BREATH);
  const govCalMem = normalizeGovernorCalibration(diskMeta.rhizohGovernorCalibration);
  const outcomeSessionMirror =
    cont.rhizohOutcomeSession && typeof cont.rhizohOutcomeSession === "object"
      ? cont.rhizohOutcomeSession
      : readOutcomeSessionFromMeta(diskMeta);
  const priorAssistantReplies = priorAssistantRepliesFromContinuity(cont);
  const bondForMemory = Math.min(
    1,
    Math.max(0, (Number(relBase.trust || 0) + Number(relBase.familiarity || 0)) / 2)
  );
  const episodeSlice = Array.isArray(diskMeta.rhizohMemoryEpisodes) ? diskMeta.rhizohMemoryEpisodes.slice(-16) : [];
  const turnSlice =
    Array.isArray(cont.rhizohWeightedMemory) && cont.rhizohWeightedMemory.length
      ? cont.rhizohWeightedMemory
      : Array.isArray(diskMeta.rhizohWeightedTurns)
        ? diskMeta.rhizohWeightedTurns.slice(-40)
        : [];
  const continuityRecallIntent = probeContinuityRecallIntentV0(trimmed);
  const continuityRecallBoost = continuityRecallIntent.active
    ? buildContinuityRecallBoostV0(trimmed, diskSnap)
    : null;
  const diskTurnCandidates = continuityRecallIntent.active
    ? collectContinuityRecallCandidatesV0(diskSnap).slice(-24)
    : [];
  const weightedMemorySource = [...episodeSlice, ...turnSlice, ...diskTurnCandidates].slice(-60);
  const rhizohMemoryEpisodes = Array.isArray(cont.rhizohMemoryEpisodes)
    ? cont.rhizohMemoryEpisodes
    : Array.isArray(diskMeta.rhizohMemoryEpisodes)
      ? diskMeta.rhizohMemoryEpisodes
      : [];
  const recallMemoryLimit = continuityRecallIntent.active ? 18 : 14;
  const rhizohWeightedRecollection = mergeRecallBoostIntoRecollectionV0(
    applyMemoryDominanceCap(
      selectWeightedMemoryTurns(weightedMemorySource, {
        now: Date.now(),
        queryIntent: continuityRecallIntent.active ? "CHAT" : rhizohRouter.intent,
        currentBond: Math.min(1, Math.max(0.08, bondForMemory || 0.35)),
        limit: recallMemoryLimit,
        currentPhysics: runtimeHints.socialPhysics,
        currentFieldTheory: runtimeHints.socialRegistry?.socialFieldTheory
      }),
      { maxTopShare: govCalMem.memoryMaxTopShare }
    ),
    continuityRecallBoost,
    { limit: recallMemoryLimit }
  );
  let rhizohRecallIdentityFeedback = null;
  let rhizohRecallMerge = null;
  if (tceeBootPhase === TCEE_PHASE.AWAKE) {
    try {
      const fb = computeIdentityFeedbackFromRecall(rhizohWeightedRecollection, {
        currentPhysics: runtimeHints.socialPhysics,
        now: Date.now()
      });
      if (fb) {
        const ig0 = readIdentityGraph();
        const igNext = applyRecallFeedbackToIdentityGraph(ig0, fb);
        rhizohRecallIdentityFeedback = fb;
        const payload = recallClosurePayloadForMeta(fb);
        rhizohRecallMerge =
          igNext && typeof igNext === "object"
            ? { identityGraphNext: igNext, recallClosurePayload: payload || null }
            : null;
      }
    } catch {
      /* noop */
    }
  }
  const igAfterRecall = rhizohRecallMerge?.identityGraphNext || readIdentityGraph();
  const rhizohRelAfterRecall = igAfterRecall.rhizoh || {};
  const relForLlm =
    tceeBootPhase === TCEE_PHASE.AWAKE
      ? {
          ...relBase,
          trust: Number(rhizohRelAfterRecall.trust ?? relBase.trust ?? 0),
          familiarity: Number(rhizohRelAfterRecall.familiarity ?? relBase.familiarity ?? 0),
          bondScore:
            Math.round(
              ((Number(rhizohRelAfterRecall.trust ?? relBase.trust ?? 0) +
                Number(rhizohRelAfterRecall.familiarity ?? relBase.familiarity ?? 0)) /
                2) *
                100
            ) / 100
        }
      : { ...relBase };
  const rhizohStabilityAnchor = getRhizohStabilityAnchorSnapshot();
  const rhizohNarrativeThread =
    cont.rhizohNarrativeThread && typeof cont.rhizohNarrativeThread === "object"
      ? cont.rhizohNarrativeThread
      : diskMeta.rhizohNarrativeThread && typeof diskMeta.rhizohNarrativeThread === "object"
        ? diskMeta.rhizohNarrativeThread
        : null;
  const rhizohNarrativeArc =
    cont.rhizohNarrativeArc && typeof cont.rhizohNarrativeArc === "object"
      ? cont.rhizohNarrativeArc
      : diskMeta.rhizohNarrativeArc && typeof diskMeta.rhizohNarrativeArc === "object"
        ? diskMeta.rhizohNarrativeArc
        : null;
  const reliabilityEpisodes = Array.isArray(diskMeta.rhizohReliabilityEpisodes)
    ? diskMeta.rhizohReliabilityEpisodes
    : [];
  const rhizohReliabilitySummary = formatReliabilityEpisodesSummaryForLlm(reliabilityEpisodes);
  const diskPersonaMerged =
    addressingPatch ||
    (diskSnap.persona && typeof diskSnap.persona === "object" ? diskSnap.persona : cont.persona) ||
    {};
  const basePersona =
    cont.persona && typeof cont.persona === "object" ? cont.persona : { firstName: "", displayName: "" };
  const effectivePersona = resolveRhizohEffectivePersonaV0(diskPersonaMerged, {
    authFirstName: basePersona.firstName,
    authDisplayName: basePersona.displayName,
    conversationPhase: rhizohPhaseForTurn,
    userTurnCount: effectiveTurnCount
  });
  const personaForLlm = mergePersonaForLlmV0(effectivePersona, basePersona);
  const rhizohPersonaAddressingDirective = buildAddressingPromptDirectiveV0(effectivePersona);
  const sportsLiveContext = probeSportsLiveQueryV0(trimmed).active
    ? await buildSportsLiveContextBoostV0(trimmed, { forceRefresh: false })
    : null;
  const contForLlm = {
    ...cont,
    persona: personaForLlm,
    runtime: {
      ...(cont.runtime && typeof cont.runtime === "object" ? cont.runtime : {}),
      gatewayPhase: runtimeHints.gatewayPhase,
      rhizohGatewayPhase: runtimeHints.rhizohGatewayPhase,
      healthState,
      rhizohPolicy,
      rhizohProductOrchestration: {
        schemaVersion: "1.0.0",
        orchestratorVersion: RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION,
        sessionId: rhizohProductSnap.sessionId,
        conversationPhase: rhizohPhaseForTurn,
        userTurnIndex: rhizohProductSnap.userTurnCount + 1,
        capabilityEnvelope: rhizohCapabilityEnvelope
      }
    },
    relationship: {
      ...relForLlm,
      emotions: rhizohEmotions,
      relationalTone,
      emotionUpdatedAt
    },
    rhizohWeightedRecollection,
    rhizohContinuityRecallBoost: continuityRecallBoost || undefined,
    rhizohSportsLiveContext: sportsLiveContext || undefined,
    rhizohPersonaAddressing: rhizohPersonaAddressingDirective
      ? Object.freeze({
          needsAddressingPrompt: true,
          directive: rhizohPersonaAddressingDirective,
          preferredAddress: personaForLlm.preferredAddress || "",
          addressingConfirmed: personaForLlm.addressingConfirmed === true
        })
      : Object.freeze({
          needsAddressingPrompt: false,
          preferredAddress: personaForLlm.preferredAddress || "",
          addressingConfirmed: personaForLlm.addressingConfirmed === true
        }),
    rhizohRecallIdentityFeedback,
    rhizohStabilityAnchor,
    rhizohNarrativeThread,
    rhizohMemoryEpisodes,
    rhizohNarrativeArc,
    rhizohDialogueThread: llmDepthBundle.dialogueThread || dialogueThreadPre,
    rhizohGovernorCalibration: govCalMem,
    rhizohReliabilityEpisodes: reliabilityEpisodes.slice(-12),
    rhizohReliabilitySummary,
    recentReliabilitySummary: rhizohReliabilitySummary,
    meta: {
      rhizohReliabilityEpisodes: reliabilityEpisodes.slice(-12),
      rhizohHealthInfluence,
      ...(rhizohRecallIdentityFeedback ? { rhizohRecallIdentityFeedback } : {})
    }
  };
  const slimVoicePathEffective = slimVoicePath || isVoiceTurn;
  if (slimVoicePathEffective) {
    contForLlm.rhizohMemoryEpisodes = Array.isArray(contForLlm.rhizohMemoryEpisodes)
      ? contForLlm.rhizohMemoryEpisodes.slice(-4)
      : [];
    contForLlm.rhizohReliabilityEpisodes = [];
    contForLlm.rhizohReliabilitySummary = "";
    contForLlm.recentReliabilitySummary = "";
    if (contForLlm.meta && typeof contForLlm.meta === "object") {
      contForLlm.meta = { ...contForLlm.meta, rhizohReliabilityEpisodes: [] };
    }
  }
  const mayWriteVoiceMemory =
    !isVoiceTurn ||
    behavioralCommitment?.memoryEligible === true ||
    Number(behavioralCommitment?.memoryStrength) >= 0.18;
  if (typeof persistRhizohEmotions === "function" && mayWriteVoiceMemory) {
    try {
      persistRhizohEmotions({ emotions: rhizohEmotions, relationalTone, emotionUpdatedAt });
    } catch {
      /* noop */
    }
  } else if (isVoiceTurn && behavioralCommitment) {
    logVoiceInfoV0("MEMORY_COMMIT_SKIP", {
      band: behavioralCommitment.band,
      commitment: behavioralCommitment.commitment,
      memoryEligible: behavioralCommitment.memoryEligible,
      behaviorEligible: behavioralCommitment.behaviorEligible,
      turnCounts: behavioralCommitment.turnCounts,
      memoryMode: behavioralCommitment.memoryMode,
      voiceMetaBand: voiceTurnMeta?.band || null,
      witnessedBand: voiceTurnMeta?.witnessed?.observation?.band || null,
      preCommitmentBand: voiceTurnMeta?.preCommitment?.band || null,
      turnAccepted: turnAcceptance?.accepted === true,
      turnReason: turnAcceptance?.reason || null,
      eligibility: "voice_emotion_session_blocked"
    });
    publishRhizohVoiceTurnMetaDebugV0({
      witnessed: voiceTurnMeta?.witnessed,
      band: voiceTurnMeta?.band,
      preCommitment: voiceTurnMeta?.preCommitment,
      commitment: behavioralCommitment,
      turnAccepted: turnAcceptance?.accepted === true,
      turnReason: turnAcceptance?.reason,
      source: voiceTurnMeta?.source,
      preview: trimmed.slice(0, 96)
    });
  }

  const cfg = getCastleFlightConfig();
  const endpoint = cfg.rhizohLlmHttp;
  const modeKey = normalizeRhizohGenerationModeId(resolvedGenerationMode);
  const maxTok = resolveRhizohLlmMaxTokensV0({
    generationMode: modeKey,
    userMessageChars: trimmed.length,
    voiceTurn: isVoiceTurn,
    depthMaxTokensCeiling: conversationDepth.maxTokensCeiling
  });
  if (!endpoint) {
    const replyStub = `Rhizoh: ${layerProfile.mission}. Talep al─▒nd─▒ -> ${message}. LLM i├ğin a─ş ge├ğidi (VITE_GATEWAY_HTTP veya VITE_RHIZOH_LLM_HTTP) tan─▒mlay─▒n; anahtar sunucuda OPENAI_API_KEY.`;
    const post = finalizeRhizohAfterLlm(rhizohEmotions, {
      rhizohRouter,
      reply: replyStub,
      source: "local-stub",
      runtimeHints,
      gatewayUx,
      persistRhizohEmotions,
      outcomeSession: outcomeSessionMirror,
      priorAssistantReplies
    });
    bumpRhizohProductSessionAfterReply();
    return {
      reply: replyStub,
      directive: "FOCUS_RHIZOH",
      source: "local-stub",
      traceId: "",
      llmProvider: null,
      llmModel: null,
      rhizohRouter,
      rhizohEmotions: post.emotions,
      relationalTone: post.relationalTone,
      outcomeResonance: post.outcomeResonance,
      emotionsPreOutcome: rhizohEmotions,
      outcomeSession: post.outcomeSession,
      rhizohRecallMerge
    };
  }

  const authHeader =
    idToken && String(idToken).trim()
      ? { Authorization: `Bearer ${String(idToken).trim()}` }
      : cfg.rhizohLlmToken
        ? { Authorization: `Bearer ${cfg.rhizohLlmToken}` }
        : {};

  const rhizohMultilingualPack = buildRhizohMultilingualPackV0({
    message: trimmed,
    navLocale: typeof navigator !== "undefined" ? navigator.language : ""
  });
  const langBundle = buildRhizohLanguagePropagationBundleV0();

  try {
    const llmBoundary = gateLlmInputForTurnV0(clientTraceId, "queryRhizohLLM");
    if (llmBoundary.block) {
      logVoiceInfoV0("TURN_SOVEREIGNTY_LLM_BLOCKED", {
        traceId: clientTraceId,
        reason: llmBoundary.reason,
        reality: turnSovereigntyLock?.sovereignReality
      });
      return Object.freeze({
        reply: turnSovereigntyLock?.sovereignOutput?.text || "",
        directive: "",
        source: "turn_sovereignty_llm_blocked",
        traceId: clientTraceId,
        llmBypass: true,
        turnSovereignty: turnSovereigntyLock,
        boundary: llmBoundary
      });
    }

    const baseLlmContext = {
      agentId: agentId || "",
      layerId: layerSpec.id,
      layerCode: layerSpec.code,
      layerName: layerSpec.name,
      mission: layerProfile.mission,
      detail: layerProfile.detail,
      reality: layerProfile.reality,
      camera: layerProfile.camera,
      simTime,
      continuity: contForLlm,
      rhizohRouter,
      rhizohProductOrchestration: {
        schemaVersion: "1.0.0",
        orchestratorVersion: RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION,
        sessionId: rhizohProductSnap.sessionId,
        conversationPhase: rhizohPhaseForTurn,
        userTurnIndex: rhizohProductSnap.userTurnCount + 1,
        capabilityEnvelope: rhizohCapabilityEnvelope
      },
      rhizohConversationLlmDirective: rhizohLlmDirective,
      rhizohStoryContinuitySnapshot: conversationDepth.storySnapshot,
      rhizohConversationDepth: {
        schema: conversationDepth.schema,
        conversationMode: conversationDepth.conversationMode,
        conversationIntent: conversationDepth.conversationIntent,
        depthLevel: conversationDepth.depthLevel,
        continuityStrength: conversationDepth.continuityStrength,
        attentionScore: llmDepthBundle.attentionScore,
        generationMode: modeKey,
        modeResolution: llmDepthBundle.modeResolution,
        foxAttention: llmDepthBundle.fox
          ? {
              schema: llmDepthBundle.fox.schema,
              attentionScore: llmDepthBundle.fox.attentionScore,
              components: llmDepthBundle.fox.components,
              recommendedConversationMode: llmDepthBundle.fox.recommendedConversationMode,
              recommendedGenerationMode: llmDepthBundle.fox.recommendedGenerationMode
            }
          : null
      },
      rhizohFoxAttentionField: llmDepthBundle.foxAttentionField || null,
      rhizohFoxSignificanceField: llmDepthBundle.foxSignificanceField || null,
      rhizohCastleAwarenessField: llmDepthBundle.castleAwarenessField || null,
      rhizohFoxBehaviorPosture: llmDepthBundle.foxBehaviorPosture || null,
      rhizohGhostStateV1: llmDepthBundle.ghostState || null,
      rhizohGhostPresentationBiasV1: llmDepthBundle.ghostPresentationBias || null,
      rhizohGhostPresentationPromptBlock: llmDepthBundle.ghostPresentationTonePromptBlock || "",
      rhizohGhostAttentionBindingsV1: llmDepthBundle.ghostAttentionBindings || null,
      rhizohFoxAttentionPromptBlock: llmDepthBundle.foxAttentionPromptBlock || "",
      rhizohFoxSignificancePromptBlock: llmDepthBundle.foxSignificancePromptBlock || "",
      rhizohMemoryInvitationPromptBlock: llmDepthBundle.memoryInvitationPromptBlock || "",
      rhizohSpatialCandidate: llmDepthBundle.spatialCandidate || null,
      rhizohDialogueThread: llmDepthBundle.dialogueThread || dialogueThreadPre,
      rhizohDialogueThreadPromptBlock:
        llmDepthBundle.rhizohDialogueThreadPromptBlock ||
        buildRhizohDialogueThreadPromptBlockV1(dialogueThreadPre),
      rhizohFoxContinuityPressure: llmDepthBundle.foxContinuityPressure || null,
      rhizohMultilingual: rhizohMultilingualPack.context,
      rhizohMultilingualDirective: rhizohMultilingualPack.directive,
      ...(getRhizohCohortIdForRequestV0() ? { cohortId: getRhizohCohortIdForRequestV0() } : {}),
      life_continuity: buildLifeContinuityContextHintsV0(),
      rhizohMemoryContract: `${[
        "continuity state is authoritative session memory (identity, castleState, ghostPet, recentReality, codex, relationship). Do not invent facts beyond it; reference continuity when relevant.",
        rhizohMultilingualPack.memoryContractAddon,
        "",
        rhizohMultilingualPack.directive,
        "",
        rhizohLlmDirective,
        "",
        llmDepthBundle.rhizohDialogueThreadPromptBlock ||
          buildRhizohDialogueThreadPromptBlockV1(dialogueThreadPre),
        "",
        llmDepthBundle.ghostPresentationTonePromptBlock ||
          buildGhostPresentationTonePromptBlockV1(llmDepthBundle.ghostPresentationBias),
        "",
        conversationDepth.depthDirective,
        "",
        llmDepthBundle.foxAttentionPromptBlock || "",
        "",
        llmDepthBundle.foxSignificancePromptBlock || ""
      ].join("\n")}`
    };
    const scopedContext = applyTurnSovereigntyPromptScopeToContextV0(baseLlmContext, turnSovereigntyLock);
    const scopedMaxTok = resolveTurnSovereigntyMaxTokensV0(maxTok, turnSovereigntyLock);

    const { body: llmBody } = trimRhizohLlmRequestBodyV0(
      {
        message,
        traceId: clientTraceId,
        provider,
        llmKeySource,
        connectionId: connectionId || "",
        ...langBundle.bodyFields,
        context: scopedContext,
        options: {
          maxTokens: scopedMaxTok,
          language: resolveRhizohLlmLanguageV0().bcp47 || rhizohMultilingualPack.respondBcp47,
          generationMode: modeKey,
          ...llmDepthBundle.gatewayOptions
        }
      },
      { voiceTurn: isVoiceTurn }
    );

    const fetchOpts = {
      method: "POST",
      body: JSON.stringify(llmBody),
      headers: mergeRhizohLanguagePropagationHeadersV0(
        {
          "Content-Type": "application/json",
          ...authHeader,
          "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
        },
        "",
        langBundle
      )
    };
    let timeoutCtrl = null;
    let timeoutId = 0;
    const llmTimeoutMs = Math.max(8000, Number(fetchTimeoutMs) || TEXT_LLM_TIMEOUT_MS);
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      fetchOpts.signal = AbortSignal.timeout(llmTimeoutMs);
    } else if (typeof AbortController !== "undefined") {
      timeoutCtrl = new AbortController();
      timeoutId = window.setTimeout(() => {
        try {
          timeoutCtrl.abort(new Error("rhizoh_llm_timeout"));
        } catch {
          /* noop */
        }
      }, llmTimeoutMs);
      fetchOpts.signal = timeoutCtrl.signal;
    }
    const res = await fetch(endpoint, fetchOpts);
    logRhizohHealth("gateway_accept", { traceId: clientTraceId, status: Number(res?.status || 0) });
    if (timeoutId) window.clearTimeout(timeoutId);

    let json;
    if (res.status === 202) {
      let accepted = null;
      try {
        accepted = await res.json();
      } catch {
        accepted = null;
      }
      const taskId = String(accepted?.taskId || "").trim();
      if (!taskId) {
        const bad = new Error("rhizoh_llm_async_missing_task_id");
        bad.rhizohFailureKind = "provider_error";
        throw bad;
      }
      const polled = await pollRhizohLlmWorkerTaskV0({
        endpoint,
        taskId,
        pollPath: accepted?.pollPath,
        headers: fetchOpts.headers,
        maxWaitMs: llmTimeoutMs
      });
      if (!polled.ok && polled.syncFallbackRecommended) {
        const syncRetry = await postRhizohLlmSyncFallbackV0({
          endpoint,
          fetchOpts,
          fetchImpl: fetch
        });
        if (syncRetry.ok && syncRetry.data) {
          json = syncRetry.data;
        } else if (!polled.ok) {
          const e = new Error(polled.error || polled.reply || "rhizoh_llm_async_poll_failed");
          e.rhizohFailureKind =
            polled.data?.rhizohFailureKind ||
            (polled.error === "rhizoh_llm_task_not_found" ? "client_config" : "provider_error");
          e.gatewayError = polled.gatewayError || polled.data?.error;
          e.gatewayDetail = polled.gatewayDetail || polled.data?.detail;
          if (polled.reply || polled.data?.reply) e.reply = String(polled.reply || polled.data?.reply);
          throw e;
        }
      } else if (!polled.ok) {
        const e = new Error(polled.error || polled.reply || "rhizoh_llm_async_poll_failed");
        e.rhizohFailureKind =
          polled.data?.rhizohFailureKind ||
          (polled.error === "rhizoh_llm_task_not_found" ? "client_config" : "provider_error");
        e.gatewayError = polled.gatewayError || polled.data?.error;
        e.gatewayDetail = polled.gatewayDetail || polled.data?.detail;
        if (polled.reply || polled.data?.reply) e.reply = String(polled.reply || polled.data?.reply);
        throw e;
      } else {
        json = polled.data;
      }
    } else if (!res.ok) {
      let errBody = null;
      try {
        errBody = await res.json();
      } catch {
        /* noop */
      }
      const e = new Error(`rhizoh_llm_http_${res.status}`);
      if (errBody && typeof errBody === "object") {
        if (errBody.rhizohFailureKind) e.rhizohFailureKind = String(errBody.rhizohFailureKind);
        if (errBody.providerHttpStatus != null) e.providerHttpStatus = Number(errBody.providerHttpStatus);
        if (errBody.languagePropagation) e.languagePropagation = errBody.languagePropagation;
        if (errBody.partialPropagation != null) e.partialPropagation = errBody.partialPropagation;
        if (errBody.rhizoh_language_trace_id) e.languageTraceId = String(errBody.rhizoh_language_trace_id);
        if (errBody.detail) e.gatewayDetail = String(errBody.detail);
        if (errBody.error) e.gatewayError = String(errBody.error);
      }
      e.languageTraceId = e.languageTraceId || langBundle.traceId;
      throw e;
    } else {
      try {
        json = await res.json();
      } catch {
        const bad = new Error("rhizoh_llm_bad_json");
        bad.rhizohFailureKind = "provider_error";
        throw bad;
      }
    }
    const turnTraceId = resolveRhizohTurnTraceIdV0(json?.traceId, clientTraceId);
    const normalized = publishRhizohLlmReplyNormalizedV0(normalizeRhizohLlmGatewayResponseV0(json));
    registerRhizohConversationRtlAfterTurnV0({
      prevPhase: rhizohPhaseBeforeTurn,
      nextPhase: rhizohPhaseForTurn,
      message: trimmed,
      normalized: { ...normalized, traceId: turnTraceId },
      prevThreadId: String(readUserAnchorV0()?.thread_id || "").trim() || undefined
    });
    const palForPulse = extractPalAnchorFromLifeProjectionV0(
      normalized.lifeEntityProjection,
      normalized.lifeEntityResolver
    );
    pushRhizohTurnContinuityPulseV0({
      message: trimmed,
      normalized: { ...normalized, traceId: turnTraceId },
      palLabel: palForPulse.label
    });
    const cohortIdSent = getRhizohCohortIdForRequestV0();
    publishRhizohSchemaRuntimeAuditV0({
      traceId: turnTraceId,
      cohortId: cohortIdSent || null,
      replySchemaVersion: normalized.replySchemaVersion,
      replyContractDriftClass: normalized.replyContractDriftClass,
      negotiationStatus: normalized.replySchemaNegotiation?.status ?? null,
      cohortPin: normalized.replySchemaNegotiation?.cohortPin ?? null,
      observationOnly: normalized.replySchemaNegotiation?.observationOnly === true
    });
    const formatDriftRolling = recordReplyFormatDriftSampleV0(
      toReplyFormatDriftSampleV0(normalized, turnTraceId)
    );
    const replyParsingConfidence = normalized.replyParsingConfidence;
    const replyFormatDriftScore = normalized.replyFormatDriftScore;
    logRhizohHealth("llm_response", {
      traceId: turnTraceId,
      clientTraceId,
      replyChars: normalized.reply.length,
      replySchemaVersion: normalized.replySchemaVersion,
      replyContractDriftClass: normalized.replyContractDriftClass,
      replySchemaNegotiationStatus: normalized.replySchemaNegotiation?.status ?? null,
      cohortId: cohortIdSent || null,
      contractOk: normalized.contractOk,
      contractDrift: normalized.contractDrift,
      rhizohDeliveryKind: normalized.deliveryKind,
      replyExtractPath: normalized.extractPath,
      replyParsingConfidence,
      replyFormatDriftScore,
      replyFormatDriftRolling: formatDriftRolling.replyFormatDriftRolling,
      providerExpectedFormat: normalized.providerExpectedFormat,
      observedFormat: normalized.observedFormat,
      rawProviderChars: normalized.rhizohCompressionLedger?.rawProviderChars ?? null
    });
    const mirrorLlmObs =
      import.meta.env?.DEV ||
      String(import.meta.env.VITE_CASTLE_LAYERS_DEBUG || "").trim() === "1";
    if (mirrorLlmObs && typeof window !== "undefined") {
      window.__CASTLE_RHIZOH_LLM_LAST_RESPONSE__ = Object.freeze({
        at: Date.now(),
        traceId: turnTraceId,
        replyPreview: normalized.reply.slice(0, 240),
        replyChars: normalized.reply.length,
        replySchemaVersion: normalized.replySchemaVersion,
        replyContractDriftClass: normalized.replyContractDriftClass,
        rhizohDeliveryKind: normalized.deliveryKind,
        replyExtractPath: normalized.extractPath,
        replyParsingConfidence,
        replyFormatDriftScore,
        replyFormatDriftRolling: formatDriftRolling,
        rawProviderChars: normalized.rhizohCompressionLedger?.rawProviderChars ?? null
      });
      window.__CASTLE_RHIZOH_REPLY_FORMAT_DRIFT__ = getReplyFormatDriftRollingV0();
      window.__CASTLE_RHIZOH_NARRATIVE_CAPABILITY__ = describeRhizohNarrativeLayerCapabilityV0();
    }
    if (!rhizohCapabilityEnvelope.backendHints.attachFullRhizohProduction && json && typeof json === "object") {
      try {
        delete json.rhizohProduction;
      } catch {
        /* noop */
      }
    }
    const replyOk = resolveRhizohReplyForDisplayV0(normalized, {
      emptyFallback:
        normalized.deliveryKind === "semantic_silence"
          ? ""
          : "Rhizoh yan─▒t─▒ bo┼ş d├Ând├╝."
    });
    const postOk = finalizeRhizohAfterLlm(rhizohEmotions, {
      rhizohRouter,
      reply: replyOk,
      source: "remote-llm",
      runtimeHints,
      gatewayUx,
      persistRhizohEmotions,
      outcomeSession: outcomeSessionMirror,
      priorAssistantReplies
    });
    bumpRhizohProductSessionAfterReply();
    const continuityHealthDetail = buildRhizohContinuityHealthDetailV0({
      phase: rhizohPhaseForTurn,
      traceId: turnTraceId,
      rhizohProductSnap,
      turnAcceptance,
      bondGovernance01,
      relPhase,
      tuning,
      voiceTurnMeta,
      phaseExit: rhizohPhaseExitProgress
    });
    logRhizohHealth("continuity_saved", continuityHealthDetail);
    publishRhizohTrustDebugV0(continuityHealthDetail);
    if (countsAsUserTurn) {
      bindTurnIdentityV0({
        turnId: turnTraceId,
        intent: rhizohRouter?.intent ?? null,
        preview: trimmed.slice(0, 120),
        modality: isVoiceTurn ? "voice" : "text",
        emotionalTone: postOk.relationalTone?.tone ?? null
      });
    }
    const rhizohDialogueThreadNext = advanceRhizohDialogueThreadV1(dialogueThreadPre, {
      userMessage: trimmed,
      assistantMessage: replyOk,
      intent: rhizohRouter?.intent || "CHAT",
      emotions: postOk.emotions,
      narrativeThread: rhizohNarrativeThread,
      narrativeArc: rhizohNarrativeArc,
      memoryEpisodes: contForLlm.rhizohMemoryEpisodes,
      outcomeResonance: postOk.outcomeResonance,
      turnIndex: effectiveTurnCount + 1
    });
    noteProactiveFeedbackEmotionalContextV1({ dialogueThread: rhizohDialogueThreadNext });
    return {
      reply: replyOk,
      directive: normalized.directive,
      source: "remote-llm",
      traceId: turnTraceId,
      llmProvider: json?.provider ?? provider ?? null,
      llmModel: json?.model ?? null,
      llmKeyBillingOwner: json?.llmKeyBillingOwner,
      llmKeyOrigin: json?.llmKeyOrigin,
      llmKeySourceUsed: json?.llmKeySourceUsed,
      rhizohDeliveryKind: normalized.deliveryKind,
      replyParsingConfidence,
      replyFormatDriftScore,
      replyFormatDriftRolling: formatDriftRolling.replyFormatDriftRolling,
      rhizohCompressionLedger: normalized.rhizohCompressionLedger,
      rhizohRouter,
      rhizohEmotions: postOk.emotions,
      relationalTone: postOk.relationalTone,
      outcomeResonance: postOk.outcomeResonance,
      emotionsPreOutcome: rhizohEmotions,
      outcomeSession: postOk.outcomeSession,
      rhizohRecallMerge,
      rhizohConversationDepth: conversationDepth,
      rhizohGenerationModeResolved: modeKey,
      rhizohAttentionScore: llmDepthBundle.attentionScore,
      rhizohDialogueThread: rhizohDialogueThreadNext,
      rhizohFoxContinuityPressure: llmDepthBundle.foxContinuityPressure || null
    };
  } catch (err) {
    const fail = classifyRhizohLlmClientFailure(err, err?.providerHttpStatus);
    try {
      window.__CASTLE_RHIZOH_LLM_DIAG__ = {
        at: Date.now(),
        endpoint: String(endpoint).split(/[?#]/)[0],
        message: String(err?.message || err || "fetch_failed"),
        rhizohFailureKind: fail.kind,
        httpStatus: fail.httpStatus
      };
      if (import.meta.env?.DEV) console.warn("[Rhizoh LLM]", endpoint, err);
    } catch {
      /* noop */
    }
    const httpBit = fail.httpStatus != null ? ` HTTP ${fail.httpStatus}` : "";
    const replyByKind =
      fail.kind === "timeout"
        ? `Rhizoh: Uzak model zaman a┼ş─▒m─▒. K─▒sa bir mesajla tekrar deneyin.`
        : fail.kind === "network_error"
          ? `Rhizoh: A─ş hatas─▒ ÔÇö ba─şlant─▒y─▒ kontrol edin.`
          : fail.kind === "rate_limit"
            ? `Rhizoh: ─░stek s─▒n─▒r─▒ a┼ş─▒ld─▒; bir s├╝re sonra tekrar deneyin.`
            : fail.kind === "client_config"
              ? `Rhizoh: Sunucu veya API anahtar─▒ yap─▒land─▒rmas─▒ eksik (client_config).`
              : fail.kind === "provider_error"
                ? `Rhizoh: Uzak model yan─▒t vermedi${httpBit}. Yerel protokolle devam ediyorum.`
                : `Rhizoh: Uzak LLM hatt─▒ yan─▒t vermedi (${fail.kind}). Yerel protokolle devam ediyorum -> ${message}`;
    const replyFb = replyByKind;
    const postFb = finalizeRhizohAfterLlm(rhizohEmotions, {
      rhizohRouter,
      reply: replyFb,
      source: "fallback",
      runtimeHints,
      gatewayUx,
      persistRhizohEmotions,
      outcomeSession: outcomeSessionMirror,
      priorAssistantReplies
    });
    bumpRhizohProductSessionAfterReply();
    logRhizohHealth(
      "continuity_saved",
      buildRhizohContinuityHealthDetailV0({
        phase: rhizohPhaseForTurn,
        rhizohProductSnap,
        turnAcceptance,
        bondGovernance01,
        relPhase,
        tuning,
        voiceTurnMeta,
        phaseExit: rhizohPhaseExitProgress,
        fallback: true
      })
    );
    return {
      reply: replyFb,
      directive: "FOCUS_RHIZOH",
      source: "fallback",
      traceId: "",
      llmProvider: null,
      llmModel: null,
      llmFailureKind: fail.kind,
      llmFailureHttpStatus: fail.httpStatus,
      rhizohRouter,
      rhizohEmotions: postFb.emotions,
      relationalTone: postFb.relationalTone,
      outcomeResonance: postFb.outcomeResonance,
      emotionsPreOutcome: rhizohEmotions,
      outcomeSession: postFb.outcomeSession,
      rhizohRecallMerge
    };
  }
}
