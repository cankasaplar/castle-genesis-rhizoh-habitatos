import { isWithinFirst3sContinuityWindowV0 } from "./rhizohFirst3sCoherenceStabilityV0.js";

/**
 * Temporal Drift Guard v0 — CCF↔ECC phase coherence insurance (not a feature layer).
 * Guarantees frame (CCF) and motion (ECC) do not slip out of phase.
 * @see docs/RHIZOH_TEMPORAL_DRIFT_GUARD_V0.md
 */

import { ECC_MICRO_TRANSITION_V0 } from "./rhizohExperienceContinuityCompilerV0.js";

export const TDG_SCHEMA_V0 = "castle.rhizoh.temporal_drift_guard.v0";

export const RHIZOH_TEMPORAL_DRIFT_GUARD_EVENT_V0 = "rhizoh:temporal-drift-guard-v0";

export const TDG_DRIFT_CLASS_V0 = Object.freeze({
  NONE: "none",
  FRAME_MOTION_SLIP: "frame_motion_slip",
  MOTION_WITHOUT_FRAME: "motion_without_frame",
  VELOCITY_JUMP: "velocity_jump",
  COMPOUND: "compound"
});

const VELOCITY_JUMP_THRESHOLD_V0 = 0.26;
const FAST_HOLD_MISMATCH_V0 = 0.52;

/** @type {ReturnType<typeof deriveTemporalDriftGuardV0> | null} */
let lastGuard = null;
let lastCcfNowId = null;
let lastStreamId = null;
let lastNarrativeVelocity01 = 0.35;
let lastMicroKind = ECC_MICRO_TRANSITION_V0.HOLD;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0>} ecc
 * @param {ReturnType<import("./rhizohCognitiveCollapseFunctionV0.js").collapseCognitiveExperienceV0> | null} ccf
 */
function measureTemporalDriftV0(ecc, ccf) {
  const ccfNowId = ccf?.experiential_now_id || null;
  const streamId = ecc?.stream_coherence_id || null;
  const microKind = ecc?.micro_transition?.kind || ECC_MICRO_TRANSITION_V0.HOLD;
  const velocity01 = clamp01(ecc?.narrative_velocity);

  const ccfChanged = Boolean(lastCcfNowId && ccfNowId && lastCcfNowId !== ccfNowId);
  const streamChanged = Boolean(lastStreamId && streamId && lastStreamId !== streamId);

  let slip01 = 0;
  const classes = [];

  if (ccfChanged && microKind === ECC_MICRO_TRANSITION_V0.HOLD && velocity01 > FAST_HOLD_MISMATCH_V0) {
    slip01 += 0.38;
    classes.push(TDG_DRIFT_CLASS_V0.FRAME_MOTION_SLIP);
  }
  if (
    !ccfChanged &&
    ccfNowId &&
    (microKind === ECC_MICRO_TRANSITION_V0.SHIFT || microKind === ECC_MICRO_TRANSITION_V0.DRIFT) &&
    velocity01 > 0.58
  ) {
    slip01 += 0.32;
    classes.push(TDG_DRIFT_CLASS_V0.MOTION_WITHOUT_FRAME);
  }
  if (Math.abs(velocity01 - lastNarrativeVelocity01) > VELOCITY_JUMP_THRESHOLD_V0) {
    slip01 += 0.28;
    classes.push(TDG_DRIFT_CLASS_V0.VELOCITY_JUMP);
  }
  if (streamChanged && !ccfChanged && velocity01 > 0.5) {
    slip01 += 0.15;
  }

  const drift_magnitude01 = clamp01(slip01);
  const drift_class =
    classes.length > 1
      ? TDG_DRIFT_CLASS_V0.COMPOUND
      : classes[0] || TDG_DRIFT_CLASS_V0.NONE;

  return Object.freeze({
    drift_magnitude01: Number(drift_magnitude01.toFixed(4)),
    drift_class,
    ccf_changed: ccfChanged,
    stream_changed: streamChanged,
    micro_kind: microKind,
    velocity01
  });
}

/**
 * Soft ECC-only corrections — never re-invoke CCF.
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0>} ecc
 * @param {ReturnType<typeof measureTemporalDriftV0>} measure
 */
