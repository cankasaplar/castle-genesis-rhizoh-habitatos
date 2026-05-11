/**
 * RHIZOH constitutional phase collapse — kararsız rejim göstergeleri (flickering, sınır kaosu, koşut uyarılar).
 */

import { computeRhizohThetaOscillationScore } from "./thetaEntropyStabilizationV1.js";
import { summarizeRhizohThetaPersonalityDrift } from "./thetaMemoryDriftV1.js";

export const RHIZOH_CONSTITUTIONAL_PHASE_COLLAPSE_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {{ phase?: string | null }[]} samples
 * @param {number} windowSize
 */
function phaseFlipRate(samples, windowSize = 32) {
  const slice = (samples || []).slice(-Math.max(4, windowSize));
  if (slice.length < 2) return 0;
  let flips = 0;
  let prev = slice[0].phase ?? "";
  for (let i = 1; i < slice.length; i++) {
    const p = slice[i].phase ?? "";
    if (p && prev && p !== prev) flips += 1;
    if (p) prev = p;
  }
  return clamp01(flips / Math.max(1, slice.length - 1));
}

/**
 * @param {{ phase?: string | null }[]} samples
 * @param {number} windowSize
 */
function elasticImmuneSkipBalanced(samples, windowSize = 36) {
  const slice = (samples || []).slice(-windowSize);
  const phases = slice.map((s) => s.phase || "").filter(Boolean);
  if (phases.length < 4) return 0;
  let skips = 0;
  for (let i = 1; i < phases.length; i++) {
    const a = phases[i - 1];
    const b = phases[i];
    if (
      (a === "elastic_trust" && b === "immune_aggression") ||
      (a === "immune_aggression" && b === "elastic_trust")
    ) {
      skips += 1;
    }
  }
  return clamp01(skips / Math.max(1, phases.length - 1));
}

/**
 * @param {{
 *   memoryState?: { samples: import('./thetaMemoryDriftV1.js').RhizohThetaMemorySample[] },
 *   phaseHistory?: ReadonlyArray<{ phase?: string | null, at?: number }>,
 *   oscillationScore?: number,
 *   entropyProxy?: number,
 *   oscillationWindow?: number,
 *   phaseWindow?: number
 * }} input
 */
export function detectRhizohConstitutionalPhaseCollapse(input) {
  const samples = input.memoryState?.samples || [];
  const phaseSamples =
    input.phaseHistory?.length ? [...input.phaseHistory] : samples.map((s) => ({ phase: s.phase, at: s.at }));

  const oscillationScore =
    typeof input.oscillationScore === "number"
      ? clamp01(input.oscillationScore)
      : computeRhizohThetaOscillationScore(samples, input.oscillationWindow ?? 28);

  const driftSummary =
    samples.length >= 4 ? summarizeRhizohThetaPersonalityDrift(input.memoryState, { windowSize: 48 }) : null;

  const personalityDrift = driftSummary?.personalityDrift ?? 0;
  const entropyProxy =
    typeof input.entropyProxy === "number"
      ? clamp01(input.entropyProxy)
      : clamp01(0.45 * personalityDrift + 0.55 * oscillationScore);

  const flipRate = phaseFlipRate(phaseSamples, input.phaseWindow ?? 36);
  const boundarySkip = elasticImmuneSkipBalanced(phaseSamples, input.phaseWindow ?? 36);

  let regime =
    /** @type {'stable' | 'flickering' | 'boundary_chaos' | 'immune_runaway_hint' | 'elastic_drift_tension'} */ (
      "stable"
    );

  if (flipRate > 0.38 && oscillationScore > 0.35) regime = "boundary_chaos";
  else if (boundarySkip > 0.22 && oscillationScore > 0.25) regime = "boundary_chaos";
  else if (flipRate > 0.22) regime = "flickering";

  const lastPhase = phaseSamples[phaseSamples.length - 1]?.phase || driftSummary?.lastPhase || "";
  const lastTheta = samples.length ? clamp01(samples[samples.length - 1].theta) : null;

  if (lastPhase === "immune_aggression" && lastTheta != null && lastTheta >= 0.82 && personalityDrift > 0.42) {
    regime = regime === "stable" ? "immune_runaway_hint" : regime;
  }
  if (
    lastPhase === "elastic_trust" &&
    personalityDrift > 0.48 &&
    oscillationScore > 0.3
  ) {
    regime = regime === "stable" ? "elastic_drift_tension" : regime;
  }

  const collapseRisk = clamp01(
    0.28 * flipRate +
      0.26 * oscillationScore +
      0.22 * boundarySkip +
      0.18 * entropyProxy +
      (regime === "boundary_chaos" ? 0.12 : 0)
  );

  return {
    collapseRisk: Math.round(collapseRisk * 1000) / 1000,
    regime,
    entropyProxy: Math.round(entropyProxy * 1000) / 1000,
    signals: {
      phaseFlipRate: Math.round(flipRate * 1000) / 1000,
      oscillationScore: Math.round(oscillationScore * 1000) / 1000,
      elasticImmuneBridgeRate: Math.round(boundarySkip * 1000) / 1000,
      personalityDrift: Math.round(personalityDrift * 1000) / 1000,
      lastPhase: lastPhase || null,
      lastTheta
    },
    trace: [
      { kind: "phase_entropy_blend", entropyProxy },
      { kind: "regime_classification", regime, collapseRisk }
    ]
  };
}
