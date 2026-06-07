/**
 * Identity lifecycle — birth → decay → compression → reset.
 * Prevents ghost persona drift from unbounded state growth.
 */

import {
  appendIdentityEventV0,
  compressIdentityHistoryV0,
  getIdentityEventLogSnapshotV0
} from "./rhizohIdentityEventLogV0.js";
import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const RHIZOH_IDENTITY_LIFECYCLE_SCHEMA_V0 = "rhizoh.identity_lifecycle.v0";

const ACTIVE_TASK_TTL_MS_V0 = 30 * 60 * 1000;
const INACTIVITY_RESET_MS_V0 = 2 * 60 * 60 * 1000;
const COMPRESS_EVERY_N_TURNS_V0 = 12;
const TONE_EMA_ALPHA_V0 = 0.35;

const TONE_SCORE_V0 = Object.freeze({
  warm: 0.8,
  steady: 0.5,
  neutral: 0.45,
  alert: 0.9,
  contemplative: 0.3
});

/** @type {object} */
let lifecycleStateV0 = {
  bornAtMs: Date.now(),
  lastDecayAtMs: 0,
  lastActivityAtMs: Date.now(),
  emotionalToneEma: 0.5,
  emotionalToneLabel: "steady",
  activeTask: null,
  activeTaskExpiresAtMs: 0,
  turnCount: 0,
  compressions: 0,
  resets: 0
};

/**
 * @param {string} tone
 */
function toneToScoreV0(tone) {
  return TONE_SCORE_V0[String(tone || "steady").toLowerCase()] ?? 0.5;
}

/**
 * @param {number} score
 */
function scoreToToneLabelV0(score) {
  if (score >= 0.75) return "warm";
  if (score >= 0.55) return "steady";
  if (score >= 0.4) return "neutral";
  return "contemplative";
}

/**
 * Touch lifecycle on turn bind or presence event.
 * @param {object} [opts]
 */
export function touchIdentityLifecycleV0(opts = {}) {
  const now = Date.now();
  lifecycleStateV0.lastActivityAtMs = now;
  lifecycleStateV0.turnCount += opts.incrementTurn === false ? 0 : 1;

  if (opts.emotionalTone) {
    const score = toneToScoreV0(opts.emotionalTone);
    lifecycleStateV0.emotionalToneEma =
      lifecycleStateV0.emotionalToneEma * (1 - TONE_EMA_ALPHA_V0) + score * TONE_EMA_ALPHA_V0;
    lifecycleStateV0.emotionalToneLabel = scoreToToneLabelV0(lifecycleStateV0.emotionalToneEma);
  }

  if (opts.activeTask) {
    lifecycleStateV0.activeTask = String(opts.activeTask).slice(0, 160);
    lifecycleStateV0.activeTaskExpiresAtMs = now + ACTIVE_TASK_TTL_MS_V0;
  }

  appendIdentityEventV0({
    type: opts.type || "lifecycle_touch",
    intent: opts.intent,
    emotionalTone: lifecycleStateV0.emotionalToneLabel,
    activeTask: lifecycleStateV0.activeTask,
    turnId: opts.turnId,
    carrier: opts.carrier || "local",
    presenceKind: opts.presenceKind,
    preview: opts.preview,
    modality: opts.modality
  });

  return getIdentityLifecycleSnapshotV0();
}

/**
 * Periodic decay + compression (called from pulse loop).
 */
export function runIdentityLifecycleDecayV0() {
  const now = Date.now();
  let decayed = false;

  if (lifecycleStateV0.activeTask && now > lifecycleStateV0.activeTaskExpiresAtMs) {
    lifecycleStateV0.activeTask = null;
    lifecycleStateV0.activeTaskExpiresAtMs = 0;
    decayed = true;
  }

  if (now - lifecycleStateV0.lastActivityAtMs > INACTIVITY_RESET_MS_V0) {
    lifecycleStateV0.emotionalToneEma = 0.5;
    lifecycleStateV0.emotionalToneLabel = "steady";
    lifecycleStateV0.activeTask = null;
    lifecycleStateV0.resets += 1;
    lifecycleStateV0.lastActivityAtMs = now;
    decayed = true;
    logVoiceInfoV0("IDENTITY_LIFECYCLE_RESET", { reason: "inactivity" });
  }

  if (
    lifecycleStateV0.turnCount > 0 &&
    lifecycleStateV0.turnCount % COMPRESS_EVERY_N_TURNS_V0 === 0
  ) {
    const log = getIdentityEventLogSnapshotV0();
    compressIdentityHistoryV0(log.recent);
    lifecycleStateV0.compressions += 1;
    decayed = true;
  }

  lifecycleStateV0.lastDecayAtMs = now;
  const snap = getIdentityLifecycleSnapshotV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.identityLifecycle = snap;
  }
  return Object.freeze({ ...snap, decayed });
}

export function getIdentityLifecycleSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_IDENTITY_LIFECYCLE_SCHEMA_V0,
    ...lifecycleStateV0,
    activeTaskLive:
      Boolean(lifecycleStateV0.activeTask) && Date.now() < lifecycleStateV0.activeTaskExpiresAtMs,
    eventLog: getIdentityEventLogSnapshotV0()
  });
}

/** @internal vitest */
export function __resetIdentityLifecycleForTestV0() {
  lifecycleStateV0 = {
    bornAtMs: Date.now(),
    lastDecayAtMs: 0,
    lastActivityAtMs: Date.now(),
    emotionalToneEma: 0.5,
    emotionalToneLabel: "steady",
    activeTask: null,
    activeTaskExpiresAtMs: 0,
    turnCount: 0,
    compressions: 0,
    resets: 0
  };
}
