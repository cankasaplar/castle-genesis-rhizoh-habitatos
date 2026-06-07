/**
 * Pulse Priority Engine v0 — weight, priority, suppression, throttle.
 * Governor layer: which event dominates, which is log-only.
 */

export const RHIZOH_PULSE_PRIORITY_SCHEMA_V0 = "rhizoh.pulse_priority_engine.v0";

export const EVENT_PRIORITY_TIER_V0 = Object.freeze({
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
  SUPPRESSED: 0
});

const VOICE_THROTTLE_MS_V0 = 3000;
/** @type {number} */
let lastVoiceEmitAtMsV0 = 0;
/** @type {string | null} */
let lastSuppressedKindV0 = null;

const EVENT_PROFILES_V0 = Object.freeze({
  presence_ack: Object.freeze({
    eventWeight: 0.95,
    eventPriority: EVENT_PRIORITY_TIER_V0.CRITICAL,
    voiceEligible: true,
    uiEligible: true,
    logOnly: false,
    identityMeaningful: true
  }),
  presence_pulse: Object.freeze({
    eventWeight: 0.72,
    eventPriority: EVENT_PRIORITY_TIER_V0.HIGH,
    voiceEligible: true,
    uiEligible: true,
    logOnly: false,
    identityMeaningful: true
  }),
  presence_observe: Object.freeze({
    eventWeight: 0.55,
    eventPriority: EVENT_PRIORITY_TIER_V0.NORMAL,
    voiceEligible: false,
    uiEligible: true,
    logOnly: false,
    identityMeaningful: true
  }),
  presence_think: Object.freeze({
    eventWeight: 0.4,
    eventPriority: EVENT_PRIORITY_TIER_V0.LOW,
    voiceEligible: false,
    uiEligible: true,
    logOnly: true,
    identityMeaningful: false
  }),
  turn_bind: Object.freeze({
    eventWeight: 0.82,
    eventPriority: EVENT_PRIORITY_TIER_V0.NORMAL,
    voiceEligible: false,
    uiEligible: true,
    logOnly: false,
    identityMeaningful: true
  }),
  lifecycle_touch: Object.freeze({
    eventWeight: 0.25,
    eventPriority: EVENT_PRIORITY_TIER_V0.LOW,
    voiceEligible: false,
    uiEligible: false,
    logOnly: true,
    identityMeaningful: false
  }),
  transport_switch: Object.freeze({
    eventWeight: 0.08,
    eventPriority: EVENT_PRIORITY_TIER_V0.SUPPRESSED,
    voiceEligible: false,
    uiEligible: false,
    logOnly: true,
    identityMeaningful: false
  }),
  compute_probe: Object.freeze({
    eventWeight: 0.04,
    eventPriority: EVENT_PRIORITY_TIER_V0.SUPPRESSED,
    voiceEligible: false,
    uiEligible: false,
    logOnly: true,
    identityMeaningful: false,
    telemetry: true
  }),
  scheduler_morning: Object.freeze({
    eventWeight: 0.68,
    eventPriority: EVENT_PRIORITY_TIER_V0.HIGH,
    voiceEligible: true,
    uiEligible: true,
    logOnly: false,
    identityMeaningful: true
  }),
  scheduler_evening: Object.freeze({
    eventWeight: 0.65,
    eventPriority: EVENT_PRIORITY_TIER_V0.HIGH,
    voiceEligible: true,
    uiEligible: true,
    logOnly: false,
    identityMeaningful: true
  }),
  scheduler_idle: Object.freeze({
    eventWeight: 0.45,
    eventPriority: EVENT_PRIORITY_TIER_V0.NORMAL,
    voiceEligible: true,
    uiEligible: true,
    logOnly: false,
    identityMeaningful: true
  }),
  scheduler_emotional_shift: Object.freeze({
    eventWeight: 0.5,
    eventPriority: EVENT_PRIORITY_TIER_V0.NORMAL,
    voiceEligible: false,
    uiEligible: true,
    logOnly: false,
    identityMeaningful: true
  })
});

