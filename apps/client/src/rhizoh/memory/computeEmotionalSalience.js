import { normalizeEmotionState } from "../emotion/emotionState.js";

/** E: 0–1 duygusal belirginlik (W formülünde 1+E). */
export function computeEmotionalSalience(emotions) {
  const e = normalizeEmotionState(emotions || {});
  const raw = 0.48 * e.tension + 0.42 * e.rupture + 0.22 * e.care + 0.18 * e.repair;
  return Math.min(1, Math.round((raw / 1.25) * 1000) / 1000);
}
