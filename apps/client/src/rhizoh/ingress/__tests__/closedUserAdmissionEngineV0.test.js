import { describe, expect, it, beforeEach } from "vitest";
import {
  ADMISSION_VERDICT_V0,
  assignStressClassV0,
  clearClosedAdmissionForTestV0,
  computeEpistemicStressProfileV0,
  EPISTEMIC_STRESS_CLASS_V0,
  evaluateClosedAdmissionV0,
  evaluateRiskGatesV0,
  evaluateRoleGateV0,
  generateInvitePayloadV0,
  isSubjectAdmittedV0,
  ROLE_GATE_ID_V0,
  simulateGoLiveCohortV0
} from "../closedUserAdmissionEngineV0.js";

describe("closedUserAdmissionEngineV0", () => {
  beforeEach(() => {
    clearClosedAdmissionForTestV0();
  });

  it("computes bounded stress profile from signals", () => {
    const p = computeEpistemicStressProfileV0({
      formalCorrectnessStress: 1,
      infraReplayStress: 0.5,
      physicalCouplingStress: 0.2,
      interpretationStress: 0.1
    });
    expect(p.interpretationOnly).toBe(true);
    expect(p.profile.invariant_resistance_score).toBeGreaterThan(0.5);
    expect(p.profile.invariant_resistance_score).toBeLessThanOrEqual(1);
  });

  it("assigns primary stress class from profile", () => {
    const packed = computeEpistemicStressProfileV0({
      formalCorrectnessStress: 0.95,
      infraReplayStress: 0.9,
      physicalCouplingStress: 0.1,
      interpretationStress: 0.05
    });
    const a = assignStressClassV0(packed);
    expect([
      EPISTEMIC_STRESS_CLASS_V0.INVARIANT_KEEPER,
      EPISTEMIC_STRESS_CLASS_V0.SYSTEMS_ENGINEER
    ]).toContain(a.primaryStressClass);
  });

  it("rejects on risk gates (named celebrity dependency)", () => {
    const r = evaluateClosedAdmissionV0({
      subjectRef: "subj_1",
      signals: { formalCorrectnessStress: 0.9, infraReplayStress: 0.9 },
      riskFlags: { namedCelebrityDependency: true }
    });
    expect(r.verdict).toBe(ADMISSION_VERDICT_V0.REJECT);
    expect(r.risk.blocks).toContain("named_celebrity_dependency");
    expect(isSubjectAdmittedV0("subj_1")).toBe(false);
  });

  it("admits strong invariant keeper profile", () => {
    const r = evaluateClosedAdmissionV0({
      subjectRef: "subj_inv",
      signals: {
        formalCorrectnessStress: 0.95,
        infraReplayStress: 0.85,
        physicalCouplingStress: 0.15,
        interpretationStress: 0.1
      },
      requestedGateId: ROLE_GATE_ID_V0.INVARIANT_KEEPER
    });
    expect(r.gate.pass).toBe(true);
    expect(r.verdict).toBe(ADMISSION_VERDICT_V0.ADMIT);
    expect(isSubjectAdmittedV0("subj_inv")).toBe(true);
  });

  it("generateInvitePayload has no PII shape", () => {
    const inv = generateInvitePayloadV0({
      cohortId: "go_live_50",
      stressClassTarget: EPISTEMIC_STRESS_CLASS_V0.EDGE_BUILDER,
      seed: 1
    });
    expect(inv.inviteToken).toMatch(/^rhizoh_inv_/);
    expect(inv.cohortId).toBe("go_live_50");
    expect(inv.interpretationOnly).toBe(true);
  });

  it("simulateGoLiveCohort returns histogram for 50 nodes", () => {
    const sim = simulateGoLiveCohortV0({ nodeCount: 50, seed: 7 });
    expect(sim.nodeCount).toBe(50);
    const total = Object.values(sim.histogram).reduce((a, b) => a + b, 0);
    expect(total).toBe(50);
    expect(sim.verdictCounts.admit + sim.verdictCounts.hold + sim.verdictCounts.reject).toBe(50);
  });

  it("evaluateRoleGate fails when below minimum", () => {
    const packed = computeEpistemicStressProfileV0({
      formalCorrectnessStress: 0,
      infraReplayStress: 0,
      physicalCouplingStress: 0,
      interpretationStress: 1
    });
    const g = evaluateRoleGateV0(ROLE_GATE_ID_V0.INVARIANT_KEEPER, packed);
    expect(g.pass).toBe(false);
    expect(g.reasons.length).toBeGreaterThan(0);
  });

  it("evaluateRiskGates passes clean flags", () => {
    expect(evaluateRiskGatesV0({}).pass).toBe(true);
  });
});
