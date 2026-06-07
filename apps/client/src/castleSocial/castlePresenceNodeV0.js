/**
 * PresenceNodeV0 — social graph node shape (no graph engine).
 * @see docs/SESSION_GRAPH_V1.md
 */

import {
  normalizeParticipationRoleV0,
  normalizePresenceStateV0,
  CASTLE_PRESENCE_TYPES_SCHEMA_V0
} from "./castlePresenceTypesV0.js";

/**
 * @param {{
 *   userId: string,
 *   castleId: string,
 *   sessionId?: string | null,
 *   role?: string,
 *   presenceState?: string,
 *   epoch?: number
 * }} input
 */
export function buildPresenceNodeV0(input) {
  const userId = String(input?.userId || "").trim();
  const castleId = String(input?.castleId || "").trim();
  if (!userId || !castleId) {
    return Object.freeze({
      schema: CASTLE_PRESENCE_TYPES_SCHEMA_V0,
      ok: false,
      reason: "missing_identity"
    });
  }

  return Object.freeze({
    schema: CASTLE_PRESENCE_TYPES_SCHEMA_V0,
    ok: true,
    userId,
    castleId,
    sessionId: input.sessionId ? String(input.sessionId) : null,
    role: normalizeParticipationRoleV0(input.role),
    presenceState: normalizePresenceStateV0(input.presenceState),
    epoch: Number(input.epoch) || 0,
    readOnly: true
  });
}
