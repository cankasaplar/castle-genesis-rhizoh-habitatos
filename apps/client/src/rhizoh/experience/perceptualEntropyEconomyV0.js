/**
 * CORE-ELIGIBLE — Perceptual entropy economy (v0).
 *
 * Inevitable layer on drift calibration:
 * - budget recharge (time-based, bound to self signature)
 * - fatigue model (session action load → higher cost)
 * - attention decay (effective drift fades with fatigue + idle)
 *
 * Observation / projection only — no execution authority.
 */

import { PERCEPTUAL_ENTROPY_BUDGET_V0 } from "./worldDriftCalibrationV0.js";

export const PERCEPTUAL_ENTROPY_ECONOMY_SCHEMA_V0 = "castle.rhizoh.perceptual_entropy_economy.v0";

/** Entropy units recharged per hour of absence. */
export const ENTROPY_RECHARGE_PER_HOUR_V0 = 0.18;

/** Session fatigue increment per mutation action. */
export const FATIGUE_INCREMENT_V0 = 0.12;

/** Max fatigue multiplier on action cost. */
export const FATIGUE_COST_MULTIPLIER_CAP_V0 = 0.55;

/** Attention half-life after action burst (ms). */
export const ATTENTION_DECAY_HALF_LIFE_MS_V0 = 8 * 60 * 1000;

const ECONOMY_STORAGE_KEY_V0 = "rhizoh.entropy.economy.v0";
const SESSION_FATIGUE_KEY_V0 = "rhizoh.entropy.session_fatigue.v0";

const BASE_COST_V0 = Object.freeze({
  observe: 0.22,
  enter_castle: 0.28
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function nowMs() {
  return Date.now();
}

function economyKeyV0(selfSignature) {
  return `${ECONOMY_STORAGE_KEY_V0}:${String(selfSignature || "anon")}`;
}

function sessionFatigueKeyV0(sessionIdentity) {
  return `${SESSION_FATIGUE_KEY_V0}:${String(sessionIdentity || "session")}`;
}

/**
 * @param {unknown} raw
 */
function parseEconomyRecordV0(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (o.schema !== PERCEPTUAL_ENTROPY_ECONOMY_SCHEMA_V0) return null;
  return {
    schema: PERCEPTUAL_ENTROPY_ECONOMY_SCHEMA_V0,
    spent: clamp01(o.spent),
    lastUpdatedAtMs: Number(o.lastUpdatedAtMs) || 0,
    actionCount: Math.max(0, Number(o.actionCount) || 0),
    lastActionAtMs: Number(o.lastActionAtMs) || 0
  };
}

function readRawEconomyV0(selfSignature) {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(economyKeyV0(selfSignature));
    if (!raw) return null;
    return parseEconomyRecordV0(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeEconomyV0(selfSignature, record) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(economyKeyV0(selfSignature), JSON.stringify(record));
  } catch {
    /* quota */
  }
}

function readSessionFatigueV0(sessionIdentity) {
  if (typeof sessionStorage === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(sessionFatigueKeyV0(sessionIdentity));
    return raw ? clamp01(Number(JSON.parse(raw)?.fatigue)) : 0;
  } catch {
    return 0;
  }
}

function writeSessionFatigueV0(sessionIdentity, fatigue) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      sessionFatigueKeyV0(sessionIdentity),
      JSON.stringify({ schema: PERCEPTUAL_ENTROPY_ECONOMY_SCHEMA_V0, fatigue: clamp01(fatigue) })
    );
  } catch {
    /* noop */
  }
}

/**
 * Apply time-based recharge to spent entropy.
 * @param {{ spent: number, lastUpdatedAtMs: number }} record
 */
export function applyEntropyRechargeV0(record) {
  const budget = PERCEPTUAL_ENTROPY_BUDGET_V0;
  const t = nowMs();
  const elapsedMs = Math.max(0, t - (record.lastUpdatedAtMs || t));
  const hours = elapsedMs / (60 * 60 * 1000);
  const recharged = hours * ENTROPY_RECHARGE_PER_HOUR_V0;
  const spent = clamp01(Math.max(0, record.spent - recharged));
  return Object.freeze({
    spent,
    remaining: clamp01(budget - spent),
    budget,
    rechargedAmount: clamp01(recharged)
  });
}

/**
 * Attention decay 0–1 — lower = weaker felt drift effectiveness.
 *
 * @param {{ actionCount: number, lastActionAtMs: number }} record
 * @param {number} sessionFatigue
 */
export function computeAttentionDecayV0(record, sessionFatigue) {
  const t = nowMs();
  const idleMs = record.lastActionAtMs > 0 ? Math.max(0, t - record.lastActionAtMs) : Infinity;
  const idleFactor =
    idleMs === Infinity ? 1 : Math.pow(0.5, idleMs / ATTENTION_DECAY_HALF_LIFE_MS_V0);
  const burstPenalty = clamp01(1 - record.actionCount * 0.06);
  const fatiguePenalty = clamp01(1 - sessionFatigue * 0.35);
  return clamp01(idleFactor * burstPenalty * fatiguePenalty);
}

/**
 * @param {string} action
 * @param {number} sessionFatigue
 */
export function computeFatigueAdjustedCostV0(action, sessionFatigue) {
  const base = BASE_COST_V0[action] ?? 0.25;
  const mult = 1 + Math.min(FATIGUE_COST_MULTIPLIER_CAP_V0, sessionFatigue * 0.4);
  return clamp01(base * mult);
}

