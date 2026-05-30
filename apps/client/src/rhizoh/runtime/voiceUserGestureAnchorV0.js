/**
 * Chrome Speech API is user-initiated / episodic — gesture anchor + decay curve.
 *
 * Authority (STT start / auto-restart): binary gesture window only (active vs expired).
 * Decay bands (full / partial / manual_confirm) are UI advisory — never restart authority.
 *
 * Decay curve (strength = f(timeSinceLastGesture)) — advisory only:
 *   0–5s   → full
 *   5–15s  → partial hint
 *   15–30s → manual hint
 *   30s+   → expired (mic tap required for STT)
 */

export const VOICE_USER_GESTURE_WINDOW_MS = 30_000;
export const GESTURE_DECAY_FULL_MS = 5_000;
export const GESTURE_DECAY_PARTIAL_MS = 15_000;
export const GESTURE_DECAY_MANUAL_MS = 30_000;

let lastUserGestureAtMs = typeof Date !== "undefined" ? Date.now() : 0;
/** @type {string} */
let lastUserGestureSource = "boot";

/**
 * @param {number} ageMs
 * @returns {number} 0..1
 */
export function computeVoiceGestureStrengthV0(ageMs) {
  const age = Math.max(0, ageMs);
  if (age < GESTURE_DECAY_FULL_MS) return 1;
  if (age < GESTURE_DECAY_PARTIAL_MS) {
    const t = (age - GESTURE_DECAY_FULL_MS) / (GESTURE_DECAY_PARTIAL_MS - GESTURE_DECAY_FULL_MS);
    return 1 - t * 0.4;
  }
  if (age < GESTURE_DECAY_MANUAL_MS) {
    const t = (age - GESTURE_DECAY_PARTIAL_MS) / (GESTURE_DECAY_MANUAL_MS - GESTURE_DECAY_PARTIAL_MS);
    return 0.6 - t * 0.4;
  }
  return 0;
}

/**
 * @param {number} [nowMs]
 * @returns {{
 *   level: 'full' | 'partial' | 'manual_confirm' | 'expired',
 *   strength: number,
 *   ageMs: number,
 *   canAutoRestart: boolean,
 *   needsManualConfirm: boolean,
 *   source: string
 * }}
 */
export function getVoiceGestureTrustV0(nowMs = Date.now()) {
  const ageMs = Math.max(0, nowMs - lastUserGestureAtMs);
  const strength = computeVoiceGestureStrengthV0(ageMs);
  /** @type {'full' | 'partial' | 'manual_confirm' | 'expired'} */
  let level;
  if (ageMs < GESTURE_DECAY_FULL_MS) level = "full";
  else if (ageMs < GESTURE_DECAY_PARTIAL_MS) level = "partial";
  else if (ageMs < GESTURE_DECAY_MANUAL_MS) level = "manual_confirm";
  else level = "expired";

  const active = ageMs < GESTURE_DECAY_MANUAL_MS;
  return Object.freeze({
    level,
    strength: Number(strength.toFixed(3)),
    ageMs,
    canAutoRestart: active,
    needsManualConfirm: !active,
    hasActiveGesture: active,
    source: lastUserGestureSource
  });
}

/** Binary STT authority — gesture within 30s window (decay band is irrelevant). */
export function hasActiveVoiceUserGestureV0(nowMs = Date.now()) {
  return Math.max(0, nowMs - lastUserGestureAtMs) < GESTURE_DECAY_MANUAL_MS;
}

/** UI-only decay band — never gates STT restart. */
export function getVoiceGestureAdvisoryV0(nowMs = Date.now()) {
  const trust = getVoiceGestureTrustV0(nowMs);
  return Object.freeze({
    level: trust.level,
    strength: trust.strength,
    ageMs: trust.ageMs,
    hintKey:
      trust.level === "partial" || trust.level === "manual_confirm"
        ? "gesture_soft_rebind"
        : trust.level === "expired"
          ? "gesture_rebind"
          : null
  });
}

/**
 * @param {string} [source]
 */
export function stampVoiceUserGestureV0(source = "unknown") {
  lastUserGestureAtMs = Date.now();
  lastUserGestureSource = String(source || "unknown").slice(0, 64);
  publishVoiceGestureAnchorToWindowV0();
}

/** @param {number} [nowMs] */
export function canRestartVoiceSttV0(nowMs = Date.now()) {
  return hasActiveVoiceUserGestureV0(nowMs);
}

/** @param {number} [nowMs] */
export function getVoiceGestureAnchorSnapshotV0(nowMs = Date.now()) {
  const trust = getVoiceGestureTrustV0(nowMs);
  return Object.freeze({
    lastAtMs: lastUserGestureAtMs,
    lastGestureAt: lastUserGestureAtMs,
    ageMs: trust.ageMs,
    source: trust.source,
    windowMs: VOICE_USER_GESTURE_WINDOW_MS,
    decay: Object.freeze({
      fullMs: GESTURE_DECAY_FULL_MS,
      partialMs: GESTURE_DECAY_PARTIAL_MS,
      manualMs: GESTURE_DECAY_MANUAL_MS
    }),
    trustLevel: trust.level,
    strength: trust.strength,
    hasActiveGesture: trust.hasActiveGesture,
    canAutoRestart: trust.hasActiveGesture,
    needsManualConfirm: !trust.hasActiveGesture,
    canRestart: trust.hasActiveGesture
  });
}

/** Merge-safe publish — AppRhizoh528 must not replace window.__rhizoh wholesale. */
export function publishVoiceGestureAnchorToWindowV0(nowMs = Date.now()) {
  const snap = getVoiceGestureAnchorSnapshotV0(nowMs);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.voiceGestureAnchor = snap;
  }
  return snap;
}

/** UI copy for partial-trust controlled restart. */
export function voiceGesturePartialTrustHintTrV0() {
  return "Dinlemeye devam ediyorum. Gerekirse mikrofona tekrar dokun.";
}

/**
 * Passive listeners — refreshes gesture anchor for mic-adjacent interactions.
 * @returns {() => void}
 */
export function installVoiceUserGestureListenersV0() {
  if (typeof window === "undefined") return () => {};
  if (window.__CASTLE_VOICE_GESTURE_LISTENERS__) return () => {};
  window.__CASTLE_VOICE_GESTURE_LISTENERS__ = true;

  const onGesture = (source) => {
    stampVoiceUserGestureV0(source);
  };

  const onPointer = () => onGesture("pointer");
  const onKey = () => onGesture("keypress");
  const onTouch = () => onGesture("touch");

  window.addEventListener("pointerdown", onPointer, { passive: true, capture: true });
  window.addEventListener("keydown", onKey, { passive: true, capture: true });
  window.addEventListener("touchstart", onTouch, { passive: true, capture: true });

  return () => {
    window.removeEventListener("pointerdown", onPointer, true);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("touchstart", onTouch, true);
    delete window.__CASTLE_VOICE_GESTURE_LISTENERS__;
  };
}

export function resetVoiceUserGestureAnchorForTestV0() {
  lastUserGestureAtMs = Date.now();
  lastUserGestureSource = "test_reset";
}
