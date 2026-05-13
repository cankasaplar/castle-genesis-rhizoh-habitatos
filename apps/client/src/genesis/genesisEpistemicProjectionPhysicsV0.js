/**
 * Genesis epistemic projection physics (V0) — read-only observables.
 * Band overlap is a set-theoretic operator; cross-origin output is a mapping table, not a merge.
 * @see docs/RHIZOH_CONTAINMENT_FIELD_V0_1.md (containment field; this module is executable surface)
 */

/** @typedef {"contained" | "exceeds" | "unknown" | "invalid"} ContainmentPhiV0 */

/** @param {unknown} row */
export function rowRecord(row) {
  return row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
}

/** @param {unknown} body */
export function lastAcceptedSeqFromRuntimeBody(body) {
  if (!body || typeof body !== "object") return null;
  const b = /** @type {Record<string, unknown>} */ (body);
  const gs = b.genesisStream;
  if (!gs || typeof gs !== "object") return null;
  const v = /** @type {Record<string, unknown>} */ (gs).lastAcceptedSeq;
  return Number.isFinite(Number(v)) ? Math.floor(Number(v)) : null;
}

/** @returns {ContainmentPhiV0} */
export function classifyContainmentPhiV0(fromN, toN, lastSeq) {
  if (fromN <= 0 || toN <= 0 || toN < fromN) return "invalid";
  if (lastSeq == null || !Number.isFinite(lastSeq)) return "unknown";
  return toN <= lastSeq ? "contained" : "exceeds";
}

/** @param {ContainmentPhiV0} phi */
export function containmentDetailTextV0(phi, fromN, toN, lastN) {
  if (phi === "invalid") return "Segment bounds invalid — no φ.";
  if (phi === "unknown") return "lastAcceptedSeq unavailable — φ unknown.";
  if (phi === "contained")
    return `φ: segment [${fromN},${toN}] ⊆ reported acceptance (to ≤ lastAcceptedSeq=${lastN}). Classification only.`;
  return `φ: segment exceeds reported acceptance (to=${toN} > lastAcceptedSeq=${lastN}). Boundary note only.`;
}

/**
 * Integer seq set from checkpoint rows (seqCommittedThrough), clipped to [fromN, toN].
 * @param {unknown[]} rows
 * @param {number} fromN
 * @param {number} toN
 * @returns {Set<number>}
 */
export function seqSetFromCheckpointRowsInWindow(rows, fromN, toN) {
  const s = new Set();
  for (const row of rows) {
    const r = rowRecord(row);
    const seq = Math.floor(Number(r.seqCommittedThrough) || 0);
    if (seq < fromN || seq > toN) continue;
    s.add(seq);
  }
  return s;
}

/** @param {Set<number>} a @param {Set<number>} b */
export function epistemicSetIntersection(a, b) {
  const out = new Set();
  for (const x of a) if (b.has(x)) out.add(x);
  return out;
}

/** @param {Set<number>} a @param {Set<number>} b */
export function epistemicSetUnion(a, b) {
  const out = new Set(a);
  for (const x of b) out.add(x);
  return out;
}

/** @param {Set<number>} a @param {Set<number>} b */
export function epistemicSetDifference(a, b) {
  const out = new Set();
  for (const x of a) if (!b.has(x)) out.add(x);
  return out;
}

/**
 * Jaccard index for two projections on the same window: |R∩L| / |R∪L|.
 * @param {Set<number>} rangeSet
 * @param {Set<number>} lineageSet
 * @returns {number | null}
 */
export function jaccardRangeLineageV0(rangeSet, lineageSet) {
  const inter = epistemicSetIntersection(rangeSet, lineageSet);
  const uni = epistemicSetUnion(rangeSet, lineageSet);
  if (uni.size === 0) return null;
  return inter.size / uni.size;
}

/**
 * Jaccard index |A∩B|/|A∪B| for two finite sets (or sorted unique number arrays).
 * @param {Set<number> | Iterable<number>} a
 * @param {Set<number> | Iterable<number>} b
 * @returns {number | null}
 */
