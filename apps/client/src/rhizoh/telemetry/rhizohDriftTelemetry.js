const EMOTION_KEYS = ["trust", "familiarity", "tension", "wonder", "care", "rupture", "repair"];
const TONE_KEYS = ["warmth", "directness", "patience", "depth"];

/**
 * Governor öncesi / sonrası L1 mesafesi (telemetri + adaptasyon kancası).
 */
export function computeDriftMetrics(emotionsPre, emotionsPost, tonePre, tonePost) {
  const a = emotionsPre && typeof emotionsPre === "object" ? emotionsPre : {};
  const b = emotionsPost && typeof emotionsPost === "object" ? emotionsPost : {};
  const emotionL1 = EMOTION_KEYS.reduce(
    (s, k) => s + Math.abs((Number(a[k]) || 0) - (Number(b[k]) || 0)),
    0
  );
  const tp = tonePre && typeof tonePre === "object" ? tonePre : {};
  const tq = tonePost && typeof tonePost === "object" ? tonePost : {};
  const toneL1 = TONE_KEYS.reduce(
    (s, k) => s + Math.abs((Number(tp[k]) || 0) - (Number(tq[k]) || 0)),
    0
  );
  return {
    emotionL1: Math.round(emotionL1 * 1000) / 1000,
    toneL1: Math.round(toneL1 * 1000) / 1000
  };
}

/**
 * Disk `meta.rhizohDriftLog` için tek satır (timestamp çağıran ekler).
 * @param {{
 *   phase: string,
 *   emotionsPre: Record<string, unknown>,
 *   emotionsPost: Record<string, unknown>,
 *   tonePre: Record<string, unknown>,
 *   tonePost: Record<string, unknown>,
 *   intent?: string,
 *   source?: string,
 *   resonance?: number | null
 * }} p
 */
export function buildRhizohDriftLogEntry(p) {
  const { emotionL1, toneL1 } = computeDriftMetrics(p.emotionsPre, p.emotionsPost, p.tonePre, p.tonePost);
  return {
    phase: String(p.phase || ""),
    intent: String(p.intent || ""),
    source: String(p.source || ""),
    resonance: p.resonance != null && Number.isFinite(p.resonance) ? Number(p.resonance) : null,
    emotionL1,
    toneL1,
    governorCorrection: emotionL1 + toneL1 * 0.35
  };
}
