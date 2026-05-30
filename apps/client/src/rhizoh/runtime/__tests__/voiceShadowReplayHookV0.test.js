import { describe, expect, it, beforeEach } from "vitest";
import {
  extractShadowReplaySignalsV0,
  resetShadowReplayHookForTestV0
} from "../voiceShadowReplayHookV0.js";

describe("voiceShadowReplayHookV0", () => {
  beforeEach(() => {
    resetShadowReplayHookForTestV0();
  });

  it("clusters shadow ring by reason and suggests tuning hint", () => {
    const ring = [
      { preview: "Nasılsın?", band: "unknown", route: { reason: "whisper_default_conf" } },
      { preview: "Burada mısın?", band: "unknown", route: { reason: "whisper_default_conf" } },
      { preview: "Sohbet edelim", band: "unknown", route: { reason: "whisper_default_conf" } },
      { preview: "Bugün nasılsın", band: "unknown", route: { reason: "whisper_default_conf" } }
    ];
    const signals = extractShadowReplaySignalsV0(ring);
    expect(signals.sampleCount).toBe(4);
    expect(signals.dominantReason).toBe("whisper_default_conf");
    expect(signals.suggestedAction).toContain("short_utterance");
  });
});
