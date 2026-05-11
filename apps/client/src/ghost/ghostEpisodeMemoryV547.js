/**
 * vNext-547 — Episodic wake / climax hafızası (kısa pencere).
 */

/**
 * @typedef {object} GhostEpisodeEntry
 * @property {number} t
 * @property {"wake_climax" | "oracle_shift" | "branch_surge"} kind
 * @property {number} intensity01
 * @property {string} habitatFingerprint
 * @property {string} narrationTone
 * @property {string | null} emphasizedDistrictId
 */

/**
 * @param {object} [opts]
 * @param {number} [opts.maxEntries]
 */
export function createGhostEpisodeMemory(opts = {}) {
  const maxEntries = opts.maxEntries ?? 40;
  /** @type {GhostEpisodeEntry[]} */
  const buf = [];

  return {
    /**
     * @param {Omit<GhostEpisodeEntry, "t"> & { t?: number }} e
     */
    push(e) {
      buf.push({
        t: e.t ?? Date.now(),
        kind: e.kind,
        intensity01: e.intensity01,
        habitatFingerprint: e.habitatFingerprint,
        narrationTone: e.narrationTone,
        emphasizedDistrictId: e.emphasizedDistrictId ?? null
      });
      while (buf.length > maxEntries) buf.shift();
    },

    /** @param {number} [n] */
    recent(n = 10) {
      return Object.freeze(buf.slice(-n));
    },

    clear() {
      buf.length = 0;
    }
  };
}
