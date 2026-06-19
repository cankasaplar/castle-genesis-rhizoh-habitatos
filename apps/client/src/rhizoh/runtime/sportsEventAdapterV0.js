/**
 * Sports Event Adapter v0 — event-dense normalization → UGL (no snapshot model).
 * RESEARCH-ONLY
 * @see docs/RHIZOH_SPORTS_ADAPTER_V0.md
 */

import { buildUglEventV0, appendUglEventV0 } from "./rhizohUglEventV0.js";
import { encodeUglActionV0 } from "./rhizohUglActionSpaceV0.js";
import { notifySportsArenaActivityV0, runMultiArenaTickV0 } from "./multiArenaSchedulerV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0, RHIZOH_UGL_ACTION_TYPE_V0 } from "./rhizohUglSchemaV0.js";
import { appendSportsSpaceEventV0, CAUSAL_SPACE_ID_V0 } from "./sportsCausalSpaceV0.js";
import {
  buildSportsDriftReasonV0,
  deriveSportsDriftSignalsV0
} from "./sportsDriftMapperV0.js";

export const SPORTS_EVENT_ADAPTER_SCHEMA_V0 = "castle.rhizoh.sports_event_adapter.v0";
export const SPORTS_EVENT_V0 = "rhizoh:sports-event-v0";

export const SPORTS_EVENT_TYPE_V0 = Object.freeze({
  MATCH_EVENT: "match_event",
  PLAYER_ACTION: "player_action",
  MOMENTUM_SHIFT: "momentum_shift",
  SCORE_DELTA: "score_delta"
});

const EVENT_TYPE_TO_UGL_ACTION_V0 = Object.freeze({
  [SPORTS_EVENT_TYPE_V0.MATCH_EVENT]: RHIZOH_UGL_ACTION_TYPE_V0.EVENT,
  [SPORTS_EVENT_TYPE_V0.PLAYER_ACTION]: RHIZOH_UGL_ACTION_TYPE_V0.PLAY,
  [SPORTS_EVENT_TYPE_V0.MOMENTUM_SHIFT]: RHIZOH_UGL_ACTION_TYPE_V0.POSSESSION,
  [SPORTS_EVENT_TYPE_V0.SCORE_DELTA]: RHIZOH_UGL_ACTION_TYPE_V0.SCORE_DELTA
});

/**
 * @param {object} raw
 */
export function normalizeSportsMatchEventV0(raw = {}) {
  const eventType = String(raw.eventType || raw.type || SPORTS_EVENT_TYPE_V0.MATCH_EVENT);
  const matchId = String(raw.matchId || "match_unknown");
  const teamA = String(raw.teamA || raw.home || "teamA");
  const teamB = String(raw.teamB || raw.away || "teamB");

  return Object.freeze({
    schema: SPORTS_EVENT_ADAPTER_SCHEMA_V0,
    eventType,
    matchId,
    teamA,
    teamB,
    actorId: String(raw.actorId || raw.playerId || "unknown"),
    atMs: Number(raw.atMs) || Date.now(),
    causalSpaceId: CAUSAL_SPACE_ID_V0.SPORTS,
    payload: Object.freeze({
      delta: raw.delta ?? raw.scoreDelta ?? null,
      momentumDelta: raw.momentumDelta ?? null,
      fatigue01: raw.fatigue01 ?? null,
      anomalyScore: raw.anomalyScore ?? null,
      period: raw.period ?? null,
      clockSec: raw.clockSec ?? null,
      detail: raw.detail ? String(raw.detail) : null
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {object} normalized
 */
export function sportsEventToUglActionV0(normalized) {
  const uglType = EVENT_TYPE_TO_UGL_ACTION_V0[normalized.eventType] || RHIZOH_UGL_ACTION_TYPE_V0.EVENT;
  return encodeUglActionV0(RHIZOH_UGL_GAME_TYPE_V0.SPORTS, {
    actorId: normalized.actorId,
    type: uglType,
    payload: Object.freeze({
      eventType: normalized.eventType,
      matchId: normalized.matchId,
      ...normalized.payload
    })
  });
}

/**
 * @param {object} normalized
 */
export function sportsEventToDriftReasonsV0(normalized) {
  const signals = deriveSportsDriftSignalsV0(normalized);
  return Object.freeze(signals.map((s) => buildSportsDriftReasonV0(s)));
}

/**
 * @param {object} normalized
 * @param {{ appendUgl?: boolean, dispatchEvent?: boolean }} [opts]
 */
export function ingestSportsMatchEventV0(normalized, opts = {}) {
  appendSportsSpaceEventV0(normalized.matchId, normalized);
  notifySportsArenaActivityV0({
    reason: normalized.eventType,
    durationMs: opts.burstDurationMs
  });
  runMultiArenaTickV0();
  const action = sportsEventToUglActionV0(normalized);
  const driftReasons = sportsEventToDriftReasonsV0(normalized);
  const signals = deriveSportsDriftSignalsV0(normalized);

  const rewardTotal = signals.reduce((sum, s) => sum + (s.confidence || 0) * 0.1, 0);

  const uglEvent = buildUglEventV0({
    s: Object.freeze({
      meta: Object.freeze({
        gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS,
        causalSpaceId: CAUSAL_SPACE_ID_V0.SPORTS,
        eventType: normalized.eventType,
        matchId: normalized.matchId
      })
    }),
    a: action,
    sNext: Object.freeze({
      meta: Object.freeze({
        gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS,
        causalSpaceId: CAUSAL_SPACE_ID_V0.SPORTS,
        lastEvent: normalized.eventType
      })
    }),
    r: Object.freeze({
      terminal: 0,
      shaping: rewardTotal * 0.5,
      drift: rewardTotal,
      novelty: 0.1,
      momentum: Number(normalized.payload.momentumDelta) || 0,
      entropy: signals.some((s) => s.category === "ENTROPY_DRIFT") ? 0.2 : 0.05,
      total: rewardTotal
    }),
    matchId: normalized.matchId,
    gameType: RHIZOH_UGL_GAME_TYPE_V0.SPORTS,
    source: "sports_event"
  });

  let appended = null;
  if (opts.appendUgl !== false) {
    appended = appendUglEventV0(uglEvent);
  }

  if (opts.dispatchEvent !== false && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
    globalThis.dispatchEvent(
      new CustomEvent(SPORTS_EVENT_V0, {
        detail: Object.freeze({ normalized, uglEvent: appended || uglEvent, driftReasons })
      })
    );
  }

  return Object.freeze({
    schema: SPORTS_EVENT_ADAPTER_SCHEMA_V0,
    normalized,
    action,
    uglEvent: appended || uglEvent,
    driftReasons,
    signals,
    interpretationOnly: true,
    nonExecutive: true
  });
}
