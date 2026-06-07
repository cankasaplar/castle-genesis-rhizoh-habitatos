/**
 * EventInstanceV0 — composes axis tuple + session lifecycle (contract only).
 * @see docs/EVENT_SYSTEM_V1.md
 */

import { buildEventAxisV0 } from "./castleEventAxisV0.js";
import { buildSessionV0 } from "./castleSessionV0.js";
import { buildSpatialSessionBindingV0 } from "./spatialSessionBindingV0.js";
import { normalizeSessionLifecycleV0 } from "./castleSessionLifecycleV0.js";

export const CASTLE_EVENT_INSTANCE_SCHEMA_V0 = "castle.event_instance.v0";

/**
 * @param {{
 *   eventId: string,
 *   hostCastleId: string,
 *   lifecycle?: string,
 *   axis?: Parameters<typeof buildEventAxisV0>[0],
 *   sessionId?: string,
 *   spatialBinding?: Parameters<typeof buildSpatialSessionBindingV0>[0]
 * }} input
 */
export function buildEventInstanceV0(input) {
  const eventId = String(input?.eventId || "").trim();
  const hostCastleId = String(input?.hostCastleId || "").trim();
  if (!eventId || !hostCastleId) {
    return Object.freeze({
      schema: CASTLE_EVENT_INSTANCE_SCHEMA_V0,
      ok: false,
      reason: "missing_event_identity"
    });
  }

  const lifecycle = normalizeSessionLifecycleV0(input?.lifecycle);
  const axis = buildEventAxisV0(input?.axis);
  const sessionId = String(input?.sessionId || `sess_${eventId}`);

  const session = buildSessionV0({
    sessionId,
    kind: "event",
    lifecycle,
    hostCastleId,
    eventId,
    axis
  });

  const spatialBinding = buildSpatialSessionBindingV0({
    sessionId,
    lifecycle,
    ...(input?.spatialBinding || {})
  });

  return Object.freeze({
    schema: CASTLE_EVENT_INSTANCE_SCHEMA_V0,
    ok: true,
    eventId,
    hostCastleId,
    lifecycle,
    axis,
    session,
    spatialBinding,
    readOnly: true
  });
}
