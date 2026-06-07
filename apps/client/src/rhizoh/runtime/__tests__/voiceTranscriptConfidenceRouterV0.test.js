import { describe, expect, it, vi, afterEach } from "vitest";
import {
  routeVoiceTranscriptConfidenceV0,
  VOICE_ROUTER_REJECTION_LAYER_V0
} from "../voiceTranscriptConfidenceRouterV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";
import { resetVoiceAttentionContextForTestV0 } from "../voiceAttentionContextV0.js";

describe("voiceTranscriptConfidenceRouterV0", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetVoiceAttentionContextForTestV0();
  });

  it("observation-passes English whisper_default_conf on direct_listen cohort", () => {
    vi.stubEnv("VITE_RHIZOH_VOICE_ATTENTION_MODE", "direct_listen");
    const route = routeVoiceTranscriptConfidenceV0({
      text: "May I have a resolve?",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      recordedMs: 8500,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.reason).toBe("whisper_default_conf");
    expect(route.observationPass).toBe(true);
  });

  it("observation-passes whisper_default_conf instead of killing execution", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Mesela bugün nasılsın? Biraz sohbet edelim.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      recordedMs: 8400
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.observationForward).toBe(true);
    expect(route.reason).toBe("whisper_default_conf");
    expect(route.shadowForward).toBe(true);
    expect(route.observationPass).toBe(true);
    expect(route.sanityAccepted).toBe(false);
  });

  it("blocks execution on low_confidence without lowering threshold", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text:
        "Bununla ilgilenen her şeyden, öncelikle savunmak, gerçekleştirebileceğimiz bir hali vardır.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
    });
    expect(route.executionAccepted).toBe(false);
    expect(["low_confidence", "unknown_band_hold"].includes(route.reason)).toBe(true);
    expect(route.observationForward).toBe(true);
  });

  it("reflex precheck bypasses interaction low_confidence for short greeting", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "merhaba",
      confidence: 0.55,
      strategy: "split_merged",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
    });
    expect(route.executionAccepted).toBe(true);
    expect(["reflex_precheck_bypass", "voice_ok"].includes(route.reason)).toBe(true);
  });

  it("accepts execution above threshold", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Rhizoh, şimdi beni duyabiliyor musun?",
      confidence: 0.72,
      strategy: "whisper_only",
      source: "mic_v3"
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.reason).toBe("voice_ok");
  });

  it("blocks YouTube outro internal repetition from execution", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text:
        "Don't forget to like, comment, and subscribe! Don't forget to like, comment, share and subscribe",
      confidence: 0.55,
      strategy: "split_merged",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 9400
    });
    expect(route.executionAccepted).toBe(false);
    expect(["platform_template_leak", "internal_repetition", "stt_loop_artifact"].includes(route.reason)).toBe(
      true
    );
    expect(route.shadowForward).toBe(true);
  });

  it("observation-passes English statement without question mark on direct_listen", () => {
    vi.stubEnv("VITE_RHIZOH_VOICE_ATTENTION_MODE", "direct_listen");
    const route = routeVoiceTranscriptConfidenceV0({
      text: "I'm going to try to open some of these up.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      recordedMs: 8500,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.reason).toBe("whisper_default_conf");
    expect(route.observationPass).toBe(true);
  });

  it("blocks unknown band hallucinated thanks without micro reflex", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Thank you.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 8500
    });
    expect(route.executionAccepted).toBe(false);
    expect(["unknown_band_hold", "whisper_default_conf", "low_confidence", "stt_phantom_polite"].includes(route.reason)).toBe(
      true
    );
  });
});
