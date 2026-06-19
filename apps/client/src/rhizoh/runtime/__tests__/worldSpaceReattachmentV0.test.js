import { afterEach, describe, expect, it } from "vitest";
import {
  evaluateSpatialDriftQuarantineV0,
  normalizeSpatialVectorV0,
  SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0
} from "../worldSpaceReattachmentV0.js";

describe("worldSpaceReattachmentV0", () => {
  afterEach(() => {
    if (typeof window !== "undefined") {
      delete window.__rhizoh;
      delete window.__CASTLE_CESIUM__;
      delete window.__CASTLE_NEXUS_GEO__;
    }
  });

  it("normalizes spatial vector from world anchor + temporal offset", () => {
    const v = normalizeSpatialVectorV0({ lat: 41.04, lon: 29.0 }, { dtMs: 0, seq: 4 });
    expect(v.ok).toBe(true);
    expect(v.spatial_vector).toMatchObject({ x: expect.any(Number), y: expect.any(Number), z: expect.any(Number) });
  });

  it("quarantines when divergence exceeds 0.23", () => {
    expect(evaluateSpatialDriftQuarantineV0(0.1).quarantine).toBe(false);
    expect(evaluateSpatialDriftQuarantineV0(0.24).quarantine).toBe(true);
    expect(SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0).toBe(0.23);
  });

  it("reattach publishes bridge snapshot on window", async () => {
    window.__CASTLE_NEXUS_GEO__ = { lat: 41.04, lon: 29.0 };
    const mod = await import("../worldSpaceReattachmentV0.js");
    const result = mod.reattachWorldSpaceBridgeV0({ source: "test" });
    expect(result.ok).toBe(true);
    expect(window.__rhizoh.worldSpaceBridge.schema).toContain("world_space_reattachment");
  });
});
