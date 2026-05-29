/**
 * PR-3.4 — Reject stale or out-of-order actuator ACKs (temporal discipline).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * ACK is still not truth — this only rejects temporally invalid witnesses so they do not
 * corrupt parity timelines or replay.
 */

import { PHYSICAL_TEMPORAL_CODE, temporalDriftScopeV0 } from "./physicalDriftNamespaceV0.js";

/**
 * @param {import('./physicalAckEnvelopeV0.js').PhysicalAckEnvelopeV0} ack
 * @param {{
 *   expectedExecutionId?: string,
 *   expectedCommandHash?: string,
 *   lastCommandDispatchedAtMs?: number,
 *   expectedSequenceId?: string,
 *   clockSkewToleranceMs?: number
 * }} ctx
 */
export function rejectIfStaleOrOutOfOrderAckV0(ack, ctx = {}) {
  if (!ack || typeof ack !== "object") {
    return {
      ok: false,
      code: PHYSICAL_TEMPORAL_CODE.STALE_ACK,
      scope: temporalDriftScopeV0(PHYSICAL_TEMPORAL_CODE.STALE_ACK)
    };
  }

  if (ctx.expectedExecutionId != null && String(ack.executionId) !== String(ctx.expectedExecutionId)) {
    return {
      ok: false,
      code: PHYSICAL_TEMPORAL_CODE.ACK_EXECUTION_MISMATCH,
      scope: temporalDriftScopeV0(PHYSICAL_TEMPORAL_CODE.ACK_EXECUTION_MISMATCH)
    };
  }

  if (ctx.expectedCommandHash != null && String(ack.commandHash) !== String(ctx.expectedCommandHash)) {
    return {
      ok: false,
      code: PHYSICAL_TEMPORAL_CODE.ACK_COMMAND_HASH_MISMATCH,
      scope: temporalDriftScopeV0(PHYSICAL_TEMPORAL_CODE.ACK_COMMAND_HASH_MISMATCH)
    };
  }

  const tol =
    typeof ctx.clockSkewToleranceMs === "number" && ctx.clockSkewToleranceMs >= 0 ? ctx.clockSkewToleranceMs : 5000;
  if (
    typeof ctx.lastCommandDispatchedAtMs === "number" &&
    Number.isFinite(ctx.lastCommandDispatchedAtMs) &&
    typeof ack.receivedAt === "number" &&
    Number.isFinite(ack.receivedAt) &&
    ack.receivedAt + tol < ctx.lastCommandDispatchedAtMs
  ) {
    return {
      ok: false,
      code: PHYSICAL_TEMPORAL_CODE.STALE_ACK,
      scope: temporalDriftScopeV0(PHYSICAL_TEMPORAL_CODE.STALE_ACK)
    };
  }

  if (
    ctx.expectedSequenceId != null &&
    String(ctx.expectedSequenceId).length > 0 &&
    ack.sequenceId != null &&
    String(ack.sequenceId) !== String(ctx.expectedSequenceId)
  ) {
    return {
      ok: false,
      code: PHYSICAL_TEMPORAL_CODE.OUT_OF_ORDER_ACK,
      scope: temporalDriftScopeV0(PHYSICAL_TEMPORAL_CODE.OUT_OF_ORDER_ACK)
    };
  }

  return { ok: true };
}
