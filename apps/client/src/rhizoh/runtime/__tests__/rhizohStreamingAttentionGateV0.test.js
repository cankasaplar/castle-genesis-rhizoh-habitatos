import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  ATTENTION_SPIKE_KIND_V0,
  __resetStreamingAttentionGateForTestV0,
  evaluateStreamingAttentionSpikeV0,
  isCoPresenceStreamModeV0,
  noteStreamingTranscriptChunkV0
} from "../rhizohStreamingAttentionGateV0.js";
import {
  clearVoiceAttentionModeOverrideV0,
  setVoiceAttentionModeOverrideV0,
  VOICE_ATTENTION_MODE_V0
} from "../voiceAttentionContextV0.js";

describe("rhizohStreamingAttentionGateV0", () => {
  beforeEach(() => {
    __resetStreamingAttentionGateForTestV0();
    clearVoiceAttentionModeOverrideV0();
    setVoiceAttentionModeOverrideV0(VOICE_ATTENTION_MODE_V0.CO_PRESENCE);
  });

  it("defaults to co_presence stream mode", () => {
    expect(isCoPresenceStreamModeV0()).toBe(true);
  });

  it("detects chess analytical question spike", () => {
    noteStreamingTranscriptChunkV0({ text: "background crowd noise", confidence: 0.3 });
    const spike = evaluateStreamingAttentionSpikeV0({
      text: "Rhizoh bu hamle neden kötü?",
      confidence: 0.45,
      band: "unknown"
    });
    expect([ATTENTION_SPIKE_KIND_V0.ANALYTICAL, ATTENTION_SPIKE_KIND_V0.NAME_CALL, ATTENTION_SPIKE_KIND_V0.QUESTION].includes(
      spike.kind
    )).toBe(true);
    expect(spike.respond).toBe(true);
  });

  it("ignores youtube subtitle leak", () => {
    const spike = evaluateStreamingAttentionSpikeV0({
      text: "Altyazı M.K.",
      confidence: 0.9,
      band: "ambient"
    });
    expect(spike.respond).toBe(false);
    expect(spike.reason).toBe("background_leak_template");
  });

  it("detects emergency spike", () => {
    const spike = evaluateStreamingAttentionSpikeV0({
      text: "yardım edin düştüm",
      confidence: 0.25,
      band: "unknown"
    });
    expect(spike.kind).toBe(ATTENTION_SPIKE_KIND_V0.EMERGENCY);
    expect(spike.respond).toBe(true);
  });
});
