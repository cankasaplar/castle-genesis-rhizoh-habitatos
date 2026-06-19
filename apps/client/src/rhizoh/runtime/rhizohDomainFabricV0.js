/**
 * Rhizoh Domain Fabric v0 — UGL domain registry + schema mapping.
 * RESEARCH-ONLY — no execution authority.
 * @see docs/RHIZOH_DOMAIN_FABRIC_V0.md
 */

import { RHIZOH_UGL_GAME_TYPE_V0, RHIZOH_UGL_ACTION_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const RHIZOH_DOMAIN_FABRIC_SCHEMA_V0 = "castle.rhizoh.domain_fabric.v0";

export const DOMAIN_COVERAGE_V0 = Object.freeze({
  FULL_ACTIVE: "full_active",
  EVENT_ACTIVE: "event_active",
  PASSIVE_STUB: "passive_stub",
  NOT_INSTANTIATED: "not_instantiated"
});

export const SPORT_SCOREBOARD_SCHEMA_V0 = "castle.rhizoh.sport_scoreboard.v0";

/** @type {Record<string, object>} */
const DOMAIN_REGISTRY_V0 = Object.freeze({
  [RHIZOH_UGL_GAME_TYPE_V0.CHESS]: Object.freeze({
    domainId: "chess",
    gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS,
    coverage: DOMAIN_COVERAGE_V0.FULL_ACTIVE,
    stateSchema: "chess.fen.v0",
    stateRepr: "fen_tensor_8x8x13",
    actionTypes: Object.freeze([RHIZOH_UGL_ACTION_TYPE_V0.MOVE, RHIZOH_UGL_ACTION_TYPE_V0.PASS]),
    rewardSignals: Object.freeze(["terminal", "shaping", "drift", "novelty", "policy_diff", "league"]),
    adapterId: "rhizohUglChessAdapterV0",
    arenaId: "chess_arena"
  }),
  [RHIZOH_UGL_GAME_TYPE_V0.GO]: Object.freeze({
    domainId: "go",
    gameType: RHIZOH_UGL_GAME_TYPE_V0.GO,
    coverage: DOMAIN_COVERAGE_V0.PASSIVE_STUB,
    stateSchema: "go.board.v0",
    stateRepr: "unknown_tensor",
    actionTypes: Object.freeze([RHIZOH_UGL_ACTION_TYPE_V0.MOVE, RHIZOH_UGL_ACTION_TYPE_V0.PASS]),
    rewardSignals: Object.freeze([]),
    adapterId: null,
    arenaId: null
  }),
  [RHIZOH_UGL_GAME_TYPE_V0.SHOGI]: Object.freeze({
    domainId: "shogi",
    gameType: RHIZOH_UGL_GAME_TYPE_V0.SHOGI,
    coverage: DOMAIN_COVERAGE_V0.PASSIVE_STUB,
    stateSchema: "shogi.board.v0",
    stateRepr: "unknown_tensor",
    actionTypes: Object.freeze([RHIZOH_UGL_ACTION_TYPE_V0.MOVE, RHIZOH_UGL_ACTION_TYPE_V0.SPECIAL]),
    rewardSignals: Object.freeze([]),
    adapterId: null,
    arenaId: null
  }),
  [RHIZOH_UGL_GAME_TYPE_V0.SPORTS]: Object.freeze({
    domainId: "sports",
    gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS,
    coverage: DOMAIN_COVERAGE_V0.EVENT_ACTIVE,
    causalSpaceId: "sports.causal.space",
    stateSchema: "sports.event_stream.v0",
    stateRepr: "event_dense_stochastic",
    actionTypes: Object.freeze([
      RHIZOH_UGL_ACTION_TYPE_V0.EVENT,
      RHIZOH_UGL_ACTION_TYPE_V0.PLAY,
      RHIZOH_UGL_ACTION_TYPE_V0.POSSESSION,
      RHIZOH_UGL_ACTION_TYPE_V0.SCORE_DELTA
    ]),
    rewardSignals: Object.freeze(["outcome", "momentum", "entropy", "team_dynamics"]),
    adapterId: "rhizohUglSportsAdapterV0",
    arenaId: "sports_arena"
  })
});

/**
 * @param {string} gameType
 */
export function resolveDomainDescriptorV0(gameType) {
  const gt = String(gameType || RHIZOH_UGL_GAME_TYPE_V0.CHESS);
  const desc = DOMAIN_REGISTRY_V0[gt];
  if (desc) return desc;
  return Object.freeze({
    domainId: "custom",
    gameType: gt,
    coverage: DOMAIN_COVERAGE_V0.NOT_INSTANTIATED,
    stateSchema: "unknown",
    stateRepr: "unknown",
    actionTypes: Object.freeze([]),
    rewardSignals: Object.freeze([]),
    adapterId: null,
    arenaId: null
  });
}

export function listDomainDescriptorsV0() {
  return Object.freeze(Object.values(DOMAIN_REGISTRY_V0));
}

/**
 * @param {object} raw
 */
export function normalizeSportScoreboardV0(raw = {}) {
  const home = Number(raw.homeScore) || 0;
  const away = Number(raw.awayScore) || 0;
  return Object.freeze({
    schema: SPORT_SCOREBOARD_SCHEMA_V0,
    homeScore: home,
    awayScore: away,
    period: Number(raw.period) || 1,
    clockSec: Math.max(0, Number(raw.clockSec) || 0),
    possession: raw.possession === "away" ? "away" : "home",
    momentum01: Math.max(0, Math.min(1, Number(raw.momentum01) || 0.5)),
    sportId: String(raw.sportId || "football"),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function getDomainFabricSnapshotV0() {
  const domains = listDomainDescriptorsV0();
  const isActive = (d) =>
    d.coverage === DOMAIN_COVERAGE_V0.FULL_ACTIVE ||
    d.coverage === DOMAIN_COVERAGE_V0.EVENT_ACTIVE;
  return Object.freeze({
    schema: RHIZOH_DOMAIN_FABRIC_SCHEMA_V0,
    uglComplete: true,
    domainComplete: domains.filter(isActive).length >= 2,
    activeDomainCount: domains.filter(isActive).length,
    domains,
    causalSpaces: Object.freeze(["chess.causal.space", "sports.causal.space"]),
    interpretationOnly: true,
    nonExecutive: true
  });
}
