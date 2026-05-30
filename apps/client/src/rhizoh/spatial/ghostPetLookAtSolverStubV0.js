/**
 * SPECFLOW: RESEARCH-ONLY — **Look-at solver** yol haritası (quaternion / head / göz / kilit / tahmin).
 * Şu an üretimde yalnızca yaw-offset + Presence köprüsü; bu modül sonraki fazların sözleşmesini sabitler.
 */

export const GHOST_PET_LOOK_AT_SOLVER_STUB_SCHEMA_V0 = "castle.rhizoh.ghost_pet_look_at_solver.stub.v0";

/** Sıra: önce uygulanan indeks düşük. */
export const LOOK_AT_PIPELINE_PHASES_V0 = Object.freeze([
  "yaw_offset",
  "quaternion_blend",
  "head_aim",
  "eye_tracking",
  "smooth_target_lock",
  "predictive_gaze"
]);

/** Faz 0 = yaw-offset (spatial bridge ile). */
export const LOOK_AT_IMPLEMENTED_PHASE_INDEX_V0 = 0;

/**
 * @returns {{ schema: string, implementedThroughIndex: number, phases: readonly string[], deferred: string[], note: string }}
 */
export function summarizeGhostPetLookAtPipelineV0() {
  const phases = /** @type {readonly string[]} */ (LOOK_AT_PIPELINE_PHASES_V0);
  return {
    schema: GHOST_PET_LOOK_AT_SOLVER_STUB_SCHEMA_V0,
    implementedThroughIndex: LOOK_AT_IMPLEMENTED_PHASE_INDEX_V0,
    phases: [...phases],
    deferred: phases.slice(LOOK_AT_IMPLEMENTED_PHASE_INDEX_V0 + 1),
    note: "Quaternion full-body aim + eye rig + smooth lock + predictive gaze — renderer / animation graph."
  };
}
