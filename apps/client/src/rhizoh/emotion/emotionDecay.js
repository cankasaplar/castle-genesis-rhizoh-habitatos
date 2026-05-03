import { clampEmotion, normalizeEmotionState } from "./emotionState.js";

/**
 * Günlük çarpanlar (kullanıcı spesifikasyonu): uzun süre güncelleme yoksa tek seferde uygulanır.
 * @param {Record<string, number>} state
 * @param {number} elapsedMs
 */
export function decayEmotionsForElapsedMs(state, elapsedMs) {
  const ms = Number(elapsedMs) || 0;
  if (ms < 120_000) return normalizeEmotionState(state);

  const days = Math.min(ms / 86_400_000, 14);
  const pow = (perDay) => Math.pow(perDay, days);
  const s = normalizeEmotionState(state);

  return normalizeEmotionState({
    ...s,
    tension: clampEmotion(s.tension * pow(0.94)),
    repair: clampEmotion(s.repair * pow(0.91)),
    wonder: clampEmotion(s.wonder * pow(0.97)),
    rupture: clampEmotion(s.rupture * pow(0.96))
  });
}
