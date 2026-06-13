import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLlmContinuationUserMessageV0,
  isLlmCompletionTruncatedByLengthV0,
  mergeLlmContinuationRepliesV0,
  normalizeProviderFinishReasonV0
} from "../rhizohLlmLengthContinuationV0.js";

describe("rhizohLlmLengthContinuationV0", () => {
  it("normalizes provider finish reasons", () => {
    assert.equal(normalizeProviderFinishReasonV0("length"), "length");
    assert.equal(normalizeProviderFinishReasonV0("MAX_TOKENS"), "length");
    assert.equal(normalizeProviderFinishReasonV0("stop"), "stop");
  });

  it("detects length truncation", () => {
    assert.equal(isLlmCompletionTruncatedByLengthV0("max_tokens"), true);
    assert.equal(isLlmCompletionTruncatedByLengthV0("stop"), false);
  });

  it("merges continuation without duplicating overlap", () => {
    const merged = mergeLlmContinuationRepliesV0(
      "Bu hikâye uzun bir yolculukla başladı ve kahraman",
      "kahraman sonunda kaleye ulaştı."
    );
    assert.match(merged, /kaleye ulaştı/);
    assert.doesNotMatch(merged, /kahraman kahraman/);
  });

  it("builds continuation user message with partial reply", () => {
    const msg = buildLlmContinuationUserMessageV0("Yarım cümle", "Merhaba");
    assert.match(msg, /Yarım cümle/);
    assert.match(msg, /Merhaba/);
  });
});
