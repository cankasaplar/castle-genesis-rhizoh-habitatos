/**
 * Per-bin causal curvature along seq (entropy bins) + discrete dκ/d(seq) phase boundary hints.
 */
import { computeCausalCurvatureScalarV1 } from "./genesisReplayCurvatureV1.js";

export const GENESIS_REPLAY_CURVATURE_SERIES_SCHEMA = "castle.genesis.replay_curvature_series.v1";

/**
 * @param {{ from: number, to: number, stabilityField: unknown, causalTopology: unknown }} p
 */
export function computeCurvatureSeriesAndPhaseBoundariesV1(p) {
  const from = Math.floor(Number(p.from) || 0);
  const to = Math.floor(Number(p.to) || 0);
  const entropyField = Array.isArray(/** @type {{ entropyField?: unknown[] }} */ (p.stabilityField)?.entropyField)
    ? /** @type {{ fromSeq: number, toSeq: number, seqCenter: number }[]} */ (
        /** @type {{ entropyField: unknown[] }} */ (p.stabilityField).entropyField
      )
    : [];
  const gradient = Array.isArray(/** @type {{ gradient?: unknown[] }} */ (p.stabilityField)?.gradient)
    ? /** @type {{ seqCenter: number, deltaH: number }[]} */ (
        /** @type {{ gradient: unknown[] }} */ (p.stabilityField).gradient
      )
    : [];
  const edges = Array.isArray(/** @type {{ edges?: unknown[] }} */ (p.causalTopology)?.edges)
    ? /** @type {{ atSeq?: unknown }[]} */ (/** @type {{ edges: unknown[] }} */ (p.causalTopology).edges)
    : [];

  /** @type {{ fromSeq: number, toSeq: number, seqCenter: number, curvature: number }[]} */
  const series = [];
  for (const bin of entropyField) {
    const bf = Math.floor(Number(bin.fromSeq) || 0);
    const bt = Math.floor(Number(bin.toSeq) || 0);
    const seqCenter = Math.floor(Number(bin.seqCenter) || Math.floor((bf + bt) / 2));
    let edgeCount = 0;
    for (const e of edges) {
      const at = Math.floor(Number(e.atSeq) || 0);
      if (at >= bf && at <= bt) edgeCount += 1;
    }
    let absSum = 0;
    let gCount = 0;
    for (const g of gradient) {
      const sc = Math.floor(Number(g.seqCenter) || 0);
      if (sc >= bf && sc <= bt) {
        absSum += Math.abs(Number(g.deltaH) || 0);
        gCount += 1;
      }
    }
    const meanAbsG = gCount > 0 ? absSum / gCount : 0;
    const cur = computeCausalCurvatureScalarV1({
      from: bf,
      to: bt,
      edgeCount,
      spikeCount: 0,
      meanAbsGradient: meanAbsG,
      collapseCount: 0,
      edgeBurstHeuristic: false
    });
    series.push({ fromSeq: bf, toSeq: bt, seqCenter, curvature: cur.scalar });
  }

  /** @type {{ seqCenter: number, dCurvature: number, binIndex: number }[]} */
  const derivatives = [];
  for (let i = 1; i < series.length; i++) {
    const d = Math.round((series[i].curvature - series[i - 1].curvature) * 10000) / 10000;
    derivatives.push({ seqCenter: series[i].seqCenter, dCurvature: d, binIndex: i });
  }

  let maxAbs = 0;
  for (const de of derivatives) maxAbs = Math.max(maxAbs, Math.abs(de.dCurvature));
  const thresh = Math.max(1e-6, maxAbs * 0.35);

  /** @type {{ atSeq: number, dCurvature: number, kind: string }[]} */
  const phaseBoundaries = [];
  for (let i = 0; i < derivatives.length; i++) {
    if (Math.abs(derivatives[i].dCurvature) < thresh) continue;
    const prev = i > 0 ? derivatives[i - 1].dCurvature : 0;
    const next = i < derivatives.length - 1 ? derivatives[i + 1].dCurvature : 0;
    const mag = Math.abs(derivatives[i].dCurvature);
    const localMax = mag >= Math.abs(prev) && mag >= Math.abs(next);
    if (localMax || mag >= maxAbs * 0.9 - 1e-9) {
      phaseBoundaries.push({
        atSeq: derivatives[i].seqCenter,
        dCurvature: derivatives[i].dCurvature,
        kind: "curvature_kink"
      });
    }
  }
  if (phaseBoundaries.length > 12) {
    phaseBoundaries.sort((a, b) => Math.abs(b.dCurvature) - Math.abs(a.dCurvature));
    phaseBoundaries.splice(12);
    phaseBoundaries.sort((a, b) => a.atSeq - b.atSeq);
  }

  return {
    schema: GENESIS_REPLAY_CURVATURE_SERIES_SCHEMA,
    from,
    to,
    series,
    derivatives,
    phaseBoundaries,
    derivativeThreshold: Math.round(thresh * 1e6) / 1e6
  };
}
