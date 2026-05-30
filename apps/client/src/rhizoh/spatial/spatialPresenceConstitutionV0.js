/**
 * PR-4 — Spatial presence constitution (Castle Genesis / Rhizoh).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Parity with PR-3: if **ACK ≠ truth**, then here **presence inference ≠ identity truth**.
 *
 * Camera / depth / skeleton / gaze outputs are **spatial observation hypotheses** only.
 * They must never become continuity truth, memory fact, or governance fact.
 */

/** Single-sentence law (audits, agents, UI copy). */
export const PRESENCE_INFERENCE_NOT_IDENTITY_TRUTH_V0 =
  "Presence inference is hypothesis; it cannot become identity, continuity, or governance truth.";

/** PR-3 parallel for cross-docs. */
export const SPATIAL_ACK_ANALOGY_V0 = "As ACK is not epistemic truth, spatial presence is not identity truth.";

/**
 * Logical layers (namespace labels — not execution engines).
 * @readonly
 */
export const SPATIAL_LAYERS_V0 = Object.freeze({
  SPATIAL_SENSOR_LAYER: "SPATIAL_SENSOR_LAYER",
  PRESENCE_INFERENCE_LAYER: "PRESENCE_INFERENCE_LAYER",
  EMBODIMENT_RENDER_LAYER: "EMBODIMENT_RENDER_LAYER"
});

/**
 * Rhizoh embodiment stance: spatial process, not character product.
 * First form: light, directional audio, wall reflection, minimal volumetric aura — not NPC/avatar/mascot.
 */
export const RHIZOH_EMBODIMENT_STANCE_V0 = Object.freeze({
  isNot: Object.freeze(["NPC", "avatar", "hologram_mascot", "assistant_mascot"]),
  isInstead: Object.freeze([
    "spatial_field",
    "atmospheric_locus",
    "epistemic_projection",
    "ambient_intelligence_presence"
  ]),
  greenroomPhysicalMetaphor: "presence_conditioned_environment_runtime"
});
