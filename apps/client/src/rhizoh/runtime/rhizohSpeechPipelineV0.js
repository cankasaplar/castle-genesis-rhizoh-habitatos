/**
 * Rhizoh speech reflex pipeline — STT norm → FAST PRECHECK → intent router → execution.
 */

import { normalizeForFastPrecheckV0 } from "./rhizohFastPrecheckV0.js";
import { applyReflexEffectivenessFeedbackV0 } from "./rhizohConfidenceDecayGateV0.js";
import { adaptMicroPersonalityFromReactionV0 } from "./rhizohMicroPersonalityV0.js";
import { normalizeSttTranscriptForOlpV0 } from "./normalizeSttTranscriptForOlpV0.js";
import { evaluateSttContaminationV0 } from "./voiceSttContaminationGuardV0.js";
import {
  buildInputProvenanceEnvelopeV0,
  validateMicIntentProvenanceV0,
  RHIZOH_INPUT_MODALITY_V0,
  RHIZOH_INPUT_SOURCE_V0
} from "./rhizohInputProvenanceV0.js";
import { runFastPrecheckFromTextV0, publishFastPrecheckHitV0 } from "./rhizohFastPrecheckV0.js";
import { routeVoiceInputV0, VOICE_ROUTE_EXECUTION_V0 } from "./rhizohVoiceCommandRouterV0.js";
import { classifyRhizohIntentV0 } from "./rhizohIntentRouterV0.js";
import { commitFinalUserVisibleLanguageV0 } from "./rhizohFinalLanguageCommitV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { logRhizohReflexTurnV0 } from "./rhizohReflexTurnLogV0.js";
import {
  detectAmbientSpeechV0,
  detectContinuationSpeechV0,
  resolveAmbientReplyV0,
  resolveContinuationHoldReplyV0
} from "./rhizohIntentRouterV0.js";
import { recordReflexStabilityTurnV0 } from "./rhizohReflexStabilityTraceV0.js";

function finalizePipelineResultV0(result, ctx = {}) {
  const frozen = Object.freeze(result);
  recordReflexStabilityTurnV0({
    traceId: ctx.traceId,
    pipeline: frozen,
    llmSuppressed: frozen.llmBypass === true,
    latencyMs: frozen.latencyMs
  });
  return frozen;
}

export const RHIZOH_SPEECH_PIPELINE_SCHEMA_V0 = "castle.rhizoh.speech_pipeline.v0";

/**
 * @param {string} rawText
 * @param {{ sttInferred?: string, traceId?: string, source?: string, modality?: string, confidence?: number, band?: string, strategy?: string, provenance?: object }} [ctx]
 */
