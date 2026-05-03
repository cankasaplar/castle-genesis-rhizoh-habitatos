/**
 * Sovereign companion — her zaman moderator değil; yönlendirme ipuçları.
 */

export const VOICE_ROUTE = Object.freeze({
  DIRECT: "direct_reply",
  ROOM: "room_reply",
  MEDIATION: "mediation_reply",
  SILENT_WITNESS: "silent_witness",
  PRIVATE_WHISPER: "private_whisper"
});

/**
 * @param {{
 *   attention: { mode?: string, primarySpeaker?: string, listeners?: string[] },
 *   bondGraph: Record<string, { trust?: number, familiarity?: number, resonance?: number }>,
 *   operatorId: string,
 *   message: string
 * }} input
 */
export function inferVoiceRoute(input) {
  const attention = input.attention && typeof input.attention === "object" ? input.attention : {};
  const mode = String(attention.mode || "dialogue");
  const bonds = input.bondGraph?.[input.operatorId] || {};
  const trust = Number(bonds.trust ?? 0.5);
  const msg = String(input.message || "");

  if (mode === "room_observe") {
    return { type: VOICE_ROUTE.SILENT_WITNESS, addressee: null, addresseeId: null, rationale: "observe_room" };
  }

  const explicit = msg.match(/@([a-zA-ZğüşıöçĞÜŞİÖÇ][a-zA-ZğüşıöçĞÜŞİÖÇ0-9_-]{0,24})/);
  if (explicit) {
    return {
      type: VOICE_ROUTE.DIRECT,
      addressee: explicit[1],
      addresseeId: null,
      rationale: "explicit_mention"
    };
  }

  if (mode === "mediation_ready" && Array.isArray(attention.listeners) && attention.listeners.length >= 1) {
    return {
      type: VOICE_ROUTE.MEDIATION,
      addressee: attention.listeners.slice(0, 2).join(" · "),
      addresseeId: null,
      rationale: "bridge_listeners"
    };
  }

  if (trust >= 0.78 && msg.length > 100) {
    return {
      type: VOICE_ROUTE.DIRECT,
      addressee: attention.primarySpeaker || null,
      addresseeId: input.operatorId,
      rationale: "high_trust_depth"
    };
  }

  if (trust < 0.45 && msg.length > 40) {
    return {
      type: VOICE_ROUTE.ROOM,
      addressee: null,
      addresseeId: null,
      rationale: "low_trust_surface"
    };
  }

  return {
    type: VOICE_ROUTE.ROOM,
    addressee: null,
    addresseeId: null,
    rationale: "default_group_surface"
  };
}
