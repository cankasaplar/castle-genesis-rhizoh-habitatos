/**
 * Match session state machine constants — shared by lifecycle + truth kernel.
 * shadowRehearsal: true · interpretationOnly: true
 */

export const MATCH_SESSION_SCHEMA_V0 = "castle.rhizoh.match_session.v1";

export const MATCH_SESSION_STATE_V0 = Object.freeze({
  BEACON_PENDING: "BEACON_PENDING",
  MATCHING: "MATCHING",
  MATCH_FOUND: "MATCH_FOUND",
  SESSION_ACTIVE: "SESSION_ACTIVE",
  SESSION_PAUSED: "SESSION_PAUSED",
  SESSION_FINISHED: "SESSION_FINISHED",
  SESSION_CANCELLED: "SESSION_CANCELLED"
});

/** @type {Readonly<Record<string, readonly string[]>>} */
const LEGAL_TRANSITIONS_V0 = Object.freeze({
  [MATCH_SESSION_STATE_V0.BEACON_PENDING]: Object.freeze([
    MATCH_SESSION_STATE_V0.MATCHING,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.MATCHING]: Object.freeze([
    MATCH_SESSION_STATE_V0.MATCH_FOUND,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.MATCH_FOUND]: Object.freeze([
    MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.SESSION_ACTIVE]: Object.freeze([
    MATCH_SESSION_STATE_V0.SESSION_PAUSED,
    MATCH_SESSION_STATE_V0.SESSION_FINISHED,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.SESSION_PAUSED]: Object.freeze([
    MATCH_SESSION_STATE_V0.SESSION_ACTIVE,
    MATCH_SESSION_STATE_V0.SESSION_FINISHED,
    MATCH_SESSION_STATE_V0.SESSION_CANCELLED
  ]),
  [MATCH_SESSION_STATE_V0.SESSION_FINISHED]: Object.freeze([]),
  [MATCH_SESSION_STATE_V0.SESSION_CANCELLED]: Object.freeze([])
});

/**
 * @param {string} from
 * @param {string} to
 */
export function isLegalSessionTransitionV0(from, to) {
  const allowed = LEGAL_TRANSITIONS_V0[from] || [];
  return allowed.includes(to);
}
