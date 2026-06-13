import { describe, expect, it } from "vitest";
import {
  CASTLE_PRESENCE_STATE_V0,
  listNearbyCastlesV0,
  mergeRemoteCastlesWithNetworkPresenceV0,
  presenceColorForStateV0,
  resetCastlePresenceRegistryForTestV0,
  upsertCastlePresenceV0
} from "../castlePresenceRegistryV0.js";

describe("castlePresenceRegistryV0", () => {
  it("upserts presence and lists nearby castles by haversine", () => {
    resetCastlePresenceRegistryForTestV0();
    upsertCastlePresenceV0({
      castleId: "castle_near",
      userId: "castle_near",
      state: CASTLE_PRESENCE_STATE_V0.BROADCASTING,
      viewers: 4,
      region: "TR",
      lat: 41.05,
      lon: 29.01
    });
    upsertCastlePresenceV0({
      castleId: "castle_far",
      userId: "castle_far",
      state: CASTLE_PRESENCE_STATE_V0.ONLINE,
      lat: 40.0,
      lon: 20.0
    });

    const nearby = listNearbyCastlesV0({ lat: 41.045, lon: 29.006, radiusKm: 50 });
    expect(nearby).toHaveLength(1);
    expect(nearby[0].castleId).toBe("castle_near");
    expect(nearby[0].viewers).toBe(4);
    expect(presenceColorForStateV0(CASTLE_PRESENCE_STATE_V0.BROADCASTING)).toBe("#a855f7");
  });

  it("merges Firestore remote castles with gateway presence", () => {
    const merged = mergeRemoteCastlesWithNetworkPresenceV0(
      [{ id: "uid_a", lat: 41.01, lon: 28.99, displayName: "Peer A" }],
      [
        {
          castleId: "uid_a",
          userId: "uid_a",
          state: CASTLE_PRESENCE_STATE_V0.THINKING,
          gatewayClientId: "gw_1",
          region: "TR"
        },
        {
          castleId: "uid_b",
          userId: "uid_b",
          state: CASTLE_PRESENCE_STATE_V0.ONLINE,
          lat: 41.02,
          lon: 29.0,
          gatewayClientId: "gw_2"
        }
      ]
    );
    expect(merged).toHaveLength(2);
    const peerA = merged.find((row) => row.id === "uid_a");
    expect(peerA?.presenceState).toBe(CASTLE_PRESENCE_STATE_V0.THINKING);
    expect(peerA?.gatewayClientId).toBe("gw_1");
    const peerB = merged.find((row) => row.id === "uid_b");
    expect(peerB?.lat).toBe(41.02);
  });
});
