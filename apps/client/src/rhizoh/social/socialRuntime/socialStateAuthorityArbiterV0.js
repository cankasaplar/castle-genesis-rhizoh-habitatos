/**
 * SPECFLOW: CORE-ELIGIBLE — single merge authority for socialRuntimeV1.
 *
 * Event layer = hard truth (user touch). Tick layer = soft drift (silence / presence).
 * Arbiter resolves conflict: after a hard event, **mode + ambient ping stay locked** for
 * `SOCIAL_ARB_EVENT_AUTHORITY_MS`, while initiative drift uses a **deterministic blend ramp**
 * (not RNG) so the system does not go fully rigid (“authority rigidity”).
 *
 * Initiative uses a **separate concave curve** (`SOCIAL_ARB_INITIATIVE_BLEND_GAMMA` < 1) so the
 * linear time-blend does not over-damp early ticks (“over-smoothing”): mode/ping stay strict,
 * initiative catches up a bit faster while still respecting the window.
 *
 * ## Curve drift stacking (guardrail)
 *
 * This module already composes: **linear time blend** (`socialAuthorityTickBlend01`) × **power
 * curve** (`socialAuthorityInitiativeScale01`) on the same clock. If future work adds more
 * nonlinear layers (e.g. memory weight, trust ramp, separate “mood” curves) **without** an
 * explicit merge order and tests, behavior can become hard to reason about (“feels good but
 * unpredictable”). Policy: keep **one named composition path** per scalar merge; prefer
 * additive / piecewise-linear boundaries; if you must multiply curves, document order + add
 * golden tests; avoid stacking opaque exponentials on the same initiative tick.
 */

import { SOCIAL_MODE_V0 } from "./socialModeStateMachineV0.js";
import { evaluateSocialPresenceTickV0 } from "./evaluateSocialPresenceTickV0.js";

/** Tick cannot override initiative/mode/ping for this long after a hard user event. */
export const SOCIAL_ARB_EVENT_AUTHORITY_MS = 6_000;

/**
 * Initiative-only easing on top of linear `blend01`. Gamma < 1 → concave: more initiative
 * drift allowed early (less “mushy / delayed” social energy). Gamma === 1 → pure linear.
 * Does not apply to mode or ping (those stay binary until blend === 1).
 */
export const SOCIAL_ARB_INITIATIVE_BLEND_GAMMA = 0.58;

const DEFAULT_INITIATIVE = 0.55;
const EVENT_INITIATIVE_BUMP = 0.05;

/**
 * @param {Record<string, unknown>|null|undefined} prevSr
 * @returns {Record<string, unknown>}
 */
