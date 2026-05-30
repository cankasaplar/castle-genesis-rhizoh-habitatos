/**
 * SPECFLOW: RESEARCH-ONLY — multi-user Castle social runtime **contract** (policy SSOT).
 *
 * Enforcement today: `advanceCastleSocialIdentity` / CSIL (`csil/`), `castlePeersForSocial`,
 * `socialStateAuthorityArbiterV0` (Rhizoh tick vs user hard events). This module does **not**
 * execute authority; it names layers, rules, and priority order so CSIL + arbiter refactors
 * stay aligned (“one coherent thread” > “everyone heard equally”).
 *
 * Canonical one-liner (product / architecture):
 * Rhizoh Castle is a multi-user social runtime node where a single coherent conversational
 * thread is maintained through arbitration-based turn control, language-aware persona routing,
 * and bounded initiative-driven presence modulation.
 */

/** @readonly */
export const CASTLE_MULTI_USER_SOCIAL_ARCHITECTURE_ONE_LINER_V0 =
  "Rhizoh Castle is a multi-user social runtime node where a single coherent conversational thread is maintained through arbitration-based turn control, language-aware persona routing, and bounded initiative-driven presence modulation.";

/** @readonly */
export const CASTLE_SOCIAL_LAYER_IDS_V0 = Object.freeze({
  PRESENCE: "PRESENCE",
  SOCIAL_STATE: "SOCIAL_STATE",
  ARBITRATION: "ARBITRATION"
});

/**
 * Presence slice (target shape; not yet a single runtime store).
 * @typedef {{
 *   userId: string,
 *   lastActiveAt: number,
 *   language: string,
 *   role: "GUEST"|"OWNER"|"VISITOR"
 * }} CastlePresenceUserV0
 */

/**
 * Shared castle mood (target shape; overlaps meta / CSIL evolution).
 * @typedef {{
 *   energy01: number,
 *   silenceLevel: string,
 *   lastInteractionAt: number,
 *   dominantLanguage: string,
 *   socialMode: string
 * }} CastleSocialStateV0
 */

/** @readonly */
export const CASTLE_GROUP_MODE_THRESHOLDS_V0 = Object.freeze({
  /** 2–4 peers: moderated / mediator-style Rhizoh posture (contractual label). */
  multiUserMin: 2,
  /** 5+: “conductor” posture — less verbosity, more structure (contractual label). */
  groupModeMin: 5
});

/** @readonly CSIL-style rules (single-thread + focus + Rhizoh bounds). */
export const CASTLE_CSIL_THREAD_RULES_V0 = Object.freeze([
  {
    id: "CSIL_RULE_1_SINGLE_SOCIAL_THREAD",
    summary: "Only one active social focus at a time; others are background presence."
  },
  {
    id: "CSIL_RULE_2_SOCIAL_FOCUS_SHIFT",
    summary:
      "Focus shifts only on: user speaks, silence timeout, Rhizoh initiative (bounded, no interrupt spam)."
  },
  {
    id: "CSIL_RULE_3_RHIZOH_AUTHORITY",
    summary: "Rhizoh may open speech only within controlled initiative budget."
  },
  {
    id: "CSIL_RULE_4_LANGUAGE_DOMINANCE",
    summary: "dominantLanguage follows most recent active speaker; persona routes per focus."
  },
  {
    id: "CSIL_RULE_5_PRESENCE_BLENDING",
    summary: "Castle energy blends Σ(userActivity) / userCount (contract; refine when presence store exists)."
  }
]);

/**
 * Arbitration priority stack (highest wins on conflict). Aligns with client arbiter + future CSIL merge.
 * @readonly
 */
export const CASTLE_ARBITRATION_PRIORITY_STACK_V0 = Object.freeze([
  "USER_HARD_EVENT",
  "RHIZOH_INITIATIVE",
  "TICK_DRIFT_AMBIENT"
]);

/** @readonly */
export const CASTLE_SOCIAL_FLOW_PHASES_V0 = Object.freeze([
  "IDLE",
  "AWARE",
  "SOCIAL_ACTIVE",
  "MULTI_USER_BALANCED",
  "HOST",
  "INTERPRETER",
  "IDLE_RETURN"
]);

/** @readonly Situation → Rhizoh runtime role label (policy, not LLM prompt). */
export const CASTLE_RHIZOH_ROLE_ROLLER_V0 = Object.freeze([
  { situation: "single_user", role: "GUIDE" },
  { situation: "users_2_3", role: "MEDIATOR" },
  { situation: "mixed_languages_3_plus", role: "INTERPRETER" },
  { situation: "silence", role: "AMBIENT_PRESENCE" },
  { situation: "conflict", role: "ARBITER" }
]);

/** @readonly */
export const CASTLE_LANGUAGE_THREAD_RULE_V0 = Object.freeze({
  perUserResponseLocale: true,
  castleRetainsDominantThreadLanguage: true,
  dominantFromMostRecentActiveSpeaker: true
});

/** @readonly */
export const CASTLE_SIMULTANEOUS_SPEECH_RULE_V0 = Object.freeze({
  focusWinner: "earliest_timestamp",
  otherUsers: "shadow_listener"
});

/**
 * @returns {readonly string[]}
 */
export function getCastleArbitrationPriorityStackV0() {
  return CASTLE_ARBITRATION_PRIORITY_STACK_V0;
}
