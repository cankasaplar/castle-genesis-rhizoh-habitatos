import { describe, expect, it } from "vitest";
import {
  hasMeaningfulSpeechSignalV0,
  isClearQuestionPatternV0,
  resolveGrayZoneVerifyReplyV0,
  resolveUncertaintyHoldReplyV0,
  resolveVoiceConfidenceTierV0,
  resolveVoiceGrayFlagsV0,
  resolveVoiceUxFallbackV0,
  VOICE_CONFIDENCE_TIER_V0
} from "../rhizohVoiceGrayZoneVerifyV0.js";
import { VOICE_EXEC_MODE_V0, VOICE_SPEAK_MODE_V0 } from "../rhizohVoiceDualPathRouterV0.js";
import { noteVoiceVerifyAttemptV0 } from "../rhizohVoiceVerifyBudgetV0.js";

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

  it("detects clear question pattern independent of confidence tier", () => {
    expect(isClearQuestionPatternV0("bunu nasıl düzeltirim?")).toBe(true);
    expect(isClearQuestionPatternV0("ok")).toBe(false);
  });

  it("returns micro verify reply for technical gray input", () => {
    const v = resolveGrayZoneVerifyReplyV0("bunu nasıl düzeltirim?", {
      locale: "tr",
      fastIntent: "question"
    });
    expect(v.llmBypass).toBe(true);
    expect(v.reply.length).toBeGreaterThan(10);
  });

  it("splits semanticGray from uxGray flags", () => {
    const flags = resolveVoiceGrayFlagsV0(VOICE_CONFIDENCE_TIER_V0.GRAY_ZONE, { uxGray: false });
    expect(flags.semanticGray).toBe(true);
    expect(flags.uxGray).toBe(false);
  });

  it("ux fallback resolves at execution not routing", () => {
    const decision = {
      speakMode: VOICE_SPEAK_MODE_V0.SPEAK,
      execMode: VOICE_EXEC_MODE_V0.SLOW_LLM,
      uxGray: true,
      fastIntent: "question"
    };
    const ux = resolveVoiceUxFallbackV0(decision, "bunu nasıl düzeltirim?", { locale: "tr" });
    expect(ux?.llmBypass).toBe(true);
    expect(String(ux?.reply || "").length).toBeGreaterThan(10);
  });

  it("ux fallback is budget-controlled for hold", () => {
    const sid = "ux_budget_hold";
    noteVoiceVerifyAttemptV0(sid);
    noteVoiceVerifyAttemptV0(sid);
    const ux = resolveVoiceUxFallbackV0(
      { speakMode: VOICE_SPEAK_MODE_V0.HOLD },
      "test",
      { sessionId: sid }
    );
    expect(ux).toBe(null);
  });

  it("uncertainty hold is not empty", () => {
    expect(resolveUncertaintyHoldReplyV0("tr").length).toBeGreaterThan(8);
  });
});
