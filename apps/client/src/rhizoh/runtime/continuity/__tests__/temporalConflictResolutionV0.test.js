import { describe, it, expect } from "vitest";
import {
  classifyEqualCheckpointConflictV0,
  computeTemporalAuthorityScoreV0,
  computeWitnessDecayV0,
  enrichTimeOwnershipContractV0,
  ISSUANCE_PATH_V0,
  resolveTemporalConflictV0,
  TEMPORAL_CONFLICT_VERDICT_V0
} from "../temporalConflictResolutionV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";

const NOW = 1_000_000_000_000;

function contract(overrides = {}) {
  return enrichTimeOwnershipContractV0(
    issueTimeOwnershipContractV0({
      nodeId: overrides.nodeId || "node:a",
      diskKey: "castle.shared.v0",
      epistemicPast: overrides.epistemicPast || EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: overrides.trustedCheckpointTick ?? 200,
      trustedThroughTick: overrides.trustedThroughTick ?? 200,
      replayFromTick: overrides.replayFromTick ?? 192,
      executionPermitted: true,
      issuedAtMs: overrides.issuedAtMs ?? NOW,
      issuancePath: overrides.issuancePath,
      parentCheckpointTick: overrides.parentCheckpointTick,
      lineageDepth: overrides.lineageDepth,
      witnessStrength: overrides.witnessStrength
    }),
    overrides
  );
}

describe("temporalConflictResolutionV0", () => {
  it("decays witness authority over time", () => {
    const fresh = computeWitnessDecayV0(NOW, NOW);
    const stale = computeWitnessDecayV0(NOW - 7 * 24 * 60 * 60 * 1000, NOW);
    expect(fresh.factor).toBeGreaterThan(stale.factor);
    expect(stale.factor).toBeCloseTo(0.5, 1);
  });

  it("ranks canonical_boot above witness_relay at same checkpoint", () => {
    const canon = contract({
      nodeId: "node:barcelona",
      issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: 4
    });
    const relay = contract({
      nodeId: "node:istanbul",
      issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY,
      lineageDepth: 4,
      issuedAtMs: NOW
    });
    const r = resolveTemporalConflictV0(canon, relay, { nowMs: NOW });
    expect(r.resolution).toBe(TEMPORAL_CONFLICT_VERDICT_V0.LOCAL_WINS_AUTHORITY);
    expect(r.question).toBe("hak_çatışması");
  });

  it("declares equal rights when checkpoint path and authority match", () => {
    const a = contract({ nodeId: "a", issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT, lineageDepth: 2 });
    const b = contract({
      nodeId: "b",
      issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: 2,
      issuedAtMs: NOW
    });
    const r = resolveTemporalConflictV0(a, b, { nowMs: NOW });
    expect(r.resolution).toBe(TEMPORAL_CONFLICT_VERDICT_V0.SHARED_JURISDICTION_EQUAL_RIGHTS);
    expect(r.question).toBe("hak_eşitliği");
  });

  it("classifies hak çatışması when paths differ but authority scores tie", () => {
    const score = { score: 200_200_000 };
    const out = classifyEqualCheckpointConflictV0({
      primary: { verdict: "divergent_jurisdiction" },
      lPath: ISSUANCE_PATH_V0.REPAIRED_REANCHOR,
      rPath: ISSUANCE_PATH_V0.TRUNCATED_RECOVERY,
      lAuth: score,
      rAuth: score
    });
    expect(out.resolution).toBe(TEMPORAL_CONFLICT_VERDICT_V0.TEMPORAL_CONFLICT);
    expect(out.question).toBe("hak_çatışması");
  });

  it("deeper lineage wins at equal checkpoint when paths comparable", () => {
    const shallow = contract({ lineageDepth: 1, issuancePath: ISSUANCE_PATH_V0.REPAIRED_REANCHOR });
    const deep = contract({
      nodeId: "deep",
      lineageDepth: 12,
      issuancePath: ISSUANCE_PATH_V0.REPAIRED_REANCHOR,
      parentCheckpointTick: 180
    });
    const out = resolveTemporalConflictV0(shallow, deep, { nowMs: NOW });
    expect(out.resolution).toBe(TEMPORAL_CONFLICT_VERDICT_V0.REMOTE_WINS_AUTHORITY);
  });
});
