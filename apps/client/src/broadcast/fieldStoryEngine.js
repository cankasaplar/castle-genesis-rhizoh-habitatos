/**
 * vNext-542 — Bridge frame → structured story beats (locale-agnostic numbers + ids).
 */

import { fieldSampleToCell } from "../kernel/render/fieldAtlasBuilder.js";
import { sampleConstitutionalWeather } from "../kernel/render/constitutionalWeather.js";
import { ISTANBUL_DISTRICT_LABEL_TR } from "../scene/istanbulBiomePresetV540.js";

/**
 * @typedef {object} FieldStoryBeats
 * @property {string | null} peakContradictionRegionId
 * @property {number} peakContradiction
 * @property {string | null} peakMemoryRegionId
 * @property {number} peakMemory
 * @property {number} meanTruth
 * @property {number} meanTurbulence
 * @property {number} meanBranchEntropy
 * @property {number} meanConflict
 * @property {object} sovereign
 */

/**
 * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
 * @returns {FieldStoryBeats}
 */
export function buildFieldStoryBeats(frame) {
  const map = frame.regionalMap;
  if (!(map instanceof Map) || map.size === 0) {
    return {
      peakContradictionRegionId: null,
      peakContradiction: 0,
      peakMemoryRegionId: null,
      peakMemory: 0,
      meanTruth: 0,
      meanTurbulence: 0,
      meanBranchEntropy: 0,
      meanConflict: 0,
      sovereign: frame.overlayState?.rhizohSovereign ?? {}
    };
  }

  let peakC = { id: /** @type {string | null} */ (null), v: -1 };
  let peakM = { id: /** @type {string | null} */ (null), v: -1 };
  let sumT = 0;
  let sumW = 0;
  let sumBe = 0;
  let sumCs = 0;
  let n = 0;

  for (const [id, sample] of map) {
    const cell = fieldSampleToCell(sample);
    const w = sampleConstitutionalWeather(cell);
    if (cell.contradiction > peakC.v) peakC = { id, v: cell.contradiction };
    if (cell.memory > peakM.v) peakM = { id, v: cell.memory };
    sumT += w.turbulence;
    sumW += cell.truth;
    sumBe += sample.branchEntropy ?? 0;
    sumCs += sample.conflictSeverity ?? 0;
    n++;
  }

  const inv = n > 0 ? 1 / n : 0;
  return {
    peakContradictionRegionId: peakC.id,
    peakContradiction: peakC.v,
    peakMemoryRegionId: peakM.id,
    peakMemory: peakM.v,
    meanTruth: sumW * inv,
    meanTurbulence: sumT * inv,
    meanBranchEntropy: sumBe * inv,
    meanConflict: sumCs * inv,
    sovereign: frame.overlayState?.rhizohSovereign ?? {}
  };
}

/**
 * @param {string | null} regionId
 * @param {string} [fallback]
 */
export function districtDisplayName(regionId, fallback = "") {
  if (!regionId) return fallback;
  return ISTANBUL_DISTRICT_LABEL_TR[regionId] || regionId;
}
