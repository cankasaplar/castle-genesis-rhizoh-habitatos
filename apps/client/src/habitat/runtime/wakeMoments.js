/**
 * vNext-543 — Major event → anında uyanma (ör. sismik sıçrama, çatışma ortalaması sıçraması).
 * vNext-547 — Ortalama contradiction sıçraması (episodic climax).
 */

import { fieldSampleToCell } from "../../kernel/render/fieldAtlasBuilder.js";

/**
 * @param {import("../../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
 */
export function meanContradiction01(frame) {
  const m = frame.regionalMap;
  if (!(m instanceof Map) || !m.size) return 0;
  let s = 0;
  for (const [, v] of m) {
    s += fieldSampleToCell(v).contradiction;
  }
  return s / m.size;
}

/**
 * @param {import("../../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame | null} prev
 * @param {import("../../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} next
 * @param {object} [opts]
 * @param {number} [opts.seismicJump] min delta seismicMicro
 * @param {number} [opts.conflictJump] min delta mean conflictSeverity across map
 */
export function scoreWakeMoment(prev, next, opts = {}) {
  if (!prev?.regionalMap || !next?.regionalMap) return 0;
  const seismicPrev = prev.overlayState?.weatherSummary?.seismicMicro ?? 0;
  const seismicNext = next.overlayState?.weatherSummary?.seismicMicro ?? 0;
  const dSeismic = seismicNext - seismicPrev;

  const meanCs = (frame) => {
    const m = frame.regionalMap;
    if (!(m instanceof Map) || !m.size) return 0;
    let s = 0;
    for (const [, v] of m) s += v.conflictSeverity ?? 0;
    return s / m.size;
  };
  const dConflict = meanCs(next) - meanCs(prev);

  const thS = opts.seismicJump ?? 0.12;
  const thC = opts.conflictJump ?? 0.14;

  let score = 0;
  if (dSeismic >= thS) score = Math.max(score, Math.min(1, dSeismic * 2.2));
  if (dConflict >= thC) score = Math.max(score, Math.min(1, dConflict * 2.5));
  return score;
}

/**
 * @param {number} score
 * @param {number} [threshold]
 */
export function shouldWakeImmediately(score, threshold = 0.45) {
  return score >= threshold;
}

/**
 * Sismik + conflict + **contradiction spike** (habitat dramaturji).
 * @param {import("../../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame | null} prev
 * @param {import("../../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} next
 * @param {object} [opts]
 * @param {number} [opts.contradictionDelta] min ortalama contradiction artışı
 */
export function scoreHabitatWake(prev, next, opts = {}) {
  const base = scoreWakeMoment(prev, next, opts);
  if (!prev?.regionalMap || !next?.regionalMap) return base;
  const dCon = meanContradiction01(next) - meanContradiction01(prev);
  const th = opts.contradictionDelta ?? 0.11;
  const spike = dCon >= th ? Math.min(1, dCon * 2.65) : 0;
  return Math.max(base, spike);
}
