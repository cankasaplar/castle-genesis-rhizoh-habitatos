/**
 * Phase 9.4.1+ — Observation plane window mirror (Epistemic Perception Layer).
 * Does not write execution tokens or worldPresence.
 */

/** @type {import('./epistemicPerceptionMirrorV0.js').EpistemicPerceptionMirrorV0 | null} */
let mirrorV0 = null;

/**
 * @typedef {Object} EpistemicPerceptionMirrorV0
 * @property {boolean} enabled
 * @property {string} schema
 * @property {{ execution: string, interpretation: string, observation: string }} planes
 * @property {import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicNavigationPhysicsV0 | null} navigationPhysics
 * @property {import('./continuity/__research__/causalTerrainMutationV0.js').EpistemicPhysicsEventV0[]} physicsEvents
 * @property {import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} [eventTraceTail]
 * @property {import('./epistemicSimResearchStoreV0.js').EpistemicSimResearchSnapshotV0 | null} simSnapshot
 */

export const EPISTEMIC_PERCEPTION_MIRROR_SCHEMA_V0 = "castle.rhizoh.epistemic_perception_mirror.v0";

const THREE_PLANES_V0 = Object.freeze({
  execution: "execution_plane_frozen_core",
  interpretation: "interpretation_plane_phase9_research",
  observation: "observation_plane_epistemic_perception"
});

/**
 * @param {{
 *   enabled?: boolean,
 *   simSnapshot?: import('./epistemicSimResearchStoreV0.js').EpistemicSimResearchSnapshotV0 | null,
 *   navigationPhysics?: object | null,
 *   physicsEvents?: object[],
 *   eventTraceTail?: import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]
 * }} input
 */
export function setEpistemicPerceptionMirrorV0(input) {
  mirrorV0 = {
    enabled: input.enabled === true,
    schema: EPISTEMIC_PERCEPTION_MIRROR_SCHEMA_V0,
    planes: { ...THREE_PLANES_V0 },
    navigationPhysics: input.navigationPhysics ?? null,
    physicsEvents: Array.isArray(input.physicsEvents) ? input.physicsEvents : [],
    eventTraceTail: Array.isArray(input.eventTraceTail) ? input.eventTraceTail : [],
    simSnapshot: input.simSnapshot ?? null
  };

  if (typeof window !== "undefined") {
    window.__rhizoh_epistemic_perception = mirrorV0;
  }
}

export function clearEpistemicPerceptionMirrorV0() {
  mirrorV0 = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__rhizoh_epistemic_perception;
    } catch {
      /* noop */
    }
  }
}

/**
 * @returns {EpistemicPerceptionMirrorV0 | null}
 */
export function getEpistemicPerceptionMirrorV0() {
  return mirrorV0;
}

/**
 * @returns {number}
 */
export function getEpistemicNavigationMoveScaleV0() {
  const scale = Number(mirrorV0?.navigationPhysics?.moveScale);
  if (!mirrorV0?.enabled || !Number.isFinite(scale)) return 1;
  return Math.max(0.15, Math.min(1.5, scale));
}
