import { describe, expect, it, beforeEach } from "vitest";
import {
  SPIKE_TYPE_V1,
  __resetSpikeEngineForTestV1,
  evaluateSpikeCollapseV1
} from "../castleSpikeEngineV1.js";
import {
  __resetCastleAttentionFieldForTestV1,
  queueRealityNodeV1,
  tickAttentionFieldV1
} from "../castleAttentionFieldV1.js";

describe("castleSpikeEngineV1", () => {
  beforeEach(() => {
    __resetSpikeEngineForTestV1();
    __resetCastleAttentionFieldForTestV1();
  });

  it("collapses high-mass low-entropy cluster into spike", () => {
    queueRealityNodeV1({ source: "youtube", preview: "commentary", atMs: 1000 });
    queueRealityNodeV1({
      source: "mic",
      text: "Rhizoh neden bu hamle kötü?",
      userInitiated: true,
      atMs: 1050
    });
    const graph = tickAttentionFieldV1(1100);
    const spikes = evaluateSpikeCollapseV1({ graph, atMs: 1100 });
    expect(spikes.length).toBeGreaterThan(0);
    expect([SPIKE_TYPE_V1.INTENT, SPIKE_TYPE_V1.ANALYTICAL, SPIKE_TYPE_V1.SOCIAL_CALL]).toContain(
      spikes[0].type
    );
  });

  it("emergency always emits spike regardless of cluster", () => {
    queueRealityNodeV1({ source: "mic", text: "yardım imdat", userInitiated: true, atMs: 1000 });
    const graph = tickAttentionFieldV1(1100);
    const spikes = evaluateSpikeCollapseV1({ graph, atMs: 1100 });
    expect(spikes.some((s) => s.type === SPIKE_TYPE_V1.EMERGENCY)).toBe(true);
  });
});
