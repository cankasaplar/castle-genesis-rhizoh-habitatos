/**
 * UGL Sports Adapter v0 — stub (NOT INSTANTIATED arena).
 * RESEARCH-ONLY — schema placeholder for continuous probabilistic domain.
 * @see docs/RHIZOH_DOMAIN_FABRIC_V0.md
 */

import { encodeUglStateV0 } from "./rhizohUglStateEncoderV0.js";
import { encodeUglActionV0 } from "./rhizohUglActionSpaceV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";
import { DOMAIN_COVERAGE_V0, normalizeSportScoreboardV0 } from "./rhizohDomainFabricV0.js";

export const RHIZOH_UGL_SPORTS_ADAPTER_SCHEMA_V0 = "castle.rhizoh.ugl_sports_adapter.v0";
export const RHIZOH_UGL_SPORTS_RULESET_ID_V0 = "sports.scoreboard.v0";

export function initSportsUglStateV0(scoreboard = {}) {
  const board = normalizeSportScoreboardV0(scoreboard);
  return encodeUglStateV0(RHIZOH_UGL_GAME_TYPE_V0.SPORTS, {
    scoreboard: board,
    rulesetId: RHIZOH_UGL_SPORTS_RULESET_ID_V0
  });
}

export function legalSportsUglActionsV0() {
  return Object.freeze([]);
}

export function applySportsUglActionV0() {
  return Object.freeze({
    state: initSportsUglStateV0(),
    terminal: false,
    outcome: null,
    stub: true
  });
}

export function isSportsUglTerminalV0() {
  return false;
}

export function rewardSportsUglTransitionV0() {
  return Object.freeze({
    terminal: 0,
    shaping: 0,
    drift: 0,
    novelty: 0,
    total: 0,
    momentum: 0,
    entropy: 0
  });
}

export function getSportsUglAdapterV0() {
  return Object.freeze({
    schema: RHIZOH_UGL_SPORTS_ADAPTER_SCHEMA_V0,
    rulesetId: RHIZOH_UGL_SPORTS_RULESET_ID_V0,
    gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS,
    coverage: DOMAIN_COVERAGE_V0.NOT_INSTANTIATED,
    init: initSportsUglStateV0,
    legalActions: legalSportsUglActionsV0,
    apply: applySportsUglActionV0,
    terminal: isSportsUglTerminalV0,
    reward: rewardSportsUglTransitionV0,
    interpretationOnly: true,
    nonExecutive: true
  });
}
