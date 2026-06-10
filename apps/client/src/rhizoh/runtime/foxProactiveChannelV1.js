/**
 * FOX_PROACTIVE_CHANNEL_V1 — Phase E
 * Queue-based controlled proactive speech with budget + Ghost pre-behavior.
 *
 * Flow: initiative queue → budget gate → Ghost pause → live presence speak
 * Proactive konuşma, davranış hissi oluşmadan açılmaz (Ghost pause zorunlu).
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  peekTopFoxInitiativeV1,
  consumeFoxInitiativeV1,
  getFoxInitiativeQueueV1
} from "./foxBehaviorGateV1.js";
import { readGhostPresentationUiHintsV1 } from "./ghostStateEngineV1.js";
import { emitLivePresenceV0 } from "./rhizohLiveLayerV0.js";
import { PRESENCE_EVENT_KIND_V0 } from "./rhizohPresenceSignatureV0.js";
import { getPersonaSchedulerSnapshotV0 } from "./rhizohPersonaLoopSchedulerV0.js";
import { getFoxProactiveCalibrationV1 } from "./foxProactiveAdaptationV1.js";
import {
  resolveFoxProactiveHardCapPerHourV1,
  resolveFoxProactiveEffectiveCooldownMinutesV1
} from "./foxProactiveDeploymentGateV1.js";
import { resolveFoxProactiveUtteranceV1 } from "./foxProactiveUtteranceLlmV1.js";
import { buildFoxProactiveUtteranceV1 } from "./foxProactiveTemplatesV1.js";

export const FOX_PROACTIVE_CHANNEL_SCHEMA_V1 = "castle.rhizoh.fox_proactive_channel.v1";
export const FOX_PROACTIVE_BUDGET_SCHEMA_V1 = "castle.rhizoh.fox_proactive_budget.v1";
export const RHIZOH_FOX_PROACTIVE_EVENT_V1 = "rhizoh:fox-proactive-v1";

/** @type {Readonly<{ maxInitiationsPerHour: number, cooldownMinutes: number, dailyLimit: number }>} */
export const FOX_PROACTIVE_BUDGET_DEFAULT_V1 = Object.freeze({
  maxInitiationsPerHour: 2,
  cooldownMinutes: 20,
  dailyLimit: 10
});

const MS_HOUR_V1 = 60 * 60 * 1000;
const MS_DAY_V1 = 24 * MS_HOUR_V1;
const MIN_INITIATIVE_SIGNIFICANCE_V1 = 0.72;
const USER_ACTIVITY_GUARD_MS_V1 = 2 * 60 * 1000;

function resolveEffectiveProactivePolicyV1(ctx = {}) {
  const calibration = getFoxProactiveCalibrationV1();
  const base = FOX_PROACTIVE_BUDGET_DEFAULT_V1;
  return Object.freeze({
    significanceThreshold: ctx.minSignificance ?? calibration.significanceThreshold ?? MIN_INITIATIVE_SIGNIFICANCE_V1,
    budget: Object.freeze({
      maxInitiationsPerHour: calibration.maxInitiationsPerHour ?? base.maxInitiationsPerHour,
      cooldownMinutes: calibration.cooldownMinutes ?? base.cooldownMinutes,
      dailyLimit: calibration.dailyLimit ?? base.dailyLimit
    }),
    calibration
  });
}

/** @type {Array<{ atMs: number, initiativeId: string, source: string }>} */
let _initiationLog = [];
/** @type {number} */
let _lastInitiationAtMs = 0;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function isProactiveChannelEnabledV1() {
  const raw = String(import.meta.env?.VITE_FOX_PROACTIVE_CHANNEL ?? "1")
    .trim()
    .toLowerCase();
  return raw !== "0" && raw !== "false" && raw !== "off";
}

/**
 * @param {number} [atMs]
 * @param {{ maxInitiationsPerHour?: number, cooldownMinutes?: number, dailyLimit?: number }} [budget]
 */
