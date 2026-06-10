/**
 * GHOST_STATE_ENGINE_V1 — semantic → experiential layer (presentation bias only).
 *
 * Design lock:
 *   Ghost output üretmez — yalnızca presentation bias (animasyon, tempo, ton ipucu).
 *   Chain: Fox → Ghost State → Rhizoh → Response
 *
 * Fox = context physics · Rhizoh = dialogue continuity · Ghost = visible presence feel
 */

import { FOX_BEHAVIOR_POSTURE_V1 } from "./foxSignificanceEngineV1.js";

export const GHOST_STATE_ENGINE_SCHEMA_V1 = "castle.rhizoh.ghost_state_engine.v1";
export const GHOST_PRESENTATION_BIAS_SCHEMA_V1 = "castle.rhizoh.ghost_presentation_bias.v1";
export const RHIZOH_GHOST_PRESENTATION_EVENT_V1 = "rhizoh:ghost-presentation-v1";

export const GHOST_IDLE_BEHAVIOR_V1 = Object.freeze({
  CALM_REST: "calm_rest",
  SOFT_IDLE: "soft_idle",
  RESTLESS_SCAN: "restless_scan"
});

export const GHOST_GAZE_DIRECTION_V1 = Object.freeze({
  USER: "user",
  HOLD: "hold",
  HORIZON: "horizon",
  SCAN: "scan"
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function round3(n) {
  return Math.round(clamp01(n) * 1000) / 1000;
}

/**
 * @param {{
 *   ghostState?: { curiosity?: number, focus?: number, alertness?: number, comfort?: number, continuity?: number },
 *   dialogueThread?: { dialogueCurve?: { continuity?: number, tension?: number, momentum?: string } } | null,
 *   behaviorPosture?: { posture?: string } | null,
 *   foxContinuityPressure?: { pressure?: number } | null
 * }} input
 */
export function resolveGhostPresentationBiasV1(input = {}) {
  const gs = input.ghostState && typeof input.ghostState === "object" ? input.ghostState : {};
  const comfort = clamp01(gs.comfort);
  const curiosity = clamp01(gs.curiosity);
  const alertness = clamp01(gs.alertness);
  const focus = clamp01(gs.focus);
  const thread =
    input.dialogueThread && typeof input.dialogueThread === "object" ? input.dialogueThread : null;
  const continuity = clamp01(
    gs.continuity ?? input.foxContinuityPressure?.pressure ?? thread?.dialogueCurve?.continuity
  );
  const tension = clamp01(thread?.dialogueCurve?.tension);
  const posture = String(input.behaviorPosture?.posture || "");

  let idleBehavior = GHOST_IDLE_BEHAVIOR_V1.SOFT_IDLE;
  if (comfort >= 0.62) idleBehavior = GHOST_IDLE_BEHAVIOR_V1.CALM_REST;
  else if (comfort < 0.38 || alertness >= 0.58) idleBehavior = GHOST_IDLE_BEHAVIOR_V1.RESTLESS_SCAN;

  const focusDrift =
    curiosity >= 0.52 ? "active_drift" : curiosity >= 0.28 ? "soft_drift" : "stable";
  const microScan =
    alertness >= 0.55 ? "elevated" : alertness >= 0.32 ? "occasional" : "minimal";
  const gazeHold =
    focus >= 0.55 || continuity >= 0.58 ? "locked" : focus >= 0.32 ? "soft_hold" : "wander";

  const pauseDurationMs = Math.round(180 + comfort * 420 + alertness * 140 + tension * 120);
  const typingDelayMs = Math.round(40 + comfort * 95 + focus * 55 + alertness * 35);
  const animationBias =
    alertness >= 0.55 ? "alert" : comfort >= 0.6 ? "calm" : curiosity >= 0.45 ? "curious" : "neutral";

  let gazeDirection = GHOST_GAZE_DIRECTION_V1.HORIZON;
  if (gazeHold === "locked") gazeDirection = GHOST_GAZE_DIRECTION_V1.HOLD;
  else if (microScan === "elevated") gazeDirection = GHOST_GAZE_DIRECTION_V1.SCAN;
  else if (focusDrift !== "stable" || curiosity >= 0.4) gazeDirection = GHOST_GAZE_DIRECTION_V1.USER;

  let emotion = "neutral";
  if (posture === FOX_BEHAVIOR_POSTURE_V1.OBSERVE) emotion = "listening";
  else if (alertness >= 0.55) emotion = "listening";
  else if (curiosity >= 0.48) emotion = "curious";
  else if (focus >= 0.52 || continuity >= 0.55) emotion = "listening";
  else if (comfort >= 0.62) emotion = "idle";
  else if (tension >= 0.45) emotion = "thinking";

  const activation = round3(0.22 + alertness * 0.34 + curiosity * 0.26 + focus * 0.18);
  const reach =
    emotion === "listening" ? 0.56 + focus * 0.12 : curiosity >= 0.45 ? 0.48 : 0.34;

  const toneHint = buildGhostToneHintV1({ comfort, curiosity, alertness, focus, continuity, tension });

  const bias = Object.freeze({
    schema: GHOST_PRESENTATION_BIAS_SCHEMA_V1,
    role: "presentation_bias_only_no_output",
    generatedAt: Date.now(),
    ghostState: Object.freeze({
      comfort: round3(comfort),
      curiosity: round3(curiosity),
      focus: round3(focus),
      alertness: round3(alertness),
      continuity: round3(continuity)
    }),
    behaviors: Object.freeze({
      idleBehavior,
      focusDrift,
      microScan,
      gazeHold
    }),
    uiHints: Object.freeze({
      pauseDurationMs,
      typingDelayMs,
      animationBias,
      gazeDirection
    }),
    drivePatch: Object.freeze({
      emotion,
      activation,
      reach: round3(reach),
      live: posture !== FOX_BEHAVIOR_POSTURE_V1.OBSERVE,
      scanIntensity: round3(alertness * 0.65 + (microScan === "elevated" ? 0.25 : 0)),
      gazeHold01: gazeHold === "locked" ? 0.85 : gazeHold === "soft_hold" ? 0.55 : 0.2
    }),
    toneHint
  });

  return Object.freeze({
    schema: GHOST_STATE_ENGINE_SCHEMA_V1,
    presentationBias: bias
  });
}

function buildGhostToneHintV1(state) {
  const parts = [];
  if (state.comfort >= 0.6) parts.push("sakin ve sıcak tempo");
  else if (state.comfort < 0.38) parts.push("hafif tedirgin ama destekleyici tempo");
  if (state.alertness >= 0.5) parts.push("kısa duraksamalar, dikkatli dinleme");
  if (state.curiosity >= 0.45) parts.push("meraklı ama baskısız ton");
  if (state.continuity >= 0.55) parts.push("önceki tura geri bağlan");
  if (state.tension >= 0.45) parts.push("gergin konuyu yumuşat, acele etme");
  if (!parts.length) parts.push("dengeli eşlik tonu");
  return parts.join("; ");
}

/**
 * @param {ReturnType<typeof resolveGhostPresentationBiasV1>["presentationBias"]} bias
 */
export function buildGhostPresentationTonePromptBlockV1(bias) {
  const b = bias && typeof bias === "object" ? bias : null;
  if (!b) return "";
  const gs = b.ghostState || {};
  return [
    "## Ghost presence (tone bias only — no new facts, no speech authority)",
    `comfort=${gs.comfort} curiosity=${gs.curiosity} focus=${gs.focus} alertness=${gs.alertness} continuity=${gs.continuity}`,
    `behaviors: idle=${b.behaviors?.idleBehavior} gaze=${b.uiHints?.gazeDirection} scan=${b.behaviors?.microScan}`,
    `toneHint: ${b.toneHint}`,
    "Adjust cadence and warmth only; Rhizoh dialogue thread owns conversation flow."
  ].join("\n");
}

/**
 * @param {Record<string, unknown>} drive
 * @param {ReturnType<typeof resolveGhostPresentationBiasV1>["presentationBias"] | null | undefined} bias
 */
export function applyGhostPresentationToCompanionDriveV1(drive, bias) {
  const base = drive && typeof drive === "object" ? drive : {};
  const patch = bias?.drivePatch;
  if (!patch) return Object.freeze({ ...base });
  return Object.freeze({
    ...base,
    emotion: patch.emotion || base.emotion,
    activation: patch.activation ?? base.activation,
    reach: patch.reach ?? base.reach,
    live: patch.live ?? base.live,
    ghostPresentation: Object.freeze({
      scanIntensity: patch.scanIntensity,
      gazeHold01: patch.gazeHold01,
      animationBias: bias.uiHints?.animationBias,
      pauseDurationMs: bias.uiHints?.pauseDurationMs,
      typingDelayMs: bias.uiHints?.typingDelayMs
    })
  });
}

/**
 * @param {ReturnType<typeof resolveGhostPresentationBiasV1>["presentationBias"]} bias
 */
export function publishGhostPresentationBiasV1(bias) {
  if (typeof window === "undefined" || !bias) return bias;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.ghostPresentationBias = bias;
  window.__rhizoh.ghostPresentationUiHints = bias.uiHints;
  try {
    window.dispatchEvent(new CustomEvent(RHIZOH_GHOST_PRESENTATION_EVENT_V1, { detail: bias }));
  } catch {
    /* noop */
  }
  return bias;
}

export function readGhostPresentationUiHintsV1() {
  if (typeof window === "undefined") {
    return Object.freeze({
      pauseDurationMs: 220,
      typingDelayMs: 60,
      animationBias: "neutral",
      gazeDirection: GHOST_GAZE_DIRECTION_V1.HORIZON
    });
  }
  const hints = window.__rhizoh?.ghostPresentationUiHints;
  if (hints && typeof hints === "object") return Object.freeze({ ...hints });
  return Object.freeze({
    pauseDurationMs: 220,
    typingDelayMs: 60,
    animationBias: "neutral",
    gazeDirection: GHOST_GAZE_DIRECTION_V1.HORIZON
  });
}
