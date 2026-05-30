/**
 * PR-4-C — Rate limiting: physical environment changes stay slow, bounded, explainable.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Prevents “20 Hz disco light” or constant pan slewing from eroding epistemic habitat quality.
 */

/**
 * @param {{ defaultMinIntervalMs?: number, perEffectMinIntervalMs?: Record<string, number> }} [opts]
 */
export function createSpatialProjectionRateLimiterV0(opts = {}) {
  const def = Math.max(40, Math.min(60_000, Number(opts.defaultMinIntervalMs) || 150));
  const per = opts.perEffectMinIntervalMs && typeof opts.perEffectMinIntervalMs === "object" ? opts.perEffectMinIntervalMs : {};
  /** @type {Map<string, number>} */
  const last = new Map();

  return {
    /**
     * @param {string} effectKind
     * @param {number} nowMs
     */
    tryCommit(effectKind, nowMs) {
      const k = String(effectKind || "");
      const t = typeof nowMs === "number" && Number.isFinite(nowMs) ? nowMs : Date.now();
      const min = Math.max(def, Number(per[k]) || def);
      const prev = last.get(k);
      if (prev != null && t - prev < min) {
        return { ok: false, code: "SPATIAL_RATE_LIMITED", waitMs: min - (t - prev), effectKind: k };
      }
      last.set(k, t);
      return { ok: true, effectKind: k };
    },
    reset() {
      last.clear();
    }
  };
}
