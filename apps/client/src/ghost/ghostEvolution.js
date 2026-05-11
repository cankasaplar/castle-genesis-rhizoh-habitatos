/**
 * vNext-545 — Ghost evolution stages (City Spirit lifecycle).
 */

/** @typedef {"Hatchling" | "Wanderer" | "Keeper" | "Oracle" | "Mythic"} GhostEvolutionStageId */

export const GhostEvolutionStage = Object.freeze({
  Hatchling: /** @type {const} */ ("Hatchling"),
  Wanderer: /** @type {const} */ ("Wanderer"),
  Keeper: /** @type {const} */ ("Keeper"),
  Oracle: /** @type {const} */ ("Oracle"),
  Mythic: /** @type {const} */ ("Mythic")
});

/**
 * @param {import("./ghostGenome.js").GhostGenome} genome
 * @returns {GhostEvolutionStageId}
 */
export function resolveGhostStage(genome) {
  const evo =
    genome.vitality * 0.11 +
    genome.calm * 0.09 +
    genome.wisdom * 0.13 +
    genome.memoryDepth * 0.24 +
    genome.lineageAge * 0.13 +
    genome.sovereignBond * 0.11 +
    (1 - genome.scarTension) * 0.09 +
    genome.mutationBloom * 0.1;

  if (evo < 0.24) return GhostEvolutionStage.Hatchling;
  if (evo < 0.4) return GhostEvolutionStage.Wanderer;
  if (evo < 0.56) return GhostEvolutionStage.Keeper;
  if (evo < 0.72) return GhostEvolutionStage.Oracle;
  return GhostEvolutionStage.Mythic;
}

/**
 * İstanbul City Spirit — görsel/anlatım leksikonu (sahne bağlamı için).
 */
export function istanbulSpiritMorphLore() {
  return Object.freeze({
    tail: "Boğaz akışına benzeyen kuyruk",
    form: "martı · kirpi · kedi karışımı ruh",
    aura: "echo mist aura",
    eyes: "crystal eyes",
    myth: "şehir simgesi olur"
  });
}

/**
 * @param {GhostEvolutionStageId} stage
 */
export function stageVisualCue(stage) {
  switch (stage) {
    case GhostEvolutionStage.Hatchling:
      return "küçük ışık tohumu";
    case GhostEvolutionStage.Wanderer:
      return "kuyruk / iz";
    case GhostEvolutionStage.Keeper:
      return "memory halo";
    case GhostEvolutionStage.Oracle:
      return "lineage taç / antler";
    case GhostEvolutionStage.Mythic:
      return "şehir simgesi";
    default:
      return "spirit";
  }
}
