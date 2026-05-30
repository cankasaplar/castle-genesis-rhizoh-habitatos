/**
 * SPECFLOW: RESEARCH-ONLY — **Multi-pet social physics** yer tutucu (3+ pet emergent spacing graph sonra).
 */

export const GHOST_PET_MULTI_PET_SOCIAL_PHYSICS_STUB_SCHEMA_V0 = "castle.rhizoh.ghost_pet_multi_pet_social_physics.stub.v0";

/**
 * @param {{ peerCount?: number, petCount?: number }|null|undefined} ctx
 */
export function computeGhostPetMultiPetSpacingHintStubV0(ctx) {
  const c = ctx && typeof ctx === "object" ? ctx : {};
  const peerCount = Math.max(0, Math.floor(Number(c.peerCount) || 0));
  const petCount = Math.max(0, Math.floor(Number(c.petCount) || 0));
  return {
    schema: GHOST_PET_MULTI_PET_SOCIAL_PHYSICS_STUB_SCHEMA_V0,
    peerCount,
    petCount,
    ecologyRoadmap: summarizeMultiPetEcologyRoadmapV0(),
    note: "Spacing / sync hover / conflict rings — graph deferred to social spatial runtime v2."
  };
}

/**
 * @returns {{ implemented: string[], deferred: string[] }}
 */
export function summarizeMultiPetEcologyRoadmapV0() {
  return {
    implemented: ["spacing_hint_scalar"],
    deferred: ["flocking", "social_grouping", "attention_competition", "pet_to_pet_signaling", "shared_hover_phase"]
  };
}
