/**
 * SPECFLOW: RESEARCH-ONLY — **Locomotion intent** (ileride idle drift / follow / guard motorlarına bağlanır).
 * Şu an yalnızca tek satırlık ipucu string’i — orbit geometrisi değişmez.
 */

export const GHOST_PET_LOCOMOTION_SCHEMA_V0 = "castle.rhizoh.ghost_pet_locomotion_intent.v0";

export const GHOST_PET_LOCOMOTION_HINT_V0 = Object.freeze({
  ORBIT: "ORBIT",
  IDLE_DRIFT: "IDLE_DRIFT",
  FOLLOW: "FOLLOW",
  HOVER: "HOVER",
  RETREAT: "RETREAT",
  INVESTIGATE: "INVESTIGATE",
  GUARD: "GUARD",
  ACCOMPANY: "ACCOMPANY"
});

/**
 * @param {{
 *   roleStance?: string|null,
 *   socialModeUpper?: string,
 *   attentionMode?: string,
 *   bleedRisk01?: number,
 *   initiative01?: number
 * }} x
 */
export function resolveGhostPetLocomotionHintV0(x) {
  const role = String(x.roleStance || "").toUpperCase();
  const mode = String(x.socialModeUpper || "").toUpperCase();
  const att = String(x.attentionMode || "");
  const bleed = Math.max(0, Math.min(1, Number(x.bleedRisk01) || 0));
  const init = Math.max(0, Math.min(1, Number(x.initiative01) || 0));

  if (bleed > 0.55) return GHOST_PET_LOCOMOTION_HINT_V0.RETREAT;
  if (bleed > 0.38) return GHOST_PET_LOCOMOTION_HINT_V0.GUARD;
  if (att === "NEW_JOINER") return GHOST_PET_LOCOMOTION_HINT_V0.INVESTIGATE;
  if (att === "INTERPRETER_SPLIT") return GHOST_PET_LOCOMOTION_HINT_V0.HOVER;
  if (
    att === "ACTIVE_SPEAKER" &&
    init > 0.55 &&
    (mode.includes("ACTIVE") || role === "CONDUCTOR" || role === "GUIDE")
  ) {
    return GHOST_PET_LOCOMOTION_HINT_V0.ACCOMPANY;
  }
  if (att === "ACTIVE_SPEAKER") return GHOST_PET_LOCOMOTION_HINT_V0.FOLLOW;
  if (mode === "IDLE" && init < 0.36) return GHOST_PET_LOCOMOTION_HINT_V0.IDLE_DRIFT;
  return GHOST_PET_LOCOMOTION_HINT_V0.ORBIT;
}
