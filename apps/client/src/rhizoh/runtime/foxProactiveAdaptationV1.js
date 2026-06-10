/**
 * FOX_PROACTIVE_ADAPTATION_V1 — behavior calibration layer (feedback loop).
 *
 * Fox davranış üretir · Rhizoh ifade üretir · Feedback Fox eşiğini değiştirir.
 * Fox ölçmez; bu katman ölçer ve kalibrasyonu günceller.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { notePersonaSchedulerUserActivityV0 } from "./rhizohPersonaLoopSchedulerV0.js";
import {
  detectRhizohEmotionalShiftV1,
  snapshotEmotionalTrajectoryFromThreadV1
} from "./rhizohDialogueThreadV1.js";
import {
  hydrateFoxProactiveCalibrationDiskV1,
  persistFoxProactiveCalibrationDiskV1,
  __clearFoxProactiveCalibrationDiskForTestV1
} from "./foxProactiveCalibrationPersistV1.js";
import { shouldFoxCalibrationPersistWriteV1 } from "./foxProactiveDeploymentGateV1.js";
import {
  applyFoxIdentityStabilityAnchorV1,
  computeRawFoxCalibrationFromSignalsV1,
  computeFoxToneModulationV1,
  computeFoxCalibrationDriftV1,
  getFoxIdentityAnchorV1,
  FOX_IDENTITY_ANCHOR_BASELINE_V1
} from "./foxIdentityAnchorV1.js";

export const FOX_PROACTIVE_ADAPTATION_SCHEMA_V1 = "castle.rhizoh.fox_proactive_adaptation.v1";
export const FOX_PROACTIVE_OUTCOME_SCHEMA_V1 = "castle.rhizoh.fox_proactive_outcome_feedback.v1";
export const RHIZOH_FOX_PROACTIVE_CALIBRATION_EVENT_V1 = "rhizoh:fox-proactive-calibration-v1";

const FOX_PROACTIVE_BUDGET_BASE_V1 = Object.freeze({
  maxInitiationsPerHour: 2,
  cooldownMinutes: 20,
  dailyLimit: 10
});

const OUTCOME_WINDOW_MS_V1 = 90_000;
const INTERRUPT_WINDOW_MS_V1 = 4_000;
const ENGAGE_MIN_MESSAGE_LEN_V1 = 8;

const DISMISS_PATTERN_V1 =
  /^(dur|sus|yeter|tamam\s*yeter|sessiz|kapa|stop|quiet|shush|later|sonra)\b/iu;

/** @type {Array<Record<string, unknown>>} */
let _outcomeHistory = [];
/** @type {Record<string, unknown> | null} */
let _activeWatch = null;
/** @type {boolean} */
let _diskHydrated = false;
/** @type {boolean} */
let _observerMounted = false;

function reanchorCalibrationStateV1() {
  const anchored = applyFoxIdentityStabilityAnchorV1(_calibration);
  _calibration = {
    ...anchored,
    engagementRate: round3(_calibration.engagementRate),
    dismissRate: round3(_calibration.dismissRate)
  };
}

function ensureFoxProactiveDiskHydratedV1() {
  if (_diskHydrated) return;
  _diskHydrated = true;
  const disk = hydrateFoxProactiveCalibrationDiskV1();
  if (!disk) return;
  _calibration = {
    significanceThreshold: disk.calibration.significanceThreshold,
    cooldownMinutes: disk.calibration.cooldownMinutes,
    maxInitiationsPerHour: disk.calibration.maxInitiationsPerHour,
    dailyLimit: disk.calibration.dailyLimit,
    proactiveTolerance: disk.calibration.proactiveTolerance,
    engagementRate: disk.calibration.engagementRate,
    dismissRate: disk.calibration.dismissRate
  };
  _outcomeHistory = [...disk.outcomeHistory];
  reanchorCalibrationStateV1();
  _toneModulation = computeFoxToneModulationV1(_outcomeHistory);
}

function persistFoxProactiveStateV1() {
  if (!shouldFoxCalibrationPersistWriteV1()) return;
  persistFoxProactiveCalibrationDiskV1({
    calibration: _calibration,
    outcomeHistory: _outcomeHistory
  });
}

function refreshWatchEmotionalShiftV1(dialogueThread) {
  if (!_activeWatch || _activeWatch.closed) return;
  const current = snapshotEmotionalTrajectoryFromThreadV1(dialogueThread);
  if (detectRhizohEmotionalShiftV1(_activeWatch.emotionalBaseline, current)) {
    _activeWatch.emotionalShiftDetected = true;
  }
}

/** @type {{ significanceThreshold: number, cooldownMinutes: number, maxInitiationsPerHour: number, dailyLimit: number, proactiveTolerance: number, engagementRate: number, dismissRate: number }} */
let _calibration = { ...FOX_IDENTITY_ANCHOR_BASELINE_V1.proactiveLimits, engagementRate: 0, dismissRate: 0 };

/** @type {ReturnType<typeof computeFoxToneModulationV1>} */
let _toneModulation = computeFoxToneModulationV1([]);

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

