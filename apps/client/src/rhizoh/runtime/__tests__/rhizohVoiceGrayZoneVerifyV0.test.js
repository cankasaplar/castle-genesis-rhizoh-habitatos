import { describe, expect, it } from "vitest";
import {
  hasMeaningfulSpeechSignalV0,
  resolveGrayZoneVerifyReplyV0,
  resolveUncertaintyHoldReplyV0,
  resolveVoiceConfidenceTierV0,
  VOICE_CONFIDENCE_TIER_V0
} from "../rhizohVoiceGrayZoneVerifyV0.js";

describe("rhizohVoiceGrayZoneVerifyV0", () => {
  it("maps dual thresholds", () => {
    expect(resolveVoiceConfidenceTierV0(0.2)).toBe(VOICE_CONFIDENCE_TIER_V0.HARD_DROP);
    expect(resolveVoiceConfidenceTierV0(0.45)).toBe(VOICE_CONFIDENCE_TIER_V0.GRAY_ZONE);
    expect(resolveVoiceConfidenceTierV0(0.72)).toBe(VOICE_CONFIDENCE_TIER_V0.SLOW_READY);
  });

  it("detects meaningful short technical question", () => {
    expect(hasMeaningfulSpeechSignalV0("bunu nasıl düzeltirim?", { fastIntent: "question" })).toBe(
      true
    );
  });

  it("returns micro verify reply for technical gray input", () => {
    const v = resolveGrayZoneVerifyReplyV0("bunu nasıl düzeltirim?", {
      locale: "tr",
      fastIntent: "question"
    });
    expect(v.llmBypass).toBe(true);
    expect(v.reply.length).toBeGreaterThan(10);
  });

  it("uncertainty hold is not empty", () => {
    expect(resolveUncertaintyHoldReplyV0("tr").length).toBeGreaterThan(8);
  });
});
