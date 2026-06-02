import { describe, expect, it, beforeEach } from "vitest";
import {
  buildLlmSuppressionHeatmapV0,
  clearReflexStabilityTraceForTestV0,
  exportDeterministicReplayTapeV0,
  recordReflexStabilityTurnV0
} from "../rhizohReflexStabilityTraceV0.js";

describe("rhizohReflexStabilityTraceV0", () => {
  beforeEach(() => {
    clearReflexStabilityTraceForTestV0();
  });

  it("records replay ring and suppression heatmap", () => {
    recordReflexStabilityTurnV0({
      traceId: "t1",
      pipeline: { stage: "fast_precheck", llmBypass: true, latencyMs: 4 }
    });
    recordReflexStabilityTurnV0({
      traceId: "t2",
      pipeline: { stage: "intent_router", llmBypass: false, latencyMs: 800 }
    });
    const heat = buildLlmSuppressionHeatmapV0();
    expect(heat.total).toBe(2);
    expect(heat.local_fast).toBe(1);
    expect(heat.llm).toBe(1);
    const tape = exportDeterministicReplayTapeV0();
    expect(tape.replayRing.length).toBe(2);
  });
});
