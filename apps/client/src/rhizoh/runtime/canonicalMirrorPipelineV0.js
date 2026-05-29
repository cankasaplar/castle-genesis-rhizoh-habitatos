/**
 * PR-3.2.1 — Canonical mirror contract: single blessed substrate projection chain.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Canonical mirror parity (this module):** proves `nested executionResult` / router pack →
 * `ambientBoxState` along a schema-locked path (`canonicalSubstrateParityV0`). This is **not**
 * device parity; virtual vs physical ACK is `physicalParityVerifierV0` (PR-3.3-B).
 *
 * Chain (no alternate normalization paths for drift-sensitive code):
 *   nested executionResult → validateNestedExecutionResultV0 → createAmbientBoxStateV0 → validateAmbientBoxStateV0
 *   router parts → packExecutionMirrorV0 → (same as above)
 *
 * Parity checks must use `canonicalSubstrateParityV0` so both operands pass schema lock.
 */

import { CANONICAL_MIRROR_CONTRACT_VERSION } from "./substrateMirrorConstantsV0.js";
import { createAmbientBoxStateV0 } from "./ambientBoxStateV0.js";
import { packExecutionMirrorV0, substrateParityV0 } from "./virtualSubstrateMirrorV0.js";
import { validateNestedExecutionResultV0, validateAmbientBoxStateV0 } from "./substrateMirrorSchemaV0.js";

export { CANONICAL_MIRROR_CONTRACT_VERSION };

/** Ordered witness list for audits / replay manifests. */
export const CANONICAL_MIRROR_PIPELINE_STEPS_V0 = Object.freeze([
  "validate_nested_execution_result",
  "create_ambient_box_state",
  "validate_ambient_box_state"
]);

/** Router path prepends `pack_execution_mirror_v0` before the steps above. */
export const CANONICAL_MIRROR_PIPELINE_FROM_ROUTER_STEPS_V0 = Object.freeze([
  "pack_execution_mirror_v0",
  ...CANONICAL_MIRROR_PIPELINE_STEPS_V0
]);

/**
 * Pure projection: already-nested executionResult → frozen ambient box + schema lock.
 *
 * @param {unknown} executionResult
 * @param {number} [nowMs]
 * @returns {{ ok: true, box: ReturnType<typeof createAmbientBoxStateV0>, contractVersion: number } | { ok: false, stage: string, errors: string[], contractVersion: number }}
 */
export function projectSubstrateFromNestedExecutionResultV0(executionResult, nowMs) {
  const v = validateNestedExecutionResultV0(executionResult);
  if (!v.ok) {
    return {
      ok: false,
      stage: "validate_nested_execution_result",
      errors: v.errors,
      contractVersion: CANONICAL_MIRROR_CONTRACT_VERSION
    };
  }
  const box = createAmbientBoxStateV0(executionResult, nowMs);
  const vb = validateAmbientBoxStateV0(box);
  if (!vb.ok) {
    return {
      ok: false,
      stage: "validate_ambient_box_state",
      errors: vb.errors,
      contractVersion: CANONICAL_MIRROR_CONTRACT_VERSION
    };
  }
  return { ok: true, box, contractVersion: CANONICAL_MIRROR_CONTRACT_VERSION };
}

/**
 * Pure projection: PR-3.1 router-shaped parts → pack → same chain as nested.
 *
 * @param {Parameters<typeof packExecutionMirrorV0>[0]} parts
 * @param {number} [nowMs]
 */
export function projectSubstrateFromRouterPartsV0(parts, nowMs) {
  const packed = packExecutionMirrorV0(parts);
  return projectSubstrateFromNestedExecutionResultV0(packed, nowMs);
}

/**
 * Canonical parity: both boxes must satisfy `validateAmbientBoxStateV0` before `substrateParityV0`.
 *
 * @param {unknown} a
 * @param {unknown} b
 */
export function canonicalSubstrateParityV0(a, b) {
  const va = validateAmbientBoxStateV0(a);
  const vb = validateAmbientBoxStateV0(b);
  if (!va.ok || !vb.ok) return false;
  return substrateParityV0(
    /** @type {Parameters<typeof substrateParityV0>[0]} */ (a),
    /** @type {Parameters<typeof substrateParityV0>[1]} */ (b)
  );
}
