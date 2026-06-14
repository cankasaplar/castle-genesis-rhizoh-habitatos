/**
 * Medusa companion stream gate — live camera and/or microphone for motion.
 */

/**
 * @param {MediaStream | null | undefined} stream
 * @returns {boolean}
 */
export function isMedusaCompanionStreamActiveV0(stream) {
  if (!stream) return false;
  const videoTracks =
    typeof stream.getVideoTracks === "function" ? stream.getVideoTracks() : [];
  const audioTracks =
    typeof stream.getAudioTracks === "function" ? stream.getAudioTracks() : [];
  const liveVideo = videoTracks.some((track) => track.readyState === "live" && track.enabled !== false);
  const liveAudio = audioTracks.some((track) => track.readyState === "live" && track.enabled !== false);
  return liveVideo || liveAudio;
}

/**
 * @param {MediaStream | null | undefined} stream
 */
export function medusaCompanionStreamHasVideoV0(stream) {
  if (!stream?.getVideoTracks) return false;
  return stream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled !== false);
}
