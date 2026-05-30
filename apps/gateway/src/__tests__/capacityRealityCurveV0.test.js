import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  runCapacityRealityCurveReportV0,
  computePhasedRolloutStabilityV0,
  computeRedisSaturationV0
} from "../ops/capacityRealityCurveV0.js";

describe("capacityRealityCurveV0", () => {
  it("produces 10k and 100k rows with verdict", () => {
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "200";
    process.env.CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS = "1";
    const r = runCapacityRealityCurveReportV0({ gatewayInstances: 2, dauList: [1000, 10_000, 100_000] });
    assert.equal(r.schema, "rhizoh.capacity_reality_curve.v0");
    assert.equal(r.byDau.length, 3);
    assert.equal(r.throughputEnvelope.clusterGap.phasedRolloutClusterWide, true);
    assert.ok(r.verdict.primaryRisk.includes("http_rate_limit"));
  });

  it("flags redis audit trim at high volume", () => {
    const redis = computeRedisSaturationV0({ dailyActivePrincipals: 50_000, turnsPerDay: 500_000 });
    assert.equal(redis.auditHistoryLoss, true);
  });

  it("10k stability depends on headroom", () => {
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "50";
    const s = computePhasedRolloutStabilityV0(10_000, { gatewayInstances: 1 });
    assert.equal(s.dau, 10_000);
    assert.ok(typeof s.requiredInFlightAtPeak === "number");
  });
});
