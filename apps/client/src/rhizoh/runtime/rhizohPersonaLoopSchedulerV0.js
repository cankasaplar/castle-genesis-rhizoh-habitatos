/**
 * Persona Loop Scheduler v0 — heartbeat identity (morning / evening / idle pulse).
 * Soft presence only — no LLM for idle pulse; optional brief templates.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { getContinuityKernelSnapshotV0, CONTINUITY_STATE_V0, noteObservingContinuityV0 } from "./rhizohContinuityKernelV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { PRESENCE_EVENT_KIND_V0 } from "./rhizohPresenceSignatureV0.js";
import { noteGroundSignalV1, GROUND_SIGNAL_KIND_V1 } from "./rhizohGroundingLayerV1.js";

export const RHIZOH_PERSONA_SCHEDULER_SCHEMA_V0 = "rhizoh.persona_loop_scheduler.v0";

const IDLE_PULSE_MS_V0 = 15 * 60 * 1000;
const FOCUS_GUARD_MS_V0 = 5 * 60 * 1000;

/** @type {number | null} */
let tickTimerV0 = null;
/** @type {boolean} */
let mountedV0 = false;
/** @type {number} */
let lastUserActivityMsV0 = Date.now();
/** @type {string | null} */
let lastMorningKeyV0 = null;
/** @type {string | null} */
let lastEveningKeyV0 = null;
/** @type {number} */
let lastIdlePulseMsV0 = 0;

export function notePersonaSchedulerUserActivityV0() {
  lastUserActivityMsV0 = Date.now();
  noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.USER_ACTIVITY);
}

function dayKeyV0() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function localHourV0() {
  return new Date().getHours();
}

function phraseForPulseKindV0(kind, phrase) {
  const locale = resolveOutputLanguageCodeV0();
  const tr = String(locale || "tr").toLowerCase().startsWith("tr");
  return (
    phrase ||
    (kind === "morning"
      ? tr
        ? "Günaydın. Hazırım — kısa brifing için konuşabilirsin."
        : "Good morning. I'm ready when you are."
      : kind === "evening"
        ? tr
          ? "Akşam özeti hazır. Bugünü konuşmak istersen buradayım."
          : "Evening summary slot open. I'm here if you want to reflect."
        : kind === "emotional_shift"
          ? tr
            ? "Buradayım — ritmi hissediyorum."
            : "I'm here — sensing the shift."
          : tr
            ? "Hazırım."
            : "I'm here.")
  );
}

/**
 * Context-aware scheduler evaluation — called from pulse loop (not standalone timer).
 * @param {object} [ctx]
 */
export function evaluatePersonaSchedulerPulseV1(ctx = {}) {
  const hour = localHourV0();
  const day = dayKeyV0();
  const continuity = ctx.continuity || getContinuityKernelSnapshotV0();
  const idleMs = Date.now() - lastUserActivityMsV0;
  const userFocused = ctx.userFocused === true;
  const sessionDepth = Number(ctx.sessionDepth) || 0;
  const lifecycle = ctx.lifecycle;
  const emotionalTone = lifecycle?.emotionalToneLabel || "steady";
  const emotionalShift =
    lifecycle && Math.abs((lifecycle.emotionalToneEma ?? 0.5) - 0.5) > 0.35;

  const focusGuard = userFocused && idleMs < FOCUS_GUARD_MS_V0;
  const base = Object.freeze({
    shouldEmit: false,
    kind: null,
    phrase: null,
    presenceKind: PRESENCE_EVENT_KIND_V0.PULSE,
    emotionalTone,
    context: Object.freeze({
      userFocused,
      sessionDepth,
      idleMs,
      focusGuard,
      emotionalShift,
      continuityState: continuity.state
    })
  });

  if (hour >= 6 && hour < 11 && lastMorningKeyV0 !== day && !focusGuard) {
    lastMorningKeyV0 = day;
    return Object.freeze({
      ...base,
      shouldEmit: true,
      kind: "morning",
      phrase: phraseForPulseKindV0("morning"),
      emotionalTone: "warm"
    });
  }

  if (hour >= 20 && hour < 23 && lastEveningKeyV0 !== day && sessionDepth >= 0) {
    lastEveningKeyV0 = day;
    return Object.freeze({
      ...base,
      shouldEmit: true,
      kind: "evening",
      phrase: phraseForPulseKindV0("evening"),
      emotionalTone: "warm"
    });
  }

  if (
    idleMs >= IDLE_PULSE_MS_V0 &&
    Date.now() - lastIdlePulseMsV0 >= IDLE_PULSE_MS_V0 &&
    !focusGuard &&
    (continuity.state === CONTINUITY_STATE_V0.IDLE ||
      continuity.state === CONTINUITY_STATE_V0.OBSERVING)
  ) {
    lastIdlePulseMsV0 = Date.now();
    return Object.freeze({
      ...base,
      shouldEmit: true,
      kind: "idle",
      phrase: phraseForPulseKindV0("idle"),
      emotionalTone: "steady"
    });
  }

  if (emotionalShift && idleMs > 60_000 && sessionDepth >= 2 && !focusGuard) {
    return Object.freeze({
      ...base,
      shouldEmit: true,
      kind: "emotional_shift",
      phrase: phraseForPulseKindV0("emotional_shift"),
      presenceKind: PRESENCE_EVENT_KIND_V0.OBSERVE,
      emotionalTone
    });
  }

  return base;
}

export function notePersonaPulseEmittedV0(kind) {
  noteObservingContinuityV0({ source: `persona_${kind}`, momentum: "heartbeat" });
  logVoiceInfoV0("PERSONA_PULSE", { kind, via: "pulse_loop" });
}

export function mountPersonaLoopSchedulerV0() {
  if (typeof window === "undefined" || mountedV0) return;
  mountedV0 = true;
  lastUserActivityMsV0 = Date.now();

  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.personaScheduler = getPersonaSchedulerSnapshotV0();
  logVoiceInfoV0("PERSONA_SCHEDULER_MOUNT", {
    ...getPersonaSchedulerSnapshotV0(),
    drivenBy: "rhizoh_pulse_loop_v1"
  });
}

export function getPersonaSchedulerSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_PERSONA_SCHEDULER_SCHEMA_V0,
    mounted: mountedV0,
    idlePulseMs: IDLE_PULSE_MS_V0,
    lastUserActivityMs: lastUserActivityMsV0,
    lastIdlePulseMs: lastIdlePulseMsV0,
    lastMorningKey: lastMorningKeyV0,
    lastEveningKey: lastEveningKeyV0,
    modes: Object.freeze(["morning_brief", "evening_report", "idle_pulse", "emotional_shift"]),
    drivenBy: "rhizoh_pulse_loop_v1",
    contextAware: true
  });
}

/** @internal vitest */
export function __resetPersonaSchedulerForTestV0() {
  if (tickTimerV0 && typeof window !== "undefined") {
    window.clearInterval(tickTimerV0);
  }
  tickTimerV0 = null;
  mountedV0 = false;
  lastMorningKeyV0 = null;
  lastEveningKeyV0 = null;
  lastIdlePulseMsV0 = 0;
}
