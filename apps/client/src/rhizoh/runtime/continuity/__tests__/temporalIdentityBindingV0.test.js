import { describe, it, expect } from "vitest";
import {
  arbitrateTemporalJurisdictionV0,
  assertNodeExecutionJurisdictionV0,
  issueTimeOwnershipContractV0,
  JURISDICTION_VERDICT_V0
} from "../temporalIdentityBindingV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";

describe("temporalIdentityBindingV0", () => {
  it("issues time ownership contract as epistemic passport", () => {
    const c = issueTimeOwnershipContractV0({
      nodeId: "node:barcelona",
      diskKey: "castle.barcelona.v0",
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: 120,
      trustedThroughTick: 120,
      replayFromTick: 112,
      executionPermitted: true
    });
    expect(c.schema).toContain("time_ownership_contract");
    expect(c.trustedCheckpointTick).toBe(120);
  });

  it("denies execution before trusted checkpoint", () => {
    const c = issueTimeOwnershipContractV0({
      nodeId: "node:a",
      diskKey: "k",
      epistemicPast: EPISTEMIC_PAST_V0.TRUNCATED_TAIL,
      trustedCheckpointTick: 50,
      trustedThroughTick: 90,
      replayFromTick: 42,
      executionPermitted: true
    });
    const j = assertNodeExecutionJurisdictionV0(c, { replayFromTick: 40 });
    expect(j.mayExecute).toBe(false);
    expect(j.code).toBe("before_trusted_checkpoint");
  });

  it("arbitrates Barcelona vs Istanbul by jurisdiction not wall clock", () => {
    const barcelona = issueTimeOwnershipContractV0({
      nodeId: "node:barcelona",
      diskKey: "castle.shared.v0",
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: 200,
      trustedThroughTick: 200,
      replayFromTick: 192,
      executionPermitted: true,
      issuedAtMs: 1000
    });
    const istanbul = issueTimeOwnershipContractV0({
      nodeId: "node:istanbul",
      diskKey: "castle.shared.v0",
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: 150,
      trustedThroughTick: 150,
      replayFromTick: 142,
      executionPermitted: true,
      issuedAtMs: 2000
    });
    const r = arbitrateTemporalJurisdictionV0(barcelona, istanbul);
    expect(r.verdict).toBe(JURISDICTION_VERDICT_V0.LOCAL_EXECUTES);
    expect(r.winner).toBe("local");
  });

  it("flags divergent jurisdiction on diskKey mismatch", () => {
    const a = issueTimeOwnershipContractV0({
      nodeId: "a",
      diskKey: "universe.a",
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: 1,
      trustedThroughTick: 1,
      replayFromTick: 0,
      executionPermitted: true
    });
    const b = issueTimeOwnershipContractV0({
      nodeId: "b",
      diskKey: "universe.b",
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: 99,
      trustedThroughTick: 99,
      replayFromTick: 90,
      executionPermitted: true
    });
    expect(arbitrateTemporalJurisdictionV0(a, b).verdict).toBe(
      JURISDICTION_VERDICT_V0.DIVERGENT_JURISDICTION
    );
  });
});
