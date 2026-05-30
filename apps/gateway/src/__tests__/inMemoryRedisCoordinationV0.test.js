import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  getCoordinationSimRedisClientV0,
  resetCoordinationSimV0,
  isCoordinationSimEnabledV0
} from "../ops/inMemoryRedisCoordinationV0.js";
import {
  beginPhasedRolloutTurnV0,
  endPhasedRolloutTurnV0,
  reconcilePhasedRolloutInflightV0,
  resetPhasedRolloutClusterV0,
  getPhasedRolloutStatsV0
} from "../ops/phasedRolloutClusterV0.js";

describe("inMemoryRedisCoordinationV0", () => {
  beforeEach(() => {
    process.env.CASTLE_COORDINATION_SIM = "1";
    process.env.CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS = "1";
    process.env.CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK = "0";
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "test2";
    process.env.CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS = "30";
    resetPhasedRolloutClusterV0();
  });

  it("sim client reserve and release via rollout cluster", async () => {
    assert.equal(isCoordinationSimEnabledV0(), true);
    const a = await beginPhasedRolloutTurnV0({ traceId: "sim-a" });
    assert.ok(a.ok);
    assert.ok(a.leaseId);
    assert.equal(a.ledgerMode, "coordination_sim");
    await endPhasedRolloutTurnV0(a.leaseId);
    const stats = await getPhasedRolloutStatsV0();
    assert.equal(stats.activeTurns, 0);
    assert.equal(stats.coordinationSim, true);
  });

  it("TTL reconcile on sim ZSET", async () => {
    const slot = await beginPhasedRolloutTurnV0({ traceId: "orphan-sim" });
    assert.ok(slot.leaseId);
    await new Promise((r) => setTimeout(r, 45));
    const recon = await reconcilePhasedRolloutInflightV0();
    assert.ok(recon.purged >= 1);
    const stats = await getPhasedRolloutStatsV0();
    assert.equal(stats.activeTurns, 0);
    resetCoordinationSimV0();
  });
});
