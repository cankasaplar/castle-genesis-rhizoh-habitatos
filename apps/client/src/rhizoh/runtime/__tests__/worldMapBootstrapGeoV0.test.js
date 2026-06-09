import { describe, expect, it } from "vitest";
import { resolveWorldMapBootstrapGeoV0 } from "../worldMapBootstrapGeoV0.js";
import { ORIGIN_SEED_SERENCEBEY_V0 } from "../memoryAnchorSystemV0.js";

describe("worldMapBootstrapGeoV0", () => {
  it("defaults to Serencebey origin seed when no nexus geo", () => {
    const geo = resolveWorldMapBootstrapGeoV0();
    expect(geo.lat).toBeCloseTo(ORIGIN_SEED_SERENCEBEY_V0.location.lat, 4);
    expect(geo.lon).toBeCloseTo(ORIGIN_SEED_SERENCEBEY_V0.location.lon, 4);
    expect(geo.source).toBe("origin_seed_serencebey");
  });
});
