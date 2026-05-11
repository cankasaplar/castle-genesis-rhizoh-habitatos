import { getFirebasePersistence } from "./firebasePersistence.js";

const seriesBySubject = new Map();
const calibrationBySubject = new Map();
const longAttractorBySubject = new Map();
const mesoBySubject = new Map();
const conservationBySubject = new Map();
const solverBySubject = new Map();
const convergenceBySubject = new Map();
const metaValidatorBySubject = new Map();
const selfReferenceBySubject = new Map();
const invarianceManifoldBySubject = new Map();
const geodesicHistoryBySubject = new Map();
const geodesicFlowBySubject = new Map();
const variationalPrincipleBySubject = new Map();
const hamiltonianClosureBySubject = new Map();
const actionSymmetryDualityBySubject = new Map();
const renormalizationBySubject = new Map();
const observabilityBySubject = new Map();
const irreducibilityBySubject = new Map();
const WINDOW = 8;
const GEODESIC_HISTORY_CAP = Math.max(4, Math.min(16, Number(process.env.CASTLE_EPISTEMIC_GEODESIC_HISTORY || 8)));
const LONG_WINDOW = Math.max(32, Math.min(256, Number(process.env.CASTLE_ATTRACTOR_LONG_WINDOW || 96)));
const MESO_WINDOW = Math.max(16, Math.min(96, Number(process.env.CASTLE_ATTRACTOR_MESO_WINDOW || 36)));
const EMA_ALPHA = Math.max(0.05, Math.min(0.6, Number(process.env.CASTLE_FORECAST_EMA_ALPHA || 0.22)));
const SOLVER_ETA = Math.max(0.04, Math.min(0.42, Number(process.env.CASTLE_EPISTEMIC_SOLVER_ETA || 0.14)));
const SOLVER_INNER_STEPS = Math.max(1, Math.min(6, Number(process.env.CASTLE_EPISTEMIC_SOLVER_INNER_STEPS || 3)));
const SOLVER_PATH_CAP = 16;
const DEFAULT_SELF_TUNE = Object.freeze({
  alpha: EMA_ALPHA,
  windowSize: WINDOW,
  fragileThreshold: 0.42,
  driftAccelThreshold: 0.018
});

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr, m) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + (b - m) * (b - m), 0) / arr.length;
}

function slope(arr) {
  if (arr.length < 2) return 0;
  return (arr[arr.length - 1] - arr[0]) / (arr.length - 1);
}

function classifyRegime(meanSigma, sigmaVar, driftAvg, sigmaSlope) {
  if (meanSigma < 0.56 || sigmaSlope < -0.03 || driftAvg > 0.32) return "fragile";
  if (sigmaVar > 0.012 || Math.abs(sigmaSlope) > 0.02) return "oscillating";
  return "stable";
}

function ema(prev, curr, alpha = EMA_ALPHA) {
  if (typeof prev !== "number" || !Number.isFinite(prev)) return curr;
  return alpha * curr + (1 - alpha) * prev;
}

function brierScore(probs, actual) {
  const pStable = Number(probs?.stable) || 0;
  const pOsc = Number(probs?.oscillating) || 0;
  const pFrag = Number(probs?.fragile) || 0;
  const yStable = actual === "stable" ? 1 : 0;
  const yOsc = actual === "oscillating" ? 1 : 0;
  const yFrag = actual === "fragile" ? 1 : 0;
  return ((pStable - yStable) ** 2 + (pOsc - yOsc) ** 2 + (pFrag - yFrag) ** 2) / 3;
}

function computeForecastStabilityIndex(cal) {
  const e = clamp01(Number(cal?.forecastErrorEma) || 0.5);
  const d = clamp01(1 - (Number(cal?.driftPredictabilityEma) || 0.5));
  const h = clamp01(Number(cal?.horizonCalibrationErrorEma) || 0.5);
  const b = clamp01(Number(cal?.regimeTransitionBrierScoreEma) || 0.5);
  return clamp01(1 - (0.35 * e + 0.25 * d + 0.2 * h + 0.2 * b));
}

function computeEpistemicHealthScore(cal, forecast) {
  const acc = clamp01(1 - (Number(cal?.forecastErrorEma) || 0.5));
  const pred = clamp01(Number(cal?.driftPredictabilityEma) || 0.5);
  const horizon = clamp01(1 - (Number(cal?.horizonCalibrationErrorEma) || 0.5));
  const regimeQ = clamp01(1 - (Number(cal?.regimeTransitionBrierScoreEma) || 0.5));
  const sigma = clamp01(Number(forecast?.sigmaNext) || 0.5);
  return clamp01(0.24 * acc + 0.2 * pred + 0.2 * horizon + 0.2 * regimeQ + 0.16 * sigma);
}

function maybeSelfTune(prevTune, calibration, forecast) {
  const tune = {
    alpha: clamp01(Number(prevTune?.alpha) || DEFAULT_SELF_TUNE.alpha),
    windowSize: Math.max(5, Math.min(12, Number(prevTune?.windowSize) || DEFAULT_SELF_TUNE.windowSize)),
    fragileThreshold: clamp01(Number(prevTune?.fragileThreshold) || DEFAULT_SELF_TUNE.fragileThreshold),
    driftAccelThreshold: Math.max(
      0.004,
      Math.min(0.08, Number(prevTune?.driftAccelThreshold) || DEFAULT_SELF_TUNE.driftAccelThreshold)
    )
  };
  const fsi = computeForecastStabilityIndex(calibration);
  const accel = Math.abs(Number(calibration?.calibrationDriftAccelerationEma) || 0);
  const unstable = fsi < tune.fragileThreshold || accel > tune.driftAccelThreshold;
  if (unstable) {
    tune.alpha = Math.max(0.1, Math.min(0.5, tune.alpha + 0.04));
    tune.windowSize = Math.max(5, tune.windowSize - 1);
    tune.fragileThreshold = Math.max(0.34, tune.fragileThreshold - 0.01);
  } else if ((Number(calibration?.samples) || 0) > 18 && fsi > 0.78) {
    tune.alpha = Math.max(0.08, Math.min(0.45, tune.alpha - 0.01));
    tune.windowSize = Math.min(12, tune.windowSize + 1);
  }
  return {
    ...tune,
    lastRegime: String(forecast?.regime || "stable"),
    lastTuneAt: Date.now()
  };
}

function controlLoopEntropy(tunePrev, tuneNow, anomaly) {
  const a0 = Number(tunePrev?.alpha) || DEFAULT_SELF_TUNE.alpha;
  const a1 = Number(tuneNow?.alpha) || a0;
  const w0 = Number(tunePrev?.windowSize) || DEFAULT_SELF_TUNE.windowSize;
  const w1 = Number(tuneNow?.windowSize) || w0;
  const t0 = Number(tunePrev?.fragileThreshold) || DEFAULT_SELF_TUNE.fragileThreshold;
  const t1 = Number(tuneNow?.fragileThreshold) || t0;
  const d0 = Number(tunePrev?.driftAccelThreshold) || DEFAULT_SELF_TUNE.driftAccelThreshold;
  const d1 = Number(tuneNow?.driftAccelThreshold) || d0;
  const move =
    Math.abs(a1 - a0) * 2.4 + Math.abs(w1 - w0) * 0.08 + Math.abs(t1 - t0) * 2.2 + Math.abs(d1 - d0) * 8;
  const anomBoost = anomaly?.active ? 0.16 + (Array.isArray(anomaly?.reasons) ? anomaly.reasons.length * 0.05 : 0) : 0;
  return clamp01(move + anomBoost);
}

function adaptationEfficiency(prevCal, nextCal) {
  const prevFsi = clamp01(Number(prevCal?.forecastStabilityIndex) || 0.5);
  const nextFsi = clamp01(Number(nextCal?.forecastStabilityIndex) || prevFsi);
  const prevEhs = clamp01(Number(prevCal?.epistemicHealthScore) || 0.5);
  const nextEhs = clamp01(Number(nextCal?.epistemicHealthScore) || prevEhs);
  const gain = Math.max(0, (nextFsi - prevFsi) * 0.6 + (nextEhs - prevEhs) * 0.4);
  const effort = clamp01(Number(nextCal?.controlLoopEntropyEma) || 0.2) + 0.05;
  return clamp01(gain / effort);
}

function longHorizonDegradationRisk(cal) {
  const fsi = clamp01(Number(cal?.forecastStabilityIndex) || 0.5);
  const driftAccel = Math.abs(Number(cal?.calibrationDriftAccelerationEma) || 0);
  const entropy = clamp01(Number(cal?.controlLoopEntropyEma) || 0);
  const recoveryFreq = clamp01(Number(cal?.recoveryFrequencyEma) || 0);
  const fatigue = clamp01(Number(cal?.epistemicFatigue) || 0);
  return clamp01((1 - fsi) * 0.42 + driftAccel * 4.2 * 0.16 + entropy * 0.16 + recoveryFreq * 0.14 + fatigue * 0.12);
}

function predictControlLoopNext(cal) {
  const ent = clamp01(Number(cal?.controlLoopEntropyEma) || 0.3);
  const entAccel = Number(cal?.calibrationDriftAccelerationEma) || 0;
  const rec = clamp01(Number(cal?.recoveryFrequencyEma) || 0.2);
  const adapt = clamp01(Number(cal?.adaptationEfficiencyEma) || 0.5);
  // Entropy(t+1): entropy + accel pressure + recovery pressure - adaptation damping
  const next = clamp01(ent + entAccel * 3.1 + rec * 0.14 - adapt * 0.12);
  const fatiguePred = clamp01(next * 0.52 + (1 - adapt) * 0.32 + rec * 0.16);
  const oscillationLikelihood = clamp01(Math.abs(entAccel) * 4.8 + rec * 0.34);
  const collapseRisk = clamp01(next * 0.42 + fatiguePred * 0.34 + (1 - adapt) * 0.24);
  const longevity = clamp01(1 - (next * 0.45 + collapseRisk * 0.4 + rec * 0.15));
  return {
    controlLoopEntropyNext: Math.round(next * 1000) / 1000,
    controlFatiguePrediction: Math.round(fatiguePred * 1000) / 1000,
    recoveryOscillationLikelihood: Math.round(oscillationLikelihood * 1000) / 1000,
    adaptationCollapseForecast: Math.round(collapseRisk * 1000) / 1000,
    epistemicSystemLongevity: Math.round(longevity * 1000) / 1000
  };
}

function detectEpistemicFixedPoint(cal, forecast) {
  const sigmaSlope = Math.abs(Number(forecast?.series?.sigmaSlope) || 0);
  const driftSlope = Math.abs(Number(forecast?.series?.driftSlope) || 0);
  const variance = clamp01((Number(forecast?.series?.variance) || 0) * 8.5);
  const accel = Math.abs(Number(cal?.calibrationDriftAccelerationEma) || 0);
  const fsi = clamp01(Number(cal?.forecastStabilityIndex) || 0.5);
  const risk = clamp01(Number(cal?.longHorizonDegradationRiskEma) || 0.5);
  const fatigue = clamp01(Number(cal?.epistemicFatigue) || 0.5);
  const recFreq = clamp01(Number(cal?.recoveryFrequencyEma) || 0.2);

  const fixedPointStability = clamp01(
    fsi * 0.42 +
      (1 - variance) * 0.22 +
      (1 - sigmaSlope * 12) * 0.16 +
      (1 - driftSlope * 12) * 0.1 +
      (1 - accel * 16) * 0.1
  );
  const equilibriumIndex = clamp01(
    fixedPointStability * 0.52 + (1 - risk) * 0.28 + (1 - fatigue) * 0.12 + (1 - recFreq) * 0.08
  );
  const oscillationLikelihood = clamp01(variance * 0.44 + sigmaSlope * 8.8 * 0.28 + recFreq * 0.28);
  const collapseBasinLikelihood = clamp01(risk * 0.46 + fatigue * 0.34 + (1 - fsi) * 0.2);
  const recoveryBasinLikelihood = clamp01(
    recFreq * 0.46 + Math.max(0, Number(cal?.adaptationEfficiencyEma || 0) - 0.46) * 0.34 + (1 - collapseBasinLikelihood) * 0.2
  );
  const transitionLikelihood = clamp01(
    oscillationLikelihood * 0.4 + collapseBasinLikelihood * 0.35 + Math.abs(sigmaSlope - driftSlope) * 6 * 0.25
  );
  const oscillationDampingPrediction = clamp01(
    (1 - oscillationLikelihood) * 0.45 + Number(cal?.adaptationEfficiencyEma || 0.5) * 0.35 + fixedPointStability * 0.2
  );

  let attractorType = "stable_eq";
  if (collapseBasinLikelihood > 0.62) attractorType = "collapse_basin";
  else if (oscillationLikelihood > 0.56) attractorType = "oscillation_attractor";
  else if (recoveryBasinLikelihood > 0.58 && collapseBasinLikelihood < 0.5) attractorType = "recovery_basin";

  return {
    fixedPointStabilityScore: Math.round(fixedPointStability * 1000) / 1000,
    longTermEpistemicEquilibriumIndex: Math.round(equilibriumIndex * 1000) / 1000,
    attractorType,
    attractorBasinLikelihood: {
      stable_eq: Math.round(clamp01(1 - Math.max(oscillationLikelihood, collapseBasinLikelihood)) * 1000) / 1000,
      oscillation_attractor: Math.round(oscillationLikelihood * 1000) / 1000,
      collapse_basin: Math.round(collapseBasinLikelihood * 1000) / 1000,
      recovery_basin: Math.round(recoveryBasinLikelihood * 1000) / 1000
    },
    oscillationDampingPrediction: Math.round(oscillationDampingPrediction * 1000) / 1000,
    controlLoopPhaseTransitionLikelihood: Math.round(transitionLikelihood * 1000) / 1000
  };
}

function detectEpistemicBifurcation(prevCal, nextCal, forecast) {
  const prevAttractor = prevCal?.fixedPoint?.attractorBasinLikelihood || {};
  const nextAttractor = nextCal?.fixedPoint?.attractorBasinLikelihood || {};
  const prevStable = Number(prevAttractor.stable_eq) || 0;
  const nextStable = Number(nextAttractor.stable_eq) || 0;
  const prevOsc = Number(prevAttractor.oscillation_attractor) || 0;
  const nextOsc = Number(nextAttractor.oscillation_attractor) || 0;
  const prevCollapse = Number(prevAttractor.collapse_basin) || 0;
  const nextCollapse = Number(nextAttractor.collapse_basin) || 0;
  const prevRecovery = Number(prevAttractor.recovery_basin) || 0;
  const nextRecovery = Number(nextAttractor.recovery_basin) || 0;

  const varianceNow = clamp01((Number(forecast?.series?.variance) || 0) * 10);
  const variancePrev = clamp01((Number(prevCal?.lastForecastVariance) || 0) * 10);
  const varianceSurge = Math.max(0, varianceNow - variancePrev);

  const transitionNow = clamp01(Number(nextCal?.fixedPoint?.controlLoopPhaseTransitionLikelihood) || 0);
  const transitionPrev = clamp01(Number(prevCal?.fixedPoint?.controlLoopPhaseTransitionLikelihood) || 0);
  const transitionSurge = Math.max(0, transitionNow - transitionPrev);

  const basinMigration =
    Math.abs(nextStable - prevStable) +
    Math.abs(nextOsc - prevOsc) +
    Math.abs(nextCollapse - prevCollapse) +
    Math.abs(nextRecovery - prevRecovery);
  const migrationNorm = clamp01(basinMigration / 2);

  // phase split: stable basin düşerken iki farklı basin aynı anda yükseliyor.
  const dualRise = (nextOsc > prevOsc && nextCollapse > prevCollapse) || (nextOsc > prevOsc && nextRecovery > prevRecovery);
  const splitSignal = dualRise ? 1 : 0;

  const branching = clamp01(
    splitSignal * 0.38 +
      transitionSurge * 0.22 +
      migrationNorm * 0.2 +
      varianceSurge * 0.2
  );
  const phaseSplitDetected = branching > 0.56;

  let origin = "none";
  if (varianceSurge >= transitionSurge && varianceSurge >= migrationNorm) origin = "variance_jump";
  else if (transitionSurge >= varianceSurge && transitionSurge >= migrationNorm) origin = "phase_transition";
  else if (migrationNorm > 0) origin = "basin_migration";

  const basinFrom =
    prevStable >= prevOsc && prevStable >= prevCollapse && prevStable >= prevRecovery
      ? "stable_eq"
      : prevOsc >= prevCollapse && prevOsc >= prevRecovery
        ? "oscillation_attractor"
        : prevCollapse >= prevRecovery
          ? "collapse_basin"
          : "recovery_basin";
  const basinTo =
    nextStable >= nextOsc && nextStable >= nextCollapse && nextStable >= nextRecovery
      ? "stable_eq"
      : nextOsc >= nextCollapse && nextOsc >= nextRecovery
        ? "oscillation_attractor"
        : nextCollapse >= nextRecovery
          ? "collapse_basin"
          : "recovery_basin";

  return {
    phaseSplitDetected,
    regimeBranchingPrediction: Math.round(branching * 1000) / 1000,
    instabilityOriginTrace: origin,
    attractorBasinMigration: {
      from: basinFrom,
      to: basinTo,
      magnitude: Math.round(migrationNorm * 1000) / 1000
    },
    transitionSurge: Math.round(transitionSurge * 1000) / 1000,
    varianceSurge: Math.round(varianceSurge * 1000) / 1000
  };
}

function updateLongAttractorState(subjectId, nextCal) {
  const sid = String(subjectId || "unknown");
  const prevRows = longAttractorBySubject.get(sid) || [];
  const basin = nextCal?.fixedPoint?.attractorBasinLikelihood || {};
  const row = {
    ts: Date.now(),
    stable: clamp01(Number(basin.stable_eq) || 0),
    oscillation: clamp01(Number(basin.oscillation_attractor) || 0),
    collapse: clamp01(Number(basin.collapse_basin) || 0),
    recovery: clamp01(Number(basin.recovery_basin) || 0),
    phaseTransition: clamp01(Number(nextCal?.fixedPoint?.controlLoopPhaseTransitionLikelihood) || 0),
    fsi: clamp01(Number(nextCal?.forecastStabilityIndex) || 0.5)
  };
  const rows = [...prevRows, row].slice(-LONG_WINDOW);
  longAttractorBySubject.set(sid, rows);
  if (!rows.length) return null;

  const avg = {
    stable: mean(rows.map((r) => r.stable)),
    oscillation: mean(rows.map((r) => r.oscillation)),
    collapse: mean(rows.map((r) => r.collapse)),
    recovery: mean(rows.map((r) => r.recovery)),
    phaseTransition: mean(rows.map((r) => r.phaseTransition)),
    fsi: mean(rows.map((r) => r.fsi))
  };
  const stableSlope = slope(rows.map((r) => r.stable));
  const collapseSlope = slope(rows.map((r) => r.collapse));
  const transitionSlope = slope(rows.map((r) => r.phaseTransition));
  const fsiSlope = slope(rows.map((r) => r.fsi));

  const erosionRaw = clamp01(Math.max(0, -stableSlope * 16) * 0.52 + Math.max(0, collapseSlope * 16) * 0.32 + avg.phaseTransition * 0.16);
  const weakeningRaw = clamp01((1 - avg.stable) * 0.38 + avg.oscillation * 0.24 + avg.collapse * 0.24 + Math.max(0, -fsiSlope * 14) * 0.14);
  const decayRaw = clamp01(Math.max(0, -fsiSlope * 20) * 0.46 + Math.max(0, transitionSlope * 14) * 0.28 + (1 - avg.fsi) * 0.26);
  const longCollapseRisk = clamp01(erosionRaw * 0.34 + weakeningRaw * 0.3 + decayRaw * 0.2 + avg.collapse * 0.16);

  return {
    basinErosionEma: Math.round(erosionRaw * 1000) / 1000,
    attractorWeakeningScore: Math.round(weakeningRaw * 1000) / 1000,
    phaseMemoryDecayEma: Math.round(decayRaw * 1000) / 1000,
    attractorCollapseRiskLong: Math.round(longCollapseRisk * 1000) / 1000,
    epistemicLandscapeEvolution: {
      stable: Math.round(avg.stable * 1000) / 1000,
      oscillation: Math.round(avg.oscillation * 1000) / 1000,
      collapse: Math.round(avg.collapse * 1000) / 1000,
      recovery: Math.round(avg.recovery * 1000) / 1000,
      window: rows.length,
      stableSlope: Math.round(stableSlope * 1000) / 1000,
      collapseSlope: Math.round(collapseSlope * 1000) / 1000,
      phaseTransitionSlope: Math.round(transitionSlope * 1000) / 1000,
      fsiSlope: Math.round(fsiSlope * 1000) / 1000
    }
  };
}

function updateMesoState(subjectId, forecast, nextCal) {
  const sid = String(subjectId || "unknown");
  const prev = mesoBySubject.get(sid) || [];
  const row = {
    ts: Date.now(),
    variance: clamp01((Number(forecast?.series?.variance) || 0) * 10),
    sigmaSlope: Math.abs(Number(forecast?.series?.sigmaSlope) || 0),
    driftSlope: Math.abs(Number(forecast?.series?.driftSlope) || 0),
    transition: clamp01(Number(nextCal?.fixedPoint?.controlLoopPhaseTransitionLikelihood) || 0),
    branching: clamp01(Number(nextCal?.bifurcation?.regimeBranchingPrediction) || 0),
    collapseRisk: clamp01(Number(nextCal?.longAttractor?.attractorCollapseRiskLong) || 0)
  };
  const rows = [...prev, row].slice(-MESO_WINDOW);
  mesoBySubject.set(sid, rows);
  return rows;
}

