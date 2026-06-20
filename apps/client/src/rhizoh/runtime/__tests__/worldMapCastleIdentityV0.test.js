import { beforeEach, describe, expect, it } from "vitest";
import {
  annotateCastleIdentityPinsV0,
  resolveCastleIdentityViewportNodesV0
} from "../worldMapCastleIdentityV0.js";
import { ORIGIN_HOME_SERENCEBEY_PIN_ID_V0 } from "../worldMapOriginHomePinV0.js";
import { applySpiralMapRealityModeV0, SPIRAL_MAP_REALITY_MODE_V0 } from "../spiralMapRealityModeV0.js";

describe("worldMapCastleIdentityV0", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("rhizoh.spiral_map_layer_filter.v0");
      localStorage.removeItem("rhizoh.world.map_marker_layers.v0");
    }
    applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.EXPLORER);
  });
  it("resolveCastleIdentityViewportNodesV0 always includes HOME CASTLE Serencebey", () => {
    const nodes = resolveCastleIdentityViewportNodesV0();
    expect(nodes.some((n) => n.id === ORIGIN_HOME_SERENCEBEY_PIN_ID_V0)).toBe(true);
  });

  it("annotateCastleIdentityPinsV0 tags castle pair in castle reality mode", () => {
    applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    const pins = annotateCastleIdentityPinsV0([
      { id: "my_castle", type: "castle", lat: 41.01, lon: 29.01 },
      { id: ORIGIN_HOME_SERENCEBEY_PIN_ID_V0, type: "origin_home", lat: 41.0422, lon: 29.0089 },
      { id: "ghost", type: "ghost", lat: 40, lon: 28 }
    ]);
    expect(pins.find((p) => p.id === "my_castle")?.castleIdentityPair).toBe(true);
    expect(pins.find((p) => p.id === ORIGIN_HOME_SERENCEBEY_PIN_ID_V0)?.castleIdentityPair).toBe(true);
    expect(pins.find((p) => p.id === "ghost")?.castleIdentityPair).toBeUndefined();
  });
});
