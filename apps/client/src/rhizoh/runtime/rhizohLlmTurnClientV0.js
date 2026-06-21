/**
 * Rhizoh LLM client — POST /rhizoh/llm with fast-speech context patch.
 */

import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import { getOrCreateCastleDevUid } from "../useRhizohGatewayMonitor.js";
import {
  prepareRhizohLlmTurnV0,
  buildRhizohLlmContextPatchFromPrepV0
} from "./rhizohLlmTurnHotWireV0.js";
import {
  normalizeRhizohLlmGatewayResponseV0,
  resolveRhizohReplyForDisplayV0
} from "./rhizohLlmReplyNormalizeV0.js";
import {
  buildRhizohLanguagePropagationBundleV0,
  mergeRhizohLanguagePropagationHeadersV0,
  resolveRhizohLlmLanguageV0
} from "./rhizohLanguagePropagationV0.js";
import { trimRhizohLlmRequestBodyV0 } from "./rhizohLlmPayloadTrimV0.js";
import { tryResolveMemoryConsentTurnV1 } from "./rhizohMemoryConsentTurnV1.js";
import { pollRhizohLlmWorkerTaskV0, postRhizohLlmSyncFallbackV0 } from "./rhizohLlmWorkerPollV0.js";
import {
  tryResolveRhizohLocalKnowledgeV0,
  resolveTeacherSourceFromProviderV0
} from "./rhizohPolicyRouterV0.js";
import { ingestTeacherExchangeV0 } from "./rhizohTeacherIngestV0.js";
import { buildObserverInviteLlmContextPatchV0 } from "../ingress/observerInviteOnboardingV0.js";

export const RHIZOH_LLM_TURN_CLIENT_SCHEMA_V0 = "castle.rhizoh.llm_turn_client.v0";

/**
 * @param {{
 *   message: string,
 *   traceId?: string,
 *   sessionId?: string,
 *   connectionId?: string,
 *   provider?: string,
 *   llmKeySource?: string,
 *   idToken?: string,
 *   voiceTurn?: boolean,
 *   speakInstantAck?: boolean,
 *   userTurnCount?: number,
 *   conversationPhase?: string,
 *   context?: Record<string, unknown>,
 *   options?: { maxTokens?: number, language?: string },
 *   fetchImpl?: typeof fetch,
 *   skipHotWire?: boolean
 * }} input
 */
