import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  buildCastleCoherenceSlicesFromRemotePresenceV0,
  createGlobalSocialCoherenceLiveTickerV0,
  mergeCastleCoherenceSlicesByCastleIdV0
} from "../globalSocialCoherenceLiveTickV0.js";
import { createInitialSocialRegistry } from "../../csil/socialRegistry.js";

describe("mergeCastleCoherenceSlicesByCastleIdV0", () => {
  it("overlays same castleId", () => {
    const m = mergeCastleCoherenceSlicesByCastleIdV0(
      [{ castleId: "a", priority: 1, wsRoom: { seq: 1, roster: [] } }],
      [{ castleId: "a", priority: 9, wsRoom: { seq: 2, roster: [{ userId: "u1" }] } }]
    );
    expect(m).toHaveLength(1);
    expect(m[0].priority).toBe(9);
    expect(m[0].wsRoom.seq).toBe(2);
  });
});

describe("buildCastleCoherenceSlicesFromRemotePresenceV0", () => {
  it("maps active castle rows to slice roster", () => {
    const rows = [{ id: "uid1", displayName: "K1", nexusEnergy: 0.7, bridgePeers: ["x"] }];
    const s = buildCastleCoherenceSlicesFromRemotePresenceV0(rows);
    expect(s).toHaveLength(1);
    expect(s[0].castleId).toBe("uid1");
    expect(s[0].wsRoom.roster[0].userId).toBe("uid1");
    expect(s[0].wsRoom.roster[0].bridged).toBe(true);
  });
});

describe("createGlobalSocialCoherenceLiveTickerV0", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("skips tick when getKernelInput returns null", () => {
    const onTick = vi.fn();
    const t = createGlobalSocialCoherenceLiveTickerV0({
      tickMs: 500,
      getCastleSlices: () => [],
      getKernelInput: () => null,
      onTick
    });
    t.start();
    vi.advanceTimersByTime(500);
    expect(onTick).not.toHaveBeenCalled();
    t.dispose();
  });

  it("invokes onTick when kernel runs", () => {
    const onTick = vi.fn();
    const reg = createInitialSocialRegistry();
    const t = createGlobalSocialCoherenceLiveTickerV0({
      tickMs: 400,
      getCastleSlices: () => [],
      getKernelInput: () => ({
        nowMs: 1,
        continuityMeta: {},
        msSinceHardEvent: 0,
        silenceMs: 0,
        registry: reg,
        runArbiterTick: false,
        csilInput: {
          message: "",
          operatorId: "op",
          operatorLabel: "Me",
          sessionKey: "op",
          hasFirebaseUser: false,
          firebaseUid: "",
          trust: 0,
          familiarity: 0,
          roomTension: 0,
          routerIntent: "CHAT",
          castlePeers: [],
          countUserMessage: false,
          browserPresence: {}
        }
      }),
      onTick
    });
    t.start();
    vi.advanceTimersByTime(400);
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick.mock.calls[0][0].kernel?.frame).toBe(1);
    t.dispose();
  });
});
