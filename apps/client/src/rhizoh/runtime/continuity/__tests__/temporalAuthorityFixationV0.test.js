import { describe, it, expect, beforeEach } from "vitest";
import {
  applyTemporalAuthorityFixationV0,
  challengerBeatsFixationMarginV0,
  clearTemporalAuthorityFixationStateV0,
  FIXATION_PHASE_V0,
  FIXATION_VERDICT_V0
} from "../temporalAuthorityFixationV0.js";
import { runTemporalExecutionSyncWithFixationV0 } from "../temporalAuditRefixationV0.js";
import { stabilizeNetworkExecutionAuthorityV0 } from "../temporalExecutionSyncV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { bindTemporalExecutionFromConflictV0 } from "../temporalExecutionBindingV0.js";
import { enrichTimeOwnershipContractV0, ISSUANCE_PATH_V0, TEMPORAL_CONFLICT_VERDICT_V0 } from "../temporalConflictResolutionV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";

const NOW = 1_000_000_000_000;
const DISK = "castle.fixation.test";
const POLICY_FAST = {
  minStablePassesToLock: 2,
  minPassIntervalMs: 0,
  fixationCooldownMs: 60_000,
  maxOscillationFlips: 20
};

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
  return bindTemporalExecutionFromConflictV0(
    { resolution: TEMPORAL_CONFLICT_VERDICT_V0.LOCAL_WINS_AUTHORITY },
    { role: "local", localContract: contract(nodeId) }
  );
}

function splitBrainStabilization(selfId, peerId, peerOverrides = {}) {
  return stabilizeNetworkExecutionAuthorityV0({
    selfNodeId: selfId,
    selfContract: contract(selfId),
    selfBinding: sovereignBinding(selfId),
    peers: [
      {
        nodeId: peerId,
        contract: contract(peerId, peerOverrides),
        binding: sovereignBinding(peerId)
      }
    ],
    nowMs: NOW
  });
}

describe("temporalAuthorityFixationV0", () => {
  beforeEach(() => {
    clearTemporalAuthorityFixationStateV0(DISK);
  });

  it("locks authority after consecutive stable passes", () => {
    const stab = splitBrainStabilization("node:a", "node:b", {
      issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY
    });
    const r1 = applyTemporalAuthorityFixationV0(stab, {
      selfNodeId: "node:a",
      diskKey: DISK,
      localContract: contract("node:a"),
      nowMs: NOW,
      policy: POLICY_FAST
    });
    expect(r1.verdict).toBe(FIXATION_VERDICT_V0.PROVISIONAL);

    const r2 = applyTemporalAuthorityFixationV0(stab, {
      selfNodeId: "node:a",
      diskKey: DISK,
      localContract: contract("node:a"),
      nowMs: NOW + 1000,
      policy: POLICY_FAST
    });
    expect(r2.fixationPhase).toBe(FIXATION_PHASE_V0.FIXED);
    expect(r2.verdict).toBe(FIXATION_VERDICT_V0.NEWLY_FIXED);
    expect(r2.effectiveExecutorNodeId).toBe(stab.networkExecutorNodeId);
  });

  it("damps executor flip during cooldown and margin", () => {
    const stabA = splitBrainStabilization("node:barcelona", "node:istanbul", {
      issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY
    });
    applyTemporalAuthorityFixationV0(stabA, {
      selfNodeId: "node:barcelona",
      diskKey: DISK,
      localContract: contract("node:barcelona"),
      nowMs: NOW,
      policy: { ...POLICY_FAST, minStablePassesToLock: 1 }
    });
    applyTemporalAuthorityFixationV0(stabA, {
      selfNodeId: "node:barcelona",
      diskKey: DISK,
      localContract: contract("node:barcelona"),
      nowMs: NOW + 1,
      policy: { ...POLICY_FAST, minStablePassesToLock: 1 }
    });

    const stabB = splitBrainStabilization("node:barcelona", "node:istanbul", {
      issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: 20
    });
    const damped = applyTemporalAuthorityFixationV0(stabB, {
      selfNodeId: "node:barcelona",
      diskKey: DISK,
      localContract: contract("node:barcelona"),
      nowMs: NOW + 2000,
      policy: POLICY_FAST
    });
    expect(damped.verdict).toBe(FIXATION_VERDICT_V0.DAMPED_OSCILLATION);
    expect(damped.effectiveExecutorNodeId).toBe("node:barcelona");
    expect(damped.proposedExecutorNodeId).not.toBe(damped.effectiveExecutorNodeId);
  });

  it("challengerBeatsFixationMargin requires score ratio", () => {
    const participants = [
      { nodeId: "node:a", contract: contract("node:a", { lineageDepth: 2 }) },
      { nodeId: "node:b", contract: contract("node:b", { lineageDepth: 10 }) }
    ];
    expect(challengerBeatsFixationMarginV0(participants, "node:a", "node:b", { nowMs: NOW })).toBe(true);
    expect(challengerBeatsFixationMarginV0(participants, "node:b", "node:a", { nowMs: NOW })).toBe(false);
  });

  it("runTemporalExecutionSyncWithFixation returns fixed binding across passes", () => {
    const local = contract("node:a");
    const remote = contract("node:b", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY });
    const pass1 = runTemporalExecutionSyncWithFixationV0({
      selfNodeId: "node:a",
      localContract: local,
      remoteContract: remote,
      nowMs: NOW,
      policy: POLICY_FAST
    });
    const pass2 = runTemporalExecutionSyncWithFixationV0({
      selfNodeId: "node:a",
      localContract: local,
      remoteContract: remote,
      nowMs: NOW + 5000,
      policy: POLICY_FAST
    });
    expect(pass2.fixationPhase).toBe(FIXATION_PHASE_V0.FIXED);
    expect(pass2.networkExecutorNodeId).toBe(pass1.networkExecutorNodeId);
    expect(pass2.oscillationDamped).toBe(false);
  });
});
