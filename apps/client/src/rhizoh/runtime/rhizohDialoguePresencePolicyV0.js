/**
 * Dialogue presence — when Rhizoh narrates processing vs stays quiet (habitat default: quiet).
 * Spoken fillers ("Anladım", "bir saniye") and shadow acks are opt-in via env.
 */

export const RHIZOH_DIALOGUE_PRESENCE_POLICY_CONTRACT_V0 = "rhizoh.dialogue_presence_policy.v0";

function readEnvOnV0(name, defaultWhenUnset = false) {
  if (typeof import.meta === "undefined" || !import.meta.env) return defaultWhenUnset;
  const v = String(import.meta.env[name] || "").trim().toLowerCase();
  if (!v) return defaultWhenUnset;
  return v === "1" || v === "true" || v === "on";
}

/** Spoken instant ack before LLM (legacy). Default off — user hears reply only. */
export function isSpokenInstantAckEnabledV0() {
  return readEnvOnV0("VITE_RHIZOH_SPOKEN_INSTANT_ACK", false);
}

export function isQuietDialoguePresenceV0() {
  return !isSpokenInstantAckEnabledV0();
}

/** Spoken "Harita açılıyor" after deterministic local commands. Default off — act silently. */
export function shouldSpeakLocalCommandFeedbackV0() {
  return readEnvOnV0("VITE_RHIZOH_COMMAND_SPEECH", false);
}

/**
 * @param {{ speakInstantAck?: boolean, inputClass?: string, suppressInstantAck?: boolean }} [input]
 */
export function shouldSpeakInstantAckForTurnV0(input = {}) {
  if (input.suppressInstantAck === true) return false;
  if (input.inputClass === "COMMAND") return false;
  if (input.speakInstantAck === true) return true;
  if (input.speakInstantAck === false) return false;
  return isSpokenInstantAckEnabledV0();
}

/**
 * Hidden synthesis window — no user-facing processing speech before the real reply.
 * @param {string} [inputClass]
 */
export function isSilentSynthesisWindowV0(inputClass) {
  void inputClass;
  return isQuietDialoguePresenceV0();
}

/** Shadow observation ack ("Duyuyorum, bir saniye") on blocked routes. Default off. */
export function isSpokenShadowObservationAckEnabledV0() {
  return readEnvOnV0("VITE_RHIZOH_VOICE_SHADOW_OBS_ACK", false);
}

/** Continuity glue micro-bridge TTS ("…") during long LLM wait. Default off. */
export function isConversationMicroBridgeTtsEnabledV0() {
  return readEnvOnV0("VITE_RHIZOH_CONVERSATION_MICRO_BRIDGE_TTS", false);
}

/** Minimal busy chrome — not "Rhizoh is thinking". */
export function resolveQuietBusyStatusLineV0() {
  return "…";
}

/**
 * @param {boolean} [tr]
 */
export function resolveQuietReadyStatusLineV0(tr = true) {
  return tr ? "Hazır · yaz veya mikrofona bas" : "Ready · type or tap mic";
}

/**
 * Conversation dock / field chip labels under quiet presence.
 * @param {string} fieldState
 * @param {boolean} [tr]
 */
export function resolveQuietConversationFieldLabelV0(fieldState, tr = true) {
  const s = String(fieldState || "idle").toLowerCase();
  if (s === "speaking") return tr ? "Yanıt geliyor…" : "Reply…";
  if (s === "thinking" || s === "interpreting") return "…";
  if (s === "listening") return tr ? "Konuşmaya hazır" : "Ready to talk";
  return tr ? "Konuşmaya hazır" : "Ready to talk";
}