export function jaccardFiniteSetsV0(a, b) {
  const A = a instanceof Set ? a : new Set(a);
  const B = b instanceof Set ? b : new Set(b);
  const inter = epistemicSetIntersection(A, B);
  const uni = epistemicSetUnion(A, B);
  if (uni.size === 0) return null;
  return inter.size / uni.size;
}

/**
 * Normalized channel divergence 1 − Jaccard; 0 when both channels empty (identical empty footprint).
 * @param {Set<number> | Iterable<number>} a
 * @param {Set<number> | Iterable<number>} b
 */
export function epistemicChannelDivergence01V0(a, b) {
  const A = a instanceof Set ? a : new Set(a);
  const B = b instanceof Set ? b : new Set(b);
  const uni = epistemicSetUnion(A, B);
  if (uni.size === 0) return 0;
  const j = epistemicSetIntersection(A, B).size / uni.size;
  return 1 - j;
}

/**
 * @param {Set<number>} rangeSet
 * @param {Set<number>} lineageSet
 */
export function bandAlgebraMeasuresV0(rangeSet, lineageSet) {
  const overlap = epistemicSetIntersection(rangeSet, lineageSet);
  const union = epistemicSetUnion(rangeSet, lineageSet);
  const rangeOnly = epistemicSetDifference(rangeSet, lineageSet);
  const lineageOnly = epistemicSetDifference(lineageSet, rangeSet);
  return {
    cardinalityRange: rangeSet.size,
    cardinalityLineage: lineageSet.size,
    cardinalityOverlap: overlap.size,
    cardinalityUnion: union.size,
    cardinalityRangeOnly: rangeOnly.size,
    cardinalityLineageOnly: lineageOnly.size,
    jaccardRangeLineage: jaccardRangeLineageV0(rangeSet, lineageSet)
  };
}

function sortNums(arr) {
  return [...arr].sort((x, y) => x - y);
}

/** @param {unknown} body Genesis range/lineage GET JSON body */
export function genesisCheckpointRowsFromGetBodyV0(body) {
  if (!body || typeof body !== "object" || body === null) return [];
  const b = /** @type {Record<string, unknown>} */ (body);
  return Array.isArray(b.checkpoints) ? /** @type {unknown[]} */ (b.checkpoints) : [];
}

/**
 * @param {unknown[]} rangeRows
 * @param {unknown[]} lineageRows
 * @param {number} fromN
 * @param {number} toN
 * @returns {Map<number, { prev: string; ledger: string; inRange: boolean; inLn: boolean }>}
 */
function bandRowMapFromProjections(rangeRows, lineageRows, fromN, toN) {
  /** @type {Map<number, { prev: string; ledger: string; inRange: boolean; inLn: boolean }>} */
  const m = new Map();
  for (const row of rangeRows) {
    const r = rowRecord(row);
    const seq = Math.floor(Number(r.seqCommittedThrough) || 0);
    if (seq < fromN || seq > toN) continue;
    m.set(seq, {
      prev: String(r.prevLedgerRoot ?? ""),
      ledger: String(r.ledgerRoot ?? ""),
      inRange: true,
      inLn: false
    });
  }
  for (const row of lineageRows) {
    const r = rowRecord(row);
    const seq = Math.floor(Number(r.seqCommittedThrough) || 0);
    if (seq < fromN || seq > toN) continue;
    const cur = m.get(seq);
    if (cur) {
      cur.inLn = true;
    } else {
      m.set(seq, {
        prev: String(r.prevLedgerRoot ?? ""),
        ledger: String(r.ledgerRoot ?? ""),
        inRange: false,
        inLn: true
      });
    }
  }
  return m;
}

/**
 * Lineage + range + seq window → single normalized projection tensor (V0).
 * `rows` mirror the observatory table; `sets` and `measures` are the measurable layer.
 * @param {{ fromN: number; toN: number; rangeRows: unknown[]; lineageRows: unknown[] }} p
 */
