import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  verifyLoadTestReadinessV0,
  runLoadScenarioV0,
  simulateHarnessTurnV0,
  LOAD_TEST_SCENARIO_V0
} from "../ops/loadTestHarnessV0.js";
import { createLoadTestMetricsV0, finalizeLoadTestMetricsV0 } from "../ops/loadTestMetricsV0.js";
import { resetGlobalCostLedgerV0 } from "../ops/globalCostLedgerV0.js";
import { resetPhasedRolloutClusterV0 } from "../ops/phasedRolloutClusterV0.js";

describe("loadTestHarnessV0", () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
    process.env.CASTLE_GCL_REQUIRE_REDIS = "0";
    process.env.CASTLE_GCL_ALLOW_MEMORY_FALLBACK = "1";
    process.env.CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS = "0";
    process.env.CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK = "1";
    process.env.CASTLE_PHASED_ROLLOUT_TIER = "200";
    process.env.CASTLE_LOAD_TEST_REDIS_LATENCY_MS = "0";
    process.env.CASTLE_LOAD_TEST_PROVIDER_429_RATE = "0";
    resetGlobalCostLedgerV0();
    resetPhasedRolloutClusterV0();
  });

  it("readiness reports checklist items", async () => {
    const r = await verifyLoadTestReadinessV0();
    assert.equal(r.schema, "rhizoh.load_test.harness.v0");
    assert.ok(r.items.length >= 4);
  });

  it("baseline scenario completes turns in memory mode", async () => {
    const r = await runLoadScenarioV0(LOAD_TEST_SCENARIO_V0.BASELINE, {
      users: 20,
      concurrency: 4
    });
    assert.equal(r.scenarioId, LOAD_TEST_SCENARIO_V0.BASELINE);
    assert.ok(r.result.metrics.turnsAttempted >= 20);
    assert.ok(r.result.metrics.successRate > 0.5);
  });

  it("records KPI fields on simulated turn", async () => {
    const m = createLoadTestMetricsV0();
    const t = await simulateHarnessTurnV0("x1", m, { simulatedLatencyMs: 50 });
    assert.equal(t.ok, true);
    const fin = finalizeLoadTestMetricsV0(m);
    assert.ok(fin.latencyP50Ms >= 0);
    assert.ok(typeof fin.capacityViolationsPerMin === "number");
  });
});
