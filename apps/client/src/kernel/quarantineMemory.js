/**
 * Karantina izi — tekrar / yörünge; terminate yalnızca state değil örüntü bazlı.
 */

export function createQuarantineMemory(opts = {}) {
  const maxHistory = opts.maxHistory ?? 32;
  const terminateAfterRepeats = opts.terminateAfterRepeats ?? 3;
  /** Aynı reason bu kadar tekrarlanırsa rehabilitate atlanıp terminate eğilimi */
  const skipRehabAfter = opts.skipRehabAfterRepeats ?? 3;

  /** @type {{ reason: string, ts: number, score?: number }[]} */
  const reasonHistory = [];

  function imprint(entry) {
    const rec = { reason: entry.reason, ts: entry.ts ?? Date.now(), score: entry.score };
    reasonHistory.push(rec);
    while (reasonHistory.length > maxHistory) reasonHistory.shift();
  }

  function repetitionScore(reason) {
    let n = 0;
    for (let i = reasonHistory.length - 1; i >= 0; i--) {
      if (reasonHistory[i].reason === reason) n += 1;
    }
    return n;
  }

  function sameErrorStreak(reason) {
    let s = 0;
    for (let i = reasonHistory.length - 1; i >= 0; i--) {
      if (reasonHistory[i].reason === reason) s += 1;
      else break;
    }
    return s;
  }

  function shouldTerminate(reason) {
    return repetitionScore(reason) >= terminateAfterRepeats || sameErrorStreak(reason) >= terminateAfterRepeats;
  }

  function shouldSkipRehabilitate(reason) {
    return sameErrorStreak(reason) >= skipRehabAfter;
  }

  function driftTrajectory() {
    if (reasonHistory.length < 2) return { slope: 0, note: "insufficient" };
    const recent = reasonHistory.slice(-8);
    let sumScore = 0;
    for (const r of recent) sumScore += Number(r.score ?? 0);
    return { recentCount: recent.length, scoreSum: sumScore, note: "trajectory_proxy" };
  }

  function sequenceFingerprint() {
    return reasonHistory.map((r) => r.reason).join(">");
  }

  function sequenceHash() {
    let h = 2166136261;
    for (const r of reasonHistory) {
      for (let i = 0; i < r.reason.length; i++) {
        h = Math.imul(h ^ r.reason.charCodeAt(i), 16777619);
      }
      h = Math.imul(h ^ 59, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  /** Heuristik: tekrar az, skor düşükse iyileşme olasılığı yüksek. */
  function recoveryProbabilityEstimate() {
    const last = reasonHistory[reasonHistory.length - 1];
    const streak = last ? sameErrorStreak(last.reason) : 0;
    const traj = driftTrajectory();
    const scorePressure = Math.min(1, (traj.scoreSum ?? 0) / 8);
    let p = 0.75 - streak * 0.18 - scorePressure * 0.25;
    p = Math.max(0.05, Math.min(0.98, p));
    return { p, streak, scorePressure, note: "heuristic_behavioral" };
  }

  return {
    imprint,
    repetitionScore,
    sameErrorStreak,
    shouldTerminate,
    shouldSkipRehabilitate,
    driftTrajectory,
    sequenceFingerprint,
    sequenceHash,
    recoveryProbabilityEstimate,
    getReasonHistory: () => [...reasonHistory],
    clear: () => {
      reasonHistory.length = 0;
    }
  };
}
