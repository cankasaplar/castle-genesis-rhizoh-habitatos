/**
 * vNext-549 — Çok kullanıcı ortak presence: aynı ghost, çakışan bias.
 *
 * Çıktı tek `UserPresenceSnapshot` — mevcut intent / wake bütçesi / direnç hattına takılır.
 */

/**
 * @param {import("./userPresenceLoopV548.js").UserPresenceSnapshot[]} snaps
 * @returns {import("./userPresenceLoopV548.js").UserPresenceSnapshot | null}
 */
export function mergeCollectivePresenceSnaps(snaps) {
  if (!snaps?.length) return null;
  if (snaps.length === 1) return snaps[0];

  let sumIx = 0;
  let sumWa = 0;
  let sumPw = 0;
  /** @type {Map<string, number>} */
  const districtVotes = new Map();
  let oracleAny = false;

  for (const s of snaps) {
    sumIx += s.interactionEnergy01;
    sumWa += s.wakeAffinity01;
    sumPw += s.presenceWeight01;
    if (s.focusedDistrictId) {
      const w = s.presenceWeight01 * (0.55 + s.interactionEnergy01 * 0.45);
      districtVotes.set(s.focusedDistrictId, (districtVotes.get(s.focusedDistrictId) ?? 0) + w);
    }
    if (s.oracleNudgeConsumed) oracleAny = true;
  }

  const n = snaps.length;
  const spread =
    districtVotes.size <= 1
      ? 0
      : Math.min(1, (districtVotes.size - 1) * (0.11 + sumWa / Math.max(1, n) * 0.08));
  const conflictPenalty = 1 - spread * 0.42;

  let bestId = /** @type {string | null} */ (null);
  let bestW = 0;
  for (const [id, w] of districtVotes) {
    if (w > bestW) {
      bestW = w;
      bestId = id;
    }
  }

  return Object.freeze({
    focusedDistrictId: bestId,
    interactionEnergy01: Math.min(1, (sumIx / n) * conflictPenalty * 1.05),
    wakeAffinity01: Math.min(1, (sumWa / n) * conflictPenalty),
    presenceWeight01: Math.min(1, sumPw / n),
    oracleNudgeConsumed: oracleAny
  });
}
