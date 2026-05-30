/**
 * Conversation voicing roles — companion field, not assistant/service symmetry.
 */

export const RHIZOH_CONVERSATION_VOICING_V0 = Object.freeze({
  USER: "user",
  /** Coexisting conversational entity (Rhizoh resonance), not a service agent. */
  COMPANION: "companion"
});

/**
 * @param {string | null | undefined} role
 */
export function normalizeConversationVoicingV0(role) {
  const r = String(role || "").toLowerCase();
  if (r === "companion" || r === "rhizoh" || r === "assistant") {
    return RHIZOH_CONVERSATION_VOICING_V0.COMPANION;
  }
  return RHIZOH_CONVERSATION_VOICING_V0.USER;
}
