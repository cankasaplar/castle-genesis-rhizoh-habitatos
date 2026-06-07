/**
 * Observer species registry v0 — geometry interaction profiles (not chat personas).
 * Octo = baseline observer; Fox = divergence stress test (fast scan, high branching).
 * RESEARCH-ONLY scaffolding for multi-instance cognitive field.
 * @see docs/RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md
 */

export const OBSERVER_SPECIES_SCHEMA_V0 = "castle.observer_species.v0";

/** @typedef {{
 *   id: string,
 *   label: string,
 *   modelRef?: string,
 *   traits: { scanSpeed: string, curiosityBias: string, stability: string, patternJump: string },
 *   geometryAffinity: Record<string, number>,
 *   topologyWrite: false
 * }} ObserverSpeciesV0 */

/** @type {Readonly<ObserverSpeciesV0>} */
export const OBSERVER_SPECIES_OCTO_V1 = Object.freeze({
  id: "octo_v1",
  label: "Octo",
  modelRef: "/models/octo-blue-ringed.glb",
  traits: Object.freeze({
    scanSpeed: "medium",
    curiosityBias: "balanced",
    stability: "high",
    patternJump: "low"
  }),
  geometryAffinity: Object.freeze({
    stretch: 0.25,
    branching: 0.25,
    spiral: 0.25,
    spike: 0.25
  }),
  topologyWrite: false
});

/** @type {Readonly<ObserverSpeciesV0>} */
export const OBSERVER_SPECIES_FOX_V1 = Object.freeze({
  id: "fox_v1",
  label: "Fox",
  modelRef: "/models/fox1.glb",
  traits: Object.freeze({
    scanSpeed: "high",
    curiosityBias: "high",
    stability: "low",
    patternJump: "high"
  }),
  geometryAffinity: Object.freeze({
    branching: 0.8,
    spike: 0.6,
    spiral: 0.3,
    stretch: 0.2
  }),
  topologyWrite: false
});

/** @type {Readonly<Record<string, ObserverSpeciesV0>>} */
export const OBSERVER_SPECIES_REGISTRY_V0 = Object.freeze({
  [OBSERVER_SPECIES_OCTO_V1.id]: OBSERVER_SPECIES_OCTO_V1,
  [OBSERVER_SPECIES_FOX_V1.id]: OBSERVER_SPECIES_FOX_V1
});

/**
 * @param {string} speciesId
 * @returns {ObserverSpeciesV0 | null}
 */
export function resolveObserverSpeciesV0(speciesId) {
  const id = String(speciesId || "").trim();
  return OBSERVER_SPECIES_REGISTRY_V0[id] ?? null;
}

/**
 * Scale deposit weight by species geometry affinity (interpretation only).
 * @param {ObserverSpeciesV0 | null} species
 * @param {string} geometryKind
 * @param {number} baseWeight
 */
export function scaleAttentionBySpeciesAffinityV0(species, geometryKind, baseWeight) {
  const w = Number(baseWeight);
  if (!Number.isFinite(w) || w <= 0) return 0;
  const kind = String(geometryKind || "").toLowerCase();
  const affinity = species?.geometryAffinity?.[kind] ?? 0.25;
  return Math.min(0.07, w * (0.5 + affinity));
}
