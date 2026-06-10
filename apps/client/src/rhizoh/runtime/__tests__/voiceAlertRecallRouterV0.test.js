import { describe, expect, it } from "vitest";
import { routeVoiceTranscriptConfidenceV0 } from "../voiceTranscriptConfidenceRouterV0.js";

describe("voice alert recall router", () => {
  it("accepts distress phrase despite low confidence", () => {
    const route = routeVoiceTranscriptConfidenceV0({
      text: "yardım edin lütfen",
      source: "mic_v3",
      confidence: 0.28,
      strategy: "direct_listen",
      band: "unknown"
    });
    expect(route.executionAccepted).toBe(true);
    expect(route.reason).toBe("alert_recall_first");
  });
});
