/**
 * Reply Envelope v1 — client SSOT projection layer (render only, no re-extract).
 * Gateway owns provider parse + extractPath; client projects gateway JSON → frozen envelope.
 *
 * @see docs/RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md
 */

export const RHIZOH_REPLY_ENVELOPE_SCHEMA_V1 = "castle.rhizoh.reply_envelope.v1";

export {
  RHIZOH_LLM_REPLY_NORMALIZED_SCHEMA_V0,
  RHIZOH_PROVIDER_EXPECTED_REPLY_FORMAT_V0,
  normalizeRhizohLlmGatewayResponseV0,
  resolveRhizohReplyForDisplayV0,
  toReplyFormatDriftSampleV0,
  publishRhizohLlmReplyNormalizedV0
} from "./rhizohLlmReplyNormalizeV0.js";

import { normalizeRhizohLlmGatewayResponseV0 } from "./rhizohLlmReplyNormalizeV0.js";

/**
 * Project gateway /rhizoh/llm JSON → replyEnvelopeV1 (canonical client boundary).
 * @param {unknown} gatewayJson
 */
export function projectRhizohReplyEnvelopeV1(gatewayJson) {
  const envelope = normalizeRhizohLlmGatewayResponseV0(gatewayJson);
  return Object.freeze({
    schema: RHIZOH_REPLY_ENVELOPE_SCHEMA_V1,
    reply: envelope.reply,
    extractPath: envelope.extractPath,
    deliveryKind: envelope.deliveryKind,
    confidence: envelope.replyParsingConfidence,
    driftScore: envelope.replyFormatDriftScore,
    traceId: envelope.traceId,
    providerExpectedFormat: envelope.providerExpectedFormat,
    observedFormat: envelope.observedFormat
  });
}
