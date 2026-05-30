/**
 * Speech Meaning Engine v0 — sentence / clause segmenter (TR + EN punctuation).
 * Read-side only; shapes TTS chunking and rhythm, not execution authority.
 */

export const RHIZOH_SPEECH_SEGMENT_KIND_V0 = Object.freeze({
  SENTENCE: "sentence",
  CLAUSE: "clause",
  FRAGMENT: "fragment"
});

export const RHIZOH_SPEECH_SEGMENTER_SCHEMA_V0 = "castle.rhizoh.speech_sentence_segmenter.v0";

const SENTENCE_SPLIT_RE_V0 = /(?<=[.!?…])\s+|\n+/;
const CLAUSE_SPLIT_RE_V0 = /(?<=[,;:])\s+|(?<=[—–])\s+/;

/**
 * @param {number} id
 * @param {string} text
 * @param {string} kind
 * @param {number} index
 */
function freezeSegmentV0(id, text, kind, index) {
  return Object.freeze({
    id: `seg-${id}`,
    index,
    text,
    kind,
    charLength: text.length,
    endsWithQuestion: /\?\s*$/.test(text),
    endsWithExclaim: /!\s*$/.test(text)
  });
}

/**
 * @param {string} block
 * @param {number} maxClauseChars
 * @param {number} startId
 * @param {number} startIndex
 * @returns {{ segments: object[], nextId: number, nextIndex: number }}
 */
function splitBlockV0(block, maxClauseChars, startId, startIndex) {
  const trimmed = String(block || "").trim();
  if (!trimmed) return { segments: [], nextId: startId, nextIndex: startIndex };

  if (trimmed.length <= maxClauseChars) {
    return {
      segments: [freezeSegmentV0(startId, trimmed, RHIZOH_SPEECH_SEGMENT_KIND_V0.SENTENCE, startIndex)],
      nextId: startId + 1,
      nextIndex: startIndex + 1
    };
  }

  const parts = trimmed.split(CLAUSE_SPLIT_RE_V0).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return {
      segments: [
        freezeSegmentV0(startId, trimmed, RHIZOH_SPEECH_SEGMENT_KIND_V0.FRAGMENT, startIndex)
      ],
      nextId: startId + 1,
      nextIndex: startIndex + 1
    };
  }

  const segments = [];
  let id = startId;
  let idx = startIndex;
  for (const part of parts) {
    if (!part) continue;
    const kind =
      part.length > maxClauseChars
        ? RHIZOH_SPEECH_SEGMENT_KIND_V0.FRAGMENT
        : RHIZOH_SPEECH_SEGMENT_KIND_V0.CLAUSE;
    segments.push(freezeSegmentV0(id, part, kind, idx));
    id += 1;
    idx += 1;
  }
  return { segments, nextId: id, nextIndex: idx };
}

/**
 * @param {string} text
 * @param {{ maxClauseChars?: number }} [opts]
 */
export function segmentSpeechTextV0(text, opts = {}) {
  const raw = String(text || "").trim();
  const maxClauseChars = Math.max(40, Math.floor(Number(opts.maxClauseChars) || 140));

  if (!raw) {
    return Object.freeze({
      schema: RHIZOH_SPEECH_SEGMENTER_SCHEMA_V0,
      segments: Object.freeze([]),
      utteranceLength: 0,
      sentenceCount: 0
    });
  }

  const blocks = raw.split(SENTENCE_SPLIT_RE_V0).map((b) => b.trim()).filter(Boolean);
  const segments = [];
  let id = 0;
  let index = 0;

  for (const block of blocks) {
    const chunk = splitBlockV0(block, maxClauseChars, id, index);
    segments.push(...chunk.segments);
    id = chunk.nextId;
    index = chunk.nextIndex;
  }

  const sentenceCount = segments.filter(
    (s) => s.kind === RHIZOH_SPEECH_SEGMENT_KIND_V0.SENTENCE
  ).length;

  return Object.freeze({
    schema: RHIZOH_SPEECH_SEGMENTER_SCHEMA_V0,
    segments: Object.freeze(segments),
    utteranceLength: raw.length,
    sentenceCount: sentenceCount || segments.length
  });
}