export function getFoxProactiveBudgetSnapshotV1(atMs = Date.now(), budget = null) {
  const calibration = budget || getFoxProactiveCalibrationV1();
  const effective = Object.freeze({
    maxInitiationsPerHour: resolveFoxProactiveHardCapPerHourV1(calibration.maxInitiationsPerHour),
    cooldownMinutes: resolveFoxProactiveEffectiveCooldownMinutesV1(calibration.cooldownMinutes),
    dailyLimit: calibration.dailyLimit,
    significanceThreshold: calibration.significanceThreshold,
    proactiveTolerance: calibration.proactiveTolerance
  });
  const now = Number(atMs) || Date.now();
  const hourAgo = now - MS_HOUR_V1;
  const dayAgo = now - MS_DAY_V1;
  const hourCount = _initiationLog.filter((r) => r.atMs >= hourAgo).length;
  const dayCount = _initiationLog.filter((r) => r.atMs >= dayAgo).length;
  const cooldownMs = Math.max(1, Number(effective.cooldownMinutes) || 20) * 60 * 1000;
  const sinceLastMs = _lastInitiationAtMs ? now - _lastInitiationAtMs : cooldownMs;

  return Object.freeze({
    schema: FOX_PROACTIVE_BUDGET_SCHEMA_V1,
    maxInitiationsPerHour: Number(effective.maxInitiationsPerHour) || 2,
    cooldownMinutes: Number(effective.cooldownMinutes) || 20,
    dailyLimit: Number(effective.dailyLimit) || 10,
    hourCount,
    dayCount,
    sinceLastMs,
    cooldownRemainingMs: Math.max(0, cooldownMs - sinceLastMs),
    lastInitiationAtMs: _lastInitiationAtMs || null
  });
}

/**
 * @param {number} [atMs]
 * @param {{ userRecentlyActive?: boolean, userFocused?: boolean, significance?: number }} [ctx]
 */
export function canFoxProactiveInitiateV1(atMs = Date.now(), ctx = {}) {
  if (!isProactiveChannelEnabledV1()) {
    return Object.freeze({ allowed: false, reason: "channel_disabled", budget: null });
  }

  const budget = getFoxProactiveBudgetSnapshotV1(atMs);
  if (budget.hourCount >= budget.maxInitiationsPerHour) {
    return Object.freeze({ allowed: false, reason: "hourly_limit", budget });
  }
  if (budget.dayCount >= budget.dailyLimit) {
    return Object.freeze({ allowed: false, reason: "daily_limit", budget });
  }
  if (budget.cooldownRemainingMs > 0) {
    return Object.freeze({ allowed: false, reason: "cooldown", budget });
  }

  const sig = clamp01(ctx.significance);
  const recentUser =
    ctx.userRecentlyActive === true ||
    Date.now() - getPersonaSchedulerSnapshotV0().lastUserActivityMs < USER_ACTIVITY_GUARD_MS_V1;
  if (recentUser && ctx.userFocused === true && sig < 0.85) {
    return Object.freeze({ allowed: false, reason: "user_active_guard", budget });
  }

  if (!peekTopFoxInitiativeV1(getFoxProactiveCalibrationV1().significanceThreshold)) {
    return Object.freeze({ allowed: false, reason: "queue_empty", budget });
  }

  return Object.freeze({ allowed: true, reason: "budget_ok", budget });
}

export { buildFoxProactiveUtteranceV1 } from "./foxProactiveTemplatesV1.js";

/**
 * @param {{ initiativeId: string, source: string, atMs?: number }} entry
 */
export function recordFoxProactiveInitiationV1(entry) {
  const atMs = Number(entry.atMs) || Date.now();
  _initiationLog = [
    ..._initiationLog,
    Object.freeze({
      atMs,
      initiativeId: String(entry.initiativeId || ""),
      source: String(entry.source || "world")
    })
  ].slice(-48);
  _lastInitiationAtMs = atMs;
}

/**
 * @param {{
 *   traceId?: string | null,
 *   atMs?: number,
 *   userFocused?: boolean,
 *   dryRun?: boolean,
 *   minSignificance?: number
 * }} [ctx]
 */
