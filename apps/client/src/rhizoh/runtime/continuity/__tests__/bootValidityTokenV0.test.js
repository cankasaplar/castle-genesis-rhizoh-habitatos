import { describe, expect, it, beforeEach } from "vitest";
import {
  REVOKE_STATE_CLEAN_V0,
  appendRevokeLogV0,
  assertBootValidityTokenV0,
  clearInMemoryBootValidityStateV0,
  commitLastAppliedBootSealVersionV0,
  computeBootValidityTokenV0,
  enforceRuntimeBootValidityTokenV0,
  finalizeBootAtomicSealV0,
  getBootAtomicSealV0,
  issueNextBootSealVersionV0,
  shouldApplyBootSealSnapshotV0
} from "../bootValidityTokenV0.js";
import {
  enableInMemoryWorldSealerForDiskV0,
  persistLivingWorldBootstrapV0,
  readLivingWorldBootstrapV0,
  revokeLivingWorldBootstrapV0,
  useInMemoryWorldSealerBackendV0
} from "../worldSealerV0.js";
import { sealAuditRecordV0, clearAuditIntegrityChainStateV0 } from "../temporalAuditIntegrityV0.js";
import { REALITY_SEAL_DISK_KEY_V0 } from "../../realitySealDiskV0.js";

const DISK = REALITY_SEAL_DISK_KEY_V0;

