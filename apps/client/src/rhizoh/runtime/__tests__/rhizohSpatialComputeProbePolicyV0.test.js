import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveRhizohComputeGateV0,
  shouldRunWebGpuComputeProbeV0
} from "../rhizohSpatialComputeProbePolicyV0.js";
import { __resetRhizohSpatialModeForTestV0 } from "../rhizohSpatialModeV0.js";
import { publishIngressRouteV0 } from "../spatialSinkRoutePolicyV0.js";
import { probeComputeAdapterV0, __resetComputeAdapterForTestV0 } from "../rhizohComputeAdapterRegistryV0.js";

describe("rhizohSpatialComputeProbePolicyV0", () => {
  beforeEach(() => {
    __resetRhizohSpatialModeForTestV0();
    __resetComputeAdapterForTestV0();
    window.__rhizoh = {};
    publishIngressRouteV0("app");
    window.history.replaceState({}, "", "/");
    vi.stubEnv("VITE_DEBUG", "0");
  });

  afterEach(() => {
    __resetRhizohSpatialModeForTestV0();
    __resetComputeAdapterForTestV0();
    delete window.__rhizoh;
    vi.unstubAllEnvs();
  });

  it("skips WebGPU probe on T0 live route", () => {
    expect(shouldRunWebGpuComputeProbeV0()).toBe(false);
    expect(resolveRhizohComputeGateV0().reason).toBe("leaflet_mode");
  });

  it("skips WebGPU probe on Leaflet world space", () => {
    window.history.replaceState({}, "", "/world/space");
    expect(shouldRunWebGpuComputeProbeV0()).toBe(false);
  });

  it("allows probe only when spatial mode is cesium", () => {
    expect(shouldRunWebGpuComputeProbeV0({ sink: "leaflet" })).toBe(false);
    expect(shouldRunWebGpuComputeProbeV0({ sink: "cesium_deferred" })).toBe(false);
    expect(shouldRunWebGpuComputeProbeV0({ sink: "cesium" })).toBe(true);
    expect(shouldRunWebGpuComputeProbeV0({ spatialMode: { active: "cesium" } })).toBe(true);
  });

  it("probeComputeAdapter uses silent skip in production", async () => {
    const snap = await probeComputeAdapterV0();
    expect(snap.skipped).toBe(true);
    expect(snap.skipReason).toBeUndefined();
  });
});
