import { describe, it, expect } from "vitest";
import {
  buildEpistemicWorldCandidatesV0,
  selectLivingTemporalWorldV0,
  WORLD_SELECTION_VERDICT_V0,
  runTemporalWorldSelectionV0
} from "../temporalWorldSelectionV0.js";
import {
  assertTemporalPipelineOrderV0,
  runTemporalExecutionPipelineV0
} from "../temporalAuditRefixationV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { enrichTimeOwnershipContractV0, ISSUANCE_PATH_V0 } from "../temporalConflictResolutionV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";

const NOW = 1_000_000_000_000;
const DISK = "castle.world.select";

function contract(nodeId, overrides = {}) {
  return enrichTimeOwnershipContractV0(
    issueTimeOwnershipContractV0({
      nodeId,
      diskKey: DISK,
      epistemicPast: overrides.epistemicPast || EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: overrides.trustedCheckpointTick ?? 200,
      trustedThroughTick: 200,
      replayFromTick: overrides.replayFromTick ?? 192,
      executionPermitted: overrides.executionPermitted !== false,
      issuedAtMs: overrides.issuedAtMs ?? NOW,
      issuancePath: overrides.issuancePath || ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: overrides.lineageDepth ?? 2
    }),
    overrides
  );
}

describe("temporalWorldSelectionV0", () => {
  it("pipeline order includes world_selection before fixation", () => {
    const order = assertTemporalPipelineOrderV0([
      "sync",
      "audit",
      "audit_integrity",
      "world_selection",
      "fixation"
    ]);
    expect(order.ok).toBe(true);
  });

  it("selects higher-authority world among multiple valid pasts", () => {
    const local = contract("node:local", { lineageDepth: 2, issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const peer = contract("node:peer", { lineageDepth: 12, issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT });
    const candidates = buildEpistemicWorldCandidatesV0({
      selfNodeId: "node:local",
      localContract: local,
      peerContracts: [peer],
      nowMs: NOW
    });
    const selection = selectLivingTemporalWorldV0({
      candidates,
      networkExecutorNodeId: "node:peer",
      selfNodeId: "node:local"
    });
    expect(selection.verdict).toBe(WORLD_SELECTION_VERDICT_V0.LIVING_WORLD_SELECTED);
    expect(selection.livingNodeId).toBe("node:peer");
    expect(selection.mayBootstrapRuntime).toBe(true);
  });

  it("resolves ambiguous multi-valid via network executor alignment", () => {
    const a = contract("node:aaa", { lineageDepth: 4, trustedCheckpointTick: 200 });
    const b = contract("node:bbb", { lineageDepth: 4, trustedCheckpointTick: 200 });
    const candidates = buildEpistemicWorldCandidatesV0({
      selfNodeId: "node:aaa",
      localContract: a,
      peerContracts: [b],
      nowMs: NOW
    });
    const selection = selectLivingTemporalWorldV0({
      candidates,
      networkExecutorNodeId: "node:bbb",
      policy: { minAuthorityGap: 0 }
    });
    expect(selection.validCount).toBe(2);
    expect(selection.livingNodeId).toBe("node:bbb");
  });

  it("denies bootstrap when no eligible world", () => {
    const bad = contract("node:x", {
      epistemicPast: EPISTEMIC_PAST_V0.NO_TRUSTED_PAST,
      executionPermitted: false
    });
    const selection = runTemporalWorldSelectionV0({
      selfNodeId: "node:x",
      localContract: bad,
      nowMs: NOW
    });
    expect(selection.verdict).toBe(WORLD_SELECTION_VERDICT_V0.NO_ELIGIBLE_WORLD);
    expect(selection.mayBootstrapRuntime).toBe(false);
  });

  it("full pipeline exposes livingWorldBootstrap", () => {
    const pipeline = runTemporalExecutionPipelineV0({
      selfNodeId: "node:barcelona",
      localContract: contract("node:barcelona"),
      remoteContract: contract("node:istanbul", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY }),
      nowMs: NOW,
      policy: { minStablePassesToLock: 1, minPassIntervalMs: 0 }
    });
    expect(pipeline.worldSelection).toBeDefined();
    expect(pipeline.livingWorldBootstrap).toBeDefined();
    expect(pipeline.pipelineOrder).toContain("world_selection");
    expect(pipeline.activeContract).toBeDefined();
  });
});