/**
 * @param {number} ghostComfort
 * @param {number} engagementRate
 * @param {number} dismissRate
 */
export function computeGhostProactiveToleranceV1(ghostComfort, engagementRate, dismissRate) {
  const comfort = clamp01(ghostComfort);
  const engage = clamp01(engagementRate);
  const dismiss = clamp01(dismissRate);
  return round3(clamp01(0.22 + comfort * 0.42 + engage * 0.28 - dismiss * 0.22));
}

export function getFoxProactiveCalibrationV1() {
  const drift = computeFoxCalibrationDriftV1(_calibration);
  return Object.freeze({
    schema: FOX_PROACTIVE_ADAPTATION_SCHEMA_V1,
    significanceThreshold: round3(_calibration.significanceThreshold),
    cooldownMinutes: round3(_calibration.cooldownMinutes),
    maxInitiationsPerHour: Math.max(1, Math.round(_calibration.maxInitiationsPerHour)),
    dailyLimit: Math.max(1, Math.round(_calibration.dailyLimit)),
    proactiveTolerance: round3(_calibration.proactiveTolerance),
    engagementRate: round3(_calibration.engagementRate),
    dismissRate: round3(_calibration.dismissRate),
    outcomeCount: _outcomeHistory.length,
    identityAnchor: getFoxIdentityAnchorV1().proactiveLimits,
    calibrationDrift: drift,
    toneModulation: _toneModulation
  });
}

export function getFoxToneModulationV1() {
  return _toneModulation;
}

/**
 * @param {{
 *   wasInterrupted?: boolean,
 *   userEngaged?: boolean,
 *   userDismissed?: boolean,
 *   followUpOccurred?: boolean,
 *   responseLatency?: number | null,
 *   emotionalShiftDetected?: boolean,
 *   initiativeId?: string,
 *   traceId?: string | null,
 *   ghostComfort?: number,
 *   atMs?: number
 * }} outcome
 */
export function recordFoxProactiveOutcomeFeedbackV1(outcome = {}) {
  const row = Object.freeze({
    schema: FOX_PROACTIVE_OUTCOME_SCHEMA_V1,
    atMs: Number(outcome.atMs) || Date.now(),
    initiativeId: String(outcome.initiativeId || ""),
    traceId: outcome.traceId || null,
    wasInterrupted: outcome.wasInterrupted === true,
    userEngaged: outcome.userEngaged === true,
    userDismissed: outcome.userDismissed === true,
    followUpOccurred: outcome.followUpOccurred === true,
    responseLatency:
      outcome.responseLatency != null && Number.isFinite(Number(outcome.responseLatency))
        ? Math.round(Number(outcome.responseLatency))
        : null,
    emotionalShiftDetected: outcome.emotionalShiftDetected === true,
    ghostComfort: clamp01(outcome.ghostComfort)
  });

  _outcomeHistory = [..._outcomeHistory, row].slice(-32);
  applyFoxProactiveCalibrationFromOutcomesV1();
  persistFoxProactiveStateV1();
  publishFoxProactiveCalibrationV1();

  logVoiceInfoV0("FOX_PROACTIVE_OUTCOME", {
    traceId: row.traceId,
    userEngaged: row.userEngaged,
    userDismissed: row.userDismissed,
    wasInterrupted: row.wasInterrupted,
    responseLatency: row.responseLatency,
    calibration: getFoxProactiveCalibrationV1()
  });

  return row;
}

function applyFoxProactiveCalibrationFromOutcomesV1() {
  const recent = _outcomeHistory.slice(-12);
  if (!recent.length) return;

  const raw = computeRawFoxCalibrationFromSignalsV1(recent);
  const anchored = applyFoxIdentityStabilityAnchorV1(raw);
  _toneModulation = computeFoxToneModulationV1(recent);

  _calibration = {
    ...anchored,
    engagementRate: raw.engagementRate,
    dismissRate: raw.dismissRate
  };
}

/**
 * @param {{
 *   traceId?: string | null,
 *   initiativeId?: string,
 *   initiatedAt?: number,
 *   ghostComfort?: number
 * }} meta
 */
export function beginFoxProactiveOutcomeWatchV1(meta = {}) {
  ensureFoxProactiveDiskHydratedV1();
  const thread =
    typeof window !== "undefined" ? window.__rhizoh?.rhizohDialogueThread : null;
  _activeWatch = {
    traceId: meta.traceId || null,
    initiativeId: String(meta.initiativeId || ""),
    initiatedAt: Number(meta.initiatedAt) || Date.now(),
    ghostComfort: clamp01(meta.ghostComfort),
    emotionalBaseline: snapshotEmotionalTrajectoryFromThreadV1(thread),
    wasInterrupted: false,
    userEngaged: false,
    userDismissed: false,
    followUpOccurred: false,
    responseLatency: null,
    emotionalShiftDetected: false,
    closed: false
  };
  return _activeWatch;
}

