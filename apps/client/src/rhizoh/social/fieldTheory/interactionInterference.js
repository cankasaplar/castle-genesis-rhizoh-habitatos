/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * Interaction pattern = interference of presence waves: |Σψ|² vs Σ|ψ|².
 * @param {{ re?: number, im?: number, amplitude?: number }[]} waves
 */
export function computeInterferencePattern(waves) {
  const w = Array.isArray(waves) ? waves : [];
  if (!w.length) {
    return {
      intensity: 0,
      contrast: 0.5,
      pattern: "flat",
      coherentEnergy: 0,
      incoherentEnergy: 0
    };
  }
  let sr = 0;
  let si = 0;
  let incoh = 0;
  for (const x of w) {
    const re = Number(x.re) || 0;
    const im = Number(x.im) || 0;
    sr += re;
    si += im;
    const a = Number(x.amplitude);
    const mag = Number.isFinite(a) ? a * a : re * re + im * im;
    incoh += mag;
  }
  const intensity = sr * sr + si * si;
  const rawRatio = incoh > 1e-9 ? intensity / incoh : 0;
  const contrast = clamp01(0.5 + 0.5 * Math.tanh(rawRatio - 1));
  let pattern = "mixed";
  if (rawRatio > 1.12) pattern = "constructive";
  else if (rawRatio < 0.88) pattern = "destructive";
  return {
    intensity: Math.round(intensity * 1000) / 1000,
    contrast: Math.round(contrast * 1000) / 1000,
    pattern,
    coherentEnergy: Math.round(intensity * 1000) / 1000,
    incoherentEnergy: Math.round(incoh * 1000) / 1000,
    rawRatio: Math.round(rawRatio * 1000) / 1000
  };
}