export function buildTemporalProjectionTensorV0(p) {
  const { fromN, toN, rangeRows, lineageRows } = p;
  const rangeSet = seqSetFromCheckpointRowsInWindow(rangeRows, fromN, toN);
  const lineageSet = seqSetFromCheckpointRowsInWindow(lineageRows, fromN, toN);
  const overlapSet = epistemicSetIntersection(rangeSet, lineageSet);
  const rangeOnlySet = epistemicSetDifference(rangeSet, lineageSet);
  const lineageOnlySet = epistemicSetDifference(lineageSet, rangeSet);
  const measures = bandAlgebraMeasuresV0(rangeSet, lineageSet);

  const m = bandRowMapFromProjections(rangeRows, lineageRows, fromN, toN);
  const rows = [...m.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([seq, o]) => ({ seq, ...o, overlap: o.inRange && o.inLn }));

  return {
    v: 0,
    window: { from: fromN, to: toN },
    sets: {
      rangeSeqSorted: sortNums([...rangeSet]),
      lineageSeqSorted: sortNums([...lineageSet]),
      overlapSeqSorted: sortNums([...overlapSet]),
      rangeOnlySeqSorted: sortNums([...rangeOnlySet]),
      lineageOnlySeqSorted: sortNums([...lineageOnlySet])
    },
    measures,
    rows
  };
}

export function buildEpistemicBandRowsV0(rangeRows, lineageRows, fromN, toN) {
  return buildTemporalProjectionTensorV0({ fromN, toN, rangeRows, lineageRows }).rows;
}

/**
 * Cross-origin containment alignment: explicit φA↔φB pair code (not merged truth).
 * @param {ContainmentPhiV0} phiA
 * @param {ContainmentPhiV0 | null | undefined} phiB
 */
export function containmentAlignmentMapV0(phiA, phiB) {
  if (phiB == null) {
    return {
      mode: /** @type {const} */ ("single_origin"),
      pair: /** @type {[ContainmentPhiV0, null]} */ ([phiA, null]),
      code: `single:${phiA}`
    };
  }
  const pair = /** @type {[ContainmentPhiV0, ContainmentPhiV0]} */ ([phiA, phiB]);
  const code = `cross:${phiA}|${phiB}`;
  if (phiA === phiB) {
    return {
      mode: /** @type {const} */ ("identity_pair"),
      pair,
      code,
      map: /** @type {const} */ ("diagonal")
    };
  }
  if (phiA === "invalid" || phiB === "invalid") {
    return { mode: /** @type {const} */ ("incomparable"), pair, code, map: /** @type {const} */ ("invalid_axis") };
  }
  if (phiA === "unknown" || phiB === "unknown") {
    return { mode: /** @type {const} */ ("degraded"), pair, code, map: /** @type {const} */ ("unknown_axis") };
  }
  return { mode: /** @type {const} */ ("divergent"), pair, code, map: /** @type {const} */ ("permute") };
}

/**
 * Cross-origin alignment of observational geometries (same seq window): range / lineage / overlap
 * channels compared as sets — not “world merge”, only measurable overlap + tensor-difference scalar.
 *
 * `tensorDifferenceNorm01` = mean of per-channel (1 − Jaccard) for R_A vs R_B, L_A vs L_B, O_A vs O_B.
 *
 * @param {ReturnType<typeof buildTemporalProjectionTensorV0> | null | undefined} tensorA
 * @param {ReturnType<typeof buildTemporalProjectionTensorV0> | null | undefined} tensorB
 * @returns {null | {
 *   v: 0,
 *   windowMismatch: boolean,
 *   cardinalityRangeIntersectionAB: number | null,
 *   cardinalityLineageIntersectionAB: number | null,
 *   cardinalityOverlapIntersectionAB: number | null,
 *   overlapJaccardCrossOrigin: number | null,
 *   channelDivergenceRange01: number | null,
 *   channelDivergenceLineage01: number | null,
 *   channelDivergenceOverlap01: number | null,
 *   channelDivergenceVector01: [number, number, number] | null,
 *   tensorDifferenceNorm01: number | null
 * }}
 */
