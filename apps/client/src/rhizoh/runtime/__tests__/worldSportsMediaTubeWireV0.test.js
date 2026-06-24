import { describe, expect, it, vi, beforeEach } from "vitest";
import { resetWorldMapLiveFeedCacheForTestsV0 } from "../worldMapLiveFeedV0.js";
import {
  getWorldSportsTubeSnapshotV0,
  wireWorldSportsMediaTubeV0
} from "../worldSportsMediaTubeWireV0.js";

vi.mock("../worldMapLiveFeedV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    refreshWorldMapLiveFeedIfStaleV0: vi.fn(async () =>
      Object.freeze({
        schema: "castle.live.world.feed.v0",
        fetchedAt: Date.now(),
        sports: Object.freeze({ live: [{ id: "m1", homeName: "Lakers", awayName: "Celtics", sport: "basketball" }] }),
        news: null
      })
    ),
    getWorldMapLiveFeedSnapshotV0: vi.fn(() => null)
  };
});

vi.mock("../worldMapLiveMatchPinsV0.js", () => ({
  refreshAndPublishLiveMatchPinsV0: vi.fn(async () =>
    Object.freeze([{ id: "live_match:m1", name: "Lakers vs Celtics" }])
  ),
  getLiveMatchMapPinsV0: vi.fn(() => Object.freeze([]))
}));

describe("worldSportsMediaTubeWireV0", () => {
  beforeEach(() => {
    resetWorldMapLiveFeedCacheForTestsV0();
  });

  it("wires feed refresh and returns pin counts", async () => {
    const result = await wireWorldSportsMediaTubeV0({ force: true, locale: "en" });
    expect(result.ok).toBe(true);
    expect(result.liveMatchCount).toBe(1);
    expect(result.pinCount).toBe(1);
    expect(result.interpretationOnly).toBe(true);
  });

  it("exposes snapshot with recent chips", () => {
    const snap = getWorldSportsTubeSnapshotV0({ locale: "en" });
    expect(snap.schema).toContain("snapshot");
    expect(snap.liveMatchCount).toBe(0);
  });
});
