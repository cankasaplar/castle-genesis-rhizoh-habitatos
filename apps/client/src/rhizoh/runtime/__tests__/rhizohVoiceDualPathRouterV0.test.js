import { describe, expect, it, beforeEach } from "vitest";
import {
  classifyVoiceFastIntentV0,
  resolveVoicePipelineDecisionV0,
  VOICE_FAST_INTENT_V0,
  VOICE_PIPELINE_ACTION_V0,
  VOICE_PIPELINE_PATH_V0
} from "../rhizohVoiceDualPathRouterV0.js";
import {
  __resetOlpStateForTestV0,
  applyUiLanguagePreferenceToOlpV0
} from "../rhizohOutputLanguagePolicyV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";

describe("rhizohVoiceDualPathRouterV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    applyUiLanguagePreferenceToOlpV0("tr", "test");
  });

  it("classifies greeting in 3-class fast intent", () => {
    expect(classifyVoiceFastIntentV0("merhaba").intent).toBe(VOICE_FAST_INTENT_V0.GREETING);
  });

  it("unknown band uses fast reflex only for greeting", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "merhaba",
      confidence: 0.55,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
    });
    expect(d.path).toBe(VOICE_PIPELINE_PATH_V0.FAST);
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.REFLEX);
    expect(d.reason).toBe("unknown_band_fast_reflex_only");
  });

  it("unknown band drops YouTube outro without slow analysis", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "Don't forget to like, comment, and subscribe!",
      confidence: 0.55,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      strategy: "split_merged"
    });
    expect(d.path).toBe(VOICE_PIPELINE_PATH_V0.FAST);
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.DROP);
  });

  it("directed question with clean text opens slow LLM path", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.72,
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      strategy: "whisper_only"
    });
    expect(d.path).toBe(VOICE_PIPELINE_PATH_V0.SLOW);
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.LLM);
  });
});
