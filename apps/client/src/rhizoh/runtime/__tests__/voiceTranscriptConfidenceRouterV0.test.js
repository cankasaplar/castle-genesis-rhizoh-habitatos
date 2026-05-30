import { describe, expect, it } from "vitest";
import {
  routeVoiceTranscriptConfidenceV0,
  VOICE_ROUTER_REJECTION_LAYER_V0
} from "../voiceTranscriptConfidenceRouterV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "../voiceDirectedSpeechObservationV0.js";

describe("voiceTranscriptConfidenceRouterV0", () => {
  it("shadow-forwards whisper_default_conf on long capture + conversational TR", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "Mesela bugün nasılsın? Biraz sohbet edelim.",
      confidence: 0.55,
      strategy: "whisper_only",
      source: "mic_v3",
      recordedMs: 8400
    });
    expect(route.executionAccepted).toBe(false);
    expect(route.observationForward).toBe(true);
    expect(route.reason).toBe("whisper_default_conf");
    expect(route.shadowForward).toBe(true);
    expect(route.rejectionLayer).toBe(VOICE_ROUTER_REJECTION_LAYER_V0.SANITY);
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
    expect(route.reason).toBe("low_confidence");
    expect(route.observationForward).toBe(true);
    expect(route.threshold).toBe(0.62);
    expect(route.rejectionLayer).toBe(VOICE_ROUTER_REJECTION_LAYER_V0.INTERACTION);
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
});
