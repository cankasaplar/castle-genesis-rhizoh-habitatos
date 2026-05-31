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
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import { buildRhizohContinuityHealthDetailV0, publishRhizohTrustDebugV0 } from "./rhizohTrustDebugV0.js";
import { recordReplyFormatDriftSampleV0, getReplyFormatDriftRollingV0 } from "./replyFormatDriftTrackerV0.js";
import {
  normalizeRhizohLlmGatewayResponseV0,
  resolveRhizohReplyForDisplayV0,
  toReplyFormatDriftSampleV0,
  publishRhizohLlmReplyNormalizedV0,
  RHIZOH_REPLY_SCHEMA_V1
} from "./rhizohLlmReplyNormalizeV0.js";
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
  RHIZOH_CONVERSATION_ORCHESTRATOR_VERSION,
  advanceRhizohConversationPhase,
  buildRhizohConversationLlmDirective,
  buildRhizohProductCapabilityEnvelope,
  describeRhizohPhaseExitProgressV0
} from "../product/rhizohConversationOrchestratorV1.js";
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
  persistRhizohEmotions,
  gatewayUx,
  productDecisionOverlay,
  fetchTimeoutMs = TEXT_LLM_TIMEOUT_MS,
  slimVoicePath = false,
  voiceTurnMeta = null
}) {
  const trimmed = String(message || "").trim();
  const clientTraceId = createRhizohClientTraceIdV0();
  logRhizohHealth("ui_send", { traceId: clientTraceId, chars: trimmed.length });
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
      reply:
        "Ki┼şisel kale i├ğin taray─▒c─▒ konumu gerekir ÔÇö detay ├ğekmecesinde ┬½Sovereign Castle┬╗ panelinden ┬½Konum ile kur┬╗ kullan─▒n. Ya da tam komut: SPAWN CASTLE --owner sizin-id --lat 41.0082 --lon 28.9784 --type SANCTUARY",
      directive: "FOCUS_RHIZOH",
      source: "dsl-hint"
    };
  }

  const cont = continuity && typeof continuity === "object" ? continuity : {};
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
  if (isVoiceTurn) {
    if (voiceTurnMeta.witnessed) {
      turnAcceptance = runVoiceTurnGateAfterWitnessV0(voiceTurnMeta.witnessed, {
        ...(voiceTurnMeta && typeof voiceTurnMeta === "object" ? voiceTurnMeta : {}),
        text: trimmed,
        source: voiceTurnMeta.source || "mic",
        stage: "turn_gate"
      });
    } else {
      const pipe = runVoiceTranscriptWitnessPipelineV0({
        text: trimmed,
        confidence: voiceTurnMeta.confidence,
        strategy: voiceTurnMeta.strategy,
        maxRms: voiceTurnMeta.maxRms,
        source: voiceTurnMeta.source,
        stage: "turn_gate_full",
        checkRepeat: false,
        runTurnGate: true
      });
      turnAcceptance =
        pipe.turnAcceptance ||
        evaluateVoiceTurnAcceptanceV0({
          text: trimmed,
          source: voiceTurnMeta.source || "mic"
        });
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
      : null;
  if (isVoiceTurn && !behavioralCommitment) {
    const band =
      voiceTurnMeta.witnessed?.observation?.band ||
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
  const rhizohPhaseForTurn = advanceRhizohConversationPhase(
    rhizohProductSnap.conversationPhase,
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
  const weightedMemorySource = [...episodeSlice, ...turnSlice].slice(-52);
  const rhizohMemoryEpisodes = Array.isArray(cont.rhizohMemoryEpisodes)
    ? cont.rhizohMemoryEpisodes
    : Array.isArray(diskMeta.rhizohMemoryEpisodes)
      ? diskMeta.rhizohMemoryEpisodes
      : [];
  const rhizohWeightedRecollection = applyMemoryDominanceCap(
    selectWeightedMemoryTurns(weightedMemorySource, {
      now: Date.now(),
      queryIntent: rhizohRouter.intent,
      currentBond: Math.min(1, Math.max(0.08, bondForMemory || 0.35)),
      limit: 14,
      currentPhysics: runtimeHints.socialPhysics,
      currentFieldTheory: runtimeHints.socialRegistry?.socialFieldTheory
    }),
    { maxTopShare: govCalMem.memoryMaxTopShare }
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
  const contForLlm = {
    ...cont,
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
    rhizohRecallIdentityFeedback,
    rhizohStabilityAnchor,
    rhizohNarrativeThread,
    rhizohMemoryEpisodes,
    rhizohNarrativeArc,
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
  if (slimVoicePath) {
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
    !isVoiceTurn || behavioralCommitment?.memoryEligible === true;
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
      memoryEligible: behavioralCommitment.memoryEligible
    });
  }

  const cfg = getCastleFlightConfig();
  const endpoint = cfg.rhizohLlmHttp;
  const modeKey = normalizeRhizohGenerationModeId(generationMode);
  const maxTok = RHIZOH_GENERATION_MODE_MAX[modeKey] ?? 320;
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

  try {
    const fetchOpts = {
      method: "POST",
      body: JSON.stringify({
        message,
        traceId: clientTraceId,
        provider,
        llmKeySource,
        connectionId: connectionId || "",
        context: {
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
          /** Passive preference hint — gateway negotiates; client does not decide. */
          replySchemaPreference: RHIZOH_REPLY_SCHEMA_V1,
          rhizohMemoryContract: `${[
            "continuity state is authoritative session memory (identity, castleState, ghostPet, recentReality, codex, relationship). Do not invent facts beyond it; answer in natural Turkish and reference it when relevant. When you should hold quiet companionship without spoken reply, output only the tag <SILENCE> (optional attributes: intensity=0..1 resonance=0..1 durationMs=milliseconds state=listening|present).",
            "",
            rhizohLlmDirective
          ].join("\n")}`
        },
        options: {
          maxTokens: maxTok,
          language: "tr-TR",
          generationMode: modeKey
        }
      }),
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
      }
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
    if (!res.ok) {
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
      }
      throw e;
    }
    let json;
    try {
      json = await res.json();
    } catch {
      const bad = new Error("rhizoh_llm_bad_json");
      bad.rhizohFailureKind = "provider_error";
      throw bad;
    }
    const turnTraceId = resolveRhizohTurnTraceIdV0(json?.traceId, clientTraceId);
    const normalized = publishRhizohLlmReplyNormalizedV0(normalizeRhizohLlmGatewayResponseV0(json));
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
    if (import.meta.env?.DEV && typeof window !== "undefined") {
      window.__CASTLE_RHIZOH_LLM_LAST_RESPONSE__ = Object.freeze({
        at: Date.now(),
        traceId: turnTraceId,
        replyPreview: normalized.reply.slice(0, 240),
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
      rhizohRecallMerge
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