function clonePrevSr(prevSr) {
  return prevSr && typeof prevSr === "object" ? { ...prevSr } : {};
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/**
 * Linear ramp 0 → 1 over the authority window. Deterministic (not probabilistic).
 *
 * @param {number} msSinceHardEvent
 * @returns {number}
 */
export function socialAuthorityTickBlend01(msSinceHardEvent) {
  let ms = Number(msSinceHardEvent);
  if (!Number.isFinite(ms)) return 1;
  if (ms >= SOCIAL_ARB_EVENT_AUTHORITY_MS) return 1;
  if (ms <= 0) return 0;
  return clamp01(ms / SOCIAL_ARB_EVENT_AUTHORITY_MS);
}

/**
 * Scales raw tick initiative delta inside the authority window (deterministic).
 * See file header: **stacking** — do not multiply further curves here without revisiting the
 * composition contract.
 *
 * @param {number} blend01 — linear time authority 0..1
 * @returns {number}
 */
export function socialAuthorityInitiativeScale01(blend01) {
  const b = clamp01(Number(blend01) || 0);
  if (b <= 0) return 0;
  if (b >= 1) return 1;
  const g = Number(SOCIAL_ARB_INITIATIVE_BLEND_GAMMA);
  const gamma = Number.isFinite(g) && g > 0 && g <= 2 ? g : 0.58;
  return clamp01(b ** gamma);
}

/**
 * Hard user interaction — always wins over any pending tick proposal for the same instant.
 *
 * @param {{ prevSr?: Record<string, unknown>|null, nowMs?: number }} input
 */
export function applySocialArbiterEventV0(input) {
  const nowMs = Math.max(0, Number(input.nowMs) || Date.now());
  const prev = clonePrevSr(input.prevSr);
  const base = Number.isFinite(Number(prev.initiativeBudget01))
    ? Number(prev.initiativeBudget01)
    : DEFAULT_INITIATIVE;
  const nextB = Math.min(1, Math.max(0, base + EVENT_INITIATIVE_BUMP));
  return {
    skipPersistence: false,
    nextSr: {
      ...prev,
      initiativeBudget01: Math.round(nextB * 1000) / 1000,
      initiativeLastUpdatedAt: nowMs,
      lastUserActivityAt: nowMs,
      socialAuthorityLastHardEventAt: nowMs,
      socialAuthoritySource: "event"
    },
    didModeChange: false,
    shouldEmitAmbientPing: false,
    arbiter: { layer: "event", hardEvent: true }
  };
}

/**
 * Time-driven drift. Full tick (mode + ping + initiative) only when blend === 1.
 * Inside the authority window, only **scaled initiative delta** applies (gradient micro-drift).
 *
 * @param {{
 *   prevSr?: Record<string, unknown>|null,
 *   nowMs?: number,
 *   silenceMs: number,
 *   msSinceHardEvent: number
 * }} input
 */
export function applySocialArbiterTickV0(input) {
  const nowMs = Math.max(0, Number(input.nowMs) || Date.now());
  const silenceMs = Math.max(0, Number(input.silenceMs) || 0);
  let msSince = Number(input.msSinceHardEvent);
  if (!Number.isFinite(msSince)) msSince = Number.POSITIVE_INFINITY;

  const prev = clonePrevSr(input.prevSr);
  const mode = String(prev.mode || SOCIAL_MODE_V0.IDLE).toUpperCase();
  const initiativeBudget01 = Number.isFinite(Number(prev.initiativeBudget01))
    ? Number(prev.initiativeBudget01)
    : DEFAULT_INITIATIVE;

  const signal = evaluateSocialPresenceTickV0({
    nowMs,
    silenceMs,
    mode,
    initiativeBudget01
  });

  const blend01 = socialAuthorityTickBlend01(msSince);

  if (blend01 <= 0) {
    return {
      skipPersistence: true,
      nextSr: prev,
      didModeChange: false,
      shouldEmitAmbientPing: false,
      signal,
      arbiter: { layer: "tick", authorityPhase: "locked", blend01: 0, msSinceHardEvent: msSince }
    };
  }

  if (blend01 < 1) {
    const rawDelta = Number(signal.initiativeDelta) || 0;
    const initiativeScale01 = socialAuthorityInitiativeScale01(blend01);
    const scaledDelta = rawDelta * initiativeScale01;
    const nextInit = Math.min(1, Math.max(0, initiativeBudget01 + scaledDelta));
    const roundedInit = Math.round(nextInit * 1000) / 1000;
    if (roundedInit === initiativeBudget01) {
      return {
        skipPersistence: true,
        nextSr: prev,
        didModeChange: false,
        shouldEmitAmbientPing: false,
        signal,
        arbiter: {
          layer: "tick",
          authorityPhase: "gradient",
          blend01,
          initiativeScale01,
          msSinceHardEvent: msSince,
          gradientNoop: true
        }
      };
    }
    return {
      skipPersistence: false,
      nextSr: {
        ...prev,
        initiativeBudget01: roundedInit,
        initiativeLastUpdatedAt: nowMs,
        lastSocialPresenceTickAt: signal.tickAt,
        socialAuthoritySource: "tick_gradient",
        socialAuthorityTickBlend01: Math.round(blend01 * 1000) / 1000,
        socialAuthorityInitiativeScale01: Math.round(initiativeScale01 * 1000) / 1000
      },
      didModeChange: false,
      shouldEmitAmbientPing: false,
      signal,
      arbiter: {
        layer: "tick",
        authorityPhase: "gradient",
        blend01,
        initiativeScale01,
        msSinceHardEvent: msSince
      }
    };
  }

  const nextInit = Math.min(
    1,
    Math.max(0, initiativeBudget01 + (Number(signal.initiativeDelta) || 0))
  );
  const roundedInit = Math.round(nextInit * 1000) / 1000;
  let appliedMode = mode;
  let didModeChange = false;
  if (signal.nextMode && String(signal.nextMode).toUpperCase() !== mode) {
    appliedMode = String(signal.nextMode).toUpperCase();
    didModeChange = true;
  }

  return {
    skipPersistence: false,
    nextSr: {
      ...prev,
      mode: appliedMode,
      initiativeBudget01: roundedInit,
      initiativeLastUpdatedAt: nowMs,
      lastSocialPresenceTickAt: signal.tickAt,
      ...(didModeChange ? { lastModeAt: nowMs } : {}),
      socialAuthoritySource: "tick",
      socialAuthorityTickBlend01: 1
    },
    didModeChange,
    shouldEmitAmbientPing: !!signal.shouldAmbientPing,
    signal,
    arbiter: { layer: "tick", authorityPhase: "open", blend01: 1, msSinceHardEvent: msSince }
  };
}
