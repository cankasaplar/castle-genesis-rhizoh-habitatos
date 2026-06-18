import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  assertHardSeparationCrossRealmV0,
  assertLegalEffectGateV0,
  HARD_SEPARATION_REALM_V0,
  getHardSeparationSnapshotV0
} from "../rhizohHardSeparationLayerV0.js";

vi.mock("../rhizohLegalPendingWaitLoopV0.js", () => ({
  isRhizohLegalPendingHoldV0: () => true
}));

vi.mock("../rhizohShadowTraceLedgerV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isRhizohShadowModeActiveV0: () => true,
    resolveShadowModeReasonV0: () => "legal_pending_hold"
  };
});

vi.mock("../../ingress/ingress_router.js", () => ({
  resolveIngressRouteV0: () => ({ route: "legal_preamble", required: true, acked: false }),
  readClosedAdmissionSubjectRefV0: () => null
}));

describe("rhizohHardSeparationLayerV0", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: true } };
    }
  });

  it("blocks epistemic feeds_move_selection cross-realm flow", () => {
    const gate = assertHardSeparationCrossRealmV0(
      HARD_SEPARATION_REALM_V0.EPISTEMIC,
      HARD_SEPARATION_REALM_V0.EXECUTION,
      "feeds_move_selection"
    );
    expect(gate.blocked).toBe(true);
    expect(gate.permitted).toBe(false);
  });

  it("blocks external effects via legal gate during legal hold", () => {
    const gate = assertLegalEffectGateV0({ action: "youtube_publish" });
    expect(gate.blocked).toBe(true);
    expect(gate.legalGateHardBlock).toBe(true);
  });

  it("exposes hard separation snapshot with governance mode", () => {
    const snap = getHardSeparationSnapshotV0();
    expect(snap.legalGateHardBlock).toBe(true);
    expect(snap.externalEffectPermitted).toBe(false);
    expect(snap.shadowProductionMode).toBe(true);
  });
});
