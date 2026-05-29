/**
 * Cost containment v0 — delegates financial truth to Global Cost Ledger (GCL).
 * Sync API preserved for tests; production turn path uses assessGlobalCostBeforeTurnV0 (async).
 */

import {
  assessGlobalCostBeforeTurnSyncV0,
  recordGlobalCostAfterTurnSyncV0,
  resetGlobalCostLedgerV0,
  getGlobalCostLedgerSnapshotV0
} from "./globalCostLedgerV0.js";

function parseIntEnv(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function readCostContainmentConfigV0() {
  return Object.freeze({
    dailyTokenBudget: parseIntEnv("CASTLE_LLM_DAILY_TOKEN_BUDGET", 200_000),
    softBudgetRatio: Math.min(1, Math.max(0.1, Number(process.env.CASTLE_LLM_SOFT_BUDGET_RATIO) || 0.85)),
    hardSpendLimitUsd: Number(process.env.CASTLE_LLM_DAILY_SPEND_LIMIT_USD) || 0,
    downgradeMode: String(process.env.CASTLE_LLM_DOWNGRADE_MODE || "FAST_DIALOGUE").toUpperCase(),
    downgradeModel: String(process.env.CASTLE_LLM_DOWNGRADE_MODEL || "").trim() || null,
    queueFallback: process.env.CASTLE_LLM_QUEUE_FALLBACK === "1"
  });
}

export function resetCostContainmentV0() {
  resetGlobalCostLedgerV0();
}

/**
 * @param {string} principal
 * @param {{ estimatedTokens?: number, generationMode?: string | null, provider?: string, model?: string }} input
 */
export function assessCostBeforeTurnV0(principal, input = {}) {
  return assessGlobalCostBeforeTurnSyncV0(principal, input);
}

/**
 * @param {string} principal
 * @param {{ tokensUsed?: number, tokensIn?: number, tokensOut?: number, source?: string }} [opts]
 */
export function recordCostAfterTurnV0(principal, opts = {}) {
  return recordGlobalCostAfterTurnSyncV0(principal, opts);
}

export async function getCostContainmentStatsV0(principal) {
  const snap = await getGlobalCostLedgerSnapshotV0(principal);
  const p = snap.principal;
  if (!p) return { day: snap.day, tokens: 0, requests: 0 };
  return { day: p.day, tokens: p.tokens, requests: p.requests, estimatedUsd: p.estimatedUsd };
}
