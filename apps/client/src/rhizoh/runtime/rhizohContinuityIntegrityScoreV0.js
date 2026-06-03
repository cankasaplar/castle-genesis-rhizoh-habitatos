/**
 * CIS v0 — Continuity Integrity Score (observe-only product gate signal).
 * Not MCO — no CCF/ECC feedback. Release control room metric.
 * @see docs/RHIZOH_RELEASE_CONTROL_ROOM_V0.md
 */

import { RHIZOH_SILENCE_FORM_V0 } from "./rhizohPresenceStateEngineV0.js";
import { evaluateVoiceReadyCoherenceV0 } from "./rhizohVoiceReadyCoherenceV0.js";

export const CIS_SCHEMA_V0 = "castle.rhizoh.continuity_integrity_score.v0";

export const CIS_PRODUCT_GATE_THRESHOLD_V0 = 0.62;

/** @type {ReturnType<typeof sampleContinuityIntegrityScoreV0> | null} */
let lastSample = null;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {{
 *   fieldState?: string,
 *   voiceReady?: boolean,
 *   voiceAdapterReady?: boolean,
 *   uiShowsListening?: boolean,
 *   firstPaintOk?: boolean
 * }} [ctx]
 */
export function sampleContinuityIntegrityScoreV0(ctx = {}) {
  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const presence = rh.presenceState || null;
  const ecc = rh.experienceContinuity || null;
  const tdg = rh.temporalDriftGuard || null;
  const firstPaint = rh.continuityFirstPaint || null;

  const voiceCoherence = evaluateVoiceReadyCoherenceV0({
    presence,
    fieldState: ctx.fieldState,
    voiceReady: ctx.voiceReady,
    voiceAdapterReady: ctx.voiceAdapterReady,
    uiShowsListening: ctx.uiShowsListening
  });

  const shadow = rh.voiceWitnessShadow || rh.voiceObservationShadow || null;
  const actualAccepted = Number(shadow?.counters?.actualAccepted) || 0;
  const actualRejected = Number(shadow?.counters?.actualRejected) || 0;
  const total = actualAccepted + actualRejected;
  const executionAcceptedRatio01 =
    total > 0 ? clamp01(actualAccepted / total) : 0.72;

  const stt = rh.voiceStt || null;
  const speechToPresenceLatencyMs =
    stt?.onstartAtMs && stt?.startAtMs
      ? Math.max(0, Number(stt.onstartAtMs) - Number(stt.startAtMs))
      : null;

  const session_coherence01 = clamp01(
    (tdg?.phase_coherence_ok === false ? 0.45 : 0.88) *
      (ecc?.temporal_guard?.phase_coherence_ok === false ? 0.82 : 1)
  );

  const silenceForm = String(presence?.silence_form || "");
  const silence_perception_cost01 = clamp01(
    silenceForm === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION
      ? 0.55
      : silenceForm === RHIZOH_SILENCE_FORM_V0.ABSENT
        ? 0.85
        : 0.12
  );

  const velocity = clamp01(ecc?.narrative_velocity ?? 0.35);
  const response_reentry_smoothness01 = clamp01(1 - Math.abs(velocity - 0.42) * 1.2);

  const felVisible =
    silenceForm === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION &&
    Boolean(ecc?.continuity_line);
  const fel_disruption_visibility01 = clamp01(
    felVisible ? 0.35 : silenceForm === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION ? 0.7 : 0.15
  );

  const first_paint_ok =
    ctx.firstPaintOk === true ||
    firstPaint?.ok === true ||
    Boolean(presence?.rhizoh_is_present && ecc?.continuity_line);

  const cis01 = clamp01(
    session_coherence01 * 0.28 +
      (1 - silence_perception_cost01) * 0.24 +
      response_reentry_smoothness01 * 0.18 +
      (1 - fel_disruption_visibility01) * 0.12 +
      (voiceCoherence.voice_ready_coherent_ok ? 0.1 : 0) +
      (first_paint_ok ? 0.08 : 0) +
      executionAcceptedRatio01 * 0.08
  );

  const sample = Object.freeze({
    schema: CIS_SCHEMA_V0,
    atMs: Date.now(),
    cis01: Number(cis01.toFixed(4)),
    product_gate_ok: cis01 >= CIS_PRODUCT_GATE_THRESHOLD_V0,
    product_gate_threshold: CIS_PRODUCT_GATE_THRESHOLD_V0,
    components: Object.freeze({
      session_coherence01: Number(session_coherence01.toFixed(4)),
      silence_perception_cost01: Number(silence_perception_cost01.toFixed(4)),
      response_reentry_smoothness01: Number(response_reentry_smoothness01.toFixed(4)),
      fel_disruption_visibility01: Number(fel_disruption_visibility01.toFixed(4)),
      execution_accepted_ratio01: Number(executionAcceptedRatio01.toFixed(4)),
      first_paint_ok,
      voice_ready_coherent_ok: voiceCoherence.voice_ready_coherent_ok
    }),
    voice: Object.freeze({
      speech_to_presence_latency_ms: speechToPresenceLatencyMs,
      execution_accepted_ratio01: Number(executionAcceptedRatio01.toFixed(4)),
      voice_ready_coherence: voiceCoherence
    }),
    observe_only: true
  });

  lastSample = sample;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.continuityIntegrityScore = sample;
  }
  return sample;
}

export function readLastContinuityIntegrityScoreV0() {
  return lastSample;
}

export function resetContinuityIntegrityScoreForTestV0() {
  lastSample = null;
}
