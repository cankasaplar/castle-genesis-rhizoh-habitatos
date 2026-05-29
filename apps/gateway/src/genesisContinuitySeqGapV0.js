/**
 * Strict seq continuity audit — gap detection on monotonic accept line.
 */

let lastAcceptedSeq = 0;
let gapCount = 0;
/** @type {{ from: number, to: number, atMs: number } | null} */
let lastGap = null;

/**
 * @param {number} seq
 */
export function noteGenesisContinuitySeqAcceptedV0(seq) {
  const s = Math.floor(Number(seq) || 0);
  if (s <= 0) return getGenesisContinuitySeqAuditV0();
  if (lastAcceptedSeq > 0 && s > lastAcceptedSeq + 1) {
    gapCount += 1;
    lastGap = { from: lastAcceptedSeq, to: s, atMs: Date.now() };
  }
  if (s > lastAcceptedSeq) lastAcceptedSeq = s;
  return getGenesisContinuitySeqAuditV0();
}

export function getGenesisContinuitySeqAuditV0() {
  return Object.freeze({
    schema: "castle.genesis.continuity_seq_audit.v0",
    lastAcceptedSeq,
    gapCount,
    lastGap: lastGap ? { ...lastGap } : null,
    strictMonotonic: gapCount === 0
  });
}

/** Boot rehydrate floor — do not record gap on first seq after restart. */
export function rehydrateGenesisContinuitySeqAuditFloorV0(n) {
  const v = Math.floor(Number(n) || 0);
  if (v > lastAcceptedSeq) lastAcceptedSeq = v;
}

/** @public Tests */
export function resetGenesisContinuitySeqGapForTestsV0() {
  lastAcceptedSeq = 0;
  gapCount = 0;
  lastGap = null;
}
