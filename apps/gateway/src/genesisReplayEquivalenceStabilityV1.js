/**
 * Equivalence-class persistence across sliding replay windows (fingerprint runs + class transitions).
 */
export const GENESIS_REPLAY_EQUIVALENCE_STABILITY_SCHEMA = "castle.genesis.replay_equivalence_stability.v1";

/**
 * @param {{ from: number, to: number, replayFingerprint: string, continuityEventCount: number }[]} windows
 * @param {number} outerFrom
 * @param {number} outerTo
 */
export function computeEquivalenceClassStabilityFieldV1(windows, outerFrom, outerTo) {
  const wins = Array.isArray(windows) ? windows : [];
  const n = wins.length;
  const of = Math.floor(Number(outerFrom) || 0);
  const ot = Math.floor(Number(outerTo) || 0);

  if (n === 0) {
    return {
      schema: GENESIS_REPLAY_EQUIVALENCE_STABILITY_SCHEMA,
      runs: [],
      classTransitions: [],
      instabilityIndex: 1,
      windowCount: 0,
      persistenceSummary: null
    };
  }

  /** @type {{ fingerprint: string, windowStartIdx: number, windowEndIdx: number, fromSeq: number, toSeq: number, windowStreak: number, persistenceScore: number }[]} */
  const runs = [];
  let i = 0;
  while (i < n) {
    const fp = String(wins[i].replayFingerprint || "");
    let j = i;
    while (j + 1 < n && String(wins[j + 1].replayFingerprint || "") === fp) j += 1;
    const fromSeq = Math.floor(Number(wins[i].from) || 0);
    const toSeq = Math.floor(Number(wins[j].to) || 0);
    runs.push({
      fingerprint: fp,
      windowStartIdx: i,
      windowEndIdx: j,
      fromSeq,
      toSeq,
      windowStreak: j - i + 1,
      persistenceScore: Math.round(((j - i + 1) / n) * 10000) / 10000
    });
    i = j + 1;
  }

  /** @type {{ atSeq: number, fromFingerprint: string, toFingerprint: string }[]} */
  const classTransitions = [];
  for (let k = 1; k < n; k++) {
    const a = wins[k - 1];
    const b = wins[k];
    const fpa = String(a.replayFingerprint || "");
    const fpb = String(b.replayFingerprint || "");
    if (fpa === fpb) continue;
    const mid = Math.floor((Math.floor(Number(a.to) || 0) + Math.floor(Number(b.from) || 0)) / 2);
    classTransitions.push({
      atSeq: mid,
      fromFingerprint: fpa,
      toFingerprint: fpb
    });
  }

  const maxStreak = runs.reduce((m, r) => Math.max(m, r.windowStreak), 0);
  const instabilityIndex = Math.round((1 - maxStreak / n) * 10000) / 10000;

  const spanOuter = Math.max(1, ot - of + 1);
  const minFrom = Math.min(...wins.map((w) => Math.floor(Number(w.from) || 0)));
  const maxTo = Math.max(...wins.map((w) => Math.floor(Number(w.to) || 0)));
  const coveredSeq = Math.max(0, maxTo - minFrom + 1);

  return {
    schema: GENESIS_REPLAY_EQUIVALENCE_STABILITY_SCHEMA,
    runs,
    classTransitions,
    instabilityIndex,
    windowCount: n,
    persistenceSummary: {
      maxRunWindows: maxStreak,
      distinctClasses: runs.length,
      outerSpan: spanOuter,
      windowUnionSpan: coveredSeq
    }
  };
}
