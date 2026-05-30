import { describe, it, expect } from "vitest";
import {
  getGeographicSemanticAnchorsV0,
  getGeographicSemanticAnchorByIdV0,
  getRhizohCalibrationRootAnchorV0,
  RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0
} from "../geographicAnchorsV0.js";

describe("geographicAnchorsV0", () => {
  it("exposes five Istanbul semantic anchors with stable ids", () => {
    const anchors = getGeographicSemanticAnchorsV0();
    expect(anchors).toHaveLength(5);
    const ids = anchors.map((a) => a.id);
    expect(new Set(ids).size).toBe(5);
    for (const a of anchors) {
      expect(a.lat).toBeGreaterThan(40.9);
      expect(a.lat).toBeLessThan(41.25);
      expect(a.lon).toBeGreaterThan(28.9);
      expect(a.lon).toBeLessThan(29.2);
      expect(a.influenceRadiusKm).toBeGreaterThan(0);
      expect(a.epistemicProfile).toMatchObject({
        stability: expect.any(Number),
        interaction: expect.any(Number),
        divergence: expect.any(Number),
        continuity: expect.any(Number),
        archivalDensity: expect.any(Number)
      });
      expect(a.atmosphericAffinity.coupling.length).toBeGreaterThan(0);
    }
  });

  it("getGeographicSemanticAnchorByIdV0 resolves Kadıköy anchor", () => {
    const k = getGeographicSemanticAnchorByIdV0("anchor_kadikoy_divergence");
    expect(k?.districtLabel).toBe("Kadıköy");
    expect(k?.epistemicProfile.divergence).toBeGreaterThan(0.7);
  });

  it("calibration root is Sarıyer (stability hub) by policy", () => {
    const root = getRhizohCalibrationRootAnchorV0();
    expect(root.id).toBe(RHIZOH_CALIBRATION_ROOT_ANCHOR_ID_V0);
    expect(root.districtLabel).toBe("Sarıyer");
    expect(root.epistemicProfile.stability).toBeGreaterThan(0.85);
  });
});
