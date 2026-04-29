/**
 * GAP 1 — Kanonik eşdeğerlik: GPU readback ↔ CPU canonical beklentisi (Pass45 finalize v1).
 * Bitwise platform kanıtı değil; aynı kural kümesi altında formal witness üretir.
 */

import {
  decodeGpuDecisionFinalizeV1,
  expectedGpuDecisionFinalizeFromCellStats
} from "./rhizohGpuDecisionFinalize.js";

export const RHIZOH_CANONICAL_EQUIVALENCE_VERSION = "v1";
export const PASS45_FINALIZE_RULESET_ID = "pass45_finalize_v1_mode_quanta_thresholds_24_64";

/**
 * @param {{ gpuReadbackBytes: Uint8Array, maxParticleCountInCell: number, uniqueCellCount: number }} inputs
 */
export function provePass45FinalizeCanonicalEquivalence(inputs) {
  const decoded = decodeGpuDecisionFinalizeV1(inputs.gpuReadbackBytes);
  const expected = expectedGpuDecisionFinalizeFromCellStats({
    maxParticleCountInCell: inputs.maxParticleCountInCell,
    uniqueCellCount: inputs.uniqueCellCount
  });
  const equivalent =
    !!decoded &&
    decoded.magic === expected.magic &&
    decoded.maxCellCount === expected.maxCellCount &&
    decoded.uniqueCells === expected.uniqueCells &&
    decoded.modeQuanta === expected.modeQuanta;

  return Object.freeze({
    version: RHIZOH_CANONICAL_EQUIVALENCE_VERSION,
    equivalent,
    formalStatus: equivalent ? "EQUIVALENCE_HOLDS" : "EQUIVALENCE_VIOLATION",
    ruleSetId: PASS45_FINALIZE_RULESET_ID,
    witness: Object.freeze({
      gpuDecoded: decoded,
      cpuCanonicalExpected: expected
    })
  });
}
