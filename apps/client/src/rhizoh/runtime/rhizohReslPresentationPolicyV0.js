/**
 * RESL v1 — presentation policy from RPSE truth (UI authority).
 * UI must consume resolveReslPresentationV0 — not raw gate reasons.
 * @see docs/RHIZOH_RESL_V1_UI_SURFACE_SPEC.md
 */

import {
  RHIZOH_ATTENTION_V0,
  RHIZOH_MEMORY_CONTINUITY_V0,
  RHIZOH_SILENCE_FORM_V0,
  RPSE_FAILURE_NARRATION_DECAY_MS_V0
} from "./rhizohPresenceStateEngineV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { resolveTransitionFeelFromPresenceV0 } from "./rhizohReslTransitionSemanticsV0.js";
import { enrichFelCcfTransitionFeelV0 } from "./rhizohDeployReadyPresenceV0.js";

export const RHIZOH_RESL_PRESENTATION_POLICY_SCHEMA_V0 = "castle.rhizoh.resl_presentation_policy.v0";

export const RHIZOH_PRESENCE_STATE_EVENT_V0 = "rhizoh:presence-state-v0";
export const RHIZOH_RESL_PRESENTATION_EVENT_V0 = "rhizoh:resl-presentation-v0";

export const RESL_FEL_CHAT_MIN_GAP_MS_V0 = 12_000;

let lastReslPublished = null;

export const RESL_TRANSITION_V0 = Object.freeze({
  NONE: "none",
  FADE_IN: "fade_in",
  PULSE: "pulse"
});

const COPY_V0 = Object.freeze({
  tr: Object.freeze({
    active_idle: "Rhizoh burada · hazır",
    listening: "Dinliyorum",
    partial: "Süreklilik açık",
    focused: "",
    absent: "",
    badge_here: "Burada",
    badge_listening: "Dinliyor",
    badge_uncertain: "Netleştiriyor"
  }),
  en: Object.freeze({
    active_idle: "Rhizoh is here · ready",
    listening: "Listening",
    partial: "Continuity open",
    focused: "",
    absent: "",
    badge_here: "Here",
    badge_listening: "Listening",
    badge_uncertain: "Clarifying"
  })
});

function localeKeyV0(locale) {
  const raw = String(locale || resolveOutputLanguageCodeV0() || "").toLowerCase();
  return raw.startsWith("tr") ? "tr" : "en";
}

/**
 * @param {string} silenceForm
 * @param {string} attention
 * @param {string} loc
 */
function resolveContinuityLineV0(silenceForm, attention, loc) {
  const c = COPY_V0[loc] || COPY_V0.en;
  if (silenceForm === RHIZOH_SILENCE_FORM_V0.ABSENT) return null;
  if (silenceForm === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE) return c.active_idle;
  if (silenceForm === RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD) return c.listening;
  if (silenceForm === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION) {
    return c.active_idle;
  }
  if (attention === RHIZOH_ATTENTION_V0.LISTENING) return c.listening;
  if (attention === RHIZOH_ATTENTION_V0.PARTIAL) return c.partial;
  if (attention === RHIZOH_ATTENTION_V0.FOCUSED) return c.focused || null;
  return c.active_idle;
}

/**
 * @param {string} silenceForm
 * @param {string} attention
 * @param {string} loc
 */
function resolveBadgeV0(silenceForm, attention, loc) {
  const c = COPY_V0[loc] || COPY_V0.en;
  if (silenceForm === RHIZOH_SILENCE_FORM_V0.ABSENT) return null;
  if (silenceForm === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION) {
    return Object.freeze({ label: c.badge_uncertain, tone: "amber-soft" });
  }
  if (attention === RHIZOH_ATTENTION_V0.LISTENING) {
    return Object.freeze({ label: c.badge_listening, tone: "cyan-soft" });
  }
  return Object.freeze({ label: c.badge_here, tone: "teal-soft" });
}

/**
 * @param {boolean} breathe
 * @param {number} intensity01
 * @param {string} silenceForm
 * @param {string} attention
 */
function resolveOrbModulationV0(breathe, intensity01, silenceForm, attention) {
  const listening =
    silenceForm === RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD ||
    attention === RHIZOH_ATTENTION_V0.LISTENING;
  const idle = silenceForm === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE;
  const breathPeriodMs = listening ? 3200 : idle ? 4200 : 5000;
  const rotationScale = listening ? 1.35 : idle ? 1.0 : 0.75;
  const opacityTarget = listening ? 0.94 : idle ? 0.88 : 0.82;
  const emissiveScale = 0.9 + intensity01 * (listening ? 0.45 : 0.28);

  return Object.freeze({
    breathe,
    intensity01,
    breathPeriodMs,
    rotationScale,
    emissiveScale: Number(emissiveScale.toFixed(3)),
    opacityTarget
  });
}

function prefersReducedMotionV0() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * @param {ReturnType<import("./rhizohPresenceStateEngineV0.js").deriveRhizohPresenceStateV0>} [presence]
 * @param {{ locale?: string, lastFelChatAtMs?: number, nowMs?: number }} [opts]
 */
