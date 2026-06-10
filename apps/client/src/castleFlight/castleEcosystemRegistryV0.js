/**
 * Castle ecosystem registry — curated Istanbul intelligence/culture nodes (SSOT).
 * Aligned with worldPresence projection; not Overpass POI churn.
 */

export const CASTLE_ECOSYSTEM_REGISTRY_CONTRACT_V0 = "castle.ecosystem_registry.v0";

/** @typedef {'academy'|'sound_stage'|'culture_portal'|'resonance_hub'} CastleEcosystemCategoryV0 */

/**
 * @type {Record<string, {
 *   id: string,
 *   name: string,
 *   category: CastleEcosystemCategoryV0,
 *   coordinates: { latitude: number, longitude: number, height: number },
 *   color: string,
 *   description: string
 * }>}
 */
export const CASTLE_ECOSYSTEM_REGISTRY_V0 = Object.freeze({
  "academy-node-1": Object.freeze({
    id: "academy-node-1",
    name: "BAU / Beşiktaş Campus",
    category: "academy",
    coordinates: Object.freeze({ latitude: 41.0428, longitude: 29.0075, height: 10 }),
    color: "#FFB300",
    description: "Ecosystem Intelligence Hub"
  }),
  "culture-node-1": Object.freeze({
    id: "culture-node-1",
    name: "Zorlu PSM",
    category: "sound_stage",
    coordinates: Object.freeze({ latitude: 41.066, longitude: 29.0171, height: 35 }),
    color: "#D500F9",
    description: "Resonance & Audio Layer"
  }),
  "culture-node-2": Object.freeze({
    id: "culture-node-2",
    name: "Akbank Sanat / Taksim",
    category: "culture_portal",
    coordinates: Object.freeze({ latitude: 41.0352, longitude: 28.9832, height: 20 }),
    color: "#FF1744",
    description: "Epistemic Exhibition Node"
  }),
  "culture-node-3": Object.freeze({
    id: "culture-node-3",
    name: "Sinan Erdem Sports Hall",
    category: "sound_stage",
    coordinates: Object.freeze({ latitude: 40.995, longitude: 29.085, height: 25 }),
    color: "#E040FB",
    description: "Arena Resonance Shell"
  }),
  "academy-node-2": Object.freeze({
    id: "academy-node-2",
    name: "Maslak Innovation Strip",
    category: "resonance_hub",
    coordinates: Object.freeze({ latitude: 41.1088, longitude: 29.0178, height: 18 }),
    color: "#FF9100",
    description: "North corridor tech gravity"
  })
});

/**
 * @returns {readonly (typeof CASTLE_ECOSYSTEM_REGISTRY_V0)[string][]}
 */
export function listCastleEcosystemNodesV0() {
  return Object.freeze(Object.values(CASTLE_ECOSYSTEM_REGISTRY_V0));
}

/**
 * @param {string} id
 */
export function getCastleEcosystemNodeByIdV0(id) {
  return CASTLE_ECOSYSTEM_REGISTRY_V0[String(id || "")] || null;
}

/** Mirror for worldPresence / debug overlays (read-only). */
export function publishCastleEcosystemRegistryMirrorV0() {
  if (typeof window === "undefined") return;
  window.__CASTLE_ECOSYSTEM_REGISTRY__ = Object.freeze({
    schema: CASTLE_ECOSYSTEM_REGISTRY_CONTRACT_V0,
    count: listCastleEcosystemNodesV0().length,
    nodes: listCastleEcosystemNodesV0()
  });
}
