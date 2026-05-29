import { describe, it, expect, beforeEach } from "vitest";
import { WS_MESSAGE } from "@castle/protocol";
import { createInitialStudioKernelState } from "../../../studio/store/initialState.ts";
import { resetWorldRuntimeDaemonStateV0 } from "../worldRuntimeDaemonQueueV0.js";
import {
  extractWalPeerFeedsFromCoherenceSliceV0,
  castleSocialRoomEnvelopeToCoherenceSliceV0,
  mergeCastleSocialRoomIntoSlicesV0,
  ingestPeerWalFromCastleSlicesV0,
  handleGatewayRoomEnvelopeForWalConvergenceV0
} from "../castleSocialWalConvergenceBridgeV0.js";

describe("castleSocialWalConvergenceBridgeV0", () => {
  beforeEach(() => {
    resetWorldRuntimeDaemonStateV0();
  });

  it("extracts walPeerFeed from roster entries", () => {
    const feeds = extractWalPeerFeedsFromCoherenceSliceV0({
      castleId: "room:main",
      wsRoom: {
        roster: [
          {
            userId: "u1",
            sourceCastleId: "castle:a",
            walPeerFeed: {
              history: [{ diffId: "ob:1", kind: "obstacle_delta", signed: true }],
              signed: true,
              observedAtMs: Date.now()
            }
          }
        ]
      }
    });
    expect(feeds).toHaveLength(1);
    expect(feeds[0].castleId).toBe("castle:a");
  });

  it("merges CASTLE_SOCIAL_ROOM into slices ref shape", () => {
    const slice = castleSocialRoomEnvelopeToCoherenceSliceV0({
      type: WS_MESSAGE.CASTLE_SOCIAL_ROOM,
      payload: {
        castleRoomKey: "castle:main",
        seq: 3,
        roster: [{ userId: "u1", lastMs: Date.now() }],
        peerFeeds: []
      }
    });
    expect(slice.wsRoom.castleRoomKey).toBe("castle:main");
    expect(slice.transport).toBe("castle_social_room");
  });

  it("updates slices array on social room envelope", () => {
    const next = mergeCastleSocialRoomIntoSlicesV0([], {
      type: WS_MESSAGE.CASTLE_SOCIAL_ROOM,
      payload: { castleRoomKey: "castle:main", seq: 1, roster: [] }
    });
    expect(next).toHaveLength(1);
    const next2 = mergeCastleSocialRoomIntoSlicesV0(next, {
      type: WS_MESSAGE.CASTLE_SOCIAL_ROOM,
      payload: { castleRoomKey: "castle:main", seq: 2, roster: [{ userId: "u2" }] }
    });
    expect(next2).toHaveLength(1);
    expect(next2[0].wsRoom.seq).toBe(2);
  });

  it("ingests peer wal from merged slices (natural path)", () => {
    let state = createInitialStudioKernelState();
    const slices = [
      {
        castleId: "castle:peer",
        wsRoom: { castleRoomKey: "castle:main", seq: 1, roster: [] },
        peerFeeds: [
          {
            castleId: "castle:peer",
            walPeerFeed: {
              history: [
                {
                  diffId: "ob:natural:1",
                  kind: "obstacle_delta",
                  lamport: 1,
                  castleId: "castle:peer",
                  signed: true,
                  payload: { discs: [{ x: 1, z: 2, r: 0.5 }] }
                }
              ],
              signed: true,
              observedAtMs: Date.now()
            }
          }
        ]
      }
    ];
    const r = ingestPeerWalFromCastleSlicesV0(slices, { getState: () => state });
    expect(r.feedCount).toBe(1);
    expect(r.results[0].disposition).toBe("accept");
  });

  it("handleGatewayRoomEnvelope wires social room to slices + convergence", () => {
    let state = createInitialStudioKernelState();
    const slices = [];
    const out = handleGatewayRoomEnvelopeForWalConvergenceV0(
      {
        type: WS_MESSAGE.CASTLE_SOCIAL_ROOM,
        payload: {
          castleRoomKey: "castle:main",
          seq: 5,
          roster: [
            {
              userId: "peer1",
              sourceCastleId: "castle:remote",
              walPeerFeed: {
                history: [
                  {
                    diffId: "ob:ws:1",
                    kind: "obstacle_delta",
                    signed: true,
                    lamport: 1,
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
      {
        getState: () => state,
        priorSlices: slices,
        onSlicesUpdate: (next) => {
          slices.length = 0;
          slices.push(...next);
        }
      }
    );
    expect(out.transport).toBe("castle_social_room");
    expect(slices).toHaveLength(1);
    expect(out.feedCount).toBeGreaterThan(0);
  });
});
