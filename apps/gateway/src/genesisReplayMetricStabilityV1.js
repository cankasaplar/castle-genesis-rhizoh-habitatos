/**
 * Measure-space coherence: embedding spread, ε/diameter discipline, derivative discipline, clustering balance.
 */
export const GENESIS_REPLAY_METRIC_STABILITY_SCHEMA = "castle.genesis.replay_metric_stability.v1";

/**
 * @param {{
 *   from: number,
 *   to: number,
 *   points: { x: number, y: number, z: number }[],
 *   manifoldSegmentation: unknown,
 *   curvatureSeriesPhase: unknown,
 *   curvatureCriticalPhaseAtlas: unknown
 * }} p
 */
export function computeMetricStabilityAxisV1(p) {
  const from = Math.floor(Number(p.from) || 0);
  const to = Math.floor(Number(p.to) || 0);
  const span = Math.max(1, to - from + 1);
  const pts = Array.isArray(p.points) ? p.points : [];
  const ms = p.manifoldSegmentation;
  const deriv = Array.isArray(
    /** @type {{ derivatives?: unknown[] }} */ (p.curvatureSeriesPhase)?.derivatives
  )
    ? /** @type {{ dCurvature: number }[]} */ (
        /** @type {{ derivatives: unknown[] }} */ (p.curvatureSeriesPhase).derivatives
      )
    : [];
  const atlasCells = Array.isArray(
    /** @type {{ cells?: unknown[] }} */ (p.curvatureCriticalPhaseAtlas)?.cells
  )
    ? /** @type {unknown[]} */ (/** @type {{ cells: unknown[] }} */ (p.curvatureCriticalPhaseAtlas).cells)
    : [];

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (const q of pts) {
    minX = Math.min(minX, q.x);
    maxX = Math.max(maxX, q.x);
    minY = Math.min(minY, q.y);
    maxY = Math.max(maxY, q.y);
    minZ = Math.min(minZ, q.z);
    maxZ = Math.max(maxZ, q.z);
  }
  const dx = Math.max(1e-6, maxX - minX);
  const dy = Math.max(1e-6, maxY - minY);
  const dz = Math.max(1e-6, maxZ - minZ);
  const diamEmbed = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const diamReported = Number(/** @type {{ embeddingDiameter?: unknown }} */ (ms)?.embeddingDiameter);
  const embeddingDiameter =
    Number.isFinite(diamReported) && diamReported > 0 ? diamReported : Math.round(diamEmbed * 10000) / 10000;

  const epsilon = Math.max(0, Number(/** @type {{ epsilon?: unknown }} */ (ms)?.epsilon) || 0);
  const epsilonToDiameterRatio =
    embeddingDiameter > 1e-9 ? Math.round((epsilon / embeddingDiameter) * 10000) / 10000 : 0;

  const absVals = deriv.map((d) => Math.abs(Number(d.dCurvature) || 0));
  const maxAbsD = absVals.length > 0 ? Math.max(...absVals) : 0;
  const meanAbsD = absVals.length > 0 ? absVals.reduce((a, b) => a + b, 0) / absVals.length : 0;
  let varD = 0;
  if (absVals.length > 1) {
    for (const v of absVals) varD += (v - meanAbsD) * (v - meanAbsD);
    varD /= absVals.length;
  }
  const derivCoefVar =
    meanAbsD > 1e-9 ? Math.round((Math.sqrt(varD) / meanAbsD) * 10000) / 10000 : Math.round(Math.sqrt(varD) * 10000) / 10000;

  const regions = Array.isArray(/** @type {{ regions?: unknown[] }} */ (ms)?.regions)
    ? /** @type {{ memberWindowIndices: number[] }[]} */ (
        /** @type {{ regions: unknown[] }} */ (ms).regions
      )
    : [];
  const counts = regions.map((r) => (Array.isArray(r.memberWindowIndices) ? r.memberWindowIndices.length : 0));
  const sumC = counts.reduce((a, b) => a + b, 0);
  const meanC = counts.length > 0 ? sumC / counts.length : 0;
  let varC = 0;
  if (counts.length > 1) {
    for (const c of counts) varC += (c - meanC) * (c - meanC);
    varC /= counts.length;
  }
  const regionSizeImbalance =
    meanC > 1e-9 ? Math.round((Math.sqrt(varC) / meanC) * 10000) / 10000 : Math.round(Math.sqrt(varC) * 10000) / 10000;

  const n = pts.length;
  const degenerateClustering = n > 1 && (regions.length <= 1 || regions.length >= Math.max(2, Math.floor(n * 0.95)));

  const idealLow = 0.12;
  const idealHigh = 0.42;
  let ratioStress = 0;
  if (epsilonToDiameterRatio > 0 && epsilonToDiameterRatio < idealLow) {
    ratioStress = (idealLow - epsilonToDiameterRatio) / idealLow;
  } else if (epsilonToDiameterRatio > idealHigh) {
    ratioStress = Math.min(1, (epsilonToDiameterRatio - idealHigh) / idealHigh);
  }

  const derivStress = Math.min(1, derivCoefVar / 2.2);
  const balanceStress = Math.min(1, regionSizeImbalance / 1.8);
  const atlasStress =
    atlasCells.length > 0 ? Math.min(0.15, Math.abs(atlasCells.length - Math.min(16, Math.max(4, Math.floor(span / 12)))) / 40) : 0;

  let score = 1 - (ratioStress * 0.35 + derivStress * 0.25 + balanceStress * 0.2 + atlasStress + (degenerateClustering ? 0.22 : 0));
  score = Math.max(0, Math.min(1, score));
  const metricStabilityScore = Math.round(score * 10000) / 10000;

  /** @type {string[]} */
  const notes = [];
  if (degenerateClustering) notes.push("manifold_clustering_near_degenerate");
  if (ratioStress > 0.08) notes.push("epsilon_diameter_ratio_out_of_band");
  if (derivStress > 0.35) notes.push("curvature_derivative_dispersion_high");
  if (balanceStress > 0.45) notes.push("region_size_imbalance_high");

  return {
    schema: GENESIS_REPLAY_METRIC_STABILITY_SCHEMA,
    spanSeq: span,
    embeddingBox: { dx: Math.round(dx * 10000) / 10000, dy: Math.round(dy * 10000) / 10000, dz: Math.round(dz * 10000) / 10000 },
    embeddingDiameter: Math.round(embeddingDiameter * 10000) / 10000,
    epsilonUsed: Math.round(epsilon * 10000) / 10000,
    epsilonToDiameterRatio,
    derivativeMaxAbs: Math.round(maxAbsD * 10000) / 10000,
    derivativeMeanAbs: Math.round(meanAbsD * 10000) / 10000,
    derivativeCoefVar: derivCoefVar,
    manifoldRegionCount: regions.length,
    manifoldRegionSizeImbalance: regionSizeImbalance,
    phaseAtlasCellCount: atlasCells.length,
    metricStabilityScore,
    flags: {
      degenerateClustering,
      epsilonRatioInComfortBand: ratioStress < 0.05
    },
    notes: notes.slice(0, 6)
  };
}
