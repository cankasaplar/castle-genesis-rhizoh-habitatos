/**
 * vNext-545 — City Spirit Genome: habitat karesi → 0–1 fenotip vektörü.
 */

import { clamp01 } from "../kernel/constitutional/constitutionalState.js";
import { fieldSampleToCell } from "../kernel/render/fieldAtlasBuilder.js";
import { sampleConstitutionalWeather } from "../kernel/render/constitutionalWeather.js";

/**
 * @typedef {object} GhostGenome
 * @property {number} vitality
 * @property {number} calm
 * @property {number} curiosity
 * @property {number} wisdom
 * @property {number} playfulness
 * @property {number} resilience
 * @property {number} scarTension
 * @property {number} sovereignBond
 * @property {number} lineageAge
 * @property {number} memoryDepth
 * @property {number} mutationBloom
 */

/**
 * @param {string | number | undefined | null} tier
 */
export function sovereignTierToBond01(tier) {
  if (tier == null) return 0.55;
  if (typeof tier === "number" && Number.isFinite(tier)) return clamp01(0.35 + tier * 0.12);
  const s = String(tier);
  const m = /^L?\s*(\d+)/i.exec(s);
  if (m) return clamp01(0.42 + Number(m[1]) * 0.11);
  if (/mythic/i.test(s)) return 0.94;
  if (/oracle/i.test(s)) return 0.82;
  return 0.55;
}

/**
 * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
 * @param {object} [opts]
 * @param {number} [opts.lineageAge] companion EMA veya sabit yaş [0–1]
 * @param {number} [opts.mutationSeedBonus] dream fossil trait bonus [0–1]
 */
export function buildGhostGenomeFromHabitatFrame(frame, opts = {}) {
  const map = frame.regionalMap;
  const wx = frame.overlayState?.weatherSummary ?? {};
  const sovereign = frame.overlayState?.rhizohSovereign ?? {};
  const gridStress = typeof wx.gridLatentStress === "number" ? clamp01(wx.gridLatentStress) : 0;

  let n = 0;
  let sumTruth = 0;
  let sumContra = 0;
  let sumLeg = 0;
  let sumNov = 0;
  let sumMem = 0;
  let sumBe = 0;
  let sumCs = 0;
  let sumTurb = 0;

  if (map instanceof Map) {
    for (const [, sample] of map) {
      const cell = fieldSampleToCell(sample);
      const w = sampleConstitutionalWeather(cell);
      sumTruth += cell.truth;
      sumContra += cell.contradiction;
      sumLeg += cell.legitimacy;
      sumNov += cell.novelty;
      sumMem += cell.memory;
      sumBe += sample.branchEntropy ?? 0;
      sumCs += sample.conflictSeverity ?? 0;
      sumTurb += w.turbulence;
      n++;
    }
  }

  const inv = n > 0 ? 1 / n : 0;
  const meanTruth = sumTruth * inv;
  const meanContra = sumContra * inv;
  const meanLeg = sumLeg * inv;
  const meanNov = sumNov * inv;
  const meanMem = sumMem * inv;
  const meanBe = sumBe * inv;
  const meanCs = sumCs * inv;
  const meanTurb = sumTurb * inv;

  const confidence = meanTruth;
  const seedBonus = clamp01(opts.mutationSeedBonus ?? 0);

  const vitality = clamp01(confidence * 0.88 + (1 - meanContra) * 0.12);
  const calm = clamp01(1 - meanTurb * 0.72 - meanContra * 0.22);
  const curiosity = clamp01(meanNov * 0.72 + meanMem * 0.08);
  const playfulness = clamp01(meanNov * 0.58 + (1 - meanContra) * 0.18 + vitality * 0.12);
  const wisdom = clamp01(meanLeg * 0.62 + (sovereign.legitimacyResonance ?? meanLeg) * 0.38);
  const resilience = clamp01(0.52 + meanTruth * 0.28 - gridStress * 0.38 - meanTurb * 0.12);
  const scarTension = clamp01(meanContra * 0.52 + meanCs * 0.38 + meanTurb * 0.14);
  const sovereignBond = clamp01(sovereignTierToBond01(sovereign.tier) * 0.62 + (sovereign.legitimacyResonance ?? 0.5) * 0.38);

  const lineageAge = clamp01(
    typeof opts.lineageAge === "number" ? opts.lineageAge : meanMem * 0.45 + meanTruth * 0.25 + (1 - scarTension) * 0.12
  );
  const memoryDepth = clamp01(meanMem * 0.82 + meanBe * 0.12 + meanLeg * 0.06);
  const mutationBloom = clamp01(meanBe * 0.55 + seedBonus * 0.35 + meanNov * 0.18);

  return Object.freeze({
    vitality,
    calm,
    curiosity,
    wisdom,
    playfulness,
    resilience,
    scarTension,
    sovereignBond,
    lineageAge,
    memoryDepth,
    mutationBloom
  });
}

/**
 * @param {string} a
 * @param {string} b
 */
export function fnv1aGhostLineageCombine(a, b) {
  let h = 2166136261;
  const s = `${a}::${b}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