export function runRhizohSpeechPipelineV0(rawText, ctx = {}) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const provenance =
    ctx.provenance ||
    buildInputProvenanceEnvelopeV0({
      text: rawText,
      source: ctx.source || RHIZOH_INPUT_SOURCE_V0.MIC_V3,
      modality: ctx.modality || RHIZOH_INPUT_MODALITY_V0.STT,
      confidence: ctx.confidence,
      band: ctx.band,
      strategy: ctx.strategy,
      traceId: ctx.traceId
    });
  const provenanceGate = validateMicIntentProvenanceV0(provenance);
  if (!provenanceGate.ok) {
    return finalizePipelineResultV0(
      {
        ok: false,
        stage: "provenance_reject",
        error: provenanceGate.error,
        provenance,
        llmBypass: true,
        silencePreferred: true,
        latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0)
      },
      ctx
    );
  }

  const reaction = applyReflexEffectivenessFeedbackV0(rawText);
  if (reaction && reaction !== "none") adaptMicroPersonalityFromReactionV0(reaction);

  const sttNorm = normalizeSttTranscriptForOlpV0(rawText);
  const msg = sttNorm.text;
  if (!msg) {
    return Object.freeze({ ok: false, error: "empty", stage: "stt_normalize" });
  }

  const locale = resolveOutputLanguageCodeV0();

  const contamination = evaluateSttContaminationV0(msg);
  if (contamination.contaminated) {
    return finalizePipelineResultV0(
      {
        ok: false,
        stage: "contamination_reject",
        error: contamination.reason,
        contamination,
        llmBypass: true,
        silencePreferred: true,
        latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0)
      },
      ctx
    );
  }

  const precheck = runFastPrecheckFromTextV0(msg, { locale, traceId: ctx.traceId });
  if (precheck) {
    publishFastPrecheckHitV0(precheck, {
      traceId: ctx.traceId,
      channel: "voice",
      routeClass: "greeting"
    });
    const committed = commitFinalUserVisibleLanguageV0(precheck.reply, {
      source: "fast_precheck",
      traceId: ctx.traceId,
      lockKey: "language_commit_lock"
    });
    return finalizePipelineResultV0(
      {
        ok: true,
        stage: "fast_precheck",
        execution: VOICE_ROUTE_EXECUTION_V0.FAST_LOCAL,
        precheck,
        reply: committed.text,
        llmBypass: true,
        latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0)
      },
      ctx
    );
  }

  const ambient = detectAmbientSpeechV0(msg);
  if (ambient) {
    const reply = resolveAmbientReplyV0(locale);
    logRhizohReflexTurnV0({
      intent: "ambient",
      response: reply || "(silence)",
      latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0),
      source: "ambient",
      layer: "intent_router",
      traceId: ctx.traceId,
      successScore: 0.75
    });
    return finalizePipelineResultV0(
      {
        ok: true,
        stage: "ambient",
        execution: VOICE_ROUTE_EXECUTION_V0.FAST_LOCAL,
        ambient: true,
        reply: reply || "",
        silencePreferred: !reply,
        llmBypass: true,
        latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0)
      },
      ctx
    );
  }

  const cont = detectContinuationSpeechV0(msg);
  if (cont) {
    const hold = resolveContinuationHoldReplyV0(msg, locale);
    logRhizohReflexTurnV0({
      intent: "continuation",
      response: hold.reply,
      latencyMs: hold.latencyMs,
      source: "continuation_hold",
      layer: "intent_router",
      traceId: ctx.traceId,
      successScore: 0.78
    });
    return finalizePipelineResultV0(
      {
        ok: true,
        stage: "continuation",
        execution: VOICE_ROUTE_EXECUTION_V0.FAST_LOCAL,
        continuation: true,
        reply: hold.reply,
        holdBuffer: hold.buffer,
        llmBypass: true,
        latencyMs: hold.latencyMs
      },
      ctx
    );
  }

  const route = routeVoiceInputV0(msg, { sttInferred: sttNorm.inferredInputLocale || ctx.sttInferred });
  const normalized = normalizeForFastPrecheckV0(msg);
  const intentPlan = classifyRhizohIntentV0(msg, {
    sttInferred: sttNorm.inferredInputLocale,
    localFailed: ctx.localFailed === true,
    reflexLatencyMs: ctx.reflexLatencyMs
  });

  if (intentPlan.useLlm && route.execution !== VOICE_ROUTE_EXECUTION_V0.LOCAL) {
    return finalizePipelineResultV0(
      {
        ok: true,
        stage: "intent_router",
        route: Object.freeze({
          ...route,
          execution: VOICE_ROUTE_EXECUTION_V0.LLM,
          decayEscalation: intentPlan.decay
        }),
        intentPlan,
        message: msg,
        sttNorm,
        llmBypass: false,
        escalateToLlm: true,
        latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0)
      },
      ctx
    );
  }

  return finalizePipelineResultV0(
    {
      ok: true,
      stage: "intent_router",
      route,
      intentPlan,
      message: msg,
      sttNorm,
      llmBypass:
        route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL ||
        route.execution === VOICE_ROUTE_EXECUTION_V0.FAST_LOCAL,
      latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0)
    },
    ctx
  );
}
