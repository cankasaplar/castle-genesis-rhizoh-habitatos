import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  runLiveRuntimeOrchestratorTickV0,
  registerLiveRuntimeCesiumRenderSinkV0,
  unregisterLiveRuntimeCesiumRenderSinkV0,
  registerLiveRuntimeProjectionConsumerV0,
  unregisterLiveRuntimeProjectionConsumerV0,
  resetLiveRuntimeOrchestratorForTestsV0,
  clearLiveRuntimeOrchestratorProjectionStateV0,
  getSmoothedProjectionHintsSnapshotForTestsV0
} from "../liveRuntimeOrchestratorV0.js";
import { resetWorldPresenceWeatherCacheForTestsV0 } from "../worldPresenceStoreV0.js";

describe("liveRuntimeOrchestratorV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "active");
    vi.stubEnv("VITE_WORLD_LAYER", "1");
    resetWorldPresenceWeatherCacheForTestsV0();
    resetLiveRuntimeOrchestratorForTestsV0();
    clearLiveRuntimeOrchestratorProjectionStateV0();
    document.documentElement.style.removeProperty("--rhizoh-proj-fog-density");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runLiveRuntimeOrchestratorTickV0 builds state and sets CSS vars", async () => {
    const { state, hints } = await runLiveRuntimeOrchestratorTickV0({ ttlMs: 60_000 });
    expect(state.schema).toBe("worldPresence.v0");
    expect(hints.fogDensity).toBeGreaterThanOrEqual(0);
    const fog = document.documentElement.style.getPropertyValue("--rhizoh-proj-fog-density");
    expect(fog.length).toBeGreaterThan(0);
  });

  it("invokes Cesium render sink when registered", async () => {
    const sink = vi.fn();
    registerLiveRuntimeCesiumRenderSinkV0(sink);
    await runLiveRuntimeOrchestratorTickV0({ ttlMs: 60_000 });
    expect(sink).toHaveBeenCalled();
    unregisterLiveRuntimeCesiumRenderSinkV0();
  });

  it("invokes projection consumer with state and smoothed hints in ACTIVE", async () => {
    const consumer = vi.fn();
    registerLiveRuntimeProjectionConsumerV0(consumer);
    await runLiveRuntimeOrchestratorTickV0({ ttlMs: 60_000 });
    expect(consumer).toHaveBeenCalledTimes(1);
    const arg = consumer.mock.calls[0][0];
    expect(arg.state.schema).toBe("worldPresence.v0");
    expect(typeof arg.hints.fogDensity).toBe("number");
    unregisterLiveRuntimeProjectionConsumerV0();
  });

  it("PASSIVE does not invoke projection consumer", async () => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "passive");
    const consumer = vi.fn();
    registerLiveRuntimeProjectionConsumerV0(consumer);
    await runLiveRuntimeOrchestratorTickV0({ ttlMs: 60_000 });
    expect(consumer).not.toHaveBeenCalled();
    unregisterLiveRuntimeProjectionConsumerV0();
  });

  it("returns temporal snapshot and honors extra Cesium sink invocations", async () => {
    const sink = vi.fn();
    registerLiveRuntimeCesiumRenderSinkV0(sink);
    const result = await runLiveRuntimeOrchestratorTickV0({
      ttlMs: 60_000,
      extraCesiumSinkInvocations: 2,
      intervalMsForTemporalSnapshot: 4000
    });
    expect(result.temporal.schema).toBe("liveRuntimeTemporal.v0");
    expect(result.temporal.tickWallMsLast).toBeGreaterThanOrEqual(0);
    expect(sink).toHaveBeenCalledTimes(3);
    unregisterLiveRuntimeCesiumRenderSinkV0();
  });

  it("OFF mode skips Cesium sink and leaves CSS unset on cold run", async () => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "off");
    const sink = vi.fn();
    registerLiveRuntimeCesiumRenderSinkV0(sink);
    const { state, hints } = await runLiveRuntimeOrchestratorTickV0({ ttlMs: 60_000 });
    expect(state.schema).toBe("worldPresence.v0");
    expect(hints.fogDensity).toBeGreaterThanOrEqual(0);
    expect(sink).not.toHaveBeenCalled();
    const fog = document.documentElement.style.getPropertyValue("--rhizoh-proj-fog-density");
    expect(fog.length).toBe(0);
    unregisterLiveRuntimeCesiumRenderSinkV0();
  });

  it("PASSIVE returns raw hints without DOM, Cesium sink, or effector smoothing memory updates", async () => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "passive");
    const sink = vi.fn();
    registerLiveRuntimeCesiumRenderSinkV0(sink);
    const { hints } = await runLiveRuntimeOrchestratorTickV0({ ttlMs: 60_000 });
    expect(hints.fogDensity).toBeGreaterThanOrEqual(0);
    expect(sink).not.toHaveBeenCalled();
    const fog = document.documentElement.style.getPropertyValue("--rhizoh-proj-fog-density");
    expect(fog.length).toBe(0);
    expect(getSmoothedProjectionHintsSnapshotForTestsV0()).toBeNull();
    unregisterLiveRuntimeCesiumRenderSinkV0();
  });

  it("PASSIVE tick does not mutate smoothing memory established by ACTIVE", async () => {
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "active");
    await runLiveRuntimeOrchestratorTickV0({ ttlMs: 60_000 });
    const afterActive = getSmoothedProjectionHintsSnapshotForTestsV0();
    expect(afterActive).not.toBeNull();
    vi.stubEnv("VITE_WORLD_EXECUTION_MODE", "passive");
    await runLiveRuntimeOrchestratorTickV0({ ttlMs: 60_000 });
    expect(getSmoothedProjectionHintsSnapshotForTestsV0()).toEqual(afterActive);
  });
});
