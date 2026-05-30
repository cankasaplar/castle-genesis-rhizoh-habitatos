/**
 * Response Pressure Dynamics V0 — RESEARCH-ONLY
 * Static base pressure → time-varying field (silence ↓, shared_focus ↑, noise collapse).
 */

import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";

const SHARED_FOCUS_TYPE = "shared_focus";

export const VOICE_RESPONSE_PRESSURE_DYNAMICS_SCHEMA =
  "castle.rhizoh.voice_response_pressure_dynamics.v0";

const SILENCE_DECAY_PER_30S = 0.08;
const SILENCE_DECAY_MAX = 0.35;
const SHARED_FOCUS_BOOST = 0.12;
const NOISE_COLLAPSE_FACTOR = 0.15;
const NOISE_COLLAPSE_MS = 45_000;
const PRESSURE_FLOOR = 0.02;

/** @type {{ lastSpeechAtMs: number, silenceMs: number, sharedFocusStreak: number, ambientStreak: number, noiseCollapseUntilMs: number, samples: number[] }} */
const state = {
  lastSpeechAtMs: 0,
  silenceMs: 0,
  sharedFocusStreak: 0,
  ambientStreak: 0,
  noiseCollapseUntilMs: 0,
  samples: []
};

const RING_MAX = 32;

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n)));
}

/**
 * @param {{
 *   atMs?: number,
 *   basePressure?: number,
 *   pressureCap?: number,
 *   sharedAttentionType?: string,
 *   band?: string,
 *   event?: "speech" | "silence" | "ambient_noise" | "stream_empty",
 *   text?: string
 * }} input
 */
export function tickResponsePressureDynamicsV0(input = {}) {
  const atMs = Number(input.atMs) > 0 ? Number(input.atMs) : Date.now();
  const base = clamp01(input.basePressure ?? 0.25);
  const cap = clamp01(input.pressureCap ?? 0.45);
  const event = String(input.event || "speech");
  const band = String(input.band || "");
  const sharedType = String(input.sharedAttentionType || "");
  const text = String(input.text || "").trim();

  const deltas = {
    silence: 0,
    sharedFocus: 0,
    noiseCollapse: 1,
    capApplied: cap
  };

  if (event === "speech" && text) {
    state.lastSpeechAtMs = atMs;
    state.silenceMs = 0;
    state.ambientStreak = 0;
  } else if (event === "silence" || event === "stream_empty") {
    if (state.lastSpeechAtMs > 0) {
      state.silenceMs = Math.max(state.silenceMs, atMs - state.lastSpeechAtMs);
    } else {
      state.silenceMs += 5000;
    }
  }

  if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT || event === "ambient_noise") {
    state.ambientStreak += 1;
    state.noiseCollapseUntilMs = atMs + NOISE_COLLAPSE_MS;
  } else if (event === "speech" && band !== VOICE_DIRECTED_SPEECH_BAND.AMBIENT) {
    state.ambientStreak = Math.max(0, state.ambientStreak - 1);
  }

  if (sharedType === SHARED_FOCUS_TYPE) {
    state.sharedFocusStreak += 1;
    deltas.sharedFocus = SHARED_FOCUS_BOOST;
  } else {
    state.sharedFocusStreak = Math.max(0, state.sharedFocusStreak - 1);
  }

  const silenceDecay = Math.min(
    SILENCE_DECAY_MAX,
    (state.silenceMs / 30_000) * SILENCE_DECAY_PER_30S
  );
  deltas.silence = -silenceDecay;

  let pressure = base + deltas.sharedFocus + deltas.silence;

  if (atMs < state.noiseCollapseUntilMs || state.ambientStreak >= 2) {
    deltas.noiseCollapse = NOISE_COLLAPSE_FACTOR;
    pressure *= NOISE_COLLAPSE_FACTOR;
  }

  pressure = Math.max(PRESSURE_FLOOR, Math.min(cap, pressure));
  state.samples.push(pressure);
  if (state.samples.length > RING_MAX) state.samples.shift();

  const snapshot = Object.freeze({
    silenceMs: state.silenceMs,
    sharedFocusStreak: state.sharedFocusStreak,
    ambientStreak: state.ambientStreak,
    noiseCollapseActive: atMs < state.noiseCollapseUntilMs,
    recentSamples: Object.freeze([...state.samples])
  });

  return Object.freeze({
    schema: VOICE_RESPONSE_PRESSURE_DYNAMICS_SCHEMA,
    staticBasePressure: base,
    dynamicPressure: pressure,
    pressureCap: cap,
    deltas: Object.freeze(deltas),
    state: snapshot,
    atMs,
    policyAuthority: "observation_only"
  });
}

export function resetResponsePressureDynamicsForTestV0() {
  state.lastSpeechAtMs = 0;
  state.silenceMs = 0;
  state.sharedFocusStreak = 0;
  state.ambientStreak = 0;
  state.noiseCollapseUntilMs = 0;
  state.samples.length = 0;
}

export function getResponsePressureDynamicsSnapshotV0() {
  return Object.freeze({
    schema: VOICE_RESPONSE_PRESSURE_DYNAMICS_SCHEMA,
    ...state,
    samples: Object.freeze([...state.samples])
  });
}
