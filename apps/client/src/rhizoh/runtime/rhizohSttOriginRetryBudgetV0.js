/**
 * Origin quarantine STT retry budget — caps latency inflation + ghost retries.
 * One re-eval per voice session; no retry-of-retry; cooldown between attempts.
 */

export const RHIZOH_STT_ORIGIN_RETRY_BUDGET_SCHEMA_V0 =
  "castle.rhizoh.stt_origin_retry_budget.v0";

/** Hard cap — one alt STT pass per recording session. */
export const ORIGIN_RETRY_MAX_PER_SESSION_V0 = 1;

/** Min gap before another origin retry in same session (ms). */
export const ORIGIN_RETRY_COOLDOWN_MS_V0 = 6500;

/** Skip retry on very short clips — not worth double gateway cost. */
export const ORIGIN_RETRY_MIN_RECORDED_MS_V0 = 1200;

/** @type {Map<string, { count: number, lastAtMs: number }>} */
const sessionBudget = new Map();

function readEnvFlagV0(name, defaultWhenUnset) {
  if (typeof import.meta === "undefined" || !import.meta.env) return defaultWhenUnset;
  const v = String(import.meta.env[name] || "").trim().toLowerCase();
  if (!v) return defaultWhenUnset;
  if (v === "0" || v === "false" || v === "off") return false;
  return v === "1" || v === "true" || v === "on";
}

/**
 * Phase B2 — explicit opt-in for QUARANTINE → STT re-eval (default OFF).
 * Requires post-STT origin filter enabled separately.
 */
export function isVoiceOriginRetryEnabledV0() {
  return readEnvFlagV0("VITE_RHIZOH_VOICE_ORIGIN_RETRY", false);
}

/**
 * @param {string} [sessionId]
 */
export function resetOriginRetryBudgetForSessionV0(sessionId) {
  const sid = String(sessionId || "").trim();
  if (sid) sessionBudget.delete(sid);
}

/**
 * @param {{
 *   sessionId?: string,
 *   recordedMs?: number,
 *   strategy?: string,
 *   originReevalPass?: boolean
 * }} [ctx]
 */
export function peekOriginRetryBudgetV0(ctx = {}) {
  const sid = String(ctx.sessionId || "").trim();
  if (!isVoiceOriginRetryEnabledV0()) {
    return Object.freeze({ allowed: false, reason: "origin_retry_disabled" });
  }
  if (ctx.originReevalPass === true) {
    return Object.freeze({ allowed: false, reason: "origin_retry_no_chain" });
  }
  const recordedMs = Math.max(0, Number(ctx.recordedMs) || 0);
  if (recordedMs > 0 && recordedMs < ORIGIN_RETRY_MIN_RECORDED_MS_V0) {
    return Object.freeze({ allowed: false, reason: "origin_retry_clip_too_short" });
  }
  const strategy = String(ctx.strategy || "");
  if (strategy === "origin_reeval_direct") {
    return Object.freeze({ allowed: false, reason: "origin_retry_already_reeval" });
  }
  if (!sid) {
    return Object.freeze({ allowed: true, reason: "origin_retry_ok_anonymous" });
  }
  const row = sessionBudget.get(sid);
  if (!row) {
    return Object.freeze({ allowed: true, reason: "origin_retry_ok", remaining: ORIGIN_RETRY_MAX_PER_SESSION_V0 });
  }
  if (row.count >= ORIGIN_RETRY_MAX_PER_SESSION_V0) {
    return Object.freeze({ allowed: false, reason: "origin_retry_budget_exhausted", count: row.count });
  }
  const ageMs = Date.now() - row.lastAtMs;
  if (ageMs < ORIGIN_RETRY_COOLDOWN_MS_V0) {
    return Object.freeze({
      allowed: false,
      reason: "origin_retry_cooldown",
      ageMs,
      cooldownMs: ORIGIN_RETRY_COOLDOWN_MS_V0
    });
  }
  return Object.freeze({
    allowed: true,
    reason: "origin_retry_ok",
    remaining: Math.max(0, ORIGIN_RETRY_MAX_PER_SESSION_V0 - row.count)
  });
}

/**
 * @param {string} [sessionId]
 */
export function noteOriginRetryConsumedV0(sessionId) {
  const sid = String(sessionId || "").trim();
  if (!sid) return;
  const row = sessionBudget.get(sid) || { count: 0, lastAtMs: 0 };
  sessionBudget.set(sid, {
    count: row.count + 1,
    lastAtMs: Date.now()
  });
}

export function __resetOriginRetryBudgetForTestV0() {
  sessionBudget.clear();
}
