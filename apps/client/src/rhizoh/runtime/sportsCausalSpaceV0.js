/**
 * Sports Causal Space v0 — multi-topology registry (event-dense).
 * RESEARCH-ONLY — no execution authority.
 * @see docs/RHIZOH_SPORTS_ADAPTER_V0.md
 */

import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const SPORTS_CAUSAL_SPACE_SCHEMA_V0 = "castle.rhizoh.sports_causal_space.v0";

export const CAUSAL_SPACE_ID_V0 = Object.freeze({
  CHESS: "chess.causal.space",
  SPORTS: "sports.causal.space"
});

export const CAUSAL_SPACE_PROJECTION_V0 = Object.freeze({
  DETERMINISTIC_FIELD: "deterministic_field",
  STOCHASTIC_FIELD: "stochastic_field"
});

/** @type {Map<string, object>} */
const spaceRegistryV0 = new Map();

/** @type {Map<string, object[]>} */
const sportsMatchStreamsV0 = new Map();

function initRegistryV0() {
  if (spaceRegistryV0.size > 0) return;
  spaceRegistryV0.set(
    CAUSAL_SPACE_ID_V0.CHESS,
    Object.freeze({
      spaceId: CAUSAL_SPACE_ID_V0.CHESS,
      gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS,
      entities: Object.freeze(["white", "black"]),
      projectionType: CAUSAL_SPACE_PROJECTION_V0.DETERMINISTIC_FIELD,
      entropyModel: "closed",
      interpretationOnly: true,
      nonExecutive: true
    })
  );
  spaceRegistryV0.set(
    CAUSAL_SPACE_ID_V0.SPORTS,
    Object.freeze({
      spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
      gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS,
      entities: Object.freeze(["teamA", "teamB"]),
      projectionType: CAUSAL_SPACE_PROJECTION_V0.STOCHASTIC_FIELD,
      entropyModel: "open",
      interpretationOnly: true,
      nonExecutive: true
    })
  );
}

/**
 * @param {string} spaceId
 */
export function resolveCausalSpaceV0(spaceId) {
  initRegistryV0();
  const id = String(spaceId || CAUSAL_SPACE_ID_V0.CHESS);
  return (
    spaceRegistryV0.get(id) ||
    Object.freeze({
      spaceId: id,
      gameType: RHIZOH_UGL_GAME_TYPE_V0.CUSTOM,
      entities: Object.freeze([]),
      projectionType: "unknown",
      entropyModel: "unknown",
      interpretationOnly: true,
      nonExecutive: true
    })
  );
}

export function listCausalSpacesV0() {
  initRegistryV0();
  return Object.freeze([...spaceRegistryV0.values()]);
}

/**
 * @param {{
 *   matchId: string,
 *   teamA?: string,
 *   teamB?: string,
 *   sportId?: string
 * }} input
 */
export function openSportsCausalSpaceV0(input) {
  const matchId = String(input.matchId || "match_unknown");
  const space = Object.freeze({
    schema: SPORTS_CAUSAL_SPACE_SCHEMA_V0,
    spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
    matchId,
    entities: Object.freeze([String(input.teamA || "teamA"), String(input.teamB || "teamB")]),
    sportId: String(input.sportId || "football"),
    eventStream: Object.freeze([]),
    projectionType: CAUSAL_SPACE_PROJECTION_V0.STOCHASTIC_FIELD,
    interpretationOnly: true,
    nonExecutive: true
  });
  sportsMatchStreamsV0.set(matchId, []);
  return space;
}

/**
 * @param {string} matchId
 * @param {object} event
 */
export function appendSportsSpaceEventV0(matchId, event) {
  const id = String(matchId || "");
  if (!sportsMatchStreamsV0.has(id)) {
    openSportsCausalSpaceV0({ matchId: id });
  }
  const ring = sportsMatchStreamsV0.get(id);
  ring.unshift(event);
  if (ring.length > 256) ring.length = 256;
  return Object.freeze({
    schema: SPORTS_CAUSAL_SPACE_SCHEMA_V0,
    matchId: id,
    eventCount: ring.length,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {string} matchId
 * @param {number} [limit]
 */
export function readSportsSpaceEventsV0(matchId, limit = 32) {
  const ring = sportsMatchStreamsV0.get(String(matchId || "")) || [];
  return Object.freeze(ring.slice(0, limit));
}

export function getSportsCausalSpaceSnapshotV0(matchId) {
  const events = readSportsSpaceEventsV0(matchId, 64);
  return Object.freeze({
    schema: SPORTS_CAUSAL_SPACE_SCHEMA_V0,
    spaceId: CAUSAL_SPACE_ID_V0.SPORTS,
    matchId: String(matchId || ""),
    eventCount: events.length,
    recentEvents: events,
    projectionType: CAUSAL_SPACE_PROJECTION_V0.STOCHASTIC_FIELD,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** Test only. */
export function clearSportsCausalSpacesForTestV0() {
  sportsMatchStreamsV0.clear();
  spaceRegistryV0.clear();
}
