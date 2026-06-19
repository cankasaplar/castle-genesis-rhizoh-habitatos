/**
 * UGL Sports Adapter v0 — event-dense stochastic domain (EVENT_ACTIVE).
 * RESEARCH-ONLY — no deterministic apply engine; event stream + drift only.
 * @see docs/RHIZOH_SPORTS_ADAPTER_V0.md
 */

import { encodeUglStateV0 } from "./rhizohUglStateEncoderV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";
import { DOMAIN_COVERAGE_V0 } from "./rhizohDomainFabricV0.js";
import { CAUSAL_SPACE_ID_V0 } from "./sportsCausalSpaceV0.js";
import {
  ingestSportsMatchEventV0,
  normalizeSportsMatchEventV0,
  SPORTS_EVENT_TYPE_V0
} from "./sportsEventAdapterV0.js";
import { readSportsSpaceEventsV0 } from "./sportsCausalSpaceV0.js";
import { aggregateSportsDriftCategoriesV0 } from "./sportsDriftMapperV0.js";

export const RHIZOH_UGL_SPORTS_ADAPTER_SCHEMA_V0 = "castle.rhizoh.ugl_sports_adapter.v0";
export const RHIZOH_UGL_SPORTS_RULESET_ID_V0 = "sports.event_stream.v0";

/**
 * Event-dense init — rolling context, not full snapshot.
 * @param {{ matchId?: string, teamA?: string, teamB?: string }} ctx
 */
export function initSportsUglStateV0(ctx = {}) {
  return encodeUglStateV0(RHIZOH_UGL_GAME_TYPE_V0.SPORTS, {
    rulesetId: RHIZOH_UGL_SPORTS_RULESET_ID_V0,
    matchId: ctx.matchId,
    causalSpaceId: CAUSAL_SPACE_ID_V0.SPORTS,
    eventModel: "event_dense"
  });
}

export function legalSportsUglActionsV0() {
  return Object.freeze(Object.values(SPORTS_EVENT_TYPE_V0));
}

/**
 * @param {object} rawEvent
 */
export function applySportsUglEventV0(rawEvent) {
  const normalized = normalizeSportsMatchEventV0(rawEvent);
  const ingested = ingestSportsMatchEventV0(normalized, { appendUgl: true });
  return Object.freeze({
    state: initSportsUglStateV0({ matchId: normalized.matchId }),
    terminal: false,
    outcome: null,
    ingested,
    eventDense: true
  });
}

/** @deprecated use applySportsUglEventV0 */
export function applySportsUglActionV0(rawEvent) {
  return applySportsUglEventV0(rawEvent);
}

export function isSportsUglTerminalV0() {
  return false;
}

/**
 * @param {object} transition
 */
export function rewardSportsUglTransitionV0(transition) {
  const signals = transition?.ingested?.signals || [];
  const entropy = signals.filter((s) => s.category === "ENTROPY_DRIFT").length * 0.15;
  const momentum = Number(transition?.ingested?.normalized?.payload?.momentumDelta) || 0;
  const drift = signals.reduce((sum, s) => sum + (s.confidence || 0) * 0.1, 0);
  return Object.freeze({
    terminal: 0,
    shaping: drift * 0.5,
    drift,
    novelty: 0.1,
    total: drift + entropy * 0.25,
    momentum,
    entropy
  });
}

export function getSportsDriftCategoryCountsV0(matchId) {
  const events = readSportsSpaceEventsV0(matchId, 128);
  return aggregateSportsDriftCategoriesV0(events);
}

export function getSportsUglAdapterV0() {
  return Object.freeze({
    schema: RHIZOH_UGL_SPORTS_ADAPTER_SCHEMA_V0,
    rulesetId: RHIZOH_UGL_SPORTS_RULESET_ID_V0,
    gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS,
    causalSpaceId: CAUSAL_SPACE_ID_V0.SPORTS,
    coverage: DOMAIN_COVERAGE_V0.EVENT_ACTIVE,
    eventModel: "event_dense",
    init: initSportsUglStateV0,
    legalActions: legalSportsUglActionsV0,
    apply: applySportsUglEventV0,
    applyEvent: applySportsUglEventV0,
    terminal: isSportsUglTerminalV0,
    reward: rewardSportsUglTransitionV0,
    driftCategories: getSportsDriftCategoryCountsV0,
    interpretationOnly: true,
    nonExecutive: true
  });
}