export function resolveReslPresentationV0(presence, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  const loc = localeKeyV0(opts.locale);
  const present = presence?.rhizoh_is_present === true;
  const silenceForm = String(presence?.silence_form || RHIZOH_SILENCE_FORM_V0.ABSENT);
  const attention = String(presence?.rhizoh_attention || RHIZOH_ATTENTION_V0.IDLE);
  const intensity = Number(presence?.intensity) || 0.65;

  if (!present) {
    return Object.freeze({
      schema: RHIZOH_RESL_PRESENTATION_POLICY_SCHEMA_V0,
      continuityLine: null,
      presenceBadge: null,
      orbModulation: Object.freeze({ breathe: false, intensity01: 0 }),
      showFelChat: false,
      showMainHud: false,
      chatPlaceholderTone: "idle",
      transition: RESL_TRANSITION_V0.NONE,
      fel: Object.freeze({ allow: false, minGapMs: RESL_FEL_CHAT_MIN_GAP_MS_V0 })
    });
  }

  const felRecent =
    silenceForm === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION &&
    presence?.lastFelReason;
  const lastFel = Number(opts.lastFelChatAtMs) || 0;
  const felGapOk = !lastFel || nowMs - lastFel >= RESL_FEL_CHAT_MIN_GAP_MS_V0;
  const showFelChat =
    felRecent && felGapOk && silenceForm === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION;

  const breathe =
    silenceForm === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE ||
    silenceForm === RHIZOH_SILENCE_FORM_V0.LISTENING_HOLD ||
    attention === RHIZOH_ATTENTION_V0.LISTENING;

  const reducedMotion = prefersReducedMotionV0();
  let transition = RESL_TRANSITION_V0.FADE_IN;
  if (silenceForm === RHIZOH_SILENCE_FORM_V0.FAILURE_NARRATION) {
    transition = reducedMotion ? RESL_TRANSITION_V0.FADE_IN : RESL_TRANSITION_V0.PULSE;
  } else if (attention === RHIZOH_ATTENTION_V0.LISTENING) {
    transition = reducedMotion ? RESL_TRANSITION_V0.FADE_IN : RESL_TRANSITION_V0.PULSE;
  }

  const transitionFeel = enrichFelCcfTransitionFeelV0(
    resolveTransitionFeelFromPresenceV0(silenceForm, attention, {
      prefersReducedMotion: reducedMotion
    }),
    silenceForm
  );

  const memoryStrong = presence?.rhizoh_memory_continuity === RHIZOH_MEMORY_CONTINUITY_V0.STRONG;
  const orbIntensity = Math.min(1, intensity + (memoryStrong ? 0.06 : 0));

  return Object.freeze({
    schema: RHIZOH_RESL_PRESENTATION_POLICY_SCHEMA_V0,
    continuityLine: resolveContinuityLineV0(silenceForm, attention, loc),
    presenceBadge: resolveBadgeV0(silenceForm, attention, loc),
    orbModulation: resolveOrbModulationV0(breathe, Number(orbIntensity.toFixed(3)), silenceForm, attention),
    showFelChat,
    showMainHud: attention === RHIZOH_ATTENTION_V0.FOCUSED,
    chatPlaceholderTone:
      attention === RHIZOH_ATTENTION_V0.LISTENING
        ? "listening"
        : silenceForm === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE
          ? "idle"
          : "active",
    transition,
    transitionFeel,
    fel: Object.freeze({
      allow: showFelChat,
      minGapMs: RESL_FEL_CHAT_MIN_GAP_MS_V0,
      decayMs: RPSE_FAILURE_NARRATION_DECAY_MS_V0,
      dampen01: transitionFeel.felDampen01
    }),
    silenceForm,
    attention
  });
}

/**
 * @param {ReturnType<import("./rhizohPresenceStateEngineV0.js").deriveRhizohPresenceStateV0>} [presence]
 * @param {{ locale?: string, lastFelChatAtMs?: number, nowMs?: number }} [opts]
 */
export function publishReslPresentationV0(presence, opts = {}) {
  const nowMs = Number(opts.nowMs) || Number(presence?.atMs) || Date.now();
  const resl = resolveReslPresentationV0(presence, { ...opts, nowMs });
  lastReslPublished = resl;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.reslPresentation = resl;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_RESL_PRESENTATION_EVENT_V0, { detail: Object.freeze({ resl }) })
      );
    } catch {
      /* noop */
    }
  }
  import("./rhizohExperienceContinuityCompilerV0.js")
    .then((m) =>
      m.syncExperienceContinuityV0({
        presence,
        resl,
        cognitive: null,
        trf: null,
        nowMs
      })
    )
    .catch(() => {});
  return resl;
}

export function readLastReslPresentationV0() {
  return lastReslPublished;
}

/**
 * @param {ReturnType<typeof resolveReslPresentationV0>} resl
 * @param {number} [lastFelChatAtMs]
 * @param {number} [nowMs]
 */
export function shouldAllowFelChatV0(resl, lastFelChatAtMs = 0, nowMs = Date.now()) {
  if (!resl?.showFelChat) return false;
  if (resl.silenceForm === RHIZOH_SILENCE_FORM_V0.ACTIVE_IDLE) return false;
  const last = Number(lastFelChatAtMs) || 0;
  if (last && nowMs - last < RESL_FEL_CHAT_MIN_GAP_MS_V0) return false;
  return true;
}
