import { describe, expect, it, beforeEach } from "vitest";
import {
  classifyVoiceDirectedSpeechBandV0,
  VOICE_DIRECTED_SPEECH_BAND
} from "../voiceDirectedSpeechObservationV0.js";
import {
  evaluateVoiceShadowReleaseV0,
  getVoiceObservationShadowSnapshotV0,
  recordVoiceObservationShadowV0,
  resetVoiceObservationShadowForTestV0,
  voiceWitnessBandWeightV0
} from "../voiceObservationShadowV0.js";

describe("voiceDirectedSpeechObservationV0", () => {
  it("labels TV-style ambient phrases", () => {
    const out = classifyVoiceDirectedSpeechBandV0({
      text: "Herkese iyi geceler.",
      confidence: 0.55,
      strategy: "whisper_only"
    });
    expect(out.band).toBe(VOICE_DIRECTED_SPEECH_BAND.AMBIENT);
  });

  it("labels directed wake + question", () => {
    const out = classifyVoiceDirectedSpeechBandV0({
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.55,
      strategy: "whisper_only"
    });
    expect(out.band).toBe(VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE);
  });

  it("labels dostum address as directed_candidate", () => {
    const out = classifyVoiceDirectedSpeechBandV0({
      text: "Dostum beni duyabiliyor musun?",
      confidence: 0.55
    });
    expect(out.band).toBe(VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE);
  });

  it("labels neutral speech as unknown", () => {
    const out = classifyVoiceDirectedSpeechBandV0({
      text: "Bugün hava güzeldi.",
      confidence: 0.55
    });
    expect(out.band).toBe(VOICE_DIRECTED_SPEECH_BAND.UNKNOWN);
  });
});

describe("voiceObservationShadowV0", () => {
  beforeEach(() => resetVoiceObservationShadowForTestV0());

  it("shadow would accept directed + sanity + confidence at 0.62 rule", () => {
    const shadow = evaluateVoiceShadowReleaseV0({
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.72,
      strategy: "whisper_only",
      source: "mic_v3"
    });
    expect(shadow.shadowWouldOpenTurn).toBe(true);
    expect(shadow.directedPass).toBe(true);
  });

  it("shadow would not accept directed at 0.55 under unchanged 0.62 gate", () => {
    const shadow = evaluateVoiceShadowReleaseV0({
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3"
    });
    expect(shadow.shadowWouldOpenTurn).toBe(false);
    expect(shadow.confidencePass).toBe(false);
  });

  it("exposes band weights for noise-weighting", () => {
    expect(voiceWitnessBandWeightV0(VOICE_DIRECTED_SPEECH_BAND.AMBIENT)).toBe(0.15);
    expect(voiceWitnessBandWeightV0(VOICE_DIRECTED_SPEECH_BAND.UNKNOWN)).toBe(0.45);
    expect(voiceWitnessBandWeightV0(VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE)).toBe(1);
  });

  it("weighted witnessed stays low when ambient dominates raw count", () => {
    for (let i = 0; i < 20; i += 1) {
      recordVoiceObservationShadowV0(
        evaluateVoiceShadowReleaseV0({ text: "Herkese iyi geceler.", confidence: 0.55 }),
        { accepted: false, reason: "quality_reject" }
      );
    }
    recordVoiceObservationShadowV0(
      evaluateVoiceShadowReleaseV0({
        text: "Rhizoh, şimdi beni duyabiliyor musun?",
        confidence: 0.72
      }),
      { accepted: true, reason: "voice_ok" }
    );

    const snap = getVoiceObservationShadowSnapshotV0();
    expect(snap.witnessed).toBe(21);
    expect(snap.weighted.witnessed).toBeCloseTo(4, 5);
    expect(snap.weighted.witnessed).toBeLessThan(snap.witnessed);
    expect(snap.ambient / snap.witnessed).toBeGreaterThan(0.9);
    const ambientShareWeighted = snap.weighted.ambient / snap.weighted.witnessed;
    expect(ambientShareWeighted).toBeLessThan(snap.ambient / snap.witnessed);
    expect(snap.weighted.ambient).toBeCloseTo(20 * 0.15, 5);
  });
});
