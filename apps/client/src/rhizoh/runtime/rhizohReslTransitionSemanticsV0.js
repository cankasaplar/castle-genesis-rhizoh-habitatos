/**
 * RESL transition feel — product perception layer (not RPSE truth).
 * @see docs/RHIZOH_RESL_V1_UI_SURFACE_SPEC.md §5–§7
 */

import {
  RHIZOH_ATTENTION_V0,
  RHIZOH_SILENCE_FORM_V0
} from "./rhizohPresenceStateEngineV0.js";

export const RESL_FADE_CURVE_V0 = Object.freeze({
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",
  LINEAR: "linear"
});

/** @typedef {'ease-out'|'ease-in-out'|'linear'} ReslFadeCurveV0 */

let lastSilenceFormForTransitionV0 = "absent";

/**
 * @param {string} next
 */
export function noteReslSilenceFormForTransitionV0(next) {
  lastSilenceFormForTransitionV0 = String(next || RHIZOH_SILENCE_FORM_V0.ABSENT);
}

export function resetReslTransitionSemanticsForTestV0() {
  lastSilenceFormForTransitionV0 = RHIZOH_SILENCE_FORM_V0.ABSENT;
}

/**
 * @param {string} prev
 * @param {string} next
 * @param {string} attention
 * @param {{ prefersReducedMotion?: boolean }} [opts]
 */
export function resolveTransitionFeelV0(prev, next, attention, opts = {}) {
  const reduced = opts.prefersReducedMotion === true;
  const p = String(prev || RHIZOH_SILENCE_FORM_V0.ABSENT);
  const n = String(next || RHIZOH_SILENCE_FORM_V0.ABSENT);
  const att = String(attention || RHIZOH_ATTENTION_V0.IDLE);

  let durationMs = 400;
  let delayMs = 0;
  let curve = RESL_FADE_CURVE_V0.EASE_OUT;
  let attentionDecay01 = 0.08;
  let felDampen01 = 0;
  let reEngagePulse = false;

  if (n === RHIZOH_SILENCE_FORM_V0.ABSENT) {
    return Object.freeze({
      durationMs: reduced ? 200 : 280,
      delayMs: 0,
      curve: RESL_FADE_CURVE_V0.EASE_OUT,
      attentionDecay01: 0.2,
      felDampen01: 0,
      reEngagePulse: false
    });
  }

  if (p === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION && n === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE) {
    durationMs = reduced ? 320 : 520;
    delayMs = reduced ? 40 : 120;
    curve = RESL_FADE_CURVE_V0.EASE_IN_OUT;
    attentionDecay01 = 0.18;
    felDampen01 = 0.92;
    reEngagePulse = !reduced;
  } else if (
    (p === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE || p === RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD) &&
    n === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION
  ) {
    durationMs = reduced ? 240 : 280;
    delayMs = 0;
    curve = RESL_FADE_CURVE_V0.EASE_OUT;
    attentionDecay01 = 0.05;
    felDampen01 = 0.35;
    reEngagePulse = false;
  } else if (
    p === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE &&
    (n === RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD || att === RHIZOH_ATTENTION_V0.LISTENING)
  ) {
    durationMs = reduced ? 280 : 320;
    delayMs = reduced ? 0 : 60;
    curve = RESL_FADE_CURVE_V0.EASE_OUT;
    attentionDecay01 = 0.04;
    felDampen01 = 0;
    reEngagePulse = !reduced;
  } else if (
    (p === RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD || att === RHIZOH_ATTENTION_V0.LISTENING) &&
    n === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE
  ) {
    durationMs = reduced ? 360 : 480;
    delayMs = reduced ? 80 : 140;
    curve = RESL_FADE_CURVE_V0.EASE_IN_OUT;
    attentionDecay01 = 0.14;
    felDampen01 = 0;
    reEngagePulse = false;
  } else if (n === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE) {
    durationMs = reduced ? 300 : 400;
    delayMs = reduced ? 0 : 80;
    attentionDecay01 = 0.1;
  } else if (n === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION) {
    durationMs = reduced ? 200 : 260;
    felDampen01 = 0.5;
  }

  return Object.freeze({
    durationMs,
    delayMs,
    curve,
    attentionDecay01: Math.max(0, Math.min(1, attentionDecay01)),
    felDampen01: Math.max(0, Math.min(1, felDampen01)),
    reEngagePulse
  });
}

/**
 * @param {string} silenceForm
 * @param {string} attention
 * @param {{ prefersReducedMotion?: boolean }} [opts]
 */
export function resolveTransitionFeelFromPresenceV0(silenceForm, attention, opts = {}) {
  const prev = lastSilenceFormForTransitionV0;
  const next = String(silenceForm || RHIZOH_SILENCE_FORM_V0.ABSENT);
  const feel = resolveTransitionFeelV0(prev, next, attention, opts);
  lastSilenceFormForTransitionV0 = next;
  return feel;
}
