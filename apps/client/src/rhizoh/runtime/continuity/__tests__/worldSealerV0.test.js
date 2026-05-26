import { describe, it, expect, beforeEach } from "vitest";
import {
  clearInMemoryWorldSealerV0,
  enableInMemoryWorldSealerForDiskV0,
  enforceHydrateGateV0,
  normalizeBootstrapForSealV0,
  persistLivingWorldBootstrapV0,
  readLivingWorldBootstrapV0,
  revokeLivingWorldBootstrapV0,
  shouldRevokeLivingWorldBootstrapV0,
  HYDRATE_GATE_MODE_V0
} from "../worldSealerV0.js";
import { buildLivingWorldBootstrapV0 } from "../temporalWorldSelectionV0.js";
import { selectLivingTemporalWorldV0, buildEpistemicWorldCandidatesV0 } from "../temporalWorldSelectionV0.js";
import { issueTimeOwnershipContractV0 } from "../temporalIdentityBindingV0.js";
import { enrichTimeOwnershipContractV0, ISSUANCE_PATH_V0 } from "../temporalConflictResolutionV0.js";
import { EPISTEMIC_PAST_V0 } from "../replayCorruptionTaxonomyV0.js";
import { REALITY_SEAL_DISK_KEY_V0 } from "../../realitySealDiskV0.js";

const DISK = REALITY_SEAL_DISK_KEY_V0;

function contract(nodeId) {
  return enrichTimeOwnershipContractV0(
    issueTimeOwnershipContractV0({
      nodeId,
      diskKey: DISK,
      epistemicPast: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedCheckpointTick: 200,
      trustedThroughTick: 200,
      replayFromTick: 192,
      executionPermitted: true,
      issuancePath: ISSUANCE_PATH_V0.CANONICAL_BOOT
    })
  );
}

describe("worldSealerV0", () => {
  beforeEach(() => {
    clearInMemoryWorldSealerV0();
    enableInMemoryWorldSealerForDiskV0(DISK);
  });

  it("enforceHydrateGate blocks when bootstrap denied", () => {
    const gate = enforceHydrateGateV0({ mayBootstrapRuntime: false });
    expect(gate.allowExecution).toBe(false);
    expect(gate.mode).toBe(HYDRATE_GATE_MODE_V0.QUARANTINE);
  });

  it("persist and read living world bootstrap (memory backend)", async () => {
    const c = contract("node:barcelona");
    const selection = selectLivingTemporalWorldV0({
      candidates: buildEpistemicWorldCandidatesV0({
        selfNodeId: "node:barcelona",
        localContract: c,
        peerContracts: []
      })
    });
    const bootstrap = buildLivingWorldBootstrapV0(selection);
    const sealed = normalizeBootstrapForSealV0(bootstrap, c, DISK);

    await persistLivingWorldBootstrapV0(null, sealed, c, {
      networkExecutorNodeId: "node:barcelona"
    });

    const loaded = await readLivingWorldBootstrapV0(null, DISK);
    expect(loaded?.livingWorldId).toBe(sealed.livingWorldId);
    expect(loaded?.mayBootstrapRuntime).toBe(true);

    const gate = enforceHydrateGateV0(loaded);
    expect(gate.allowExecution).toBe(true);
    expect(gate.targetTick).toBe(200);
  });

  it("revokeLivingWorldBootstrap clears seal for forced re-selection", async () => {
    const c = contract("node:a");
    const selection = selectLivingTemporalWorldV0({
      candidates: buildEpistemicWorldCandidatesV0({
        selfNodeId: "node:a",
        localContract: c,
        peerContracts: []
      })
    });
    const sealed = normalizeBootstrapForSealV0(buildLivingWorldBootstrapV0(selection), c, DISK);
    await persistLivingWorldBootstrapV0(null, sealed, c);
    expect((await readLivingWorldBootstrapV0(null, DISK))?.livingWorldId).toBeTruthy();

    const revoke = await revokeLivingWorldBootstrapV0(null, DISK, "stale_audit_interpretation");
    expect(revoke.ok).toBe(true);
    expect(await readLivingWorldBootstrapV0(null, DISK)).toBeNull();
    expect(enforceHydrateGateV0(null).allowExecution).toBe(false);
  });

  it("shouldRevokeLivingWorldBootstrap detects stale audit", () => {
    const d = shouldRevokeLivingWorldBootstrapV0({
      pipeline: { auditIntegrity: { verdict: "stale_audit_interpretation" } }
    });
    expect(d.revoke).toBe(true);
  });
});
