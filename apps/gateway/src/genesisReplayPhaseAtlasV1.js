/**
 * Phase atlas: seq cells combining curvature-derivative stress (dκ) and equivalence instability.
 */
export const GENESIS_REPLAY_PHASE_ATLAS_SCHEMA = "castle.genesis.replay_phase_atlas.v1";

const MAX_CELLS = 24;

/**
 * @param {{
 *   from: number,
 *   to: number,
 *   curvatureSeriesPhase: unknown,
 *   equivalenceClassStabilityField: unknown,
 *   phaseRegimeCriticality: unknown
 * }} p
 */
export function computeCurvatureCriticalPhaseAtlasV1(p) {
  const from = Math.floor(Number(p.from) || 0);
  const to = Math.floor(Number(p.to) || 0);
  const deriv = Array.isArray(
    /** @type {{ derivatives?: unknown[] }} */ (p.curvatureSeriesPhase)?.derivatives
  )
    ? /** @type {{ seqCenter: number, dCurvature: number }[]} */ (
        /** @type {{ derivatives: unknown[] }} */ (p.curvatureSeriesPhase).derivatives
      )
    : [];
  const phaseBounds = Array.isArray(
    /** @type {{ phaseBoundaries?: unknown[] }} */ (p.curvatureSeriesPhase)?.phaseBoundaries
  )
    ? /** @type {{ atSeq: number }[]} */ (
        /** @type {{ phaseBoundaries: unknown[] }} */ (p.curvatureSeriesPhase).phaseBoundaries
      )
    : [];
  const transitions = Array.isArray(
    /** @type {{ classTransitions?: unknown[] }} */ (p.equivalenceClassStabilityField)?.classTransitions
  )
    ? /** @type {{ atSeq: number }[]} */ (
        /** @type {{ classTransitions: unknown[] }} */ (p.equivalenceClassStabilityField).classTransitions
      )
    : [];
  const instabilityIndex = Math.min(
    1,
    Math.max(0, Number(/** @type {{ instabilityIndex?: unknown }} */ (p.equivalenceClassStabilityField)?.instabilityIndex) || 0)
  );
  const spikeCount = Math.floor(
    Number(/** @type {{ spikeCount?: unknown }} */ (p.phaseRegimeCriticality)?.spikeCount) || 0
  );
  const edgeBurst = !!/** @type {{ edgeBurstHeuristic?: unknown }} */ (p.phaseRegimeCriticality)?.edgeBurstHeuristic;

  /** @type {number[]} */
  const splits = [];
  for (const b of phaseBounds) {
    const x = Math.floor(Number(b.atSeq) || 0);
    if (x > from && x <= to) splits.push(x);
  }
  for (const t of transitions) {
    const x = Math.floor(Number(t.atSeq) || 0);
    if (x > from && x <= to) splits.push(x);
  }
  splits.sort((a, b) => a - b);
  /** @type {number[]} */
  const uniq = [];
  for (const s of splits) {
    if (uniq.length === 0 || uniq[uniq.length - 1] !== s) uniq.push(s);
  }

  /** @type {{ fromSeq: number, toSeq: number }[]} */
  let cells = [];
  let cur = from;
  for (const b of uniq) {
    if (b > cur) cells.push({ fromSeq: cur, toSeq: b - 1 });
    cur = b;
  }
  if (cur <= to) cells.push({ fromSeq: cur, toSeq: to });
  if (cells.length === 0) cells.push({ fromSeq: from, toSeq: to });

  while (cells.length > MAX_CELLS) {
    let best = 0;
    let bestW = Infinity;
    for (let i = 0; i < cells.length - 1; i += 1) {
      const w = cells[i].toSeq - cells[i].fromSeq + 1 + (cells[i + 1].toSeq - cells[i + 1].fromSeq + 1);
      if (w < bestW) {
        bestW = w;
        best = i;
      }
    }
    const a = cells[best];
    const b = cells[best + 1];
    cells.splice(best, 2, { fromSeq: a.fromSeq, toSeq: b.toSeq });
  }

  let globalMaxD = 0;
  for (const d of deriv) globalMaxD = Math.max(globalMaxD, Math.abs(Number(d.dCurvature) || 0));

  /** @type {{ fromSeq: number, toSeq: number, maxAbsDkappa: number, transitionCount: number, curvatureStress: number, instabilityStress: number, phaseHint: string }[]} */
  const atlasCells = [];
  for (const c of cells) {
    let maxAbs = 0;
    for (const d of deriv) {
      const sc = Math.floor(Number(d.seqCenter) || 0);
      if (sc >= c.fromSeq && sc <= c.toSeq) maxAbs = Math.max(maxAbs, Math.abs(Number(d.dCurvature) || 0));
    }
    let tc = 0;
    for (const t of transitions) {
      const at = Math.floor(Number(t.atSeq) || 0);
      if (at >= c.fromSeq && at <= c.toSeq) tc += 1;
    }
    const curvStress =
      globalMaxD > 1e-9 ? Math.round((maxAbs / globalMaxD) * 10000) / 10000 : Math.round(maxAbs * 10000) / 10000;
    const instStress = Math.round((instabilityIndex * (0.35 + Math.min(1, tc) * 0.35) + (tc > 0 ? 0.15 : 0)) * 10000) / 10000;
    const score = Math.round((curvStress * 0.55 + instStress * 0.45 + (edgeBurst ? 0.08 : 0) + Math.min(0.12, spikeCount * 0.02)) * 10000) / 10000;
    let phaseHint = "steady";
    if (score >= 0.62) phaseHint = "critical";
    else if (score >= 0.35) phaseHint = "transitional";

    atlasCells.push({
      fromSeq: c.fromSeq,
      toSeq: c.toSeq,
      maxAbsDkappa: Math.round(maxAbs * 10000) / 10000,
      transitionCount: tc,
      curvatureStress: curvStress,
      instabilityStress: instStress,
      phaseHint
    });
  }

  const aggregateCurvatureCriticality =
    atlasCells.length > 0
      ? Math.round((atlasCells.reduce((s, x) => s + x.curvatureStress + x.maxAbsDkappa * 0.1, 0) / atlasCells.length) * 10000) /
        10000
      : 0;

  return {
    schema: GENESIS_REPLAY_PHASE_ATLAS_SCHEMA,
    from,
    to,
    globalInstabilityIndex: Math.round(instabilityIndex * 10000) / 10000,
    spikeCount,
    edgeBurstHeuristic: edgeBurst,
    cells: atlasCells,
    aggregateCurvatureCriticality
  };
}
