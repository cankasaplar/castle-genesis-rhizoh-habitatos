import { describe, expect, it } from "vitest";
import {
  normalizeRhizohLlmGatewayResponseV0,
  resolveRhizohReplyForDisplayV0,
  RHIZOH_LLM_REPLY_NORMALIZED_SCHEMA_V0
} from "../rhizohLlmReplyNormalizeV0.js";

describe("rhizohLlmReplyNormalizeV0", () => {
  it("uses gateway reply field only — ignores text/message/content", () => {
    const n = normalizeRhizohLlmGatewayResponseV0({
      text: "shadow text",
      message: "shadow message",
      content: "shadow content",
      reply: "canonical reply",
      rhizohCompressionLedger: { replyExtractPath: "json.reply", replyParsingConfidence: 1 }
    });
    expect(n.reply).toBe("canonical reply");
    expect(n.extractPath).toBe("json.reply");
    expect(n.schema).toBe(RHIZOH_LLM_REPLY_NORMALIZED_SCHEMA_V0);
  });

  it("merges drift metadata from ledger and top-level", () => {
    const n = normalizeRhizohLlmGatewayResponseV0({
      reply: "ok",
      rhizohDeliveryKind: "unstructured_reply",
      replyParsingConfidence: 0.5,
      replyFormatDriftScore: 0.5,
      observedFormat: "plain_text_fallback",
      rhizohCompressionLedger: {
        replyExtractPath: "plain_text_fallback",
        rawProviderChars: 120
      }
    });
    expect(n.deliveryKind).toBe("unstructured_reply");
    expect(n.replyParsingConfidence).toBe(0.5);
    expect(n.observedFormat).toBe("plain_text_fallback");
  });

  it("resolveRhizohReplyForDisplayV0 handles silence and empty", () => {
    const silence = normalizeRhizohLlmGatewayResponseV0({
      reply: "<SILENCE>",
      rhizohDeliveryKind: "semantic_silence"
    });
    expect(resolveRhizohReplyForDisplayV0(silence)).toBe("");

    const empty = normalizeRhizohLlmGatewayResponseV0({ reply: "", rhizohDeliveryKind: "empty_reply" });
    expect(resolveRhizohReplyForDisplayV0(empty, { emptyFallback: "boş" })).toBe("boş");
  });
});
