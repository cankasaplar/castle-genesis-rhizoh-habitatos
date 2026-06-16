/**
 * Per-tower voice adapter — ElevenLabs via gateway when legal gate allows, else browser TTS presets.
 * @see docs/RHIZOH_LEGAL_INGRESS_FREEZE_V1.0.md
 */

import { speakRhizohReplyChunkedV0 } from "./rhizohSpeechChunkTtsV0.js";
import { resolveRhizohTowerProviderV0 } from "./rhizohTowerProviderRegistryV0.js";
import { hasLegalAccessAckV0 } from "../ingress/ingress_router.js";
import { getGenesisProtocolGatewayOrigin } from "../../castleFlight/castleFlightConfig.js";

export const TOWER_VOICE_ADAPTER_SCHEMA_V0 = "castle.rhizoh.tower_voice_adapter.v0";

/** Per-tower browser TTS + optional ElevenLabs voice id (gateway proxy). */
export const TOWER_VOICE_PRESETS_V0 = Object.freeze({
  gemini_tower: Object.freeze({ voiceId: "pNInz6obpgDQGcFmaJgB", rate: 1.02, pitch: 1.04, label: "Gemini" }),
  claude_tower: Object.freeze({ voiceId: "EXAVITQu4vr4xnSDxMaL", rate: 0.98, pitch: 0.96, label: "Claude" }),
  chatgpt_tower: Object.freeze({ voiceId: "21m00Tcm4TlvDq8ikWAM", rate: 1.0, pitch: 1.0, label: "ChatGPT" }),
  deepmind_tower: Object.freeze({ voiceId: "AZnzlk1XvdvUeBnXmlld", rate: 0.97, pitch: 1.02, label: "DeepMind" }),
  mistral_tower: Object.freeze({ voiceId: "VR6AewLTigWG4xSOukaG", rate: 1.05, pitch: 0.98, label: "Mistral" }),
  kyoto_tower: Object.freeze({ voiceId: "yoZ06aMxZJJ28mfd3POQ", rate: 0.96, pitch: 1.0, label: "Kyoto" }),
  sora_tower: Object.freeze({ voiceId: "MF3mGyEYCl7XYWbV9V6O", rate: 1.03, pitch: 1.05, label: "Sora" })
});

function readEnvV0(key) {
  try {
    return String(
      typeof import.meta !== "undefined" && import.meta.env ? import.meta.env[key] || "" : ""
    ).trim();
  } catch {
    return "";
  }
}

/**
 * ElevenLabs path requires legal ack + explicit env flag (no client-side API key).
 */
export function isTowerElevenLabsVoiceEnabledV0() {
  if (!hasLegalAccessAckV0()) return false;
  return readEnvV0("VITE_RHIZOH_ELEVENLABS_VOICE") === "1";
}

/**
 * @param {string} towerId
 */
export function resolveTowerVoicePresetV0(towerId) {
  const id = String(towerId || "").trim();
  const row = TOWER_VOICE_PRESETS_V0[id];
  if (row) return row;
  const provider = resolveRhizohTowerProviderV0(id);
  return Object.freeze({
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    rate: 1.0,
    pitch: 1.0,
    label: provider.labelEn || "Tower"
  });
}

/**
 * @param {string} towerId
 * @param {string} text
 * @param {{ language?: string, fetchImpl?: typeof fetch }} [opts]
 */
export async function speakTowerReplyV0(towerId, text, opts = {}) {
  const msg = String(text || "").trim();
  if (!msg) return { ok: false, reason: "empty_text" };

  const preset = resolveTowerVoicePresetV0(towerId);

  if (isTowerElevenLabsVoiceEnabledV0()) {
    const gateway = readEnvV0("VITE_GATEWAY_HTTP") || getGenesisProtocolGatewayOrigin();
    if (gateway) {
      const fetchFn = opts.fetchImpl ?? fetch;
      try {
        const res = await fetchFn(`${gateway.replace(/\/$/, "")}/rhizoh/tts/elevenlabs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: msg,
            voiceId: preset.voiceId,
            towerId: String(towerId || ""),
            language: opts.language || "en"
          })
        });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 0 && typeof Audio !== "undefined") {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            await audio.play();
            audio.onended = () => URL.revokeObjectURL(url);
            return { ok: true, provider: "elevenlabs_gateway", towerId, preset };
          }
        }
      } catch {
        /* fall through to browser TTS */
      }
    }
  }

  return speakRhizohReplyChunkedV0(msg, {
    smoothAfterAck: false,
    language: opts.language,
    skeleton: Object.freeze({
      pacing: "calm",
      microRhythmFeel: Object.freeze({ breakStyle: "tower_preset", preemptiveStart01: 0.08 })
    }),
    voiceRateOverride: preset.rate,
    voicePitchOverride: preset.pitch
  });
}
