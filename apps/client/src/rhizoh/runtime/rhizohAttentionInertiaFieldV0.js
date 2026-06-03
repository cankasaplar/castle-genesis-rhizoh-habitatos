/**
 * RCAL Attention Inertia Field — motion continuity + active intent propagation.
 * Internal drift field; RESL projects — UI never binds 1:1 to raw vector.
 * @see docs/RHIZOH_ATTENTION_INERTIA_FIELD_V1.md
 */

import {
  advanceIntentPropagationV0,
  resetIntentPropagationForTestV0
} from "./rhizohAttentionIntentPropagationV0.js";


export const ATTENTION_INERTIA_SCHEMA_V0 = "castle.rhizoh.attention_inertia_field.v0";

/** EMA half-life for vector components (~2s feel). */
export const INERTIA_VECTOR_HALF_LIFE_MS_V0 = 2000;

/** Primary focus must hold this long before switch (hysteresis). */
export const INERTIA_FOCUS_HOLD_MS_V0 = 720;

/** Ring buffer horizon for continuity narrative. */
export const INERTIA_HISTORY_HORIZON_MS_V0 = 3000;

const MAX_HISTORY = 12;

let lastSampleAtMs = 0;
let smoothedVx = 0;
let smoothedVy = 0;
let smoothedMagnitude = 0;
let smoothedPrimary = "";
let smoothedSecondary = null;
let committedPrimary = "";
let candidatePrimary = "";
let candidateSinceMs = 0;
/** @type {{ atMs: number, primary: string, vx: number, vy: number }[]} */
let history = [];

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * Time-aware EMA alpha from elapsed ms and half-life.
 * @param {number} dtMs
 * @param {number} halfLifeMs
 */
function emaAlphaV0(dtMs, halfLifeMs) {
  const dt = Math.max(0, Number(dtMs) || 0);
  const hl = Math.max(200, Number(halfLifeMs) || INERTIA_VECTOR_HALF_LIFE_MS_V0);
  if (dt === 0) return 1;
  return 1 - Math.exp(-dt / hl);
}

/**
 * @param {number} prev
 * @param {number} next
 * @param {number} alpha
 */
function emaScalarV0(prev, next, alpha) {
  return prev + (next - prev) * alpha;
}

/**
 * @param {string} proposed
 * @param {number} nowMs
 */
function resolveCommittedPrimaryV0(proposed, nowMs) {
  const p = String(proposed || "").trim();
  if (!committedPrimary) {
    committedPrimary = p;
    candidatePrimary = p;
    candidateSinceMs = nowMs;
    return committedPrimary;
  }
  if (p === committedPrimary) {
    candidatePrimary = p;
    candidateSinceMs = nowMs;
    return committedPrimary;
  }
  if (p !== candidatePrimary) {
    candidatePrimary = p;
    candidateSinceMs = nowMs;
  }
  if (nowMs - candidateSinceMs >= INERTIA_FOCUS_HOLD_MS_V0) {
    committedPrimary = candidatePrimary;
  }
  return committedPrimary;
}

/**
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0>} instant
 * @param {number} [nowMs]
 */
export function applyAttentionInertiaV0(instant, nowMs = Date.now()) {
  const t = Number(nowMs) || Number(instant?.atMs) || Date.now();
  const dtMs = lastSampleAtMs > 0 ? t - lastSampleAtMs : INERTIA_VECTOR_HALF_LIFE_MS_V0;
  lastSampleAtMs = t;

  const raw = instant?.attention_vector || {};
  const focus = instant?.selective_focus || {};
  const alpha = emaAlphaV0(dtMs, INERTIA_VECTOR_HALF_LIFE_MS_V0);

  const nextVx = Number(raw.vx) || 0;
  const nextVy = Number(raw.vy) || 0;
  const nextMag = clamp01(raw.magnitude);

  if (!smoothedPrimary && !committedPrimary) {
    smoothedVx = nextVx;
    smoothedVy = nextVy;
    smoothedMagnitude = nextMag;
  } else {
    smoothedVx = emaScalarV0(smoothedVx, nextVx, alpha);
    smoothedVy = emaScalarV0(smoothedVy, nextVy, alpha);
    smoothedMagnitude = emaScalarV0(smoothedMagnitude, nextMag, alpha);
  }

  const proposedPrimary = String(focus.primary || "");
  const primary = resolveCommittedPrimaryV0(proposedPrimary, t);
  smoothedPrimary = primary;
  smoothedSecondary = focus.secondary || null;

  const propagation = advanceIntentPropagationV0(primary, proposedPrimary, instant, t);

  history.push({
    atMs: t,
    primary,
    vx: Math.round(smoothedVx * 1000) / 1000,
    vy: Math.round(smoothedVy * 1000) / 1000
  });
  const cutoff = t - INERTIA_HISTORY_HORIZON_MS_V0;
  history = history.filter((h) => h.atMs >= cutoff).slice(-MAX_HISTORY);

  const oldest = history[0];
  const motionContinuity01 =
    history.length < 2
      ? 0.5
      : clamp01(
          0.35 +
            smoothedMagnitude * 0.35 +
            (1 - (instant?.intent_drift_control?.drift01 || 0)) * 0.2 +
            (oldest && oldest.primary === primary ? 0.1 : 0)
        );

  const trail =
    history.length >= 2
      ? Object.freeze({
          from: Object.freeze({ ...history[0] }),
          to: Object.freeze({ ...history[history.length - 1] }),
          spanMs: history[history.length - 1].atMs - history[0].atMs
        })
      : null;

  return Object.freeze({
    schema: ATTENTION_INERTIA_SCHEMA_V0,
    atMs: t,
    smoothed_vector: Object.freeze({
      vx: Math.round(smoothedVx * 1000) / 1000,
      vy: Math.round(smoothedVy * 1000) / 1000,
      magnitude: Math.round(smoothedMagnitude * 1000) / 1000,
      directionLabel: instant?.directionLabel || "self_anchor"
    }),
    smoothed_focus: Object.freeze({
      primary: smoothedPrimary,
      secondary: smoothedSecondary,
      surfaceId: focus.surfaceId || null,
      intentId: focus.intentId || null
    }),
    motion_continuity01: Number(motionContinuity01.toFixed(4)),
    inertia01: Number((1 - (instant?.intent_drift_control?.drift01 || 0) * 0.7).toFixed(4)),
    horizonMs: INERTIA_HISTORY_HORIZON_MS_V0,
    trail,
    propagation,
    /** RESL-only perceptual projection input — not a UI highlight map. */
    projection: Object.freeze({
      gazeBias01: Number(smoothedMagnitude.toFixed(4)),
      driftDampen01: Number((instant?.intent_drift_control?.damped ? 0.85 : 1).toFixed(4)),
      transitionStretchMs: instant?.intent_drift_control?.damped ? 120 : 0,
      directionPersist01: propagation.direction_persist01,
      narrativeHint: propagation.why_looking.label_tr
    })
  });
}

export function readAttentionInertiaSnapshotV0() {
  return {
    smoothedVx,
    smoothedVy,
    committedPrimary,
    historyLen: history.length
  };
}

export function resetAttentionInertiaForTestV0() {
  lastSampleAtMs = 0;
  smoothedVx = 0;
  smoothedVy = 0;
  smoothedMagnitude = 0;
  smoothedPrimary = "";
  smoothedSecondary = null;
  committedPrimary = "";
  candidatePrimary = "";
  candidateSinceMs = 0;
  history = [];
  resetIntentPropagationForTestV0();
}
