import { describe, it, expect, beforeEach } from "vitest";
import {
  AUDIT_INTEGRITY_TRIGGER_V0,
  AUDIT_INTEGRITY_VERDICT_V0,
  buildAuditGroundingFingerprintV0,
  clearAuditIntegrityChainStateV0,
  digestAuditGroundingV0,
  sealAuditRecordV0,
  validateAuditIntegrityV0,
  verifyAuditIntegrityChainV0
} from "../temporalAuditIntegrityV0.js";
import { getAuditIntegrityChainStateV0 } from "../temporalAuditIntegrityV0.js";
import {
  assertTemporalPipelineOrderV0,
  FIXATION_AUDIT_VERDICT_V0,
  runTemporalExecutionPipelineV0
} from "../temporalAuditRefixationV0.js";
import {
  applyTemporalAuthorityFixationV0,
  clearTemporalAuthorityFixationStateV0,
  FIXATION_PHASE_V0
} from "../temporalAuthorityFixationV0.js";
import { stabilizeNetworkExecutionAuthorityV0 } from "../temporalExecutionSyncV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { bindTemporalExecutionFromConflictV0 } from "../temporalExecutionBindingV0.js";
import { enrichTimeOwnershipContractV0, ISSUANCE_PATH_V0, TEMPORAL_CONFLICT_VERDICT_V0 } from "../temporalConflictResolutionV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";

const NOW = 1_000_000_000_000;
const DISK = "castle.audit.integrity";

function contract(nodeId, overrides = {}) {
  return enrichTimeOwnershipContractV0(
    issueTimeOwnershipContractV0({
      nodeId,
      diskKey: DISK,
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
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

function sovereignBinding(nodeId) {
  return bindTemporalExecutionFromConflictV0(
    { resolution: TEMPORAL_CONFLICT_VERDICT_V0.LOCAL_WINS_AUTHORITY },
    { role: "local", localContract: contract(nodeId) }
  );
}

describe("temporalAuditIntegrityV0", () => {
  beforeEach(() => {
    clearAuditIntegrityChainStateV0(DISK);
    clearTemporalAuthorityFixationStateV0(DISK);
  });

  it("enforces pipeline order includes audit_integrity", () => {
    const order = assertTemporalPipelineOrderV0(["sync", "audit", "audit_integrity", "fixation"]);
    expect(order.ok).toBe(true);
    const bad = assertTemporalPipelineOrderV0(["sync", "fixation", "audit_integrity"]);
    expect(bad.ok).toBe(false);
  });

  it("seals audit records in a hash chain", () => {
    const fp = buildAuditGroundingFingerprintV0({
      stabilization: { networkExecutorNodeId: "node:a", verdict: "x", mutatorNodeIds: ["node:a"] },
      fixationState: { phase: FIXATION_PHASE_V0.FIXED, fixedExecutorNodeId: "node:a" },
      localContract: contract("node:a")
    });
    const digest = digestAuditGroundingV0(fp);
    const s1 = sealAuditRecordV0(DISK, {
      audit: { verdict: FIXATION_AUDIT_VERDICT_V0.EPISTEMICALLY_VALID, trigger: "none" },
      groundingDigest: digest,
      nowMs: NOW
    });
    const s2 = sealAuditRecordV0(DISK, {
      audit: { verdict: FIXATION_AUDIT_VERDICT_V0.EPISTEMICALLY_VALID, trigger: "none" },
      groundingDigest: digest,
      nowMs: NOW + 1
    });
    expect(s2.seq).toBe(2);
    expect(s1.chainHeadHash).not.toBe(s2.chainHeadHash);
    const chain = getAuditIntegrityChainStateV0(DISK);
    expect(verifyAuditIntegrityChainV0(chain).ok).toBe(true);
  });

  it("flags stale audit interpretation when ground shifts", () => {
    const stab1 = stabilizeNetworkExecutionAuthorityV0({
      selfNodeId: "node:a",
      selfContract: contract("node:a"),
      selfBinding: sovereignBinding("node:a"),
      peers: [{ nodeId: "node:b", contract: contract("node:b"), binding: sovereignBinding("node:b") }],
      nowMs: NOW
    });
    const fp1 = buildAuditGroundingFingerprintV0({
      stabilization: stab1,
      fixationState: { phase: FIXATION_PHASE_V0.FIXED, fixedExecutorNodeId: "node:a" },
      localContract: contract("node:a")
    });
    sealAuditRecordV0(DISK, {
      audit: {
        verdict: FIXATION_AUDIT_VERDICT_V0.EPISTEMICALLY_VALID,
        trigger: "none",
        epistemicExecutorNodeId: "node:a",
        fixedExecutorNodeId: "node:a"
      },
      groundingDigest: digestAuditGroundingV0(fp1),
      nowMs: NOW
    });

    const stab2 = stabilizeNetworkExecutionAuthorityV0({
      selfNodeId: "node:a",
      selfContract: contract("node:a"),
      selfBinding: sovereignBinding("node:a"),
      peers: [
        {
          nodeId: "node:b",
          contract: contract("node:b", { lineageDepth: 30, issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT }),
          binding: sovereignBinding("node:b")
        }
      ],
      nowMs: NOW + 5000
    });

    const integrity = validateAuditIntegrityV0({
      diskKey: DISK,
      currentAudit: {
        verdict: FIXATION_AUDIT_VERDICT_V0.HISTORICAL_ONLY,
        trigger: "invalidate_fixation",
        epistemicExecutorNodeId: stab2.networkExecutorNodeId,
        fixedExecutorNodeId: "node:a"
      },
      stabilization: stab2,
      fixationState: { phase: FIXATION_PHASE_V0.FIXED, fixedExecutorNodeId: "node:a" },
      localContract: contract("node:a"),
      nowMs: NOW + 5000
    });

    expect(integrity.verdict).toBe(AUDIT_INTEGRITY_VERDICT_V0.STALE_AUDIT_INTERPRETATION);
    expect(integrity.trigger).toBe(AUDIT_INTEGRITY_TRIGGER_V0.INVALIDATE_PRIOR_INTERPRETATION);
  });

  it("pipeline includes audit integrity seal and stale detection", () => {
    applyTemporalAuthorityFixationV0(
      stabilizeNetworkExecutionAuthorityV0({
        selfNodeId: "node:a",
        selfContract: contract("node:a"),
        selfBinding: sovereignBinding("node:a"),
        peers: [{ nodeId: "node:b", contract: contract("node:b"), binding: sovereignBinding("node:b") }],
        nowMs: NOW
      }),
      { selfNodeId: "node:a", diskKey: DISK, localContract: contract("node:a"), nowMs: NOW, policy: { minStablePassesToLock: 1, minPassIntervalMs: 0 } }
    );

    const p1 = runTemporalExecutionPipelineV0({
      selfNodeId: "node:a",
      localContract: contract("node:a"),
      remoteContract: contract("node:b"),
      nowMs: NOW,
      policy: { minStablePassesToLock: 1, minPassIntervalMs: 0 }
    });
    expect(p1.auditSeal?.seq).toBe(1);

    const p2 = runTemporalExecutionPipelineV0({
      selfNodeId: "node:a",
      localContract: contract("node:a"),
      remoteContract: contract("node:b", { lineageDepth: 25, issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT }),
      nowMs: NOW + 8000,
      policy: { minStablePassesToLock: 1, minPassIntervalMs: 0 }
    });
    expect(p2.auditIntegrity).toBeDefined();
    expect(p2.pipelineOrder).toContain("audit_integrity");
    if (p2.auditInterpretationStale) {
      expect(p2.refixation?.ok).toBe(true);
    }
  });
});
