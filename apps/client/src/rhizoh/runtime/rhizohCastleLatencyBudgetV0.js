/**
 * Runtime latency budgets — STT / routing / local exec enforcement.
 */

import { logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";

export const CASTLE_LATENCY_VIOLATION_SCHEMA_V0 = "castle.latency_violation.v0";

export const CASTLE_LATENCY_BUDGET_MS_V0 = Object.freeze({
  stt: 80,
  routing: 5,
  local_exec: 10,
  hybrid_local: 15,
  language_commit: 8
});

const LOG_MAX = 32;
/** @type {Readonly<Record<string, unknown>>[]} */
let violationLog = [];

/**
 * @param {keyof typeof CASTLE_LATENCY_BUDGET_MS_V0 | string} phase
 * @param {number} elapsedMs
 * @param {string} [traceId]
 */
export function enforceLatencyBudgetV0(phase, elapsedMs, traceId = "") {
  const key = String(phase || "");
  const budget = Number(CASTLE_LATENCY_BUDGET_MS_V0[key]) || 0;
  const elapsed = Number(elapsedMs) || 0;
  if (!budget || elapsed <= budget) {
    return Object.freeze({ ok: true, phase: key, elapsedMs: elapsed, budgetMs: budget });
  }
  return reportCastleLatencyViolationV0({
    phase: key,
    elapsedMs: elapsed,
    budgetMs: budget,
    traceId
  });
}

/**
 * @param {{
 *   phase: string,
 *   elapsedMs: number,
 *   budgetMs: number,
 *   traceId?: string
 * }} row
 */
export function reportCastleLatencyViolationV0(row) {
  const entry = Object.freeze({
    schema: CASTLE_LATENCY_VIOLATION_SCHEMA_V0,
    kind: "CASTLE_LATENCY_VIOLATION",
    atMs: Date.now(),
    phase: String(row.phase || ""),
    elapsedMs: Number(row.elapsedMs) || 0,
    budgetMs: Number(row.budgetMs) || 0,
    traceId: String(row.traceId || ""),
    overByMs: Math.max(0, Number(row.elapsedMs) - Number(row.budgetMs))
  });
  violationLog = [...violationLog, entry].slice(-LOG_MAX);
  if (typeof window !== "undefined") {
    window.__CASTLE_LATENCY_VIOLATIONS__ = Object.freeze([...violationLog]);
    window.__CASTLE_LATENCY_VIOLATION_LAST__ = entry;
  }
  logVoiceWarnV0("CASTLE_LATENCY_VIOLATION", entry);
  if (typeof console !== "undefined" && console.warn) {
    console.warn("[Rhizoh CASTLE_LATENCY_VIOLATION]", entry);
  }
  return Object.freeze({ ok: false, violation: entry });
}

/**
 * @param {string} phase
 * @param {() => T} fn
 * @param {{ traceId?: string }} [opts]
 * @returns {{ result: T, elapsedMs: number, budget: ReturnType<typeof enforceLatencyBudgetV0> }}
 * @template T
 */
export function measureLatencyPhaseV0(phase, fn, opts = {}) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const result = fn();
  const elapsedMs =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  const budget = enforceLatencyBudgetV0(phase, elapsedMs, opts.traceId);
  return { result, elapsedMs, budget };
}

/**
 * @param {string} phase
 * @param {() => Promise<T>} fn
 * @param {{ traceId?: string }} [opts]
 * @template T
 */
export async function measureLatencyPhaseAsyncV0(phase, fn, opts = {}) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const result = await fn();
  const elapsedMs =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  const budget = enforceLatencyBudgetV0(phase, elapsedMs, opts.traceId);
  return { result, elapsedMs, budget };
}

export function readCastleLatencyViolationsV0() {
  return Object.freeze([...violationLog]);
}

/** @internal vitest */
export function __resetCastleLatencyBudgetForTestV0() {
  violationLog = [];
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_LATENCY_VIOLATIONS__;
      delete window.__CASTLE_LATENCY_VIOLATION_LAST__;
    } catch {
      /* noop */
    }
  }
}
