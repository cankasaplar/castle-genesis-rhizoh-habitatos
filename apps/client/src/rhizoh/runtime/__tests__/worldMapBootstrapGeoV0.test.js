import { describe, expect, it } from "vitest";
import {
  resolveUserCastleGeoForMapViewV0,
  resolveWorldMapBootstrapGeoV0
} from "../worldMapBootstrapGeoV0.js";
import { ORIGIN_SEED_SERENCEBEY_V0 } from "../memoryAnchorSystemV0.js";

describe("worldMapBootstrapGeoV0", () => {
  it("defaults to Serencebey origin seed when no nexus geo", () => {
    const geo = resolveWorldMapBootstrapGeoV0();
    expect(geo.lat).toBeCloseTo(ORIGIN_SEED_SERENCEBEY_V0.location.lat, 4);
    expect(geo.lon).toBeCloseTo(ORIGIN_SEED_SERENCEBEY_V0.location.lon, 4);
    expect(geo.source).toBe("origin_seed_serencebey");
  });

  it("resolveUserCastleGeoForMapView prefers nexus over anchors", () => {
    const prevNexus = window.__CASTLE_NEXUS_GEO__;
    window.__CASTLE_NEXUS_GEO__ = { lat: 41.01, lon: 28.99, source: "test" };
    expect(resolveUserCastleGeoForMapViewV0()?.source).toBe("test");
    if (prevNexus === undefined) delete window.__CASTLE_NEXUS_GEO__;
    else window.__CASTLE_NEXUS_GEO__ = prevNexus;
  });
});
