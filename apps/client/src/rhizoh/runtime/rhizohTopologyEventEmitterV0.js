/**
 * UGE topology event emitter — observation-only CodexBus events.
 * RESEARCH-ONLY — no policy influence, no move authority.
 */

import { emitCodexBusV0 } from "../../core/CodexBusV0.js";
import { RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 } from "./rhizohGeometryPatternFamilyV0.js";

export const TOPOLOGY_EVENT_TYPES_V0 = Object.freeze({
  DRIFT_DETECTED: "TOPOLOGY_DRIFT_DETECTED",
  CLUSTER_LOCKED: "TOPOLOGY_CLUSTER_LOCKED",
  JUMP_ANOMALY: "TOPOLOGY_JUMP_ANOMALY"
});

export const TOPOLOGY_EVENT_SCHEMA_V0 = "rhizoh.topology_codex_event.v0";
export const TOPOLOGY_EVENT_LOG_TAG_V0 = "[CASTLE_uge_topology]";

const DRIFT_THRESHOLD_V0 = 0.12;
const CLUSTER_LOCK_THRESHOLD_V0 = 0.1;

/**
 * @param {object|null} played
 * @param {object|null} expected
 * @param {object|null} drift
 */
export function classifyTopologyCodexEventV0(played, expected, drift) {
  const playedFam = played?.patternFamily;
  const expectedFam = expected?.patternFamily;
  const magnitude = Number(drift?.magnitude) || 0;
  const familyMatch = Boolean(drift?.familyMatch);

  if (
    playedFam === RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP &&
    expectedFam !== RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP
  ) {
    return TOPOLOGY_EVENT_TYPES_V0.JUMP_ANOMALY;
  }

  if (
    familyMatch &&
    playedFam === RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER &&
    magnitude < CLUSTER_LOCK_THRESHOLD_V0
  ) {
    return TOPOLOGY_EVENT_TYPES_V0.CLUSTER_LOCKED;
  }

  if (!familyMatch || magnitude >= DRIFT_THRESHOLD_V0) {
    return TOPOLOGY_EVENT_TYPES_V0.DRIFT_DETECTED;
  }

  return null;
}

/**
 * @param {{
 *   eventType: string,
 *   layer?: number|string,
 *   matchId?: string|null,
 *   teacherMove?: string|null,
 *   rhizohMove?: string|null,
 *   played?: object|null,
 *   expected?: object|null,
 *   drift?: object|null
 * }} opts
 */
export function emitTopologyCodexEventV0(opts) {
  const payload = Object.freeze({
    schema: TOPOLOGY_EVENT_SCHEMA_V0,
    eventType: opts.eventType,
    layer: opts.layer ?? null,
    matchId: opts.matchId ?? null,
    teacherMove: opts.teacherMove || null,
    rhizohMove: opts.rhizohMove || null,
    canonicalPattern: opts.expected?.patternFamily || null,
    mirrorPattern: opts.played?.patternFamily || null,
    driftMagnitude: Math.max(0, Math.min(1, Number(opts.drift?.magnitude) || 0)),
    driftVector: opts.drift ? Object.freeze({ ...opts.drift }) : null,
    governance: Object.freeze({
      mode: "silent_observer",
      policyInfluence: false,
      moveInfluence: false
    }),
    observedAt: new Date().toISOString()
  });

  emitCodexBusV0(opts.eventType, payload, {
    source: "rhizoh_topology_event_emitter_v0",
    observationOnly: true
  });

  if (typeof console !== "undefined" && console.info) {
    console.info(TOPOLOGY_EVENT_LOG_TAG_V0, {
      eventType: payload.eventType,
      layer: payload.layer,
      canonicalPattern: payload.canonicalPattern,
      mirrorPattern: payload.mirrorPattern,
      driftMagnitude: payload.driftMagnitude
    });
  }

  return payload;
}
