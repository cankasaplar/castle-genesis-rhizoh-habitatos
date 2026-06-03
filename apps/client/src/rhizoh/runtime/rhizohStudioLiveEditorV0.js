/**
 * Studio Live Editor v0.1 — controlled perception interface (suggestion-only, no world mutation).
 * @see docs/RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md
 */

import { readStudioProductionOrganismV0 } from "./rhizohStudioProductionOrganismV0.js";
import { readCastleProjectionV0 } from "./rhizohCastleProjectionLayerV0.js";
import { readPetEvolutionV0 } from "./rhizohPetEvolutionV0.js";
import { PERCEPTION_DRIFT_CLASS_V0 } from "./rhizohCastleCoherenceHardeningV0.js";

export const STUDIO_LIVE_EDITOR_SCHEMA_V0 = "castle.rhizoh.studio_live_editor.v0";

export const STUDIO_EDIT_MODE_V0 = Object.freeze({
  SUGGESTION_ONLY: "suggestion_only",
  READ_ONLY: "read_only"
});

export const STUDIO_EDIT_TARGET_V0 = Object.freeze({
  CASTLE_PROJECTION: "castle_projection",
  PET_BEHAVIOR_BIAS: "pet_behavior_bias",
  PET_SPATIAL_NUDGE: "pet_spatial_nudge",
  CASTLE_COMPOSITION: "castle_composition"
});

/** @type {object[]} */
let suggestionQueue = [];

/**
 * @param {{
 *   target: string,
 *   mode?: string,
 *   payload?: object
 * }} spec
 */
export function validateStudioEditSpecV0(spec) {
  if (!spec?.target) {
    return Object.freeze({ ok: false, code: "target_missing" });
  }
  const mode = spec.mode || STUDIO_EDIT_MODE_V0.SUGGESTION_ONLY;
  if (mode !== STUDIO_EDIT_MODE_V0.SUGGESTION_ONLY && mode !== STUDIO_EDIT_MODE_V0.READ_ONLY) {
    return Object.freeze({ ok: false, code: "mode_forbidden" });
  }
  if (spec.payload?.mutate_world === true || spec.payload?.originate_world_state === true) {
    return Object.freeze({ ok: false, code: "direct_mutation_forbidden" });
  }
  return Object.freeze({ ok: true, mode, target: spec.target });
}

/**
 * @param {{
 *   target: string,
 *   mode?: string,
 *   payload?: object
 * }} spec
 */
export function submitStudioEditSuggestionV0(spec) {
  const validation = validateStudioEditSpecV0(spec);
  if (!validation.ok) return validation;

  const suggestion = Object.freeze({
    schema: "castle.rhizoh.studio_edit_suggestion.v0",
    atMs: Date.now(),
    target: spec.target,
    mode: validation.mode,
    payload: Object.freeze(spec.payload || {}),
    applied: false,
    authoritative: false
  });

  suggestionQueue.push(suggestion);
  if (suggestionQueue.length > 48) suggestionQueue.shift();

  publishStudioLiveEditorV0();
  return Object.freeze({ ok: true, suggestion });
}

/**
 * @param {ReturnType<typeof validateStudioEditSpecV0>} validation
 * @param {object} suggestion
 */
function projectSuggestionToPerceptionV0(validation, suggestion) {
  const castle = readCastleProjectionV0();
  const petEvolution = readPetEvolutionV0();

  if (suggestion.target === STUDIO_EDIT_TARGET_V0.CASTLE_PROJECTION) {
    return Object.freeze({
      kind: "castle_projection_suggestion",
      castle_node_id: castle?.castle_node_id || null,
      surface_density: suggestion.payload?.surface_density ?? null,
      perception_layers: suggestion.payload?.perception_layers ?? null
    });
  }

  if (suggestion.target === STUDIO_EDIT_TARGET_V0.PET_BEHAVIOR_BIAS) {
    return Object.freeze({
      kind: "pet_behavior_bias_suggestion",
      bias_delta: Math.min(0.05, Math.max(-0.05, Number(suggestion.payload?.bias_delta) || 0)),
      drift_rate_cap: petEvolution?.behavior?.drift_rate ?? null
    });
  }

  if (suggestion.target === STUDIO_EDIT_TARGET_V0.PET_SPATIAL_NUDGE) {
    return Object.freeze({
      kind: "pet_spatial_nudge_suggestion",
      nudge: Object.freeze({
        dx: Math.min(0.02, Math.max(-0.02, Number(suggestion.payload?.dx) || 0)),
        dy: Math.min(0.02, Math.max(-0.02, Number(suggestion.payload?.dy) || 0))
      }),
      teleport: false
    });
  }

  if (suggestion.target === STUDIO_EDIT_TARGET_V0.CASTLE_COMPOSITION) {
    return Object.freeze({
      kind: "castle_composition_suggestion",
      attention_weight_map: suggestion.payload?.attention_weight_map ?? null,
      surface_density: suggestion.payload?.surface_density ?? null
    });
  }

  return Object.freeze({ kind: "unknown", target: suggestion.target });
}

export function publishStudioLiveEditorV0() {
  const organism = readStudioProductionOrganismV0();
  const castle = readCastleProjectionV0();
  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};

  const pending = suggestionQueue.filter((s) => !s.applied);
  const projections = Object.freeze(
    pending.map((s) => {
      const v = validateStudioEditSpecV0(s);
      return Object.freeze({
        suggestion: s,
        projection: projectSuggestionToPerceptionV0(v, s)
      });
    })
  );

  const report = Object.freeze({
    schema: STUDIO_LIVE_EDITOR_SCHEMA_V0,
    atMs: Date.now(),
    mode: STUDIO_EDIT_MODE_V0.SUGGESTION_ONLY,
    direct_mutation_forbidden: true,
    scr_suggestion_layer_only: true,
    organism_ok: Boolean(organism?.unity),
    castle_node_id: castle?.castle_node_id || null,
    pending_count: pending.length,
    suggestions: Object.freeze(suggestionQueue.slice(-24)),
    projections,
    perception_drift_class:
      rh.castleCoherenceLock?.perception_drift_class || PERCEPTION_DRIFT_CLASS_V0.NONE,
    ok: true
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.studioLiveEditor = report;
    window.__rhizoh.studioEditSuggestions = report.suggestions;
  }

  return report;
}

export function readStudioLiveEditorV0() {
  return typeof window !== "undefined" ? window.__rhizoh?.studioLiveEditor || null : null;
}

export function resetRhizohStudioLiveEditorForTestV0() {
  suggestionQueue = [];
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.studioLiveEditor;
    delete window.__rhizoh.studioEditSuggestions;
  }
}

/** Convenience alias matching spec API. */
export function studioEditV0(spec) {
  return submitStudioEditSuggestionV0(spec);
}
