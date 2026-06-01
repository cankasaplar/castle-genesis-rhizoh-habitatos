/**
 * T0 Continuity Surface v0 — product constants (Ready Flow, not Empty State).
 * @see docs/RHIZOH_T0_CONTINUITY_SURFACE_V0.md
 */

import { pushT0ContinuityPulseV0 } from "./t0ContinuitySurfaceStreamV0.js";

export const T0_CONTINUITY_SURFACE_CONTRACT_V0 = "t0-continuity-surface-v0";

/** Locked product definition. */
export const T0_CONTINUITY_SURFACE_DEFINITION_V0 = "Rhizoh T0 = Continuity Surface";

/** User does not start the system — system restores continuity. */
export const T0_PRODUCT_CORE_RESTORE_V0 =
  "The user does not start the system; the system pulls the user back into continuity.";

/** Restoration must not feel like an empty screen. */
export const T0_PRODUCT_CORE_NO_EMPTY_RESTORE_V0 =
  "Restoration never returns to an empty screen.";

/** Correct pole between freeze and feature sprawl. */
export const T0_CONTROLLED_OPENNESS_V0 = "controlled openness with immediate continuity";

/** Ready state label — not empty, not onboarding. */
export const T0_READY_STATE_LABEL_V0 = "Ready Flow, not Empty State";

/** Latent capability surface — visible potential, low pressure. */
export const T0_LATENT_CAPABILITY_SURFACE_V0 = "latent capability surface";

export const TEMPO_MICRO_CONTINUITY_V0 = "micro";
export const TEMPO_MACRO_CONTINUITY_V0 = "macro";

/** Always-on surfaces on T0 (low pressure). */
export const T0_ALWAYS_ON_SURFACES_V0 = Object.freeze(["map", "chat"]);

/**
 * Soft affordances — visible, optional, non-dominant (user binds; does not enable features).
 * @type {readonly { id: string, label_tr: string, world: "spatial" | "narrative" | "real_world" }[]}
 */
export const T0_SOFT_AFFORDANCES_V0 = Object.freeze([
  Object.freeze({
    id: "spawn_castle",
    label_tr: "Kale kur",
    world: "narrative"
  }),
  Object.freeze({
    id: "add_moment",
    label_tr: "Anı ekle",
    world: "narrative"
  }),
  Object.freeze({
    id: "connect_world",
    label_tr: "Bağlan",
    world: "real_world"
  })
]);

/**
 * System voice — continuation, not interrogation.
 */
export const T0_CONTINUATION_VOICE_V0 = "You can continue.";

/** Curiosity over curriculum — Rhizoh grows by honest surprise, not lessons. */
export const T0_CURIOSITY_PEDAGOGY_V0 =
  "Rhizoh does not teach steps; it invites curiosity through living continuity.";

/** Studio = strong play surface (meaning preserved, not gamified noise). */
export const T0_STUDIO_PLAY_SURFACE_V0 = "studio_play_surface";

/**
 * Layer stack (breathing order) — SpiralMMO last, when all layers breathe together.
 * @type {readonly string[]}
 */
export const T0_PRODUCT_LAYER_STACK_V0 = Object.freeze([
  "world",
  "hall",
  "castle",
  "studio",
  "profile",
  "capability_wheel",
  "drawers",
  "spiral_mmo"
]);

/** @returns {typeof T0_SOFT_AFFORDANCES_V0} */
export function listT0SoftAffordancesV0() {
  return T0_SOFT_AFFORDANCES_V0;
}

/**
 * @param {string} affordanceId
 * @param {(msg: string) => void} [pushPulse]
 */
export function emitT0SoftAffordanceHintV0(affordanceId, pushPulse = pushT0ContinuityPulseV0) {
  const row = T0_SOFT_AFFORDANCES_V0.find((a) => a.id === affordanceId);
  if (!row) return;
  pushPulse(`${row.label_tr} · bağ kurulabilir`, "affordance");
}

/**
 * Product snapshot for trust debug / observability (read-only).
 */
export function buildT0ContinuitySurfaceObservationV0() {
  return Object.freeze({
    contract_version: T0_CONTINUITY_SURFACE_CONTRACT_V0,
    definition: T0_CONTINUITY_SURFACE_DEFINITION_V0,
    ready_state: T0_READY_STATE_LABEL_V0,
    latent_surface: T0_LATENT_CAPABILITY_SURFACE_V0,
    controlled_openness: T0_CONTROLLED_OPENNESS_V0,
    always_on: T0_ALWAYS_ON_SURFACES_V0,
    soft_affordances: T0_SOFT_AFFORDANCES_V0,
    continuation_voice: T0_CONTINUATION_VOICE_V0,
    observation_only: true
  });
}
