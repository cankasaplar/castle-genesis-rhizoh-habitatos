import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { shouldRunWebGpuComputeProbeV0 } from "../rhizohSpatialComputeProbePolicyV0.js";
import { markCastleAppEngineReadyV0, publishIngressRouteV0 } from "../spatialSinkRoutePolicyV0.js";

describe("rhizohSpatialComputeProbePolicyV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    publishIngressRouteV0("app");
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    delete window.__rhizoh;
  });

  it("skips WebGPU probe on T0 live route", () => {
    expect(shouldRunWebGpuComputeProbeV0()).toBe(false);
  });

  it("skips WebGPU probe on Leaflet world space", () => {
    window.history.replaceState({}, "", "/world/space");
    markCastleAppEngineReadyV0("test");
    expect(shouldRunWebGpuComputeProbeV0()).toBe(false);
  });

  it("allows probe only when sink is cesium", () => {
    expect(shouldRunWebGpuComputeProbeV0({ sink: "leaflet" })).toBe(false);
    expect(shouldRunWebGpuComputeProbeV0({ sink: "cesium_deferred" })).toBe(false);
    expect(shouldRunWebGpuComputeProbeV0({ sink: "cesium" })).toBe(true);
  });
});
