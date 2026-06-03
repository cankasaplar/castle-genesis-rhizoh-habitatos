import { describe, expect, it, beforeEach } from "vitest";
import {
  classifyVoiceFastIntentV0,
  resolveVoicePipelineDecisionV0,
  VOICE_FAST_INTENT_V0,
  VOICE_PIPELINE_ACTION_V0,
  VOICE_PIPELINE_PATH_V0
} from "../rhizohVoiceDualPathRouterV0.js";
import { VOICE_DROP_KIND_V0 } from "../rhizohVoiceGrayZoneVerifyV0.js";
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
  });

  it("YouTube outro is silent noise_drop", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "Don't forget to like, comment, and subscribe!",
      confidence: 0.55,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      strategy: "split_merged"
    });
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.DROP);
    expect(d.dropKind).toBe(VOICE_DROP_KIND_V0.NOISE);
    expect(d.silent).toBe(true);
  });

  it("borderline technical question uses gray verify not silent drop", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "bunu nasıl düzeltirim?",
      confidence: 0.48,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      strategy: "whisper_only"
    });
    expect(d.path).toBe(VOICE_PIPELINE_PATH_V0.GRAY);
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.VERIFY);
    expect(d.silent).toBe(false);
    expect(String(d.reply || "").length).toBeGreaterThan(8);
  });

  it("directed question with high confidence opens slow LLM path", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.72,
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      strategy: "whisper_only"
    });
    expect(d.path).toBe(VOICE_PIPELINE_PATH_V0.SLOW);
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.LLM);
  });

  it("low confidence meaningful question uses uncertainty hold not noise drop", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "bunu nasıl düzeltirim?",
      confidence: 0.28,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
    });
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.HOLD);
    expect(d.silent).toBe(false);
  });
});
