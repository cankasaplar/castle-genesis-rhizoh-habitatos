import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCastleWorldDataStateV2,
  isOverpassFetchBlockedV0,
  loadCastleWorldBuildingFootprintsV2,
  loadCastleWorldImportantPlacesV2,
  publishCastleWorldDataStateV2,
  resetOverpassRateLimitStateForTestV0,
  CASTLE_WORLD_NO_FICTION_POLICY_V2
} from "../castleWorldDataProviderV2.js";

describe("castleWorldDataProviderV2 (no-fiction)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
    resetOverpassRateLimitStateForTestV0();
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

  it("enters cooldown after Overpass 429 and skips live buildings fetch", async () => {
    fetch.mockResolvedValue({ ok: false, status: 429 });
    const poi = await loadCastleWorldImportantPlacesV2([["tourism", "museum"]], 10);
    expect(poi.feed).toBe("unavailable");
    expect(isOverpassFetchBlockedV0()).toBe(true);

    fetch.mockClear();
    const buildings = await loadCastleWorldBuildingFootprintsV2(50);
    expect(buildings.rows).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("bootLazy skips live Overpass for buildings", async () => {
    const result = await loadCastleWorldBuildingFootprintsV2(50, { bootLazy: true });
    expect(result.rows).toEqual([]);
    expect(result.deferred).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("dedupes identical in-flight Overpass queries", async () => {
    /** @type {((value: unknown) => void) | null} */
    let pendingResolve = null;
    fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          pendingResolve = resolve;
        })
    );
    const tags = [["tourism", "museum"]];
    const p1 = loadCastleWorldImportantPlacesV2(tags, 10);
    await Promise.resolve();
    const p2 = loadCastleWorldImportantPlacesV2(tags, 10);
    await Promise.resolve();
    pendingResolve?.({
      ok: true,
      json: async () => ({
        elements: [{ id: 1, lat: 41.01, lon: 28.98, tags: { name: "A" } }]
      })
    });
    await Promise.all([p1, p2]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
