/**
 * PR-3.4 — Physical vs execution temporal drift codes (orthogonal to epistemic drift).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * See `driftNamespaceV0.js` for coarse `DRIFT_SCOPE`. This module names **temporal**
 * actuation failures so logs stay debuggable when ACK ordering / duplicates mix in.
 */

import { DRIFT_SCOPE } from "./driftNamespaceV0.js";

/** Replay / idempotency barrier at execution layer. */
export const EXECUTION_TEMPORAL_CODE = Object.freeze({
  DUPLICATE_EXECUTION: "DUPLICATE_EXECUTION"
});

/** Device witness timeline problems — still not epistemic truth. */
export const PHYSICAL_TEMPORAL_CODE = Object.freeze({
  STALE_ACK: "STALE_ACK",
  OUT_OF_ORDER_ACK: "OUT_OF_ORDER_ACK",
  ACK_EXECUTION_MISMATCH: "ACK_EXECUTION_MISMATCH",
  ACK_COMMAND_HASH_MISMATCH: "ACK_COMMAND_HASH_MISMATCH"
});

/**
 * @param {string} code
 * @returns {string}
 */
export function temporalDriftScopeV0(code) {
  const c = String(code || "");
  if (c === EXECUTION_TEMPORAL_CODE.DUPLICATE_EXECUTION) return DRIFT_SCOPE.EXECUTION;
  if (
    c === PHYSICAL_TEMPORAL_CODE.STALE_ACK ||
    c === PHYSICAL_TEMPORAL_CODE.OUT_OF_ORDER_ACK ||
    c === PHYSICAL_TEMPORAL_CODE.ACK_EXECUTION_MISMATCH ||
    c === PHYSICAL_TEMPORAL_CODE.ACK_COMMAND_HASH_MISMATCH
  ) {
    return DRIFT_SCOPE.PHYSICAL;
  }
  return DRIFT_SCOPE.EXECUTION;
}
