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
  const cfg = getCastleFlightConfig();
  const endpoint = String(cfg.rhizohLlmHttp || "").trim();
  if (!endpoint) {
    return Object.freeze({ ok: false, error: "rhizoh_llm_http_unconfigured" });
  }

  const message = String(input.message || "").trim();
  if (!message) {
    return Object.freeze({ ok: false, error: "empty_message" });
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

  const headers = {
    "Content-Type": "application/json",
    "X-Castle-Dev-Uid": getOrCreateCastleDevUid()
  };
  if (input.idToken && String(input.idToken).trim()) {
    headers.Authorization = `Bearer ${String(input.idToken).trim()}`;
  } else if (cfg.rhizohLlmToken) {
    headers.Authorization = `Bearer ${cfg.rhizohLlmToken}`;
  }

  const body = {
    message,
    provider: input.provider ?? "openai",
    llmKeySource: input.llmKeySource ?? "auto",
    connectionId: String(input.connectionId || ""),
    context: {
      ...baseContext,
      continuity: { ...continuity, runtime },
      rhizohExpression: prep?.turn?.expression || null
    },
    options: {
      maxTokens: input.options?.maxTokens ?? 768,
      language: input.options?.language ?? fastPatch?.projectionLanguage ?? "tr-TR"
    }
  };

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

    if (!res.ok) {
      return Object.freeze({
        ok: false,
        error: `rhizoh_llm_http_${res.status}`,
        prep,
        traceId: input.traceId
      });
    }

    const data = await res.json();
    const normalized = normalizeRhizohLlmGatewayResponseV0(data);
    const reply = resolveRhizohReplyForDisplayV0(normalized);

    if (prep?.turn?.awaitSoftIntelligence) {
      void prep.turn.awaitSoftIntelligence();
    }

    return Object.freeze({
      ok: true,
      schema: RHIZOH_LLM_TURN_CLIENT_SCHEMA_V0,
      reply,
      normalized,
      directive: normalized.directive,
      traceId: String(normalized.traceId || input.traceId || ""),
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
