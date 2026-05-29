import { describe, it, expect } from "vitest";
import {
  mergeWalHistoriesV0,
  computeWalReplayWitnessHashV0,
  reconcileWalReplayAgainstSealV0
} from "../walRealityConvergenceV0.js";

describe("walRealityConvergenceV0", () => {
  it("merges histories with lamport + castleId tie-break on conflict", () => {
    const local = [
      {
        diffId: "ob:1",
        kind: "obstacle_delta",
        lamport: 1,
        castleId: "castle:a",
        payload: { discs: [{ x: 0, z: 0, r: 1 }] },
        signed: true
      }
    ];
    const remote = [
      [
        {
          diffId: "ob:1",
          kind: "obstacle_delta",
          lamport: 2,
          castleId: "castle:b",
          payload: { discs: [{ x: 1, z: 1, r: 1 }] },
          signed: true
        }
      ]
    ];
    const r = mergeWalHistoriesV0(local, remote);
    expect(r.merged).toHaveLength(1);
    expect(r.conflicts).toHaveLength(1);
    expect(r.merged[0].castleId).toBe("castle:b");
  });

  it("drops unsigned remote entries", () => {
    const r = mergeWalHistoriesV0([], [[{ diffId: "x:1", kind: "scene_chunk", signed: false }]]);
    expect(r.merged).toHaveLength(0);
    expect(r.droppedUnsigned).toBe(1);
  });

  it("reconciles replay witness against sealed hash", () => {
    const history = [
      {
        diffId: "ob:1",
        kind: "obstacle_delta",
        lamport: 1,
        castleId: "local",
        payload: { discs: [] },
        signed: true
      }
    ];
    const witness = computeWalReplayWitnessHashV0(history);
    const ok = reconcileWalReplayAgainstSealV0(witness, history);
    expect(ok.ok).toBe(true);
    const bad = reconcileWalReplayAgainstSealV0("h00000000", history);
    expect(bad.ok).toBe(false);
  });
});
