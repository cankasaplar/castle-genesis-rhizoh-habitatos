import { describe, expect, it } from "vitest";
import {
  GLOBAL_COHERENCE_MAX_DELTA_WITHOUT_FULL,
  reduceGlobalCastleCoherenceSlicesV0,
  shouldRequestFullCoherenceSnapshotV0
} from "../globalCastleDiffReducerV0.js";

describe("reduceGlobalCastleCoherenceSlicesV0", () => {
  it("merges rosters with priority then castleId tie-break", () => {
    const r = reduceGlobalCastleCoherenceSlicesV0([
      {
        castleId: "z-castle",
        priority: 1,
        wsRoom: { seq: 2, roster: [{ userId: "u1", lastMs: 100, energyHint01: 0.3 }] }
      },
      {
        castleId: "a-castle",
        priority: 2,
        wsRoom: { seq: 5, roster: [{ userId: "u1", lastMs: 200, energyHint01: 0.9 }] }
      }
    ]);
    expect(r.mergedWsRoom.seq).toBe(6);
    expect(r.sources).toEqual(["a-castle", "z-castle"]);
    const u1 = r.mergedWsRoom.roster.find((x) => x.userId === "u1");
    expect(u1?.sourceCastleId).toBe("a-castle");
    expect(u1?.energyHint01).toBe(0.9);
  });

  it("flags full snapshot when delta budget exceeded", () => {
    const r = reduceGlobalCastleCoherenceSlicesV0(
      [{ castleId: "c1", wsRoom: { seq: 1, roster: [] } }],
      { deltaFramesSinceFull: GLOBAL_COHERENCE_MAX_DELTA_WITHOUT_FULL }
    );
    expect(r.driftGuard.fullSnapshotRecommended).toBe(true);
    expect(shouldRequestFullCoherenceSnapshotV0(GLOBAL_COHERENCE_MAX_DELTA_WITHOUT_FULL)).toBe(true);
  });
});
