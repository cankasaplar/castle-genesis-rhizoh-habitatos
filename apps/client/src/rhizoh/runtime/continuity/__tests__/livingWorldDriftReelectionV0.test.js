import { describe, it, expect, beforeEach } from "vitest";
import {
  assessLivingWorldDriftV0,
  RELEGITIMIZATION_VERDICT_V0,
  runLivingWorldLegitimizationV0
} from "../livingWorldDriftReelectionV0.js";
import {
  clearInMemoryWorldSealerV0,
  enableInMemoryWorldSealerForDiskV0,
  normalizeBootstrapForSealV0
} from "../worldSealerV0.js";
import { buildLivingWorldBootstrapV0 } from "../temporalWorldSelectionV0.js";
import { selectLivingTemporalWorldV0, buildEpistemicWorldCandidatesV0 } from "../temporalWorldSelectionV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { enrichTimeOwnershipContractV0, ISSUANCE_PATH_V0 } from "../temporalConflictResolutionV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";
import { REALITY_SEAL_DISK_KEY_V0 } from "../../realitySealDiskV0.js";

const NOW = 1_000_000_000_000;
const DISK = REALITY_SEAL_DISK_KEY_V0;

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
      issuedAtMs: NOW,
      issuancePath: overrides.issuancePath || ISSUANCE_PATH_V0.CANONICAL_BOOT,
      lineageDepth: overrides.lineageDepth ?? 2
    }),
    overrides
  );
}

describe("livingWorldDriftReelectionV0", () => {
  beforeEach(() => {
    clearInMemoryWorldSealerV0();
    enableInMemoryWorldSealerForDiskV0(DISK);
  });

  it("detects world identity shift as re-election required", () => {
    const persisted = normalizeBootstrapForSealV0(
      { worldId: "world:a", nodeId: "node:a", trustedCheckpointTick: 200, replayFromTick: 192, mayBootstrapRuntime: true, verdict: "x" },
      contract("node:a"),
      DISK
    );
    const fresh = normalizeBootstrapForSealV0(
      { worldId: "world:b", nodeId: "node:b", trustedCheckpointTick: 200, replayFromTick: 192, mayBootstrapRuntime: true, verdict: "x" },
      contract("node:b"),
      DISK
    );
    const drift = assessLivingWorldDriftV0(persisted, fresh, { nowMs: NOW + 1000 });
    expect(drift.verdict).toBe(RELEGITIMIZATION_VERDICT_V0.RE_ELECTION_REQUIRED);
    expect(drift.requiresReElection).toBe(true);
  });

  it("runLivingWorldLegitimization seals and allows execution on first pass", async () => {
    const result = await runLivingWorldLegitimizationV0({
      selfNodeId: "node:a",
      localContract: contract("node:a"),
      remoteContract: contract("node:b", { issuancePath: ISSUANCE_PATH_V0.WITNESS_RELAY }),
      nowMs: NOW,
      diskKey: DISK,
      persist: true,
      policy: { minStablePassesToLock: 1, minPassIntervalMs: 0, maxLegitimizationAgeMs: 120_000 }
    });
    expect(result.pipeline.worldSelection).toBeDefined();
    expect(result.seal?.ok).toBe(true);
    expect(result.allowExecution).toBe(true);
  });
});
