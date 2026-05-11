/**
 * observe(world, memory, interaction, agent) → ObservationVector
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

function n(v, d) {
  return typeof v === "number" && !Number.isNaN(v) ? clamp01(v) : d;
}

/**
 * @param {object} input
 * @param {Record<string, unknown>} [input.worldState]
 * @param {Record<string, unknown>} [input.memoryState]
 * @param {Record<string, unknown>} [input.interactionState]
 * @param {Record<string, unknown>} [input.agentState]
 */
export function observe({
  worldState = {},
  memoryState = {},
  interactionState = {},
  agentState = {},
  observationFilter = null
} = {}) {
  const base = {
    novelty: n(/** @type {number} */ (worldState.novelty), 0.32),
    coherence: n(/** @type {number} */ (worldState.coherence), 0.62),
    uncertainty: n(/** @type {number} */ (interactionState.uncertainty), 0.38),
    conflict: n(/** @type {number} */ (agentState.conflict), 0.18),
    salience: n(/** @type {number} */ (memoryState.salience), 0.52)
  };
  return applyObservationFilter(base, observationFilter);
}

/**
 * @param {ReturnType<typeof observe>} obs
 * @param {{ coherenceLift?: number, uncertaintyDamp?: number, salienceBoost?: number, noveltyDamp?: number, conflictDamp?: number } | null} filter
 */
export function applyObservationFilter(obs, filter) {
  if (!filter) return obs;
  const uDamp = clamp01(filter.uncertaintyDamp ?? 0);
  const nDamp = clamp01(filter.noveltyDamp ?? 0);
  const cDamp = clamp01(filter.conflictDamp ?? 0);
  return {
    novelty: clamp01(obs.novelty * (1 - nDamp)),
    coherence: clamp01(obs.coherence + (filter.coherenceLift ?? 0)),
    uncertainty: clamp01(obs.uncertainty * (1 - uDamp)),
    conflict: clamp01(obs.conflict * (1 - cDamp)),
    salience: clamp01(obs.salience + (filter.salienceBoost ?? 0))
  };
}
