import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  GOVERNANCE_LAYER_STATE_V0,
  GOVERNANCE_LAYER_V0,
  GOVERNANCE_MODE_V0,
  assertExecutionGovernanceLayerV0,
  getExecutionGovernanceSnapshotV0,
  isExternalEffectPermittedV0,
  isLegalGateHardBlockedV0,
  isUserImpactingMutationPermittedV0,
  resolveExecutionGovernanceModeV0,
  resolveInvitedUserQuarantineCohortV0,
  SHADOW_PRODUCTION_GOVERNANCE_V0
} from "../rhizohExecutionGovernanceSwitchboardV0.js";
import {
  ADMISSION_VERDICT_V0,
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
  resolveIngressRouteV0: () => ({
    route: "legal_preamble",
    required: true,
    acked: false
  })
}));

describe("rhizohExecutionGovernanceSwitchboardV0", () => {
  beforeEach(() => {
    clearClosedAdmissionForTestV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: true } };
    }
  });

  it("resolves legal_hold mode during legal pending hold", () => {
    expect(resolveExecutionGovernanceModeV0()).toBe(GOVERNANCE_MODE_V0.LEGAL_HOLD);
  });

  it("keeps external effects and user mutations OFF in shadow production", () => {
    expect(isExternalEffectPermittedV0()).toBe(false);
    expect(isUserImpactingMutationPermittedV0()).toBe(false);
    expect(isLegalGateHardBlockedV0()).toBe(true);
    expect(SHADOW_PRODUCTION_GOVERNANCE_V0.externalEffect).toBe(GOVERNANCE_LAYER_STATE_V0.OFF);
    expect(SHADOW_PRODUCTION_GOVERNANCE_V0.execution).toBe(GOVERNANCE_LAYER_STATE_V0.OFF);
    expect(SHADOW_PRODUCTION_GOVERNANCE_V0.simulation).toBe(GOVERNANCE_LAYER_STATE_V0.ON);
    expect(SHADOW_PRODUCTION_GOVERNANCE_V0.persistence).toBe(GOVERNANCE_LAYER_STATE_V0.ON);
  });

  it("enables internal epistemic layers while legal gate is hard blocked", () => {
    const snap = getExecutionGovernanceSnapshotV0();
    expect(snap.mode).toBe(GOVERNANCE_MODE_V0.LEGAL_HOLD);
    expect(snap.shadowProductionMode).toBe(true);
    expect(snap.layers[GOVERNANCE_LAYER_V0.COUNCIL]).toBe(GOVERNANCE_LAYER_STATE_V0.ON);
    expect(snap.layers[GOVERNANCE_LAYER_V0.MEMORY_GRAPH]).toBe(GOVERNANCE_LAYER_STATE_V0.ON);
    expect(snap.layers[GOVERNANCE_LAYER_V0.STRESS_ENGINE]).toBe(GOVERNANCE_LAYER_STATE_V0.ON);
    expect(snap.layers[GOVERNANCE_LAYER_V0.EXTERNAL_EFFECTS]).toBe(GOVERNANCE_LAYER_STATE_V0.OFF);
    expect(snap.layers[GOVERNANCE_LAYER_V0.LEGAL_GATE]).toBe(GOVERNANCE_LAYER_STATE_V0.HARD_BLOCK);
  });

  it("blocks external effect layer via assert helper", () => {
    const gate = assertExecutionGovernanceLayerV0(GOVERNANCE_LAYER_V0.EXTERNAL_EFFECTS);
    expect(gate.blocked).toBe(true);
    expect(gate.permitted).toBe(false);
    expect(gate.state).toBe(GOVERNANCE_LAYER_STATE_V0.OFF);
  });

  it("places admitted invited users in quarantine cohort with limited writes", () => {
    evaluateClosedAdmissionV0({
      subjectRef: "invite_subject_alpha",
      signals: {
        formalCorrectnessStress: 0.8,
        infraReplayStress: 0.7,
        physicalCouplingStress: 0.3,
        interpretationStress: 0.2
      }
    });

    const cohort = resolveInvitedUserQuarantineCohortV0({ subjectRef: "invite_subject_alpha" });
    expect(cohort.admitted).toBe(true);
    expect(cohort.inQuarantineCohort).toBe(true);
    expect(cohort.writePermission).toBe(GOVERNANCE_LAYER_STATE_V0.LIMITED);
    expect(cohort.observation).toBe(true);
    expect(cohort.sandboxInteraction).toBe(true);
    expect(cohort.feedbackEvents).toBe(true);
  });

  it("excludes non-admitted subjects from quarantine cohort", () => {
    const cohort = resolveInvitedUserQuarantineCohortV0({ subjectRef: "not_admitted" });
    expect(cohort.admitted).toBe(false);
    expect(cohort.inQuarantineCohort).toBe(false);
    expect(cohort.writePermission).toBe(GOVERNANCE_LAYER_STATE_V0.OFF);
  });

  it("rejects execution authority risk during admission evaluation", async () => {
    const mod = await import("../../ingress/closedUserAdmissionEngineV0.js");
    const r = mod.evaluateClosedAdmissionV0({
      subjectRef: "risk_subject",
      signals: { formalCorrectnessStress: 0.9, infraReplayStress: 0.8 },
      riskFlags: { executionAuthorityRequested: true }
    });
    expect(r.verdict).toBe(ADMISSION_VERDICT_V0.REJECT);
  });
});
