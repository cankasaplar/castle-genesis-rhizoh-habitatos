/**
 * SPECFLOW: RESEARCH-ONLY — **Locomotion FSM** yer tutucu: kernel intent (FOLLOW / GUARD / …) var;
 * gerçek path state machine, geçiş grafiği ve ivme sürekliliği yok.
 */

export const GHOST_PET_LOCOMOTION_FSM_STUB_SCHEMA_V0 = "castle.rhizoh.ghost_pet_locomotion_fsm.stub.v0";

/**
 * @param {string|null|undefined} locomotionHint — `resolveGhostPetLocomotionHintV0` çıktısı
 */
export function summarizeLocomotionFsmGapsV0(locomotionHint) {
  const hint = locomotionHint != null ? String(locomotionHint).trim() : "";
  return {
    schema: GHOST_PET_LOCOMOTION_FSM_STUB_SCHEMA_V0,
    intentFromKernel: hint || null,
    implemented: ["intent_string_from_social_runtime"],
    missing: [
      "path_state_vector",
      "transition_graph",
      "acceleration_continuity",
      "path_memory",
      "root_motion_or_steering_blend"
    ],
    note: "FSM tick + nav sampling deferred; intent only steers bridge heuristics today."
  };
}
