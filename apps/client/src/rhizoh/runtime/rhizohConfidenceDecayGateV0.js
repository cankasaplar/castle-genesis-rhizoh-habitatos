/**
 * Confidence decay gate — repetition + local fail + latency → LLM escalation.
 * LLM = exception handler, not default brain.
 */

/** Shared with rhizohIntentRouterV0 — kept here to avoid import cycles. */
export const LLM_FALLBACK_CONFIDENCE_MIN_V0 = 0.72;

export const RHIZOH_CONFIDENCE_DECAY_GATE_SCHEMA_V0 = "castle.rhizoh.confidence_decay_gate.v0";

const STATE_KEY_V0 = "rhizoh.confidence_decay_state.v0";
const REPEAT_ESCALATE_COUNT_V0 = 3;
const LOCAL_FAIL_ESCALATE_STREAK_V0 = 2;
const LATENCY_PRESSURE_MS_V0 = 120;

/**
 * @readonly
 */
export const USER_REACTION_V0 = Object.freeze({
  NONE: "none",
  CONTINUE: "continue",
  STOP: "stop",
  OVERRIDE: "override"
});

function readState() {
  if (typeof window === "undefined") {
    return { lastNormalized: "", repeatCount: 0, localFailStreak: 0, lastReflexAtMs: 0 };
  }
  try {
    const raw = window.sessionStorage.getItem(STATE_KEY_V0);
    if (!raw) return { lastNormalized: "", repeatCount: 0, localFailStreak: 0, lastReflexAtMs: 0 };
    const s = JSON.parse(raw);
    return {
      lastNormalized: String(s.lastNormalized || ""),
      repeatCount: Number(s.repeatCount) || 0,
      localFailStreak: Number(s.localFailStreak) || 0,
      lastReflexAtMs: Number(s.lastReflexAtMs) || 0
    };
  } catch {
    return { lastNormalized: "", repeatCount: 0, localFailStreak: 0, lastReflexAtMs: 0 };
  }
}

function writeState(s) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STATE_KEY_V0, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

/**
 * @param {string} nextUserMessage
 * @param {string} [lastNormalized]
 */
export function inferUserReactionV0(nextUserMessage, lastNormalized = "") {
  const n = String(nextUserMessage || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!n) return USER_REACTION_V0.NONE;
  if (/^(dur|stop|hayir|hayır|yeter|cancel|iptal)\b/.test(n)) return USER_REACTION_V0.STOP;
  const prev = String(lastNormalized || "").trim();
  if (prev && n === prev) return USER_REACTION_V0.OVERRIDE;
  if (prev && n.includes(prev) && n.length > prev.length + 4) return USER_REACTION_V0.CONTINUE;
  if (prev && prev !== n) return USER_REACTION_V0.CONTINUE;
  return USER_REACTION_V0.NONE;
}

/**
 * @param {string} reaction
 * @param {number} latencyMs
 */
