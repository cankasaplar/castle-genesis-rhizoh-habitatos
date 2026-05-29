/**
 * Launch Polish Night — read-only media / voice pipeline diagnostics (no behavior change).
 * @see apps/client/docs/LAUNCH_POLISH_NIGHT_V1.md
 */

export const LAUNCH_POLISH_DIAGNOSTICS_SCHEMA_V0 = "castle.rhizoh.launch_polish_diagnostics.v0";

/**
 * @param {MediaStream | null | undefined} stream
 */
export function listMediaTrackSnapshotV0(stream) {
  if (!stream?.getTracks) return [];
  return stream.getTracks().map((t) => ({
    kind: t.kind,
    readyState: t.readyState,
    enabled: t.enabled,
    muted: t.muted,
    label: t.label || ""
  }));
}

/**
 * @param {{
 *   voiceTtsSessionId?: number,
 *   voiceTurnBusy?: boolean,
 *   voiceLoopEnabled?: boolean,
 *   recognitionActive?: boolean,
 *   bargeInActive?: boolean,
 *   mediaStream?: MediaStream | null
 * }} input
 */
export function buildLaunchPolishVoiceSnapshotV0(input = {}) {
  let speech = { speaking: false, pending: false, paused: false };
  try {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      speech = {
        speaking: !!window.speechSynthesis.speaking,
        pending: !!window.speechSynthesis.pending,
        paused: !!window.speechSynthesis.paused
      };
    }
  } catch {
    /* noop */
  }

  return Object.freeze({
    schema: LAUNCH_POLISH_DIAGNOSTICS_SCHEMA_V0,
    atMs: Date.now(),
    voiceTtsSessionId: Number(input.voiceTtsSessionId) || 0,
    voiceTurnBusy: !!input.voiceTurnBusy,
    voiceLoopEnabled: !!input.voiceLoopEnabled,
    recognitionActive: !!input.recognitionActive,
    bargeInActive: !!input.bargeInActive,
    speechSynthesis: Object.freeze(speech),
    mediaTracks: Object.freeze(listMediaTrackSnapshotV0(input.mediaStream))
  });
}
