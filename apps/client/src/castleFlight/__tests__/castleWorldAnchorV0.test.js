import { beforeEach, describe, expect, it } from "vitest";
import { createCastleWorldAnchorV0, listCastleWorldAnchorsV0 } from "../castleWorldAnchorV0.js";

describe("castleWorldAnchorV0", () => {
  beforeEach(() => {
    listCastleWorldAnchorsV0();
  });

  it("createCastleWorldAnchorV0 rejects invalid coords", () => {
    expect(createCastleWorldAnchorV0({ lat: NaN, lon: 29, label: "x", source: "map_pick" })).toBeNull();
  });

  it("createCastleWorldAnchorV0 publishes anchor", () => {
    const row = createCastleWorldAnchorV0({
      lat: 41.01,
      lon: 28.98,
      label: "Istanbul pick",
      source: "map_pick",
      feed: "unavailable"
    });
    expect(row?.id).toBeTruthy();
    expect(window.__CASTLE_WORLD_ANCHORS__?.count).toBeGreaterThan(0);
  });
});
