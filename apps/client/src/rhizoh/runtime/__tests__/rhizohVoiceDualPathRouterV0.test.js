import { describe, expect, it, beforeEach } from "vitest";
import {
  classifyVoiceFastIntentV0,
  resolveVoicePipelineDecisionV0,
  VOICE_EXEC_MODE_V0,
  VOICE_FAST_INTENT_V0,
  VOICE_PIPELINE_ACTION_V0,
  VOICE_PIPELINE_PATH_V0,
  VOICE_SPEAK_MODE_V0
} from "../rhizohVoiceDualPathRouterV0.js";
import { VOICE_DROP_KIND_V0 } from "../rhizohVoiceGrayZoneVerifyV0.js";
import {
  __resetVoiceVerifyBudgetForTestV0,
  noteVoiceVerifyAttemptV0
} from "../rhizohVoiceVerifyBudgetV0.js";
import {
  __resetOlpStateForTestV0,
  applyUiLanguagePreferenceToOlpV0
} from "../rhizohOutputLanguagePolicyV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";

describe("rhizohVoiceDualPathRouterV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    __resetVoiceVerifyBudgetForTestV0();
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

  it("Arabic script hallucination is silent drop not hold", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "المترجمين للمجال للإعجاب بالفيديو Amen. Amen.",
      confidence: 0.72,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      strategy: "split_merged"
    });
    expect(d.speakMode).toBe(VOICE_SPEAK_MODE_V0.SILENT);
    expect(d.reason).toMatch(/script_locale_mismatch|platform_template_leak/);
  });

  it("directed hearing check uses fast reflex not LLM", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "merhaba rhizoh beni duyabiliyor musun",
      confidence: 0.72,
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      strategy: "whisper_only"
    });
    expect(d.speakMode).toBe(VOICE_SPEAK_MODE_V0.SPEAK);
    expect(d.execMode).toBe(VOICE_EXEC_MODE_V0.FAST_REFLEX);
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

  it("clear technical question bypasses gray verify via intent override", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "bunu nasıl düzeltirim?",
      confidence: 0.48,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      strategy: "whisper_only"
    });
    expect(d.speakMode).toBe(VOICE_SPEAK_MODE_V0.SPEAK);
    expect(d.execMode).toBe(VOICE_EXEC_MODE_V0.SLOW_LLM);
    expect(d.semanticGray).toBe(true);
    expect(d.uxGray).toBe(false);
    expect(d.reason).toBe("intent_override_slow_ready");
  });

  it("gray tier splits semanticGray and uxGray on slow path", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "şimdi sistem durumunu kontrol edelim",
      confidence: 0.42,
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      strategy: "whisper_only"
    });
    expect(d.reason).toBe("gray_slow_modifier");
    expect(d.semanticGray).toBe(true);
    expect(d.uxGray).toBe(true);
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.LLM);
  });

  it("verify budget cap forces slow or hold after two gray attempts", () => {
    const sid = "test_session_budget";
    noteVoiceVerifyAttemptV0(sid);
    noteVoiceVerifyAttemptV0(sid);
    const d = resolveVoicePipelineDecisionV0({
      text: "bir şey sormak istiyorum aslında",
      confidence: 0.42,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      sessionId: sid
    });
    expect(
      ["verify_budget_force_slow", "gray_uncertainty_hold", "uncertainty_hold"].includes(d.reason)
    ).toBe(true);
    expect(d.speakMode === VOICE_SPEAK_MODE_V0.HOLD || d.uxGray === false).toBe(true);
  });

  it("directed non-hearing question with high confidence opens slow LLM path", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "Rhizoh şimdi ne yapmalıyım sence?",
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
    expect(d.speakMode).toBe(VOICE_SPEAK_MODE_V0.HOLD);
    expect(d.action).toBe(VOICE_PIPELINE_ACTION_V0.HOLD);
    expect(d.silent).toBe(false);
  });
});
