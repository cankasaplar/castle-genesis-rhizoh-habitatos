import { describe, expect, it } from "vitest";
import { createInitialSocialRegistry } from "../../csil/socialRegistry.js";
import {
  buildSocialCoherenceNetworkDiffV0,
  mergeCastlePeersFromWsRosterV0,
  runSocialCoherenceKernelTickV0
} from "../socialCoherenceKernelV0.js";

describe("buildSocialCoherenceNetworkDiffV0", () => {
  it("is clean when pulse unchanged", () => {
    const snap = {
      frame: 2,
      socialPulse: { coherenceFrame: 2, energyHint01: 0.5, modeHint: "IDLE", rhizohRuntimeRole: "GUIDE", focusUserId: null, wsRoomSeq: 1 }
    };
    const d = buildSocialCoherenceNetworkDiffV0(snap, { ...snap, frame: 2 });
    expect(d.dirty).toBe(false);
    expect(Object.keys(d.patch).length).toBe(0);
  });

  it("emits patch when a pulse field changes", () => {
    const a = {
      frame: 1,
      socialPulse: { coherenceFrame: 1, energyHint01: 0.5, modeHint: "IDLE", rhizohRuntimeRole: "GUIDE", focusUserId: null, wsRoomSeq: 1 }
    };
    const b = {
      ...a,
      socialPulse: { ...a.socialPulse, energyHint01: 0.61 }
    };
    const d = buildSocialCoherenceNetworkDiffV0(a, b);
    expect(d.dirty).toBe(true);
    expect(d.patch.energyHint01).toBe(0.61);
  });
});

describe("mergeCastlePeersFromWsRosterV0", () => {
  it("dedupes by id and preserves base peers", () => {
    const m = mergeCastlePeersFromWsRosterV0(
      { roster: [{ userId: "u2", energyHint01: 0.7 }, { userId: "u1" }] },
      [{ id: "u1", label: "A" }]
    );
    expect(m.map((p) => p.id).sort()).toEqual(["u1", "u2"]);
  });
});

describe("runSocialCoherenceKernelTickV0", () => {
  it("produces one frame with aligned arbiter + csil + snapshots", () => {
    const reg = createInitialSocialRegistry();
    const out = runSocialCoherenceKernelTickV0({
      nowMs: 200_000,
      lastFrame: 4,
      continuityMeta: {
        socialRuntimeV1: { mode: "IDLE", initiativeBudget01: 0.55 }
      },
      msSinceHardEvent: 10_000,
      silenceMs: 50_000,
      registry: reg,
      csilInput: {
        message: "",
        operatorId: "op",
        operatorLabel: "Me",
        sessionKey: "op",
        hasFirebaseUser: true,
        firebaseUid: "u0",
        trust: 0.5,
        familiarity: 0.5,
        roomTension: 0.1,
        routerIntent: "CHAT",
        castlePeers: [{ id: "p1", label: "P1" }],
        countUserMessage: false,
        browserPresence: {}
      },
      speechEvents: [{ userId: "p1", ts: 1 }],
      wsRoom: {
        castleRoomKey: "room-test",
        seq: 3,
        roster: [{ userId: "p2", energyHint01: 0.6 }]
      }
    });
    expect(out.frame).toBe(5);
    expect(out.snapshotForUi.frame).toBe(5);
    expect(out.snapshotForLlm.frame).toBe(5);
    expect(out.snapshotForNetwork.frame).toBe(5);
    expect(out.snapshotForLlm.socialRuntimeV1).toBeTruthy();
    expect(out.snapshotForLlm.personaContinuity?.band).toBeTruthy();
    expect(out.snapshotForLlm.personaContinuity?.ticksInBand).toBeGreaterThanOrEqual(1);
    expect(typeof out.snapshotForLlm.identityCompressionLine).toBe("string");
    expect(out.snapshotForLlm.identityCompressionLine.length).toBeGreaterThan(8);
    expect(out.snapshotForLlm.crossCastleBleedGuard?.schema).toBeTruthy();
    expect(Array.isArray(out.snapshotForLlm.socialMemoryRecall?.recallLines)).toBe(true);
    expect(out.decision.focusUserId).toBe("p1");
    expect(out.layers.csil.registry).toBeTruthy();
  });

  it("honors userEnergySlices for blended energy when provided", () => {
    const reg = createInitialSocialRegistry();
    const out = runSocialCoherenceKernelTickV0({
      nowMs: 100,
      lastFrame: 0,
      continuityMeta: {},
      msSinceHardEvent: 1000,
      silenceMs: 1000,
      registry: reg,
      runArbiterTick: false,
      userEnergySlices: [
        { userId: "a", energy01: 0.2 },
        { userId: "b", energy01: 0.8 }
      ],
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
    });
    expect(out.snapshotForUi.energy01).toBe(0.5);
  });
});
