/**
 * Voice ready coherence — RPSE · fieldState · UI on same clock (release checklist B).
 * @see docs/RHIZOH_RELEASE_CONTROL_ROOM_V0.md
 */

import { RHIZOH_ATTENTION_V0 } from "./rhizohPresenceStateEngineV0.js";

export const VOICE_READY_COHERENCE_SCHEMA_V0 = "castle.rhizoh.voice_ready_coherence.v0";

/**
 * @param {{
 *   presence?: ReturnType<import("./rhizohPresenceStateEngineV0.js").deriveRhizohPresenceStateV0>,
 *   fieldState?: string,
 *   voiceReady?: boolean,
 *   voiceAdapterReady?: boolean,
 *   uiShowsListening?: boolean
 * }} ctx
 */
export function evaluateVoiceReadyCoherenceV0(ctx = {}) {
  const field = String(ctx.fieldState || "IDLE").toUpperCase();
  const presence = ctx.presence;
  const voiceReady = ctx.voiceReady === true;
  const adapterReady = ctx.voiceAdapterReady === true;
  const uiListening = ctx.uiShowsListening === true;

  const fieldListening = field === "LISTENING";
  const rpseListening =
    presence?.rhizoh_attention === RHIZOH_ATTENTION_V0.LISTENING ||
    presence?.silence_form === "listening_hold";

  const gaps = [];
  if (fieldListening !== rpseListening) gaps.push("field_rpse_mismatch");
  if (fieldListening !== uiListening) gaps.push("field_ui_mismatch");
  if (voiceReady && !adapterReady && fieldListening) gaps.push("ready_without_adapter");

  const aligned =
    gaps.length === 0 &&
    (!fieldListening || (rpseListening && uiListening));

  return Object.freeze({
    schema: VOICE_READY_COHERENCE_SCHEMA_V0,
    atMs: Number(presence?.atMs) || Date.now(),
    voice_ready_coherent_ok: aligned,
    field_state: field,
    rpse_listening: rpseListening,
    ui_listening: uiListening,
    voice_ready: voiceReady,
    voice_adapter_ready: adapterReady,
    gaps: Object.freeze(gaps)
  });
}
