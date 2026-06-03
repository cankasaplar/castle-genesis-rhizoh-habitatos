/**
 * Active intent propagation — direction persistence + shift causality (why / why changed).
 * @see docs/RHIZOH_ATTENTION_INERTIA_FIELD_V1.md § Intent propagation
 */

import {
  T0_INTENT_CONNECT_V0,
  T0_INTENT_EXPLORE_V0,
  T0_INTENT_OBSERVE_V0,
  T0_INTENT_PRODUCE_V0
} from "./t0ContextStripV0.js";
import { RHIZOH_SILENCE_FORM_V0 } from "./rhizohPresenceStateEngineV0.js";

/** Mirror RCAL_ATTENTION_TARGET_V0 — avoid import cycle with cognitive layer. */
const TARGET_V0 = Object.freeze({
  USER: "user",
  DIALOGUE: "dialogue",
  WORLD_MESH: "world_mesh",
  CONTINUITY: "continuity",
  VOICE_CHANNEL: "voice_channel",
  AMBIENT: "ambient"
});

export const PROPAGATION_CAUSE_V0 = Object.freeze({
  INITIAL: "initial",
  VOICE_OPEN: "voice_open",
  USER_INTENT_EXPLORE: "user_intent_explore",
  USER_INTENT_PRODUCE: "user_intent_produce",
  USER_INTENT_OBSERVE: "user_intent_observe",
  USER_INTENT_CONNECT: "user_intent_connect",
  DIALOGUE_FOCUS: "dialogue_focus",
  CONTINUITY_HOLD: "continuity_hold",
  SURFACE_SHIFT: "surface_shift",
  FIELD_EXECUTING: "field_executing",
  DRIFT_SHIFT: "drift_shift",
  FEL_RETURN: "fel_return"
});

const WHY_COPY_V0 = Object.freeze({
  tr: Object.freeze({
    initial: "Başlangıç odağı",
    voice_open: "Ses kanalına geçiş",
    user_intent_explore: "Keşif niyeti sürdürülüyor",
    user_intent_produce: "Üretim niyeti sürdürülüyor",
    user_intent_observe: "İzleme niyeti sürdürülüyor",
    user_intent_connect: "Bağlantı niyeti sürdürülüyor",
    dialogue_focus: "Diyalog odağı",
    continuity_hold: "Süreklilik bekçiliği",
    surface_shift: "Yüzey değişimi",
    field_executing: "Yürütme odağı",
    drift_shift: "Drift eşiği geçildi",
    fel_return: "FEL sonrası dönüş"
  }),
  en: Object.freeze({
    initial: "Initial focus",
    voice_open: "Shifted to voice channel",
    user_intent_explore: "Explore intent persists",
    user_intent_produce: "Produce intent persists",
    user_intent_observe: "Observe intent persists",
    user_intent_connect: "Connect intent persists",
    dialogue_focus: "Dialogue focus",
    continuity_hold: "Continuity hold",
    surface_shift: "Surface changed",
    field_executing: "Execution focus",
    drift_shift: "Drift threshold crossed",
    fel_return: "Return after failure narration"
  })
});

let propagatedPrimary = "";
let propagatedIntentId = null;
let propagatedCause = PROPAGATION_CAUSE_V0.INITIAL;
let propagatedSinceMs = 0;
let lastSurfaceId = "";
/** @type {{ from: string, to: string, cause: string, atMs: number } | null} */
let lastShift = null;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * @param {string} cause
 * @param {"tr"|"en"} loc
 */
function whyLabelV0(cause, loc = "tr") {
  const c = WHY_COPY_V0[loc] || WHY_COPY_V0.en;
  return c[cause] || c.initial;
}

/**
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0>} instant
 * @param {string} proposedPrimary
 * @param {string} prevCommitted
 */
