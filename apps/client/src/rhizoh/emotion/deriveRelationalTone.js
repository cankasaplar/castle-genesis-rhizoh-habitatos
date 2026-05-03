import { clampEmotion } from "./emotionState.js";

/**
 * Duygu vektörü → ses / prompt tonu (Voice Composer girdisi).
 * @param {import("./emotionState.js").DEFAULT_EMOTIONS} e
 */
export function deriveRelationalTone(e) {
  const trust = e.trust ?? 0.4;
  const care = e.care ?? 0.3;
  const tension = e.tension ?? 0;
  const wonder = e.wonder ?? 0.5;
  const familiarity = e.familiarity ?? 0.1;
  const rupture = e.rupture ?? 0;
  const repair = e.repair ?? 0;

  const warmth = clampEmotion(0.32 + 0.5 * ((care + trust + familiarity) / 3) + 0.12 * repair - 0.18 * rupture);
  const directness = clampEmotion(0.34 + 0.52 * tension + 0.22 * rupture - 0.12 * wonder);
  const patience = clampEmotion(0.52 + 0.42 * care - 0.38 * tension + 0.12 * repair);
  const depth = clampEmotion(0.38 + 0.48 * wonder + 0.14 * trust - 0.15 * directness);

  return {
    warmth: Number(warmth.toFixed(3)),
    directness: Number(directness.toFixed(3)),
    patience: Number(patience.toFixed(3)),
    depth: Number(depth.toFixed(3))
  };
}
