/**
 * Rhizoh Geometry Layer — TopologyEvent + drift vectors (observation only).
 * RESEARCH-ONLY — Geometry → Execution is forbidden.
 */

import { RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 } from "./rhizohGeometryPatternFamilyV0.js";

export const RHIZOH_TOPOLOGY_EVENT_SCHEMA_V0 = "rhizoh.topology_event.v0";
export const RHIZOH_TOPOLOGY_DRIFT_SCHEMA_V0 = "rhizoh.topology_drift.v0";

/**
 * @param {{
 *   sourceSpace: string,
 *   topologyType: string,
 *   patternFamily?: string,
 *   entity?: string,
 *   from?: readonly number[],
 *   to?: readonly number[],
 *   deltaMagnitude?: number,
 *   metrics?: Record<string, unknown>
 * }} raw
 */
export function freezeTopologyEventV0(raw) {
  const family = raw.patternFamily || raw.topologyType;
  return Object.freeze({
    schema: RHIZOH_TOPOLOGY_EVENT_SCHEMA_V0,
    sourceSpace: String(raw.sourceSpace || "unknown"),
    topologyType: String(raw.topologyType || family || RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER),
    patternFamily: String(family || RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER),
    entity: raw.entity != null ? String(raw.entity) : null,
    from: Object.freeze([...(raw.from || [])]),
    to: Object.freeze([...(raw.to || [])]),
    deltaMagnitude: Math.max(0, Math.min(1, Number(raw.deltaMagnitude) || 0)),
    metrics: Object.freeze({ ...(raw.metrics || {}) })
  });
}

/**
 * Compare played vs expected topology — Z-axis drift magnitude.
 * @param {ReturnType<typeof freezeTopologyEventV0>|null} played
 * @param {ReturnType<typeof freezeTopologyEventV0>|null} expected
 */
export function calculateTopologyDriftV0(played, expected) {
  if (!played || !expected) {
    return Object.freeze({
      schema: RHIZOH_TOPOLOGY_DRIFT_SCHEMA_V0,
      magnitude: 1,
      familyMatch: false,
      magnitudeDelta: 1,
      playedFamily: played?.patternFamily || null,
      expectedFamily: expected?.patternFamily || null
    });
  }

  const familyMatch = played.patternFamily === expected.patternFamily;
  const magnitudeDelta = Math.abs(played.deltaMagnitude - expected.deltaMagnitude);
  const familyPenalty = familyMatch ? 0 : 0.45;
  const magnitude = Math.min(1, familyPenalty + magnitudeDelta * 0.55);

  return Object.freeze({
    schema: RHIZOH_TOPOLOGY_DRIFT_SCHEMA_V0,
    magnitude,
    familyMatch,
    magnitudeDelta,
    playedFamily: played.patternFamily,
    expectedFamily: expected.patternFamily
  });
}
