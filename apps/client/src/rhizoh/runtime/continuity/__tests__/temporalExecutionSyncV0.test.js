import { describe, it, expect, beforeEach } from "vitest";
import {
  buildTemporalExecutionAdvertisementV0,
  claimsSubstrateMutationAuthorityV0,
  clearPeerTemporalExecutionAdvertisementsV0,
  computeNetworkExecutorNodeIdV0,
  NETWORK_STABILIZATION_VERDICT_V0,
  runTemporalExecutionSyncPassV0,
  stabilizeNetworkExecutionAuthorityV0
} from "../temporalExecutionSyncV0.js";
import { attachTemporalExecutionPolicyToWalPeerFeedV0, ingestPeerWalFeedTemporalExecutionPolicyV0 } from "../temporalExecutionSyncWireV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { bindTemporalExecutionFromConflictV0, TEMPORAL_EXECUTION_MODE_V0 } from "../temporalExecutionBindingV0.js";
import { enrichTimeOwnershipContractV0, ISSUANCE_PATH_V0, TEMPORAL_CONFLICT_VERDICT_V0 } from "../temporalConflictResolutionV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";

const NOW = 1_000_000_000_000;
const DISK = "castle.shared.v0";

function contract(nodeId, overrides = {}) {
  return enrichTimeOwnershipContractV0(
    issueTimeOwnershipContractV0({
      nodeId,
      diskKey: DISK,
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: 200,
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

function sovereignBinding(nodeId) {
  const conflict = { resolution: TEMPORAL_CONFLICT_VERDICT_V0.LOCAL_WINS_AUTHORITY };
  return bindTemporalExecutionFromConflictV0(conflict, {
    role: "local",
    localContract: contract(nodeId)
  });
}

describe("temporalExecutionSyncV0", () => {
  beforeEach(() => {
    clearPeerTemporalExecutionAdvertisementsV0();
  });

  it("detects split-brain when two nodes claim local sovereign", () => {
    const a = contract("node:barcelona", { issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT });
    const b = contract("node:istanbul", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const stabilization = stabilizeNetworkExecutionAuthorityV0({
      selfNodeId: "node:barcelona",
      selfContract: a,
      selfBinding: sovereignBinding("node:barcelona"),
      peers: [
        {
          nodeId: "node:istanbul",
          contract: b,
          binding: sovereignBinding("node:istanbul")
        }
      ],
      nowMs: NOW
    });
    expect(stabilization.splitBrainDetected).toBe(true);
    expect(stabilization.verdict).toBe(NETWORK_STABILIZATION_VERDICT_V0.SPLIT_BRAIN_RESOLVED);
    expect(stabilization.networkExecutorNodeId).toBe("node:barcelona");
    expect(stabilization.selfBinding.mayMutateSubstrate).toBe(true);
  });

  it("demotes self to remote sovereign when network executor is peer", () => {
    const a = contract("node:zzz", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const b = contract("node:aaa", { issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT, lineageDepth: 8 });
    const stabilization = stabilizeNetworkExecutionAuthorityV0({
      selfNodeId: "node:zzz",
      selfContract: a,
      selfBinding: sovereignBinding("node:zzz"),
      peers: [{ nodeId: "node:aaa", contract: b, binding: sovereignBinding("node:aaa") }],
      nowMs: NOW
    });
    expect(stabilization.networkExecutorNodeId).toBe("node:aaa");
    expect(stabilization.selfBinding.executionMode).toBe(TEMPORAL_EXECUTION_MODE_V0.REMOTE_SOVEREIGN);
    expect(stabilization.selfBinding.mayMutateSubstrate).toBe(false);
  });

  it("propagates policy via wal peer feed attachment", () => {
    const local = contract("node:barcelona");
    const binding = sovereignBinding("node:barcelona");
    const feed = attachTemporalExecutionPolicyToWalPeerFeedV0(
      { history: [], signed: true },
      local,
      binding,
      { castleId: "castle:barcelona" }
    );
    expect(feed.temporalExecutionPolicy?.nodeId).toBe("node:barcelona");

    const remote = contract("node:istanbul", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const ingested = ingestPeerWalFeedTemporalExecutionPolicyV0(feed, {
      castleId: "castle:istanbul",
      selfNodeId: "node:istanbul",
      localContract: remote,
      localBinding: sovereignBinding("node:istanbul")
    });
    expect(ingested.ok).toBe(true);
    expect(ingested.syncPass.stabilization.networkExecutorNodeId).toBe("node:barcelona");
    expect(ingested.syncPass.stabilizedSelfBinding.mayMutateSubstrate).toBe(false);
  });

  it("claimsSubstrateMutationAuthority detects sovereign modes", () => {
    const b = sovereignBinding("node:x");
    expect(claimsSubstrateMutationAuthorityV0(b, "node:x")).toBe(true);
    expect(claimsSubstrateMutationAuthorityV0(b, "node:y")).toBe(true);
  });

  it("computeNetworkExecutorNodeId is deterministic", () => {
    const participants = [
      { nodeId: "node:b", contract: contract("node:b", { lineageDepth: 2 }) },
      { nodeId: "node:a", contract: contract("node:a", { lineageDepth: 10 }) }
    ];
    expect(computeNetworkExecutorNodeIdV0(participants, { nowMs: NOW })).toBe("node:a");
    expect(computeNetworkExecutorNodeIdV0(participants, { nowMs: NOW })).toBe("node:a");
  });

  it("runTemporalExecutionSyncPass merges pairwise and network stabilization", () => {
    const local = contract("node:barcelona");
    const remote = contract("node:istanbul", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const pass = runTemporalExecutionSyncPassV0({
      selfNodeId: "node:barcelona",
      localContract: local,
      remoteContract: remote,
      nowMs: NOW
    });
    expect(pass.pairwise.conflict).toBeDefined();
    expect(pass.stabilization.verdict).toBe(NETWORK_STABILIZATION_VERDICT_V0.CONSENSUS_SOVEREIGN);
    expect(pass.stabilizedSelfBinding.mayMutateSubstrate).toBe(true);
  });
});