function applyGuardCorrectionsV0(ecc, measure) {
  const vel = measure.velocity01;
  const inFirst3s = isWithinFirst3sContinuityWindowV0();
  const priorWeight = inFirst3s ? 0.78 : 0.45;
  const smoothedVelocity = Number(
    (lastNarrativeVelocity01 * priorWeight + vel * (1 - priorWeight)).toFixed(4)
  );

  const micro = ecc.micro_transition;
  const undertoneDampen = measure.drift_magnitude01 > 0.32 ? 0.72 : 1;
  const microCorrected = Object.freeze({
    ...micro,
    undertone_weight01: Number(
      (clamp01(micro.undertone_weight01) * undertoneDampen).toFixed(4)
    ),
    kind:
      measure.drift_class === TDG_DRIFT_CLASS_V0.FRAME_MOTION_SLIP
        ? ECC_MICRO_TRANSITION_V0.SETTLE
        : micro.kind
  });

  const fade = ecc.fade_semantics;
  const stretchMs = Math.round(60 + measure.drift_magnitude01 * 120);
  const fadeCorrected = Object.freeze({
    ...fade,
    durationMs: Math.round((fade.durationMs || 400) + stretchMs),
    delayMs: Math.round((fade.delayMs || 0) + stretchMs * 0.35),
    phase_lock: true
  });

  return Object.freeze({
    ...ecc,
    narrative_velocity: smoothedVelocity,
    micro_transition: microCorrected,
    fade_semantics: fadeCorrected
  });
}

/**
 * CCF (frame) + ECC (motion) phase coherence — continuity insurance.
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0>} ecc
 * @param {ReturnType<import("./rhizohCognitiveCollapseFunctionV0.js").collapseCognitiveExperienceV0> | null} [ccf]
 * @param {number} [nowMs]
 */
export function applyTemporalDriftGuardV0(ecc, ccf = null, nowMs = Date.now()) {
  const atMs = Number(nowMs) || Date.now();

  if (!ecc?.continuity_line || !ccf) {
    const idle = Object.freeze({
      schema: TDG_SCHEMA_V0,
      atMs,
      phase_coherence_ok: true,
      drift_magnitude01: 0,
      drift_class: TDG_DRIFT_CLASS_V0.NONE,
      corrections_applied: false,
      insurance_only: true
    });
    lastGuard = idle;
    return Object.freeze({ ...ecc, temporal_guard: idle });
  }

  const measure = measureTemporalDriftV0(ecc, ccf);
  const phase_coherence_ok = measure.drift_magnitude01 < 0.38;
  const corrections_applied = !phase_coherence_ok;

  let guardedEcc = ecc;
  if (corrections_applied) {
    guardedEcc = applyGuardCorrectionsV0(ecc, measure);
  }

  const guard = Object.freeze({
    schema: TDG_SCHEMA_V0,
    atMs,
    phase_coherence_ok,
    drift_magnitude01: measure.drift_magnitude01,
    drift_class: measure.drift_class,
    corrections_applied,
    insurance_only: true,
    ccf_now_id: ccf.experiential_now_id,
    stream_coherence_id: ecc.stream_coherence_id,
    frame_motion_aligned: phase_coherence_ok
  });

  lastCcfNowId = ccf.experiential_now_id;
  lastStreamId = guardedEcc.stream_coherence_id;
  lastNarrativeVelocity01 = guardedEcc.narrative_velocity;
  lastMicroKind = guardedEcc.micro_transition.kind;
  lastGuard = guard;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.temporalDriftGuard = guard;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_TEMPORAL_DRIFT_GUARD_EVENT_V0, {
          detail: Object.freeze({ guard, ecc: guardedEcc })
        })
      );
    } catch {
      /* noop */
    }
  }

  return Object.freeze({
    ...guardedEcc,
    temporal_guard: guard,
    stream_coherence_id: phase_coherence_ok
      ? guardedEcc.stream_coherence_id
      : `${guardedEcc.stream_coherence_id}:tdg`
  });
}

export function deriveTemporalDriftGuardV0(ecc, ccf, nowMs) {
  return applyTemporalDriftGuardV0(ecc, ccf, nowMs).temporal_guard;
}

export function readLastTemporalDriftGuardV0() {
  return lastGuard;
}

export function resetTemporalDriftGuardForTestV0() {
  lastGuard = null;
  lastCcfNowId = null;
  lastStreamId = null;
  lastNarrativeVelocity01 = 0.35;
  lastMicroKind = ECC_MICRO_TRANSITION_V0.HOLD;
}
