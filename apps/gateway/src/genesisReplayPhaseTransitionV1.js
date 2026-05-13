/**
 * (A) Regime criticality: entropy-gradient spikes co-located with topology transition density.
 */
export const GENESIS_REPLAY_PHASE_TRANSITION_SCHEMA = "castle.genesis.replay_phase_transition.v1";

/**
 * @param {{
 *   causalTopology: { edges?: { atSeq: number }[] },
 *   stabilityField: { gradient?: { seqCenter: number, deltaH: number }[], stepHint?: number },
 *   from: number,
 *   to: number
 * }} p
 */
export function detectPhaseRegimeCriticalityV1(p) {
  const from = Math.floor(Number(p.from) || 0);
  const to = Math.floor(Number(p.to) || 0);
  const span = Math.max(1, to - from + 1);
  const edges = Array.isArray(p.causalTopology?.edges) ? p.causalTopology.edges : [];
  const grad = Array.isArray(p.stabilityField?.gradient) ? p.stabilityField.gradient : [];
  const stepHint = Math.max(1, Math.floor(Number(p.stabilityField?.stepHint) || 1));
  const windowR = Math.max(stepHint * 2, 8);

  const absVals = grad.map((g) => Math.abs(Number(g.deltaH) || 0)).filter((x) => Number.isFinite(x));
  const sorted = [...absVals].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  const threshold = Math.max(0.22, median > 0 ? median * 2.2 : 0.35);

  /** @type {{ seqCenter: number, absDeltaH: number, nearbyTransitions: number, criticality: number }[]} */
  const spikes = [];
  for (const g of grad) {
    const dh = Number(g.deltaH) || 0;
    const absDh = Math.abs(dh);
    if (absDh < threshold) continue;
    const c = Math.floor(Number(g.seqCenter) || 0);
    const nearby = edges.filter((e) => Math.abs((Number(e.atSeq) || 0) - c) <= windowR).length;
    const criticality = Math.min(1, Math.round((absDh * (1 + nearby * 0.35)) * 1000) / 1000);
    spikes.push({ seqCenter: c, absDeltaH: absDh, nearbyTransitions: nearby, criticality });
  }

  const edgeDensity = edges.length / span;
  const burst = spikes.length >= 2 || (edges.length >= 3 && edgeDensity >= 3 / Math.max(32, span));

  return {
    schema: GENESIS_REPLAY_PHASE_TRANSITION_SCHEMA,
    entropyGradientThreshold: threshold,
    edgeDensity,
    edgeBurstHeuristic: burst,
    spikeCount: spikes.length,
    spikes
  };
}
