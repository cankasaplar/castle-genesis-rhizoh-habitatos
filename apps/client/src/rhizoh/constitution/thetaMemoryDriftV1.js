/**
 * RHIZOH θ memory — ring-buffer samples + compact personality drift stats from θ trajectory.
 */

export const RHIZOH_THETA_MEMORY_DRIFT_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {number} [cap]
 */
export function createRhizohThetaMemoryState(cap = 256) {
  const c = Math.max(8, Math.floor(Number(cap) || 256));
  return { cap: c, samples: /** @type {RhizohThetaMemorySample[]} */ ([]) };
}

/**
 * @typedef {{
 *   at: number,
 *   theta: number,
 *   phase?: string | null,
 *   stressIndex?: number | null
 * }} RhizohThetaMemorySample
 */

/**
 * @param {{ cap?: number, samples: RhizohThetaMemorySample[] }} state
 * @param {{ at?: number, theta: number, phase?: string | null, stressIndex?: number | null }} sample
 */
export function appendRhizohThetaMemorySample(state, sample) {
  const cap = Math.max(8, Number(state.cap) || 256);
  const entry = {
    at: Number.isFinite(Number(sample.at)) ? Number(sample.at) : Date.now(),
    theta: clamp01(sample.theta),
    phase: sample.phase ?? null,
    stressIndex: typeof sample.stressIndex === "number" ? clamp01(sample.stressIndex) : null
  };
  const samples = [...state.samples, entry].slice(-cap);
  return { cap, samples };
}

/**
 * @param {{ samples: RhizohThetaMemorySample[] }} state
 * @param {{ windowSize?: number, emaAlpha?: number }} [opts]
 */
export function summarizeRhizohThetaPersonalityDrift(state, opts = {}) {
  const samples = state.samples || [];
  const window = Math.max(4, Math.min(samples.length, Math.floor(opts.windowSize ?? 48)));
  const slice = samples.slice(-window);
  if (slice.length < 2) {
    return {
      sampleCount: slice.length,
      thetaVelocityPerHour: 0,
      emaVelocity: 0,
      phaseTransitions: 0,
      personalityDrift: 0,
      lastPhase: slice[slice.length - 1]?.phase ?? null,
      windowThetaDelta: 0
    };
  }

  const t0 = slice[0].at;
  const t1 = slice[slice.length - 1].at;
  const dtHours = Math.max(1e-6, (t1 - t0) / 3600000);
  const windowThetaDelta = slice[slice.length - 1].theta - slice[0].theta;
  const thetaVelocityPerHour = windowThetaDelta / dtHours;

  let phaseTransitions = 0;
  let lastKnown = slice[0].phase;
  for (let i = 1; i < slice.length; i++) {
    const p = slice[i].phase;
    if (p && lastKnown && p !== lastKnown) phaseTransitions += 1;
    if (p) lastKnown = p;
  }

  const alpha = typeof opts.emaAlpha === "number" ? clamp01(opts.emaAlpha) : 0.35;
  let ema = thetaVelocityPerHour;
  for (let i = slice.length - 1; i > 0; i--) {
    const dh = Math.max(1e-6, (slice[i].at - slice[i - 1].at) / 3600000);
    const dv = (slice[i].theta - slice[i - 1].theta) / dh;
    ema = alpha * dv + (1 - alpha) * ema;
  }

  const personalityDrift = clamp01(
    Math.abs(thetaVelocityPerHour) * 2 + phaseTransitions * 0.08 + Math.abs(ema) * 1.5
  );

  return {
    sampleCount: slice.length,
    thetaVelocityPerHour,
    emaVelocity: ema,
    phaseTransitions,
    personalityDrift,
    lastPhase: slice[slice.length - 1]?.phase ?? null,
    windowThetaDelta
  };
}
