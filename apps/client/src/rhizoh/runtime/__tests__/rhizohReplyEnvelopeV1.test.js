import { describe, expect, it } from "vitest";
import {
  projectRhizohReplyEnvelopeV1,
  RHIZOH_REPLY_ENVELOPE_SCHEMA_V1,
  resolveRhizohReplyForDisplayV0,
  normalizeRhizohLlmGatewayResponseV0
} from "../rhizohReplyEnvelopeV1.js";

describe("rhizohReplyEnvelopeV1", () => {
  it("projects gateway JSON into replyEnvelopeV1 — alt fields invisible", () => {
    const env = projectRhizohReplyEnvelopeV1({
      text: "only in text",
      message: "only in message",
      content: "only in content"
    });
    expect(env.schema).toBe(RHIZOH_REPLY_ENVELOPE_SCHEMA_V1);
    expect(env.reply).toBe("");
    expect(env.extractPath).toBe("unknown");
  });

  it("json.alt_field only → client knows nothing (empty display)", () => {
    const normalized = normalizeRhizohLlmGatewayResponseV0({
      text: "shadow",
      message: "shadow",
      content: "shadow"
    });
    expect(normalized.reply).toBe("");
    expect(resolveRhizohReplyForDisplayV0(normalized, { emptyFallback: "boş" })).toBe("boş");
  });

  it("maps confidence and driftScore from gateway", () => {
    const env = projectRhizohReplyEnvelopeV1({
      reply: "merhaba",
      rhizohDeliveryKind: "ok",
      replyParsingConfidence: 0.95,
      replyFormatDriftScore: 0.1,
      rhizohCompressionLedger: { replyExtractPath: "json.reply" }
    });
    expect(env.reply).toBe("merhaba");
    expect(env.confidence).toBe(0.95);
    expect(env.driftScore).toBe(0.1);
    expect(env.extractPath).toBe("json.reply");
  });
});
