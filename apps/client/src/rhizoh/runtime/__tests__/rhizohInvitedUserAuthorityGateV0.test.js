import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  assertInvitedUserEpistemicAuthorityV0,
  EPISTEMIC_AUTHORITY_KIND_V0,
  GOVERNANCE_ACTOR_V0
} from "../rhizohInvitedUserAuthorityGateV0.js";
import {
  clearClosedAdmissionForTestV0,
  evaluateClosedAdmissionV0
} from "../../ingress/closedUserAdmissionEngineV0.js";

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
  readClosedAdmissionSubjectRefV0: () => "invite_subject_alpha"
}));

describe("rhizohInvitedUserAuthorityGateV0", () => {
  beforeEach(() => {
    clearClosedAdmissionForTestV0();
    evaluateClosedAdmissionV0({
      subjectRef: "invite_subject_alpha",
      signals: {
        formalCorrectnessStress: 0.8,
        infraReplayStress: 0.7,
        physicalCouplingStress: 0.3,
        interpretationStress: 0.2
      }
    });
  });

  it("permits system actor for stress injection during quarantine", () => {
    const gate = assertInvitedUserEpistemicAuthorityV0(
      EPISTEMIC_AUTHORITY_KIND_V0.STRESS_INJECTION,
      { actor: GOVERNANCE_ACTOR_V0.SYSTEM }
    );
    expect(gate.permitted).toBe(true);
  });

  it("blocks quarantine user from stress injection", () => {
    const gate = assertInvitedUserEpistemicAuthorityV0(
      EPISTEMIC_AUTHORITY_KIND_V0.STRESS_INJECTION,
      { actor: GOVERNANCE_ACTOR_V0.USER }
    );
    expect(gate.blocked).toBe(true);
    expect(gate.reason).toContain("stress_injection");
  });

  it("blocks quarantine user from council trigger and graph write", () => {
    expect(
      assertInvitedUserEpistemicAuthorityV0(EPISTEMIC_AUTHORITY_KIND_V0.COUNCIL_TRIGGER, {
        actor: GOVERNANCE_ACTOR_V0.USER
      }).blocked
    ).toBe(true);
    expect(
      assertInvitedUserEpistemicAuthorityV0(EPISTEMIC_AUTHORITY_KIND_V0.GRAPH_WRITE, {
        actor: GOVERNANCE_ACTOR_V0.USER
      }).blocked
    ).toBe(true);
  });
});
