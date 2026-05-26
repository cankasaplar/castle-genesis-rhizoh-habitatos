import { describe, it, expect } from "vitest";
import {
  applyTemporalExecutionToRecoveryV0,
  bindTemporalExecutionFromConflictV0,
  CONCURRENCY_MODEL_V0,
  deriveEffectiveExecutionPermissionV0,
  electSingleExecutorNodeIdV0,
  EXECUTION_GATE_EFFECT_V0,
  resolveAndBindTemporalExecutionV0,
  TEMPORAL_EXECUTION_MODE_V0
} from "../temporalExecutionBindingV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";
import { REHYDRATE_GATE_V0 } from "../replayCorruptionTaxonomyV0.js";
import {
  ISSUANCE_PATH_V0,
  TEMPORAL_CONFLICT_VERDICT_V0,
  enrichTimeOwnershipContractV0
} from "../temporalConflictResolutionV0.js";

const NOW = 1_000_000_000_000;
const DISK = "castle.shared.v0";

function contract(nodeId, overrides = {}) {
  return enrichTimeOwnershipContractV0(
    issueTimeOwnershipContractV0({
      nodeId,
      diskKey: DISK,
      epistemicPast: overrides.epistemicPast || EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: overrides.trustedCheckpointTick ?? 200,
      trustedThroughTick: 200,
      replayFromTick: 192,
      executionPermitted: true,
      issuedAtMs: overrides.issuedAtMs ?? NOW,
      issuancePath: overrides.issuancePath || ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: overrides.lineageDepth ?? 2
    }),
    overrides
  );
}

function openRecovery() {
  return {
    mayRehydrate: true,
    rehydrateGate: REHYDRATE_GATE_V0.OPEN,
    executionPermission: { granted: true, basis: "canonical_validity" }
  };
}

describe("temporalExecutionBindingV0", () => {
  it("local_wins opens local gate and freezes remote mutations", () => {
    const barcelona = contract("node:barcelona", { issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT });
    const istanbul = contract("node:istanbul", {
      issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY,
      lineageDepth: 2
    });
    const bundle = resolveAndBindTemporalExecutionV0(barcelona, istanbul, { nowMs: NOW });
    expect(bundle.conflict.resolution).toBe(TEMPORAL_CONFLICT_VERDICT_V0.LOCAL_WINS_AUTHORITY);
    expect(bundle.local.executionMode).toBe(TEMPORAL_EXECUTION_MODE_V0.LOCAL_SOVEREIGN);
    expect(bundle.local.mayMutateSubstrate).toBe(true);
    expect(bundle.remote.executionMode).toBe(TEMPORAL_EXECUTION_MODE_V0.OBSERVE_ONLY);
    expect(bundle.remote.mayAppendWal).toBe(false);
  });

  it("shared jurisdiction elects single executor by deterministic nodeId", () => {
    const a = contract("node:aaa", {
      issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: 2,
      issuedAtMs: NOW
    });
    const b = contract("node:bbb", {
      issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: 2,
      issuedAtMs: NOW
    });
    expect(electSingleExecutorNodeIdV0(a, b)).toBe("node:aaa");
    const bundle = resolveAndBindTemporalExecutionV0(a, b, { nowMs: NOW });
    expect(bundle.conflict.resolution).toBe(
      TEMPORAL_CONFLICT_VERDICT_V0.SHARED_JURISDICTION_EQUAL_RIGHTS
    );
    expect(bundle.local.concurrencyModel).toBe(CONCURRENCY_MODEL_V0.SINGLE_EXECUTOR_ELECTED);
    expect(bundle.local.mayMutateSubstrate).toBe(true);
    expect(bundle.remote.mayMutateSubstrate).toBe(false);
    expect(bundle.local.electedExecutorNodeId).toBe("node:aaa");
  });

  it("temporal_conflict defaults to system freeze not speculative branch", () => {
    const a = contract("node:a", { issuancePath: ISSUANCE_PATH_V0.REPAIRED_REANCHOR });
    const b = contract("node:b", { issuancePath: ISSUANCE_PATH_V0.TRUNCATED_RECOVERY });
    const bundle = resolveAndBindTemporalExecutionV0(a, b, { nowMs: NOW });
    if (bundle.conflict.resolution !== TEMPORAL_CONFLICT_VERDICT_V0.TEMPORAL_CONFLICT) {
      return;
    }
    expect(bundle.local.executionMode).toBe(TEMPORAL_EXECUTION_MODE_V0.TEMPORAL_FREEZE);
    expect(bundle.local.gateEffect).toBe(EXECUTION_GATE_EFFECT_V0.MUTATION_FROZEN);
    expect(bundle.remote.mayRehydrate).toBe(false);
  });

  it("temporal_conflict with lab flag uses speculative dual-observe only", () => {
    const conflict = {
      resolution: TEMPORAL_CONFLICT_VERDICT_V0.TEMPORAL_CONFLICT,
      primary: { verdict: "divergent_jurisdiction" }
    };
    const frozen = bindTemporalExecutionFromConflictV0(conflict, {
      role: "local",
      localContract: contract("node:a"),
      allowSpeculativeBranch: false
    });
    const lab = bindTemporalExecutionFromConflictV0(conflict, {
      role: "local",
      localContract: contract("node:a"),
      allowSpeculativeBranch: true
    });
    expect(frozen.executionMode).toBe(TEMPORAL_EXECUTION_MODE_V0.TEMPORAL_FREEZE);
    expect(lab.executionMode).toBe(TEMPORAL_EXECUTION_MODE_V0.SPECULATIVE_BRANCH_LAB);
    expect(lab.mayMutateSubstrate).toBe(false);
  });

  it("deriveEffectiveExecutionPermission closes mayRehydrate when temporal gate frozen", () => {
    const bundle = resolveAndBindTemporalExecutionV0(
      contract("node:a", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY }),
      contract("node:b", { issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT, lineageDepth: 4 }),
      { nowMs: NOW }
    );
    const loser = bundle.remote.mayMutateSubstrate ? bundle.local : bundle.remote;
    const eff = deriveEffectiveExecutionPermissionV0(openRecovery(), loser);
    expect(eff.mayRehydrate).toBe(false);
    expect(eff.executionPermission.granted).toBe(false);
    expect(
      [TEMPORAL_EXECUTION_MODE_V0.OBSERVE_ONLY, TEMPORAL_EXECUTION_MODE_V0.REMOTE_SOVEREIGN].includes(
        eff.executionPermission.temporalMode
      )
    ).toBe(true);
  });

  it("applyTemporalExecutionToRecovery merges orchestrator + temporal binding", () => {
    const bundle = resolveAndBindTemporalExecutionV0(contract("node:a"), contract("node:bbb"), {
      nowMs: NOW
    });
    const merged = applyTemporalExecutionToRecoveryV0(bundle, openRecovery());
    expect(merged.temporalExecution).toBeDefined();
    expect(merged.temporalConflict).toBeDefined();
    if (merged.temporalExecution.mayMutateSubstrate) {
      expect(merged.mayRehydrate).toBe(true);
    }
  });
});
