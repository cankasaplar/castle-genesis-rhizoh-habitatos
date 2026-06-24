/**
 * Go learning spacetime observation envelope — space · time · world anchor on samples.
 * RESEARCH-ONLY — interpretation only; no execution authority.
 * @see docs/RHIZOH_GO_SPACETIME_OBSERVATION_CONTRACT_V0.md
 */

import { getExecutionPhaseSnapshotV0 } from "./executionPhaseSynchronizerV0.js";
import { getSpatialTemporalTrailSnapshotV0 } from "./rhizohSpatialTemporalTrailV0.js";

export const GO_SPACETIME_OBSERVATION_ENVELOPE_SCHEMA_V0 =
  "castle.rhizoh.go_spacetime_observation_envelope.v0";

export const GO_CAUSAL_SPACE_ID_V0 = "go.causal.space";

/**
 * @param {{
 *   nodeId?: string,
 *   channelId?: string,
 *   mapPinSource?: string,
 *   locale?: string
 * }} [opts]
 */
export function buildGoSpacetimeObservationEnvelopeV0(opts = {}) {
  const phaseSnap = getExecutionPhaseSnapshotV0();
  const phase = phaseSnap?.currentPhase;
  const trail = getSpatialTemporalTrailSnapshotV0();
  const now = Date.now();

  return Object.freeze({
    schema: GO_SPACETIME_OBSERVATION_ENVELOPE_SCHEMA_V0,
    causalSpaceId: GO_CAUSAL_SPACE_ID_V0,
    observationWindow: Object.freeze({
      startMs: Number(phase?.windowStartMs) || now,
      endMs: now,
      phaseId: String(phase?.phaseId || "phase_unknown")
    }),
    worldAnchor: Object.freeze({
      nodeId: String(opts.nodeId || "go_arena"),
      channelId: String(opts.channelId || "rhizoh_go_learning"),
      mapPinSource: String(opts.mapPinSource || "map:node:go")
    }),
    temporalTrailSeq: Number.isFinite(trail?.count) ? trail.count : null,
    locale: String(opts.locale || "tr"),
    interpretationOnly: true,
    atMs: now
  });
}
