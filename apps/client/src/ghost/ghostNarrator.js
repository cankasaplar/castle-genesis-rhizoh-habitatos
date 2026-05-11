/**
 * vNext-545 — Ghost yayın / ambient anlatımı (City Spirit özetleri).
 */

/**
 * @typedef {object} GhostStateSummary
 * @property {string} citySpiritId
 * @property {import("./ghostEvolution.js").GhostEvolutionStageId} stage
 * @property {string} stageCue
 * @property {import("./ghostGenome.js").GhostGenome} genome
 * @property {string} ghostLineageHash
 * @property {number} dreamFossilCount
 * @property {string | null} lastMutationPing
 */

/**
 * @param {GhostStateSummary} s
 */
export function narrateGhostAmbientLine(s) {
  const g = s.genome;
  const bloom =
    g.memoryDepth > 0.52 ? "Memory bloom yükseliyor" : g.memoryDepth > 0.38 ? "Memory bloom ölçülü" : "Memory bloom sakin";
  const scar =
    g.scarTension > 0.55
      ? "Scar tension yükseliyor"
      : g.scarTension < 0.35
        ? "Scar tension sakinleşiyor"
        : "Scar tension dengede";
  const evolve = `${s.stage} → evolving`;
  const fossil = s.lastMutationPing ? `Yeni mutation seed: ${s.lastMutationPing}` : "";
  return [`Habitat Spirit: ${evolve}.`, bloom + ".", scar + ".", fossil].filter(Boolean).join(" ");
}

/**
 * Alt bant satırları (YouTube / TV).
 * @param {GhostStateSummary} s
 */
export function buildGhostStreamLowerThirdLines(s) {
  const g = s.genome;
  const bloom =
    g.memoryDepth > 0.52 ? "rising" : g.memoryDepth > 0.38 ? "steady" : "soft";
  const scar = g.scarTension > 0.55 ? "high" : g.scarTension < 0.35 ? "calming" : "medium";
  /** @type {{ key: string, label: string, display: string }[]} */
  const lines = [
    { key: "spirit", label: "Habitat Spirit", display: `${s.stage} → evolving` },
    { key: "memoryBloom", label: "Memory bloom", display: bloom },
    { key: "scar", label: "Scar tension", display: scar }
  ];
  if (s.lastMutationPing) {
    lines.push({ key: "mutation", label: "Mutation seed", display: s.lastMutationPing });
  }
  return lines;
}
