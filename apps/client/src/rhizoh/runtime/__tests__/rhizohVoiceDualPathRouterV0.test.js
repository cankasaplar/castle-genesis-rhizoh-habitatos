import { describe, expect, it, beforeEach, afterEach } from "vitest";
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
import { transitionContinuityStateV0, CONTINUITY_STATE_V0 } from "../rhizohContinuityKernelV0.js";

describe("rhizohVoiceDualPathRouterV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    __resetVoiceVerifyBudgetForTestV0();
    applyUiLanguagePreferenceToOlpV0("tr", "test");
    transitionContinuityStateV0(CONTINUITY_STATE_V0.IDLE);
    import.meta.env.VITE_RHIZOH_VOICE_ENGINE_V3 = "0";
    import.meta.env.VITE_RHIZOH_VOICE_INGEST_STRICT = "0";
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

  it("unknown band slow_ready conversational text opens slow LLM path", () => {
    const d = resolveVoicePipelineDecisionV0({
      text: "Evet, çok fazla dinlenmeye ihtiyacım var. Hem kafam yoruldu, hem bedenim.",
      confidence: 0.55,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      strategy: "whisper_only"
    });
    expect(d.speakMode).toBe(VOICE_SPEAK_MODE_V0.SPEAK);
    expect(d.execMode).toBe(VOICE_EXEC_MODE_V0.SLOW_LLM);
    expect(d.reason).toBe("unknown_band_slow_completion");
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

  describe("strict ingest clamp", () => {
    /** @type {Record<string, string | undefined>} */
    let envBackup;

    beforeEach(() => {
      envBackup = { ...import.meta.env };
      import.meta.env.VITE_RHIZOH_VOICE_ENGINE_V3 = "1";
      import.meta.env.VITE_RHIZOH_VOICE_INGEST_STRICT = "1";
    });

    afterEach(() => {
      Object.assign(import.meta.env, envBackup);
    });

    it("converts hard-drop uncertainty hold to silent drop", () => {
      transitionContinuityStateV0(CONTINUITY_STATE_V0.IDLE);
      const d = resolveVoicePipelineDecisionV0({
        text: "bunu nasıl düzeltirim?",
        confidence: 0.28,
        band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
        maxRms: 0.01,
        recordedMs: 400
      });
      expect(d.speakMode).toBe(VOICE_SPEAK_MODE_V0.SILENT);
      expect(d.reason).toBe("strict_hold_suppressed");
      expect(d.silent).toBe(true);
    });

    it("rescues strict hold when listening + RMS show user directed speech", () => {
      transitionContinuityStateV0(CONTINUITY_STATE_V0.LISTENING, { source: "mic_open" });
      const d = resolveVoicePipelineDecisionV0({
        text: "Rizo ava na nasıl",
        confidence: 0.28,
        band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
        maxRms: 0.09,
        recordedMs: 5500
      });
      expect(
        d.speakMode === VOICE_SPEAK_MODE_V0.HOLD || d.speakMode === VOICE_SPEAK_MODE_V0.SPEAK
      ).toBe(true);
      expect(["presence_intent_hold", "presence_intent_slow"].includes(d.reason)).toBe(true);
    });

    it("allows unknown band slow_ready conversational completion in strict mode", () => {
      const d = resolveVoicePipelineDecisionV0({
        text: "Evet, çok fazla dinlenmeye ihtiyacım var. Hem kafam yoruldu, hem bedenim.",
        confidence: 0.55,
        band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
        strategy: "whisper_only"
      });
      expect(d.speakMode).toBe(VOICE_SPEAK_MODE_V0.SPEAK);
      expect(d.execMode).toBe(VOICE_EXEC_MODE_V0.SLOW_LLM);
      expect(d.reason).toBe("unknown_band_slow_completion");
      expect(d.silent).toBe(false);
    });

    it("still silent-drops unknown band noise without meaningful signal", () => {
      const d = resolveVoicePipelineDecisionV0({
        text: "ah",
        confidence: 0.55,
        band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
        strategy: "whisper_only"
      });
      expect(d.speakMode).toBe(VOICE_SPEAK_MODE_V0.SILENT);
      expect(d.reason).toMatch(/fast_noise_drop|strict_hold_suppressed/);
    });

    it("strips uxGray on gray slow path", () => {
      const d = resolveVoicePipelineDecisionV0({
        text: "şimdi sistem durumunu kontrol edelim",
        confidence: 0.42,
        band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
        strategy: "whisper_only"
      });
      expect(d.execMode).toBe(VOICE_EXEC_MODE_V0.SLOW_LLM);
      expect(d.uxGray).toBe(false);
      expect(d.semanticGray).toBe(true);
    });
  });
});