/**
 * @param {{ message?: string, voiceTurn?: boolean, atMs?: number }} [signal]
 */
export function noteProactiveFeedbackUserActivityV1(signal = {}) {
  notePersonaSchedulerUserActivityV0();
  if (!_activeWatch || _activeWatch.closed) return null;

  const now = Number(signal.atMs) || Date.now();
  const latency = now - Number(_activeWatch.initiatedAt);
  if (latency < INTERRUPT_WINDOW_MS_V1) {
    _activeWatch.wasInterrupted = true;
  }
  if (_activeWatch.responseLatency == null) {
    _activeWatch.responseLatency = latency;
  }

  const msg = String(signal.message || "").trim();
  const lower = msg.toLowerCase();
  if (msg && DISMISS_PATTERN_V1.test(lower)) {
    _activeWatch.userDismissed = true;
  } else if (signal.voiceTurn === true || msg.length >= ENGAGE_MIN_MESSAGE_LEN_V1) {
    _activeWatch.userEngaged = true;
    _activeWatch.followUpOccurred = true;
  } else if (latency >= 8_000 && msg.length > 0 && !_activeWatch.userDismissed) {
    _activeWatch.userEngaged = true;
  }

  if (typeof window !== "undefined" && window.__rhizoh?.rhizohDialogueThread) {
    refreshWatchEmotionalShiftV1(window.__rhizoh.rhizohDialogueThread);
  }

  return _activeWatch;
}

/**
 * Post-turn emotional trajectory delta (Rhizoh continuity path).
 * @param {{ dialogueThread?: unknown }} [ctx]
 */
export function noteProactiveFeedbackEmotionalContextV1(ctx = {}) {
  if (!_activeWatch || _activeWatch.closed) return null;
  if (ctx.dialogueThread) {
    refreshWatchEmotionalShiftV1(ctx.dialogueThread);
  }
  return _activeWatch;
}

/**
 * @param {number} [atMs]
 */
export function evaluateFoxProactiveOutcomeWatchV1(atMs = Date.now()) {
  if (!_activeWatch || _activeWatch.closed) return null;
  const watch = _activeWatch;
  const elapsed = atMs - Number(watch.initiatedAt);
  if (elapsed < OUTCOME_WINDOW_MS_V1) return null;

  watch.closed = true;
  _activeWatch = null;

  if (watch.followUpOccurred && !watch.userDismissed && !watch.userEngaged) {
    watch.userEngaged = true;
  }

  return recordFoxProactiveOutcomeFeedbackV1({
    wasInterrupted: watch.wasInterrupted,
    userEngaged: watch.userEngaged,
    userDismissed: watch.userDismissed,
    followUpOccurred: watch.followUpOccurred,
    responseLatency: watch.responseLatency,
    emotionalShiftDetected: watch.emotionalShiftDetected,
    initiativeId: watch.initiativeId,
    traceId: watch.traceId,
    ghostComfort: watch.ghostComfort,
    atMs
  });
}

function publishFoxProactiveCalibrationV1() {
  if (typeof window === "undefined") return;
  const calibration = getFoxProactiveCalibrationV1();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.foxProactiveCalibration = calibration;
  window.__rhizoh.foxProactiveOutcomeHistory = Object.freeze([..._outcomeHistory]);
  window.__rhizoh.foxIdentityAnchor = getFoxIdentityAnchorV1();
  window.__rhizoh.foxToneModulation = _toneModulation;
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_FOX_PROACTIVE_CALIBRATION_EVENT_V1, { detail: calibration })
    );
  } catch {
    /* noop */
  }
}

export function mountFoxProactiveFeedbackObserverV1() {
  if (typeof window === "undefined" || _observerMounted) return;
  _observerMounted = true;
  ensureFoxProactiveDiskHydratedV1();

  const onActivity = () => noteProactiveFeedbackUserActivityV1();
  window.addEventListener("pointerdown", onActivity, { passive: true });
  window.addEventListener("keydown", onActivity, { passive: true });

  window.addEventListener("rhizoh:fox-proactive-v1", (ev) => {
    const detail = ev?.detail;
    if (!detail?.executedAt) return;
    const ghostComfort =
      typeof window !== "undefined" ? window.__rhizoh?.ghostState?.comfort : undefined;
    beginFoxProactiveOutcomeWatchV1({
      traceId: detail.traceId,
      initiativeId: detail.initiativeId,
      initiatedAt: detail.executedAt,
      ghostComfort
    });
  });

  publishFoxProactiveCalibrationV1();
}

/** @internal vitest */
export function __resetFoxProactiveAdaptationForTestV1() {
  _outcomeHistory = [];
  _activeWatch = null;
  _observerMounted = false;
  _diskHydrated = false;
  __clearFoxProactiveCalibrationDiskForTestV1();
  _calibration = {
    ...FOX_IDENTITY_ANCHOR_BASELINE_V1.proactiveLimits,
    engagementRate: 0,
    dismissRate: 0
  };
  _toneModulation = computeFoxToneModulationV1([]);
}
