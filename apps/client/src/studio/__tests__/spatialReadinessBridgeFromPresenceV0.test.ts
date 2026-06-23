import { describe, expect, it } from "vitest";
import {
  buildSpatialReadinessBridgeFromPresenceV0,
  SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0
} from "../lib/spatialReadinessBridgeFromPresenceV0";
import type { PresenceLayerState } from "../types/rskOntology";

describe("spatialReadinessBridgeFromPresenceV0", () => {
  it("builds bridge from a single-room presence layer", () => {
    const presence: PresenceLayerState = {
      avatars: {},
      rooms: {
        "room:test": {
          uid: "room:test",
          title: "Test",
          memberAvatarUids: [],
          createdAt: Date.now()
        }
      },
      broadcasts: {}
    };

    const bridge = buildSpatialReadinessBridgeFromPresenceV0({
      presence,
      roomUid: "room:test"
    });

    expect(bridge.schema).toBe(SPATIAL_READINESS_BRIDGE_FROM_PRESENCE_SCHEMA_V0);
    expect(bridge.roomUid).toBe("room:test");
    expect(bridge.spatialReadiness).toBeDefined();
  });
});
