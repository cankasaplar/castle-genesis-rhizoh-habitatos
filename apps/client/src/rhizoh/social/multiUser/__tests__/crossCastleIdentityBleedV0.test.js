import { describe, expect, it } from "vitest";
import {
  evaluateCrossCastleIdentityBleedV0,
  CROSS_CASTLE_IDENTITY_BLEED_SCHEMA_V0
} from "../crossCastleIdentityBleedV0.js";

describe("evaluateCrossCastleIdentityBleedV0", () => {
  it("raises bleed risk with multiple source castles", () => {
    const g = evaluateCrossCastleIdentityBleedV0({
      wsRoom: {
        roster: [
          { userId: "a", sourceCastleId: "c1" },
          { userId: "b", sourceCastleId: "c2" },
          { userId: "c", sourceCastleId: "c3" }
        ]
      },
      castlePeers: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
      operatorUserId: "op"
    });
    expect(g.schema).toBe(CROSS_CASTLE_IDENTITY_BLEED_SCHEMA_V0);
    expect(g.bleedRisk01).toBeGreaterThan(0.4);
    expect(String(g.identityIsolationDirective || "").length).toBeGreaterThan(10);
    expect(String(g.memoryAttributionHint || "").length).toBeGreaterThan(20);
  });
});
