import { describe, it, expect } from "vitest";
import { anchorProjectionToCesiumAtmosphereParamsV0 } from "../cesiumSpatialAdapterV0.js";

describe("cesiumSpatialAdapterV0", () => {
  it("maps higher localFog to higher fogDensity", () => {
    const low = anchorProjectionToCesiumAtmosphereParamsV0({
      localFog: 0.1,
      localAura: 0.5,
      localExposure: 0.8,
      resonanceDrift: 0.2
    });
    const high = anchorProjectionToCesiumAtmosphereParamsV0({
      localFog: 0.9,
      localAura: 0.5,
      localExposure: 0.8,
      resonanceDrift: 0.2
    });
    expect(high.fogDensity).toBeGreaterThan(low.fogDensity);
  });

  it("returns defaults for null projection", () => {
    const p = anchorProjectionToCesiumAtmosphereParamsV0(/** @type {any} */ (null));
    expect(p.fogDensity).toBeGreaterThan(0);
    expect(p.atmosphereLightIntensity).toBeGreaterThan(0);
  });
});
