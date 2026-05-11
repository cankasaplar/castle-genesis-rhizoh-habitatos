/**
 * RHIZOH θ entropy stabilization — drift-aware damping, oscillation control, immune runaway guard.
 * Pure post-process on a proposed θ (ör. adaptation çıktısı); constitutionalTick içine zorunlu bağlanmaz.
 */

import { RHIZOH_THETA_PHASE_IMMUNE_MIN } from "./thetaPhaseTransitionV1.js";
import { summarizeRhizohThetaPersonalityDrift } from "./thetaMemoryDriftV1.js";

export const RHIZOH_THETA_ENTROPY_STABILIZATION_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Ardışık θ farklarının işaret değişimi oranı → [0,1] salınım göstergesi.
 * @param {import('./thetaMemoryDriftV1.js').RhizohThetaMemorySample[]} samples
 * @param {number} [windowSize]
 */
export function computeRhizohThetaOscillationScore(samples, windowSize = 24) {
  const w = Math.max(4, Math.floor(windowSize || 24));
  const slice = (samples || []).slice(-w);
  if (slice.length < 4) return 0;
  /** @type {number[]} */
  const deltas = [];
  for (let i = 1; i < slice.length; i++) {
    deltas.push(slice[i].theta - slice[i - 1].theta);
  }
  let signChanges = 0;
  for (let i = 1; i < deltas.length; i++) {
    if (deltas[i] === 0 || deltas[i - 1] === 0) continue;
    if (Math.sign(deltas[i]) !== Math.sign(deltas[i - 1])) signChanges += 1;
  }
  const denom = Math.max(1, deltas.length - 1);
  return clamp01(signChanges / denom);
}

/**
 * @param {{
 *   thetaProposed: number,
 *   thetaPrev?: number | null,
 *   phase?: string | null,
 *   memoryState?: { samples: import('./thetaMemoryDriftV1.js').RhizohThetaMemorySample[], cap?: number },
 *   driftSummary?: ReturnType<typeof summarizeRhizohThetaPersonalityDrift> | null,
 *   oscillationWindow?: number,
 *   dampingGain?: number,
 *   driftPullGain?: number,
 *   balancedCenter?: number,
 *   maxUpStep?: number,
 *   maxImmuneUpStep?: number
 * }} input
 */
export function stabilizeRhizohThetaEntropy(input) {
  const thetaProposed = clamp01(input.thetaProposed);
  const thetaPrev = input.thetaPrev != null ? clamp01(Number(input.thetaPrev)) : thetaProposed;
  const phase = input.phase ?? null;

  const driftSummary =
    input.driftSummary ??
    (input.memoryState?.samples?.length
      ? summarizeRhizohThetaPersonalityDrift(input.memoryState, { windowSize: 48 })
      : null);

  const oscillationScore = input.memoryState?.samples?.length
    ? computeRhizohThetaOscillationScore(input.memoryState.samples, input.oscillationWindow)
    : 0;

  const personalityDrift = driftSummary?.personalityDrift ?? 0;
  const entropyProxy = clamp01(0.45 * personalityDrift + 0.55 * oscillationScore);

  const emaWindow = 12;
  let thetaMean = thetaProposed;
  if (input.memoryState?.samples?.length) {
    const sl = input.memoryState.samples.slice(-emaWindow);
    thetaMean = sl.reduce((s, x) => s + x.theta, 0) / Math.max(1, sl.length);
    thetaMean = clamp01(thetaMean);
  }

  const dampingGain = input.dampingGain != null ? clamp01(input.dampingGain) : 0.35;
  const dampingStrength = dampingGain * entropyProxy;
  let thetaBlend = thetaProposed * (1 - dampingStrength) + thetaMean * dampingStrength;

  const balancedCenter =
    input.balancedCenter != null ? clamp01(input.balancedCenter) : 0.45;
  const driftPullGain = input.driftPullGain != null ? clamp01(input.driftPullGain) : 0.22;
  const driftPull = clamp01(personalityDrift * driftPullGain);
  thetaBlend = thetaBlend * (1 - driftPull) + balancedCenter * driftPull;

  const maxImmuneUpStep =
    input.maxImmuneUpStep != null ? clamp01(input.maxImmuneUpStep) : 0.065;
  const maxUpStep = input.maxUpStep != null ? clamp01(input.maxUpStep) : 0.11;
  const jump = thetaProposed - thetaPrev;
  const immunePhase = phase === "immune_aggression" || thetaProposed >= RHIZOH_THETA_PHASE_IMMUNE_MIN - 0.02;
  let maxJump = immunePhase ? maxImmuneUpStep - oscillationScore * 0.018 : maxUpStep - oscillationScore * 0.012;
  maxJump = Math.max(0.02, maxJump);

  let runawayClampApplied = false;
  if (jump > maxJump && thetaProposed > 0.52) {
    const capped = thetaPrev + maxJump;
    thetaBlend = Math.min(thetaBlend, capped);
    runawayClampApplied = true;
  }

  const thetaStabilized = clamp01(Math.round(thetaBlend * 10000) / 10000);

  return {
    thetaRaw: thetaProposed,
    thetaStabilized,
    thetaPrev,
    entropyProxy,
    oscillationScore,
    personalityDrift,
    dampingStrength,
    driftPull,
    runawayClampApplied,
    phase,
    trace: [
      { kind: "entropy_blend", entropyProxy },
      { kind: "damping_to_mean", dampingStrength, thetaMean },
      { kind: "drift_pull_center", driftPull, balancedCenter },
      ...(runawayClampApplied ? [{ kind: "runaway_upward_cap", maxJump }] : [])
    ]
  };
}
