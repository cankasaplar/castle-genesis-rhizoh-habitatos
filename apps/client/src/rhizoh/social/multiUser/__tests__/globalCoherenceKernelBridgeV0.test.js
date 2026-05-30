import { describe, expect, it } from "vitest";
import { createInitialSocialRegistry } from "../../csil/socialRegistry.js";
import { GLOBAL_COHERENCE_KERNEL_BRIDGE_SCHEMA_V0, runGlobalSocialCoherenceKernelTickV0 } from "../globalCoherenceKernelBridgeV0.js";

describe("runGlobalSocialCoherenceKernelTickV0", () => {
  it("feeds merged multi-castle wsRoom into one kernel tick", () => {
    const reg = createInitialSocialRegistry();
    const out = runGlobalSocialCoherenceKernelTickV0({
      castleSlices: [
        {
          castleId: "east",
          priority: 1,
          wsRoom: { seq: 1, roster: [{ userId: "u-east", label: "E", energyHint01: 0.4 }] }
        },
        {
          castleId: "west",
          priority: 1,
          wsRoom: { seq: 2, roster: [{ userId: "u-west", label: "W", energyHint01: 0.5 }] }
        }
      ],
      kernelInput: {
        nowMs: 1000,
        lastFrame: 0,
        continuityMeta: { socialRuntimeV1: { mode: "IDLE", initiativeBudget01: 0.5 } },
        msSinceHardEvent: 1000,
        silenceMs: 1000,
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
          castlePeers: [],
          countUserMessage: false,
          browserPresence: {}
        },
        speechEvents: [{ userId: "u-east", ts: 1 }]
      }
    });

    expect(out.schema).toBe(GLOBAL_COHERENCE_KERNEL_BRIDGE_SCHEMA_V0);
    expect(out.globalMerge.mergedWsRoom.castleRoomKey).toBe("global:coherence");
    expect(out.kernel.frame).toBe(1);
    expect(out.frame).toBe(out.kernel.frame);
    expect(out.snapshotForUi).toBe(out.kernel.snapshotForUi);
    expect(out.snapshotForUi.peerCount).toBe(2);
    const headIds = (out.snapshotForLlm.castlePeersHead || []).map((p) => p.id).sort();
    expect(headIds).toEqual(["u-east", "u-west"]);
    expect(out.kernel.layers.ws?.castleRoomKey).toBe("global:coherence");
  });

  it("surfaces driftGuard from reducer alongside kernel output", () => {
    const reg = createInitialSocialRegistry();
    const out = runGlobalSocialCoherenceKernelTickV0({
      castleSlices: [{ castleId: "c1", wsRoom: { seq: 0, roster: [] } }],
      reducerOpts: { forceFullSnapshot: true },
      kernelInput: {
        nowMs: 1,
        lastFrame: 0,
        continuityMeta: {},
        msSinceHardEvent: 0,
        silenceMs: 0,
        registry: reg,
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
        },
        runArbiterTick: false
      }
    });
    expect(out.globalMerge.driftGuard.fullSnapshotRecommended).toBe(true);
    expect(out.globalMerge.driftGuard.reason).toBe("forced_full");
  });
});
