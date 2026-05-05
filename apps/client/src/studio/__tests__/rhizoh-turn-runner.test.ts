import { describe, expect, it } from "vitest";
import {
  getKernelAuditTail,
  getStudioKernelState,
  KernelGuardRun,
  patchIdentity,
  resetRhizohStudioKernelStore
} from "../store/studioStore.js";
import { runRhizohAgentTurn, RHIZOH_TURN_MIN_CONFIDENCE_DEFAULT } from "../runtime/rhizohTurnRunner";

describe("rhizohTurnRunner", () => {
  it("respects max intents and confidence gate", () => {
    resetRhizohStudioKernelStore();
    patchIdentity({
      ownerId: "tr-owner",
      actor: { id: "tr-owner", kind: "human" },
      session: null,
      permissions: { "registry.*": true, "presence.*": true, "physics.*": true, "world.*": true },
      delegates: [],
      sharedOwnerIds: []
    });

    const r = runRhizohAgentTurn(
      [
        { toolId: "x", payload: {}, confidence: 0.1 },
        { toolId: "y", payload: {}, confidence: 0.9 },
        { toolId: "z", payload: {}, confidence: 0.9 },
        { toolId: "w", payload: {}, confidence: 0.9 }
      ],
      { maxIntentsPerTurn: 2, minConfidence: RHIZOH_TURN_MIN_CONFIDENCE_DEFAULT }
    );
    expect(r.attempted).toBe(2);
    expect(r.log.filter((l) => l.error === "confidence_below_gate").length).toBeGreaterThanOrEqual(1);
    expect(r.committed).toBe(0);
  });

  it("KernelGuardRun dryRun skips audit trail", () => {
    resetRhizohStudioKernelStore();
    patchIdentity({
      ownerId: "dr-owner",
      actor: { id: "dr-owner", kind: "human" },
      session: null,
      permissions: { "registry.*": true, "presence.*": true },
      delegates: [],
      sharedOwnerIds: []
    });
    const before = getKernelAuditTail(200).length;
    const dry = KernelGuardRun({
      identity: getStudioKernelState().identity,
      action: "presence.avatar.move",
      payload: {},
      dryRun: true
    });
    expect(dry.allowed).toBe(false);
    const afterDry = getKernelAuditTail(200).length;
    expect(afterDry).toBe(before);
  });
});
