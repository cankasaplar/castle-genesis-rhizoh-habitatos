import { describe, expect, it } from "vitest";
import {
  computeRegimeDistanceFromLastCheckpointV0,
  computeRegimeDistanceMetricV0,
  LAST_REGIME_CHECKPOINT_V0
} from "../regimeDistanceMetricV0.js";

const CHECKPOINT_FORMING = {
  ledByState: "octo",
  softInboxCoupling: true,
  explorationIntegrityAtClosure: { explorationIntegrityScore: 0.872 },
  topologyOwnership: { writeCount: 6, agentWriteAttempts: 0 },
  inboxTransitionVerified: false
};

const CHECKPOINT_CLOSURE = {
  ledByState: "mixed",
  softInboxCoupling: true,
  explorationIntegrityAtClosure: { explorationIntegrityScore: 0.701 },
  topologyOwnership: { writeCount: 42, agentWriteAttempts: 0 },
  inboxTransitionVerified: true
};

describe("regimeDistanceMetricV0", () => {
  it("returns zero distance for identical checkpoints", () => {
    const d = computeRegimeDistanceMetricV0(CHECKPOINT_CLOSURE, { ...CHECKPOINT_CLOSURE });
    expect(d.distance).toBe(0);
    expect(d.intensity).toBe("low");
  });

  it("measures regime shift between forming and closure checkpoints", () => {
    const d = computeRegimeDistanceMetricV0(CHECKPOINT_FORMING, CHECKPOINT_CLOSURE);
    expect(d.distance).toBeGreaterThan(0.15);
    expect(d.components.inboxPhaseGap).toBeGreaterThan(0);
    expect(d.components.invariantStressGap).toBeGreaterThan(0);
    expect(d.interpretation).toContain("not drift magnitude");
  });

  it("computeRegimeDistanceFromLastCheckpointV0 is zero at closure mirror state", () => {
    const d = computeRegimeDistanceFromLastCheckpointV0({
      explorationIntegrity: { ledBy: "mixed", explorationIntegrityScore: 0.701 },
      softInboxCoupling: true,
      passiveCoupling: false,
      topologyOwnership: { writeCount: 42, agentWriteAttempts: 0, invariantHeld: true },
      observationInbox: [{}, {}],
      unacknowledgedPatterns: []
    });
    expect(d.distance).toBeLessThan(0.05);
    expect(d.checkpointRef).toContain("regime-checkpoints");
  });

  it("boot idle state is far from last closure checkpoint", () => {
    const d = computeRegimeDistanceFromLastCheckpointV0({
      explorationIntegrity: { ledBy: "octo", explorationIntegrityScore: 1 },
      softInboxCoupling: true,
      topologyOwnership: { writeCount: 0, agentWriteAttempts: 0, invariantHeld: true },
      observationInbox: [],
      unacknowledgedPatterns: []
    });
    expect(d.distance).toBeGreaterThan(LAST_REGIME_CHECKPOINT_V0.topologyOwnership.writeCount > 0 ? 0.2 : 0);
  });

  it("ledBy octo→rhizoh yields higher ledByShift than octo→mixed", () => {
    const toMixed = computeRegimeDistanceMetricV0(
      { ledByState: "octo", softInboxCoupling: true },
      { ledByState: "mixed", softInboxCoupling: true }
    );
    const toRhizoh = computeRegimeDistanceMetricV0(
      { ledByState: "octo", softInboxCoupling: true },
      { ledByState: "rhizoh", softInboxCoupling: true }
    );
    expect(toRhizoh.components.ledByShift).toBeGreaterThan(toMixed.components.ledByShift);
  });
});
