/**
 * Action Coherence Layer (ACL) v0 — next-action gravity + cognition overload guard.
 * @see docs/RHIZOH_ACTION_COHERENCE_LAYER_V0.md
 */

import { resolveT0ContextStripV0 } from "./t0ContextStripV0.js";
import {
  T0_INTENT_CONNECT_V0,
  T0_INTENT_EXPLORE_V0,
  T0_INTENT_OBSERVE_V0,
  T0_INTENT_PRODUCE_V0
} from "./t0ContextStripV0.js";
import {
  resolveThinkingPhaseV0,
  THINKING_PHASE_REST_V0
} from "./rhizohThinkingModelV0.js";

export const RHIZOH_ACTION_COHERENCE_CONTRACT_V0 = "rhizoh-action-coherence-v0";

export const ACL_BINDING_SENTENCE_V0 =
  "Rhizoh is cognition exposure + action coherence + continuity stabilizer.";

export const RHIZOH_NEXT_ACTION_ANCHOR_EVENT_V0 = "rhizoh:next-action-anchor";

/** @type {Readonly<Record<string, { tr: string, en: string }>>} */
const SURFACE_ANCHOR_V0 = Object.freeze({
  studio: Object.freeze({ tr: "Stüdyo — üretim ve oturum", en: "Studio — production" }),
  world: Object.freeze({ tr: "Ana sahne — konuş veya tekerlekten seç", en: "Main stage — speak or use the wheel" }),
  broadcast: Object.freeze({ tr: "Yayın — canlı ve paylaşım", en: "Broadcast — live" }),
  hall: Object.freeze({ tr: "Salon — gözlem ve kayıt", en: "Hall — observe" }),
  greenroom: Object.freeze({ tr: "Hazırlık odası — yayına hazırlık", en: "Green room — prep" }),
  profile: Object.freeze({ tr: "Profil — hesap ve ayarlar", en: "Profile — settings" })
});

/**
 * @param {string} surface
 * @param {boolean} tr
 */
function anchorForSurfaceV0(surface, tr) {
  const row = SURFACE_ANCHOR_V0[String(surface || "world")] || SURFACE_ANCHOR_V0.world;
  return tr ? row.tr : row.en;
}

/**
 * @param {string} intent
 * @param {boolean} tr
 */
function anchorHintForIntentV0(intent, tr) {
  const id = String(intent || T0_INTENT_EXPLORE_V0);
  if (id === T0_INTENT_PRODUCE_V0) {
    return tr ? "Stüdyo'ya geçebilirsin" : "focus on production";
  }
  if (id === T0_INTENT_CONNECT_V0) {
    return tr ? "Yayın veya hazırlık odası" : "focus on connection";
  }
  if (id === T0_INTENT_OBSERVE_V0) {
    return tr ? "Salon ve kayıtlar" : "continue observing";
  }
  return tr ? "Ana sahne ve tekerlek" : "continue exploring";
}

/**
 * @param {{
 *   activeSurface?: string,
 *   userIntent?: string | null,
 *   rhizohFieldState?: string,
 *   localeTr?: boolean
 * }} [input]
 */
export function resolveNextActionAnchorV0(input = {}) {
  const tr = input.localeTr !== false;
  const activeSurface = String(input.activeSurface || "world");
  const context = resolveT0ContextStripV0({
    activeSurface,
    userIntent: input.userIntent
  });
  const phase = resolveThinkingPhaseV0(input.rhizohFieldState);
  const busy = phase !== THINKING_PHASE_REST_V0;

  const surfaceLine = anchorForSurfaceV0(activeSurface, tr);
  const intentHint = anchorHintForIntentV0(context.intent, tr);

  const line = busy
    ? tr
      ? `Bir saniye… · ${surfaceLine}`
      : `Direction held · ${surfaceLine}`
    : surfaceLine;

  const payload = Object.freeze({
    contract_version: RHIZOH_ACTION_COHERENCE_CONTRACT_V0,
    binding: ACL_BINDING_SENTENCE_V0,
    line,
    surface: activeSurface,
    intent: context.intent,
    intent_hint: intentHint,
    thinking_phase: phase,
    busy,
    emphasis: busy ? "hold_direction" : "surface_open",
    play_call: context.play_call
  });

  return payload;
}

/**
 * Caps cognition UI when grammar + thinking + VCL would over-expose.
 * @param {{
 *   rhizohFieldState?: string,
 *   thoughtFieldExpanded?: boolean,
 *   ambientEnabled?: boolean
 * }} [input]
 */
export function computeCognitionExposureBudgetV0(input = {}) {
  const phase = resolveThinkingPhaseV0(input.rhizohFieldState);
  const busy = phase !== THINKING_PHASE_REST_V0;
  const thoughtOn = Boolean(input.thoughtFieldExpanded);
  const ambientOn = input.ambientEnabled !== false;

  let ambientOpacityScale = 1;
  let showThinkingPhaseChip = busy;
  let anchorEmphasis = busy ? "high" : "normal";

  if (busy && thoughtOn) {
    ambientOpacityScale = 0.55;
    showThinkingPhaseChip = false;
    anchorEmphasis = "high";
  } else if (busy && ambientOn) {
    ambientOpacityScale = 0.72;
  }

  const overloadRisk = busy && thoughtOn && ambientOn;

  return Object.freeze({
    contract_version: RHIZOH_ACTION_COHERENCE_CONTRACT_V0,
    phase,
    busy,
    ambientOpacityScale,
    showThinkingPhaseChip,
    anchorEmphasis,
    overloadRisk,
    binding: ACL_BINDING_SENTENCE_V0
  });
}

/**
 * @param {ReturnType<typeof resolveNextActionAnchorV0>} anchor
 */
export function emitNextActionAnchorV0(anchor) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_NEXT_ACTION_ANCHOR_EVENT_V0, { detail: anchor })
  );
}