export function crossOriginObservationalGeometryV0(tensorA, tensorB) {
  if (!tensorA || !tensorB || tensorA.v !== 0 || tensorB.v !== 0) return null;
  const wMatch =
    tensorA.window.from === tensorB.window.from && tensorA.window.to === tensorB.window.to;
  if (!wMatch) {
    return {
      v: 0,
      windowMismatch: true,
      cardinalityRangeIntersectionAB: null,
      cardinalityLineageIntersectionAB: null,
      cardinalityOverlapIntersectionAB: null,
      overlapJaccardCrossOrigin: null,
      channelDivergenceRange01: null,
      channelDivergenceLineage01: null,
      channelDivergenceOverlap01: null,
      channelDivergenceVector01: null,
      tensorDifferenceNorm01: null
    };
  }

  const RA = new Set(tensorA.sets.rangeSeqSorted);
  const RB = new Set(tensorB.sets.rangeSeqSorted);
  const LA = new Set(tensorA.sets.lineageSeqSorted);
  const LB = new Set(tensorB.sets.lineageSeqSorted);
  const OA = new Set(tensorA.sets.overlapSeqSorted);
  const OB = new Set(tensorB.sets.overlapSeqSorted);

  const cardinalityRangeIntersectionAB = epistemicSetIntersection(RA, RB).size;
  const cardinalityLineageIntersectionAB = epistemicSetIntersection(LA, LB).size;
  const cardinalityOverlapIntersectionAB = epistemicSetIntersection(OA, OB).size;

  const overlapJaccardCrossOrigin = jaccardFiniteSetsV0(OA, OB);

  const channelDivergenceRange01 = epistemicChannelDivergence01V0(RA, RB);
  const channelDivergenceLineage01 = epistemicChannelDivergence01V0(LA, LB);
  const channelDivergenceOverlap01 = epistemicChannelDivergence01V0(OA, OB);
  const channelDivergenceVector01 = /** @type {[number, number, number]} */ ([
    channelDivergenceRange01,
    channelDivergenceLineage01,
    channelDivergenceOverlap01
  ]);
  const tensorDifferenceNorm01 = (channelDivergenceRange01 + channelDivergenceLineage01 + channelDivergenceOverlap01) / 3;

  return {
    v: 0,
    windowMismatch: false,
    cardinalityRangeIntersectionAB,
    cardinalityLineageIntersectionAB,
    cardinalityOverlapIntersectionAB,
    overlapJaccardCrossOrigin,
    channelDivergenceRange01,
    channelDivergenceLineage01,
    channelDivergenceOverlap01,
    channelDivergenceVector01,
    tensorDifferenceNorm01
  };
}

/**
 * Cross-origin “field topology” — ordering + anisotropy on the 3-channel strain simplex (not merge).
 * @param {Exclude<ReturnType<typeof crossOriginObservationalGeometryV0>, null>} geometry
 * @returns {null | {
 *   v: 0,
 *   stressOrdering: string,
 *   anisotropy01: number,
 *   dominant: 'R' | 'L' | 'O' | 'flat',
 *   barycentricRL01: [number, number, number]
 * }}
 */
export function crossOriginFieldTopologyV0(geometry) {
  if (!geometry || geometry.windowMismatch || geometry.channelDivergenceVector01 == null) return null;
  const [dR, dL, dO] = geometry.channelDivergenceVector01;
  const max = Math.max(dR, dL, dO);
  const min = Math.min(dR, dL, dO);
  const anisotropy01 = max > 0 ? (max - min) / max : 0;

  const labeled = [
    { ch: /** @type {const} */ ("R"), v: dR },
    { ch: /** @type {const} */ ("L"), v: dL },
    { ch: /** @type {const} */ ("O"), v: dO }
  ];
  const sorted = [...labeled].sort((x, y) => y.v - x.v || x.ch.localeCompare(y.ch));
  const stressOrdering = sorted.map((x) => x.ch).join(">");
  const dominant = max === 0 ? /** @type {const} */ ("flat") : sorted[0].ch;

  const sum = dR + dL + dO;
  const barycentricRL01 =
    sum > 0
      ? /** @type {[number, number, number]} */ ([dR / sum, dL / sum, dO / sum])
      : /** @type {[number, number, number]} */ ([1 / 3, 1 / 3, 1 / 3]);

  return { v: 0, stressOrdering, anisotropy01, dominant, barycentricRL01 };
}
