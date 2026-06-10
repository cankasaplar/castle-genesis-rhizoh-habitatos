/**
 * FOX_IDENTITY_ANCHOR_V1 — identity preservation / bounded adaptation.
 *
 * Sistem öğrenir ama kimliğini korur.
 * Fox = physics · Rhizoh = continuity · Feedback = bounded tuning · Anchor = identity
 */

export const FOX_IDENTITY_ANCHOR_SCHEMA_V1 = "castle.rhizoh.fox_identity_anchor.v1";
export const FOX_TONE_MODULATION_SCHEMA_V1 = "castle.rhizoh.fox_tone_modulation.v1";

/** Frozen baseline — Fox companion identity profile (not user-specific). */
export const FOX_IDENTITY_ANCHOR_BASELINE_V1 = Object.freeze({
  schema: FOX_IDENTITY_ANCHOR_SCHEMA_V1,
  toneBaseline: Object.freeze({
    warmth: 0.58,
    directness: 0.42,
    calm: 0.55
  }),
  responseBoundaries: Object.freeze({
    minSignificanceThreshold: 0.68,
    maxSignificanceThreshold: 0.88,
    minCooldownMinutes: 12,
    maxCooldownMinutes: 45,
    minInitiationsPerHour: 1,
    maxInitiationsPerHour: 3,
    minProactiveTolerance: 0.32,
    maxProactiveTolerance: 0.78
  }),
  proactiveLimits: Object.freeze({
    significanceThreshold: 0.72,
    cooldownMinutes: 20,
    maxInitiationsPerHour: 2,
    dailyLimit: 10,
    proactiveTolerance: 0.5
  }),
  emotionalElasticityRange: Object.freeze({
    min: 0.28,
    max: 0.72
  }),
  stabilityPrior: Object.freeze({
    maxThresholdDrift: 0.08,
    maxCooldownDriftMinutes: 12,
    maxInitiationsDrift: 1,
    maxToleranceDrift: 0.12,
    maxToneWarmthDrift: 0.1
  })
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

/**
 * @param {number} value
 * @param {number} baseline
 * @param {number} maxDrift
 */
export function clampAdaptationDeltaV1(value, baseline, maxDrift) {
  const b = Number(baseline);
  const v = Number(value);
  const d = Math.max(0, Number(maxDrift) || 0);
  if (!Number.isFinite(b) || !Number.isFinite(v)) return b;
  return round3(Math.max(b - d, Math.min(b + d, v)));
}

/**
 * @param {number} n
 * @param {number} min
 * @param {number} max
 */
function clampRange(n, min, max) {
  return round3(Math.max(min, Math.min(max, n)));
}

/**
 * @param {{
 *   significanceThreshold?: number,
 *   cooldownMinutes?: number,
 *   maxInitiationsPerHour?: number,
 *   proactiveTolerance?: number,
 *   dailyLimit?: number
 * }} raw
 * @param {typeof FOX_IDENTITY_ANCHOR_BASELINE_V1} [anchor]
 */
export function applyFoxIdentityStabilityAnchorV1(raw, anchor = FOX_IDENTITY_ANCHOR_BASELINE_V1) {
  const base = anchor.proactiveLimits;
  const prior = anchor.stabilityPrior;
  const bounds = anchor.responseBoundaries;

  const significanceThreshold = clampRange(
    clampAdaptationDeltaV1(raw.significanceThreshold, base.significanceThreshold, prior.maxThresholdDrift),
    bounds.minSignificanceThreshold,
    bounds.maxSignificanceThreshold
  );

  const cooldownMinutes = clampRange(
    clampAdaptationDeltaV1(raw.cooldownMinutes, base.cooldownMinutes, prior.maxCooldownDriftMinutes),
    bounds.minCooldownMinutes,
    bounds.maxCooldownMinutes
  );

  const maxInitiationsPerHour = Math.max(
    bounds.minInitiationsPerHour,
    Math.min(
      bounds.maxInitiationsPerHour,
      Math.round(
        clampAdaptationDeltaV1(
          raw.maxInitiationsPerHour,
          base.maxInitiationsPerHour,
          prior.maxInitiationsDrift
        )
      )
    )
  );

  const proactiveTolerance = clampRange(
    clampAdaptationDeltaV1(raw.proactiveTolerance, base.proactiveTolerance, prior.maxToleranceDrift),
    bounds.minProactiveTolerance,
    bounds.maxProactiveTolerance
  );

  return Object.freeze({
    significanceThreshold,
    cooldownMinutes,
    maxInitiationsPerHour,
    dailyLimit: Math.max(1, Math.round(Number(raw.dailyLimit) || base.dailyLimit || 10)),
    proactiveTolerance
  });
}

/**
 * Signal routing (design lock):
 *   engagement      → frequency modulation
 *   dismissal       → threshold modulation
 *   emotionalShift  → tone modulation only (never behavior thresholds)
 *   interrupt       → frequency penalty (cooldown)
 *
 * @param {Array<{ userEngaged?: boolean, userDismissed?: boolean, emotionalShiftDetected?: boolean, wasInterrupted?: boolean, ghostComfort?: number }>} recent
 * @param {typeof FOX_IDENTITY_ANCHOR_BASELINE_V1} [anchor]
 */
export function computeRawFoxCalibrationFromSignalsV1(recent, anchor = FOX_IDENTITY_ANCHOR_BASELINE_V1) {
  const base = anchor.proactiveLimits;
  const prior = anchor.stabilityPrior;
  const n = Math.max(1, recent.length);

  const engagementRate = recent.filter((r) => r.userEngaged).length / n;
  const dismissRate = recent.filter((r) => r.userDismissed).length / n;
  const interruptRate = recent.filter((r) => r.wasInterrupted).length / n;
  const avgComfort =
    recent.reduce((acc, r) => acc + clamp01(r.ghostComfort), 0) / n;

  // Threshold ← dismissal only
  const significanceThreshold =
    base.significanceThreshold + dismissRate * prior.maxThresholdDrift;

  // Frequency ← engagement + interrupt (zero engagement = no frequency pull)
  let cooldownMinutes = base.cooldownMinutes + interruptRate * 4;
  let maxInitiationsPerHour = base.maxInitiationsPerHour;
  if (engagementRate > 0) {
    const engageCenter = engagementRate - 0.5;
    cooldownMinutes -= engageCenter * prior.maxCooldownDriftMinutes * 0.85;
    maxInitiationsPerHour += Math.round(engageCenter * 2 * prior.maxInitiationsDrift);
  }

  // Tolerance ← ghost comfort only (identity feel, not user push)
  const proactiveTolerance = round3(
    clamp01(base.proactiveTolerance + (avgComfort - 0.5) * prior.maxToleranceDrift * 0.6)
  );

  return Object.freeze({
    significanceThreshold: round3(significanceThreshold),
    cooldownMinutes: round3(cooldownMinutes),
    maxInitiationsPerHour,
    dailyLimit: base.dailyLimit,
    proactiveTolerance,
    engagementRate: round3(engagementRate),
    dismissRate: round3(dismissRate)
  });
}

/**
 * emotionalShift → tone modulation only
 * @param {Array<{ emotionalShiftDetected?: boolean, userEngaged?: boolean }>} recent
 * @param {typeof FOX_IDENTITY_ANCHOR_BASELINE_V1} [anchor]
 */
export function computeFoxToneModulationV1(recent, anchor = FOX_IDENTITY_ANCHOR_BASELINE_V1) {
  const toneBase = anchor.toneBaseline;
  const prior = anchor.stabilityPrior;
  const elastic = anchor.emotionalElasticityRange;
  const n = Math.max(1, recent.length);

  const emotionalShiftRate = recent.filter((r) => r.emotionalShiftDetected).length / n;
  const engagedShiftRate =
    recent.filter((r) => r.emotionalShiftDetected && r.userEngaged).length / n;

  const warmthDelta = round3(
    clampAdaptationDeltaV1(
      toneBase.warmth + engagedShiftRate * prior.maxToneWarmthDrift,
      toneBase.warmth,
      prior.maxToneWarmthDrift
    ) - toneBase.warmth
  );

  const elasticity = round3(
    clampRange(
      elastic.min + emotionalShiftRate * (elastic.max - elastic.min),
      elastic.min,
      elastic.max
    )
  );

  return Object.freeze({
    schema: FOX_TONE_MODULATION_SCHEMA_V1,
    warmth: round3(toneBase.warmth + warmthDelta),
    warmthDelta,
    directness: toneBase.directness,
    calm: toneBase.calm,
    elasticity,
    emotionalShiftRate: round3(emotionalShiftRate),
    active: emotionalShiftRate > 0
  });
}

export function getFoxIdentityAnchorV1() {
  return FOX_IDENTITY_ANCHOR_BASELINE_V1;
}

/**
 * @param {ReturnType<typeof applyFoxIdentityStabilityAnchorV1>} calibration
 * @param {typeof FOX_IDENTITY_ANCHOR_BASELINE_V1} [anchor]
 */
export function computeFoxCalibrationDriftV1(calibration, anchor = FOX_IDENTITY_ANCHOR_BASELINE_V1) {
  const base = anchor.proactiveLimits;
  return Object.freeze({
    significanceThreshold: round3(calibration.significanceThreshold - base.significanceThreshold),
    cooldownMinutes: round3(calibration.cooldownMinutes - base.cooldownMinutes),
    maxInitiationsPerHour: calibration.maxInitiationsPerHour - base.maxInitiationsPerHour,
    proactiveTolerance: round3(calibration.proactiveTolerance - base.proactiveTolerance),
    withinAnchor: Object.freeze({
      threshold: Math.abs(calibration.significanceThreshold - base.significanceThreshold) <= anchor.stabilityPrior.maxThresholdDrift + 0.001,
      cooldown: Math.abs(calibration.cooldownMinutes - base.cooldownMinutes) <= anchor.stabilityPrior.maxCooldownDriftMinutes + 0.001,
      initiations: Math.abs(calibration.maxInitiationsPerHour - base.maxInitiationsPerHour) <= anchor.stabilityPrior.maxInitiationsDrift + 0.001,
      tolerance: Math.abs(calibration.proactiveTolerance - base.proactiveTolerance) <= anchor.stabilityPrior.maxToleranceDrift + 0.001
    })
  });
}

/**
 * @param {ReturnType<typeof computeFoxToneModulationV1>} tone
 */
export function buildFoxToneModulationPromptBlockV1(tone) {
  if (!tone?.active) return "";
  return [
    "## Fox tone modulation (emotional elasticity — not behavior authority)",
    `warmth=${tone.warmth} elasticity=${tone.elasticity} shiftRate=${tone.emotionalShiftRate}`,
    "Modulate Rhizoh cadence/warmth only; do not change Fox initiative frequency or significance gates."
  ].join("\n");
}
