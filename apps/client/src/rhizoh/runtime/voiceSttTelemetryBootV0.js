/**
 * Boot side-effect — must be the first voice import in main.jsx (before React).
 */
import { installVoiceSttTelemetryV0, registerCastleVoiceEngineV3SnapshotProviderV0 } from "./voiceSttTelemetryV0.js";
import { publishVoiceGestureAnchorToWindowV0 } from "./voiceUserGestureAnchorV0.js";
import { getVoiceEngineTelemetrySnapshotV3 } from "./voiceEngineV3/voiceEngineTelemetryV3.js";
import { isVoiceEngineV3EnabledV0 } from "./voiceEngineV3/isVoiceEngineV3EnabledV0.js";

installVoiceSttTelemetryV0();
publishVoiceGestureAnchorToWindowV0();

if (typeof window !== "undefined") {
  window.__CASTLE_VOICE_BUILD__ = Object.freeze({
    schema: "castle.voice.boot.v1",
    phase: "telemetry_ready",
    voiceEngineV3: isVoiceEngineV3EnabledV0(),
    buildStamp: "voice-v3-hosting-rev-20260530-v14",
    atMs: Date.now()
  });
  if (isVoiceEngineV3EnabledV0()) {
    registerCastleVoiceEngineV3SnapshotProviderV0(getVoiceEngineTelemetrySnapshotV3);
  }
  try {
    console.warn("[VOICE_BOOT] telemetry + gesture anchor attached (pre-React)", {
      voiceStt: typeof window.__rhizoh?.voiceStt !== "undefined",
      voiceInit: typeof window.__rhizoh?.voiceInit === "function",
      castleVoice: typeof window.__CASTLE_VOICE__?.voiceStt === "function"
    });
  } catch {
    /* noop */
  }
}
