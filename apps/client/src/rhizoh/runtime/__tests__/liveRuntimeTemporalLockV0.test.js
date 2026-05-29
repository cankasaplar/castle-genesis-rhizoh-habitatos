import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  beginLiveRuntimeOrchestratorTickTemporalV0,
  clampLiveRuntimeOrchestratorIntervalMsV0,
  completeLiveRuntimeOrchestratorTickTemporalV0,
  getLiveRuntimeTemporalSnapshotV0,
  getLiveRuntimeRenderSyncHintsV0,
  LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MIN_MS,
  LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MAX_MS,
  resetLiveRuntimeTemporalLockForTestsV0
} from "../liveRuntimeTemporalLockV0.js";

describe("liveRuntimeTemporalLockV0", () => {
  beforeEach(() => {
    resetLiveRuntimeTemporalLockForTestsV0();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("first tick reports zero drift and no extra Cesium sinks", () => {
    const b = beginLiveRuntimeOrchestratorTickTemporalV0(1000);
    expect(b.driftMs).toBe(0);
    expect(b.missedFrames).toBe(0);
    expect(b.extraCesiumSinkInvocations).toBe(0);
  });

  it("computes drift, missed frames, and caps extra Cesium sink hints", () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);

    now = 10_000;
    beginLiveRuntimeOrchestratorTickTemporalV0(1000);
    now = 10_005;
    completeLiveRuntimeOrchestratorTickTemporalV0(
      {
        tickWallMs: 5,
        projectionWallMs: 1,
        cesiumSinkWallMs: 1,
        cesiumSyncLagMs: 0
      },
      1000
    );

    now = 10_005 + 1000 + 2500;
    const b = beginLiveRuntimeOrchestratorTickTemporalV0(1000);
    expect(b.driftMs).toBe(2500);
    expect(b.missedFrames).toBe(2);
    expect(b.extraCesiumSinkInvocations).toBe(2);
  });

  it("does not count missed frames when drift is within grace", () => {
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);

    now = 1000;
    beginLiveRuntimeOrchestratorTickTemporalV0(1000);
    now = 1005;
    completeLiveRuntimeOrchestratorTickTemporalV0(
      {
        tickWallMs: 5,
        projectionWallMs: 0,
        cesiumSinkWallMs: 0,
        cesiumSyncLagMs: 0
      },
      1000
    );

    now = 1005 + 1000 + 50;
    const b = beginLiveRuntimeOrchestratorTickTemporalV0(1000);
    expect(b.driftMs).toBe(50);
    expect(b.missedFrames).toBe(0);
    expect(b.extraCesiumSinkInvocations).toBe(0);
  });

  it("snapshot exposes lag vs interval and EMA when interval passed to complete", () => {
    completeLiveRuntimeOrchestratorTickTemporalV0(
      {
        tickWallMs: 5000,
        projectionWallMs: 1,
        cesiumSinkWallMs: 1,
        cesiumSyncLagMs: 0
      },
      4000
    );
    const snap = getLiveRuntimeTemporalSnapshotV0(4000);
    expect(snap.lagVsIntervalMsLast).toBe(1000);
    expect(snap.frameLagEstimateMsLast).toBeGreaterThan(900);
    expect(snap.schema).toBe("liveRuntimeTemporal.v0");
  });

  it("clampLiveRuntimeOrchestratorIntervalMsV0 enforces orchestrator bounds", () => {
    expect(clampLiveRuntimeOrchestratorIntervalMsV0(10)).toBe(LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MIN_MS);
    expect(clampLiveRuntimeOrchestratorIntervalMsV0(999_999)).toBe(LIVE_RUNTIME_ORCHESTRATOR_INTERVAL_MAX_MS);
    expect(clampLiveRuntimeOrchestratorIntervalMsV0(4000)).toBe(4000);
  });

  it("getLiveRuntimeRenderSyncHintsV0 exposes pressure from lag EMA", () => {
    completeLiveRuntimeOrchestratorTickTemporalV0(
      {
        tickWallMs: 8000,
        projectionWallMs: 0,
        cesiumSinkWallMs: 0,
        cesiumSyncLagMs: 0
      },
      4000
    );
    const h = getLiveRuntimeRenderSyncHintsV0(4000);
    expect(h.frameLagEstimateMs).toBeGreaterThan(3000);
    expect(h.renderSyncPressure01).toBeGreaterThan(0.5);
    expect(h.schema).toBe("liveRuntimeTemporal.v0");
  });
});