/**
 * @param {{
 *   selfSignature: string,
 *   sessionIdentity: string
 * }} io
 */
export function readEntropyEconomyStateV0(io) {
  const budget = PERCEPTUAL_ENTROPY_BUDGET_V0;
  const raw =
    readRawEconomyV0(io.selfSignature) ||
    ({
      schema: PERCEPTUAL_ENTROPY_ECONOMY_SCHEMA_V0,
      spent: 0,
      lastUpdatedAtMs: nowMs(),
      actionCount: 0,
      lastActionAtMs: 0
    });

  const recharged = applyEntropyRechargeV0(raw);
  const sessionFatigue = readSessionFatigueV0(io.sessionIdentity);
  const attention01 = computeAttentionDecayV0(raw, sessionFatigue);

  return Object.freeze({
    schema: PERCEPTUAL_ENTROPY_ECONOMY_SCHEMA_V0,
    spent: recharged.spent,
    remaining: recharged.remaining,
    budget: recharged.budget,
    rechargedAmount: recharged.rechargedAmount,
    sessionFatigue,
    attention01,
    actionCount: raw.actionCount,
    fatigueTier:
      sessionFatigue > 0.65 ? "heavy" : sessionFatigue > 0.35 ? "moderate" : "light"
  });
}

/**
 * Attempt spend + update fatigue. Returns whether action is allowed.
 *
 * @param {{
 *   selfSignature: string,
 *   sessionIdentity: string,
 *   action: string
 * }} io
 */
export function spendEntropyWithEconomyV0(io) {
  const state = readEntropyEconomyStateV0(io);
  const cost = computeFatigueAdjustedCostV0(io.action, state.sessionFatigue);
  const allowed = state.remaining >= cost - 1e-6;

  if (!allowed) {
    return Object.freeze({
      allowed: false,
      cost,
      attention01: state.attention01,
      state,
      feedbackLine: describeEntropyEconomyFeedbackV0({ ...state, blocked: true })
    });
  }

  const raw = readRawEconomyV0(io.selfSignature) || {
    schema: PERCEPTUAL_ENTROPY_ECONOMY_SCHEMA_V0,
    spent: 0,
    lastUpdatedAtMs: nowMs(),
    actionCount: 0,
    lastActionAtMs: 0
  };
  const recharged = applyEntropyRechargeV0(raw);
  const nextSpent = clamp01(recharged.spent + cost);
  const nextFatigue = clamp01(readSessionFatigueV0(io.sessionIdentity) + FATIGUE_INCREMENT_V0);

  writeEconomyV0(io.selfSignature, {
    schema: PERCEPTUAL_ENTROPY_ECONOMY_SCHEMA_V0,
    spent: nextSpent,
    lastUpdatedAtMs: nowMs(),
    actionCount: raw.actionCount + 1,
    lastActionAtMs: nowMs()
  });
  writeSessionFatigueV0(io.sessionIdentity, nextFatigue);

  const nextState = readEntropyEconomyStateV0(io);
  return Object.freeze({
    allowed: true,
    cost,
    attention01: nextState.attention01,
    state: nextState,
    feedbackLine: null
  });
}

/**
 * Scale proposed drift deltas by attention decay.
 *
 * @param {{
 *   prev: { observationImprint: number, castleAffinity: number, atmosphereShift: number },
 *   proposed: { observationImprint: number, castleAffinity: number, atmosphereShift: number },
 *   attention01: number
 * }} io
 */
export function applyAttentionDecayToMutationV0(io) {
  const a = clamp01(io.attention01);
  if (a >= 0.99) return io.proposed;
  return Object.freeze({
    ...io.proposed,
    observationImprint: clamp01(
      io.prev.observationImprint + (io.proposed.observationImprint - io.prev.observationImprint) * a
    ),
    castleAffinity: clamp01(
      io.prev.castleAffinity + (io.proposed.castleAffinity - io.prev.castleAffinity) * a
    ),
    atmosphereShift: clamp01(
      io.prev.atmosphereShift + (io.proposed.atmosphereShift - io.prev.atmosphereShift) * a
    )
  });
}

/**
 * @param {{ remaining: number, fatigueTier?: string, blocked?: boolean, rechargedAmount?: number }} state
 */
export function describeEntropyEconomyFeedbackV0(state) {
  if (state.blocked) {
    return "Dikkat ve entropy tükendi — dinlen, bütçe zamanla dolacak.";
  }
  if (state.fatigueTier === "heavy") {
    return "Yorgunluk hissediliyor — değişimler daha yumuşak.";
  }
  if ((state.rechargedAmount ?? 0) > 0.05) {
    return "Entropy yenilendi — dünyaya tekrar hafifçe dokunabilirsin.";
  }
  return null;
}

export function clearEntropyEconomyForTestV0(selfSignature, sessionIdentity) {
  if (typeof localStorage !== "undefined" && selfSignature) {
    try {
      localStorage.removeItem(economyKeyV0(selfSignature));
    } catch {
      /* noop */
    }
  }
  if (typeof sessionStorage !== "undefined" && sessionIdentity) {
    try {
      sessionStorage.removeItem(sessionFatigueKeyV0(sessionIdentity));
    } catch {
      /* noop */
    }
  }
  if (typeof localStorage !== "undefined" && !selfSignature) {
    try {
      for (let i = localStorage.length - 1; i >= 0; i -= 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith(ECONOMY_STORAGE_KEY_V0)) localStorage.removeItem(k);
      }
    } catch {
      /* noop */
    }
  }
}
