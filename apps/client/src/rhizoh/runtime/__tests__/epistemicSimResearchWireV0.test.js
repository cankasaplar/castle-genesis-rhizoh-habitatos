import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  buildEpistemicSimObservationsFromContextV0,
  isEpistemicSimResearchEnabledV0
} from "../epistemicSimResearchWireV0.js";
import {
  resetEpistemicSimResearchStoreForTestsV0,
  setEpistemicSimResearchSnapshotV0,
  getEpistemicSimResearchSnapshotV0
} from "../epistemicSimResearchStoreV0.js";

describe("epistemicSimResearchStoreV0", () => {
  beforeEach(() => {
    resetEpistemicSimResearchStoreForTestsV0();
  });

  it("snapshot round-trip", () => {
    setEpistemicSimResearchSnapshotV0({
      frame: 3,
      simTimeMs: 48,
      epistemicSplitBrainScore: 0.2,
      coherenceGradient: 0.8,
      focusNodeId: "node:istanbul",
      executorNodeId: "node:istanbul",
      stabilizationMode: "degraded_ensemble",
      allowConcurrentExecution: true,
      terrainMaxOffsetMeters: 12,
      causalityTraceCount: 8,
      shaderDrawCalls: 3,
      truthCollapsed: false
    });
    const s = getEpistemicSimResearchSnapshotV0();
    expect(s?.frame).toBe(3);
    expect(s?.truthCollapsed).toBe(false);
  });
});

describe("buildEpistemicSimObservationsFromContextV0", () => {
  it("builds twin-node input from boot context", () => {
    vi.stubGlobal("window", {
      __rhizoh_boot_context: {
        livingWorldId: "world:test",
        livingNodeId: "node:istanbul",
        targetTick: 42
      },
      __rhizoh_node_id: "node:istanbul"
    });
    const input = buildEpistemicSimObservationsFromContextV0();
    expect(input.livingWorldId).toBe("world:test");
    expect(input.observations).toHaveLength(2);
    expect(input.networkExecutorNodeId).toBe("node:istanbul");
    vi.unstubAllGlobals();
  });
});

describe("isEpistemicSimResearchEnabledV0", () => {
  it("false when env unset", () => {
    expect(isEpistemicSimResearchEnabledV0()).toBe(false);
  });
});
