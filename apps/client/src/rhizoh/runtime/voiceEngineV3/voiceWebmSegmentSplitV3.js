/**
 * Voice v3 — MediaRecorder chunk → upload segments (webm header preserved per segment).
 */

/**
 * @param {Blob[]} chunks
 * @param {string} mimeType
 * @param {number} maxSegmentBytes
 * @returns {Blob[] | null} null when split not needed / not possible
 */
export function buildWebmSegmentBlobsV3(chunks, mimeType, maxSegmentBytes) {
  if (!Array.isArray(chunks) || chunks.length < 2) return null;
  const limit = Number(maxSegmentBytes) > 0 ? Number(maxSegmentBytes) : 58_000;
  const header = chunks[0];
  /** @type {Blob[]} */
  const segments = [];
  /** @type {Blob[]} */
  let group = [header];
  let groupSize = header.size;

  for (let i = 1; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    if (groupSize + chunk.size > limit && group.length > 1) {
      segments.push(new Blob(group, { type: mimeType }));
      group = [header, chunk];
      groupSize = header.size + chunk.size;
    } else {
      group.push(chunk);
      groupSize += chunk.size;
    }
  }

  if (group.length) {
    segments.push(new Blob(group, { type: mimeType }));
  }

  return segments.length > 1 ? segments : null;
}

/**
 * @param {{ text?: string, confidence?: number, strategy?: string, source?: string }[]} parts
 */
export function mergeSegmentTranscriptsV3(parts) {
  const texts = (parts || []).map((p) => String(p?.text || "").trim()).filter(Boolean);
  const confidences = (parts || [])
    .map((p) => Number(p?.confidence))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!texts.length) {
    return Object.freeze({ text: "", confidence: 0, source: "none", strategy: "split_empty" });
  }
  return Object.freeze({
    text: texts.join(" "),
    confidence: confidences.length
      ? confidences.reduce((sum, n) => sum + n, 0) / confidences.length
      : 0.75,
    source: "whisper",
    strategy: "split_merged"
  });
}
