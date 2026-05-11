/**
 * RHIZOH CONSTITUTIONAL STACK v2.2.0 (W) — Gödel sınırı / incompleteness-aware runtime katmanı.
 * Öz-dönüşlü genişleme, karar salınımı ve tutarsızlık basıncı; matematiksel Gödel kanıtı değil operasyonel ölçüm.
 */

export const RHIZOH_CONSTITUTIONAL_GODEL_BOUNDARY_VERSION = "2.2.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {ReadonlyArray<boolean | number | undefined | null>} series allowExecution veya 0/1
 */
export function oscillationRhizohDecisionBoundary(series) {
  const bits = (series || []).map((x) => {
    if (typeof x === "boolean") return x ? 1 : 0;
    if (typeof x === "number") return x >= 0.5 ? 1 : 0;
    return 0;
  });
  if (bits.length < 2) {
    return { flipRate: 0, paradoxLikelihood: 0, decisionInstabilityIndex: 0 };
  }
  let flips = 0;
  for (let i = 1; i < bits.length; i++) {
    if (bits[i] !== bits[i - 1]) flips += 1;
  }
  const flipRate = flips / (bits.length - 1);
  const paradoxLikelihood = clamp01(flipRate * 1.35);
  return {
    flipRate: Math.round(flipRate * 1000) / 1000,
    paradoxLikelihood,
    decisionInstabilityIndex: Math.round(paradoxLikelihood * 1000) / 1000
  };
}

/**
 * @param {{
 *   allowExecutionSeries?: ReadonlyArray<boolean | number>,
 *   bootstrapConverged?: boolean | null,
 *   bootstrapRoundsUsed?: number | null,
 *   collapseRisk?: number | null,
 *   bifurcationAmplification?: number | null,
 *   irNestDepth?: number | null,
 *   queueTruncated?: boolean | null,
 *   omegaGlobalTruth?: number | null,
 *   selfAuthorPatchRejectedRatio?: number | null
 * }} metrics
 */
export function analyzeRhizohConstitutionalGodelBoundary(metrics = {}) {
  const osc = oscillationRhizohDecisionBoundary(metrics.allowExecutionSeries || []);

  const bootstrapStress =
    metrics.bootstrapConverged === false
      ? 0.42
      : metrics.bootstrapRoundsUsed != null && metrics.bootstrapRoundsUsed >= 12
        ? 0.22
        : 0;

  const truncatedStress = metrics.queueTruncated ? 0.28 : 0;
  const nestStress = clamp01((metrics.irNestDepth ?? 0) / 14) * 0.18;

  const structural =
    0.26 * clamp01(metrics.collapseRisk ?? 0) +
    0.2 * clamp01((metrics.bifurcationAmplification ?? 0) / 24) +
    0.14 * osc.paradoxLikelihood +
    bootstrapStress * 0.22 +
    truncatedStress +
    nestStress +
    0.12 * clamp01(metrics.selfAuthorPatchRejectedRatio ?? 0) +
    0.08 * (1 - clamp01(metrics.omegaGlobalTruth ?? 0.75));

  const incompletenessPressure = clamp01(structural);
  const undecidableBand = incompletenessPressure > 0.48 && osc.flipRate > 0.28;

  const bootstrapCutoffRisk = clamp01(
    (metrics.bootstrapConverged === false ? 0.52 : 0) +
      (metrics.queueTruncated ? 0.34 : 0) +
      clamp01(((metrics.bootstrapRoundsUsed ?? 0) / 22) * (metrics.bootstrapConverged === false ? 0.38 : 0.12)) +
      clamp01((metrics.irNestDepth ?? 0) / 14) * 0.22
  );

  /** @type {string[]} */
  const collapseSignals = [];
  if (osc.flipRate > 0.33) collapseSignals.push("execution_truth_oscillation");
  if (metrics.bootstrapConverged === false) collapseSignals.push("non_terminating_self_extension");
  if (metrics.queueTruncated) collapseSignals.push("instruction_queue_truncation");
  if ((metrics.irNestDepth ?? 0) >= 4) collapseSignals.push("deep_self_nested_ir");
  if ((metrics.collapseRisk ?? 0) > 0.55) collapseSignals.push("constitutional_phase_collapse_pressure");
  if (bootstrapCutoffRisk > 0.62) collapseSignals.push("bootstrap_execution_cutoff_risk");

  return {
    boundaryVersion: RHIZOH_CONSTITUTIONAL_GODEL_BOUNDARY_VERSION,
    incompletenessPressure: Math.round(incompletenessPressure * 1000) / 1000,
    undecidableBand,
    bootstrapCutoffRisk: Math.round(bootstrapCutoffRisk * 1000) / 1000,
    collapseSignals: [...collapseSignals],
    signals: [...collapseSignals],
    decisionOscillation: osc,
    narrative:
      incompletenessPressure > 0.55
        ? "Sistem kendi ifadesinde karar / uzama sınırına yakın (operasyonel uyarı)."
        : "Gödel bölgesine mesafe pozitif; yine de öz-dönüş ve salınım izlenmeli."
  };
}

/**
 * Kernel veya özet sayılardan tek çağrılık sınır özeti (global undecidability göstergesi).
 */
export function summarizeRhizohConstitutionalIncompletenessBoundary(kernelSummary = {}) {
  const execSeries = kernelSummary.allowExecutionSeries ?? kernelSummary.executionBits;
  return analyzeRhizohConstitutionalGodelBoundary({
    allowExecutionSeries: execSeries,
    bootstrapConverged: kernelSummary.bootstrapConverged ?? null,
    bootstrapRoundsUsed: kernelSummary.bootstrapRoundsUsed ?? null,
    collapseRisk: kernelSummary.collapseRisk ?? null,
    bifurcationAmplification: kernelSummary.bifurcationAmplification ?? null,
    irNestDepth: kernelSummary.irNestDepth ?? null,
    queueTruncated: kernelSummary.queueTruncated ?? null,
    omegaGlobalTruth: kernelSummary.omegaGlobalTruth ?? null,
    selfAuthorPatchRejectedRatio: kernelSummary.selfAuthorPatchRejectedRatio ?? null
  });
}

/**
 * IR bootstrap çıktısından sabit nokta boşluğu — küçük gap ⇒ daha stabil öz-uzama bölgesi.
 */
export function godelRhizohBootstrapFixedPointGap(bootstrapResult) {
  const converged = bootstrapResult?.converged === true;
  const rounds = bootstrapResult?.roundsUsed ?? bootstrapResult?.rounds ?? 0;
  const programsLen = bootstrapResult?.programTrace?.length ?? 0;
  const gap = converged
    ? Math.max(0.06, 0.22 - rounds * 0.028)
    : Math.max(0.42, 0.58 - rounds * 0.045);
  return {
    selfExtensionGap: Math.round(gap * 1000) / 1000,
    converged,
    roundsUsed: rounds,
    programTraceDepth: programsLen,
    hint: converged
      ? "Öz-genişleme sabitledi; semantik tamamlanma iddiası ayrı doğrulanmalı."
      : "Öz-genişleme sabitleşmedi — sistem kurallarını tek IR içinde kapatamıyor olabilir."
  };
}
