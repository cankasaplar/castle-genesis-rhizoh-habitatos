import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  collapseClagToConversationBehaviorV0,
  publishRuntimeStabilityV0,
  resetRuntimeStabilityLayerV0
} from "../rhizohRuntimeStabilityLayerV0.js";
import { TEMPORAL_BEA_PHASE_V0 } from "../rhizohClagTemporalBeaV0.js";

describe("rhizohRuntimeStabilityLayerV0", () => {
  beforeEach(() => {
    resetRuntimeStabilityLayerV0();
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_RHIZOH_STABILITY_VERBOSE", "");
  });

  it("collapses graph to conversationBehavior without phase names", () => {
    const behavior = collapseClagToConversationBehaviorV0(
      {
        boundedEmergence: {
          temporal: { strategicFlow: { phase: TEMPORAL_BEA_PHASE_V0.RELEASE } },
          controlledSurpriseInjected: true
        },
        memoryShapingHints: {
          spatialEcho: "Beşiktaş Serencebey",
          activeSovereignNodes: [{ label: "Metehan Ankara" }, { label: "Beşiktaş Serencebey" }]
        },
        graphContamination: { detected: false }
      },
      { conversationMode: "explore", depthLevel: 2, continuityStrength: 0.7 }
    );
    expect(behavior.rhythm.breath).toBe("exhale");
    expect(behavior.rhythm.feel).toBe("resonant_pulse");
    expect(behavior.continuity01).toBeGreaterThan(0.5);
    expect(String(behavior.rhythm.pacing)).not.toContain("accumulate");
  });

  it("publishes only runtime stability on window in prod mode", () => {
    publishRuntimeStabilityV0({
      mode: "living_world_frame",
      clagGraph: {
        traceId: "T-1",
        activeSovereignNodeCount: 2,
        boundedEmergence: {
          temporal: { strategicFlow: { phase: TEMPORAL_BEA_PHASE_V0.ACCUMULATE } }
        },
        memoryShapingHints: {}
      }
    });
    expect(window.__CASTLE_RHIZOH_RUNTIME_STABILITY__).toBeTruthy();
    expect(window.__CASTLE_RHIZOH_RUNTIME_STABILITY__.conversationBehavior).toBeTruthy();
    expect(window.__CASTLE_RHIZOH_CLAG__).toBeUndefined();
  });
});
