import { describe, expect, it, beforeEach } from "vitest";
import {
  EPISTEMIC_EVENT_CLASS_V0,
  getEpistemicEventTraceV0,
  resetEpistemicEventBusForTestsV0,
  setEpistemicEventBusEnabledV0
} from "../epistemicEventBusV0.js";
import { OBSERVER_ACTION_KIND_V0 } from "../epistemicObserverTelemetryContractV0.js";
import {
  recordCameraKeyObserverTelemetryV0,
  recordManifoldNavObserverTelemetryV0,
  recordObserverActionTelemetryV0
} from "../epistemicObserverTelemetryV0.js";
import {
  resetEpistemicSimResearchStoreForTestsV0,
  setEpistemicSimResearchSnapshotV0
} from "../epistemicSimResearchStoreV0.js";

describe("epistemicObserverTelemetryV0 (9.4.4a)", () => {
  beforeEach(() => {
    resetEpistemicEventBusForTestsV0();
    resetEpistemicSimResearchStoreForTestsV0();
  });

  it("no-op when bus disabled", () => {
    const env = recordManifoldNavObserverTelemetryV0("node:istanbul");
    expect(env).toBeNull();
  });

  it("publishes observer_action without witness write", () => {
    setEpistemicEventBusEnabledV0(true);
    const env = recordManifoldNavObserverTelemetryV0("node:barcelona", "test");
    expect(env?.eventClass).toBe(EPISTEMIC_EVENT_CLASS_V0.OBSERVER);
    expect(env?.kind).toBe("observer_action");
    expect(env?.witnessWrite).toBe(false);
    expect(env?.feedbackLoop).toBe(false);
    expect(env?.observerAction?.action).toBe(OBSERVER_ACTION_KIND_V0.MANIFOLD_NAV);
    expect(env?.physicsSnapshot).toBeNull();
    expect(getEpistemicEventTraceV0()).toHaveLength(1);
  });

  it("dedupes rapid camera key telemetry", () => {
    setEpistemicEventBusEnabledV0(true);
    recordCameraKeyObserverTelemetryV0("w");
    recordCameraKeyObserverTelemetryV0("w");
    expect(getEpistemicEventTraceV0()).toHaveLength(1);
  });

  it("recordObserverActionTelemetry uses snapshot frame context", () => {
    setEpistemicEventBusEnabledV0(true);
    setEpistemicSimResearchSnapshotV0({
      frame: 99,
      simTimeMs: 100,
      epistemicSplitBrainScore: 0.3,
      coherenceGradient: 0.7,
      focusNodeId: "node:istanbul",
      executorNodeId: "node:istanbul",
      stabilizationMode: "parallel_hold",
      allowConcurrentExecution: true,
      terrainMaxOffsetMeters: 0,
      causalityTraceCount: 0,
      shaderDrawCalls: 0,
      truthCollapsed: false
    });
    const env = recordObserverActionTelemetryV0({
      action: OBSERVER_ACTION_KIND_V0.CAMERA_KEY,
      source: "test",
      meta: { key: "a" }
    });
    expect(env?.atFrame).toBe(99);
    expect(env?.stabilizationMode).toBe("parallel_hold");
  });
});