function computeCrossScaleCoupling(micro, mesoRows, macro) {
  const meso = Array.isArray(mesoRows) ? mesoRows : [];
  const mesoAvg = {
    variance: mean(meso.map((r) => Number(r.variance) || 0)),
    transition: mean(meso.map((r) => Number(r.transition) || 0)),
    branching: mean(meso.map((r) => Number(r.branching) || 0)),
    collapseRisk: mean(meso.map((r) => Number(r.collapseRisk) || 0))
  };
  const mesoSlope = {
    transition: slope(meso.map((r) => Number(r.transition) || 0)),
    branching: slope(meso.map((r) => Number(r.branching) || 0))
  };

  const microInstability = clamp01(
    (Math.abs(Number(micro?.series?.sigmaSlope) || 0) * 8) * 0.34 +
      (Math.abs(Number(micro?.series?.driftSlope) || 0) * 8) * 0.2 +
      (clamp01((Number(micro?.series?.variance) || 0) * 10)) * 0.22 +
      clamp01(Number(micro?.controlLoopPhaseTransitionLikelihood) || 0) * 0.24
  );
  const macroPressure = clamp01(
    clamp01(Number(macro?.attractorCollapseRiskLong) || 0) * 0.44 +
      clamp01(Number(macro?.phaseMemoryDecayEma) || 0) * 0.32 +
      clamp01(Number(macro?.attractorWeakeningScore) || 0) * 0.24
  );

  const microToMacro = clamp01(microInstability * 0.46 + mesoAvg.branching * 0.3 + mesoSlope.branching * 4 * 0.24);
  const macroToMicro = clamp01(macroPressure * 0.52 + mesoAvg.transition * 0.28 + Math.max(0, mesoSlope.transition) * 4 * 0.2);
  const crossInstability = clamp01(
    microToMacro * 0.34 + macroToMicro * 0.34 + Math.abs(microToMacro - macroToMicro) * 0.12 + mesoAvg.variance * 0.2
  );
  const hierarchicalCollapse = clamp01(
    crossInstability * 0.42 + macroPressure * 0.34 + mesoAvg.collapseRisk * 0.16 + microInstability * 0.08
  );

  return {
    microToMacroInfluence: Math.round(microToMacro * 1000) / 1000,
    macroToMicroConstraint: Math.round(macroToMicro * 1000) / 1000,
    crossScaleInstability: Math.round(crossInstability * 1000) / 1000,
    hierarchicalCollapseRisk: Math.round(hierarchicalCollapse * 1000) / 1000,
    scaleWindows: { micro: WINDOW, meso: MESO_WINDOW, macro: LONG_WINDOW }
  };
}

function computeConservationResiduals(subjectId, calibration, forecast) {
  const sid = String(subjectId || "unknown");
  const prev = conservationBySubject.get(sid) || {
    entropyLike: null,
    stabilityLike: null,
    driftEnergyLike: null
  };

  const pStable = clamp01(Number(calibration?.fixedPoint?.attractorBasinLikelihood?.stable_eq) || 0);
  const pOsc = clamp01(Number(calibration?.fixedPoint?.attractorBasinLikelihood?.oscillation_attractor) || 0);
  const pCollapse = clamp01(Number(calibration?.fixedPoint?.attractorBasinLikelihood?.collapse_basin) || 0);
  const pRecovery = clamp01(Number(calibration?.fixedPoint?.attractorBasinLikelihood?.recovery_basin) || 0);
  const eps = 1e-9;
  const entropyLike = -(pStable * Math.log(pStable + eps) + pOsc * Math.log(pOsc + eps) + pCollapse * Math.log(pCollapse + eps) + pRecovery * Math.log(pRecovery + eps)) / Math.log(4);

  const stabilityLike = clamp01(Number(calibration?.forecastStabilityIndex) || 0.5);
  const driftEnergyLike = clamp01(
    (Number(forecast?.series?.variance) || 0) * 8 + Math.abs(Number(forecast?.series?.driftSlope) || 0) * 6
  );

  const entropyResidual =
    prev.entropyLike == null ? 0 : Math.abs(entropyLike - Number(prev.entropyLike || 0));
  const stabilityFluxResidual =
    prev.stabilityLike == null ? 0 : Math.abs(stabilityLike + driftEnergyLike - Number(prev.stabilityLike || 0) - Number(prev.driftEnergyLike || 0));
  const driftEnergyResidual =
    prev.driftEnergyLike == null ? 0 : Math.abs(driftEnergyLike - Number(prev.driftEnergyLike || 0));
  const crossScaleInvariantResidual = Math.abs(
    clamp01(Number(calibration?.crossScale?.microToMacroInfluence) || 0) -
      clamp01(Number(calibration?.crossScale?.macroToMicroConstraint) || 0)
  );
  const equilibriumConstraintViolation = clamp01(
    entropyResidual * 0.22 +
      stabilityFluxResidual * 0.28 +
      driftEnergyResidual * 0.18 +
      crossScaleInvariantResidual * 0.2 +
      clamp01(Number(calibration?.crossScale?.hierarchicalCollapseRisk) || 0) * 0.12
  );

  const out = {
    entropyConservationResidual: Math.round(clamp01(entropyResidual) * 1000) / 1000,
    stabilityFluxResidual: Math.round(clamp01(stabilityFluxResidual) * 1000) / 1000,
    driftEnergyResidual: Math.round(clamp01(driftEnergyResidual) * 1000) / 1000,
    crossScaleInvariantResidual: Math.round(clamp01(crossScaleInvariantResidual) * 1000) / 1000,
    equilibriumConstraintViolation: Math.round(equilibriumConstraintViolation * 1000) / 1000,
    entropyLike: Math.round(clamp01(entropyLike) * 1000) / 1000,
    stabilityLike: Math.round(stabilityLike * 1000) / 1000,
    driftEnergyLike: Math.round(driftEnergyLike * 1000) / 1000
  };
  conservationBySubject.set(sid, {
    entropyLike: out.entropyLike,
    stabilityLike: out.stabilityLike,
    driftEnergyLike: out.driftEnergyLike
  });
  return out;
}

function mergePendingSolverAdjustmentIntoTune(tune, pending) {
  const base = tune && typeof tune === "object" ? tune : { ...DEFAULT_SELF_TUNE };
  const t = { ...base };
  if (!pending || typeof pending !== "object") return t;
  const a = Number(pending.alphaDelta) || 0;
  const w = Number(pending.windowDelta) || 0;
  const f = Number(pending.fragileThresholdDelta) || 0;
  const driftD = Number(pending.driftAccelThresholdDelta) || 0;
  t.alpha = Math.max(0.05, Math.min(0.6, (Number(t.alpha) || DEFAULT_SELF_TUNE.alpha) + a));
  t.windowSize = Math.max(5, Math.min(12, Math.round((Number(t.windowSize) || DEFAULT_SELF_TUNE.windowSize) + w)));
  t.fragileThreshold = clamp01((Number(t.fragileThreshold) || DEFAULT_SELF_TUNE.fragileThreshold) + f);
  t.driftAccelThreshold = Math.max(
    0.004,
    Math.min(0.08, (Number(t.driftAccelThreshold) || DEFAULT_SELF_TUNE.driftAccelThreshold) + driftD)
  );
  return t;
}

/**
 * Internal-only closed loop: nudge self-tuning toward lower conservation residuals (next tick).
 * Does not affect client/UI.
 */
function runEpistemicSelfConsistencySolver(subjectId, calibration, forecast) {
  const sid = String(subjectId || "unknown");
  const cons = calibration?.conservation || {};
  const rE = clamp01(Number(cons.entropyConservationResidual) || 0);
  const rS = clamp01(Number(cons.stabilityFluxResidual) || 0);
  const rD = clamp01(Number(cons.driftEnergyResidual) || 0);
  const rX = clamp01(Number(cons.crossScaleInvariantResidual) || 0);
  const L = clamp01(Number(cons.equilibriumConstraintViolation) || 0);

  const prev = solverBySubject.get(sid) || {
    slack: { e: 0.5, s: 0.5, d: 0.5, x: 0.5 },
    velocityEma: 0,
    path: [],
    prevL: null
  };

  const innerBlend = clamp01((SOLVER_ETA / Math.max(1, SOLVER_INNER_STEPS)) * (0.35 + L * 1.05));
  let slack = { ...prev.slack };
  for (let k = 0; k < SOLVER_INNER_STEPS; k++) {
    slack.e = clamp01(slack.e * (1 - innerBlend) + (1 - rE) * innerBlend);
    slack.s = clamp01(slack.s * (1 - innerBlend) + (1 - rS) * innerBlend);
    slack.d = clamp01(slack.d * (1 - innerBlend) + (1 - rD) * innerBlend);
    slack.x = clamp01(slack.x * (1 - innerBlend) + (1 - rX) * innerBlend);
  }

  const move =
    Math.abs(slack.e - prev.slack.e) +
    Math.abs(slack.s - prev.slack.s) +
    Math.abs(slack.d - prev.slack.d) +
    Math.abs(slack.x - prev.slack.x);
  const velocityEma = ema(prev.velocityEma, clamp01(move * 0.45), Math.min(0.5, EMA_ALPHA * 1.2));

  const normR = Math.sqrt((rE * rE + rS * rS + rD * rD + rX * rX) / 4);
  const pathEntry = {
    t: Date.now(),
    L: Math.round(L * 1000) / 1000,
    normR: Math.round(normR * 1000) / 1000
  };
  const path = [...(Array.isArray(prev.path) ? prev.path : []), pathEntry].slice(-SOLVER_PATH_CAP);

  const lossDelta =
    typeof prev.prevL === "number" ? Math.round((L - prev.prevL) * 1000) / 1000 : null;

  const fsi = clamp01(Number(calibration?.forecastStabilityIndex) || 0.5);
  const hier = clamp01(Number(calibration?.crossScale?.hierarchicalCollapseRisk) || 0);
  const pStable = clamp01(Number(calibration?.fixedPoint?.attractorBasinLikelihood?.stable_eq) || 0);
  const pOsc = clamp01(Number(calibration?.fixedPoint?.attractorBasinLikelihood?.oscillation_attractor) || 0);
  const pCol = clamp01(Number(calibration?.fixedPoint?.attractorBasinLikelihood?.collapse_basin) || 0);
  const pRec = clamp01(Number(calibration?.fixedPoint?.attractorBasinLikelihood?.recovery_basin) || 0);

  const restorationTrajectoryScore = clamp01(
    (slack.e + slack.s) * 0.22 + (1 - L) * 0.34 + fsi * 0.26 + (1 - hier) * 0.18
  );

  const corrScale = clamp01(L * 0.62 + normR * 0.38);
  const attractorCorrection = {
    stable_eq_bias: Math.round(corrScale * (0.035 + slack.e * 0.055) * 1000) / 1000,
    oscillation_damp: Math.round(corrScale * (slack.s * 0.065 + rS * 0.045) * 1000) / 1000,
    collapse_suppress: Math.round(corrScale * (rD * 0.055 + slack.d * 0.065 + pCol * 0.035) * 1000) / 1000,
    recovery_boost: Math.round(corrScale * (slack.x * 0.055 + rX * 0.045 + pRec * 0.035) * 1000) / 1000,
    pressure: Math.round(corrScale * 1000) / 1000
  };

  const pE = clamp01(1 - slack.e);
  const pS = clamp01(1 - slack.s);
  const pD = clamp01(1 - slack.d);
  const pX = clamp01(1 - slack.x);
  const gain = 0.018 + L * 0.055 + normR * 0.04;
  const nextAdjustment = {
    alphaDelta: Math.round(gain * (pD * -0.95 + pX * 0.38 + pE * -0.12) * 1000) / 1000,
    windowDelta: Math.max(-1, Math.min(1, Math.round(gain * (pS * 9 + pE * 5 - pD * 5)))),
    fragileThresholdDelta: Math.round(gain * (pE * -0.82 + pX * 0.48 + pS * -0.15) * 1000) / 1000,
    driftAccelThresholdDelta: Math.round(gain * (pD * 1.12 - pS * 0.42 + pX * 0.18) * 1000) / 1000
  };

  solverBySubject.set(sid, {
    slack,
    velocityEma,
    path,
    prevL: L
  });

  return {
    snapshot: {
      violationObjective: Math.round(L * 1000) / 1000,
      residualNorm: Math.round(normR * 1000) / 1000,
      relaxationSlack: {
        entropy: Math.round(slack.e * 1000) / 1000,
        stabilityFlux: Math.round(slack.s * 1000) / 1000,
        driftEnergy: Math.round(slack.d * 1000) / 1000,
        crossScale: Math.round(slack.x * 1000) / 1000
      },
      relaxationVelocityEma: Math.round(clamp01(velocityEma) * 1000) / 1000,
      constraintRelaxationRate: Math.round(clamp01(move * 0.5) * 1000) / 1000,
      minimizationPath: path,
      solverLossDelta: lossDelta,
      innerStepsTaken: SOLVER_INNER_STEPS,
      restorationTrajectoryScore: Math.round(restorationTrajectoryScore * 1000) / 1000,
      attractorCorrection,
      referenceBasin: {
        stable_eq: Math.round(pStable * 1000) / 1000,
        oscillation_attractor: Math.round(pOsc * 1000) / 1000,
        collapse_basin: Math.round(pCol * 1000) / 1000,
        recovery_basin: Math.round(pRec * 1000) / 1000
      }
    },
    nextAdjustment
  };
}

/**
 * Internal-only: certificate-style aggregates (not a formal proof; ledger audit signal).
 * convergence guarantee, oscillation bounds, attractor uniqueness, Lyapunov-style surrogate.
 */
function computeFixedPointConvergenceTheorem(subjectId, next, forecast, prevCal) {
  const sid = String(subjectId || "unknown");
  const fp = next.fixedPoint || {};
  const sc = next.selfConsistency || {};
  const cons = next.conservation || {};
  const bif = next.bifurcation || {};
  const la = next.longAttractor || {};
  const clf = next.controlLoopForecast || {};

  const stability = clamp01(Number(fp.fixedPointStabilityScore) || 0);
  const equilibrium = clamp01(Number(fp.longTermEpistemicEquilibriumIndex) || 0);
  const fsi = clamp01(Number(next.forecastStabilityIndex) || 0);
  const L = clamp01(Number(cons.equilibriumConstraintViolation) || 0);
  const branching = clamp01(Number(bif.regimeBranchingPrediction) || 0);
  const phaseSplit = bif.phaseSplitDetected ? 1 : 0;
  const mig = clamp01(Number(bif.attractorBasinMigration?.magnitude) || 0);

  const variance = clamp01((Number(forecast?.series?.variance) || 0) * 10);
  const sigmaSlope = Math.abs(Number(forecast?.series?.sigmaSlope) || 0);
  const driftSlope = Math.abs(Number(forecast?.series?.driftSlope) || 0);
  const damp = clamp01(Number(fp.oscillationDampingPrediction) || 0.5);
  const trans = clamp01(Number(fp.controlLoopPhaseTransitionLikelihood) || 0);
  const pStable = clamp01(Number(fp.attractorBasinLikelihood?.stable_eq) || 0);
  const pOsc = clamp01(Number(fp.attractorBasinLikelihood?.oscillation_attractor) || 0);
  const pCol = clamp01(Number(fp.attractorBasinLikelihood?.collapse_basin) || 0);
  const pRec = clamp01(Number(fp.attractorBasinLikelihood?.recovery_basin) || 0);
  const basinVec = [pStable, pOsc, pCol, pRec];
  let basinEntropy = 0;
  for (const p of basinVec) {
    const x = clamp01(p);
    basinEntropy += x > 1e-12 ? -x * Math.log(x) : 0;
  }
  const basinEntropyNorm = clamp01(basinEntropy / Math.log(4));

  const maxBasin = Math.max(pStable, pOsc, pCol, pRec);
  const sorted = [...basinVec].sort((a, b) => b - a);
  const secondBasin = sorted[1] || 0;
  const dominanceGap = clamp01(maxBasin - secondBasin);
  const uniquenessRaw = clamp01(
    dominanceGap * 0.36 +
      (1 - basinEntropyNorm) * 0.26 +
      (1 - branching) * 0.18 +
      (1 - mig) * 0.1 +
      (1 - phaseSplit) * 0.1
  );
  const attractorUniquenessScore = Math.round(uniquenessRaw * 1000) / 1000;
  const uniquenessValidated = uniquenessRaw > 0.62 && phaseSplit === 0 && branching < 0.48 && mig < 0.42;

  const oscEnergy = clamp01(variance * 0.4 + sigmaSlope * 9 * 0.35 + driftSlope * 9 * 0.25);
  const upperOscillationBound = clamp01(pOsc * 0.36 + oscEnergy * 0.3 + (1 - damp) * 0.2 + trans * 0.14);
  const oscillationImpossibilityMargin = Math.round(
    clamp01(1 - upperOscillationBound * 1.12 - phaseSplit * 0.14 - branching * 0.08) * 1000
  ) / 1000;
  const oscillationImpossibilityBounds = {
    upperLimitCycleLikelihood: Math.round(upperOscillationBound * 1000) / 1000,
    impossibilityMargin: oscillationImpossibilityMargin,
    dampingFloor: Math.round(damp * 1000) / 1000,
    phaseTransitionCeiling: Math.round(trans * 1000) / 1000
  };

  const restoration = clamp01(Number(sc.restorationTrajectoryScore) || 0);
  const path = Array.isArray(sc.minimizationPath) ? sc.minimizationPath : [];
  const pathLen = path.length;
  let lyapDelta = 0;
  if (pathLen >= 3) {
    const L0 = Number(path[pathLen - 3].L) || 0;
    const L1 = Number(path[pathLen - 1].L) || 0;
    lyapDelta = L0 - L1;
  }
  const lossDelta = typeof sc.solverLossDelta === "number" ? Number(sc.solverLossDelta) : null;
  const contractivity = clamp01(
    Math.max(0, lyapDelta) * 2.4 * 0.55 + (lossDelta != null ? clamp01(-lossDelta * 3.8) * 0.45 : 0.22)
  );
  const longCollapse = clamp01(Number(la.attractorCollapseRiskLong) || 0);

  const guaranteeRaw = clamp01(
    stability * 0.22 +
      equilibrium * 0.19 +
      fsi * 0.16 +
      (1 - L) * 0.13 +
      restoration * 0.1 +
      attractorUniquenessScore * 0.1 +
      (1 - branching) * 0.08 -
      phaseSplit * 0.1 -
      mig * 0.06
  );
  const prevConv = convergenceBySubject.get(sid) || { guaranteeEma: null };
  const guaranteeEma = ema(prevConv.guaranteeEma, guaranteeRaw);
  convergenceBySubject.set(sid, { guaranteeEma });

  const convergenceGuaranteeScore = Math.round(guaranteeRaw * 1000) / 1000;
  const convergenceGuaranteeEma = Math.round(clamp01(guaranteeEma) * 1000) / 1000;

  const lyapTrend = pathLen >= 3 ? Math.max(-1, Math.min(1, lyapDelta * 2.4)) : 0;
  const longevity = clamp01(Number(clf.epistemicSystemLongevity) || 0.5);
  const proofLikelihood = clamp01(
    convergenceGuaranteeEma * 0.34 +
      contractivity * 0.22 +
      (1 - longCollapse) * 0.2 +
      longevity * 0.14 +
      oscillationImpossibilityMargin * 0.1
  );

  const prevEq = prevCal?.fixedPoint?.longTermEpistemicEquilibriumIndex;
  const eqNow = equilibrium;
  const eqDrift =
    typeof prevEq === "number" && Number.isFinite(prevEq) ? Math.abs(eqNow - clamp01(Number(prevEq))) : null;

  return {
    convergenceGuaranteeScore,
    convergenceGuaranteeEma,
    oscillationImpossibilityBounds,
    attractorUniquenessValidation: {
      uniquenessScore: attractorUniquenessScore,
      validated: uniquenessValidated,
      basinEntropyNorm: Math.round(basinEntropyNorm * 1000) / 1000,
      dominanceGap: Math.round(dominanceGap * 1000) / 1000
    },
    longTermStabilityProofApproximation: {
      proofLikelihood: Math.round(proofLikelihood * 1000) / 1000,
      lyapunovSurrogateTrend: Math.round(clamp01(0.5 + lyapTrend * 0.5) * 1000) / 1000,
      contractivityIndicator: Math.round(contractivity * 1000) / 1000,
      longHorizonCollapseRisk: Math.round(longCollapse * 1000) / 1000,
      equilibriumIndexDrift: eqDrift != null ? Math.round(eqDrift * 1000) / 1000 : null
    },
    samplesUsed: Number(next.samples) || 0,
    windowReference: WINDOW
  };
}

const META_LAYER_DEF = [
  { id: "regime_forecast", label: "Forecast regime" },
  { id: "fsi_calibration", label: "FSI calibration" },
  { id: "fixed_point", label: "Fixed-point certificate" },
  { id: "bifurcation", label: "Bifurcation layer" },
  { id: "long_attractor", label: "Long-window attractor" },
  { id: "cross_scale", label: "Cross-scale coupling" },
  { id: "conservation", label: "Conservation residuals" },
  { id: "self_consistency", label: "Self-consistency solver" },
  { id: "convergence_theorem", label: "Convergence theorem layer" },
  { id: "control_loop", label: "Control-loop forecast" }
];

function buildMetaConsistencyNodes(next, forecast) {
  const rp = forecast?.regimeTransitionLikelihood || {};
  const regimeStability = clamp01(
    0.52 * (Number(rp.stable) || 0) + 0.28 * (Number(rp.oscillating) || 0) + 0.2 * (1 - (Number(rp.fragile) || 0))
  );

  const fsi = clamp01(Number(next.forecastStabilityIndex) || 0.5);
  const fp = next.fixedPoint || {};
  const fpStability = clamp01(
    0.52 * Number(fp.fixedPointStabilityScore || 0) + 0.48 * Number(fp.longTermEpistemicEquilibriumIndex || 0)
  );

  const bif = next.bifurcation || {};
  const bifStability = clamp01(
    1 - 0.62 * clamp01(Number(bif.regimeBranchingPrediction) || 0) - (bif.phaseSplitDetected ? 0.28 : 0)
  );

  const la = next.longAttractor || {};
  const laStability = clamp01(1 - clamp01(Number(la.attractorCollapseRiskLong) || 0));

  const cs = next.crossScale || {};
  const csStability = clamp01(
    1 -
      0.58 * clamp01(Number(cs.hierarchicalCollapseRisk) || 0) -
      0.28 * clamp01(Number(cs.crossScaleInstability) || 0)
  );

  const cons = next.conservation || {};
  const consStability = clamp01(1 - clamp01(Number(cons.equilibriumConstraintViolation) || 0));

  const sc = next.selfConsistency || {};
  const scStability = clamp01(
    0.52 * clamp01(Number(sc.restorationTrajectoryScore) || 0) +
      0.48 * (1 - clamp01(Number(sc.violationObjective) || 0))
  );

  const ct = next.fixedPointConvergenceTheorem || {};
  const proofL = clamp01(Number(ct.longTermStabilityProofApproximation?.proofLikelihood) || 0);
  const ctStability = clamp01(
    0.38 * clamp01(Number(ct.convergenceGuaranteeEma) || 0) +
      0.32 * proofL +
      0.3 * clamp01(Number(ct.attractorUniquenessValidation?.uniquenessScore) || 0)
  );

  const clf = next.controlLoopForecast || {};
  const ctlStability = clamp01(
    0.55 * clamp01(Number(clf.epistemicSystemLongevity) || 0) +
      0.45 * (1 - clamp01(Number(clf.adaptationCollapseForecast) || 0))
  );

  const values = [
    regimeStability,
    fsi,
    fpStability,
    bifStability,
    laStability,
    csStability,
    consStability,
    scStability,
    ctStability,
    ctlStability
  ];

  return META_LAYER_DEF.map((d, i) => ({
    id: d.id,
    label: d.label,
    stability: Math.round(clamp01(values[i]) * 1000) / 1000
  }));
}

