import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFallbackBuildingFootprintsV0,
  createFallbackImportantPlacesV0,
  getCastleWorldDataStateV0,
  loadCastleWorldBuildingFootprintsV0,
  loadCastleWorldImportantPlacesV0,
  publishCastleWorldDataStateV0
} from "../castleWorldDataProviderV0.js";

describe("castleWorldDataProviderV0", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
    publishCastleWorldDataStateV0({
      provider: "idle",
      lastSuccessAtMs: null,
      lastFailAtMs: null,
      lastError: null,
      endpoint: null,
      poiCount: 0,
      buildingCount: 0
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("createFallbackImportantPlacesV0 returns Istanbul POI seed", () => {
    const rows = createFallbackImportantPlacesV0();
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows[0].tags?.castle_seed).toBe("1");
  });

  it("createFallbackBuildingFootprintsV0 returns seed boxes", () => {
    const rows = createFallbackBuildingFootprintsV0();
    expect(rows.length).toBeGreaterThan(10);
    expect(rows[0].height).toBeGreaterThan(0);
  });

  it("loadCastleWorldImportantPlacesV0 uses seed when Overpass fails", async () => {
    fetch.mockRejectedValue(new Error("Overpass 504"));
    const tags = [["tourism", "museum"]];
    const { rows, source } = await loadCastleWorldImportantPlacesV0(tags, 50);
    expect(source).toBe("seed");
    expect(rows.length).toBeGreaterThan(0);
    expect(getCastleWorldDataStateV0().provider).toBe("seed");
    expect(getCastleWorldDataStateV0().lastError).toContain("504");
  });

  it("loadCastleWorldBuildingFootprintsV0 uses seed when Overpass fails", async () => {
    fetch.mockRejectedValue(new Error("timeout"));
    const { rows, source } = await loadCastleWorldBuildingFootprintsV0(50);
    expect(source).toBe("seed");
    expect(rows.length).toBeGreaterThan(0);
    expect(getCastleWorldDataStateV0().buildingCount).toBeGreaterThan(0);
  });

  it("loadCastleWorldImportantPlacesV0 caches successful Overpass response", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        elements: [{ id: 1, lat: 41.01, lon: 28.98, tags: { name: "Test Museum" } }]
      })
    });
    const tags = [["tourism", "museum"]];
    const first = await loadCastleWorldImportantPlacesV0(tags, 50);
    expect(first.source).toBe("overpass");
    expect(first.rows).toHaveLength(1);

    fetch.mockRejectedValue(new Error("Overpass 504"));
    const second = await loadCastleWorldImportantPlacesV0(tags, 50);
    expect(second.source).toBe("cache");
    expect(second.rows).toHaveLength(1);
  });
});
