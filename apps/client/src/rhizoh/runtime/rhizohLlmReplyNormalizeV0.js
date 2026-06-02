/**
 * Response Normalization Layer v0 — ALL gateway LLM JSON → single canonical envelope.
 * Client MUST NOT re-extract reply from text/message/content (gateway owns extractPath).
 */

import { projectReplySchemaFromGatewayV1, RHIZOH_REPLY_SCHEMA_V1 } from "./rhizohReplySchemaRegistryV1.js";
import { dispatchExpressiveRealityContextV0 } from "./expressiveRealityTransitionV0.js";
import {
  isExpressiveRealityBootCompleteV0,
  triggerMemoryRecallMicroRtlV0
} from "./expressiveRealityMicroTransitionV0.js";
import { coerceRhizohUiReplyTextV0 } from "./rhizohLlmUiContractV0.js";

export const RHIZOH_LLM_REPLY_NORMALIZED_SCHEMA_V0 = "castle.rhizoh.llm_reply_normalized.v0";

export {
  RHIZOH_REPLY_SCHEMA_V1,
  RHIZOH_REPLY_SCHEMA_VERSION_V1,
  RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
} from "./rhizohReplySchemaRegistryV1.js";

export const RHIZOH_PROVIDER_EXPECTED_REPLY_FORMAT_V0 = "json.reply";

/** @typedef {"ok"|"empty_reply"|"semantic_silence"|"unstructured_reply"|string} RhizohDeliveryKindV0 */

/**
 * @param {unknown} v
 * @returns {number | null}
 */
function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} gatewayJson — POST /rhizoh/llm response body
 */
export function normalizeRhizohLlmGatewayResponseV0(gatewayJson) {
  const json =
    gatewayJson && typeof gatewayJson === "object" && !Array.isArray(gatewayJson)
      ? /** @type {Record<string, unknown>} */ (gatewayJson)
      : {};
  const ledger =
    json.rhizohCompressionLedger && typeof json.rhizohCompressionLedger === "object"
      ? /** @type {Record<string, unknown>} */ (json.rhizohCompressionLedger)
      : {};

  /** Gateway-normalized reply only — no client-side alt-field fallback. */
  const reply = String(json.reply ?? "").trim();

  const extractPath = String(
    ledger.replyExtractPath ?? json.observedFormat ?? json.extractPath ?? "unknown"
  );

  const deliveryKind = String(json.rhizohDeliveryKind ?? "ok");
  const schema = projectReplySchemaFromGatewayV1(json);

  return Object.freeze({
    schema: RHIZOH_LLM_REPLY_NORMALIZED_SCHEMA_V0,
    replySchemaRegistry: schema.replySchemaRegistry,
    replySchemaVersion: schema.replySchemaVersion,
    replySchemaNegotiation: schema.replySchemaNegotiation,
    replyContractDriftClass: schema.replyContractDriftClass,
    contractOk: schema.contractOk,
    contractDrift: schema.contractDrift,
    reply,
    extractPath,
    deliveryKind,
    directive: String(json.directive ?? json.action ?? ""),
    traceId: String(json.traceId ?? ""),
    provider: json.provider ?? null,
    model: json.model ?? null,
    replyParsingConfidence: numOrNull(json.replyParsingConfidence ?? ledger.replyParsingConfidence),
    replyFormatDriftScore: numOrNull(json.replyFormatDriftScore ?? ledger.replyFormatDriftScore),
    providerExpectedFormat: String(
      json.providerExpectedFormat ??
        ledger.providerExpectedFormat ??
        RHIZOH_PROVIDER_EXPECTED_REPLY_FORMAT_V0
    ),
    observedFormat: String(json.observedFormat ?? ledger.observedFormat ?? extractPath),
    rhizohCompressionLedger: Object.keys(ledger).length > 0 ? Object.freeze({ ...ledger }) : null,
    intents: Array.isArray(json.intents) ? Object.freeze([...json.intents]) : Object.freeze([]),
    llmKeyBillingOwner: json.llmKeyBillingOwner ?? null,
    llmKeyOrigin: json.llmKeyOrigin ?? null,
    llmKeySourceUsed: json.llmKeySourceUsed ?? null,
    lifeContinuity: json.lifeContinuity ?? null,
    lifeEntityProjection: json.lifeEntityProjection ?? null,
    lifeEntityResolver: json.lifeEntityResolver ?? null,
    lifeContinuityRecall: json.lifeContinuityRecall ?? null
  });
}

/**
 * User-visible reply string from canonical envelope.
 * @param {ReturnType<typeof normalizeRhizohLlmGatewayResponseV0>} normalized
 * @param {{ emptyFallback?: string }} [opts]
 */
export function resolveRhizohReplyForDisplayV0(normalized, opts = {}) {
  const emptyFallback = String(opts.emptyFallback ?? "");
  if (normalized.deliveryKind === "semantic_silence") return "";
  const reply = coerceRhizohUiReplyTextV0(normalized.reply, { fallback: emptyFallback });
  if (reply) return reply;
  return emptyFallback;
}

/**
 * @param {ReturnType<typeof normalizeRhizohLlmGatewayResponseV0>} normalized
 * @param {string} [traceId]
 */
export function toReplyFormatDriftSampleV0(normalized, traceId = "") {
  return {
    replyFormatDriftScore: normalized.replyFormatDriftScore,
    replyParsingConfidence: normalized.replyParsingConfidence,
    replyExtractPath: normalized.extractPath,
    observedFormat: normalized.observedFormat,
    providerExpectedFormat: normalized.providerExpectedFormat,
    traceId: String(traceId || normalized.traceId || "")
  };
}

/**
 * Dev / Metehan — last normalized envelope mirror (no execution authority).
 * @param {ReturnType<typeof normalizeRhizohLlmGatewayResponseV0>} normalized
 */
export function publishRhizohLlmReplyNormalizedV0(normalized) {
  if (typeof window === "undefined") return normalized;
  window.__CASTLE_RHIZOH_LLM_REPLY_NORMALIZED__ = normalized;
  if (normalized.lifeContinuity || normalized.lifeEntityProjection) {
    const lc =
      normalized.lifeContinuity && typeof normalized.lifeContinuity === "object"
        ? /** @type {Record<string, unknown>} */ (normalized.lifeContinuity)
        : null;
    dispatchExpressiveRealityContextV0({
      threadId: lc ? String(lc.thread_id || "") : "",
      traceId: normalized.traceId,
      lifeContinuity: normalized.lifeContinuity,
      lifeEntityProjection: normalized.lifeEntityProjection,
      lifeEntityResolver: normalized.lifeEntityResolver
    });
    if (isExpressiveRealityBootCompleteV0() && normalized.lifeContinuityRecall) {
      triggerMemoryRecallMicroRtlV0(normalized.lifeContinuityRecall, {
        threadId: lc ? String(lc.thread_id || "") : ""
      });
    }
  }
  return normalized;
}
