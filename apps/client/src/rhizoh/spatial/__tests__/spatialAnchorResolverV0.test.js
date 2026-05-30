import { describe, it, expect } from "vitest";
import {
  quantizeLonLatForAnchorResolveV0,
  resolveAnchorFieldDistortion01V0,
  resolveDeterministicAnchorInfluenceBundleV0
} from "../spatialAnchorResolverV0.js";

describe("spatialAnchorResolverV0", () => {
  it("quantizes lon/lat so micro-jitter maps to same bucket", () => {
    const a = quantizeLonLatForAnchorResolveV0(41.042200001, 29.007500004);
    const b = quantizeLonLatForAnchorResolveV0(41.042200002, 29.007500003);
    expect(a.lat).toBe(b.lat);
    expect(a.lon).toBe(b.lon);
  });

  it("returns stable dominant id for nearby jitter (Besiktas anchor)", () => {
    const d1 = resolveDeterministicAnchorInfluenceBundleV0(41.0422, 29.0075);
    const d2 = resolveDeterministicAnchorInfluenceBundleV0(41.04220001, 29.00750001);
    expect(d1.dominantAnchorId).toBe(d2.dominantAnchorId);
    expect(d1.quantizedLat).toBe(d2.quantizedLat);
  });

  it("resolveAnchorFieldDistortion01V0 is in 0..1", () => {
    const v = resolveAnchorFieldDistortion01V0(41.1169, 29.0567);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});
