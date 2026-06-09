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

  it("wake precheck bypasses whisper_default_conf on Rezo at 0.55", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Rezo.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 3400
    });
    expect(route.executionAccepted).toBe(true);
    expect(["fast_precheck_sanity_bypass", "reflex_precheck_bypass", "voice_ok"].includes(route.reason)).toBe(
      true
    );
  });

  it("social ack bypasses whisper_default_conf for Güzel at 0.55", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Güzel.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 6746
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.fastPrecheckIntent || route.reflexPrecheck).toBeTruthy();
  });

  it("date question bypasses whisper_default_conf at 0.55", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Bugün bugünün tarihimiz",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 5839
    });
    expect(route.executionAccepted).toBe(true);
    expect(["fast_precheck_sanity_bypass", "reflex_precheck_bypass", "voice_ok"].includes(route.reason)).toBe(
      true
    );
    expect(route.fastPrecheckIntent || route.reflexPrecheck).toBeTruthy();
  });

  it("wake precheck bypasses whisper_default_conf for günaydın rhizoh", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "günaydın rhizoh",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 4200
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.reflexPrecheck).toBe(true);
  });

  it("reflex precheck accepts nasılsın dostum on directed_candidate at 0.55", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Nasılsın dostum?",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      recordedMs: 4000
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.reflexPrecheck).toBe(true);
  });

  it("wake precheck bypasses unknown band hold for hearing check phrase", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "rhizoh merhaba beni duyabiliyor musun",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 4800
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.reflexPrecheck).toBe(true);
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

  it("blocks phantom coaching phrase sohbet edelim seni duymak istiyoruz", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Sohbet edelim, seni duymak istiyoruz.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 5983
    });
    expect(route.executionAccepted).toBe(false);
    expect(route.reason).toBe("whisper_artifact");
  });

  it("substantive planning bypasses whisper_default_conf for istanbul garble", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "İstanbul'dan helal yapabilirim.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 2731
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.reason).toBe("substantive_planning_sanity_bypass");
    expect(route.substantivePlanning).toBe(true);
  });

  it("traffic_query on unknown band allows extended reflex (not 3-word cap)", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Peki trafik ne durumda?",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 3200
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.fastPrecheckIntent).toBe("traffic_query");
  });

  it("chat_invite sohbet edelim bypasses whisper_default_conf", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Sohbet edelim.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN,
      recordedMs: 4200
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.fastPrecheckIntent).toBe("chat_invite");
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
