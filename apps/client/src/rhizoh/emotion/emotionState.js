/**
 * Rhizoh Emotional Continuity — session affect (0–1 scalars).
 */

export const DEFAULT_EMOTIONS = Object.freeze({
  trust: 0.4,
  familiarity: 0.1,
  tension: 0,
  wonder: 0.5,
  care: 0.3,
  rupture: 0,
  repair: 0
});

/** @param {number} val */
export function clampEmotion(val) {
  return Math.max(0, Math.min(1, Number(val) || 0));
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {typeof DEFAULT_EMOTIONS}
 */
export function normalizeEmotionState(raw) {
  const base = { ...DEFAULT_EMOTIONS, ...(raw && typeof raw === "object" ? raw : {}) };
  return {
    trust: Number(clampEmotion(base.trust).toFixed(3)),
    familiarity: Number(clampEmotion(base.familiarity).toFixed(3)),
    tension: Number(clampEmotion(base.tension).toFixed(3)),
    wonder: Number(clampEmotion(base.wonder).toFixed(3)),
    care: Number(clampEmotion(base.care).toFixed(3)),
    rupture: Number(clampEmotion(base.rupture).toFixed(3)),
    repair: Number(clampEmotion(base.repair).toFixed(3))
  };
}
