/**
 * vNext-545 — Renderer hook: Three / WebGPU sahnesine bağlamadan saf veri ipuçları.
 * (Cyclic import yok; `three` import edilmez.)
 */

import { stageVisualCue } from "./ghostEvolution.js";
import { fieldSampleToCell } from "../kernel/render/fieldAtlasBuilder.js";

/**
 * @typedef {object} GhostRendererHints
 * @property {string} groupName
 * @property {number} coreScale
 * @property {number} tailSegmentHint
 * @property {number} echoMistOpacity
 * @property {number} crystalEyeEmissive01
 * @property {boolean} showMemoryHalo
 * @property {boolean} showAntlerCrown
 * @property {string} visualCue
 */

/**
 * @param {string} citySpiritId örn. "istanbul"
 * @param {import("./ghostGenome.js").GhostGenome} genome
 * @param {import("./ghostEvolution.js").GhostEvolutionStageId} stage
 * @returns {GhostRendererHints}
 */
export function buildGhostRendererHints(citySpiritId, genome, stage) {
  const cue = stageVisualCue(stage);
  const coreScale = 0.28 + genome.vitality * 0.62 + genome.mutationBloom * 0.12;
  const tailSeg =
    stage === "Hatchling" ? 4 : stage === "Wanderer" ? 9 : stage === "Keeper" ? 12 : stage === "Oracle" ? 16 : 20;

  return Object.freeze({
    groupName: `GhostSpirit:${citySpiritId}`,
    coreScale,
    tailSegmentHint: tailSeg,
    echoMistOpacity: clamp(0.08 + genome.memoryDepth * 0.42 + genome.calm * 0.08, 0, 1),
    crystalEyeEmissive01: clamp(0.35 + genome.curiosity * 0.45 + genome.wisdom * 0.15, 0, 1),
    showMemoryHalo: genome.memoryDepth > 0.42 || stage === "Keeper" || stage === "Oracle" || stage === "Mythic",
    showAntlerCrown: stage === "Oracle" || stage === "Mythic",
    visualCue: cue
  });
}

/**
 * İlçe orb’larına yakınlık: constitutional novelty + memory (koklama hedefi).
 * @param {string} regionId
 * @param {ReadonlyMap<string, import("../kernel/render/fieldAtlasBuilder.js").FieldSample>} regionalMap
 */
export function ghostDistrictAffinity01(regionId, regionalMap) {
  if (!(regionalMap instanceof Map)) return 0;
  const s = regionalMap.get(regionId);
  if (!s) return 0;
  const c = fieldSampleToCell(s);
  return clamp(0.2 + c.novelty * 0.35 + c.memory * 0.4 + (1 - c.contradiction) * 0.15, 0, 1);
}

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}
