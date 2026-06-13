import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  applyRhizohWorldMapToolV0,
  cycleRhizohWorldMapToolV0,
  cycleRhizohWorldSpaceLeafletMapToolV0,
  normalizeRhizohWorldMapToolIdV0,
  readRhizohWorldMapToolV0,
  resolveRhizohWorldMapFlyTargetV0,
  writeRhizohWorldMapToolV0
} from "../rhizohWorldMapToolV0.js";

describe("rhizohWorldMapToolV0", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults to globe and persists selection", () => {
    expect(readRhizohWorldMapToolV0()).toBe("globe");
    writeRhizohWorldMapToolV0("city_map");
    expect(readRhizohWorldMapToolV0()).toBe("city_map");
  });

  it("cycles through all map tools", () => {
    expect(cycleRhizohWorldMapToolV0("globe")).toBe("city_map");
    expect(cycleRhizohWorldMapToolV0("city_map")).toBe("satellite");
    expect(cycleRhizohWorldMapToolV0("satellite")).toBe("streets");
    expect(cycleRhizohWorldMapToolV0("streets")).toBe("terrain");
    expect(cycleRhizohWorldMapToolV0("terrain")).toBe("anchor_map");
    expect(cycleRhizohWorldMapToolV0("anchor_map")).toBe("globe");
  });

  it("cycles leaflet-only tools for world space", () => {
    expect(cycleRhizohWorldSpaceLeafletMapToolV0("city_map")).toBe("satellite");
    expect(cycleRhizohWorldSpaceLeafletMapToolV0("satellite")).toBe("streets");
    expect(cycleRhizohWorldSpaceLeafletMapToolV0("streets")).toBe("city_map");
    expect(cycleRhizohWorldSpaceLeafletMapToolV0("globe")).toBe("city_map");
  });

  it("normalizes unknown ids to globe", () => {
    expect(normalizeRhizohWorldMapToolIdV0("nope")).toBe("globe");
  });

  it("resolves city map fly target", () => {
    const t = resolveRhizohWorldMapFlyTargetV0("city_map");
    expect(t?.lat).toBeGreaterThan(40);
    expect(t?.lon).toBeGreaterThan(28);
  });

  it("apply globe keeps REAL_MAP with orbit fly", async () => {
    const setRealityMode = vi.fn(async () => ({ ok: true }));
    const r = await applyRhizohWorldMapToolV0("globe", { setRealityMode });
    expect(setRealityMode).toHaveBeenCalledWith(
      "REAL_MAP",
      expect.objectContaining({ productSurface: "world", source: expect.stringContaining("GLOBE_ORBIT") })
    );
    expect(r.realityMode).toBe("REAL_MAP");
  });

  it("apply city map uses MAP_TOOL_EXPLICIT REAL_MAP", async () => {
    const setRealityMode = vi.fn(async () => ({ ok: true }));
    const r = await applyRhizohWorldMapToolV0("city_map", { setRealityMode });
    expect(setRealityMode).toHaveBeenCalledWith(
      "REAL_MAP",
      expect.objectContaining({ source: "MAP_TOOL_EXPLICIT", productSurface: "world" })
    );
    expect(r.realityMode).toBe("REAL_MAP");
  });

  it("apply leafletOnly skips reality mode and Cesium routing", async () => {
    const setRealityMode = vi.fn(async () => ({ ok: true }));
    const r = await applyRhizohWorldMapToolV0("globe", { setRealityMode, leafletOnly: true });
    expect(setRealityMode).not.toHaveBeenCalled();
    expect(r.tool).toBe("city_map");
    expect(r.leafletOnly).toBe(true);
  });
});
