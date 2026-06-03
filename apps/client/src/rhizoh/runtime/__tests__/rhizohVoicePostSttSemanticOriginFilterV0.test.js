import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  evaluatePostSttSemanticOriginV0,
  resolveOriginAttributionDecisionV0,
  POST_STT_ORIGIN_ACTION_V0
} from "../rhizohVoicePostSttSemanticOriginFilterV0.js";
import {
  scoreSttTemplateLeakV0,
  TEMPLATE_SCORE_HARD_DROP_V0,
  TEMPLATE_SCORE_QUARANTINE_MIN_V0
} from "../voiceSttContaminationGuardV0.js";
import {
  __resetOlpStateForTestV0,
  applyUiLanguagePreferenceToOlpV0
} from "../rhizohOutputLanguagePolicyV0.js";
import { resetOriginConfidenceEmaForTestV0 } from "../rhizohSttOriginConfidenceEmaV0.js";

describe("rhizohVoicePostSttSemanticOriginFilterV0", () => {
  /** @type {Record<string, string | undefined>} */
  let envBackup;

  beforeEach(() => {
    envBackup = { ...import.meta.env };
    import.meta.env.VITE_RHIZOH_VOICE_ENGINE_V3 = "1";
    import.meta.env.VITE_RHIZOH_VOICE_POST_STT_ORIGIN = "1";
    resetOriginConfidenceEmaForTestV0();
    __resetOlpStateForTestV0();
    applyUiLanguagePreferenceToOlpV0("tr", "test");
  });

  afterEach(() => {
    Object.assign(import.meta.env, envBackup);
  });

  it("hard drops full YouTube outro via template score", () => {
    const text = "Thank you for watching! Don't forget to subscribe!";
    const scores = scoreSttTemplateLeakV0(text, { confidence: 0.72, strategy: "split_merged" });
    expect(scores.templateScore).toBeGreaterThan(TEMPLATE_SCORE_HARD_DROP_V0);
    const v = evaluatePostSttSemanticOriginV0({ text, confidence: 0.72, strategy: "split_merged" });
    expect(v.pass).toBe(false);
    expect(v.originConfidence.uiLeak).toBeGreaterThan(0.7);
    expect(v.reason).toMatch(/template_hard|ui_leak/);
  });

  it("allows conversational mention of subscribe with high confidence", () => {
    const text = "Rhizoh subscribe kelimesi ne demek bana anlatır mısın";
    const scores = scoreSttTemplateLeakV0(text, { confidence: 0.74, strategy: "whisper_only" });
    expect(scores.templateScore).toBeLessThan(TEMPLATE_SCORE_QUARANTINE_MIN_V0);
    const v = evaluatePostSttSemanticOriginV0({
      text,
      confidence: 0.74,
      strategy: "whisper_only",
      sessionLanguage: "tr"
    });
    expect(v.pass).toBe(true);
    expect(v.modelInput).toBe(true);
  });

  it("quarantines mid-band template score without hard drop when origin retry enabled", () => {
    import.meta.env.VITE_RHIZOH_VOICE_ORIGIN_RETRY = "1";
    const text = "thank you rhizoh and subscribe please explain again";
    const scores = scoreSttTemplateLeakV0(text, { confidence: 0.52, strategy: "whisper_only" });
    expect(scores.templateScore).toBeGreaterThanOrEqual(TEMPLATE_SCORE_QUARANTINE_MIN_V0);
    expect(scores.templateScore).toBeLessThan(TEMPLATE_SCORE_HARD_DROP_V0);
    const v = evaluatePostSttSemanticOriginV0({
      text,
      confidence: 0.48,
      strategy: "whisper_only",
      sessionLanguage: "tr"
    });
    expect(v.pass).toBe(false);
    expect(v.retryStt).toBe(true);
    expect(v.terminalDrop).toBe(false);
    expect(v.silentDrop).toBe(false);
    expect(v.action).toBe(POST_STT_ORIGIN_ACTION_V0.QUARANTINE);
    expect(v.softQuarantine).toBe(true);
  });

  it("terminal-drops quarantine when origin retry disabled (Phase B without B2)", () => {
    import.meta.env.VITE_RHIZOH_VOICE_ORIGIN_RETRY = "0";
    const text = "thank you rhizoh and subscribe please explain again";
    const v = evaluatePostSttSemanticOriginV0({
      text,
      confidence: 0.48,
      strategy: "whisper_only",
      sessionLanguage: "tr"
    });
    expect(v.pass).toBe(false);
    expect(v.retryStt).toBe(false);
    expect(v.terminalDrop).toBe(true);
    expect(v.reason).toBe("origin_quarantine_retry_disabled");
  });

  it("origin attribution drops low speech with ui leak", () => {
    const originConfidence = Object.freeze({
      speech: 0.32,
      uiLeak: 0.45,
      subtitleLeak: 0.08,
      languageMatch: 0.5,
      templateScore: 0.48
    });
    const decision = resolveOriginAttributionDecisionV0(originConfidence);
    expect(decision.action).toBe(POST_STT_ORIGIN_ACTION_V0.DROP);
    expect(decision.terminalDrop).toBe(true);
    expect(decision.reason).toBe("origin_low_speech_ui_leak");
  });

  it("passes clean directed Turkish utterance", () => {
    const v = evaluatePostSttSemanticOriginV0({
      text: "merhaba rhizoh beni duyabiliyor musun",
      confidence: 0.72,
      strategy: "whisper_only",
      sessionLanguage: "tr"
    });
    expect(v.pass).toBe(true);
    expect(v.originConfidenceStable?.speech).toBeGreaterThan(0.6);
    expect(v.modelInput).toBe(true);
  });

  it("is disabled when post-STT origin flag off", () => {
    import.meta.env.VITE_RHIZOH_VOICE_POST_STT_ORIGIN = "0";
    const v = evaluatePostSttSemanticOriginV0({
      text: "Thank you for watching! Don't forget to subscribe!",
      confidence: 0.72
    });
    expect(v.disabled).toBe(true);
    expect(v.pass).toBe(true);
  });
});
