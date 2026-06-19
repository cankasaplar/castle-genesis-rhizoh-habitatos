/**
 * Continuity Kernel v0 — flow memory (timeline, not turn list).
 * Entity state pulse: idle → listening → thinking → speaking → observing.
 * Read-only influence on execution — shapes presence timing only.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { rebuildRhizohCausalGraphV0 } from "./runtimeEventGraphBridgeV0.js";

export const RHIZOH_CONTINUITY_KERNEL_SCHEMA_V0 = "rhizoh.continuity_kernel.v0";

export const CONTINUITY_STATE_V0 = Object.freeze({
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  OBSERVING: "observing"
});

/** @type {string} */
let currentStateV0 = CONTINUITY_STATE_V0.IDLE;
/** @type {object | null} */
let lastPulseV0 = null;
/** @type {object[]} */
const pulseRingV0 = [];
const PULSE_RING_MAX_V0 = 32;

/**
 * @param {string} next
 * @param {object} [detail]
 */
export function transitionContinuityStateV0(next, detail = {}) {
  const prev = currentStateV0;
  currentStateV0 = String(next || CONTINUITY_STATE_V0.IDLE);
  const pulse = Object.freeze({
    atMs: Date.now(),
    prev,
    next: currentStateV0,
    ...detail
  });
  lastPulseV0 = pulse;
  pulseRingV0.push(pulse);
  if (pulseRingV0.length > PULSE_RING_MAX_V0) pulseRingV0.shift();
  logVoiceInfoV0("CONTINUITY_STATE", { prev, next: currentStateV0, ...detail });
  publishContinuityKernelRegistryV0();
  return pulse;
}

function publishContinuityKernelRegistryV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  const snapshot = getContinuityKernelSnapshotV0();
  window.__rhizoh.continuityKernel = Object.freeze({
    ...snapshot,
    rebuildCausalGraph: rebuildRhizohCausalGraphV0,
    snapshot: () => getContinuityKernelSnapshotV0()
  });
}

export function ensureContinuityKernelDevToolsV0() {
  if (typeof window === "undefined") return null;
  publishContinuityKernelRegistryV0();
  return window.__rhizoh.continuityKernel;
}

/**
 * @param {object} [opts]
 */
export function recordContinuityPulseV0(opts = {}) {
  return transitionContinuityStateV0(opts.state || currentStateV0, {
    intent: opts.intent || null,
    emotionalTone: opts.emotionalTone || null,
    momentum: opts.momentum || null,
    source: opts.source || "pulse",
    preview: opts.preview ? String(opts.preview).slice(0, 96) : null
  });
}

export function noteMicListeningContinuityV0() {
  return transitionContinuityStateV0(CONTINUITY_STATE_V0.LISTENING, { source: "mic_open" });
}

export function notePresenceAckContinuityV0(opts = {}) {
  return transitionContinuityStateV0(CONTINUITY_STATE_V0.SPEAKING, {
    source: "presence_ack",
    intent: "presence",
    emotionalTone: opts.emotionalTone || "warm",
    momentum: "acknowledged",
    preview: opts.phrase || null
  });
}

export function noteThinkingContinuityV0(opts = {}) {
  return transitionContinuityStateV0(CONTINUITY_STATE_V0.THINKING, {
    source: opts.source || "llm_pending",
    intent: opts.intent || null,
    preview: opts.preview || null
  });
}

export function noteObservingContinuityV0(opts = {}) {
  return transitionContinuityStateV0(CONTINUITY_STATE_V0.OBSERVING, {
    source: opts.source || "silent_observe",
    momentum: opts.momentum || "watching"
  });
}

export function getContinuityKernelSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_CONTINUITY_KERNEL_SCHEMA_V0,
    state: currentStateV0,
    lastPulse: lastPulseV0,
    recentPulses: Object.freeze(pulseRingV0.slice(-8)),
    neverNull: currentStateV0 !== CONTINUITY_STATE_V0.IDLE || pulseRingV0.length > 0
  });
}

/** @internal vitest */
export function __resetContinuityKernelForTestV0() {
  currentStateV0 = CONTINUITY_STATE_V0.IDLE;
  lastPulseV0 = null;
  pulseRingV0.length = 0;
}
