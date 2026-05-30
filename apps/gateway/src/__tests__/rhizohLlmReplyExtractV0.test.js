import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractRhizohLlmReplyFromProviderText,
  replyParsingConfidenceForExtractPathV0
} from "../rhizohLlmGateway.js";

describe("extractRhizohLlmReplyFromProviderText", () => {
  it("reads json.reply", () => {
    const out = extractRhizohLlmReplyFromProviderText(
      JSON.stringify({ reply: "Merhaba", directive: "NONE" })
    );
    assert.equal(out.reply, "Merhaba");
    assert.equal(out.extractPath, "json.reply");
    assert.equal(out.replyParsingConfidence, 1);
  });

  it("falls back to plain text when model ignores JSON schema", () => {
    const out = extractRhizohLlmReplyFromProviderText("Merhaba, ben buradayım.");
    assert.equal(out.reply, "Merhaba, ben buradayım.");
    assert.equal(out.extractPath, "plain_text_fallback");
    assert.equal(out.replyParsingConfidence, 0.5);
  });

  it("reads alternate message field", () => {
    const out = extractRhizohLlmReplyFromProviderText(
      JSON.stringify({ message: "Selam", directive: "NONE" })
    );
    assert.equal(out.reply, "Selam");
    assert.equal(out.extractPath, "json.alt_field");
    assert.equal(out.replyParsingConfidence, 0.7);
  });

  it("reads nested response with low confidence", () => {
    const out = extractRhizohLlmReplyFromProviderText(
      JSON.stringify({ response: { content: "İç içe" }, directive: "NONE" })
    );
    assert.equal(out.reply, "İç içe");
    assert.equal(out.extractPath, "json.nested_response");
    assert.equal(out.replyParsingConfidence, 0.3);
  });

  it("returns empty for empty raw", () => {
    const out = extractRhizohLlmReplyFromProviderText("   ");
    assert.equal(out.reply, "");
    assert.equal(out.extractPath, "empty_raw");
    assert.equal(out.replyParsingConfidence, 0);
  });
});

describe("replyParsingConfidenceForExtractPathV0", () => {
  it("maps known paths", () => {
    assert.equal(replyParsingConfidenceForExtractPathV0("json.reply"), 1);
    assert.equal(replyParsingConfidenceForExtractPathV0("json.alt_field"), 0.7);
    assert.equal(replyParsingConfidenceForExtractPathV0("plain_text_fallback"), 0.5);
    assert.equal(replyParsingConfidenceForExtractPathV0("json.nested_response"), 0.3);
  });

  it("uses 0.25 for unknown paths", () => {
    assert.equal(replyParsingConfidenceForExtractPathV0("future_path"), 0.25);
  });
});
