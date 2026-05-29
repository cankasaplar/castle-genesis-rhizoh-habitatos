import { describe, it, expect, beforeEach } from "vitest";
import { createInitialStudioKernelState } from "../../../studio/store/initialState.ts";
import { resetWorldRuntimeDaemonStateV0 } from "../worldRuntimeDaemonQueueV0.js";
import {
  PEER_WAL_SCENARIO_V0,
  classifyPeerWalFeedV0,
  processPeerWalConvergenceV0,
  simulatePeerWalScenarioV0,
  ingestPeerWalRoomBroadcastV0
} from "../peerWalConvergenceWireV0.js";

describe("peerWalConvergenceWireV0", () => {
  beforeEach(() => {
    resetWorldRuntimeDaemonStateV0();
  });

  function ctx() {
    let state = createInitialStudioKernelState();
    return {
      getState: () => state,
      setState: (n) => {
        state = n;
      }
    };
  }

  it("classifies unsigned peer feed", () => {
    const r = classifyPeerWalFeedV0(
      { signed: false, history: [], observedAtMs: Date.now() },
      { castleId: "peer:unsigned", localEpoch: 0 }
    );
    expect(r.scenario).toBe(PEER_WAL_SCENARIO_V0.UNSIGNED);
  });

  it("quarantines stale peer on process", () => {
    const { getState } = ctx();
    const r = simulatePeerWalScenarioV0("stale", { getState, castleId: "peer:stale" });
    expect(r.disposition).toBe("quarantine");
    expect(r.scenario).toBe(PEER_WAL_SCENARIO_V0.STALE);
  });

  it("quarantines epoch-ahead peer", () => {
    const { getState } = ctx();
    const r = simulatePeerWalScenarioV0("epoch_ahead", { getState, castleId: "peer:epoch" });
    expect(r.disposition).toBe("quarantine");
    expect(r.scenario).toBe(PEER_WAL_SCENARIO_V0.EPOCH_AHEAD);
  });

  it("quarantines replay mismatch peer", () => {
    const { getState } = ctx();
    const r = simulatePeerWalScenarioV0("replay_mismatch", { getState, castleId: "peer:replay" });
    expect(r.disposition).toBe("quarantine");
    expect(r.scenario).toBe(PEER_WAL_SCENARIO_V0.REPLAY_MISMATCH);
  });

  it("accepts clean signed peer feed", () => {
    const { getState } = ctx();
    const r = processPeerWalConvergenceV0(
      {
        history: [
          {
            diffId: "ob:ok:1",
            kind: "obstacle_delta",
            lamport: 1,
            castleId: "peer:ok",
            payload: { discs: [{ x: 2, z: 2, r: 0.5 }] },
            signed: true
          }
        ],
        signed: true,
        observedAtMs: Date.now(),
        claimedRealityEpoch: 0
      },
      { castleId: "peer:ok", getState }
    );
    expect(r.disposition).toBe("accept");
    expect(r.scenario).toBe(PEER_WAL_SCENARIO_V0.ACCEPT);
  });

  it("ingests CASTLE_WAL_PEER_ROOM broadcast envelope", () => {
    const { getState } = ctx();
    const results = ingestPeerWalRoomBroadcastV0(
      {
        payload: {
          peerFeeds: [
            {
              castleId: "peer:room",
              walPeerFeed: {
                history: [
                  {
                    diffId: "ob:r:1",
                    kind: "obstacle_delta",
                    lamport: 1,
                    castleId: "peer:room",
                    signed: true,
                    payload: { discs: [] }
                  }
                ],
                signed: true,
                observedAtMs: Date.now()
              }
            }
          ]
        }
      },
      { getState }
    );
    expect(results).toHaveLength(1);
    expect(results[0].castleId).toBe("peer:room");
  });
});
