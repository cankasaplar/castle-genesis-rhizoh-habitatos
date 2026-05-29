import { describe, expect, it } from "vitest";
import {
  deriveDynamicSatelliteNodeIdV0,
  enrichGeographicAnchorFromWgs84V0,
  resolveNearestCityAnchorV0
} from "../dynamicSatelliteNodeSlugV0.js";

describe("dynamicSatelliteNodeSlugV0", () => {
  it("resolves Ankara WGS84 to ankara_satellite nodeId", () => {
    const anchor = { lat: 39.9334, lon: 32.8597 };
    expect(resolveNearestCityAnchorV0(anchor.lat, anchor.lon)?.slug).toBe("ankara");
    expect(deriveDynamicSatelliteNodeIdV0(anchor)).toBe("node:ankara_satellite");
  });

  it("resolves Kadıköy preset nodeId", () => {
    const anchor = { lat: 40.9909, lon: 29.0303 };
    expect(deriveDynamicSatelliteNodeIdV0(anchor)).toBe("node:kadikoy_satellite");
  });

  it("resolves Beşiktaş to besiktas_satellite", () => {
    const anchor = { lat: 41.0422, lon: 29.0075 };
    expect(deriveDynamicSatelliteNodeIdV0(anchor)).toBe("node:besiktas_satellite");
  });

  it("enriches unknown coords with geo micro slug", () => {
    const enriched = enrichGeographicAnchorFromWgs84V0({ lat: 12.34, lon: 56.78 });
    expect(enriched.placeSlug.startsWith("geo_")).toBe(true);
    expect(enriched.dynamicSlug.endsWith("_satellite")).toBe(true);
  });
});
