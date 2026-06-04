import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCastleWorldDataStateV2,
  loadCastleWorldBuildingFootprintsV2,
  loadCastleWorldImportantPlacesV2,
  publishCastleWorldDataStateV2,
  CASTLE_WORLD_NO_FICTION_POLICY_V2
} from "../castleWorldDataProviderV2.js";

describe("castleWorldDataProviderV2 (no-fiction)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
    publishCastleWorldDataStateV2({
      feed: "unavailable",
      representation: "idle",
      lastSuccessAtMs: null,
      lastFailAtMs: null,
      lastError: null,
      endpoint: null,
      poiCount: 0,
      buildingCount: 0,
      userHint: null
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("enforces no-fiction policy constant", () => {
    expect(CASTLE_WORLD_NO_FICTION_POLICY_V2).toContain("degradation");
  });

  it("returns empty POI on Overpass fail without cache (no seed)", async () => {
    fetch.mockRejectedValue(new Error("Overpass 504"));
    const tags = [["tourism", "museum"]];
    const result = await loadCastleWorldImportantPlacesV2(tags, 50);
    expect(result.rows).toEqual([]);
    expect(result.feed).toBe("unavailable");
    expect(result.representation).toBe("degraded_empty");
    expect(getCastleWorldDataStateV2().synthesis).toBe(false);
    expect(getCastleWorldDataStateV2().poiCount).toBe(0);
  });

  it("returns empty buildings on Overpass fail without cache", async () => {
    fetch.mockRejectedValue(new Error("timeout"));
    const result = await loadCastleWorldBuildingFootprintsV2(50);
    expect(result.rows).toEqual([]);
    expect(result.feed).toBe("unavailable");
    expect(getCastleWorldDataStateV2().buildingCount).toBe(0);
  });

  it("uses cache after successful Overpass (temporal memory, not synthesis)", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        elements: [{ id: 1, lat: 41.01, lon: 28.98, tags: { name: "Test Museum" } }]
      })
    });
    const tags = [["tourism", "museum"]];
    const first = await loadCastleWorldImportantPlacesV2(tags, 50);
    expect(first.feed).toBe("overpass");
    expect(first.rows).toHaveLength(1);

    fetch.mockRejectedValue(new Error("Overpass 504"));
    const second = await loadCastleWorldImportantPlacesV2(tags, 50);
    expect(second.feed).toBe("cache");
    expect(second.representation).toBe("cached");
    expect(second.rows).toHaveLength(1);
  });
});
