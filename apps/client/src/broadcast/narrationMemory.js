/**
 * vNext-543 — Beat geçmişi → anlatımda organizma hissi (ör. önceki contradiction dalgası).
 */

import { fieldSampleToCell } from "../kernel/render/fieldAtlasBuilder.js";
import { buildFieldStoryBeats } from "./fieldStoryEngine.js";

/**
 * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
 */
function contradictionByRegionFromFrame(frame) {
  /** @type {Map<string, number>} */
  const m = new Map();
  if (!(frame.regionalMap instanceof Map)) return m;
  for (const [id, s] of frame.regionalMap) {
    m.set(id, fieldSampleToCell(s).contradiction);
  }
  return m;
}

/**
 * @param {object} [opts]
 * @param {number} [opts.compareLagMs] default 2 saat
 * @param {number} [opts.maxEntries]
 */
export function createNarrationMemory(opts = {}) {
  const lagMs = opts.compareLagMs ?? 7_200_000;
  const maxEntries = opts.maxEntries ?? 128;
  /** @type {{ t: number, snap: Map<string, number> }[]} */
  const buf = [];

  return {
    /**
     * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
     * @param {number} [now]
     */
    record(frame, now = Date.now()) {
      buf.push({ t: now, snap: contradictionByRegionFromFrame(frame) });
      while (buf.length > maxEntries) buf.shift();
    },

    /**
     * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
     * @param {number} [now]
     */
    buildHints(frame, now = Date.now()) {
      const target = now - lagMs;
      let past = /** @type {(typeof buf)[0] | null} */ (null);
      for (const e of buf) {
        if (e.t <= target && (!past || e.t > past.t)) past = e;
      }
      if (!past) return null;

      const beats = buildFieldStoryBeats(frame);
      const rid = beats.peakContradictionRegionId;
      if (!rid) return null;

      const cur = contradictionByRegionFromFrame(frame);
      const nowC = cur.get(rid) ?? 0;
      const prevC = past.snap.get(rid) ?? 0;
      const belowWave = nowC < prevC - 0.04;
      const memoryPersistent = beats.peakMemory > 0.48;
      if (!belowWave && !(memoryPersistent && nowC < prevC - 0.02)) return null;

      return {
        contradictionRecall: {
          regionId: rid,
          belowWave,
          prevContradiction: prevC,
          nowContradiction: nowC,
          hoursApprox: lagMs / 3_600_000,
          memoryPersistent
        }
      };
    }
  };
}
