/**
 * Conversation center anchor — species registry + env swap (octo_v1 | fox_v1).
 * Identity projection only; fieldState read-only reflect on anchor mesh.
 */

import {
  OBSERVER_SPECIES_FOX_V1,
  OBSERVER_SPECIES_OCTO_V1,
  resolveObserverSpeciesV0
} from "./observerSpeciesRegistryV0.js";

export const CONVERSATION_ANCHOR_SPECIES_ENV_V0 = "VITE_RHIZOH_CONVERSATION_ANCHOR_SPECIES";

/**
 * @returns {string}
 */
export function resolveConversationAnchorSpeciesIdV0() {
  const raw = String(import.meta.env?.[CONVERSATION_ANCHOR_SPECIES_ENV_V0] || "octo_v1").trim();
  const species = resolveObserverSpeciesV0(raw);
  return species?.id || OBSERVER_SPECIES_FOX_V1.id;
}

/**
 * @param {string} [speciesId]
 * @returns {string}
 */
export function resolveConversationAnchorModelUrlV0(speciesId) {
  const id = String(speciesId || resolveConversationAnchorSpeciesIdV0()).trim();
  const species = resolveObserverSpeciesV0(id) || OBSERVER_SPECIES_FOX_V1;
  return String(species.modelRef || "/models/fox1.glb");
}

/**
 * @param {string} [speciesId]
 */
export function isOctoAnchorSpeciesV0(speciesId) {
  return String(speciesId || "").trim() === OBSERVER_SPECIES_OCTO_V1.id;
}

export function isFoxAnchorSpeciesV0(speciesId) {
  return String(speciesId || "").trim() === OBSERVER_SPECIES_FOX_V1.id;
}