describe("bootValidityTokenV0", () => {
  beforeEach(() => {
    useInMemoryWorldSealerBackendV0(true).clear();
    clearInMemoryBootValidityStateV0();
    clearAuditIntegrityChainStateV0(DISK);
    enableInMemoryWorldSealerForDiskV0(DISK);
  });

  it("issueNextBootSealVersion is strictly monotonic with hash chain", () => {
    const v1 = issueNextBootSealVersionV0(null, "token-a");
    const v2 = issueNextBootSealVersionV0(
      { monotonicCounter: v1.monotonicCounter, bootSealChainHead: v1.bootSealChainHead },
      "token-b"
    );
    expect(v2.bootSealVersion).toBe(v1.bootSealVersion + 1);
    expect(v2.bootSealChainHead).not.toBe(v1.bootSealChainHead);
    expect(shouldApplyBootSealSnapshotV0(v1.bootSealVersion, v2.bootSealVersion)).toBe(false);
    expect(shouldApplyBootSealSnapshotV0(v2.bootSealVersion, v1.bootSealVersion)).toBe(true);
  });

  it("computeBootValidityToken is deterministic from atomic inputs", () => {
    const a = computeBootValidityTokenV0({
      livingWorldId: "world:a",
      checkpointTick: 42,
      revokeState: REVOKE_STATE_CLEAN_V0,
      auditSealHead: "head-1"
    });
    const b = computeBootValidityTokenV0({
      livingWorldId: "world:a",
      checkpointTick: 42,
      revokeState: REVOKE_STATE_CLEAN_V0,
      auditSealHead: "head-1"
    });
    expect(a).toBe(b);
    expect(a).not.toBe(
      computeBootValidityTokenV0({
        livingWorldId: "world:b",
        checkpointTick: 42,
        revokeState: REVOKE_STATE_CLEAN_V0,
        auditSealHead: "head-1"
      })
    );
  });

  it("getBootValidityToken reflects bootstrap + audit head after seal", async () => {
    sealAuditRecordV0(DISK, {
      audit: { verdict: "ok", trigger: "test" },
      groundingDigest: "g1"
    });
    const auditHead = sealAuditRecordV0(DISK, {
      audit: { verdict: "ok", trigger: "test2" },
      groundingDigest: "g2"
    }).chainHeadHash;

    await persistLivingWorldBootstrapV0(
      null,
      {
        schema: "castle.rhizoh.world_sealer.v0",
        diskKey: DISK,
        livingWorldId: "world:istanbul",
        livingNodeId: "node:local",
        checkpointTick: 100,
        replayFromTick: 92,
        mayBootstrapRuntime: true,
        epistemicPast: "canonical_chain",
        rehydrateGate: "continuity_ok",
        sealedAtMs: Date.now(),
        selectionVerdict: "selected"
      },
      { nodeId: "node:local", diskKey: DISK, trustedCheckpointTick: 100 }
    );

    const sealed = await finalizeBootAtomicSealV0(null, DISK, auditHead);
    expect(sealed.bootSealVersion).toBeGreaterThan(0);
    const fresh = await getBootAtomicSealV0(null, DISK);
    expect(fresh.token).toBeTruthy();
    expect(fresh.bootSealVersion).toBe(sealed.bootSealVersion);
    expect(fresh.inputs.livingWorldId).toBe("world:istanbul");
    expect(fresh.inputs.checkpointTick).toBe(100);
    expect(fresh.inputs.auditSealHead).toBe(auditHead);

    const boot = await readLivingWorldBootstrapV0(null, DISK);
    expect(boot.bootValidityToken).toBe(fresh.token);
  });

  it("token mismatch triggers revoke path (half-revoked guard)", async () => {
    await persistLivingWorldBootstrapV0(
      null,
      {
        schema: "castle.rhizoh.world_sealer.v0",
        diskKey: DISK,
        livingWorldId: "world:x",
        livingNodeId: "node:local",
        checkpointTick: 10,
        replayFromTick: 2,
        mayBootstrapRuntime: true,
        epistemicPast: "canonical_chain",
        rehydrateGate: "continuity_ok",
        sealedAtMs: Date.now(),
        selectionVerdict: "selected"
      },
      null
    );
    const atBoot = await getBootAtomicSealV0(null, DISK);
    commitLastAppliedBootSealVersionV0(atBoot.bootSealVersion, atBoot.token);
    await appendRevokeLogV0(null, DISK, "simulated_partial_revoke");

    const check = await assertBootValidityTokenV0(atBoot.token, null, DISK, {
      lastAppliedBootSealVersion: atBoot.bootSealVersion
    });
    expect(check.ok).toBe(false);
    expect(check.mismatch).toBe(true);

    const enforcement = await enforceRuntimeBootValidityTokenV0(atBoot.token, null, DISK, {
      lastAppliedBootSealVersion: atBoot.bootSealVersion
    });
    expect(enforcement.hardReload).toBe(true);
    expect(enforcement.revoked).toBe(true);

    const after = await readLivingWorldBootstrapV0(null, DISK);
    expect(after).toBeNull();
  });

  it("stale boot seal snapshot never triggers revoke", async () => {
    await persistLivingWorldBootstrapV0(
      null,
      {
        schema: "castle.rhizoh.world_sealer.v0",
        diskKey: DISK,
        livingWorldId: "world:stale",
        livingNodeId: "node:local",
        checkpointTick: 1,
        replayFromTick: 0,
        mayBootstrapRuntime: true,
        epistemicPast: null,
        rehydrateGate: null,
        sealedAtMs: Date.now(),
        selectionVerdict: null
      },
      null
    );
    const atBoot = await getBootAtomicSealV0(null, DISK);
    commitLastAppliedBootSealVersionV0(99, "phantom-anchor-token");

    const enforcement = await enforceRuntimeBootValidityTokenV0("phantom-anchor-token", null, DISK, {
      lastAppliedBootSealVersion: 99
    });
    expect(enforcement.code).toBe("stale_boot_seal_snapshot");
    expect(enforcement.hardReload).toBe(false);
    expect(enforcement.revoked).toBe(false);

    const boot = await readLivingWorldBootstrapV0(null, DISK);
    expect(boot?.livingWorldId).toBe("world:stale");
    expect(atBoot.bootSealVersion).toBeLessThan(99);
  });

  it("forward boot seal version adopts without revoke", async () => {
    await persistLivingWorldBootstrapV0(
      null,
      {
        schema: "castle.rhizoh.world_sealer.v0",
        diskKey: DISK,
        livingWorldId: "world:fwd",
        livingNodeId: "node:local",
        checkpointTick: 20,
        replayFromTick: 12,
        mayBootstrapRuntime: true,
        epistemicPast: null,
        rehydrateGate: null,
        sealedAtMs: Date.now(),
        selectionVerdict: null
      },
      null
    );
    const v1 = await getBootAtomicSealV0(null, DISK);
    commitLastAppliedBootSealVersionV0(v1.bootSealVersion, v1.token);

    await finalizeBootAtomicSealV0(null, DISK, "audit-forward");
    const v2 = await getBootAtomicSealV0(null, DISK);
    expect(v2.bootSealVersion).toBeGreaterThan(v1.bootSealVersion);

    const enforcement = await enforceRuntimeBootValidityTokenV0(v1.token, null, DISK, {
      lastAppliedBootSealVersion: v1.bootSealVersion
    });
    expect(enforcement.forwardAdopt).toBe(true);
    expect(enforcement.hardReload).toBe(false);
    expect(enforcement.revoked).toBe(false);
  });

  it("revokeLivingWorldBootstrap advances revoke log head", async () => {
    await persistLivingWorldBootstrapV0(
      null,
      {
        schema: "castle.rhizoh.world_sealer.v0",
        diskKey: DISK,
        livingWorldId: "world:y",
        livingNodeId: "node:local",
        checkpointTick: 5,
        replayFromTick: 0,
        mayBootstrapRuntime: true,
        epistemicPast: null,
        rehydrateGate: null,
        sealedAtMs: Date.now(),
        selectionVerdict: null
      },
      null
    );
    const before = await getBootAtomicSealV0(null, DISK);
    await revokeLivingWorldBootstrapV0(null, DISK, "stale_audit");
    const after = await getBootAtomicSealV0(null, DISK);
    expect(after.token).not.toBe(before.token);
    expect(after.inputs.revokeSeq).toBeGreaterThan(0);
  });
});