const DEFAULT_PROFILE_V0 = Object.freeze({
  eventWeight: 0.3,
  eventPriority: EVENT_PRIORITY_TIER_V0.LOW,
  voiceEligible: false,
  uiEligible: false,
  logOnly: true,
  identityMeaningful: false
});

/**
 * @param {object} event
 */
export function resolveEventProfileV0(event = {}) {
  const candidates = [
    event.schedulerKind,
    event.presenceKind,
    event.intent ? `scheduler_${event.intent}` : null,
    event.type,
    event.intent
  ].filter(Boolean);
  const key = candidates.find((k) => EVENT_PROFILES_V0[k]) || candidates[0] || "unknown";
  const profile = EVENT_PROFILES_V0[key] || DEFAULT_PROFILE_V0;
  return Object.freeze({
    schema: RHIZOH_PULSE_PRIORITY_SCHEMA_V0,
    key,
    ...profile
  });
}

/**
 * @param {object} event
 * @param {object} [ctx]
 */
export function governPulseEventV0(event = {}, ctx = {}) {
  const profile = resolveEventProfileV0(event);
  const now = Date.now();
  const voiceReady = ctx.voiceReady !== false;
  const computeDegraded = ctx.computeDegraded === true;

  let suppressed = false;
  let suppressReason = null;

  if (profile.eventPriority === EVENT_PRIORITY_TIER_V0.SUPPRESSED) {
    suppressed = true;
    suppressReason = "telemetry_suppressed";
  }

  if (
    profile.voiceEligible &&
    profile.eventPriority < EVENT_PRIORITY_TIER_V0.CRITICAL &&
    now - lastVoiceEmitAtMsV0 < VOICE_THROTTLE_MS_V0
  ) {
    suppressed = true;
    suppressReason = "voice_throttle";
  }

  if (computeDegraded && profile.eventPriority < EVENT_PRIORITY_TIER_V0.HIGH) {
    suppressed = true;
    suppressReason = "compute_degraded_non_critical";
  }

  const voiceAllowed =
    profile.voiceEligible && voiceReady && !suppressed && !profile.logOnly;
  const uiAllowed = profile.uiEligible && !profile.logOnly;
  const logAllowed = profile.logOnly || suppressed || profile.eventWeight < 0.2;

  if (suppressed) lastSuppressedKindV0 = profile.key;

  const governance = Object.freeze({
    schema: RHIZOH_PULSE_PRIORITY_SCHEMA_V0,
    profile,
    eventWeight: profile.eventWeight,
    eventPriority: profile.eventPriority,
    voiceEligible: voiceAllowed,
    uiEligible: uiAllowed,
    logOnly: profile.logOnly,
    logAllowed,
    suppressed,
    suppressReason,
    identityMeaningful: profile.identityMeaningful,
    telemetry: profile.telemetry === true,
    emit:
      !suppressed &&
      (voiceAllowed || uiAllowed || (profile.logOnly && logAllowed)),
    dominantChannel: voiceAllowed
      ? "voice"
      : uiAllowed
        ? "ui_presence"
        : logAllowed
          ? "log"
          : "none"
  });

  if (voiceAllowed) lastVoiceEmitAtMsV0 = now;
  return governance;
}

export function getPulsePrioritySnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_PULSE_PRIORITY_SCHEMA_V0,
    lastVoiceEmitAtMs: lastVoiceEmitAtMsV0 || null,
    lastSuppressedKind: lastSuppressedKindV0,
    voiceThrottleMs: VOICE_THROTTLE_MS_V0
  });
}

/** @internal vitest */
export function __resetPulsePriorityForTestV0() {
  lastVoiceEmitAtMsV0 = 0;
  lastSuppressedKindV0 = null;
}
