/**
 * Sovereign Node Onboarding V0 — contract (EFIR-aligned).
 * Anchoring illusion only — no execution write, no witness write.
 */

export const SOVEREIGN_NODE_ONBOARDING_SCHEMA_V0 =
  "castle.rhizoh.sovereign_node_onboarding.v0";

export const SOVEREIGN_ONBOARDING_STEP_V0 = Object.freeze({
  WORLD_ENTRY: "world_entry",
  GEOGRAPHIC_ANCHOR: "geographic_anchor",
  EPISTEMIC_DERIVATION: "epistemic_derivation",
  SEAL_PREVIEW: "seal_preview",
  SOFT_ACTIVATION: "soft_activation",
  EVENT_PLANE_ENTRY: "event_plane_entry"
});

export const SOVEREIGN_NODE_STATE_V0 = Object.freeze({
  OBSERVATION_ONLY: "OBSERVATION_ONLY",
  SOFT_INIT: "SOFT_INIT",
  EVENT_PLANE_READONLY: "EVENT_PLANE_READONLY"
});

export const SOVEREIGN_EPISTEMIC_ROLE_V0 = Object.freeze({
  SATELLITE_OBSERVER: "satellite-observer"
});

/** Bootstrap seed viewport (Kadıköy coords) — not universe center; user may pick any node. */
export const SOVEREIGN_DEFAULT_ANCHOR_KADIKOY_V0 = Object.freeze({
  lat: 41.0082,
  lon: 28.9784,
  zoom: 14,
  label: "kadikoy"
});

/** Cross-node coherence test zone (expansion). */
export const SOVEREIGN_ANCHOR_BARCELONA_V0 = Object.freeze({
  lat: 41.3874,
  lon: 2.1686,
  zoom: 12,
  label: "barcelona"
});
