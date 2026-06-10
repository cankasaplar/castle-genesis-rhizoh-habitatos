import { describe, expect, it } from "vitest";
import { resolveCesiumLayerMatrixV0 } from "../cesiumLayerMatrixV0.js";

describe("resolveCesiumLayerMatrixV0", () => {
  it("desktop city_map enables terrain and OSM buildings with high imagery", () => {
    const m = resolveCesiumLayerMatrixV0({
      mapTool: "city_map",
      lowHardware: false,
      cfg: { cesiumWorldTerrain: true, cesiumOsmBuildings: true }
    });
    expect(m.sceneMode).toBe("3d");
    expect(m.imageryProfile).toBe("city_3d");
    expect(m.terrainEnabled).toBe(true);
    expect(m.osmBuildingsVisible).toBe(true);
    expect(m.osmBuildingsNeonStyle).toBe(true);
  });

  it("streets maps to dark cyber basemap on desktop", () => {
    const m = resolveCesiumLayerMatrixV0({
      mapTool: "streets",
      lowHardware: false,
      cfg: { cesiumOsmBuildings: true }
    });
    expect(m.imageryProfile).toBe("dark");
    expect(m.osmBuildingsVisible).toBe(true);
  });

  it("satellite hides OSM buildings", () => {
    const m = resolveCesiumLayerMatrixV0({
      mapTool: "satellite",
      lowHardware: false,
      cfg: { cesiumOsmBuildings: true }
    });
    expect(m.imageryProfile).toBe("satellite");
    expect(m.osmBuildingsVisible).toBe(false);
  });

  it("mobile fallback forces 2d, flat terrain, no buildings", () => {
    const m = resolveCesiumLayerMatrixV0({
      mapTool: "city_map",
      lowHardware: true,
      cfg: { cesiumWorldTerrain: true, cesiumOsmBuildings: true }
    });
    expect(m.sceneMode).toBe("2d");
    expect(m.terrainEnabled).toBe(false);
    expect(m.osmBuildingsVisible).toBe(false);
    expect(m.imageryQuality).toBe("compressed");
  });
});
