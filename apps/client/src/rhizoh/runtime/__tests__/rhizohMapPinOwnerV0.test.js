import { describe, expect, it, vi } from "vitest";
import {
  RHIZOH_CESIUM_SESSION_PIN_OWNER_V0,
  filterPinsBySpiralMapLayerV0,
  readWorldSpaceSessionMapPinRowsV0,
  resolvePinSpiralLayerV0,
  resolveRhizohMapPinSubstrateV0,
  getRhizohMapPinOwnerSnapshotV0
} from "../rhizohMapPinOwnerV0.js";
import { SPIRAL_MAP_LAYER_V0 } from "../spatialDistributionLayerV0.js";

vi.mock("../rhizohLayerContextV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    resolveRhizohWorldSpaceCesiumActiveV0: vi.fn(() => false)
  };
});

describe("rhizohMapPinOwnerV0", () => {
  it("declares cesiumMapAnchorMarkersV0 as session pin owner", () => {
    const snap = getRhizohMapPinOwnerSnapshotV0({ pathname: "/world/space" });
    expect(snap.cesiumSessionOwner).toBe(RHIZOH_CESIUM_SESSION_PIN_OWNER_V0);
    expect(snap.leafletRenderer).toBe("v11LeafletMarkers");
  });

  it("defaults substrate to leaflet when cesium gate is off", () => {
    expect(
      resolveRhizohMapPinSubstrateV0({
        pathname: "/world/space",
        worldDomain: "space",
        mapTool: "city_map"
      })
    ).toBe("leaflet");
  });

  it("returns sovereign + live match pin rows", () => {
    const rows = readWorldSpaceSessionMapPinRowsV0({ liveMatchPins: [{ id: "live_1", lat: 1, lon: 2 }] });
    expect(rows.some((r) => r.id === "live_1")).toBe(true);
    expect(rows.length).toBeGreaterThan(1);
  });

  it("filterPinsBySpiralMapLayerV0 hides non-explorer prism pins by default", () => {
    const pins = [
      { id: "sovereign", lat: 1, lon: 2, type: "hub" },
      { id: "p1", lat: 1, lon: 2, spiralLayer: SPIRAL_MAP_LAYER_V0.EXPLORER },
      { id: "p2", lat: 1, lon: 2, spiralLayer: SPIRAL_MAP_LAYER_V0.CASTLE }
    ];
    const filtered = filterPinsBySpiralMapLayerV0(pins, {
      explorer: true,
      castle: false,
      economy: false,
      seasonal: false,
      includeDormant: false
    });
    expect(filtered.some((p) => p.id === "sovereign")).toBe(true);
    expect(filtered.some((p) => p.id === "p1")).toBe(true);
    expect(filtered.some((p) => p.id === "p2")).toBe(false);
  });

  it("resolvePinSpiralLayerV0 derives layer from towerClass", () => {
    expect(resolvePinSpiralLayerV0({ towerClass: "CHESS" })).toBe(SPIRAL_MAP_LAYER_V0.EXPLORER);
    expect(resolvePinSpiralLayerV0({ towerClass: "MEDIA" })).toBe(SPIRAL_MAP_LAYER_V0.ECONOMY);
  });
});