export function computeEffectivenessScoreV0(reaction, latencyMs) {
  let score = 0.8;
  if (reaction === USER_REACTION_V0.CONTINUE) score = 0.88;
  if (reaction === USER_REACTION_V0.STOP) score = 0.35;
  if (reaction === USER_REACTION_V0.OVERRIDE) score = 0.42;
  if (latencyMs > LATENCY_PRESSURE_MS_V0) score -= 0.08;
  if (latencyMs <= 5) score += 0.04;
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

/**
 * Call when user sends a new utterance — updates prior reflex log effectiveness.
 * @param {string} nextUserMessage
 */
export function applyReflexEffectivenessFeedbackV0(nextUserMessage) {
  const state = readState();
  const prevNorm = state.lastNormalized;
  const reaction = inferUserReactionV0(nextUserMessage, prevNorm);
  const normalized = String(nextUserMessage || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (normalized) {
    if (normalized === state.lastNormalized) state.repeatCount += 1;
    else {
      state.lastNormalized = normalized;
      state.repeatCount = 1;
    }
    writeState(state);
  }
  if (typeof window === "undefined") return reaction;
  try {
    const last = window.__CASTLE_RHIZOH_REFLEX_TURN_LOG__;
    if (last && typeof last === "object") {
      const updated = {
        ...last,
        userReaction: reaction,
        successScore: computeEffectivenessScoreV0(reaction, Number(last.latencyMs) || 0),
        effectivenessAtMs: Date.now()
      };
      window.__CASTLE_RHIZOH_REFLEX_TURN_LOG__ = Object.freeze(updated);
      const key = "rhizoh.reflex_turn_log.v0";
      const arr = JSON.parse(window.localStorage.getItem(key) || "[]");
      if (Array.isArray(arr) && arr.length) {
        arr[arr.length - 1] = updated;
        window.localStorage.setItem(key, JSON.stringify(arr));
      }
    }
  } catch {
    /* noop */
  }
  return reaction;
}

/**
 * @param {boolean} failed
 */
export function noteLocalReflexFailureV0(failed = true) {
  const state = readState();
  if (failed) state.localFailStreak += 1;
  else state.localFailStreak = 0;
  writeState(state);
}

/**
 * @param {{
 *   normalized: string,
 *   basePlan: { confidence: number, useLlm: boolean, useLocal: boolean, routeClass: string, reason?: string },
 *   localFailed?: boolean,
 *   reflexLatencyMs?: number
 * }} input
 */
export function applyConfidenceDecayGateV0(input) {
  const normalized = String(input.normalized || "").trim();
  const base = input.basePlan || {};
  const state = readState();

  if (normalized === state.lastNormalized) {
    state.repeatCount += 1;
  } else {
    state.lastNormalized = normalized;
    state.repeatCount = 1;
  }

  if (input.localFailed) {
    state.localFailStreak += 1;
  } else if (input.reflexLatencyMs != null && input.reflexLatencyMs >= 0) {
    state.lastReflexAtMs = Date.now();
    if (!input.localFailed) state.localFailStreak = Math.max(0, state.localFailStreak - 1);
  }

  let confidence = Number(base.confidence) || 0.5;
  /** @type {string[]} */
  const decayReasons = [];

  if (state.repeatCount >= REPEAT_ESCALATE_COUNT_V0) {
    confidence -= 0.12 * (state.repeatCount - REPEAT_ESCALATE_COUNT_V0 + 1);
    decayReasons.push("repetition_decay");
  }

  if (state.localFailStreak >= LOCAL_FAIL_ESCALATE_STREAK_V0) {
    confidence -= 0.18;
    decayReasons.push("local_fail_streak");
  }

  const lat = Number(input.reflexLatencyMs) || 0;
  if (lat > LATENCY_PRESSURE_MS_V0 && state.repeatCount >= 2) {
    confidence -= 0.08;
    decayReasons.push("latency_pressure");
  }

  confidence = Math.max(0.05, Math.min(0.99, confidence));

  const repetitionEscalate =
    state.repeatCount >= REPEAT_ESCALATE_COUNT_V0 && base.useLlm !== true;
  const localFailEscalate = state.localFailStreak >= LOCAL_FAIL_ESCALATE_STREAK_V0;
  const confidenceEscalate = confidence < LLM_FALLBACK_CONFIDENCE_MIN_V0;
  const latencyEscalate =
    decayReasons.includes("latency_pressure") && state.repeatCount >= 2;

  const escalate =
    repetitionEscalate || localFailEscalate || confidenceEscalate || latencyEscalate;

  const useLlm = escalate || base.useLlm === true;
  const useLocal = !useLlm && base.useLocal !== false;

  writeState(state);

  return Object.freeze({
    schema: RHIZOH_CONFIDENCE_DECAY_GATE_SCHEMA_V0,
    ...base,
    confidence,
    useLlm,
    useLocal,
    escalateToLlm: escalate,
    reason: decayReasons.length ? `${base.reason || "router"}:${decayReasons.join("+")}` : base.reason,
    decay: Object.freeze({
      repeatCount: state.repeatCount,
      localFailStreak: state.localFailStreak,
      reasons: Object.freeze([...decayReasons])
    })
  });
}

/** Unified stability trace — read-only snapshot (no mutation). */
export function snapshotConfidenceDecayStateV0() {
  const s = readState();
  return Object.freeze({
    schema: RHIZOH_CONFIDENCE_DECAY_GATE_SCHEMA_V0,
    lastNormalized: s.lastNormalized,
    repeatCount: s.repeatCount,
    localFailStreak: s.localFailStreak,
    lastReflexAtMs: s.lastReflexAtMs
  });
}

/** @internal test */
export function clearConfidenceDecayStateForTestV0() {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STATE_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