export async function postRhizohLlmTurnV0(input = {}) {
  const fetchFn = input.fetchImpl ?? fetch;

  const message = String(input.message || "").trim();
  if (!message) {
    return Object.freeze({ ok: false, error: "empty_message" });
  }

  const consentTurn = tryResolveMemoryConsentTurnV1(message, { traceId: input.traceId });
  if (consentTurn?.reply) {
    return Object.freeze({
      ok: true,
      schema: RHIZOH_LLM_TURN_CLIENT_SCHEMA_V0,
      reply: consentTurn.reply,
      traceId: String(input.traceId || consentTurn.traceId || ""),
      source: consentTurn.source,
      llmBypass: true,
      spatialAnchor: consentTurn.spatialAnchor || null,
      consentStatus: consentTurn.consentStatus
    });
  }

  const localKnowledge = tryResolveRhizohLocalKnowledgeV0(message, { traceId: input.traceId });
  if (localKnowledge?.reply) {
    return Object.freeze({
      ok: true,
      schema: RHIZOH_LLM_TURN_CLIENT_SCHEMA_V0,
      reply: localKnowledge.reply,
      traceId: String(input.traceId || localKnowledge.traceId || ""),
      source: localKnowledge.source,
      knowledgeId: localKnowledge.knowledgeId,
      matchScore: localKnowledge.matchScore,
      llmBypass: true,
      askRhizoh: true
    });
  }

  const cfg = getCastleFlightConfig();
  const endpoint = String(cfg.rhizohLlmHttp || "").trim();
  if (!endpoint) {
    return Object.freeze({ ok: false, error: "rhizoh_llm_http_unconfigured" });
  }

  let prep = null;
  if (input.skipHotWire !== true) {
    prep = prepareRhizohLlmTurnV0({
      traceId: input.traceId,
      message,
      sessionId: input.sessionId,
      voiceTurn: input.voiceTurn === true,
      speakInstantAck: input.speakInstantAck,
      userTurnCount: input.userTurnCount,
      conversationPhase: input.conversationPhase,
      sourcePath: input.sourcePath || "llm_turn_client"
    });
  }

  const fastPatch = prep ? buildRhizohLlmContextPatchFromPrepV0(prep) : null;
  const baseContext =
    input.context && typeof input.context === "object" ? { ...input.context } : {};
  const continuity =
    baseContext.continuity && typeof baseContext.continuity === "object"
      ? { ...baseContext.continuity }
      : {};
  const runtime =
    continuity.runtime && typeof continuity.runtime === "object"
      ? { ...continuity.runtime }
      : {};

  if (fastPatch) {
    runtime.rhizohFastSpeech = fastPatch;
    runtime.scheduling = fastPatch.scheduling;
  }

  const invitePatch = buildObserverInviteLlmContextPatchV0();
  if (invitePatch) {
    runtime.observerInvite = invitePatch;
  }

  const langBundle = buildRhizohLanguagePropagationBundleV0();
  const llmLang = resolveRhizohLlmLanguageV0();
  const headers = mergeRhizohLanguagePropagationHeadersV0(
    {
      "Content-Type": "application/json",
      "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
    },
    "",
    langBundle
  );
  if (input.idToken && String(input.idToken).trim()) {
    headers.Authorization = `Bearer ${String(input.idToken).trim()}`;
  } else if (cfg.rhizohLlmToken) {
    headers.Authorization = `Bearer ${cfg.rhizohLlmToken}`;
  }

  const { body } = trimRhizohLlmRequestBodyV0(
    {
      message,
      ...(input.provider ? { provider: input.provider } : {}),
      ...(input.model ? { model: input.model } : {}),
      llmKeySource: input.llmKeySource ?? "auto",
      connectionId: String(input.connectionId || ""),
      ...langBundle.bodyFields,
      context: {
        ...baseContext,
        continuity: { ...continuity, runtime },
        rhizohExpression: prep?.turn?.expression || null
      },
      options: {
        maxTokens: input.options?.maxTokens ?? 768,
        language: input.options?.language ?? llmLang.bcp47,
        ...(typeof input.options?.temperature === "number"
          ? { temperature: input.options.temperature }
          : {})
      }
    },
    { voiceTurn: input.voiceTurn === true }
  );

  try {
    const res = await fetchFn(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal:
        typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(55_000)
          : undefined
    });

    if (res.status === 202) {
      let accepted = null;
      try {
        accepted = await res.json();
      } catch {
        accepted = null;
      }
      const taskId = String(accepted?.taskId || "").trim();
      if (!taskId) {
        return Object.freeze({
          ok: false,
          error: "rhizoh_llm_async_missing_task_id",
          traceId: input.traceId
        });
      }
      const polled = await pollRhizohLlmWorkerTaskV0({
        endpoint,
        taskId,
        pollPath: accepted?.pollPath,
        headers,
        fetchImpl: fetchFn,
        maxWaitMs: 120_000
      });
      let data = polled.ok ? polled.data : null;
      if (!polled.ok && polled.syncFallbackRecommended) {
        const syncRetry = await postRhizohLlmSyncFallbackV0({
          endpoint,
          fetchOpts: {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal:
              typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
                ? AbortSignal.timeout(55_000)
                : undefined
          },
          fetchImpl: fetchFn
        });
        if (syncRetry.ok && syncRetry.data) data = syncRetry.data;
      }
      if (!data) {
        return Object.freeze({
          ok: false,
          error: polled.error || "rhizoh_llm_async_poll_failed",
          taskId,
          reply: polled.reply || polled.data?.reply,
          gatewayError: polled.gatewayError || polled.data?.error,
          gatewayDetail: polled.gatewayDetail || polled.data?.detail,
          traceId: input.traceId
        });
      }
      const normalized = normalizeRhizohLlmGatewayResponseV0(data);
      const reply = resolveRhizohReplyForDisplayV0(normalized);
      if (prep?.turn?.awaitSoftIntelligence) {
        void prep.turn.awaitSoftIntelligence();
      }
      const teacherSource = resolveTeacherSourceFromProviderV0(
        input.provider || normalized?.provider || data?.provider
      );
      if (reply) {
        ingestTeacherExchangeV0({
          question: message,
          answer: reply,
          provider: input.provider,
          teacher: teacherSource,
          traceId: String(normalized.traceId || input.traceId || taskId)
        });
      }
      return Object.freeze({
        ok: true,
        schema: RHIZOH_LLM_TURN_CLIENT_SCHEMA_V0,
        reply,
        normalized,
        directive: normalized.directive,
        traceId: String(normalized.traceId || input.traceId || taskId),
        source: teacherSource,
        teacherIngested: Boolean(reply),
        replyParsingConfidence: normalized.replyParsingConfidence,
        replyFormatDriftScore: normalized.replyFormatDriftScore,
        extractPath: normalized.extractPath,
        deliveryKind: normalized.deliveryKind,
        raw: data,
        prep,
        asyncTaskId: taskId
      });
    }

    if (!res.ok) {
      let errBody = null;
      try {
        errBody = await res.json();
      } catch {
        /* noop */
      }
      return Object.freeze({
        ok: false,
        error: `rhizoh_llm_http_${res.status}`,
        prep,
        traceId: input.traceId,
        languageTraceId: langBundle.traceId,
        languagePropagation: errBody?.languagePropagation ?? langBundle.snapshot,
        partialPropagation: errBody?.partialPropagation,
        gatewayError: errBody?.error,
        gatewayDetail: errBody?.detail
      });
    }

    const data = await res.json();
    const normalized = normalizeRhizohLlmGatewayResponseV0(data);
    const reply = resolveRhizohReplyForDisplayV0(normalized);

    if (prep?.turn?.awaitSoftIntelligence) {
      void prep.turn.awaitSoftIntelligence();
    }

    const teacherSource = resolveTeacherSourceFromProviderV0(
      input.provider || normalized?.provider || data?.provider
    );
    if (reply) {
      ingestTeacherExchangeV0({
        question: message,
        answer: reply,
        provider: input.provider,
        teacher: teacherSource,
        traceId: String(normalized.traceId || input.traceId || "")
      });
    }

    return Object.freeze({
      ok: true,
      schema: RHIZOH_LLM_TURN_CLIENT_SCHEMA_V0,
      reply,
      normalized,
      directive: normalized.directive,
      traceId: String(normalized.traceId || input.traceId || ""),
      source: teacherSource,
      teacherIngested: Boolean(reply),
      replyParsingConfidence: normalized.replyParsingConfidence,
      replyFormatDriftScore: normalized.replyFormatDriftScore,
      extractPath: normalized.extractPath,
      deliveryKind: normalized.deliveryKind,
      raw: data,
      prep
    });
  } catch (e) {
    return Object.freeze({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      prep,
      traceId: input.traceId
    });
  }
}
