/**
 * PR-4-C — Hardware effect contract: bounded physical actuation kinds (ethics / safety envelope).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Spatial cue → air gap → **normalized hardware effect** → device adapter (Hue, audio, etc.).
 * Explicitly excludes manipulative or covert channels.
 */

export const HARDWARE_EFFECT_KIND_V0 = Object.freeze({
  LIGHT_INTENSITY: "LIGHT_INTENSITY",
  COLOR_TEMPERATURE: "COLOR_TEMPERATURE",
  AUDIO_PAN: "AUDIO_PAN",
  AUDIO_SPREAD: "AUDIO_SPREAD",
  LOW_FREQ_HUM: "LOW_FREQ_HUM"
});

/** @type {readonly string[]} */
export const ALLOWED_HARDWARE_EFFECT_KINDS_V0 = Object.freeze(Object.values(HARDWARE_EFFECT_KIND_V0));

export const FORBIDDEN_HARDWARE_EFFECT_KINDS_V0 = Object.freeze([
  "SPEECH_SYNTHESIS",
  "SUBLIMINAL_PULSE",
  "HIDDEN_ULTRASONIC",
  "ADAPTIVE_PERSUASION",
  "COVERT_BEHAVIORAL_LAYER"
]);

/**
 * @param {string} kind
 * @returns {{ ok: true } | { ok: false, code: "HARDWARE_EFFECT_REJECTED", kind: string }}
 */
export function assertHardwareEffectKindAllowedV0(kind) {
  const k = String(kind || "").trim();
  if (!k) return { ok: false, code: "HARDWARE_EFFECT_REJECTED", kind: String(kind) };
  if (FORBIDDEN_HARDWARE_EFFECT_KINDS_V0.includes(k)) {
    return { ok: false, code: "HARDWARE_EFFECT_REJECTED", kind: k };
  }
  if (!ALLOWED_HARDWARE_EFFECT_KINDS_V0.includes(k)) {
    return { ok: false, code: "HARDWARE_EFFECT_REJECTED", kind: k };
  }
  return { ok: true };
}