/**
 * Internal-only: cross-checks epistemic certificate layers for mutual tension / contradictions.
 */
function computeEpistemicMetaConsistencyValidator(subjectId, next, forecast) {
  const sid = String(subjectId || "unknown");
  const nodes = buildMetaConsistencyNodes(next, forecast);
  const stabilities = nodes.map((n) => n.stability);
  const m = mean(stabilities);
  const spread = stabilities.length > 1 ? Math.sqrt(variance(stabilities, m)) : 0;

  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const diff = Math.abs(nodes[i].stability - nodes[j].stability);
      edges.push({
        from: nodes[i].id,
        to: nodes[j].id,
        agreement: Math.round((1 - diff) * 1000) / 1000,
        tension: Math.round(diff * 1000) / 1000
      });
    }
  }

  const meanAgreement = edges.length ? mean(edges.map((e) => e.agreement)) : 0.5;
  const coherence = clamp01(1 - spread * 2.75);
  const maxTension = edges.length ? Math.max(...edges.map((e) => e.tension)) : 0;

  const contradictions = [];
  const ct = next.fixedPointConvergenceTheorem || {};
  const bif = next.bifurcation || {};
  const fp = next.fixedPoint || {};
  const la = next.longAttractor || {};
  const clf = next.controlLoopForecast || {};
  const sc = next.selfConsistency || {};
  const regime = String(forecast?.regime || "stable");

  if (ct.attractorUniquenessValidation?.validated && bif.phaseSplitDetected) {
    contradictions.push({
      severity: "high",
      layers: ["convergence_theorem", "bifurcation"],
      code: "uniqueness_validated_vs_phase_split"
    });
  }
  const guarantee = clamp01(Number(ct.convergenceGuaranteeScore) || 0);
  const longCollapse = clamp01(Number(la.attractorCollapseRiskLong) || 0);
  if (guarantee > 0.74 && longCollapse > 0.52) {
    contradictions.push({
      severity: "high",
      layers: ["convergence_theorem", "long_attractor"],
      code: "high_guarantee_vs_long_collapse"
    });
  }
  const proofL = clamp01(Number(ct.longTermStabilityProofApproximation?.proofLikelihood) || 0);
  if (regime === "fragile" && proofL > 0.68) {
    contradictions.push({
      severity: "medium",
      layers: ["regime_forecast", "convergence_theorem"],
      code: "fragile_regime_vs_high_proof_likelihood"
    });
  }
  if (String(fp.attractorType || "") === "collapse_basin" && clamp01(Number(sc.restorationTrajectoryScore) || 0) > 0.64) {
    contradictions.push({
      severity: "medium",
      layers: ["fixed_point", "self_consistency"],
      code: "collapse_basin_vs_strong_restoration"
    });
  }
  const oscMargin = clamp01(Number(ct.oscillationImpossibilityBounds?.impossibilityMargin) || 0);
  const pOsc = clamp01(Number(fp.attractorBasinLikelihood?.oscillation_attractor) || 0);
  if (oscMargin > 0.62 && pOsc > 0.58) {
    contradictions.push({
      severity: "medium",
      layers: ["convergence_theorem", "fixed_point"],
      code: "oscillation_impossibility_vs_high_osc_basin"
    });
  }
  const hier = clamp01(Number(next.crossScale?.hierarchicalCollapseRisk) || 0);
  const consV = clamp01(Number(next.conservation?.equilibriumConstraintViolation) || 0);
  if (hier < 0.22 && consV > 0.55) {
    contradictions.push({
      severity: "low",
      layers: ["cross_scale", "conservation"],
      code: "low_hierarchy_risk_vs_high_conservation_violation"
    });
  }

  for (const e of edges) {
    if (e.tension >= 0.54) {
      contradictions.push({
        severity: e.tension >= 0.72 ? "high" : e.tension >= 0.62 ? "medium" : "low",
        layers: [e.from, e.to],
        code: "pairwise_layer_tension",
        tension: e.tension
      });
    }
  }

  const dedup = [];
  const seen = new Set();
  for (const c of contradictions) {
    const key = `${c.code}:${(c.layers || []).join("|")}:${c.tension != null ? c.tension : ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(c);
    if (dedup.length >= 24) break;
  }

  const prevM = metaValidatorBySubject.get(sid) || { agreementEma: null, coherenceEma: null };
  const agreementEma = ema(prevM.agreementEma, meanAgreement);
  const coherenceEma = ema(prevM.coherenceEma, coherence);
  metaValidatorBySubject.set(sid, { agreementEma, coherenceEma });

  return {
    certificateConsistencyGraph: {
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      stabilitySpread: Math.round(spread * 1000) / 1000
    },
    layerContradictions: dedup,
    stabilityCertificationCoherenceScore: Math.round(coherence * 1000) / 1000,
    stabilityCertificationCoherenceEma: Math.round(clamp01(coherenceEma) * 1000) / 1000,
    multiLayerEpistemicAgreementIndex: Math.round(meanAgreement * 1000) / 1000,
    multiLayerEpistemicAgreementEma: Math.round(clamp01(agreementEma) * 1000) / 1000,
    contradictionCount: dedup.length,
    maxPairwiseTension: Math.round(maxTension * 1000) / 1000
  };
}

function metaGraphEdgeAgreement(graph, idA, idB) {
  const edges = graph?.edges;
  if (!Array.isArray(edges)) return 0.5;
  const e = edges.find((x) => (x.from === idA && x.to === idB) || (x.from === idB && x.to === idA));
  if (!e) return 0.5;
  return clamp01(Number(e.agreement) || 0);
}

/**
 * Internal-only: stability of the self-observation / self-certificate reference chain.
 */
function computeEpistemicSelfReferenceClosure(subjectId, next, forecast) {
  const sid = String(subjectId || "unknown");
  const meta = next.metaConsistencyValidator || {};
  const graph = meta.certificateConsistencyGraph;
  const metaAgree = clamp01(Number(meta.multiLayerEpistemicAgreementIndex) || 0);
  const conv = next.fixedPointConvergenceTheorem || {};
  const convGuarantee = clamp01(Number(conv.convergenceGuaranteeEma) || 0);
  const sc = next.selfConsistency || {};
  const restoration = clamp01(Number(sc.restorationTrajectoryScore) || 0);
  const path = Array.isArray(sc.minimizationPath) ? sc.minimizationPath : [];
  const pathLen = path.length;
  const samplesNorm = clamp01((Number(next.samples) || 0) / 40);
  const driftPred = clamp01(Number(forecast?.driftPredictability) || 0);

  const recursiveCoherenceDepth = Math.round(
    clamp01(
      metaAgree * 0.25 +
        convGuarantee * 0.21 +
        restoration * 0.17 +
        clamp01(pathLen / 14) * 0.16 +
        samplesNorm * 0.13 +
        driftPred * 0.08
    ) * 1000
  ) / 1000;

  const eConvSelf = metaGraphEdgeAgreement(graph, "convergence_theorem", "self_consistency");
  const eFixedSelf = metaGraphEdgeAgreement(graph, "fixed_point", "self_consistency");
  const eControlFsi = metaGraphEdgeAgreement(graph, "control_loop", "fsi_calibration");
  const cle = clamp01(Number(next.controlLoopEntropyEma) || 0);
  const adapt = clamp01(Number(next.adaptationEfficiencyEma) || 0);
  const maxTen = clamp01(Number(meta.maxPairwiseTension) || 0);
  const contraN = clamp01((Number(meta.contradictionCount) || 0) / 8);
  const selfReferenceLoopStability = Math.round(
    clamp01(
      eConvSelf * 0.24 +
        eFixedSelf * 0.2 +
        eControlFsi * 0.14 +
        (1 - cle) * 0.18 +
        adapt * 0.14 +
        (1 - maxTen * 0.55) * 0.1 -
        contraN * 0.12
    ) * 1000
  ) / 1000;

  const fp = next.fixedPoint || {};
  const damp = clamp01(Number(fp.oscillationDampingPrediction) || 0);
  const accel = Math.abs(Number(next.calibrationDriftAccelerationEma) || 0);
  const relaxRate = clamp01(Number(sc.constraintRelaxationRate) || 0);
  const vel = clamp01(Number(sc.relaxationVelocityEma) || 0);
  const lossDelta = sc.solverLossDelta;
  const lossTerm =
    lossDelta != null && lossDelta < 0 ? 0.14 : lossDelta != null && lossDelta > 0 ? 0.04 : 0.08;
  const recOsc = clamp01(Number(next.controlLoopForecast?.recoveryOscillationLikelihood) || 0);
  const infiniteRegressDamping = Math.round(
    clamp01(
      damp * 0.26 +
        clamp01(1 - accel * 6) * 0.22 +
        relaxRate * 0.18 +
        vel * 0.14 +
        lossTerm +
        (1 - recOsc) * 0.16
    ) * 1000
  ) / 1000;

  const eqIndex = clamp01(Number(fp.longTermEpistemicEquilibriumIndex) || 0);
  const proofL = clamp01(Number(conv.longTermStabilityProofApproximation?.proofLikelihood) || 0);
  const consV = clamp01(Number(next.conservation?.equilibriumConstraintViolation) || 0);
  const metaCoh = clamp01(Number(meta.stabilityCertificationCoherenceScore) || 0);
  const uniq = clamp01(Number(conv.attractorUniquenessValidation?.uniquenessScore) || 0);
  const epistemicFixedPointClosureScore = Math.round(
    clamp01(eqIndex * 0.26 + proofL * 0.22 + (1 - consV) * 0.2 + metaCoh * 0.18 + uniq * 0.14) * 1000
  ) / 1000;

  const prevS = selfReferenceBySubject.get(sid) || {
    depthEma: null,
    loopEma: null,
    regressEma: null,
    closureEma: null
  };
  const recursiveCoherenceDepthEma = Math.round(clamp01(ema(prevS.depthEma, recursiveCoherenceDepth)) * 1000) / 1000;
  const selfReferenceLoopStabilityEma = Math.round(clamp01(ema(prevS.loopEma, selfReferenceLoopStability)) * 1000) / 1000;
  const infiniteRegressDampingEma = Math.round(clamp01(ema(prevS.regressEma, infiniteRegressDamping)) * 1000) / 1000;
  const epistemicFixedPointClosureScoreEma = Math.round(
    clamp01(ema(prevS.closureEma, epistemicFixedPointClosureScore)) * 1000
  ) / 1000;
  selfReferenceBySubject.set(sid, {
    depthEma: recursiveCoherenceDepthEma,
    loopEma: selfReferenceLoopStabilityEma,
    regressEma: infiniteRegressDampingEma,
    closureEma: epistemicFixedPointClosureScoreEma
  });

  const selfReferenceCompositeIndex = Math.round(
    clamp01(
      (recursiveCoherenceDepth +
        selfReferenceLoopStability +
        infiniteRegressDamping +
        epistemicFixedPointClosureScore) /
        4
    ) * 1000
  ) / 1000;

  return {
    recursiveCoherenceDepth,
    recursiveCoherenceDepthEma,
    selfReferenceLoopStability,
    selfReferenceLoopStabilityEma,
    infiniteRegressDamping,
    infiniteRegressDampingEma,
    epistemicFixedPointClosureScore,
    epistemicFixedPointClosureScoreEma,
    selfReferenceCompositeIndex,
    selfReferenceEdges: {
      convergenceTheorem_selfConsistency: Math.round(eConvSelf * 1000) / 1000,
      fixedPoint_selfConsistency: Math.round(eFixedSelf * 1000) / 1000,
      controlLoop_fsi: Math.round(eControlFsi * 1000) / 1000
    }
  };
}

function geomMeanIn01(a, b, c) {
  const x = Math.max(1e-12, clamp01(a)) * Math.max(1e-12, clamp01(b)) * Math.max(1e-12, clamp01(c));
  return clamp01(Math.pow(x, 1 / 3));
}

/**
 * Internal-only: unified invariant scaffold across epistemic layers (audit / ledger).
 */
function computeEpistemicGlobalInvarianceManifold(subjectId, next, forecast) {
  const sid = String(subjectId || "unknown");
  const nodes = next.metaConsistencyValidator?.certificateConsistencyGraph?.nodes || [];
  const stabilities = nodes.length ? nodes.map((n) => clamp01(Number(n.stability) || 0)) : [0.5];
  const meanStab = mean(stabilities);
  const spread = stabilities.length > 1 ? Math.sqrt(variance(stabilities, meanStab)) : 0;

  const fsi = clamp01(Number(next.forecastStabilityIndex) || 0);
  const metaAgree = clamp01(Number(next.metaConsistencyValidator?.multiLayerEpistemicAgreementIndex) || 0);
  const selfRefComp = clamp01(Number(next.selfReferenceClosure?.selfReferenceCompositeIndex) || 0);
  const cs = next.crossScale || {};
  const micro = clamp01(Number(cs.microToMacroInfluence) || 0);
  const macro = clamp01(Number(cs.macroToMicroConstraint) || 0);
  const crossInstab = clamp01(Number(cs.crossScaleInstability) || 0);
  const hier = clamp01(Number(cs.hierarchicalCollapseRisk) || 0);
  const consV = clamp01(Number(next.conservation?.equilibriumConstraintViolation) || 0);
  const conv = next.fixedPointConvergenceTheorem || {};
  const convGuarantee = clamp01(Number(conv.convergenceGuaranteeEma) || 0);
  const sc = next.selfConsistency || {};
  const scViol = clamp01(Number(sc.violationObjective) || 0);
  const metaCoh = clamp01(Number(next.metaConsistencyValidator?.stabilityCertificationCoherenceScore) || 0);

  const jointCoherenceInvariant = Math.round(geomMeanIn01(fsi, metaAgree, selfRefComp) * 1000) / 1000;
  const crossScaleBalanceInvariant = Math.round(clamp01(1 - Math.abs(micro - macro)) * 1000) / 1000;
  const conservationInvariant = Math.round((1 - consV) * 1000) / 1000;
  const convergenceSolverInvariant =
    Math.round(clamp01(0.52 * convGuarantee + 0.48 * (1 - scViol)) * 1000) / 1000;
  const layerSpreadInvariant = Math.round(clamp01(1 - spread * 1.15) * 1000) / 1000;

  const systemWideInvariants = {
    jointCoherenceInvariant,
    crossScaleBalanceInvariant,
    conservationInvariant,
    convergenceSolverInvariant,
    layerSpreadInvariant
  };

  const globalStabilitySymmetry = Math.round(
    clamp01(1 - 2 * Math.abs(meanStab - 0.5) - spread * 0.88) * 1000
  ) / 1000;

  const crossLayerConservationUnification = Math.round(
    clamp01(
      (1 - consV) * 0.28 +
        (1 - crossInstab) * 0.22 +
        metaCoh * 0.2 +
        crossScaleBalanceInvariant * 0.18 +
        (1 - hier) * 0.12
    ) * 1000
  ) / 1000;

  const regime = String(forecast?.regime || "stable");
  const phaseBase = regime === "stable" ? 0.14 : regime === "oscillating" ? 0.42 : 0.74;
  const branch = clamp01(Number(next.bifurcation?.regimeBranchingPrediction) || 0);
  const trans = clamp01(Number(next.fixedPoint?.controlLoopPhaseTransitionLikelihood) || 0);
  const pOsc = clamp01(Number(next.fixedPoint?.attractorBasinLikelihood?.oscillation_attractor) || 0);
  const angle01 = clamp01(phaseBase + branch * 0.16 + trans * 0.1 + pOsc * 0.06);

  const radius = clamp01(metaAgree * 0.52 + selfRefComp * 0.48);
  const closure = clamp01(Number(next.selfReferenceClosure?.epistemicFixedPointClosureScore) || 0);
  const proofL = clamp01(Number(conv.longTermStabilityProofApproximation?.proofLikelihood) || 0);
  const elevation = clamp01(convGuarantee * 0.34 + closure * 0.36 + proofL * 0.18 + (1 - consV) * 0.12);

  const epistemicPhaseManifold = {
    angle01: Math.round(angle01 * 1000) / 1000,
    radius: Math.round(radius * 1000) / 1000,
    elevation: Math.round(elevation * 1000) / 1000,
    regimeProjection: regime,
    attractorShell: String(next.fixedPoint?.attractorType || "stable_eq"),
    sigmaProjection:
      typeof forecast?.sigmaNext === "number" ? Math.round(clamp01(forecast.sigmaNext) * 1000) / 1000 : null
  };

  const invariantComposite =
    Math.round(
      mean([
        jointCoherenceInvariant,
        crossScaleBalanceInvariant,
        conservationInvariant,
        convergenceSolverInvariant,
        layerSpreadInvariant
      ]) * 1000
    ) / 1000;

  const prevI = invarianceManifoldBySubject.get(sid) || {
    unifiedEma: null,
    symmetryEma: null,
    compositeEma: null
  };
  const crossLayerConservationUnificationEma = Math.round(
    clamp01(ema(prevI.unifiedEma, crossLayerConservationUnification)) * 1000
  ) / 1000;
  const globalStabilitySymmetryEma = Math.round(
    clamp01(ema(prevI.symmetryEma, globalStabilitySymmetry)) * 1000
  ) / 1000;
  const invariantCompositeEma = Math.round(clamp01(ema(prevI.compositeEma, invariantComposite)) * 1000) / 1000;
  invarianceManifoldBySubject.set(sid, {
    unifiedEma: crossLayerConservationUnificationEma,
    symmetryEma: globalStabilitySymmetryEma,
    compositeEma: invariantCompositeEma
  });

  return {
    systemWideInvariants,
    invariantComposite,
    invariantCompositeEma,
    globalStabilitySymmetry,
    globalStabilitySymmetryEma,
    crossLayerConservationUnification,
    crossLayerConservationUnificationEma,
    epistemicPhaseManifold,
    meanLayerStability: Math.round(meanStab * 1000) / 1000,
    layerStabilitySpread: Math.round(spread * 1000) / 1000
  };
}

/**
 * Internal-only: discrete geodesic / curvature proxies on the epistemic phase patch (audit).
 */
function computeEpistemicCurvatureGeodesicFlow(subjectId, next, _forecast) {
  const sid = String(subjectId || "unknown");
  const man = next.globalInvarianceManifold || {};
  const phase = man.epistemicPhaseManifold || {};
  const a = clamp01(Number(phase.angle01) || 0);
  const r = clamp01(Number(phase.radius) || 0);
  const z = clamp01(Number(phase.elevation) || 0);

  const hist = [...(geodesicHistoryBySubject.get(sid) || []), { a, r, z, t: Date.now() }].slice(
    -GEODESIC_HISTORY_CAP
  );
  geodesicHistoryBySubject.set(sid, hist);

  let da = 0;
  let dr = 0;
  let dz = 0;
  let speed = 0;
  if (hist.length >= 2) {
    const p0 = hist[hist.length - 2];
    const p1 = hist[hist.length - 1];
    da = p1.a - p0.a;
    dr = p1.r - p0.r;
    dz = p1.z - p0.z;
    speed = Math.sqrt(da * da + dr * dr + dz * dz);
  }

  const gradNorm = Math.sqrt(2);
  const alignRaw = speed > 1e-9 ? (dr + dz) / (speed * gradNorm) : 0;
  const tangentAlignmentScore = Math.round(clamp01(0.5 + 0.5 * alignRaw) * 1000) / 1000;

  let d2a = 0;
  let d2r = 0;
  let d2z = 0;
  let curvatureScalar = 0;
  if (hist.length >= 3) {
    const p0 = hist[hist.length - 3];
    const p1 = hist[hist.length - 2];
    const p2 = hist[hist.length - 1];
    d2a = p2.a - 2 * p1.a + p0.a;
    d2r = p2.r - 2 * p1.r + p0.r;
    d2z = p2.z - 2 * p1.z + p0.z;
    curvatureScalar = clamp01(Math.sqrt(d2a * d2a + d2r * d2r + d2z * d2z) * 3.2);
  }

  const sectionalCurvatureProxy = Math.round(curvatureScalar * 1000) / 1000;
  const ricciScalarProxy =
    Math.round(clamp01(Math.abs(d2a) + Math.abs(d2r) + Math.abs(d2z)) * 1000) / 1000;

  const pCol = clamp01(Number(next.fixedPoint?.attractorBasinLikelihood?.collapse_basin) || 0);
  const longCol = clamp01(Number(next.longAttractor?.attractorCollapseRiskLong) || 0);
  const collapsePressure = clamp01(0.55 * pCol + 0.45 * longCol);

  const pathEnergyProxy = Math.round(
    clamp01(
      1 - curvatureScalar * 0.38 - collapsePressure * 0.28 - (1 - tangentAlignmentScore) * 0.2
    ) * 1000
  ) / 1000;

  const stabilityGeodesics = {
    tangentAlignmentScore,
    discreteArcLength: Math.round(clamp01(speed * 2.85) * 1000) / 1000,
    pathEnergyProxy,
    windowSamples: hist.length
  };

  const signDa = da === 0 ? 0 : da > 0 ? 1 : -1;
  const collapseAvoidingTrajectories = {
    recommendedDeltaAngle01: Math.round(clamp01(-0.11 * collapsePressure * (signDa || 0)) * 1000) / 1000,
    recommendedDeltaRadius: Math.round(clamp01(0.1 * (1 - collapsePressure)) * 1000) / 1000,
    recommendedDeltaElevation: Math.round(clamp01(0.12 * (1 - collapsePressure)) * 1000) / 1000,
    collapsePressure: Math.round(collapsePressure * 1000) / 1000
  };

  const pStable = clamp01(Number(next.fixedPoint?.attractorBasinLikelihood?.stable_eq) || 0);
  const targetA = clamp01(0.17 + (1 - pStable) * 0.1);
  const targetR = clamp01(0.8 + pStable * 0.12);
  const targetZ = clamp01(0.82 + pStable * 0.14);
  const metricDistance = clamp01(Math.sqrt((a - targetA) ** 2 + (r - targetR) ** 2 + (z - targetZ) ** 2));
  const geodesicEfficiency = clamp01(1 - metricDistance * 1.08);

  const attractorShortestPaths = {
    metricDistance: Math.round(metricDistance * 1000) / 1000,
    geodesicEfficiency: Math.round(geodesicEfficiency * 1000) / 1000,
    targetPatch: {
      angle01: Math.round(targetA * 1000) / 1000,
      radius: Math.round(targetR * 1000) / 1000,
      elevation: Math.round(targetZ * 1000) / 1000
    }
  };

  const epistemicCurvatureTensors = {
    sectionalCurvatureProxy,
    ricciScalarProxy,
    components: {
      d2_angle01: Math.round(d2a * 1000) / 1000,
      d2_radius: Math.round(d2r * 1000) / 1000,
      d2_elevation: Math.round(d2z * 1000) / 1000,
      tangent_d_angle01: Math.round(da * 1000) / 1000,
      tangent_d_radius: Math.round(dr * 1000) / 1000,
      tangent_d_elevation: Math.round(dz * 1000) / 1000
    }
  };

  const prevG = geodesicFlowBySubject.get(sid) || { energyEma: null, efficiencyEma: null };
  const pathEnergyProxyEma = Math.round(clamp01(ema(prevG.energyEma, pathEnergyProxy)) * 1000) / 1000;
  const geodesicEfficiencyEma = Math.round(
    clamp01(ema(prevG.efficiencyEma, geodesicEfficiency)) * 1000
  ) / 1000;
  geodesicFlowBySubject.set(sid, { energyEma: pathEnergyProxyEma, efficiencyEma: geodesicEfficiencyEma });

  return {
    stabilityGeodesics,
    collapseAvoidingTrajectories,
    attractorShortestPaths,
    epistemicCurvatureTensors,
    pathEnergyProxyEma,
    geodesicEfficiencyEma,
    historyCap: GEODESIC_HISTORY_CAP
  };
}

/**
 * Internal-only: discrete action / Lagrangian proxy on epistemic paths (audit; not physics).
 */
function computeEpistemicVariationalPrinciple(subjectId, next, _forecast) {
  const sid = String(subjectId || "unknown");
  const cg = next.curvatureGeodesicFlow || {};
  const sg = cg.stabilityGeodesics || {};
  const asp = cg.attractorShortestPaths || {};
  const ct = cg.epistemicCurvatureTensors || {};
  const avoid = cg.collapseAvoidingTrajectories || {};
  const man = next.globalInvarianceManifold || {};

  const fsi = clamp01(Number(next.forecastStabilityIndex) || 0.5);
  const consV = clamp01(Number(next.conservation?.equilibriumConstraintViolation) || 0);
  const invComp = clamp01(Number(man.invariantComposite) || 0.5);
  const unified = clamp01(Number(man.crossLayerConservationUnification) || 0.5);
  const cle = clamp01(Number(next.controlLoopEntropyEma) || 0);
  const arc = clamp01(Number(sg.discreteArcLength) || 0);
  const sectional = clamp01(Number(ct.sectionalCurvatureProxy) || 0);
  const tangentAlign = clamp01(Number(sg.tangentAlignmentScore) || 0.5);
  const pathEnergy = clamp01(Number(sg.pathEnergyProxy) || 0.5);
  const geodesicEff = clamp01(Number(asp.geodesicEfficiency) || 0.5);
  const metricDist = clamp01(Number(asp.metricDistance) || 0.5);
  const collapseP = clamp01(Number(avoid.collapsePressure) || 0);
  const w = Math.max(1, Math.min(16, Number(sg.windowSamples) || 1));

  const potentialEnergy = Math.round(
    clamp01(
      (1 - fsi) * 0.28 +
        consV * 0.26 +
        (1 - invComp) * 0.22 +
        (1 - unified) * 0.14 +
        collapseP * 0.1
    ) * 1000
  ) / 1000;

  const kineticEnergy = Math.round(
    clamp01(cle * 0.34 + arc * 0.28 + sectional * 0.22 + metricDist * 0.16) * 1000
  ) / 1000;

  const lagrangian = Math.round((kineticEnergy - potentialEnergy) * 1000) / 1000;

  const pathDepthWeight = Math.min(1.15, Math.log(w) / Math.log(8));
  const actionFunctionalProxy = Math.round(
    clamp01(
      potentialEnergy * 0.36 +
        kineticEnergy * 0.3 +
        (1 - tangentAlign) * 0.14 +
        (1 - pathEnergy) * 0.12 +
        0.08 * pathDepthWeight
    ) * 1000
  ) / 1000;

  const globalPathOptimality = Math.round(
    clamp01(
      geodesicEff * 0.28 +
        pathEnergy * 0.24 +
        (1 - actionFunctionalProxy * 0.92) * 0.26 +
        tangentAlign * 0.14 +
        (1 - metricDist) * 0.08
    ) * 1000
  ) / 1000;

  const deltaR = clamp01(Number(avoid.recommendedDeltaRadius) || 0);
  const deltaZ = clamp01(Number(avoid.recommendedDeltaElevation) || 0);
  const descentStep = clamp01((deltaR + deltaZ) * 4.8 + pathEnergy * 0.34 + (1 - sectional) * 0.26);
  const lagrangianBalance = clamp01(1 - Math.min(1, Math.abs(lagrangian) * 2.2));
  const stabilityVariationalMinimization = Math.round(
    clamp01(globalPathOptimality * 0.44 + descentStep * 0.38 + lagrangianBalance * 0.18) * 1000
  ) / 1000;

  const barrierHeight = Math.round(
    clamp01(collapseP * 0.52 + sectional * 0.28 + consV * 0.2) * 1000
  ) / 1000;
  const gradientMagnitudeProxy = Math.round(
    clamp01(
      Math.abs(kineticEnergy - potentialEnergy) * 0.42 + metricDist * 0.38 + (1 - geodesicEff) * 0.2
    ) * 1000
  ) / 1000;

  const epistemicEnergyLandscape = {
    potentialEnergy,
    kineticEnergy,
    lagrangian,
    barrierHeight,
    gradientMagnitudeProxy,
    pathDepthSamples: w
  };

  const prevV = variationalPrincipleBySubject.get(sid) || {
    actionEma: null,
    optimalityEma: null,
    minimizationEma: null
  };
  const actionFunctionalProxyEma = Math.round(
    clamp01(ema(prevV.actionEma, actionFunctionalProxy)) * 1000
  ) / 1000;
  const globalPathOptimalityEma = Math.round(
    clamp01(ema(prevV.optimalityEma, globalPathOptimality)) * 1000
  ) / 1000;
  const stabilityVariationalMinimizationEma = Math.round(
    clamp01(ema(prevV.minimizationEma, stabilityVariationalMinimization)) * 1000
  ) / 1000;
  variationalPrincipleBySubject.set(sid, {
    actionEma: actionFunctionalProxyEma,
    optimalityEma: globalPathOptimalityEma,
    minimizationEma: stabilityVariationalMinimizationEma
  });

  return {
    actionFunctionalProxy,
    actionFunctionalProxyEma,
    globalPathOptimality,
    globalPathOptimalityEma,
    stabilityVariationalMinimization,
    stabilityVariationalMinimizationEma,
    epistemicEnergyLandscape
  };
}

/**
 * Internal-only: Hamiltonian / symplectic-style closure proxies (audit; not mechanics).
 */
function computeEpistemicHamiltonianClosure(subjectId, next, _forecast) {
  const sid = String(subjectId || "unknown");
  const state = hamiltonianClosureBySubject.get(sid) || {
    hamiltonianPrev: null,
    wedgePrev: null,
    symplecticEma: null,
    reversibleEma: null
  };

  const vp = next.variationalPrinciple || {};
  const el = vp.epistemicEnergyLandscape || {};
  const cg = next.curvatureGeodesicFlow || {};
  const comp = cg.epistemicCurvatureTensors?.components || {};
  const man = next.globalInvarianceManifold || {};
  const swi = man.systemWideInvariants || {};

  const ke = clamp01(Number(el.kineticEnergy) || 0);
  const pe = clamp01(Number(el.potentialEnergy) || 0);
  const lag = Number(el.lagrangian) || 0;
  const hamiltonianProxy = Math.round(clamp01(ke + pe) * 1000) / 1000;

  const dH =
    typeof state.hamiltonianPrev === "number" && Number.isFinite(state.hamiltonianPrev)
      ? Math.abs(hamiltonianProxy - state.hamiltonianPrev)
      : 0;

  const tanA = Number(comp.tangent_d_angle01) || 0;
  const tanR = Number(comp.tangent_d_radius) || 0;
  const tanZ = Number(comp.tangent_d_elevation) || 0;
  const d2a = Number(comp.d2_angle01) || 0;
  const d2r = Number(comp.d2_radius) || 0;
  const wedge = Math.abs(tanA * d2r - tanR * d2a);
  const dWedge =
    typeof state.wedgePrev === "number" && Number.isFinite(state.wedgePrev)
      ? Math.abs(wedge - state.wedgePrev)
      : 0;

  const symplecticStructureProxy = Math.round(
    clamp01(1 - dH * 3.6 - dWedge * 2.35 - Math.min(1, Math.abs(lag)) * 0.32) * 1000
  ) / 1000;

  const unified = clamp01(Number(man.crossLayerConservationUnification) || 0.5);
  const invComp = clamp01(Number(man.invariantComposite) || 0.5);
  const driftPred = clamp01(Number(next.driftPredictabilityEma) || 0.5);
  const fe = clamp01(Number(next.forecastErrorEma) || 0.5);

  const conservedFlowFields = {
    phaseTangent: {
      angle01: Math.round(tanA * 1000) / 1000,
      radius: Math.round(tanR * 1000) / 1000,
      elevation: Math.round(tanZ * 1000) / 1000
    },
    invarianceFlux: Math.round(unified * 1000) / 1000,
    symmetryFlux: Math.round(invComp * 1000) / 1000,
    calibrationMomentumProxy: Math.round(clamp01(driftPred * 0.55 + (1 - fe) * 0.45) * 1000) / 1000
  };

  const casimirInvariantProxy = Math.round(
    geomMeanIn01(
      clamp01(Number(swi.jointCoherenceInvariant) || 0.5),
      clamp01(Number(swi.conservationInvariant) || 0.5),
      clamp01(Number(swi.layerSpreadInvariant) || 0.5)
    ) * 1000
  ) / 1000;

  const hamiltonianInvariants = {
    hamiltonianLike: hamiltonianProxy,
    energyConstancy: Math.round(clamp01(1 - dH * 4.1) * 1000) / 1000,
    casimirInvariantProxy,
    symplecticWedgeMagnitude: Math.round(clamp01(wedge * 2.8) * 1000) / 1000
  };

  const cle = clamp01(Number(next.controlLoopEntropyEma) || 0);
  const sectional = clamp01(Number(cg.epistemicCurvatureTensors?.sectionalCurvatureProxy) || 0);
  const globOpt = clamp01(Number(vp.globalPathOptimality) || 0);
  const reversibleEpistemicDynamicsApproximation = Math.round(
    clamp01(
      symplecticStructureProxy * 0.34 + globOpt * 0.26 + (1 - cle) * 0.22 + (1 - sectional) * 0.18
    ) * 1000
  ) / 1000;

  const symplecticStructureProxyEma = Math.round(
    clamp01(ema(state.symplecticEma, symplecticStructureProxy)) * 1000
  ) / 1000;
  const reversibleEpistemicDynamicsEma = Math.round(
    clamp01(ema(state.reversibleEma, reversibleEpistemicDynamicsApproximation)) * 1000
  ) / 1000;

  hamiltonianClosureBySubject.set(sid, {
    hamiltonianPrev: hamiltonianProxy,
    wedgePrev: wedge,
    symplecticEma: symplecticStructureProxyEma,
    reversibleEma: reversibleEpistemicDynamicsEma
  });

  return {
    symplecticStructureProxy,
    symplecticStructureProxyEma,
    conservedFlowFields,
    hamiltonianInvariants,
    reversibleEpistemicDynamicsApproximation,
    reversibleEpistemicDynamicsEma,
    phasePositionProxy: {
      angle01:
        typeof man.epistemicPhaseManifold?.angle01 === "number"
          ? Math.round(clamp01(man.epistemicPhaseManifold.angle01) * 1000) / 1000
          : null,
      radius:
        typeof man.epistemicPhaseManifold?.radius === "number"
          ? Math.round(clamp01(man.epistemicPhaseManifold.radius) * 1000) / 1000
          : null,
      elevation:
        typeof man.epistemicPhaseManifold?.elevation === "number"
          ? Math.round(clamp01(man.epistemicPhaseManifold.elevation) * 1000) / 1000
          : null
    }
  };
}

/**
 * Internal-only: action (variational) vs symmetry (Hamiltonian) duality proxies (audit; not Noether's theorem).
 */
function computeEpistemicActionSymmetryDualityClosure(subjectId, next, _forecast) {
  const sid = String(subjectId || "unknown");
  const vp = next.variationalPrinciple || {};
  const hc = next.hamiltonianClosure || {};
  const hi = hc.hamiltonianInvariants || {};
  const cf = hc.conservedFlowFields || {};

  const action = clamp01(Number(vp.actionFunctionalProxy) || 0.5);
  const actionGood = clamp01(1 - action * 0.95);
  const symplectic = clamp01(Number(hc.symplecticStructureProxy) || 0.5);
  const energyConst = clamp01(Number(hi.energyConstancy) || 0.5);
  const pathOpt = clamp01(Number(vp.globalPathOptimality) || 0.5);
  const minVar = clamp01(Number(vp.stabilityVariationalMinimization) || 0.5);
  const casimir = clamp01(Number(hi.casimirInvariantProxy) || 0.5);
  const rev = clamp01(Number(hc.reversibleEpistemicDynamicsApproximation) || 0.5);
  const invFlux = clamp01(Number(cf.invarianceFlux) || 0.5);
  const symFlux = clamp01(Number(cf.symmetryFlux) || 0.5);
  const mom = clamp01(Number(cf.calibrationMomentumProxy) || 0.5);

  const noetherChargeProxy = Math.round(geomMeanIn01(actionGood, symplectic, energyConst) * 1000) / 1000;
  const noetherFluxProxy = Math.round(
    clamp01(0.38 * invFlux + 0.34 * symFlux + 0.28 * casimir) * 1000
  ) / 1000;
  const brokenSymmetryIndex = Math.round(
    clamp01(1 - geomMeanIn01(noetherChargeProxy, noetherFluxProxy, pathOpt)) * 1000
  ) / 1000;

  const noetherLikeProxyInvariants = {
    noetherChargeProxy,
    noetherFluxProxy,
    brokenSymmetryIndex,
    dualLagrangeSymmetryResidual: Math.round(Math.abs(actionGood - symplectic) * 1000) / 1000
  };

  const nodes = [
    { id: "action_minimization", pole: "primal", score: Math.round(actionGood * 1000) / 1000 },
    { id: "symmetry_conservation", pole: "dual", score: Math.round(symplectic * 1000) / 1000 },
    { id: "hamiltonian_balance", pole: "dual", score: Math.round(energyConst * 1000) / 1000 },
    { id: "path_optimality", pole: "primal", score: Math.round(pathOpt * 1000) / 1000 }
  ];
  const edges = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const diff = Math.abs(nodes[i].score - nodes[j].score);
      edges.push({
        from: nodes[i].id,
        to: nodes[j].id,
        dualityAlignment: Math.round((1 - diff) * 1000) / 1000,
        tension: Math.round(diff * 1000) / 1000
      });
    }
  }
  const meanAlign = edges.length ? mean(edges.map((e) => e.dualityAlignment)) : 0.5;
  const primalScores = nodes.filter((n) => n.pole === "primal").map((n) => n.score);
  const dualScores = nodes.filter((n) => n.pole === "dual").map((n) => n.score);
  const primalDualSpread = Math.abs(mean(primalScores) - mean(dualScores));

  const actionSymmetryDualityGraph = {
    nodes,
    edges,
    meanDualityAlignment: Math.round(meanAlign * 1000) / 1000,
    primalDualSpread: Math.round(primalDualSpread * 1000) / 1000
  };

  const primalVec = Math.sqrt(actionGood * actionGood + pathOpt * pathOpt + minVar * minVar);
  const dualVec = Math.sqrt(symplectic * symplectic + energyConst * energyConst + invFlux * invFlux);
  const dot = actionGood * symplectic + pathOpt * energyConst + minVar * invFlux;
  const denom = primalVec * dualVec;
  const pairingInnerProduct = Math.round(
    (denom > 1e-9 ? clamp01(dot / denom) : 0.5) * 1000
  ) / 1000;

  const stabilityConservationDualField = {
    primal: {
      actionGoodness: Math.round(actionGood * 1000) / 1000,
      pathOptimality: Math.round(pathOpt * 1000) / 1000,
      variationalMinimization: Math.round(minVar * 1000) / 1000
    },
    dual: {
      symplecticGoodness: Math.round(symplectic * 1000) / 1000,
      energyConstancy: Math.round(energyConst * 1000) / 1000,
      invarianceFlux: Math.round(invFlux * 1000) / 1000
    },
    pairingInnerProduct,
    calibrationMomentum: Math.round(mom * 1000) / 1000
  };

  const optimalReversibleTrajectorySelector = Math.round(
    clamp01(
      rev * 0.28 +
        actionGood * 0.22 +
        pathOpt * 0.18 +
        symplectic * 0.14 +
        meanAlign * 0.12 +
        pairingInnerProduct * 0.06
    ) * 1000
  ) / 1000;

  const prevD = actionSymmetryDualityBySubject.get(sid) || { selectorEma: null, noetherEma: null };
  const optimalReversibleTrajectorySelectorEma = Math.round(
    clamp01(ema(prevD.selectorEma, optimalReversibleTrajectorySelector)) * 1000
  ) / 1000;
  const noetherChargeProxyEma = Math.round(
    clamp01(ema(prevD.noetherEma, noetherChargeProxy)) * 1000
  ) / 1000;
  actionSymmetryDualityBySubject.set(sid, {
    selectorEma: optimalReversibleTrajectorySelectorEma,
    noetherEma: noetherChargeProxyEma
  });

  return {
    noetherLikeProxyInvariants,
    noetherChargeProxyEma,
    actionSymmetryDualityGraph,
    stabilityConservationDualField,
    optimalReversibleTrajectorySelector,
    optimalReversibleTrajectorySelectorEma
  };
}

/**
 * Internal-only: multi-scale / RG-style stability proxies (audit; not QFT).
 */
function computeEpistemicRenormalizationScaleInvariance(subjectId, next, forecast) {
  const sid = String(subjectId || "unknown");

  const sFine = clamp01(Number(forecast?.sigmaNext) || 0.5);
  const sCalib = clamp01(Number(next.forecastStabilityIndex) || 0.5);
  const sMeso = clamp01(Number(next.metaConsistencyValidator?.multiLayerEpistemicAgreementIndex) || 0.5);
  const sMacro = clamp01(Number(next.globalInvarianceManifold?.invariantComposite) || 0.5);
  const sCoarse = clamp01(1 - clamp01(Number(next.longAttractor?.attractorCollapseRiskLong) || 0));

  const resolutionLadder = {
    fine_sigma: Math.round(sFine * 1000) / 1000,
    calibration_fsi: Math.round(sCalib * 1000) / 1000,
    meso_agreement: Math.round(sMeso * 1000) / 1000,
    macro_invariant: Math.round(sMacro * 1000) / 1000,
    coarse_attractor: Math.round(sCoarse * 1000) / 1000
  };

  const ladder = [sFine, sCalib, sMeso, sMacro, sCoarse];
  const mu = mean(ladder);
  const spread = ladder.length > 1 ? Math.sqrt(variance(ladder, mu)) : 0;
  const scaleInvarianceStability = Math.round(clamp01(1 - spread * 2.05) * 1000) / 1000;

  let pairSum = 0;
  let pairCount = 0;
  for (let i = 0; i < ladder.length; i++) {
    for (let j = i + 1; j < ladder.length; j++) {
      pairSum += 1 - Math.abs(ladder[i] - ladder[j]);
      pairCount += 1;
    }
  }
  const multiResolutionConsistency =
    pairCount > 0 ? Math.round(clamp01(pairSum / pairCount) * 1000) / 1000 : 0.5;

  const fineAvg = (sFine + sCalib) / 2;
  const coarseAvg = (sMacro + sCoarse) / 2;
  const fractalEpistemicStability = Math.round(
    clamp01(1 - Math.abs(fineAvg - coarseAvg) * 2.15 - spread * 0.35) * 1000
  ) / 1000;

  const gap = Math.abs(sFine - sMacro);
  const state = renormalizationBySubject.get(sid) || { lastGap: null, flowEma: null, scaleEma: null };
  const prevGap =
    typeof state.lastGap === "number" && Number.isFinite(state.lastGap) ? state.lastGap : gap;
  const deltaGap = gap - prevGap;
  const renormalizationFlowProxy = Math.round(clamp01(0.5 - deltaGap * 3.4) * 1000) / 1000;

  const scaleInvarianceStabilityEma = Math.round(
    clamp01(ema(state.scaleEma, scaleInvarianceStability)) * 1000
  ) / 1000;
  const renormalizationFlowProxyEma = Math.round(
    clamp01(ema(state.flowEma, renormalizationFlowProxy)) * 1000
  ) / 1000;

  renormalizationBySubject.set(sid, {
    lastGap: gap,
    flowEma: renormalizationFlowProxyEma,
    scaleEma: scaleInvarianceStabilityEma
  });

  return {
    scaleInvarianceStability,
    scaleInvarianceStabilityEma,
    renormalizationFlowProxy,
    renormalizationFlowProxyEma,
    multiResolutionConsistency,
    fractalEpistemicStability,
    resolutionLadder,
    microMacroGap: Math.round(gap * 1000) / 1000,
    ladderSpread: Math.round(spread * 1000) / 1000
  };
}

/**
 * Internal-only: observer / measurement backreaction proxies (audit; not QM).
 * Quantifies how strongly the closed loop disturbs itself while measuring.
 */
function computeEpistemicObservabilitySelfMeasurement(subjectId, next, _forecast) {
  const sid = String(subjectId || "unknown");
  const cle = clamp01(Number(next.controlLoopEntropyEma) || 0);
  const adapt = clamp01(Number(next.adaptationEfficiencyEma) || 0.5);
  const fe = clamp01(Number(next.forecastErrorEma) || 0.5);
  const brier = clamp01(Number(next.regimeTransitionBrierScoreEma) || 0.5);
  const accel = Number(next.calibrationDriftAccelerationEma) || 0;
  const accelAbs = clamp01(Math.abs(accel) * 6.5);
  const rec = clamp01(Number(next.recoveryFrequencyEma) || 0);
  const fsi = clamp01(Number(next.forecastStabilityIndex) || 0.5);
  const horizonErr = clamp01(Number(next.horizonCalibrationErrorEma) || 0.5);
  const anomalyBoost = next.anomaly?.active ? 0.08 : 0;

  const observerEffectProxy =
    Math.round(
      clamp01(0.34 * cle + 0.28 * fe + 0.22 * brier + 0.16 * accelAbs + anomalyBoost) * 1000
    ) / 1000;

  const measurementBackreactionScore =
    Math.round(clamp01(cle * (0.42 + 0.58 * (1 - adapt)) * (1 + rec * 1.4)) * 1000) / 1000;

  const epistemicSelfDisturbanceIndex =
    Math.round(
      clamp01(
        0.28 * fe +
          0.24 * brier +
          0.22 * cle +
          0.2 * accelAbs +
          0.06 * (1 - fsi) +
          (next.anomaly?.active ? 0.06 : 0)
      ) * 1000
    ) / 1000;

  const observerInducedDriftDetector =
    Math.round(clamp01(accelAbs * 0.85 + rec * 0.35 + (next.anomaly?.active ? 0.12 : 0)) * 1000) / 1000;

  const joint = Math.sqrt(Math.max(0, fe) * Math.max(0, cle));
  const closedLoopObservabilityLimit =
    Math.round(clamp01(0.14 + joint * 2.35 + 0.12 * brier) * 1000) / 1000;

  const epistemicVisibilityLimitEstimator =
    Math.round(
      clamp01(0.1 + joint * 2.05 + 0.18 * horizonErr + 0.16 * brier + 0.08 * cle) * 1000
    ) / 1000;

  const closedLoopMeasurementStabilityField =
    Math.round(
      clamp01(
        1 -
          0.38 * epistemicSelfDisturbanceIndex -
          0.32 * measurementBackreactionScore -
          0.18 * observerEffectProxy -
          0.12 * (1 - adapt)
      ) * 1000
    ) / 1000;

  const st = observabilityBySubject.get(sid) || {};
  const observerEffectProxyEma =
    Math.round(clamp01(ema(st.observerEffectEma, observerEffectProxy)) * 1000) / 1000;
  const measurementBackreactionScoreEma =
    Math.round(clamp01(ema(st.backreactionEma, measurementBackreactionScore)) * 1000) / 1000;
  const epistemicSelfDisturbanceIndexEma =
    Math.round(clamp01(ema(st.selfDisturbanceEma, epistemicSelfDisturbanceIndex)) * 1000) / 1000;
  const closedLoopObservabilityLimitEma =
    Math.round(clamp01(ema(st.observabilityLimitEma, closedLoopObservabilityLimit)) * 1000) / 1000;
  const observerInducedDriftDetectorEma =
    Math.round(clamp01(ema(st.driftDetectorEma, observerInducedDriftDetector)) * 1000) / 1000;
  const closedLoopMeasurementStabilityFieldEma =
    Math.round(clamp01(ema(st.stabilityFieldEma, closedLoopMeasurementStabilityField)) * 1000) / 1000;
  const epistemicVisibilityLimitEstimatorEma =
    Math.round(clamp01(ema(st.visibilityLimitEma, epistemicVisibilityLimitEstimator)) * 1000) / 1000;

  observabilityBySubject.set(sid, {
    observerEffectEma: observerEffectProxyEma,
    backreactionEma: measurementBackreactionScoreEma,
    selfDisturbanceEma: epistemicSelfDisturbanceIndexEma,
    observabilityLimitEma: closedLoopObservabilityLimitEma,
    driftDetectorEma: observerInducedDriftDetectorEma,
    stabilityFieldEma: closedLoopMeasurementStabilityFieldEma,
    visibilityLimitEma: epistemicVisibilityLimitEstimatorEma
  });

  return {
    observerEffectProxy,
    observerEffectProxyEma,
    measurementBackreactionScore,
    measurementBackreactionScoreEma,
    epistemicSelfDisturbanceIndex,
    epistemicSelfDisturbanceIndexEma,
    closedLoopObservabilityLimit,
    closedLoopObservabilityLimitEma,
    observerInducedDriftDetector,
    observerInducedDriftDetectorEma,
    closedLoopMeasurementStabilityField,
    closedLoopMeasurementStabilityFieldEma,
    epistemicVisibilityLimitEstimator,
    epistemicVisibilityLimitEstimatorEma
  };
}

/**
 * Internal-only: incompressibility / minimal-description proxies (audit; not formal K(x)).
 */
function computeEpistemicIrreducibilityMinimalDescription(subjectId, next, forecast) {
  const sid = String(subjectId || "unknown");
  const fsi = clamp01(Number(next.forecastStabilityIndex) || 0.5);
  const ehs = clamp01(Number(next.epistemicHealthScore) || 0.5);
  const inv = clamp01(Number(next.globalInvarianceManifold?.invariantComposite) || 0.5);
  const meta = clamp01(Number(next.metaConsistencyValidator?.multiLayerEpistemicAgreementIndex) || 0.5);
  const sigma = clamp01(Number(forecast?.sigmaNext) || 0.5);
  const selfRef = clamp01(Number(next.selfReferenceClosure?.selfReferenceCompositeIndex) || 0.5);
  const renormS = clamp01(Number(next.renormalizationScaleInvariance?.scaleInvarianceStability) || 0.5);
  const ham = clamp01(Number(next.hamiltonianClosure?.hamiltonianInvariants?.hamiltonianLike) || 0.5);
  const varPath = clamp01(Number(next.variationalPrinciple?.globalPathOptimality) || 0.5);
  const disturb = clamp01(Number(next.epistemicObservabilitySelfMeasurement?.epistemicSelfDisturbanceIndex) || 0.5);

  const descriptorVector = [fsi, ehs, inv, meta, sigma, selfRef, renormS, ham, varPath, disturb];
  const mu = mean(descriptorVector);
  const spr =
    descriptorVector.length > 1 ? Math.sqrt(variance(descriptorVector, mu)) : 0;
  const mad =
    descriptorVector.reduce((a, b) => a + Math.abs(b - mu), 0) / descriptorVector.length;

  const ladderSpread = clamp01(Number(next.renormalizationScaleInvariance?.ladderSpread) || 0);
  const cle = clamp01(Number(next.controlLoopEntropyEma) || 0);
  const seriesVar = clamp01((Number(forecast?.series?.variance) || 0) * 8);

  const kolmogorovLikeComplexityProxy =
    Math.round(
      clamp01(0.12 + spr * 2.25 + ladderSpread * 1.15 + seriesVar * 0.18 + cle * 0.14 + mad * 0.42) * 1000
    ) / 1000;

  const irreducibleStateCore =
    Math.round(clamp01(0.15 + mad * 2.1 + spr * 0.85) * 1000) / 1000;

  const effectiveSpread = clamp01(spr + ladderSpread * 0.42);
  const redundancyCollapseDetection =
    Math.round(clamp01(1 - effectiveSpread * 3.1) * 1000) / 1000;

  const compressionEfficiency = clamp01(
    irreducibleStateCore / Math.max(0.07, kolmogorovLikeComplexityProxy)
  );
  const minimalSufficientEpistemicDescription =
    Math.round(
      clamp01(
        0.52 * compressionEfficiency +
          0.28 * clamp01(1 - redundancyCollapseDetection * 0.9) +
          0.2 * fsi
      ) * 1000
    ) / 1000;

  const st = irreducibilityBySubject.get(sid) || {};
  const kolmogorovLikeComplexityProxyEma =
    Math.round(clamp01(ema(st.kolmogorovEma, kolmogorovLikeComplexityProxy)) * 1000) / 1000;
  const irreducibleStateCoreEma =
    Math.round(clamp01(ema(st.coreEma, irreducibleStateCore)) * 1000) / 1000;
  const minimalSufficientEpistemicDescriptionEma =
    Math.round(clamp01(ema(st.minimalEma, minimalSufficientEpistemicDescription)) * 1000) / 1000;
  const redundancyCollapseDetectionEma =
    Math.round(clamp01(ema(st.collapseEma, redundancyCollapseDetection)) * 1000) / 1000;

  irreducibilityBySubject.set(sid, {
    kolmogorovEma: kolmogorovLikeComplexityProxyEma,
    coreEma: irreducibleStateCoreEma,
    minimalEma: minimalSufficientEpistemicDescriptionEma,
    collapseEma: redundancyCollapseDetectionEma
  });

  return {
    kolmogorovLikeComplexityProxy,
    kolmogorovLikeComplexityProxyEma,
    irreducibleStateCore,
    irreducibleStateCoreEma,
    minimalSufficientEpistemicDescription,
    minimalSufficientEpistemicDescriptionEma,
    redundancyCollapseDetection,
    redundancyCollapseDetectionEma,
    descriptorSummary: {
      mean: Math.round(mu * 1000) / 1000,
      spread: Math.round(spr * 1000) / 1000,
      meanAbsDeviation: Math.round(mad * 1000) / 1000,
      ladderSpread: Math.round(ladderSpread * 1000) / 1000
    }
  };
}

function buildForecastFromWindow(rows) {
  const sigmaSeq = rows.map((r) => Number(r.vectorScore) || 0);
  const driftSeq = rows.map((r) => Number(r.driftIndex) || 0);
  const meanSigma = mean(sigmaSeq);
  const sigmaVar = variance(sigmaSeq, meanSigma);
  const sigmaSlope = slope(sigmaSeq);
  const driftAvg = mean(driftSeq);
  const driftSlope = slope(driftSeq);
  const regime = classifyRegime(meanSigma, sigmaVar, driftAvg, sigmaSlope);

  const sigmaNext = clamp01(meanSigma + sigmaSlope * 0.8 - driftAvg * 0.08);
  const forecastError = clamp01(Math.abs(sigmaNext - sigmaSeq[sigmaSeq.length - 1]));
  const stabilityHorizon = Math.max(0, Math.min(12, Math.round((sigmaNext * (1 - driftAvg)) * 12)));
  const driftPredictability = clamp01(1 - Math.min(1, sigmaVar * 9 + Math.abs(driftSlope) * 1.8));

  const fragileL = clamp01((0.55 - sigmaNext) * 1.6 + driftAvg * 0.7 + Math.max(0, -sigmaSlope) * 2.4);
  const stableL = clamp01((sigmaNext - 0.52) * 1.6 + (1 - driftAvg) * 0.45 - sigmaVar * 5);
  const oscillatingL = clamp01(sigmaVar * 20 + Math.abs(sigmaSlope) * 3.4);
  const sum = fragileL + stableL + oscillatingL || 1;

  return {
    regime,
    sigmaNext: Math.round(sigmaNext * 1000) / 1000,
    forecastError: Math.round(forecastError * 1000) / 1000,
    stabilityHorizon,
    driftPredictability: Math.round(driftPredictability * 1000) / 1000,
    regimeTransitionLikelihood: {
      stable: Math.round((stableL / sum) * 1000) / 1000,
      oscillating: Math.round((oscillatingL / sum) * 1000) / 1000,
      fragile: Math.round((fragileL / sum) * 1000) / 1000
    },
    series: {
      sigma: sigmaSeq.map((x) => Math.round(x * 1000) / 1000),
      drift: driftSeq.map((x) => Math.round(x * 1000) / 1000),
      sigmaSlope: Math.round(sigmaSlope * 1000) / 1000,
      driftSlope: Math.round(driftSlope * 1000) / 1000,
      variance: Math.round(sigmaVar * 1000) / 1000
    }
  };
}

function updateCalibrationState(subjectId, actualRow, forecast) {
  const sid = String(subjectId || "unknown");
  const prev = calibrationBySubject.get(sid) || {
    forecastErrorEma: null,
    driftPredictabilityEma: null,
    horizonCalibrationErrorEma: null,
    regimeTransitionBrierScoreEma: null,
    calibrationDriftEma: null,
    calibrationDriftAccelerationEma: null,
    forecastStabilityIndex: null,
    epistemicHealthScore: null,
    controlLoopEntropyEma: null,
    adaptationEfficiencyEma: null,
    recoveryFrequencyEma: null,
    longHorizonDegradationRiskEma: null,
    epistemicFatigue: null,
    recoveryCount: 0,
    recoveryAction: "none",
    selfTuning: { ...DEFAULT_SELF_TUNE },
    pendingSolverAdjustment: null,
    anomaly: { active: false, reasons: [], at: 0 },
    lastForecast: null,
    samples: 0,
    updatedAt: 0
  };
  const tunePrimed = mergePendingSolverAdjustmentIntoTune(prev.selfTuning, prev.pendingSolverAdjustment);
  const next = { ...prev, selfTuning: tunePrimed, pendingSolverAdjustment: null };

  if (prev.lastForecast) {
    const actualSigma = clamp01(Number(actualRow?.vectorScore) || 0);
    const actualDrift = clamp01(Number(actualRow?.driftIndex) || 0);
    const expectedSigma = clamp01(Number(prev.lastForecast.sigmaNext) || actualSigma);
    const expectedDrift = clamp01(Number(prev.lastForecast.expectedDrift) || actualDrift);
    const regimeActual = String(prev.lastForecast.regimeActualHint || forecast.regime || "stable");

    const forecastError = Math.abs(expectedSigma - actualSigma);
    const driftPredictability = 1 - Math.abs(expectedDrift - actualDrift);
    const horizonNorm = clamp01((Number(prev.lastForecast.stabilityHorizon || 0) || 0) / 12);
    const horizonCalibrationError = Math.abs(horizonNorm - actualSigma);
    const brier = brierScore(prev.lastForecast.regimeTransitionLikelihood, regimeActual);

    next.forecastErrorEma = ema(prev.forecastErrorEma, forecastError);
    next.driftPredictabilityEma = ema(prev.driftPredictabilityEma, clamp01(driftPredictability));
    next.horizonCalibrationErrorEma = ema(prev.horizonCalibrationErrorEma, horizonCalibrationError);
    next.regimeTransitionBrierScoreEma = ema(prev.regimeTransitionBrierScoreEma, brier);
    const driftRaw =
      typeof prev.forecastErrorEma === "number" ? next.forecastErrorEma - prev.forecastErrorEma : 0;
    next.calibrationDriftEma = ema(prev.calibrationDriftEma, driftRaw);
    const accelRaw =
      typeof prev.calibrationDriftEma === "number" ? next.calibrationDriftEma - prev.calibrationDriftEma : 0;
    next.calibrationDriftAccelerationEma = ema(prev.calibrationDriftAccelerationEma, accelRaw);
    next.samples = (Number(prev.samples) || 0) + 1;
    next.updatedAt = Date.now();
  }

  next.forecastStabilityIndex = computeForecastStabilityIndex(next);
  next.epistemicHealthScore = computeEpistemicHealthScore(next, forecast);
  next.selfTuning = maybeSelfTune(prev.selfTuning, next, forecast);
  const anomalyReasons = [];
  if (typeof next.forecastStabilityIndex === "number" && next.forecastStabilityIndex < next.selfTuning.fragileThreshold) {
    anomalyReasons.push("fsi_low");
  }
  if (
    typeof next.calibrationDriftAccelerationEma === "number" &&
    Math.abs(next.calibrationDriftAccelerationEma) > next.selfTuning.driftAccelThreshold
  ) {
    anomalyReasons.push("calibration_drift_accel_high");
  }
  if (typeof next.horizonCalibrationErrorEma === "number" && next.horizonCalibrationErrorEma > 0.28) {
    anomalyReasons.push("horizon_error_high");
  }
  next.anomaly = {
    active: anomalyReasons.length > 0,
    reasons: anomalyReasons,
    at: Date.now()
  };
  const cle = controlLoopEntropy(prev.selfTuning, next.selfTuning, next.anomaly);
  next.controlLoopEntropyEma = ema(prev.controlLoopEntropyEma, cle);
  next.recoveryAction = next.anomaly.active ? "recalibrate_soft" : "none";
  next.recoveryCount = Number(prev.recoveryCount || 0) + (next.anomaly.active ? 1 : 0);
  const recTick = next.anomaly.active ? 1 : 0;
  next.recoveryFrequencyEma = ema(prev.recoveryFrequencyEma, recTick);
  next.adaptationEfficiencyEma = ema(prev.adaptationEfficiencyEma, adaptationEfficiency(prev, next));
  // Fatigue: rising control entropy + low adaptation efficiency + frequent recovery.
  const fatigueRaw = clamp01(
    (Number(next.controlLoopEntropyEma || 0) || 0) * 0.46 +
      (1 - (Number(next.adaptationEfficiencyEma || 0) || 0)) * 0.34 +
      (Number(next.recoveryFrequencyEma || 0) || 0) * 0.2
  );
  next.epistemicFatigue = ema(prev.epistemicFatigue, fatigueRaw);
  const riskRaw = longHorizonDegradationRisk(next);
  next.longHorizonDegradationRiskEma = ema(prev.longHorizonDegradationRiskEma, riskRaw);
  next.controlLoopForecast = predictControlLoopNext(next);
  next.fixedPoint = detectEpistemicFixedPoint(next, forecast);
  next.bifurcation = detectEpistemicBifurcation(prev, next, forecast);
  next.longAttractor = updateLongAttractorState(sid, next);
  const mesoRows = updateMesoState(sid, forecast, next);
  next.crossScale = computeCrossScaleCoupling(next.fixedPoint, mesoRows, next.longAttractor);
  next.conservation = computeConservationResiduals(sid, next, forecast);
  const solver = runEpistemicSelfConsistencySolver(sid, next, forecast);
  next.selfConsistency = solver.snapshot;
  next.pendingSolverAdjustment = solver.nextAdjustment;
  next.fixedPointConvergenceTheorem = computeFixedPointConvergenceTheorem(sid, next, forecast, prev);
  next.metaConsistencyValidator = computeEpistemicMetaConsistencyValidator(sid, next, forecast);
  next.selfReferenceClosure = computeEpistemicSelfReferenceClosure(sid, next, forecast);
  next.globalInvarianceManifold = computeEpistemicGlobalInvarianceManifold(sid, next, forecast);
  next.curvatureGeodesicFlow = computeEpistemicCurvatureGeodesicFlow(sid, next, forecast);
  next.variationalPrinciple = computeEpistemicVariationalPrinciple(sid, next, forecast);
  next.hamiltonianClosure = computeEpistemicHamiltonianClosure(sid, next, forecast);
  next.actionSymmetryDualityClosure = computeEpistemicActionSymmetryDualityClosure(sid, next, forecast);
  next.renormalizationScaleInvariance = computeEpistemicRenormalizationScaleInvariance(sid, next, forecast);
  next.epistemicObservabilitySelfMeasurement = computeEpistemicObservabilitySelfMeasurement(sid, next, forecast);
  next.epistemicIrreducibilityMinimalDescription = computeEpistemicIrreducibilityMinimalDescription(
    sid,
    next,
    forecast
  );
  next.lastForecastVariance = Number(forecast?.series?.variance) || 0;

  next.lastForecast = {
    sigmaNext: forecast.sigmaNext,
    expectedDrift: mean(forecast.series?.drift || []),
    stabilityHorizon: forecast.stabilityHorizon,
    regimeTransitionLikelihood: forecast.regimeTransitionLikelihood,
    regimeActualHint: forecast.regime,
    createdAt: Date.now()
  };

  calibrationBySubject.set(sid, next);
  return next;
}

/**
 * Internal-only forecast storage. No client/UI response exposure.
 * @param {string} subjectId
 * @param {Array<Record<string, unknown>>} normalizedRows
 */
export async function persistEpistemicForecastBatch(subjectId, normalizedRows) {
  const rows = Array.isArray(normalizedRows) ? normalizedRows : [];
  if (!rows.length) return { ok: true, persisted: 0, mode: "skip" };
  const sid = String(subjectId || "unknown");
  const prev = seriesBySubject.get(sid) || [];
  const prevCal = calibrationBySubject.get(sid) || null;
  const activeWindow = Math.max(
    5,
    Math.min(12, Number(prevCal?.selfTuning?.windowSize || DEFAULT_SELF_TUNE.windowSize))
  );
  const combined = [...prev, ...rows].slice(-activeWindow);
  seriesBySubject.set(sid, combined);

  const forecast = buildForecastFromWindow(combined);
  const calibration = updateCalibrationState(sid, rows[rows.length - 1], forecast);
  const { db, mode } = getFirebasePersistence();
  if (!db) return { ok: true, persisted: 0, mode };

  let persisted = 0;
  const writes = rows
    .map((r) => {
      const traceId = String(r?.traceId || "").trim();
      if (!traceId) return null;
      return { traceId, row: r };
    })
    .filter(Boolean);

  const batch = db.batch();
  for (const w of writes) {
    const ref = db.collection("epistemic_forecast").doc(w.traceId);
    batch.set(
      ref,
      {
        traceId: w.traceId,
        uid: sid,
        timestamp: Number(w.row?.timestamp || Date.now()),
        regime: forecast.regime,
        sigmaNext: forecast.sigmaNext,
        forecastError: forecast.forecastError,
        stabilityHorizon: forecast.stabilityHorizon,
        driftPredictability: forecast.driftPredictability,
        regimeTransitionLikelihood: forecast.regimeTransitionLikelihood,
        series: forecast.series,
        // Internal calibration snapshot (non-UI consumer).
        calibration: {
          forecastErrorEma:
            typeof calibration.forecastErrorEma === "number"
              ? Math.round(calibration.forecastErrorEma * 1000) / 1000
              : null,
          driftPredictabilityEma:
            typeof calibration.driftPredictabilityEma === "number"
              ? Math.round(calibration.driftPredictabilityEma * 1000) / 1000
              : null,
          horizonCalibrationErrorEma:
            typeof calibration.horizonCalibrationErrorEma === "number"
              ? Math.round(calibration.horizonCalibrationErrorEma * 1000) / 1000
              : null,
          regimeTransitionBrierScoreEma:
            typeof calibration.regimeTransitionBrierScoreEma === "number"
              ? Math.round(calibration.regimeTransitionBrierScoreEma * 1000) / 1000
              : null,
          calibrationDriftEma:
            typeof calibration.calibrationDriftEma === "number"
              ? Math.round(calibration.calibrationDriftEma * 1000) / 1000
              : null,
          calibrationDriftAccelerationEma:
            typeof calibration.calibrationDriftAccelerationEma === "number"
              ? Math.round(calibration.calibrationDriftAccelerationEma * 1000) / 1000
              : null,
          forecastStabilityIndex:
            typeof calibration.forecastStabilityIndex === "number"
              ? Math.round(calibration.forecastStabilityIndex * 1000) / 1000
              : null,
          epistemicHealthScore:
            typeof calibration.epistemicHealthScore === "number"
              ? Math.round(calibration.epistemicHealthScore * 1000) / 1000
              : null,
          controlLoopEntropyEma:
            typeof calibration.controlLoopEntropyEma === "number"
              ? Math.round(calibration.controlLoopEntropyEma * 1000) / 1000
              : null,
          adaptationEfficiencyEma:
            typeof calibration.adaptationEfficiencyEma === "number"
              ? Math.round(calibration.adaptationEfficiencyEma * 1000) / 1000
              : null,
          recoveryFrequencyEma:
            typeof calibration.recoveryFrequencyEma === "number"
              ? Math.round(calibration.recoveryFrequencyEma * 1000) / 1000
              : null,
          longHorizonDegradationRiskEma:
            typeof calibration.longHorizonDegradationRiskEma === "number"
              ? Math.round(calibration.longHorizonDegradationRiskEma * 1000) / 1000
              : null,
          epistemicFatigue:
            typeof calibration.epistemicFatigue === "number"
              ? Math.round(calibration.epistemicFatigue * 1000) / 1000
              : null,
          recoveryAction: String(calibration.recoveryAction || "none"),
          recoveryCount: Number(calibration.recoveryCount) || 0,
          controlLoopForecast:
            calibration.controlLoopForecast && typeof calibration.controlLoopForecast === "object"
              ? calibration.controlLoopForecast
              : null,
          fixedPoint:
            calibration.fixedPoint && typeof calibration.fixedPoint === "object"
              ? calibration.fixedPoint
              : null,
          bifurcation:
            calibration.bifurcation && typeof calibration.bifurcation === "object"
              ? calibration.bifurcation
              : null,
          longAttractor:
            calibration.longAttractor && typeof calibration.longAttractor === "object"
              ? calibration.longAttractor
              : null,
          crossScale:
            calibration.crossScale && typeof calibration.crossScale === "object"
              ? calibration.crossScale
              : null,
          conservation:
            calibration.conservation && typeof calibration.conservation === "object"
              ? calibration.conservation
              : null,
          selfConsistency:
            calibration.selfConsistency && typeof calibration.selfConsistency === "object"
              ? calibration.selfConsistency
              : null,
          fixedPointConvergenceTheorem:
            calibration.fixedPointConvergenceTheorem && typeof calibration.fixedPointConvergenceTheorem === "object"
              ? calibration.fixedPointConvergenceTheorem
              : null,
          metaConsistencyValidator:
            calibration.metaConsistencyValidator && typeof calibration.metaConsistencyValidator === "object"
              ? calibration.metaConsistencyValidator
              : null,
          selfReferenceClosure:
            calibration.selfReferenceClosure && typeof calibration.selfReferenceClosure === "object"
              ? calibration.selfReferenceClosure
              : null,
          globalInvarianceManifold:
            calibration.globalInvarianceManifold && typeof calibration.globalInvarianceManifold === "object"
              ? calibration.globalInvarianceManifold
              : null,
          curvatureGeodesicFlow:
            calibration.curvatureGeodesicFlow && typeof calibration.curvatureGeodesicFlow === "object"
              ? calibration.curvatureGeodesicFlow
              : null,
          variationalPrinciple:
            calibration.variationalPrinciple && typeof calibration.variationalPrinciple === "object"
              ? calibration.variationalPrinciple
              : null,
          hamiltonianClosure:
            calibration.hamiltonianClosure && typeof calibration.hamiltonianClosure === "object"
              ? calibration.hamiltonianClosure
              : null,
          actionSymmetryDualityClosure:
            calibration.actionSymmetryDualityClosure && typeof calibration.actionSymmetryDualityClosure === "object"
              ? calibration.actionSymmetryDualityClosure
              : null,
          renormalizationScaleInvariance:
            calibration.renormalizationScaleInvariance && typeof calibration.renormalizationScaleInvariance === "object"
              ? calibration.renormalizationScaleInvariance
              : null,
          epistemicObservabilitySelfMeasurement:
            calibration.epistemicObservabilitySelfMeasurement &&
            typeof calibration.epistemicObservabilitySelfMeasurement === "object"
              ? calibration.epistemicObservabilitySelfMeasurement
              : null,
          epistemicIrreducibilityMinimalDescription:
            calibration.epistemicIrreducibilityMinimalDescription &&
            typeof calibration.epistemicIrreducibilityMinimalDescription === "object"
              ? calibration.epistemicIrreducibilityMinimalDescription
              : null,
          selfTuning: calibration.selfTuning || { ...DEFAULT_SELF_TUNE },
          anomaly: calibration.anomaly || { active: false, reasons: [], at: 0 },
          samples: Number(calibration.samples) || 0
        },
        updatedAt: Date.now()
      },
      { merge: true }
    );
    persisted += 1;
  }
  const calRef = db.collection("epistemic_forecast_calibration").doc(sid);
  batch.set(
    calRef,
    {
      uid: sid,
      forecast_error_ema:
        typeof calibration.forecastErrorEma === "number"
          ? Math.round(calibration.forecastErrorEma * 1000) / 1000
          : null,
      drift_predictability_ema:
        typeof calibration.driftPredictabilityEma === "number"
          ? Math.round(calibration.driftPredictabilityEma * 1000) / 1000
          : null,
      horizon_calibration_error:
        typeof calibration.horizonCalibrationErrorEma === "number"
          ? Math.round(calibration.horizonCalibrationErrorEma * 1000) / 1000
          : null,
      regime_transition_brier_score:
        typeof calibration.regimeTransitionBrierScoreEma === "number"
          ? Math.round(calibration.regimeTransitionBrierScoreEma * 1000) / 1000
          : null,
      calibration_drift_ema:
        typeof calibration.calibrationDriftEma === "number"
          ? Math.round(calibration.calibrationDriftEma * 1000) / 1000
          : null,
      calibration_drift_acceleration_ema:
        typeof calibration.calibrationDriftAccelerationEma === "number"
          ? Math.round(calibration.calibrationDriftAccelerationEma * 1000) / 1000
          : null,
      forecast_stability_index:
        typeof calibration.forecastStabilityIndex === "number"
          ? Math.round(calibration.forecastStabilityIndex * 1000) / 1000
          : null,
      epistemic_health_score:
        typeof calibration.epistemicHealthScore === "number"
          ? Math.round(calibration.epistemicHealthScore * 1000) / 1000
          : null,
      control_loop_entropy:
        typeof calibration.controlLoopEntropyEma === "number"
          ? Math.round(calibration.controlLoopEntropyEma * 1000) / 1000
          : null,
      adaptation_efficiency:
        typeof calibration.adaptationEfficiencyEma === "number"
          ? Math.round(calibration.adaptationEfficiencyEma * 1000) / 1000
          : null,
      recovery_frequency:
        typeof calibration.recoveryFrequencyEma === "number"
          ? Math.round(calibration.recoveryFrequencyEma * 1000) / 1000
          : null,
      long_horizon_degradation_risk:
        typeof calibration.longHorizonDegradationRiskEma === "number"
          ? Math.round(calibration.longHorizonDegradationRiskEma * 1000) / 1000
          : null,
      epistemic_fatigue:
        typeof calibration.epistemicFatigue === "number"
          ? Math.round(calibration.epistemicFatigue * 1000) / 1000
          : null,
      control_loop_entropy_next:
        typeof calibration.controlLoopForecast?.controlLoopEntropyNext === "number"
          ? calibration.controlLoopForecast.controlLoopEntropyNext
          : null,
      control_fatigue_prediction:
        typeof calibration.controlLoopForecast?.controlFatiguePrediction === "number"
          ? calibration.controlLoopForecast.controlFatiguePrediction
          : null,
      recovery_oscillation_likelihood:
        typeof calibration.controlLoopForecast?.recoveryOscillationLikelihood === "number"
          ? calibration.controlLoopForecast.recoveryOscillationLikelihood
          : null,
      adaptation_collapse_forecast:
        typeof calibration.controlLoopForecast?.adaptationCollapseForecast === "number"
          ? calibration.controlLoopForecast.adaptationCollapseForecast
          : null,
      epistemic_system_longevity:
        typeof calibration.controlLoopForecast?.epistemicSystemLongevity === "number"
          ? calibration.controlLoopForecast.epistemicSystemLongevity
          : null,
      fixed_point_stability_score:
        typeof calibration.fixedPoint?.fixedPointStabilityScore === "number"
          ? calibration.fixedPoint.fixedPointStabilityScore
          : null,
      long_term_epistemic_equilibrium_index:
        typeof calibration.fixedPoint?.longTermEpistemicEquilibriumIndex === "number"
          ? calibration.fixedPoint.longTermEpistemicEquilibriumIndex
          : null,
      attractor_type:
        calibration.fixedPoint?.attractorType != null ? String(calibration.fixedPoint.attractorType) : "stable_eq",
      attractor_basin_likelihood:
        calibration.fixedPoint?.attractorBasinLikelihood && typeof calibration.fixedPoint.attractorBasinLikelihood === "object"
          ? calibration.fixedPoint.attractorBasinLikelihood
          : null,
      oscillation_damping_prediction:
        typeof calibration.fixedPoint?.oscillationDampingPrediction === "number"
          ? calibration.fixedPoint.oscillationDampingPrediction
          : null,
      control_loop_phase_transition_likelihood:
        typeof calibration.fixedPoint?.controlLoopPhaseTransitionLikelihood === "number"
          ? calibration.fixedPoint.controlLoopPhaseTransitionLikelihood
          : null,
      phase_split_detected: !!calibration.bifurcation?.phaseSplitDetected,
      regime_branching_prediction:
        typeof calibration.bifurcation?.regimeBranchingPrediction === "number"
          ? calibration.bifurcation.regimeBranchingPrediction
          : null,
      instability_origin_trace:
        calibration.bifurcation?.instabilityOriginTrace != null
          ? String(calibration.bifurcation.instabilityOriginTrace)
          : "none",
      attractor_basin_migration:
        calibration.bifurcation?.attractorBasinMigration && typeof calibration.bifurcation.attractorBasinMigration === "object"
          ? calibration.bifurcation.attractorBasinMigration
          : null,
      basin_erosion_ema:
        typeof calibration.longAttractor?.basinErosionEma === "number"
          ? calibration.longAttractor.basinErosionEma
          : null,
      attractor_weakening_score:
        typeof calibration.longAttractor?.attractorWeakeningScore === "number"
          ? calibration.longAttractor.attractorWeakeningScore
          : null,
      phase_memory_decay_ema:
        typeof calibration.longAttractor?.phaseMemoryDecayEma === "number"
          ? calibration.longAttractor.phaseMemoryDecayEma
          : null,
      attractor_collapse_risk_long:
        typeof calibration.longAttractor?.attractorCollapseRiskLong === "number"
          ? calibration.longAttractor.attractorCollapseRiskLong
          : null,
      epistemic_landscape_evolution:
        calibration.longAttractor?.epistemicLandscapeEvolution && typeof calibration.longAttractor.epistemicLandscapeEvolution === "object"
          ? calibration.longAttractor.epistemicLandscapeEvolution
          : null,
      micro_to_macro_influence:
        typeof calibration.crossScale?.microToMacroInfluence === "number"
          ? calibration.crossScale.microToMacroInfluence
          : null,
      macro_to_micro_constraint:
        typeof calibration.crossScale?.macroToMicroConstraint === "number"
          ? calibration.crossScale.macroToMicroConstraint
          : null,
      cross_scale_instability:
        typeof calibration.crossScale?.crossScaleInstability === "number"
          ? calibration.crossScale.crossScaleInstability
          : null,
      hierarchical_collapse_risk:
        typeof calibration.crossScale?.hierarchicalCollapseRisk === "number"
          ? calibration.crossScale.hierarchicalCollapseRisk
          : null,
      entropy_conservation_residual:
        typeof calibration.conservation?.entropyConservationResidual === "number"
          ? calibration.conservation.entropyConservationResidual
          : null,
      stability_flux_residual:
        typeof calibration.conservation?.stabilityFluxResidual === "number"
          ? calibration.conservation.stabilityFluxResidual
          : null,
      drift_energy_residual:
        typeof calibration.conservation?.driftEnergyResidual === "number"
          ? calibration.conservation.driftEnergyResidual
          : null,
      cross_scale_invariant_residual:
        typeof calibration.conservation?.crossScaleInvariantResidual === "number"
          ? calibration.conservation.crossScaleInvariantResidual
          : null,
      equilibrium_constraint_violation:
        typeof calibration.conservation?.equilibriumConstraintViolation === "number"
          ? calibration.conservation.equilibriumConstraintViolation
          : null,
      self_consistency_violation:
        typeof calibration.selfConsistency?.violationObjective === "number"
          ? calibration.selfConsistency.violationObjective
          : null,
      self_consistency_residual_norm:
        typeof calibration.selfConsistency?.residualNorm === "number"
          ? calibration.selfConsistency.residualNorm
          : null,
      restoration_trajectory_score:
        typeof calibration.selfConsistency?.restorationTrajectoryScore === "number"
          ? calibration.selfConsistency.restorationTrajectoryScore
          : null,
      solver_relaxation_velocity_ema:
        typeof calibration.selfConsistency?.relaxationVelocityEma === "number"
          ? calibration.selfConsistency.relaxationVelocityEma
          : null,
      constraint_relaxation_rate:
        typeof calibration.selfConsistency?.constraintRelaxationRate === "number"
          ? calibration.selfConsistency.constraintRelaxationRate
          : null,
      self_consistency:
        calibration.selfConsistency && typeof calibration.selfConsistency === "object"
          ? calibration.selfConsistency
          : null,
      convergence_guarantee_score:
        typeof calibration.fixedPointConvergenceTheorem?.convergenceGuaranteeScore === "number"
          ? calibration.fixedPointConvergenceTheorem.convergenceGuaranteeScore
          : null,
      convergence_guarantee_ema:
        typeof calibration.fixedPointConvergenceTheorem?.convergenceGuaranteeEma === "number"
          ? calibration.fixedPointConvergenceTheorem.convergenceGuaranteeEma
          : null,
      oscillation_impossibility_margin:
        typeof calibration.fixedPointConvergenceTheorem?.oscillationImpossibilityBounds?.impossibilityMargin ===
        "number"
          ? calibration.fixedPointConvergenceTheorem.oscillationImpossibilityBounds.impossibilityMargin
          : null,
      attractor_uniqueness_score:
        typeof calibration.fixedPointConvergenceTheorem?.attractorUniquenessValidation?.uniquenessScore === "number"
          ? calibration.fixedPointConvergenceTheorem.attractorUniquenessValidation.uniquenessScore
          : null,
      attractor_uniqueness_validated:
        !!calibration.fixedPointConvergenceTheorem?.attractorUniquenessValidation?.validated,
      stability_proof_likelihood:
        typeof calibration.fixedPointConvergenceTheorem?.longTermStabilityProofApproximation?.proofLikelihood ===
        "number"
          ? calibration.fixedPointConvergenceTheorem.longTermStabilityProofApproximation.proofLikelihood
          : null,
      fixed_point_convergence_theorem:
        calibration.fixedPointConvergenceTheorem && typeof calibration.fixedPointConvergenceTheorem === "object"
          ? calibration.fixedPointConvergenceTheorem
          : null,
      stability_certification_coherence_score:
        typeof calibration.metaConsistencyValidator?.stabilityCertificationCoherenceScore === "number"
          ? calibration.metaConsistencyValidator.stabilityCertificationCoherenceScore
          : null,
      stability_certification_coherence_ema:
        typeof calibration.metaConsistencyValidator?.stabilityCertificationCoherenceEma === "number"
          ? calibration.metaConsistencyValidator.stabilityCertificationCoherenceEma
          : null,
      multi_layer_epistemic_agreement_index:
        typeof calibration.metaConsistencyValidator?.multiLayerEpistemicAgreementIndex === "number"
          ? calibration.metaConsistencyValidator.multiLayerEpistemicAgreementIndex
          : null,
      multi_layer_epistemic_agreement_ema:
        typeof calibration.metaConsistencyValidator?.multiLayerEpistemicAgreementEma === "number"
          ? calibration.metaConsistencyValidator.multiLayerEpistemicAgreementEma
          : null,
      meta_contradiction_count:
        typeof calibration.metaConsistencyValidator?.contradictionCount === "number"
          ? calibration.metaConsistencyValidator.contradictionCount
          : null,
      meta_max_pairwise_tension:
        typeof calibration.metaConsistencyValidator?.maxPairwiseTension === "number"
          ? calibration.metaConsistencyValidator.maxPairwiseTension
          : null,
      meta_consistency_validator:
        calibration.metaConsistencyValidator && typeof calibration.metaConsistencyValidator === "object"
          ? calibration.metaConsistencyValidator
          : null,
      recursive_coherence_depth:
        typeof calibration.selfReferenceClosure?.recursiveCoherenceDepth === "number"
          ? calibration.selfReferenceClosure.recursiveCoherenceDepth
          : null,
      recursive_coherence_depth_ema:
        typeof calibration.selfReferenceClosure?.recursiveCoherenceDepthEma === "number"
          ? calibration.selfReferenceClosure.recursiveCoherenceDepthEma
          : null,
      self_reference_loop_stability:
        typeof calibration.selfReferenceClosure?.selfReferenceLoopStability === "number"
          ? calibration.selfReferenceClosure.selfReferenceLoopStability
          : null,
      self_reference_loop_stability_ema:
        typeof calibration.selfReferenceClosure?.selfReferenceLoopStabilityEma === "number"
          ? calibration.selfReferenceClosure.selfReferenceLoopStabilityEma
          : null,
      infinite_regress_damping:
        typeof calibration.selfReferenceClosure?.infiniteRegressDamping === "number"
          ? calibration.selfReferenceClosure.infiniteRegressDamping
          : null,
      infinite_regress_damping_ema:
        typeof calibration.selfReferenceClosure?.infiniteRegressDampingEma === "number"
          ? calibration.selfReferenceClosure.infiniteRegressDampingEma
          : null,
      epistemic_fixed_point_closure_score:
        typeof calibration.selfReferenceClosure?.epistemicFixedPointClosureScore === "number"
          ? calibration.selfReferenceClosure.epistemicFixedPointClosureScore
          : null,
      epistemic_fixed_point_closure_score_ema:
        typeof calibration.selfReferenceClosure?.epistemicFixedPointClosureScoreEma === "number"
          ? calibration.selfReferenceClosure.epistemicFixedPointClosureScoreEma
          : null,
      self_reference_composite_index:
        typeof calibration.selfReferenceClosure?.selfReferenceCompositeIndex === "number"
          ? calibration.selfReferenceClosure.selfReferenceCompositeIndex
          : null,
      self_reference_closure:
        calibration.selfReferenceClosure && typeof calibration.selfReferenceClosure === "object"
          ? calibration.selfReferenceClosure
          : null,
      invariant_composite:
        typeof calibration.globalInvarianceManifold?.invariantComposite === "number"
          ? calibration.globalInvarianceManifold.invariantComposite
          : null,
      invariant_composite_ema:
        typeof calibration.globalInvarianceManifold?.invariantCompositeEma === "number"
          ? calibration.globalInvarianceManifold.invariantCompositeEma
          : null,
      global_stability_symmetry:
        typeof calibration.globalInvarianceManifold?.globalStabilitySymmetry === "number"
          ? calibration.globalInvarianceManifold.globalStabilitySymmetry
          : null,
      global_stability_symmetry_ema:
        typeof calibration.globalInvarianceManifold?.globalStabilitySymmetryEma === "number"
          ? calibration.globalInvarianceManifold.globalStabilitySymmetryEma
          : null,
      cross_layer_conservation_unification:
        typeof calibration.globalInvarianceManifold?.crossLayerConservationUnification === "number"
          ? calibration.globalInvarianceManifold.crossLayerConservationUnification
          : null,
      cross_layer_conservation_unification_ema:
        typeof calibration.globalInvarianceManifold?.crossLayerConservationUnificationEma === "number"
          ? calibration.globalInvarianceManifold.crossLayerConservationUnificationEma
          : null,
      epistemic_phase_angle01:
        typeof calibration.globalInvarianceManifold?.epistemicPhaseManifold?.angle01 === "number"
          ? calibration.globalInvarianceManifold.epistemicPhaseManifold.angle01
          : null,
      epistemic_phase_radius:
        typeof calibration.globalInvarianceManifold?.epistemicPhaseManifold?.radius === "number"
          ? calibration.globalInvarianceManifold.epistemicPhaseManifold.radius
          : null,
      epistemic_phase_elevation:
        typeof calibration.globalInvarianceManifold?.epistemicPhaseManifold?.elevation === "number"
          ? calibration.globalInvarianceManifold.epistemicPhaseManifold.elevation
          : null,
      global_invariance_manifold:
        calibration.globalInvarianceManifold && typeof calibration.globalInvarianceManifold === "object"
          ? calibration.globalInvarianceManifold
          : null,
      geodesic_tangent_alignment:
        typeof calibration.curvatureGeodesicFlow?.stabilityGeodesics?.tangentAlignmentScore === "number"
          ? calibration.curvatureGeodesicFlow.stabilityGeodesics.tangentAlignmentScore
          : null,
      geodesic_path_energy:
        typeof calibration.curvatureGeodesicFlow?.stabilityGeodesics?.pathEnergyProxy === "number"
          ? calibration.curvatureGeodesicFlow.stabilityGeodesics.pathEnergyProxy
          : null,
      geodesic_path_energy_ema:
        typeof calibration.curvatureGeodesicFlow?.pathEnergyProxyEma === "number"
          ? calibration.curvatureGeodesicFlow.pathEnergyProxyEma
          : null,
      geodesic_discrete_arc_length:
        typeof calibration.curvatureGeodesicFlow?.stabilityGeodesics?.discreteArcLength === "number"
          ? calibration.curvatureGeodesicFlow.stabilityGeodesics.discreteArcLength
          : null,
      attractor_metric_distance:
        typeof calibration.curvatureGeodesicFlow?.attractorShortestPaths?.metricDistance === "number"
          ? calibration.curvatureGeodesicFlow.attractorShortestPaths.metricDistance
          : null,
      geodesic_efficiency:
        typeof calibration.curvatureGeodesicFlow?.attractorShortestPaths?.geodesicEfficiency === "number"
          ? calibration.curvatureGeodesicFlow.attractorShortestPaths.geodesicEfficiency
          : null,
      geodesic_efficiency_ema:
        typeof calibration.curvatureGeodesicFlow?.geodesicEfficiencyEma === "number"
          ? calibration.curvatureGeodesicFlow.geodesicEfficiencyEma
          : null,
      sectional_curvature_proxy:
        typeof calibration.curvatureGeodesicFlow?.epistemicCurvatureTensors?.sectionalCurvatureProxy === "number"
          ? calibration.curvatureGeodesicFlow.epistemicCurvatureTensors.sectionalCurvatureProxy
          : null,
      ricci_scalar_proxy:
        typeof calibration.curvatureGeodesicFlow?.epistemicCurvatureTensors?.ricciScalarProxy === "number"
          ? calibration.curvatureGeodesicFlow.epistemicCurvatureTensors.ricciScalarProxy
          : null,
      collapse_avoidance_pressure:
        typeof calibration.curvatureGeodesicFlow?.collapseAvoidingTrajectories?.collapsePressure === "number"
          ? calibration.curvatureGeodesicFlow.collapseAvoidingTrajectories.collapsePressure
          : null,
      curvature_geodesic_flow:
        calibration.curvatureGeodesicFlow && typeof calibration.curvatureGeodesicFlow === "object"
          ? calibration.curvatureGeodesicFlow
          : null,
      action_functional_proxy:
        typeof calibration.variationalPrinciple?.actionFunctionalProxy === "number"
          ? calibration.variationalPrinciple.actionFunctionalProxy
          : null,
      action_functional_proxy_ema:
        typeof calibration.variationalPrinciple?.actionFunctionalProxyEma === "number"
          ? calibration.variationalPrinciple.actionFunctionalProxyEma
          : null,
      global_path_optimality:
        typeof calibration.variationalPrinciple?.globalPathOptimality === "number"
          ? calibration.variationalPrinciple.globalPathOptimality
          : null,
      global_path_optimality_ema:
        typeof calibration.variationalPrinciple?.globalPathOptimalityEma === "number"
          ? calibration.variationalPrinciple.globalPathOptimalityEma
          : null,
      stability_variational_minimization:
        typeof calibration.variationalPrinciple?.stabilityVariationalMinimization === "number"
          ? calibration.variationalPrinciple.stabilityVariationalMinimization
          : null,
      stability_variational_minimization_ema:
        typeof calibration.variationalPrinciple?.stabilityVariationalMinimizationEma === "number"
          ? calibration.variationalPrinciple.stabilityVariationalMinimizationEma
          : null,
      epistemic_potential_energy:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.potentialEnergy === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.potentialEnergy
          : null,
      epistemic_kinetic_energy:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.kineticEnergy === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.kineticEnergy
          : null,
      epistemic_lagrangian:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.lagrangian === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.lagrangian
          : null,
      epistemic_energy_barrier:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.barrierHeight === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.barrierHeight
          : null,
      epistemic_energy_gradient_proxy:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.gradientMagnitudeProxy === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.gradientMagnitudeProxy
          : null,
      variational_principle:
        calibration.variationalPrinciple && typeof calibration.variationalPrinciple === "object"
          ? calibration.variationalPrinciple
          : null,
      symplectic_structure_proxy:
        typeof calibration.hamiltonianClosure?.symplecticStructureProxy === "number"
          ? calibration.hamiltonianClosure.symplecticStructureProxy
          : null,
      symplectic_structure_proxy_ema:
        typeof calibration.hamiltonianClosure?.symplecticStructureProxyEma === "number"
          ? calibration.hamiltonianClosure.symplecticStructureProxyEma
          : null,
      hamiltonian_like:
        typeof calibration.hamiltonianClosure?.hamiltonianInvariants?.hamiltonianLike === "number"
          ? calibration.hamiltonianClosure.hamiltonianInvariants.hamiltonianLike
          : null,
      hamiltonian_energy_constancy:
        typeof calibration.hamiltonianClosure?.hamiltonianInvariants?.energyConstancy === "number"
          ? calibration.hamiltonianClosure.hamiltonianInvariants.energyConstancy
          : null,
      hamiltonian_casimir_proxy:
        typeof calibration.hamiltonianClosure?.hamiltonianInvariants?.casimirInvariantProxy === "number"
          ? calibration.hamiltonianClosure.hamiltonianInvariants.casimirInvariantProxy
          : null,
      reversible_epistemic_dynamics:
        typeof calibration.hamiltonianClosure?.reversibleEpistemicDynamicsApproximation === "number"
          ? calibration.hamiltonianClosure.reversibleEpistemicDynamicsApproximation
          : null,
      reversible_epistemic_dynamics_ema:
        typeof calibration.hamiltonianClosure?.reversibleEpistemicDynamicsEma === "number"
          ? calibration.hamiltonianClosure.reversibleEpistemicDynamicsEma
          : null,
      conserved_invariance_flux:
        typeof calibration.hamiltonianClosure?.conservedFlowFields?.invarianceFlux === "number"
          ? calibration.hamiltonianClosure.conservedFlowFields.invarianceFlux
          : null,
      conserved_symmetry_flux:
        typeof calibration.hamiltonianClosure?.conservedFlowFields?.symmetryFlux === "number"
          ? calibration.hamiltonianClosure.conservedFlowFields.symmetryFlux
          : null,
      hamiltonian_closure:
        calibration.hamiltonianClosure && typeof calibration.hamiltonianClosure === "object"
          ? calibration.hamiltonianClosure
          : null,
      noether_charge_proxy:
        typeof calibration.actionSymmetryDualityClosure?.noetherLikeProxyInvariants?.noetherChargeProxy === "number"
          ? calibration.actionSymmetryDualityClosure.noetherLikeProxyInvariants.noetherChargeProxy
          : null,
      noether_charge_proxy_ema:
        typeof calibration.actionSymmetryDualityClosure?.noetherChargeProxyEma === "number"
          ? calibration.actionSymmetryDualityClosure.noetherChargeProxyEma
          : null,
      noether_flux_proxy:
        typeof calibration.actionSymmetryDualityClosure?.noetherLikeProxyInvariants?.noetherFluxProxy === "number"
          ? calibration.actionSymmetryDualityClosure.noetherLikeProxyInvariants.noetherFluxProxy
          : null,
      broken_symmetry_index:
        typeof calibration.actionSymmetryDualityClosure?.noetherLikeProxyInvariants?.brokenSymmetryIndex === "number"
          ? calibration.actionSymmetryDualityClosure.noetherLikeProxyInvariants.brokenSymmetryIndex
          : null,
      duality_mean_alignment:
        typeof calibration.actionSymmetryDualityClosure?.actionSymmetryDualityGraph?.meanDualityAlignment === "number"
          ? calibration.actionSymmetryDualityClosure.actionSymmetryDualityGraph.meanDualityAlignment
          : null,
      primal_dual_spread:
        typeof calibration.actionSymmetryDualityClosure?.actionSymmetryDualityGraph?.primalDualSpread === "number"
          ? calibration.actionSymmetryDualityClosure.actionSymmetryDualityGraph.primalDualSpread
          : null,
      dual_field_pairing:
        typeof calibration.actionSymmetryDualityClosure?.stabilityConservationDualField?.pairingInnerProduct ===
        "number"
          ? calibration.actionSymmetryDualityClosure.stabilityConservationDualField.pairingInnerProduct
          : null,
      optimal_reversible_trajectory_selector:
        typeof calibration.actionSymmetryDualityClosure?.optimalReversibleTrajectorySelector === "number"
          ? calibration.actionSymmetryDualityClosure.optimalReversibleTrajectorySelector
          : null,
      optimal_reversible_trajectory_selector_ema:
        typeof calibration.actionSymmetryDualityClosure?.optimalReversibleTrajectorySelectorEma === "number"
          ? calibration.actionSymmetryDualityClosure.optimalReversibleTrajectorySelectorEma
          : null,
      action_symmetry_duality_closure:
        calibration.actionSymmetryDualityClosure && typeof calibration.actionSymmetryDualityClosure === "object"
          ? calibration.actionSymmetryDualityClosure
          : null,
      scale_invariance_stability:
        typeof calibration.renormalizationScaleInvariance?.scaleInvarianceStability === "number"
          ? calibration.renormalizationScaleInvariance.scaleInvarianceStability
          : null,
      scale_invariance_stability_ema:
        typeof calibration.renormalizationScaleInvariance?.scaleInvarianceStabilityEma === "number"
          ? calibration.renormalizationScaleInvariance.scaleInvarianceStabilityEma
          : null,
      renormalization_flow_proxy:
        typeof calibration.renormalizationScaleInvariance?.renormalizationFlowProxy === "number"
          ? calibration.renormalizationScaleInvariance.renormalizationFlowProxy
          : null,
      renormalization_flow_proxy_ema:
        typeof calibration.renormalizationScaleInvariance?.renormalizationFlowProxyEma === "number"
          ? calibration.renormalizationScaleInvariance.renormalizationFlowProxyEma
          : null,
      multi_resolution_consistency:
        typeof calibration.renormalizationScaleInvariance?.multiResolutionConsistency === "number"
          ? calibration.renormalizationScaleInvariance.multiResolutionConsistency
          : null,
      fractal_epistemic_stability:
        typeof calibration.renormalizationScaleInvariance?.fractalEpistemicStability === "number"
          ? calibration.renormalizationScaleInvariance.fractalEpistemicStability
          : null,
      epistemic_micro_macro_gap:
        typeof calibration.renormalizationScaleInvariance?.microMacroGap === "number"
          ? calibration.renormalizationScaleInvariance.microMacroGap
          : null,
      renormalization_scale_invariance:
        calibration.renormalizationScaleInvariance && typeof calibration.renormalizationScaleInvariance === "object"
          ? calibration.renormalizationScaleInvariance
          : null,
      observer_effect_proxy:
        typeof calibration.epistemicObservabilitySelfMeasurement?.observerEffectProxy === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.observerEffectProxy
          : null,
      observer_effect_proxy_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.observerEffectProxyEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.observerEffectProxyEma
          : null,
      measurement_backreaction_score:
        typeof calibration.epistemicObservabilitySelfMeasurement?.measurementBackreactionScore === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.measurementBackreactionScore
          : null,
      measurement_backreaction_score_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.measurementBackreactionScoreEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.measurementBackreactionScoreEma
          : null,
      epistemic_self_disturbance_index:
        typeof calibration.epistemicObservabilitySelfMeasurement?.epistemicSelfDisturbanceIndex === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.epistemicSelfDisturbanceIndex
          : null,
      epistemic_self_disturbance_index_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.epistemicSelfDisturbanceIndexEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.epistemicSelfDisturbanceIndexEma
          : null,
      closed_loop_observability_limit:
        typeof calibration.epistemicObservabilitySelfMeasurement?.closedLoopObservabilityLimit === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.closedLoopObservabilityLimit
          : null,
      closed_loop_observability_limit_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.closedLoopObservabilityLimitEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.closedLoopObservabilityLimitEma
          : null,
      observer_induced_drift_detector:
        typeof calibration.epistemicObservabilitySelfMeasurement?.observerInducedDriftDetector === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.observerInducedDriftDetector
          : null,
      observer_induced_drift_detector_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.observerInducedDriftDetectorEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.observerInducedDriftDetectorEma
          : null,
      closed_loop_measurement_stability_field:
        typeof calibration.epistemicObservabilitySelfMeasurement?.closedLoopMeasurementStabilityField === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.closedLoopMeasurementStabilityField
          : null,
      closed_loop_measurement_stability_field_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.closedLoopMeasurementStabilityFieldEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.closedLoopMeasurementStabilityFieldEma
          : null,
      epistemic_visibility_limit_estimator:
        typeof calibration.epistemicObservabilitySelfMeasurement?.epistemicVisibilityLimitEstimator === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.epistemicVisibilityLimitEstimator
          : null,
      epistemic_visibility_limit_estimator_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.epistemicVisibilityLimitEstimatorEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.epistemicVisibilityLimitEstimatorEma
          : null,
      epistemic_observability_self_measurement:
        calibration.epistemicObservabilitySelfMeasurement &&
        typeof calibration.epistemicObservabilitySelfMeasurement === "object"
          ? calibration.epistemicObservabilitySelfMeasurement
          : null,
      kolmogorov_like_complexity_proxy:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.kolmogorovLikeComplexityProxy === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.kolmogorovLikeComplexityProxy
          : null,
      kolmogorov_like_complexity_proxy_ema:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.kolmogorovLikeComplexityProxyEma === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.kolmogorovLikeComplexityProxyEma
          : null,
      irreducible_state_core:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.irreducibleStateCore === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.irreducibleStateCore
          : null,
      irreducible_state_core_ema:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.irreducibleStateCoreEma === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.irreducibleStateCoreEma
          : null,
      minimal_sufficient_epistemic_description:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.minimalSufficientEpistemicDescription ===
        "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.minimalSufficientEpistemicDescription
          : null,
      minimal_sufficient_epistemic_description_ema:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.minimalSufficientEpistemicDescriptionEma ===
        "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.minimalSufficientEpistemicDescriptionEma
          : null,
      redundancy_collapse_detection:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.redundancyCollapseDetection === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.redundancyCollapseDetection
          : null,
      redundancy_collapse_detection_ema:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.redundancyCollapseDetectionEma === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.redundancyCollapseDetectionEma
          : null,
      epistemic_irreducibility_minimal_description:
        calibration.epistemicIrreducibilityMinimalDescription &&
        typeof calibration.epistemicIrreducibilityMinimalDescription === "object"
          ? calibration.epistemicIrreducibilityMinimalDescription
          : null,
      recovery_action: String(calibration.recoveryAction || "none"),
      recovery_count: Number(calibration.recoveryCount) || 0,
      self_tuning: calibration.selfTuning || { ...DEFAULT_SELF_TUNE },
      anomaly: calibration.anomaly || { active: false, reasons: [], at: 0 },
      samples: Number(calibration.samples) || 0,
      alpha: EMA_ALPHA,
      updatedAt: Date.now()
    },
    { merge: true }
  );
  const controlRef = calRef.collection("control_loop_metrics").doc(String(Date.now()));
  batch.set(
    controlRef,
    {
      uid: sid,
      ts: Date.now(),
      control_loop_entropy:
        typeof calibration.controlLoopEntropyEma === "number"
          ? Math.round(calibration.controlLoopEntropyEma * 1000) / 1000
          : null,
      adaptation_efficiency:
        typeof calibration.adaptationEfficiencyEma === "number"
          ? Math.round(calibration.adaptationEfficiencyEma * 1000) / 1000
          : null,
      recovery_frequency:
        typeof calibration.recoveryFrequencyEma === "number"
          ? Math.round(calibration.recoveryFrequencyEma * 1000) / 1000
          : null,
      long_horizon_degradation_risk:
        typeof calibration.longHorizonDegradationRiskEma === "number"
          ? Math.round(calibration.longHorizonDegradationRiskEma * 1000) / 1000
          : null,
      forecast_stability_index:
        typeof calibration.forecastStabilityIndex === "number"
          ? Math.round(calibration.forecastStabilityIndex * 1000) / 1000
          : null,
      epistemic_health_score:
        typeof calibration.epistemicHealthScore === "number"
          ? Math.round(calibration.epistemicHealthScore * 1000) / 1000
          : null,
      epistemic_fatigue:
        typeof calibration.epistemicFatigue === "number"
          ? Math.round(calibration.epistemicFatigue * 1000) / 1000
          : null,
      control_loop_entropy_next:
        typeof calibration.controlLoopForecast?.controlLoopEntropyNext === "number"
          ? calibration.controlLoopForecast.controlLoopEntropyNext
          : null,
      control_fatigue_prediction:
        typeof calibration.controlLoopForecast?.controlFatiguePrediction === "number"
          ? calibration.controlLoopForecast.controlFatiguePrediction
          : null,
      recovery_oscillation_likelihood:
        typeof calibration.controlLoopForecast?.recoveryOscillationLikelihood === "number"
          ? calibration.controlLoopForecast.recoveryOscillationLikelihood
          : null,
      adaptation_collapse_forecast:
        typeof calibration.controlLoopForecast?.adaptationCollapseForecast === "number"
          ? calibration.controlLoopForecast.adaptationCollapseForecast
          : null,
      epistemic_system_longevity:
        typeof calibration.controlLoopForecast?.epistemicSystemLongevity === "number"
          ? calibration.controlLoopForecast.epistemicSystemLongevity
          : null,
      fixed_point_stability_score:
        typeof calibration.fixedPoint?.fixedPointStabilityScore === "number"
          ? calibration.fixedPoint.fixedPointStabilityScore
          : null,
      long_term_epistemic_equilibrium_index:
        typeof calibration.fixedPoint?.longTermEpistemicEquilibriumIndex === "number"
          ? calibration.fixedPoint.longTermEpistemicEquilibriumIndex
          : null,
      attractor_type:
        calibration.fixedPoint?.attractorType != null ? String(calibration.fixedPoint.attractorType) : "stable_eq",
      attractor_basin_likelihood:
        calibration.fixedPoint?.attractorBasinLikelihood && typeof calibration.fixedPoint.attractorBasinLikelihood === "object"
          ? calibration.fixedPoint.attractorBasinLikelihood
          : null,
      oscillation_damping_prediction:
        typeof calibration.fixedPoint?.oscillationDampingPrediction === "number"
          ? calibration.fixedPoint.oscillationDampingPrediction
          : null,
      control_loop_phase_transition_likelihood:
        typeof calibration.fixedPoint?.controlLoopPhaseTransitionLikelihood === "number"
          ? calibration.fixedPoint.controlLoopPhaseTransitionLikelihood
          : null,
      phase_split_detected: !!calibration.bifurcation?.phaseSplitDetected,
      regime_branching_prediction:
        typeof calibration.bifurcation?.regimeBranchingPrediction === "number"
          ? calibration.bifurcation.regimeBranchingPrediction
          : null,
      instability_origin_trace:
        calibration.bifurcation?.instabilityOriginTrace != null
          ? String(calibration.bifurcation.instabilityOriginTrace)
          : "none",
      attractor_basin_migration:
        calibration.bifurcation?.attractorBasinMigration && typeof calibration.bifurcation.attractorBasinMigration === "object"
          ? calibration.bifurcation.attractorBasinMigration
          : null,
      basin_erosion_ema:
        typeof calibration.longAttractor?.basinErosionEma === "number"
          ? calibration.longAttractor.basinErosionEma
          : null,
      attractor_weakening_score:
        typeof calibration.longAttractor?.attractorWeakeningScore === "number"
          ? calibration.longAttractor.attractorWeakeningScore
          : null,
      phase_memory_decay_ema:
        typeof calibration.longAttractor?.phaseMemoryDecayEma === "number"
          ? calibration.longAttractor.phaseMemoryDecayEma
          : null,
      attractor_collapse_risk_long:
        typeof calibration.longAttractor?.attractorCollapseRiskLong === "number"
          ? calibration.longAttractor.attractorCollapseRiskLong
          : null,
      epistemic_landscape_evolution:
        calibration.longAttractor?.epistemicLandscapeEvolution && typeof calibration.longAttractor.epistemicLandscapeEvolution === "object"
          ? calibration.longAttractor.epistemicLandscapeEvolution
          : null,
      micro_to_macro_influence:
        typeof calibration.crossScale?.microToMacroInfluence === "number"
          ? calibration.crossScale.microToMacroInfluence
          : null,
      macro_to_micro_constraint:
        typeof calibration.crossScale?.macroToMicroConstraint === "number"
          ? calibration.crossScale.macroToMicroConstraint
          : null,
      cross_scale_instability:
        typeof calibration.crossScale?.crossScaleInstability === "number"
          ? calibration.crossScale.crossScaleInstability
          : null,
      hierarchical_collapse_risk:
        typeof calibration.crossScale?.hierarchicalCollapseRisk === "number"
          ? calibration.crossScale.hierarchicalCollapseRisk
          : null,
      entropy_conservation_residual:
        typeof calibration.conservation?.entropyConservationResidual === "number"
          ? calibration.conservation.entropyConservationResidual
          : null,
      stability_flux_residual:
        typeof calibration.conservation?.stabilityFluxResidual === "number"
          ? calibration.conservation.stabilityFluxResidual
          : null,
      drift_energy_residual:
        typeof calibration.conservation?.driftEnergyResidual === "number"
          ? calibration.conservation.driftEnergyResidual
          : null,
      cross_scale_invariant_residual:
        typeof calibration.conservation?.crossScaleInvariantResidual === "number"
          ? calibration.conservation.crossScaleInvariantResidual
          : null,
      equilibrium_constraint_violation:
        typeof calibration.conservation?.equilibriumConstraintViolation === "number"
          ? calibration.conservation.equilibriumConstraintViolation
          : null,
      self_consistency_violation:
        typeof calibration.selfConsistency?.violationObjective === "number"
          ? calibration.selfConsistency.violationObjective
          : null,
      self_consistency_residual_norm:
        typeof calibration.selfConsistency?.residualNorm === "number"
          ? calibration.selfConsistency.residualNorm
          : null,
      restoration_trajectory_score:
        typeof calibration.selfConsistency?.restorationTrajectoryScore === "number"
          ? calibration.selfConsistency.restorationTrajectoryScore
          : null,
      solver_relaxation_velocity_ema:
        typeof calibration.selfConsistency?.relaxationVelocityEma === "number"
          ? calibration.selfConsistency.relaxationVelocityEma
          : null,
      constraint_relaxation_rate:
        typeof calibration.selfConsistency?.constraintRelaxationRate === "number"
          ? calibration.selfConsistency.constraintRelaxationRate
          : null,
      self_consistency_snapshot:
        calibration.selfConsistency && typeof calibration.selfConsistency === "object"
          ? calibration.selfConsistency
          : null,
      convergence_guarantee_score:
        typeof calibration.fixedPointConvergenceTheorem?.convergenceGuaranteeScore === "number"
          ? calibration.fixedPointConvergenceTheorem.convergenceGuaranteeScore
          : null,
      convergence_guarantee_ema:
        typeof calibration.fixedPointConvergenceTheorem?.convergenceGuaranteeEma === "number"
          ? calibration.fixedPointConvergenceTheorem.convergenceGuaranteeEma
          : null,
      oscillation_impossibility_margin:
        typeof calibration.fixedPointConvergenceTheorem?.oscillationImpossibilityBounds?.impossibilityMargin ===
        "number"
          ? calibration.fixedPointConvergenceTheorem.oscillationImpossibilityBounds.impossibilityMargin
          : null,
      attractor_uniqueness_score:
        typeof calibration.fixedPointConvergenceTheorem?.attractorUniquenessValidation?.uniquenessScore === "number"
          ? calibration.fixedPointConvergenceTheorem.attractorUniquenessValidation.uniquenessScore
          : null,
      attractor_uniqueness_validated:
        !!calibration.fixedPointConvergenceTheorem?.attractorUniquenessValidation?.validated,
      stability_proof_likelihood:
        typeof calibration.fixedPointConvergenceTheorem?.longTermStabilityProofApproximation?.proofLikelihood ===
        "number"
          ? calibration.fixedPointConvergenceTheorem.longTermStabilityProofApproximation.proofLikelihood
          : null,
      fixed_point_convergence_theorem_snapshot:
        calibration.fixedPointConvergenceTheorem && typeof calibration.fixedPointConvergenceTheorem === "object"
          ? calibration.fixedPointConvergenceTheorem
          : null,
      stability_certification_coherence_score:
        typeof calibration.metaConsistencyValidator?.stabilityCertificationCoherenceScore === "number"
          ? calibration.metaConsistencyValidator.stabilityCertificationCoherenceScore
          : null,
      stability_certification_coherence_ema:
        typeof calibration.metaConsistencyValidator?.stabilityCertificationCoherenceEma === "number"
          ? calibration.metaConsistencyValidator.stabilityCertificationCoherenceEma
          : null,
      multi_layer_epistemic_agreement_index:
        typeof calibration.metaConsistencyValidator?.multiLayerEpistemicAgreementIndex === "number"
          ? calibration.metaConsistencyValidator.multiLayerEpistemicAgreementIndex
          : null,
      multi_layer_epistemic_agreement_ema:
        typeof calibration.metaConsistencyValidator?.multiLayerEpistemicAgreementEma === "number"
          ? calibration.metaConsistencyValidator.multiLayerEpistemicAgreementEma
          : null,
      meta_contradiction_count:
        typeof calibration.metaConsistencyValidator?.contradictionCount === "number"
          ? calibration.metaConsistencyValidator.contradictionCount
          : null,
      meta_max_pairwise_tension:
        typeof calibration.metaConsistencyValidator?.maxPairwiseTension === "number"
          ? calibration.metaConsistencyValidator.maxPairwiseTension
          : null,
      meta_consistency_validator_snapshot:
        calibration.metaConsistencyValidator && typeof calibration.metaConsistencyValidator === "object"
          ? calibration.metaConsistencyValidator
          : null,
      recursive_coherence_depth:
        typeof calibration.selfReferenceClosure?.recursiveCoherenceDepth === "number"
          ? calibration.selfReferenceClosure.recursiveCoherenceDepth
          : null,
      recursive_coherence_depth_ema:
        typeof calibration.selfReferenceClosure?.recursiveCoherenceDepthEma === "number"
          ? calibration.selfReferenceClosure.recursiveCoherenceDepthEma
          : null,
      self_reference_loop_stability:
        typeof calibration.selfReferenceClosure?.selfReferenceLoopStability === "number"
          ? calibration.selfReferenceClosure.selfReferenceLoopStability
          : null,
      self_reference_loop_stability_ema:
        typeof calibration.selfReferenceClosure?.selfReferenceLoopStabilityEma === "number"
          ? calibration.selfReferenceClosure.selfReferenceLoopStabilityEma
          : null,
      infinite_regress_damping:
        typeof calibration.selfReferenceClosure?.infiniteRegressDamping === "number"
          ? calibration.selfReferenceClosure.infiniteRegressDamping
          : null,
      infinite_regress_damping_ema:
        typeof calibration.selfReferenceClosure?.infiniteRegressDampingEma === "number"
          ? calibration.selfReferenceClosure.infiniteRegressDampingEma
          : null,
      epistemic_fixed_point_closure_score:
        typeof calibration.selfReferenceClosure?.epistemicFixedPointClosureScore === "number"
          ? calibration.selfReferenceClosure.epistemicFixedPointClosureScore
          : null,
      epistemic_fixed_point_closure_score_ema:
        typeof calibration.selfReferenceClosure?.epistemicFixedPointClosureScoreEma === "number"
          ? calibration.selfReferenceClosure.epistemicFixedPointClosureScoreEma
          : null,
      self_reference_composite_index:
        typeof calibration.selfReferenceClosure?.selfReferenceCompositeIndex === "number"
          ? calibration.selfReferenceClosure.selfReferenceCompositeIndex
          : null,
      self_reference_closure_snapshot:
        calibration.selfReferenceClosure && typeof calibration.selfReferenceClosure === "object"
          ? calibration.selfReferenceClosure
          : null,
      invariant_composite:
        typeof calibration.globalInvarianceManifold?.invariantComposite === "number"
          ? calibration.globalInvarianceManifold.invariantComposite
          : null,
      invariant_composite_ema:
        typeof calibration.globalInvarianceManifold?.invariantCompositeEma === "number"
          ? calibration.globalInvarianceManifold.invariantCompositeEma
          : null,
      global_stability_symmetry:
        typeof calibration.globalInvarianceManifold?.globalStabilitySymmetry === "number"
          ? calibration.globalInvarianceManifold.globalStabilitySymmetry
          : null,
      global_stability_symmetry_ema:
        typeof calibration.globalInvarianceManifold?.globalStabilitySymmetryEma === "number"
          ? calibration.globalInvarianceManifold.globalStabilitySymmetryEma
          : null,
      cross_layer_conservation_unification:
        typeof calibration.globalInvarianceManifold?.crossLayerConservationUnification === "number"
          ? calibration.globalInvarianceManifold.crossLayerConservationUnification
          : null,
      cross_layer_conservation_unification_ema:
        typeof calibration.globalInvarianceManifold?.crossLayerConservationUnificationEma === "number"
          ? calibration.globalInvarianceManifold.crossLayerConservationUnificationEma
          : null,
      epistemic_phase_angle01:
        typeof calibration.globalInvarianceManifold?.epistemicPhaseManifold?.angle01 === "number"
          ? calibration.globalInvarianceManifold.epistemicPhaseManifold.angle01
          : null,
      epistemic_phase_radius:
        typeof calibration.globalInvarianceManifold?.epistemicPhaseManifold?.radius === "number"
          ? calibration.globalInvarianceManifold.epistemicPhaseManifold.radius
          : null,
      epistemic_phase_elevation:
        typeof calibration.globalInvarianceManifold?.epistemicPhaseManifold?.elevation === "number"
          ? calibration.globalInvarianceManifold.epistemicPhaseManifold.elevation
          : null,
      global_invariance_manifold_snapshot:
        calibration.globalInvarianceManifold && typeof calibration.globalInvarianceManifold === "object"
          ? calibration.globalInvarianceManifold
          : null,
      geodesic_tangent_alignment:
        typeof calibration.curvatureGeodesicFlow?.stabilityGeodesics?.tangentAlignmentScore === "number"
          ? calibration.curvatureGeodesicFlow.stabilityGeodesics.tangentAlignmentScore
          : null,
      geodesic_path_energy:
        typeof calibration.curvatureGeodesicFlow?.stabilityGeodesics?.pathEnergyProxy === "number"
          ? calibration.curvatureGeodesicFlow.stabilityGeodesics.pathEnergyProxy
          : null,
      geodesic_path_energy_ema:
        typeof calibration.curvatureGeodesicFlow?.pathEnergyProxyEma === "number"
          ? calibration.curvatureGeodesicFlow.pathEnergyProxyEma
          : null,
      geodesic_discrete_arc_length:
        typeof calibration.curvatureGeodesicFlow?.stabilityGeodesics?.discreteArcLength === "number"
          ? calibration.curvatureGeodesicFlow.stabilityGeodesics.discreteArcLength
          : null,
      attractor_metric_distance:
        typeof calibration.curvatureGeodesicFlow?.attractorShortestPaths?.metricDistance === "number"
          ? calibration.curvatureGeodesicFlow.attractorShortestPaths.metricDistance
          : null,
      geodesic_efficiency:
        typeof calibration.curvatureGeodesicFlow?.attractorShortestPaths?.geodesicEfficiency === "number"
          ? calibration.curvatureGeodesicFlow.attractorShortestPaths.geodesicEfficiency
          : null,
      geodesic_efficiency_ema:
        typeof calibration.curvatureGeodesicFlow?.geodesicEfficiencyEma === "number"
          ? calibration.curvatureGeodesicFlow.geodesicEfficiencyEma
          : null,
      sectional_curvature_proxy:
        typeof calibration.curvatureGeodesicFlow?.epistemicCurvatureTensors?.sectionalCurvatureProxy === "number"
          ? calibration.curvatureGeodesicFlow.epistemicCurvatureTensors.sectionalCurvatureProxy
          : null,
      ricci_scalar_proxy:
        typeof calibration.curvatureGeodesicFlow?.epistemicCurvatureTensors?.ricciScalarProxy === "number"
          ? calibration.curvatureGeodesicFlow.epistemicCurvatureTensors.ricciScalarProxy
          : null,
      collapse_avoidance_pressure:
        typeof calibration.curvatureGeodesicFlow?.collapseAvoidingTrajectories?.collapsePressure === "number"
          ? calibration.curvatureGeodesicFlow.collapseAvoidingTrajectories.collapsePressure
          : null,
      curvature_geodesic_flow_snapshot:
        calibration.curvatureGeodesicFlow && typeof calibration.curvatureGeodesicFlow === "object"
          ? calibration.curvatureGeodesicFlow
          : null,
      action_functional_proxy:
        typeof calibration.variationalPrinciple?.actionFunctionalProxy === "number"
          ? calibration.variationalPrinciple.actionFunctionalProxy
          : null,
      action_functional_proxy_ema:
        typeof calibration.variationalPrinciple?.actionFunctionalProxyEma === "number"
          ? calibration.variationalPrinciple.actionFunctionalProxyEma
          : null,
      global_path_optimality:
        typeof calibration.variationalPrinciple?.globalPathOptimality === "number"
          ? calibration.variationalPrinciple.globalPathOptimality
          : null,
      global_path_optimality_ema:
        typeof calibration.variationalPrinciple?.globalPathOptimalityEma === "number"
          ? calibration.variationalPrinciple.globalPathOptimalityEma
          : null,
      stability_variational_minimization:
        typeof calibration.variationalPrinciple?.stabilityVariationalMinimization === "number"
          ? calibration.variationalPrinciple.stabilityVariationalMinimization
          : null,
      stability_variational_minimization_ema:
        typeof calibration.variationalPrinciple?.stabilityVariationalMinimizationEma === "number"
          ? calibration.variationalPrinciple.stabilityVariationalMinimizationEma
          : null,
      epistemic_potential_energy:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.potentialEnergy === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.potentialEnergy
          : null,
      epistemic_kinetic_energy:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.kineticEnergy === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.kineticEnergy
          : null,
      epistemic_lagrangian:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.lagrangian === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.lagrangian
          : null,
      epistemic_energy_barrier:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.barrierHeight === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.barrierHeight
          : null,
      epistemic_energy_gradient_proxy:
        typeof calibration.variationalPrinciple?.epistemicEnergyLandscape?.gradientMagnitudeProxy === "number"
          ? calibration.variationalPrinciple.epistemicEnergyLandscape.gradientMagnitudeProxy
          : null,
      variational_principle_snapshot:
        calibration.variationalPrinciple && typeof calibration.variationalPrinciple === "object"
          ? calibration.variationalPrinciple
          : null,
      symplectic_structure_proxy:
        typeof calibration.hamiltonianClosure?.symplecticStructureProxy === "number"
          ? calibration.hamiltonianClosure.symplecticStructureProxy
          : null,
      symplectic_structure_proxy_ema:
        typeof calibration.hamiltonianClosure?.symplecticStructureProxyEma === "number"
          ? calibration.hamiltonianClosure.symplecticStructureProxyEma
          : null,
      hamiltonian_like:
        typeof calibration.hamiltonianClosure?.hamiltonianInvariants?.hamiltonianLike === "number"
          ? calibration.hamiltonianClosure.hamiltonianInvariants.hamiltonianLike
          : null,
      hamiltonian_energy_constancy:
        typeof calibration.hamiltonianClosure?.hamiltonianInvariants?.energyConstancy === "number"
          ? calibration.hamiltonianClosure.hamiltonianInvariants.energyConstancy
          : null,
      hamiltonian_casimir_proxy:
        typeof calibration.hamiltonianClosure?.hamiltonianInvariants?.casimirInvariantProxy === "number"
          ? calibration.hamiltonianClosure.hamiltonianInvariants.casimirInvariantProxy
          : null,
      reversible_epistemic_dynamics:
        typeof calibration.hamiltonianClosure?.reversibleEpistemicDynamicsApproximation === "number"
          ? calibration.hamiltonianClosure.reversibleEpistemicDynamicsApproximation
          : null,
      reversible_epistemic_dynamics_ema:
        typeof calibration.hamiltonianClosure?.reversibleEpistemicDynamicsEma === "number"
          ? calibration.hamiltonianClosure.reversibleEpistemicDynamicsEma
          : null,
      conserved_invariance_flux:
        typeof calibration.hamiltonianClosure?.conservedFlowFields?.invarianceFlux === "number"
          ? calibration.hamiltonianClosure.conservedFlowFields.invarianceFlux
          : null,
      conserved_symmetry_flux:
        typeof calibration.hamiltonianClosure?.conservedFlowFields?.symmetryFlux === "number"
          ? calibration.hamiltonianClosure.conservedFlowFields.symmetryFlux
          : null,
      hamiltonian_closure_snapshot:
        calibration.hamiltonianClosure && typeof calibration.hamiltonianClosure === "object"
          ? calibration.hamiltonianClosure
          : null,
      noether_charge_proxy:
        typeof calibration.actionSymmetryDualityClosure?.noetherLikeProxyInvariants?.noetherChargeProxy === "number"
          ? calibration.actionSymmetryDualityClosure.noetherLikeProxyInvariants.noetherChargeProxy
          : null,
      noether_charge_proxy_ema:
        typeof calibration.actionSymmetryDualityClosure?.noetherChargeProxyEma === "number"
          ? calibration.actionSymmetryDualityClosure.noetherChargeProxyEma
          : null,
      noether_flux_proxy:
        typeof calibration.actionSymmetryDualityClosure?.noetherLikeProxyInvariants?.noetherFluxProxy === "number"
          ? calibration.actionSymmetryDualityClosure.noetherLikeProxyInvariants.noetherFluxProxy
          : null,
      broken_symmetry_index:
        typeof calibration.actionSymmetryDualityClosure?.noetherLikeProxyInvariants?.brokenSymmetryIndex === "number"
          ? calibration.actionSymmetryDualityClosure.noetherLikeProxyInvariants.brokenSymmetryIndex
          : null,
      duality_mean_alignment:
        typeof calibration.actionSymmetryDualityClosure?.actionSymmetryDualityGraph?.meanDualityAlignment === "number"
          ? calibration.actionSymmetryDualityClosure.actionSymmetryDualityGraph.meanDualityAlignment
          : null,
      primal_dual_spread:
        typeof calibration.actionSymmetryDualityClosure?.actionSymmetryDualityGraph?.primalDualSpread === "number"
          ? calibration.actionSymmetryDualityClosure.actionSymmetryDualityGraph.primalDualSpread
          : null,
      dual_field_pairing:
        typeof calibration.actionSymmetryDualityClosure?.stabilityConservationDualField?.pairingInnerProduct ===
        "number"
          ? calibration.actionSymmetryDualityClosure.stabilityConservationDualField.pairingInnerProduct
          : null,
      optimal_reversible_trajectory_selector:
        typeof calibration.actionSymmetryDualityClosure?.optimalReversibleTrajectorySelector === "number"
          ? calibration.actionSymmetryDualityClosure.optimalReversibleTrajectorySelector
          : null,
      optimal_reversible_trajectory_selector_ema:
        typeof calibration.actionSymmetryDualityClosure?.optimalReversibleTrajectorySelectorEma === "number"
          ? calibration.actionSymmetryDualityClosure.optimalReversibleTrajectorySelectorEma
          : null,
      action_symmetry_duality_closure_snapshot:
        calibration.actionSymmetryDualityClosure && typeof calibration.actionSymmetryDualityClosure === "object"
          ? calibration.actionSymmetryDualityClosure
          : null,
      scale_invariance_stability:
        typeof calibration.renormalizationScaleInvariance?.scaleInvarianceStability === "number"
          ? calibration.renormalizationScaleInvariance.scaleInvarianceStability
          : null,
      scale_invariance_stability_ema:
        typeof calibration.renormalizationScaleInvariance?.scaleInvarianceStabilityEma === "number"
          ? calibration.renormalizationScaleInvariance.scaleInvarianceStabilityEma
          : null,
      renormalization_flow_proxy:
        typeof calibration.renormalizationScaleInvariance?.renormalizationFlowProxy === "number"
          ? calibration.renormalizationScaleInvariance.renormalizationFlowProxy
          : null,
      renormalization_flow_proxy_ema:
        typeof calibration.renormalizationScaleInvariance?.renormalizationFlowProxyEma === "number"
          ? calibration.renormalizationScaleInvariance.renormalizationFlowProxyEma
          : null,
      multi_resolution_consistency:
        typeof calibration.renormalizationScaleInvariance?.multiResolutionConsistency === "number"
          ? calibration.renormalizationScaleInvariance.multiResolutionConsistency
          : null,
      fractal_epistemic_stability:
        typeof calibration.renormalizationScaleInvariance?.fractalEpistemicStability === "number"
          ? calibration.renormalizationScaleInvariance.fractalEpistemicStability
          : null,
      epistemic_micro_macro_gap:
        typeof calibration.renormalizationScaleInvariance?.microMacroGap === "number"
          ? calibration.renormalizationScaleInvariance.microMacroGap
          : null,
      renormalization_scale_invariance_snapshot:
        calibration.renormalizationScaleInvariance && typeof calibration.renormalizationScaleInvariance === "object"
          ? calibration.renormalizationScaleInvariance
          : null,
      observer_effect_proxy:
        typeof calibration.epistemicObservabilitySelfMeasurement?.observerEffectProxy === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.observerEffectProxy
          : null,
      observer_effect_proxy_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.observerEffectProxyEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.observerEffectProxyEma
          : null,
      measurement_backreaction_score:
        typeof calibration.epistemicObservabilitySelfMeasurement?.measurementBackreactionScore === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.measurementBackreactionScore
          : null,
      measurement_backreaction_score_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.measurementBackreactionScoreEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.measurementBackreactionScoreEma
          : null,
      epistemic_self_disturbance_index:
        typeof calibration.epistemicObservabilitySelfMeasurement?.epistemicSelfDisturbanceIndex === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.epistemicSelfDisturbanceIndex
          : null,
      epistemic_self_disturbance_index_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.epistemicSelfDisturbanceIndexEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.epistemicSelfDisturbanceIndexEma
          : null,
      closed_loop_observability_limit:
        typeof calibration.epistemicObservabilitySelfMeasurement?.closedLoopObservabilityLimit === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.closedLoopObservabilityLimit
          : null,
      closed_loop_observability_limit_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.closedLoopObservabilityLimitEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.closedLoopObservabilityLimitEma
          : null,
      observer_induced_drift_detector:
        typeof calibration.epistemicObservabilitySelfMeasurement?.observerInducedDriftDetector === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.observerInducedDriftDetector
          : null,
      observer_induced_drift_detector_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.observerInducedDriftDetectorEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.observerInducedDriftDetectorEma
          : null,
      closed_loop_measurement_stability_field:
        typeof calibration.epistemicObservabilitySelfMeasurement?.closedLoopMeasurementStabilityField === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.closedLoopMeasurementStabilityField
          : null,
      closed_loop_measurement_stability_field_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.closedLoopMeasurementStabilityFieldEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.closedLoopMeasurementStabilityFieldEma
          : null,
      epistemic_visibility_limit_estimator:
        typeof calibration.epistemicObservabilitySelfMeasurement?.epistemicVisibilityLimitEstimator === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.epistemicVisibilityLimitEstimator
          : null,
      epistemic_visibility_limit_estimator_ema:
        typeof calibration.epistemicObservabilitySelfMeasurement?.epistemicVisibilityLimitEstimatorEma === "number"
          ? calibration.epistemicObservabilitySelfMeasurement.epistemicVisibilityLimitEstimatorEma
          : null,
      epistemic_observability_self_measurement_snapshot:
        calibration.epistemicObservabilitySelfMeasurement &&
        typeof calibration.epistemicObservabilitySelfMeasurement === "object"
          ? calibration.epistemicObservabilitySelfMeasurement
          : null,
      kolmogorov_like_complexity_proxy:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.kolmogorovLikeComplexityProxy === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.kolmogorovLikeComplexityProxy
          : null,
      kolmogorov_like_complexity_proxy_ema:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.kolmogorovLikeComplexityProxyEma === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.kolmogorovLikeComplexityProxyEma
          : null,
      irreducible_state_core:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.irreducibleStateCore === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.irreducibleStateCore
          : null,
      irreducible_state_core_ema:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.irreducibleStateCoreEma === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.irreducibleStateCoreEma
          : null,
      minimal_sufficient_epistemic_description:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.minimalSufficientEpistemicDescription ===
        "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.minimalSufficientEpistemicDescription
          : null,
      minimal_sufficient_epistemic_description_ema:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.minimalSufficientEpistemicDescriptionEma ===
        "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.minimalSufficientEpistemicDescriptionEma
          : null,
      redundancy_collapse_detection:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.redundancyCollapseDetection === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.redundancyCollapseDetection
          : null,
      redundancy_collapse_detection_ema:
        typeof calibration.epistemicIrreducibilityMinimalDescription?.redundancyCollapseDetectionEma === "number"
          ? calibration.epistemicIrreducibilityMinimalDescription.redundancyCollapseDetectionEma
          : null,
      epistemic_irreducibility_minimal_description_snapshot:
        calibration.epistemicIrreducibilityMinimalDescription &&
        typeof calibration.epistemicIrreducibilityMinimalDescription === "object"
          ? calibration.epistemicIrreducibilityMinimalDescription
          : null,
      recovery_action: String(calibration.recoveryAction || "none"),
      anomaly: calibration.anomaly || { active: false, reasons: [], at: 0 },
      self_tuning: calibration.selfTuning || { ...DEFAULT_SELF_TUNE }
    },
    { merge: true }
  );
  if (persisted > 0) await batch.commit();
  return { ok: true, persisted, mode: "firebase" };
}

