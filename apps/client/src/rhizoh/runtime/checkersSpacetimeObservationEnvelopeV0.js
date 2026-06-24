/**
 * Checkers learning spacetime observation envelope.
 * RESEARCH-ONLY — interpretation only; no execution authority.
 */

import { getExecutionPhaseSnapshotV0 } from "./executionPhaseSynchronizerV0.js";
import { getSpatialTemporalTrailSnapshotV0 } from "./rhizohSpatialTemporalTrailV0.js";

export const CHECKERS_SPACETIME_OBSERVATION_ENVELOPE_SCHEMA_V0 =
  "castle.rhizoh.checkers_spacetime_observation_envelope.v0";

export const CHECKERS_CAUSAL_SPACE_ID_V0 = "checkers.causal.space";

/**
 * @param {{
 *   nodeId?: string,
 *   channelId?: string,
 *   mapPinSource?: string,
 *   locale?: string
 * }} [opts]
 */
export function buildCheckersSpacetimeObservationEnvelopeV0(opts = {}) {
  const phaseSnap = getExecutionPhaseSnapshotV0();
  const phase = phaseSnap?.currentPhase;
  const trail = getSpatialTemporalTrailSnapshotV0();
  const now = Date.now();

  return Object.freeze({
    schema: CHECKERS_SPACETIME_OBSERVATION_ENVELOPE_SCHEMA_V0,
    causalSpaceId: CHECKERS_CAUSAL_SPACE_ID_V0,
    observationWindow: Object.freeze({
      startMs: Number(phase?.windowStartMs) || now,
      endMs: now,
      phaseId: String(phase?.phaseId || "phase_unknown")
    }),
    worldAnchor: Object.freeze({
      nodeId: String(opts.nodeId || "checkers_arena"),
      channelId: String(opts.channelId || "rhizoh_checkers_learning"),
      mapPinSource: String(opts.mapPinSource || "map:node:checkers")
    }),
    temporalTrailSeq: Number.isFinite(trail?.count) ? trail.count : null,
    locale: String(opts.locale || "tr"),
    interpretationOnly: true,
    atMs: now
  });
}
