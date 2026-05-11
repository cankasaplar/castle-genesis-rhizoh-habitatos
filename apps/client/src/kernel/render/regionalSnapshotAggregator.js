/**
 * vNext-538 — Fold epoch / pressure snapshots into regional field samples (CPU-side).
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @typedef {object} RegionalSnapshot
 * @property {string} regionId
 * @property {number[]} [pressureVector] length 5
 * @property {{ truthResonance?: number, contradictionResonance?: number, memoryResonance?: number, legitimacyResonance?: number, noveltyResonance?: number }} [resonanceField]
 * @property {number} [branchEntropy]
 * @property {number} [conflictSeverity]
 * @property {string} [lineageBranchId]
 */

/**
 * @param {RegionalSnapshot[]} snapshots
 * @returns {Map<string, { regionId: string, pressureMean: number[], resonanceMean: number[], branchEntropy: number, conflictSeverity: number }>}
 */
export function aggregateRegionalSnapshots(snapshots) {
  /** @type {Map<string, { n: number, p: number[], r: number[], be: number, cs: number }>} */
  const acc = new Map();
  for (const s of snapshots) {
    const id = s.regionId || "default";
    const cur = acc.get(id) || {
      n: 0,
      p: [0, 0, 0, 0, 0],
      r: [0, 0, 0, 0, 0],
      be: 0,
      cs: 0
    };
    cur.n += 1;
    const pv = s.pressureVector || [0, 0, 0, 0, 0];
    const rf = s.resonanceField || {};
    const rv = [
      rf.truthResonance ?? 0.45,
      rf.contradictionResonance ?? 0.2,
      rf.memoryResonance ?? 0.45,
      rf.legitimacyResonance ?? 0.45,
      rf.noveltyResonance ?? 0.35
    ];
    for (let i = 0; i < 5; i++) cur.p[i] += pv[i] ?? 0;
    for (let i = 0; i < 5; i++) cur.r[i] += rv[i];
    cur.be += s.branchEntropy ?? 0;
    cur.cs += s.conflictSeverity ?? 0;
    acc.set(id, cur);
  }
  const out = new Map();
  for (const [id, v] of acc) {
    const n = Math.max(1, v.n);
    out.set(id, {
      regionId: id,
      pressureMean: v.p.map((x) => clamp01(x / n)),
      resonanceMean: v.r.map((x) => clamp01(x / n)),
      branchEntropy: clamp01(v.be / n),
      conflictSeverity: clamp01(v.cs / n)
    });
  }
  return out;
}
