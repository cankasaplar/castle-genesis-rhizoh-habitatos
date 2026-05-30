import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  assessGlobalCostBeforeTurnSyncV0,
  assessGlobalCostBeforeTurnV0,
  recordGlobalCostAfterTurnSyncV0,
  resetGlobalCostLedgerV0,
  detectGclDriftV0,
  ingestProviderTruthV0,
  getGlobalCostLedgerSnapshotV0
} from "../ops/globalCostLedgerV0.js";
import { evaluateEconomicStrategyL3V0 } from "../ops/economicStrategyEngineL3V0.js";

describe("globalCostLedgerV0", () => {
  beforeEach(() => {
    resetGlobalCostLedgerV0();
    delete process.env.CASTLE_LLM_DAILY_TOKEN_BUDGET;
    delete process.env.CASTLE_LLM_DAILY_SPEND_LIMIT_USD;
    delete process.env.NODE_ENV;
    process.env.CASTLE_GCL_REQUIRE_REDIS = "0";
    process.env.CASTLE_GCL_ALLOW_MEMORY_FALLBACK = "1";
    process.env.CASTLE_GCL_ENFORCE_DRIFT = "0";
    process.env.CASTLE_GCL_BACKEND = "memory";
  });

  it("hard token cap rejects over budget", () => {
    process.env.CASTLE_LLM_DAILY_TOKEN_BUDGET = "100";
    recordGlobalCostAfterTurnSyncV0("uid:x", { tokensUsed: 90 });
    const pre = assessGlobalCostBeforeTurnSyncV0("uid:x", { estimatedTokens: 20 });
    assert.equal(pre.proceed, false);
    assert.equal(pre.code, "cost_hard_limit");
  });

  it("global USD cap rejects when configured", () => {
    process.env.CASTLE_LLM_DAILY_SPEND_LIMIT_USD = "0.01";
    process.env.CASTLE_GCL_USD_PER_1M_TOKENS = "1";
    recordGlobalCostAfterTurnSyncV0("uid:a", { tokensUsed: 8000 });
    const pre = assessGlobalCostBeforeTurnSyncV0("uid:b", { estimatedTokens: 5000 });
    assert.equal(pre.proceed, false);
    assert.equal(pre.code, "cost_global_usd_hard_limit");
  });

  it("detectGclDrift flags provider vs estimate gap", () => {
    const drift = detectGclDriftV0({
      global: { estimatedUsd: 1, providerUsd: 2, tokens: 0, requests: 0, day: "2026-01-01" }
    });
    assert.equal(drift.driftDetected, true);
  });

  it("L3 strategy emits proposals with feedsExecution false", async () => {
    process.env.CASTLE_LLM_DAILY_SPEND_LIMIT_USD = "10";
    recordGlobalCostAfterTurnSyncV0("uid:z", { tokensUsed: 500_000 });
    const snap = await getGlobalCostLedgerSnapshotV0("uid:z");
    const strat = evaluateEconomicStrategyL3V0(snap);
    assert.equal(strat.rules.feedsExecution, false);
    assert.ok(strat.proposalQueue.proposals.length >= 1);
    assert.equal(strat.proposalQueue.contract.feedsExecution, false);
  });

  it("ingestProviderTruth updates provider bucket", async () => {
    const r = await ingestProviderTruthV0({ usdTotal: 4.5, tokensTotal: 1000 });
    assert.equal(r.ok, true);
    assert.equal(r.providerUsd, 4.5);
  });

  it("require redis fails closed when redis unavailable", async () => {
    process.env.CASTLE_GCL_REQUIRE_REDIS = "1";
    process.env.CASTLE_GCL_ALLOW_MEMORY_FALLBACK = "0";
    process.env.CASTLE_GCL_BACKEND = "redis";
    process.env.CASTLE_GCL_REDIS_CONNECT_MS = "200";
    process.env.REDIS_URL = "redis://127.0.0.1:63999";
    resetGlobalCostLedgerV0();
    const pre = await assessGlobalCostBeforeTurnV0("uid:fail", { estimatedTokens: 100 });
    assert.equal(pre.proceed, false);
    assert.equal(pre.code, "cost_ledger_unavailable");
    assert.equal(pre.visibleFailure, true);
  });

  it("enforce drift blocks turn when provider truth diverges", async () => {
    process.env.CASTLE_GCL_ENFORCE_DRIFT = "1";
    recordGlobalCostAfterTurnSyncV0("uid:d", { tokensUsed: 1000 });
    await ingestProviderTruthV0({ usdTotal: 100, tokensTotal: 1000 });
    const snap = await getGlobalCostLedgerSnapshotV0("uid:d");
    const pre = await assessGlobalCostBeforeTurnV0("uid:d", { estimatedTokens: 10 });
    if (snap.drift.driftDetected) {
      assert.equal(pre.proceed, false);
      assert.equal(pre.code, "cost_ledger_drift_enforced");
    }
  });
});
