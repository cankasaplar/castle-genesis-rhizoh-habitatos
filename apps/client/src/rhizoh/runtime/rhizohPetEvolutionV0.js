/**
 * Pet Evolution v0.1 — RCAL-driven adaptive inhabitant (memory imprint + ICL-guided drift).
 * Pet ≠ static marker · evolving presence within SCR unity.
 * @see docs/RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md
 */

import { readPetCitizenV0 } from "./rhizohPetCitizenRuntimeV0.js";
import { readLastIdentityConsistencyReportV0, ICL_DRIFT_CLASS_V0 } from "./rhizohIdentityConsistencyLayerV0.js";
import { readCastleProjectionV0 } from "./rhizohCastleProjectionLayerV0.js";

export const PET_EVOLUTION_SCHEMA_V0 = "castle.rhizoh.pet_evolution.v0";

export const RHIZOH_PET_EVOLUTION_EVENT_V0 = "rhizoh:pet-evolution-v0";

/** Default behavior drift rate per tick (ICL-gated). */
export const PET_EVOLUTION_DRIFT_RATE_V0 = 0.01;

/** @type {ReturnType<typeof buildPetEvolutionSnapshotV0> | null} */
let lastEvolution = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {{
 *   castle_node_id?: string | null,
 *   interaction_weight?: number,
 *   emotional_bias?: number
 * }} [imprint]
 * @param {ReturnType<typeof buildPetEvolutionSnapshotV0>["memory_trace"] | null} [prev]
 */
export function foldPetMemoryTraceV0(imprint, prev = null) {
  const visited = [...(prev?.visited_castles || [])];
  const weights = [...(prev?.interaction_weight || [])];
  const biases = [...(prev?.emotional_bias || [])];

  if (imprint?.castle_node_id && !visited.includes(imprint.castle_node_id)) {
    visited.push(imprint.castle_node_id);
  }
  if (Number.isFinite(imprint?.interaction_weight)) {
    weights.push(Number(imprint.interaction_weight));
  }
  if (Number.isFinite(imprint?.emotional_bias)) {
    biases.push(Number(imprint.emotional_bias));
  }

  return Object.freeze({
    visited_castles: Object.freeze(visited.slice(-32)),
    interaction_weight: Object.freeze(weights.slice(-64)),
    emotional_bias: Object.freeze(biases.slice(-64))
  });
}

/**
 * @param {{
 *   pet?: ReturnType<typeof readPetCitizenV0> | null,
 *   icl?: ReturnType<typeof readLastIdentityConsistencyReportV0> | null,
 *   castle?: ReturnType<typeof readCastleProjectionV0> | null,
 *   memory_trace?: ReturnType<typeof foldPetMemoryTraceV0> | null
 * }} [ctx]
 */
export function buildPetEvolutionSnapshotV0(ctx = {}) {
  const rh = readRhizohV0();
  const pet = ctx.pet ?? readPetCitizenV0() ?? rh.petCitizen;
  const icl = ctx.icl ?? readLastIdentityConsistencyReportV0();
  const castle = ctx.castle ?? readCastleProjectionV0();
  const prev = ctx.memory_trace ?? rh.petEvolution?.memory_trace ?? null;

  const iclOk =
    icl?.equivalence?.same_world !== false &&
    icl?.drift?.drift_class !== ICL_DRIFT_CLASS_V0.IDENTITY_BREAK;

  const memoryTrace = foldPetMemoryTraceV0(
    {
      castle_node_id: castle?.castle_node_id || null,
      interaction_weight: pet?.inhabited ? 0.05 : 0,
      emotional_bias: pet?.validates_scr ? 0.02 : 0
    },
    prev
  );

  const driftRate = iclOk ? PET_EVOLUTION_DRIFT_RATE_V0 : 0;
  const crossCastleAware = memoryTrace.visited_castles.length > 0;

  return Object.freeze({
    schema: PET_EVOLUTION_SCHEMA_V0,
    atMs: Date.now(),
    pet_id: pet?.pet_id || "pet_citizen_v0",
    inhabited: pet?.inhabited === true,
    memory_trace: memoryTrace,
    behavior: Object.freeze({
      drift_rate: driftRate,
      adaptation: "icl_guided",
      state: iclOk ? "emergent" : "frozen",
      cross_castle_aware: crossCastleAware,
      scr_unity_preserved: true
    }),
    ok: pet?.inhabited === true && iclOk
  });
}

/**
 * @param {object} [ctx]
 */
export function tickPetEvolutionV0(ctx = {}) {
  const snapshot = buildPetEvolutionSnapshotV0(ctx);
  lastEvolution = snapshot;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.petEvolution = snapshot;
    if (window.__rhizoh.petCitizen?.inhabited) {
      window.__rhizoh.petCitizen = Object.freeze({
        ...window.__rhizoh.petCitizen,
        evolution: Object.freeze({
          memory_trace: snapshot.memory_trace,
          behavior: snapshot.behavior
        })
      });
    }
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_PET_EVOLUTION_EVENT_V0, {
          detail: Object.freeze({ evolution: snapshot })
        })
      );
    } catch {
      /* noop */
    }
  }

  return snapshot;
}

export function readPetEvolutionV0() {
  return (
    lastEvolution ||
    (typeof window !== "undefined" ? window.__rhizoh?.petEvolution : null) ||
    null
  );
}

export function resetRhizohPetEvolutionForTestV0() {
  lastEvolution = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.petEvolution;
  }
}
