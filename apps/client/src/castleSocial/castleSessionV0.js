/**
 * SessionV0 — shared perception container shape (contract only).
 * @see docs/SESSION_GRAPH_V1.md
 */

import { buildEventAxisV0 } from "./castleEventAxisV0.js";
import {
  normalizeSessionLifecycleV0,
  SESSION_LIFECYCLE_V0,
  CASTLE_SESSION_LIFECYCLE_SCHEMA_V0
} from "./castleSessionLifecycleV0.js";
import { SESSION_KIND_V0 } from "./castlePresenceTypesV0.js";

export const CASTLE_SESSION_SCHEMA_V0 = "castle.session.v0";

/**
 * @param {{
 *   sessionId: string,
 *   kind?: string,
 *   lifecycle?: string,
 *   hostCastleId: string,
 *   eventId?: string | null,
 *   axis?: ReturnType<typeof buildEventAxisV0>,
 *   createdAtMs?: number
 * }} input
 */
export function buildSessionV0(input) {
  const sessionId = String(input?.sessionId || "").trim();
  const hostCastleId = String(input?.hostCastleId || "").trim();
  if (!sessionId || !hostCastleId) {
    return Object.freeze({
      schema: CASTLE_SESSION_SCHEMA_V0,
      ok: false,
      reason: "missing_session_identity"
    });
  }

  const kind = String(input?.kind || SESSION_KIND_V0.PRIVATE_LINK).toLowerCase();
  const lifecycle = normalizeSessionLifecycleV0(input?.lifecycle);

  return Object.freeze({
    schema: CASTLE_SESSION_SCHEMA_V0,
    ok: true,
    sessionId,
    kind: Object.values(SESSION_KIND_V0).includes(kind) ? kind : SESSION_KIND_V0.PRIVATE_LINK,
    lifecycle,
    hostCastleId,
    eventId: input?.eventId ? String(input.eventId) : null,
    axis: input?.axis ? buildEventAxisV0(input.axis) : null,
    createdAtMs: Number(input?.createdAtMs) || 0,
    bindingAllowed: lifecycle === SESSION_LIFECYCLE_V0.LIVE || lifecycle === SESSION_LIFECYCLE_V0.REPLAY,
    readOnly: true
  });
}
