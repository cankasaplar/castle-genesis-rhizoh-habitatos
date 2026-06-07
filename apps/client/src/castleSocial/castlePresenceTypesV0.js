/**
 * Social graph presence types — identity shape only, no behavior.
 * @see docs/SESSION_GRAPH_V1.md
 */

export const CASTLE_PRESENCE_TYPES_SCHEMA_V0 = "castle.presence_types.v0";

export const SESSION_PARTICIPATION_ROLE_V0 = Object.freeze({
  HOST: "host",
  PERFORMER: "performer",
  GUEST: "guest",
  AUDIENCE: "audience",
  MODERATOR: "moderator",
  OBSERVER: "observer"
});

/** State label only — not input behavior or routing. */
export const PRESENCE_STATE_V0 = Object.freeze({
  IDLE: "idle",
  LINKING: "linking",
  IN_SESSION: "in_session",
  OBSERVING: "observing"
});

export const SESSION_KIND_V0 = Object.freeze({
  PRIVATE_LINK: "private_link",
  PARTY: "party",
  EVENT: "event",
  OBSERVATION: "observation"
});

/**
 * @param {string} role
 */
export function normalizeParticipationRoleV0(role) {
  const normalized = String(role || SESSION_PARTICIPATION_ROLE_V0.GUEST).toLowerCase();
  if (Object.values(SESSION_PARTICIPATION_ROLE_V0).includes(normalized)) {
    return normalized;
  }
  return SESSION_PARTICIPATION_ROLE_V0.GUEST;
}

/**
 * @param {string} state
 */
export function normalizePresenceStateV0(state) {
  const normalized = String(state || PRESENCE_STATE_V0.IDLE).toLowerCase();
  if (Object.values(PRESENCE_STATE_V0).includes(normalized)) {
    return normalized;
  }
  return PRESENCE_STATE_V0.IDLE;
}
