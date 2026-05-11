/**
 * vNext-545 — Ghost companion: constitutional epoch ≠ ghostLineageHash (ayrı evrim hattı).
 */

import { buildGhostGenomeFromHabitatFrame, fnv1aGhostLineageCombine } from "./ghostGenome.js";
import { GhostEvolutionStage, resolveGhostStage } from "./ghostEvolution.js";
import { createGhostMemory } from "./ghostMemory.js";
import { buildGhostStreamLowerThirdLines, narrateGhostAmbientLine } from "./ghostNarrator.js";

const DREAM_TAGS = Object.freeze([
  "ripple-fossil",
  "glow-cipher",
  "storm-whisker",
  "quorum-shed",
  "bosphorus-dream"
]);

/**
 * @param {string} hash
 */
export function traitTagFromArtifactHash(hash) {
  let h = 2166136261;
  const s = String(hash || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return DREAM_TAGS[h % DREAM_TAGS.length];
}

/**
 * @param {readonly import("../kernel/render/branchRiverRenderer.js").BranchRiverSegment[]} segments
 * @returns {string[]}
 */
export function extractDreamFossilHashesFromBranches(segments) {
  const out = [];
  for (const seg of segments || []) {
    if (seg.kind === "pruned" && seg.toHash) out.push(seg.toHash);
  }
  return out;
}

/**
 * @param {object} [opts]
 * @param {string} [opts.citySpiritId]
 * @param {string} [opts.initialGhostLineageHash]
 */
export function createGhostCompanionState(opts = {}) {
  const citySpiritId = opts.citySpiritId ?? "istanbul";
  let ghostLineageHash = opts.initialGhostLineageHash ?? "0xghost-genesis";
  let lineageAgeEma = 0;
  /** @type {import("./ghostEvolution.js").GhostEvolutionStageId} */
  let lastStage = GhostEvolutionStage.Hatchling;
  /** @type {Map<string, { acquiredAt: number, traitTag: string }>} */
  const dreamFossils = new Map();
  const memory = createGhostMemory(opts.memory);

  /**
   * @param {string} hash
   */
  function ingestDreamFossil(hash) {
    if (!hash || dreamFossils.has(hash)) return false;
    const traitTag = traitTagFromArtifactHash(hash);
    dreamFossils.set(hash, { acquiredAt: Date.now(), traitTag });
    ghostLineageHash = `0x${fnv1aGhostLineageCombine(ghostLineageHash, hash).toString(16)}`;
    return true;
  }

  return {
    get citySpiritId() {
      return citySpiritId;
    },
    get ghostLineageHash() {
      return ghostLineageHash;
    },
    get dreamFossilCount() {
      return dreamFossils.size;
    },

    /**
     * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} frame
     * @param {object} [extra]
     * @param {string[]} [extra.collapsedArtifactHashes] collapsed branch / dream fossil
     */
    updateFromHabitatFrame(frame, extra = {}) {
      /** @type {string[]} */
      const newSeeds = [];
      for (const h of extra.collapsedArtifactHashes || []) {
        if (ingestDreamFossil(h)) newSeeds.push(h);
      }
      for (const h of extractDreamFossilHashesFromBranches(frame.branchSegments)) {
        if (ingestDreamFossil(h)) newSeeds.push(h);
      }

      const seedBonus = Math.min(0.38, dreamFossils.size * 0.035);
      const genome = buildGhostGenomeFromHabitatFrame(frame, {
        lineageAge: lineageAgeEma,
        mutationSeedBonus: seedBonus
      });
      lineageAgeEma = Math.max(0, Math.min(1, lineageAgeEma * 0.996 + genome.memoryDepth * 0.004));

      const stage = resolveGhostStage(genome);
      if (stage !== lastStage) {
        ghostLineageHash = `0x${fnv1aGhostLineageCombine(ghostLineageHash, `stage:${stage}`).toString(16)}`;
        lastStage = stage;
      }

      memory.push({
        habitatFingerprint: frame.frameFingerprint,
        genome,
        stage
      });

      /** @type {import("./ghostNarrator.js").GhostStateSummary} */
      const summary = {
        citySpiritId,
        stage,
        stageCue: stage,
        genome,
        ghostLineageHash,
        dreamFossilCount: dreamFossils.size,
        lastMutationPing: newSeeds.length ? traitTagFromArtifactHash(newSeeds[newSeeds.length - 1]) : null
      };

      return Object.freeze({
        summary,
        ghostLineageHash,
        genome,
        stage,
        newDreamFossils: Object.freeze(newSeeds),
        ambientLine: narrateGhostAmbientLine(summary),
        streamGhostLines: buildGhostStreamLowerThirdLines(summary)
      });
    },

    memory
  };
}