export function runFoxProactiveChannelTickV1(ctx = {}) {
  const atMs = Number(ctx.atMs) || Date.now();
  const traceId = ctx.traceId || `fox_proactive_${atMs}`;
  const policy = resolveEffectiveProactivePolicyV1(ctx);
  const minSig = policy.significanceThreshold;
  const initiative = peekTopFoxInitiativeV1(minSig);

  const gate = canFoxProactiveInitiateV1(atMs, {
    userFocused: ctx.userFocused === true,
    userRecentlyActive:
      atMs - getPersonaSchedulerSnapshotV0().lastUserActivityMs < USER_ACTIVITY_GUARD_MS_V1,
    significance: initiative?.significance
  });

  if (!gate.allowed || !initiative) {
    const skipped = Object.freeze({
      schema: FOX_PROACTIVE_CHANNEL_SCHEMA_V1,
      ok: false,
      reason: gate.reason,
      budget: gate.budget,
      queueDepth: getFoxInitiativeQueueV1().length
    });
    publishFoxProactiveSnapshotV1(skipped);
    return skipped;
  }

  const ghostHints = readGhostPresentationUiHintsV1();
  const pauseMs = Math.max(120, Number(ghostHints.pauseDurationMs) || 220);
  const templatePhrase = buildFoxProactiveUtteranceV1(initiative);

  const plan = Object.freeze({
    schema: FOX_PROACTIVE_CHANNEL_SCHEMA_V1,
    ok: true,
    reason: "initiate_scheduled",
    initiativeId: initiative.id,
    source: initiative.source,
    significance: initiative.significance,
    phrase: templatePhrase,
    pauseMs,
    ghostHints,
    budget: gate.budget,
    traceId,
    calibration: policy.calibration
  });

  if (ctx.dryRun === true) {
    publishFoxProactiveSnapshotV1(plan);
    return plan;
  }

  const execute = async () => {
    const consumed = consumeFoxInitiativeV1(initiative.id, "spoken");
    if (!consumed) {
      logVoiceInfoV0("FOX_PROACTIVE_SKIP", { traceId, reason: "initiative_race", id: initiative.id });
      return;
    }

    const utterance = await resolveFoxProactiveUtteranceV1(initiative, {
      traceId,
      ghostHints,
      ghostPresentationBias:
        typeof window !== "undefined" ? window.__rhizoh?.ghostPresentationBias : null
    });
    const phrase = utterance.phrase;

    recordFoxProactiveInitiationV1({
      atMs: Date.now(),
      initiativeId: initiative.id,
      source: initiative.source
    });

    const live = emitLivePresenceV0({
      phrase,
      kind: PRESENCE_EVENT_KIND_V0.OBSERVE,
      intent: "fox_proactive_initiative",
      emotionalTone: ghostHints.animationBias === "alert" ? "alert" : "warm",
      traceId,
      speak: true,
      source: "fox_proactive_channel",
      moduleId: "fox_proactive_channel_v1",
      incrementTurn: false
    });

    logVoiceInfoV0("FOX_PROACTIVE_INITIATED", {
      traceId,
      id: initiative.id,
      source: initiative.source,
      significance: initiative.significance,
      pauseMs,
      spoke: live?.spoke === true,
      utteranceSource: utterance.source
    });

    const result = Object.freeze({
      ...plan,
      phrase,
      utteranceSource: utterance.source,
      executedAt: Date.now(),
      live,
      budget: getFoxProactiveBudgetSnapshotV1()
    });
    publishFoxProactiveSnapshotV1(result);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(RHIZOH_FOX_PROACTIVE_EVENT_V1, { detail: result }));
    }
    return result;
  };

  if (typeof window !== "undefined" && pauseMs > 0) {
    publishFoxProactiveSnapshotV1(Object.freeze({ ...plan, status: "ghost_pause_pending" }));
    window.setTimeout(() => {
      void execute();
    }, pauseMs);
    return Object.freeze({ ...plan, status: "ghost_pause_scheduled" });
  }

  void execute();
  return Object.freeze({ ...plan, status: "executing" });
}

function publishFoxProactiveSnapshotV1(snapshot) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.foxProactiveBudget = getFoxProactiveBudgetSnapshotV1();
  window.__rhizoh.foxProactiveChannel = snapshot;
}

/** @internal vitest */
export function __resetFoxProactiveChannelForTestV1() {
  _initiationLog = [];
  _lastInitiationAtMs = 0;
}