function inferShiftCauseV0(instant, proposedPrimary, prevCommitted) {
  const signals = instant?.signals || {};
  const intentId = String(signals.intentId || instant?.selective_focus?.intentId || "");
  const router = String(signals.routerIntent || "CHAT").toUpperCase();
  const silence = String(signals.silenceForm || "");
  const surface = String(signals.surfaceId || "");

  if (proposedPrimary === TARGET_V0.VOICE_CHANNEL && prevCommitted !== proposedPrimary) {
    return PROPAGATION_CAUSE_V0.VOICE_OPEN;
  }
  if (silence === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION && proposedPrimary === TARGET_V0.CONTINUITY) {
    return PROPAGATION_CAUSE_V0.FEL_RETURN;
  }
  if (signals.userPickedIntent) {
    if (intentId === T0_INTENT_EXPLORE_V0) return PROPAGATION_CAUSE_V0.USER_INTENT_EXPLORE;
    if (intentId === T0_INTENT_PRODUCE_V0) return PROPAGATION_CAUSE_V0.USER_INTENT_PRODUCE;
    if (intentId === T0_INTENT_OBSERVE_V0) return PROPAGATION_CAUSE_V0.USER_INTENT_OBSERVE;
    if (intentId === T0_INTENT_CONNECT_V0) return PROPAGATION_CAUSE_V0.USER_INTENT_CONNECT;
  }
  if (router !== "CHAT" && proposedPrimary === TARGET_V0.DIALOGUE) {
    return PROPAGATION_CAUSE_V0.DIALOGUE_FOCUS;
  }
  if (surface && lastSurfaceId && surface !== lastSurfaceId) {
    return PROPAGATION_CAUSE_V0.SURFACE_SHIFT;
  }
  if (proposedPrimary === TARGET_V0.DIALOGUE) {
    return PROPAGATION_CAUSE_V0.FIELD_EXECUTING;
  }
  if (proposedPrimary === TARGET_V0.CONTINUITY) {
    return PROPAGATION_CAUSE_V0.CONTINUITY_HOLD;
  }
  if (Number(instant?.intent_drift_control?.drift01) > 0.45) {
    return PROPAGATION_CAUSE_V0.DRIFT_SHIFT;
  }
  return PROPAGATION_CAUSE_V0.DRIFT_SHIFT;
}

/**
 * @param {string} committedPrimary
 * @param {string} proposedPrimary
 * @param {ReturnType<import("./rhizohCognitiveAttentionLayerV0.js").deriveCognitiveAttentionV0>} instant
 * @param {number} nowMs
 */
export function advanceIntentPropagationV0(committedPrimary, proposedPrimary, instant, nowMs) {
  const t = Number(nowMs) || Date.now();
  const signals = instant?.signals || {};
  const intentId = signals.intentId || instant?.selective_focus?.intentId || null;
  const surface = String(signals.surfaceId || "");

  const prevCommitted = propagatedPrimary;
  const primaryChanged = Boolean(prevCommitted) && committedPrimary !== prevCommitted;

  if (!propagatedPrimary) {
    propagatedPrimary = committedPrimary;
    propagatedIntentId = intentId;
    propagatedCause = PROPAGATION_CAUSE_V0.INITIAL;
    propagatedSinceMs = t;
  } else if (primaryChanged) {
    const cause = inferShiftCauseV0(instant, proposedPrimary, prevCommitted);
    lastShift = Object.freeze({
      from: prevCommitted,
      to: committedPrimary,
      cause,
      atMs: t
    });
    propagatedPrimary = committedPrimary;
    propagatedIntentId = intentId;
    propagatedCause = cause;
    propagatedSinceMs = t;
  }

  lastSurfaceId = surface;

  const persistenceMs = Math.max(0, t - propagatedSinceMs);
  const drift01 = Number(instant?.intent_drift_control?.drift01) || 0;
  const directionPersist01 = clamp01(
    0.25 + Math.min(1, persistenceMs / 6000) * 0.55 + (1 - drift01 * 0.7) * 0.2
  );

  const whyChanged = primaryChanged && lastShift
    ? Object.freeze({
        code: lastShift.cause,
        label_tr: whyLabelV0(lastShift.cause, "tr"),
        label_en: whyLabelV0(lastShift.cause, "en"),
        from: lastShift.from,
        to: lastShift.to,
        atMs: lastShift.atMs
      })
    : null;

  return Object.freeze({
    persisted_primary: propagatedPrimary,
    persisted_intent_id: propagatedIntentId,
    persisted_cause: propagatedCause,
    persistence_ms: persistenceMs,
    direction_persist01: Number(directionPersist01.toFixed(4)),
    why_looking: Object.freeze({
      code: propagatedCause,
      label_tr: whyLabelV0(propagatedCause, "tr"),
      label_en: whyLabelV0(propagatedCause, "en")
    }),
    why_changed: whyChanged,
    last_shift: lastShift ? Object.freeze({ ...lastShift }) : null
  });
}

export function resetIntentPropagationForTestV0() {
  propagatedPrimary = "";
  propagatedIntentId = null;
  propagatedCause = PROPAGATION_CAUSE_V0.INITIAL;
  propagatedSinceMs = 0;
  lastSurfaceId = "";
  lastShift = null;
}
