/**
 * Voice → LLM dispatch — policy + command + commit kernel (instrumented).
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import { postRhizohLlmTurnV0 } from "./rhizohLlmTurnClientV0.js";
import {
  probeVoiceTranscriptDispatchV0,
  noteVoiceTranscriptDispatchedV0
} from "./voiceTranscriptDispatchDedupV0.js";
import { recordVoiceTimelineEventV0 } from "./voiceShadowTimelineV0.js";
import { speakRhizohReplyChunkedV0 } from "./rhizohSpeechChunkTtsV0.js";
import { buildConversationContinuityGlueV0 } from "./rhizohConversationContinuityGlueV0.js";
import { recordConversationMirrorLlmCompleteV0 } from "./rhizohConversationBehaviorMirrorV0.js";
import { normalizeSttTranscriptForOlpV0 } from "./normalizeSttTranscriptForOlpV0.js";
import { validateLocalCommandPostSttV0 } from "./castleCommandInvariantV0.js";
import {
  executeLocalVoiceCommandV0,
  VOICE_ROUTE_EXECUTION_V0
} from "./rhizohVoiceCommandRouterV0.js";
import { runRhizohSpeechPipelineV0 } from "./rhizohSpeechPipelineV0.js";
import { executeMicroIntentVoiceV0 } from "./rhizohMicroIntentRouterV0.js";
import { classifyRhizohIntentV0, resolveLlmTransitionAckV0 } from "./rhizohIntentRouterV0.js";
import {
  applyReflexEffectivenessFeedbackV0,
  noteLocalReflexFailureV0
} from "./rhizohConfidenceDecayGateV0.js";
import { normalizeForFastPrecheckV0 } from "./rhizohFastPrecheckV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import {
  commitFinalUserVisibleLanguageV0,
  LANGUAGE_COMMIT_LOCK_KEY_V0
} from "./rhizohFinalLanguageCommitV0.js";
import {
  buildHybridLlmConfirmDirectiveV0,
  executeHybridLocalFirstV0
} from "./rhizohHybridVoiceExecutionV0.js";
import { recordOlpBehavioralTurnV0 } from "./rhizohOlpInteractionToneV0.js";
import { recordExecutionGraphNodeV0 } from "./rhizohCommandExecutionGraphV0.js";
import { enforceLatencyBudgetV0 } from "./rhizohCastleLatencyBudgetV0.js";
import { buildExecutionReplayTapeFromTraceV0 } from "./rhizohExecutionGraphReplayEngineV0.js";
import {
  closeVoiceExecutionTraceV0,
  openVoiceExecutionTraceV0,
  traceLocalExecPhaseV0,
  traceRoutePhaseV0,
  traceSttNormalizePhaseV0
} from "./rhizohVoiceExecutionKernelV0.js";
import {
  buildInputProvenanceEnvelopeV0,
  validateMicIntentProvenanceV0,
  RHIZOH_INPUT_MODALITY_V0,
  RHIZOH_INPUT_SOURCE_V0
} from "./rhizohInputProvenanceV0.js";
import { VOICE_PIPELINE_PATH_V0 } from "./rhizohVoiceDualPathRouterV0.js";
import {
  isRhizohLivingConversationSurfaceV1,
  resolveFastReflexBridgeCopyV1
} from "../experience/rhizohLivingConversationSurfaceV1.js";
import {
  resolveVoiceUxFallbackV0,
  resolveSemanticGrayLlmShapingV0,
  shouldNoteVoiceVerifyBudgetV0
} from "./rhizohVoiceGrayZoneVerifyV0.js";
import { resolveMvicV0 } from "./rhizohMinimumPresenceExpressionV0.js";
import { noteVoiceVerifyAttemptV0, isVoiceVerifyBudgetExhaustedV0 } from "./rhizohVoiceVerifyBudgetV0.js";
import { resolveConversationAuthorityV0 } from "./rhizohVoiceConversationAuthorityV0.js";
import {
  ensureTurnSovereigntyLockedV0,
  gateVoiceOutputForTurnV0
} from "./turnSovereigntyWireV0.js";
import { SOVEREIGN_REALITY_V0 } from "./behavioralTurnSovereigntyV0.js";
import { speakVoiceInstantAckV0 } from "./voiceInstantAckV0.js";
import {
  tryInstantPresenceFastPathV0,
  noteLlmThinkingAfterPresenceV0
} from "./rhizohInstantPresenceLayerV0.js";
import { noteThinkingContinuityV0 } from "./rhizohContinuityKernelV0.js";
import { bindTurnIdentityV0 } from "./rhizohIdentityContinuityCoreV0.js";
import {
  recordTranscriptAcceptedV0,
  recordTranscriptRejectedV0
} from "./rhizohTranscriptAcceptanceLedgerV0.js";
import { notePersonaSchedulerUserActivityV0 } from "./rhizohPersonaLoopSchedulerV0.js";
import { routeRhizohInput } from "../router/routeRhizohInput.js";

export const RHIZOH_VOICE_LLM_DISPATCH_SCHEMA_V0 = "castle.rhizoh.voice_llm_dispatch.v0";

function makeTraceIdV0() {
  return `TRC-VLD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isHybridExecutionV0(execution) {
  return (
    execution === VOICE_ROUTE_EXECUTION_V0.HYBRID_LOCAL_FIRST ||
    execution === VOICE_ROUTE_EXECUTION_V0.HYBRID ||
    execution === "hybrid"
  );
}

export async function handleRhizohVoiceTranscriptV0(text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) {
    return Object.freeze({ ok: false, error: "empty_transcript" });
  }

  const traceId = String(opts.traceId || makeTraceIdV0());
  const sttBudgetMs = Number(opts.sttBudgetMs) || 0;
  const provenance = buildInputProvenanceEnvelopeV0({
    text: raw,
    source: opts.source || RHIZOH_INPUT_SOURCE_V0.MIC_V3,
    modality: opts.modality || RHIZOH_INPUT_MODALITY_V0.STT,
    confidence: opts.confidence,
    band: opts.witnessed?.observation?.band || opts.band,
    strategy: opts.strategy,
    traceId
  });
  const provenanceGate = validateMicIntentProvenanceV0(provenance);
  if (!provenanceGate.ok) {
    recordTranscriptRejectedV0({
      text: raw,
      reason: provenanceGate.error || "provenance_reject",
      source: provenance.source
    });
    logVoiceWarnV0("VOICE_PROVENANCE_REJECT", {
      error: provenanceGate.error,
      originHash: provenance.originHash,
      source: provenance.source,
      preview: raw.slice(0, 96)
    });
    return Object.freeze({ ok: false, error: provenanceGate.error, provenance });
  }

  openVoiceExecutionTraceV0(traceId, {
    input: raw,
    source: provenance.source,
    originHash: provenance.originHash
  });

  const sttNorm = traceSttNormalizePhaseV0(traceId, () => normalizeSttTranscriptForOlpV0(raw));
  if (sttBudgetMs > 0) {
    enforceLatencyBudgetV0("stt", sttBudgetMs, traceId);
  }
  const msg = sttNorm.text;
  if (!msg) {
    closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "empty" });
    return Object.freeze({ ok: false, error: "empty_transcript" });
  }

  const authority =
    opts.authority ||
    resolveConversationAuthorityV0({
      decision: opts.decision,
      band: opts.band || opts.witnessed?.observation?.band,
      pipelinePath: opts.pipelinePath,
      text: msg
    });
  if (!authority.maySpeak) {
    recordTranscriptRejectedV0({
      text: msg,
      reason: authority.reason || "authority_silent",
      source: provenance.source,
      sessionId: opts.sessionId,
      confidence: opts.confidence,
      band: opts.band,
      pipelinePath: opts.pipelinePath
    });
    logVoiceInfoV0("VOICE_AUTHORITY_SILENT", {
      reason: authority.reason,
      path: authority.path,
      strict: authority.strict,
      preview: msg.slice(0, 96),
      source: provenance.source
    });
    closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "authority_silent",
      authoritySilent: true
    });
    const mvic = resolveMvicV0({
      reason: authority.reason || "authority_silent",
      eventTag: "VOICE_AUTHORITY_SILENT",
      sessionId: opts.sessionId
    });
    return Object.freeze({ ok: true, authoritySilent: true, authority, mvic });
  }

  recordTranscriptAcceptedV0({
    text: msg,
    source: provenance.source,
    sessionId: opts.sessionId,
    confidence: opts.confidence,
    band: opts.band,
    pipelinePath: opts.pipelinePath
  });

  const presenceFast = await tryInstantPresenceFastPathV0(msg, {
    traceId,
    source: provenance.source,
    band: opts.band || opts.witnessed?.observation?.band,
    authority,
    speakReply: opts.speakReply !== false,
    conversationPhase: opts.conversationPhase,
    userTurnCount: opts.userTurnCount,
    router: routeRhizohInput(msg, opts.continuity || {}, {
      gatewayPhase: opts.gatewayPhase,
      healthState: opts.healthState
    })
  });
  notePersonaSchedulerUserActivityV0();

  if (presenceFast.handled) {
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "instant_presence_fast_path",
      llmBypass: true
    });
    if (noteLlmThinkingAfterPresenceV0(msg, traceId)) {
      /* mixed wake+substance — caller may continue; pure wake stops here */
    }
    return Object.freeze({ ...presenceFast.result, graph });
  }

  const uxFallback = resolveVoiceUxFallbackV0(opts.decision, msg, {
    locale: resolveOutputLanguageCodeV0(),
    sessionId: opts.sessionId
  });
  if (uxFallback?.reply) {
    const reply = String(uxFallback.reply || "").trim();
    if (shouldNoteVoiceVerifyBudgetV0(opts.decision, opts.sessionId)) {
      noteVoiceVerifyAttemptV0(opts.sessionId);
    }
    if (opts.speakReply !== false && reply) {
      await speakRhizohReplyChunkedV0(reply, {
        smoothAfterAck: false,
        committedText: true,
        traceId
      });
    }
    recordOlpBehavioralTurnV0({
      channel: "voice",
      depthMode: uxFallback.kind === "uncertainty_hold" ? "uncertainty_hold" : "gray_verify"
    });
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: uxFallback.kind || "ux_fallback",
      uxFallback: true
    });
    return Object.freeze({
      ok: true,
      uxFallback: true,
      grayVerify: uxFallback.kind !== "uncertainty_hold",
      uncertaintyHold: uxFallback.kind === "uncertainty_hold",
      reply,
      traceId,
      decision: opts.decision,
      graph,
      llmBypass: true
    });
  }

  if (opts.decision?.speakMode === "hold") {
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "ux_budget_silent_hold",
      uxBudgetExhausted: isVoiceVerifyBudgetExhaustedV0(opts.sessionId)
    });
    return Object.freeze({
      ok: true,
      silentHold: true,
      uxBudgetExhausted: true,
      traceId,
      decision: opts.decision,
      graph,
      llmBypass: true
    });
  }

  const livingSurface = isRhizohLivingConversationSurfaceV1();

  let pipeline = traceRoutePhaseV0(traceId, () =>
    runRhizohSpeechPipelineV0(raw, {
      sttInferred: sttNorm.inferredInputLocale,
      traceId,
      localFailed: false,
      reflexLatencyMs: 0,
      source: provenance.source,
      modality: provenance.modality,
      confidence: provenance.confidence,
      band: provenance.band || opts.band,
      strategy: provenance.strategy,
      provenance,
      pipelinePath:
        opts.pipelinePath === "slow" ? VOICE_PIPELINE_PATH_V0.SLOW : VOICE_PIPELINE_PATH_V0.FAST
    })
  );

  if (opts.pipelinePath === "fast" && pipeline.stage === "fast_drop") {
    if (livingSurface) {
      pipeline = traceRoutePhaseV0(traceId, () =>
        runRhizohSpeechPipelineV0(raw, {
          sttInferred: sttNorm.inferredInputLocale,
          traceId,
          localFailed: false,
          reflexLatencyMs: 0,
          source: provenance.source,
          modality: provenance.modality,
          confidence: provenance.confidence,
          band: provenance.band || opts.band,
          strategy: provenance.strategy,
          provenance,
          pipelinePath: VOICE_PIPELINE_PATH_V0.SLOW
        })
      );
    } else {
      closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "fast_drop" });
      return Object.freeze({ ok: false, error: pipeline.error || "fast_path_no_reflex", pipeline });
    }
  }

  if (opts.pipelinePath !== "fast" && pipeline.escalateToLlm && pipeline.intentPlan?.decay?.reasons?.length) {
    noteLocalReflexFailureV0(true);
  }

  if (
    !livingSurface &&
    (pipeline.stage === "fast_precheck" || pipeline.stage === "ambient" || pipeline.stage === "continuation")
  ) {
    const reply = pipeline.reply || "";
    if (opts.speakReply !== false && reply && !pipeline.silencePreferred) {
      await speakRhizohReplyChunkedV0(reply, {
        smoothAfterAck: false,
        committedText: true,
        traceId
      });
    }
    recordOlpBehavioralTurnV0({ channel: "voice", depthMode: pipeline.stage });
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: pipeline.stage,
      precheck: pipeline.precheck?.source
    });
    return Object.freeze({
      ok: true,
      fastPrecheck: pipeline.stage === "fast_precheck",
      ambient: pipeline.ambient === true,
      continuation: pipeline.continuation === true,
      reply,
      traceId,
      pipeline,
      graph,
      llmBypass: true
    });
  }

  if (opts.pipelinePath === "fast" && !livingSurface) {
    closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "fast_path_llm_blocked" });
    return Object.freeze({ ok: false, error: "fast_path_llm_blocked", pipeline });
  }

  const route = pipeline.route;
  if (!route) {
    closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "no_route" });
    return Object.freeze({ ok: false, error: "pipeline_no_route", pipeline });
  }

  if (pipeline.escalateToLlm && route.execution === VOICE_ROUTE_EXECUTION_V0.LLM) {
    /* decay gate → skip reflex; fall through to LLM dispatch below */
  } else if (route.execution === VOICE_ROUTE_EXECUTION_V0.FAST_LOCAL) {
    const microT0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const micro = executeMicroIntentVoiceV0(route, { traceId });
    const microMs =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - microT0;
    traceLocalExecPhaseV0(traceId, String(route.microIntent || "micro"), microMs);

    if (opts.speakReply !== false && micro.reply) {
      await speakRhizohReplyChunkedV0(micro.reply, {
        smoothAfterAck: false,
        committedText: true,
        traceId
      });
    }
    recordOlpBehavioralTurnV0({ channel: "voice", depthMode: "micro_intent" });
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "fast_local",
      microIntent: route.microIntent
    });
    const replayTape = buildExecutionReplayTapeFromTraceV0(traceId);
    return Object.freeze({
      ok: true,
      fastLocal: true,
      microIntent: route.microIntent,
      route,
      reply: micro.reply || "",
      traceId,
      graph,
      replayTape,
      llmBypass: true
    });
  }

  if (route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL) {
    const invariant = validateLocalCommandPostSttV0(route);
    if (!invariant.ok) {
      closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "local_invariant_fail" });
      return Object.freeze({ ok: false, error: invariant.reason, route });
    }
    const localT0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const local = executeLocalVoiceCommandV0(route, { traceId });
    const localMs =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - localT0;
    traceLocalExecPhaseV0(traceId, String(route.canonical || route.grammarLocal?.kind || ""), localMs);

    if (opts.speakReply !== false && local.reply) {
      await speakRhizohReplyChunkedV0(local.reply, {
        smoothAfterAck: true,
        committedText: true,
        traceId
      });
    }
    recordOlpBehavioralTurnV0({ channel: "voice", depthMode: "local_command" });
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "local",
      canonical: route.canonical || route.grammarLocal?.kind
    });
    const replayTape = buildExecutionReplayTapeFromTraceV0(traceId);
    return Object.freeze({
      ok: true,
      local: true,
      route,
      reply: local.reply || "",
      traceId,
      graph,
      replayTape
    });
  }

  if (isHybridExecutionV0(route.execution)) {
    const hybridT0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const hybrid = executeHybridLocalFirstV0(route, msg, traceId);
    enforceLatencyBudgetV0(
      "hybrid_local",
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - hybridT0,
      traceId
    );

    recordExecutionGraphNodeV0(traceId, {
      id: "hybrid_local_first",
      phase: "hybrid_local_first",
      trigger: msg.slice(0, 96),
      localAction: true,
      llmFallback: false,
      sideEffects: Object.freeze(["hybrid:snapshot"]),
      edgeFrom: "route",
      edgeLabel: "hybrid_local"
    });

    if (opts.speakReply !== false && hybrid.localReply) {
      await speakRhizohReplyChunkedV0(hybrid.localReply, {
        smoothAfterAck: true,
        committedText: true,
        traceId
      });
    }

    const llmMessage = `${buildHybridLlmConfirmDirectiveV0(hybrid.snapshot, msg)}\n\n${msg}`;
    const out = await postRhizohLlmTurnV0({
      message: llmMessage,
      traceId,
      sessionId: opts.sessionId,
      connectionId: opts.connectionId,
      voiceTurn: true,
      speakInstantAck: false,
      userTurnCount: opts.userTurnCount,
      conversationPhase: opts.conversationPhase,
      idToken: opts.idToken,
      sourcePath: "voice_hybrid_llm_confirm"
    });

    if (!out.ok) {
      closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "hybrid_llm_fail" });
      return Object.freeze({ ok: false, error: out.error, traceId, hybrid, route });
    }

    recordExecutionGraphNodeV0(traceId, {
      id: "hybrid_llm_confirm",
      phase: "hybrid_llm_confirm",
      trigger: msg.slice(0, 96),
      localAction: false,
      llmFallback: true,
      sideEffects: Object.freeze(["llm:explain_only"]),
      edgeFrom: "hybrid_local_first",
      edgeLabel: "llm_confirm"
    });

    const committed = commitFinalUserVisibleLanguageV0(out.reply, {
      source: "llm",
      traceId,
      idempotencyKey: traceId,
      lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
    });

    if (opts.speakReply !== false && committed.text) {
      await speakRhizohReplyChunkedV0(committed.text, {
        smoothAfterAck: false,
        committedText: true,
        traceId
      });
    }

    recordOlpBehavioralTurnV0({ channel: "voice", depthMode: "hybrid" });
    const graph = closeVoiceExecutionTraceV0(traceId, { ok: true, execution: "hybrid" });
    const replayTape = buildExecutionReplayTapeFromTraceV0(traceId);
    return Object.freeze({
      ok: true,
      hybrid: true,
      phases: route.hybridPhases,
      snapshot: hybrid.snapshot,
      traceId: out.traceId || traceId,
      reply: committed.text,
      commitFromCache: committed.fromCache === true,
      graph,
      replayTape
    });
  }

  const sovereigntyWire = ensureTurnSovereigntyLockedV0({
    turnId: traceId,
    text: msg,
    modality: "voice",
    source: opts.source || provenance.source,
    conversationPhase: opts.conversationPhase,
    userTurnCount: opts.userTurnCount,
    voice: {
      authority,
      band: opts.band || opts.witnessed?.observation?.band,
      dispatchRoute: opts.dispatchRoute
    },
    router: routeRhizohInput(msg, opts.continuity || {}, {
      gatewayPhase: opts.gatewayPhase,
      healthState: opts.healthState
    })
  });

  if (
    sovereigntyWire.wire?.speakPresenceAck &&
    sovereigntyWire.lock?.sovereignReality === SOVEREIGN_REALITY_V0.PRESENCE_ACK
  ) {
    const presenceText = String(
      sovereigntyWire.lock.sovereignOutput?.text ||
        sovereigntyWire.lock.subReality?.phraseVariant ||
        "Buradayım."
    );
    const voiceGate = gateVoiceOutputForTurnV0(traceId, "presence_ack");
    let spoke = false;
    if (!voiceGate.block && opts.speakReply !== false) {
      spoke = speakVoiceInstantAckV0(presenceText, { traceId, moduleId: "voice_llm_dispatch_presence" });
    }
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "turn_sovereignty_presence_ack",
      llmBypass: true
    });
    return Object.freeze({
      ok: true,
      presenceAck: true,
      reply: presenceText,
      spoke,
      traceId,
      turnSovereignty: sovereigntyWire.lock,
      graph,
      llmBypass: true
    });
  }

  if (
    sovereigntyWire.wire?.speakFastReflex &&
    sovereigntyWire.lock?.sovereignReality === SOVEREIGN_REALITY_V0.FAST_REFLEX &&
    sovereigntyWire.lock?.sovereignOutput?.text
  ) {
    const reflexText = String(sovereigntyWire.lock.sovereignOutput.text);
    const voiceGate = gateVoiceOutputForTurnV0(traceId, "fast_reflex");
    let spoke = false;
    if (!voiceGate.block && opts.speakReply !== false) {
      spoke = speakVoiceInstantAckV0(reflexText, { traceId, moduleId: "voice_llm_dispatch_fast_reflex" });
    }
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "turn_sovereignty_fast_reflex",
      llmBypass: true
    });
    return Object.freeze({
      ok: true,
      fastReflex: true,
      reply: reflexText,
      spoke,
      traceId,
      turnSovereignty: sovereigntyWire.lock,
      graph,
      llmBypass: true
    });
  }

  if (sovereigntyWire.wire?.bypassLlm && sovereigntyWire.wire?.silentObserve) {
    bindTurnIdentityV0({
      turnId: traceId,
      intent: "silent_observe",
      preview: msg,
      modality: "voice"
    });
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "turn_sovereignty_silent_observe",
      llmBypass: true
    });
    return Object.freeze({
      ok: true,
      silentObserve: true,
      traceId,
      turnSovereignty: sovereigntyWire.lock,
      graph,
      llmBypass: true
    });
  }

  bindTurnIdentityV0({
    turnId: traceId,
    intent: sovereigntyWire.lock?.sovereignReality,
    emotionalTone: sovereigntyWire.lock?.subReality?.emotionalTone,
    preview: msg,
    modality: "voice"
  });

  const dedup = probeVoiceTranscriptDispatchV0(msg);
  if (!dedup.ok) {
    logVoiceWarnV0("VOICE_LLM_DISPATCH_DEDUP", dedup);
    closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "dedup" });
    return Object.freeze({ ok: false, error: dedup.reason, dedup });
  }

  noteVoiceTranscriptDispatchedV0(msg);

  recordExecutionGraphNodeV0(traceId, {
    id: "llm_turn",
    phase: "llm",
    trigger: msg.slice(0, 96),
    localAction: false,
    llmFallback: true,
    sideEffects: Object.freeze(["llm:reasoning"]),
    edgeFrom: "route",
    edgeLabel: "llm"
  });

  recordVoiceTimelineEventV0({
    kind: "execution_dispatch",
    preview: msg.slice(0, 96),
    source: opts.source || "voice_llm_dispatch",
    stage: "llm_post",
    executionAccepted: true,
    route: route.execution,
    atMs: Date.now()
  });

  const intentPlan = classifyRhizohIntentV0(msg, { sttInferred: sttNorm.inferredInputLocale });

  logVoiceInfoV0("VOICE_LLM_DISPATCH", {
    traceId,
    chars: msg.length,
    source: opts.source,
    routeClass: intentPlan.routeClass,
    confidence: intentPlan.confidence
  });

  noteThinkingContinuityV0({
    source: "llm_dispatch",
    intent: intentPlan.routeClass,
    preview: msg
  });

  if (opts.speakTransitionAck !== false) {
    const locale = resolveOutputLanguageCodeV0();
    const ack = livingSurface
      ? resolveFastReflexBridgeCopyV1(String(locale || "tr").toLowerCase().startsWith("tr"), intentPlan.routeClass || "acknowledge")
      : resolveLlmTransitionAckV0(locale);
    await speakRhizohReplyChunkedV0(ack, {
      smoothAfterAck: true,
      committedText: false,
      traceId
    });
  }

  const llmT0 = Date.now();
  const semanticGray = resolveSemanticGrayLlmShapingV0(opts.decision);
  const out = await postRhizohLlmTurnV0({
    message: msg,
    traceId,
    sessionId: opts.sessionId,
    connectionId: opts.connectionId,
    voiceTurn: true,
    speakInstantAck: false,
    userTurnCount: opts.userTurnCount,
    conversationPhase: opts.conversationPhase,
    idToken: opts.idToken,
    sourcePath: semanticGray ? "voice_llm_dispatch_semantic_gray" : "voice_llm_dispatch",
    context: semanticGray
      ? {
          voicePipeline: Object.freeze({
            semanticGray: true,
            shaping: semanticGray
          })
        }
      : undefined,
    options: semanticGray
      ? { maxTokens: semanticGray.maxTokens, temperature: semanticGray.temperatureCap }
      : undefined
  });
  const llmWaitMs = Date.now() - llmT0;
  const glue = buildConversationContinuityGlueV0({ prep: out.prep, llmWaitMs });
  recordConversationMirrorLlmCompleteV0({ llmWaitMs, ok: out.ok });

  if (!out.ok) {
    logVoiceWarnV0("VOICE_LLM_DISPATCH_FAIL", { traceId, error: out.error });
    closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "llm_fail" });
    return Object.freeze({ ok: false, error: out.error, traceId, prep: out.prep, glue });
  }

  const commitT0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const committed = commitFinalUserVisibleLanguageV0(out.reply, {
    source: "llm",
    traceId,
    idempotencyKey: traceId,
    lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
  });
  enforceLatencyBudgetV0(
    "language_commit",
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - commitT0,
    traceId
  );

  recordExecutionGraphNodeV0(traceId, {
    id: "language_commit",
    phase: "language_commit",
    trigger: String(committed.text || "").slice(0, 80),
    localAction: false,
    llmFallback: false,
    sideEffects: Object.freeze([`commit:${committed.guardStep}`]),
    edgeFrom: "llm_turn",
    edgeLabel: "commit"
  });

  if (opts.speakReply !== false && committed.text) {
    await speakRhizohReplyChunkedV0(committed.text, {
      smoothAfterAck: true,
      glue,
      committedText: true,
      traceId
    });
  }

  recordOlpBehavioralTurnV0({
    channel: "voice",
    depthMode: out.prep?.turn?.expression?.conversationBehavior?.depthMode || "llm"
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastVoiceLlmDispatch = Object.freeze({
      schema: RHIZOH_VOICE_LLM_DISPATCH_SCHEMA_V0,
      traceId: out.traceId || traceId,
      replyChars: committed.text.length,
      commitFromCache: committed.fromCache === true,
      atMs: Date.now()
    });
  }

  const graph = closeVoiceExecutionTraceV0(traceId, { ok: true, execution: "llm" });
  const replayTape = buildExecutionReplayTapeFromTraceV0(traceId);
  return Object.freeze({
    ok: true,
    traceId: out.traceId || traceId,
    reply: committed.text,
    prep: out.prep,
    glue,
    commitFromCache: committed.fromCache === true,
    graph,
    replayTape
  });
}
