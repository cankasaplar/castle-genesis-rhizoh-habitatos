import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  beginPhasedRolloutTurnV0,
  endPhasedRolloutTurnV0,
  beginPhasedRolloutTurnSyncV0,
  endPhasedRolloutTurnSyncV0,
  reconcilePhasedRolloutInflightV0,
  getPhasedRolloutStatsV0,
  resetPhasedRolloutClusterV0,
  resolvePhasedRolloutHealthV0
} from "../ops/phasedRolloutClusterV0.js";

describe("phasedRolloutClusterV0", () => {
  beforeEach(() => {
    resetPhasedRolloutClusterV0();
    delete process.env.NODE_ENV;
    process.env.CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS = "0";
    process.env.CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK = "1";
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "test2";
  });

  it("sync memory caps concurrent turns", () => {
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "test2";
    const a = beginPhasedRolloutTurnSyncV0();
    const b = beginPhasedRolloutTurnSyncV0();
    const c = beginPhasedRolloutTurnSyncV0();
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(c.ok, false);
    endPhasedRolloutTurnSyncV0(a.leaseId);
    endPhasedRolloutTurnSyncV0(b.leaseId);
  });

  it("reconcile purges orphaned leases after TTL", async () => {
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "test2";
    process.env.CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS = "20";
    const a = beginPhasedRolloutTurnSyncV0();
    assert.ok(a.leaseId);
    await new Promise((r) => setTimeout(r, 35));
    const recon = await reconcilePhasedRolloutInflightV0();
    assert.ok(recon.purged >= 1);
    const stats = await getPhasedRolloutStatsV0();
    assert.equal(stats.activeTurns, 0);
  });

  it("require redis fails closed when redis down", async () => {
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "200";
    process.env.CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS = "1";
    process.env.CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK = "0";
    process.env.CASTLE_GCL_REDIS_CONNECT_MS = "200";
    process.env.REDIS_URL = "redis://127.0.0.1:63998";
    resetPhasedRolloutClusterV0();
    const health = await resolvePhasedRolloutHealthV0();
    assert.equal(health.ok, false);
    const b = await beginPhasedRolloutTurnV0();
    assert.equal(b.ok, false);
    assert.equal(b.code, "phased_rollout_unavailable");
  });
});
