import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  applyRhizohWorldMapToolV0,
  cycleRhizohWorldMapToolV0,
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

  it("normalizes unknown ids to globe", () => {
    expect(normalizeRhizohWorldMapToolIdV0("nope")).toBe("globe");
  });

  it("resolves city map fly target", () => {
    const t = resolveRhizohWorldMapFlyTargetV0("city_map");
    expect(t?.lat).toBeGreaterThan(40);
    expect(t?.lon).toBeGreaterThan(28);
  });

  it("apply globe uses GLOBE mode", async () => {
    const setRealityMode = vi.fn(async () => ({ ok: true }));
    const r = await applyRhizohWorldMapToolV0("globe", { setRealityMode });
    expect(setRealityMode).toHaveBeenCalledWith("GLOBE", expect.objectContaining({ productSurface: "world" }));
    expect(r.realityMode).toBe("GLOBE");
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
});
