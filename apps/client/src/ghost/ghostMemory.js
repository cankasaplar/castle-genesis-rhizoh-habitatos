/**
 * vNext-545 — Ghost episodic memory (kısa pencere; habitat fingerprint ile hizalı).
 */

/**
 * @typedef {object} GhostMemoryEntry
 * @property {number} t
 * @property {string} habitatFingerprint
 * @property {import("./ghostGenome.js").GhostGenome} genome
 * @property {import("./ghostEvolution.js").GhostEvolutionStageId} stage
 */

/**
 * @param {object} [opts]
 * @param {number} [opts.maxEntries]
 */
export function createGhostMemory(opts = {}) {
  const maxEntries = opts.maxEntries ?? 96;
  /** @type {GhostMemoryEntry[]} */
  const buf = [];

  return {
    /**
     * @param {Omit<GhostMemoryEntry, "t"> & { t?: number }} entry
     */
    push(entry) {
      buf.push({
        t: entry.t ?? Date.now(),
        habitatFingerprint: entry.habitatFingerprint,
        genome: entry.genome,
        stage: entry.stage
      });
      while (buf.length > maxEntries) buf.shift();
    },

    /** @returns {GhostMemoryEntry | null} */
    latest() {
      return buf.length ? buf[buf.length - 1] : null;
    },

    /** @returns {readonly GhostMemoryEntry[]} */
    snapshot() {
      return Object.freeze([...buf]);
    },

    clear() {
      buf.length = 0;
    }
  };
}
