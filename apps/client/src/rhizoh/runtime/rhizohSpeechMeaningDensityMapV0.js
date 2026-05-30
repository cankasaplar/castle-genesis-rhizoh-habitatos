/**
 * Speech Meaning Engine v0 — per-segment meaning density (anlam yoğunluk haritası).
 */

export const RHIZOH_SPEECH_DENSITY_MAP_SCHEMA_V0 = "castle.rhizoh.speech_meaning_density_map.v0";

const DENSITY_LEXICON_V0 = Object.freeze([
  "rhizoh",
  "rizo",
  "riza",
  "önemli",
  "gerçek",
  "anlam",
  "hatırla",
  "unutma",
  "çünkü",
  "aslında",
  "neden",
  "nasıl",
  "belki",
  "kesin",
  "dün",
  "bugün",
  "yarın",
  "castle",
  "dünya"
]);

const EMOTION_MARKERS_V0 = Object.freeze([
  "üzgün",
  "mutlu",
  "korku",
  "heyecan",
  "sakin",
  "sıcak",
  "soğuk",
  "yalnız",
  "birlikte"
]);

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {string} text
 */
function lexicalDensity01V0(text) {
  const tokens = String(text || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return 0;
  const longTokens = tokens.filter((t) => t.length >= 6).length;
  const avgLen = tokens.reduce((s, t) => s + t.length, 0) / tokens.length;
  return clamp01(longTokens / tokens.length + (avgLen - 4) * 0.04);
}

/**
 * @param {string} text
 */
function signalHitsV0(text) {
  const lower = String(text || "").toLowerCase();
  const lexiconHits = DENSITY_LEXICON_V0.filter((w) => lower.includes(w)).length;
  const emotionHits = EMOTION_MARKERS_V0.filter((w) => lower.includes(w)).length;
  const numbers = (text.match(/\d+/g) || []).length;
  const proper = (text.match(/\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]+\b/g) || []).length;
  return Object.freeze({
    lexiconHits,
    emotionHits,
    numbers,
    proper,
    question: /\?/.test(text),
    exclaim: /!/.test(text)
  });
}

/**
 * @param {ReturnType<import("./rhizohSpeechSentenceSegmenterV0.js").segmentSpeechTextV0>} segmentation
 */
export function buildMeaningDensityMapV0(segmentation) {
  const segments = segmentation?.segments || [];
  if (!segments.length) {
    return Object.freeze({
      schema: RHIZOH_SPEECH_DENSITY_MAP_SCHEMA_V0,
      segments: Object.freeze([]),
      utteranceDensity01: 0,
      hotspots: Object.freeze([])
    });
  }

  const mapped = segments.map((seg) => {
    const signals = signalHitsV0(seg.text);
    const lexical = lexicalDensity01V0(seg.text);
    const tokenCount = String(seg.text || "").split(/\s+/).filter(Boolean).length;
    const density01 = clamp01(
      lexical * 0.35 +
        Math.min(0.25, signals.lexiconHits * 0.06) +
        Math.min(0.12, signals.emotionHits * 0.05) +
        Math.min(0.1, signals.proper * 0.04) +
        Math.min(0.08, signals.numbers * 0.04) +
        (signals.question ? 0.12 : 0) +
        (signals.exclaim ? 0.08 : 0) +
        Math.min(0.1, tokenCount * 0.015)
    );
    return Object.freeze({
      segmentId: seg.id,
      density01,
      tokenCount,
      signals
    });
  });

  const utteranceDensity01 = clamp01(
    mapped.reduce((s, m) => s + m.density01, 0) / mapped.length
  );

  const hotspots = mapped
    .filter((m) => m.density01 >= 0.55)
    .sort((a, b) => b.density01 - a.density01)
    .slice(0, 4)
    .map((m) => m.segmentId);

  return Object.freeze({
    schema: RHIZOH_SPEECH_DENSITY_MAP_SCHEMA_V0,
    segments: Object.freeze(mapped),
    utteranceDensity01,
    hotspots: Object.freeze(hotspots)
  });
}
