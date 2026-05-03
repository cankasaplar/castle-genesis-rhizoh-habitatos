/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * Higher organism activity → faster slow-truth cadence (lower interval ms).
 * Optional hysteresis: tiny deltas vs previous applied interval reduce cadence flicker.
 *
 * @param {Record<string, unknown> | null | undefined} diagnostics
 * @param {{ min?: number, max?: number, base?: number, previousIntervalMs?: number | null, hysteresisMs?: number }} [opts]
 */
export function computeAdaptiveTruthIntervalMs(diagnostics, opts = {}) {
  const min = opts.min ?? 220;
  const max = opts.max ?? 720;
  const base = opts.base ?? 320;
  const hyst = opts.hysteresisMs ?? 40;
  const prev = opts.previousIntervalMs;

  if (!diagnostics || typeof diagnostics !== "object") return base;

  const sat = clamp01(Number(diagnostics.tsge?.saturationPressure) || 0);
  const conflict = diagnostics.chorus?.conflictNote ? 0.34 : 0;
  const ge = diagnostics.ghostEcology && typeof diagnostics.ghostEcology === "object" ? diagnostics.ghostEcology : {};
  const ae = Array.isArray(ge.affinityEdges) ? ge.affinityEdges.length : 0;
  const re = Array.isArray(ge.rivalryEdges) ? ge.rivalryEdges.length : 0;
  const pt = Array.isArray(ge.pollenTransfers) ? ge.pollenTransfers.length : 0;

  const activity = clamp01(0.44 * sat + conflict + 0.055 * ae + 0.11 * re + 0.038 * pt);
  const span = max - min;
  let interval = Math.round(max - activity * span * 0.72);
  interval = Math.min(max, Math.max(min, interval));

  if (prev != null && Number.isFinite(prev) && Math.abs(interval - prev) < hyst) {
    return Math.min(max, Math.max(min, prev));
  }
  return interval;
}
