import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractRhizohLlmReplyFromProviderText } from "../rhizohLlmGateway.js";

describe("extractRhizohLlmReplyFromProviderText", () => {
  it("reads json.reply", () => {
    const out = extractRhizohLlmReplyFromProviderText(
      JSON.stringify({ reply: "Merhaba", directive: "NONE" })
    );
    assert.equal(out.reply, "Merhaba");
    assert.equal(out.extractPath, "json.reply");
  });

  it("falls back to plain text when model ignores JSON schema", () => {
    const out = extractRhizohLlmReplyFromProviderText("Merhaba, ben buradayım.");
    assert.equal(out.reply, "Merhaba, ben buradayım.");
    assert.equal(out.extractPath, "plain_text_fallback");
  });

  it("reads alternate message field", () => {
    const out = extractRhizohLlmReplyFromProviderText(
      JSON.stringify({ message: "Selam", directive: "NONE" })
    );
    assert.equal(out.reply, "Selam");
    assert.equal(out.extractPath, "json.alt_field");
  });

  it("returns empty for empty raw", () => {
    const out = extractRhizohLlmReplyFromProviderText("   ");
    assert.equal(out.reply, "");
    assert.equal(out.extractPath, "empty_raw");
  });
});
