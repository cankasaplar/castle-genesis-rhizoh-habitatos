/**
 * Medusa companion stream gate — no ghost render without live camera.
 */

/**
 * @param {MediaStream | null | undefined} stream
 * @returns {boolean}
 */
export function isMedusaCompanionStreamActiveV0(stream) {
  if (!stream || typeof stream.getVideoTracks !== "function") return false;
  const tracks = stream.getVideoTracks();
  if (!tracks.length) return false;
  return tracks.some((track) => track.readyState === "live" && track.enabled !== false);
}
