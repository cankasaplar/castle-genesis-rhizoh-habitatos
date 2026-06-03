import { describe, it, expect } from "vitest";
import { ISTANBUL_GEO } from "../../../castleFlight/geo.js";
import {
  rcalXYToCartographicV0,
  buildPetSpatialBindingSnapshotV0
} from "../rhizohPetSpatialGeoV0.js";

describe("rhizohPetSpatialGeoV0", () => {
  it("maps RCAL xy into Istanbul bbox", () => {
    const carto = rcalXYToCartographicV0(0, 0, { breathe01: 0.5 });
    expect(carto.lat).toBeGreaterThan(ISTANBUL_GEO.latMin);
    expect(carto.lat).toBeLessThan(ISTANBUL_GEO.latMax);
    expect(carto.lon).toBeGreaterThan(ISTANBUL_GEO.lonMin);
    expect(carto.lon).toBeLessThan(ISTANBUL_GEO.lonMax);
    expect(carto.heightM).toBeGreaterThan(90);
  });

  it("builds spatial snapshot for inhabited pet", () => {
    const snap = buildPetSpatialBindingSnapshotV0({
      inhabited: true,
      position: { x: 0.2, y: -0.1, world_projection: true },
      breathe01: 0.6,
      coherence_id: "c1"
    });
    expect(snap.bound).toBe(true);
    expect(snap.cartographic?.lat).toBeTruthy();
  });
});
