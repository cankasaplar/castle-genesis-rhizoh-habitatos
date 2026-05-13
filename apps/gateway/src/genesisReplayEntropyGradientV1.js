/**
 * Discrete Shannon field over seq bins + forward difference as ∇H proxy (“stability geography” v0).
 */
export const GENESIS_REPLAY_ENTROPY_FIELD_SCHEMA = "castle.genesis.replay_entropy_field.v1";

/**
 * @param {Set<number>} ringSeq
 * @param {Set<number>} archSeq
 */
export function shannon3BinOverlapEntropyBits(ringSeq, archSeq) {
  let overlap = 0;
  for (const x of ringSeq) {
    if (archSeq.has(x)) overlap += 1;
  }
  const rOnly = ringSeq.size - overlap;
  const aOnly = archSeq.size - overlap;
  const u = rOnly + aOnly + overlap;
  if (u <= 0) return 0;
  let h = 0;
  for (const c of [rOnly, aOnly, overlap]) {
    if (c <= 0) continue;
    const p = c / u;
    h -= p * Math.log2(p);
  }
  return Math.round(h * 10000) / 10000;
}

/**
 * @param {Record<string, unknown>[]} ringEvents
 * @param {Record<string, unknown>[]} archiveEvents
 */
function seqSetInWindowFromEvents(events, a, c) {
  /** @type {Set<number>} */
  const s = new Set();
  for (const e of events) {
    const n = Math.floor(Number(/** @type {{ seq?: unknown }} */ (e).seq) || 0);
    if (n >= a && n <= c) s.add(n);
  }
  return s;
}

/**
 * @param {number} fromSeq inclusive
 * @param {number} toSeq inclusive
 * @param {number} bins 1..64
 * @param {Record<string, unknown>[]} ringEvents
 * @param {Record<string, unknown>[]} archiveEvents
 */
export function computeEntropyGradientFieldV1(fromSeq, toSeq, bins, ringEvents, archiveEvents) {
  const fromN = Math.floor(Number(fromSeq) || 0);
  const toN = Math.floor(Number(toSeq) || 0);
  const span = toN - fromN + 1;
  const nBins = Math.min(64, Math.max(1, Math.floor(Number(bins) || 16)));
  const step = Math.max(1, Math.ceil(span / nBins));

  /** @type {{ fromSeq: number, toSeq: number, seqCenter: number, hBits: number }[]} */
  const entropyField = [];
  for (let k = 0; k < nBins; k++) {
    const a = fromN + k * step;
    if (a > toN) break;
    const c = Math.min(toN, a + step - 1);
    const rS = seqSetInWindowFromEvents(ringEvents || [], a, c);
    const arS = seqSetInWindowFromEvents(archiveEvents || [], a, c);
    const hBits = shannon3BinOverlapEntropyBits(rS, arS);
    entropyField.push({ fromSeq: a, toSeq: c, seqCenter: Math.floor((a + c) / 2), hBits });
  }

  /** @type {{ seqCenter: number, deltaH: number }[]} */
  const gradient = [];
  for (let i = 1; i < entropyField.length; i++) {
    gradient.push({
      seqCenter: entropyField[i].seqCenter,
      deltaH: Math.round((entropyField[i].hBits - entropyField[i - 1].hBits) * 10000) / 10000
    });
  }

  return {
    schema: GENESIS_REPLAY_ENTROPY_FIELD_SCHEMA,
    bins: entropyField.length,
    stepHint: step,
    entropyField,
    gradient
  };
}
