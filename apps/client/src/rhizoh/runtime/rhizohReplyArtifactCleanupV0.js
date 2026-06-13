/**
 * Shared reply artifact cleanup — chat UI + TTS read path.
 * Strips n1/n2 chunk markers, list prefixes, markdown emphasis.
 */

export const RHIZOH_REPLY_ARTIFACT_CLEANUP_SCHEMA_V0 = "castle.rhizoh.reply_artifact_cleanup.v0";

/**
 * @param {string} text
 * @returns {string}
 */
export function stripRhizohReplyArtifactsV0(text) {
  let t = String(text || "");
  if (!t.trim()) return "";

  t = t.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");
  t = t.replace(/_{1,2}([^_]+)_{1,2}/g, "$1");
  t = t.replace(/^\s*[-*•]\s+/gm, "");
  t = t.replace(/(?:^|\s)[nN]?[0-9]+[.)]\s*/g, " ");
  t = t.replace(/\b[nN][0-9]+\b/g, "");
  t = t.replace(/\breply\s*[:\-]?\s*/gi, "");
  t = t.replace(/\s{2,}/g, " ");
  return t.trim();
}
