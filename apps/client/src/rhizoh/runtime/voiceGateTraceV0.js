/**
 * Voice entry gate trace — read-only, ephemeral observability snapshot.
 *
 * CONTRACT (do not violate):
 * - MUST NOT affect gate decisions, retries, or runtime state transitions.
 * - MUST NOT be persisted, subscribed, or fed back into evaluateVoiceEntryGateV0.
 * - Console-only diagnostic; runtime truth remains V3_SESSION_BEGIN.
 *
 * Gate is pre-check only; this module is not a mini event graph engine.
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";

export const VOICE_GATE_TRACE_SCHEMA_V0 = "castle.rhizoh.voice_gate_trace.v0";

/** @type {Readonly<{ observabilityOnly: true, ephemeral: true }>} */
export const VOICE_GATE_TRACE_CONTRACT_V0 = Object.freeze({
  observabilityOnly: true,
  ephemeral: true
});

/**
 * Pure snapshot builder — safe for tests; output is frozen and detached from input.
 * @param {{
 *   gate: ReturnType<import("./rhizohDeployReadyPresenceV0.js").evaluateVoiceEntryGateV0>,
 *   refs?: { voiceReady?: boolean, fieldState?: string },
 *   ui?: { voiceReady?: boolean, fieldState?: string },
 *   attempt?: string,
 *   voiceAdapterReady?: boolean
 * }} input
 */
export function buildVoiceGateTraceSnapshotV0(input = {}) {
  const gate = input.gate && typeof input.gate === "object" ? input.gate : {};
  const refs = input.refs && typeof input.refs === "object" ? input.refs : {};
  const ui = input.ui && typeof input.ui === "object" ? input.ui : {};

  const voiceReadyRef = refs.voiceReady === true;
  const fieldRef = String(refs.fieldState || "IDLE");
  const voiceReadyUi = ui.voiceReady;
  const fieldUi = ui.fieldState != null ? String(ui.fieldState) : null;

  const refDrift =
    (voiceReadyUi !== undefined && voiceReadyUi !== voiceReadyRef) ||
    (fieldUi !== null && fieldUi !== fieldRef);

  const presence = gate.voice_ready_coherence?.presence || null;

  return Object.freeze({
    ...VOICE_GATE_TRACE_CONTRACT_V0,
    schema: VOICE_GATE_TRACE_SCHEMA_V0,
    atMs: Date.now(),
    attempt: String(input.attempt || "entry"),
    allow_listen: gate.allow_listen === true,
    reason: String(gate.reason || "unknown"),
    silent_presence: gate.silent_presence === true,
    voiceReady: voiceReadyRef,
    field: fieldRef,
    voiceAdapterReady: input.voiceAdapterReady !== false,
    first_paint_ok: gate.first_paint_ok !== false,
    presence_present: presence?.rhizoh_is_present === true,
    silence_form: presence?.silence_form || null,
    ref_drift: refDrift,
    ...(voiceReadyUi !== undefined ? { voiceReadyUi } : {}),
    ...(fieldUi !== null ? { fieldUi } : {})
  });
}

/**
 * Log gate input combination — void return intentional (no trace→decision coupling).
 * @param {Parameters<typeof buildVoiceGateTraceSnapshotV0>[0]} input
 */
export function logVoiceGateTraceV0(input = {}) {
  const snapshot = buildVoiceGateTraceSnapshotV0(input);
  logVoiceInfoV0("VOICE_GATE_TRACE", snapshot);
}
