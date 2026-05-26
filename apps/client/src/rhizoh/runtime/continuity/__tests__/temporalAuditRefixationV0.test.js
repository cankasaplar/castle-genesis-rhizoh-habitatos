import { describe, it, expect, beforeEach } from "vitest";
import {
  assertTemporalPipelineOrderV0,
  auditFixationEpistemicValidityV0,
  FIXATION_AUDIT_VERDICT_V0,
  REFIXATION_TRIGGER_V0,
  runTemporalExecutionPipelineV0
} from "../temporalAuditRefixationV0.js";
import {
  applyTemporalAuthorityFixationV0,
  clearTemporalAuthorityFixationStateV0,
  FIXATION_PHASE_V0,
  getTemporalAuthorityFixationStateV0
} from "../temporalAuthorityFixationV0.js";
import { stabilizeNetworkExecutionAuthorityV0 } from "../temporalExecutionSyncV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { bindTemporalExecutionFromConflictV0 } from "../temporalExecutionBindingV0.js";
import { enrichTimeOwnershipContractV0, ISSUANCE_PATH_V0, TEMPORAL_CONFLICT_VERDICT_V0 } from "../temporalConflictResolutionV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";

const NOW = 1_000_000_000_000;
const DISK = "castle.audit.test";
const POLICY_FAST = { minStablePassesToLock: 1, minPassIntervalMs: 0, fixationCooldownMs: 60_000 };

function contract(nodeId, overrides = {}) {
  return enrichTimeOwnershipContractV0(
    issueTimeOwnershipContractV0({
      nodeId,
      diskKey: DISK,
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: overrides.trustedCheckpointTick ?? 200,
      trustedThroughTick: 200,
      replayFromTick: 192,
      executionPermitted: overrides.executionPermitted !== false,
      issuedAtMs: overrides.issuedAtMs ?? NOW,
      issuancePath: overrides.issuancePath || ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: overrides.lineageDepth ?? 2
    }),
    overrides
  );
}

function sovereignBinding(nodeId) {
  return bindTemporalExecutionFromConflictV0(
    { resolution: TEMPORAL_CONFLICT_VERDICT_V0.LOCAL_WINS_AUTHORITY },
    { role: "local", localContract: contract(nodeId) }
  );
}

function lockFixation(selfId, peerId, peerOverrides = {}) {
  const stab = stabilizeNetworkExecutionAuthorityV0({
    selfNodeId: selfId,
    selfContract: contract(selfId),
    selfBinding: sovereignBinding(selfId),
    peers: [{ nodeId: peerId, contract: contract(peerId, peerOverrides), binding: sovereignBinding(peerId) }],
    nowMs: NOW
  });
  applyTemporalAuthorityFixationV0(stab, {
    selfNodeId: selfId,
    diskKey: DISK,
    localContract: contract(selfId),
    nowMs: NOW,
    policy: POLICY_FAST
  });
  return stab;
}

describe("temporalAuditRefixationV0", () => {
  beforeEach(() => {
    clearTemporalAuthorityFixationStateV0(DISK);
  });

  it("rejects fixation-before-sync pipeline order", () => {
    const bad = assertTemporalPipelineOrderV0(["fixation", "sync"]);
    expect(bad.ok).toBe(false);
    expect(bad.code).toBe("pipeline_order_violation");
    const good = assertTemporalPipelineOrderV0(["sync", "audit", "fixation"]);
    expect(good.ok).toBe(true);
  });

  it("detects false stability when fixed executor disagrees with fresh sync", () => {
    lockFixation("node:barcelona", "node:istanbul", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const state = getTemporalAuthorityFixationStateV0(DISK);
    expect(state?.phase).toBe(FIXATION_PHASE_V0.FIXED);

    const stabShifted = stabilizeNetworkExecutionAuthorityV0({
      selfNodeId: "node:barcelona",
      selfContract: contract("node:barcelona"),
      selfBinding: sovereignBinding("node:barcelona"),
      peers: [
        {
          nodeId: "node:istanbul",
          contract: contract("node:istanbul", {
            issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT,
            lineageDepth: 30
          }),
          binding: sovereignBinding("node:istanbul")
        }
      ],
      nowMs: NOW + 5000
    });

    const audit = auditFixationEpistemicValidityV0({
      fixationState: state,
      stabilization: stabShifted,
      selfNodeId: "node:barcelona",
      localContract: contract("node:barcelona"),
      nowMs: NOW + 5000
    });

    expect(audit.verdict).toBe(FIXATION_AUDIT_VERDICT_V0.HISTORICAL_ONLY);
    expect(audit.trigger).toBe(REFIXATION_TRIGGER_V0.INVALIDATE_FIXATION);
    expect(audit.falseStabilityRisk).toBe(true);
    expect(stabShifted.networkExecutorNodeId).not.toBe(state?.fixedExecutorNodeId);
  });

  it("pipeline invalidates fixation before re-applying on epistemic shift", () => {
    lockFixation("node:a", "node:b", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const fixedBefore = getTemporalAuthorityFixationStateV0(DISK)?.fixedExecutorNodeId;

    const pipeline = runTemporalExecutionPipelineV0({
      selfNodeId: "node:a",
      localContract: contract("node:a"),
      remoteContract: contract("node:b", {
        issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT,
        lineageDepth: 25
      }),
      nowMs: NOW + 10_000,
      policy: POLICY_FAST
    });

    expect(pipeline.falseStabilityPrevented).toBe(true);
    expect(pipeline.audit.verdict).toBe(FIXATION_AUDIT_VERDICT_V0.HISTORICAL_ONLY);
    expect(pipeline.refixation?.ok).toBe(true);
    expect(pipeline.syncPass.stabilization.networkExecutorNodeId).not.toBe(fixedBefore);
    expect(pipeline.networkExecutorNodeId).toBe(
      pipeline.syncPass.stabilization.networkExecutorNodeId
    );
  });

  it("epistemically valid fixation passes audit", () => {
    lockFixation("node:a", "node:b", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const pipeline = runTemporalExecutionPipelineV0({
      selfNodeId: "node:a",
      localContract: contract("node:a"),
      remoteContract: contract("node:b", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY }),
      nowMs: NOW + 1000,
      policy: POLICY_FAST
    });
    expect(pipeline.audit.verdict).toBe(FIXATION_AUDIT_VERDICT_V0.EPISTEMICALLY_VALID);
    expect(pipeline.audit.trigger).toBe(REFIXATION_TRIGGER_V0.NONE);
  });
});
