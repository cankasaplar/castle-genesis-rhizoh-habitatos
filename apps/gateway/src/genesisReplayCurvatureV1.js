/**
 * (C) Scalar “causal curvature” from graph density, entropy activity, and equivalence-collapse pressure.
 */
export const GENESIS_REPLAY_CAUSAL_CURVATURE_SCHEMA = "castle.genesis.replay_causal_curvature.v1";

/**
 * @param {{
 *   from: number,
 *   to: number,
 *   edgeCount: number,
 *   spikeCount: number,
 *   meanAbsGradient: number,
 *   collapseCount: number,
 *   edgeBurstHeuristic: boolean
 * }} p
 */
export function computeCausalCurvatureScalarV1(p) {
  const span = Math.max(1, Math.floor(p.to) - Math.floor(p.from) + 1);
  const edgeCount = Math.max(0, Math.floor(Number(p.edgeCount) || 0));
  const spikeCount = Math.max(0, Math.floor(Number(p.spikeCount) || 0));
  const meanAbsG = Math.max(0, Number(p.meanAbsGradient) || 0);
  const collapseCount = Math.max(0, Math.floor(Number(p.collapseCount) || 0));
  const burst = !!p.edgeBurstHeuristic;

  const edgeTerm = (edgeCount / span) * 4;
  const entTerm = meanAbsG * 3 + spikeCount * 0.12;
  const colTerm = Math.min(1.2, collapseCount * 0.45);
  const burstBump = burst ? 0.35 : 0;
  const norm = 1 + Math.log2(span + 1) * 0.15;
  const raw = (edgeTerm + entTerm + colTerm + burstBump) / norm;
  const scalar = Math.min(9.9999, Math.round(raw * 10000) / 10000);

  return {
    schema: GENESIS_REPLAY_CAUSAL_CURVATURE_SCHEMA,
    scalar,
    components: {
      edgeDensityTerm: Math.round(edgeTerm * 10000) / 10000,
      entropyActivityTerm: Math.round((meanAbsG * 3 + spikeCount * 0.12) * 10000) / 10000,
      collapsePressureTerm: Math.round(colTerm * 10000) / 10000,
      edgeBurstBump: burstBump,
      normalization: Math.round(norm * 10000) / 10000,
      span
    }
  };
}
