import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  withRolloutTurnLifecycleV0,
  runRolloutLifecycleReconcileV0
} from "../ops/rolloutLifecycleInvariantV0.js";
import {
  resetPhasedRolloutClusterV0,
  getPhasedRolloutStatsV0
} from "../ops/phasedRolloutClusterV0.js";

describe("rolloutLifecycleInvariantV0", () => {
  beforeEach(() => {
    resetPhasedRolloutClusterV0();
    process.env.CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS = "0";
    process.env.CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK = "1";
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "test2";
    process.env.CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS = "30";
  });

  it("withRolloutTurnLifecycleV0 always releases lease", async () => {
    const out = await withRolloutTurnLifecycleV0({ traceId: "t1" }, async () => "ok");
    assert.equal(out.ok, true);
    assert.equal(out.value, "ok");
    const stats = await getPhasedRolloutStatsV0();
    assert.equal(stats.activeTurns, 0);
  });

  it("reconcile recovers deliberate orphan", async () => {
    process.env.CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS = "25";
    const { beginPhasedRolloutTurnV0 } = await import("../ops/phasedRolloutClusterV0.js");
    const slot = await beginPhasedRolloutTurnV0({ traceId: "orphan" });
    assert.ok(slot.leaseId);
    await new Promise((r) => setTimeout(r, 40));
    const recon = await runRolloutLifecycleReconcileV0();
    assert.ok(recon.purged >= 1);
    const stats = await getPhasedRolloutStatsV0();
    assert.equal(stats.activeTurns, 0);
  });
});
