/**
 * Runtime Transaction Queue (RTQ) v0 — path toward Single Write Authority (SWAS).
 * All subsystems eventually enqueue here; temporal spine drains + policy resolves + merge commits.
 *
 * v0: FIFO drain + stub resolver. Producers (LLM, Studio, voice) attach incrementally.
 */

import { createPolicyDecisionId } from "./castleFieldTemporalLedgerV0.js";

export const CASTLE_RTQ_MAX = 256;

/** @typedef {'physics_tick'|'llm_turn'|'voice_event'|'studio_edit'|'spawn_request'|'dsl_command'|'unknown'} CastleRtqKind */

/**
 * @typedef {object} CastleRuntimeTransaction
 * @property {CastleRtqKind} kind
 * @property {string} [source]
 * @property {unknown} [payload]
 * @property {number} enqueuedAt
 * @property {string} id
 */

/** @type {CastleRuntimeTransaction[]} */
const _q = [];

/**
 * @param {{ kind: CastleRtqKind|string, source?: string, payload?: unknown }} tx
 * @returns {string} id
 */
export function enqueueCastleRuntimeTransaction(tx) {
  const id = `rtx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const entry = {
    id,
    kind: String(tx.kind || "unknown").slice(0, 32),
    source: tx.source ? String(tx.source).slice(0, 64) : "",
    payload: tx.payload,
    enqueuedAt: Date.now()
  };
  _q.push(entry);
  while (_q.length > CASTLE_RTQ_MAX) {
    _q.shift();
  }
  return id;
}

export function peekCastleRuntimeTransactionQueueDepth() {
  return _q.length;
}

/**
 * @param {number} [limit]
 * @returns {CastleRuntimeTransaction[]}
 */
export function drainCastleRuntimeTransactionQueue(limit = 16) {
  const n = Math.max(0, Math.min(Number(limit) || 16, _q.length));
  if (n === 0) return [];
  return _q.splice(0, n);
}

/**
 * Policy resolver stub — v0 FIFO, no starvation logic.
 * @param {CastleRuntimeTransaction[]} batch
 * @param {{ tickIndex?: number, tceePhase?: string }} [_ctx]
 */
export function resolveCastleRuntimeTransactionBatch(batch, _ctx = {}) {
  void _ctx;
  const b = Array.isArray(batch) ? batch : [];
  return {
    approved: b,
    suppressed: [],
    reason: "fifo_v0"
  };
}

/**
 * @param {{ approved: CastleRuntimeTransaction[], suppressed: CastleRuntimeTransaction[], reason: string }} resolved
 * @param {number} tickIndex
 */
export function buildRtqBatchLedgerEntryV0(resolved, tickIndex) {
  const t = Math.max(0, Math.floor(Number(tickIndex) || 0));
  const at = Date.now();
  const approved = Array.isArray(resolved?.approved) ? resolved.approved : [];
  const suppressed = Array.isArray(resolved?.suppressed) ? resolved.suppressed : [];
  return {
    policyDecisionId: createPolicyDecisionId(t, at),
    tickIndex: t,
    at,
    executionStatus: approved.length ? "executed" : "suppressed",
    reason: approved.length ? "rtq_batch_resolved" : "rtq_batch_empty",
    competingPolicies: ["rtq_fifo", "temporal_spine"],
    winnerPolicy: approved.length ? "rtq_fifo" : "temporal_spine",
    gapSeverity: Math.min(1, 0.04 + suppressed.length * 0.06),
    coherenceGap:
      approved.length || suppressed.length
        ? {
            kind: "rtq_batch",
            detail: `RTQ v0: approved=${approved.length} suppressed=${suppressed.length} policy=${resolved?.reason || "fifo_v0"}`,
            suppressedSnapshot: [...approved, ...suppressed].slice(0, 16).map((x) => ({
              kind: x.kind,
              source: x.source
            }))
          }
        : null,
    deferredLanes: []
  };
}

export function clearCastleRuntimeTransactionQueueForTests() {
  _q.length = 0;
}
