/**
 * Session / event lifecycle — enum only. LIVE = binding allowed, not execution.
 * @see docs/EVENT_SYSTEM_V1.md
 */

export const CASTLE_SESSION_LIFECYCLE_SCHEMA_V0 = "castle.session_lifecycle.v0";

export const SESSION_LIFECYCLE_V0 = Object.freeze({
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  ENDED: "ENDED",
  ARCHIVED: "ARCHIVED",
  REPLAY: "REPLAY",
  CANCELLED: "CANCELLED"
});

/** Lifecycle states where spatial session binding placeholders may be attached. */
export const SPATIAL_BINDING_ALLOWED_LIFECYCLES_V0 = Object.freeze([
  SESSION_LIFECYCLE_V0.LIVE,
  SESSION_LIFECYCLE_V0.REPLAY
]);

/**
 * @param {string} lifecycle
 */
export function isSpatialBindingAllowedV0(lifecycle) {
  const normalized = String(lifecycle || "").toUpperCase();
  return SPATIAL_BINDING_ALLOWED_LIFECYCLES_V0.includes(normalized);
}

/**
 * @param {string} lifecycle
 */
export function normalizeSessionLifecycleV0(lifecycle) {
  const normalized = String(lifecycle || SESSION_LIFECYCLE_V0.DRAFT).toUpperCase();
  if (Object.values(SESSION_LIFECYCLE_V0).includes(normalized)) {
    return normalized;
  }
  return SESSION_LIFECYCLE_V0.DRAFT;
}
