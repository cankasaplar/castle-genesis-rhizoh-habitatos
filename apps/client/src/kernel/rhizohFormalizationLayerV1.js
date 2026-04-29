/**
 * (A) Formalization Layer v1 — SMT / proof sistemine giden yol (solver bağlı değil).
 */

import { buildEpistemicSmtIrV1 } from "./rhizohEpistemicKernelV1.js";

export const RHIZOH_FORMALIZATION_LAYER_VERSION = "v1";

export function getFormalizationLayerSpec() {
  return Object.freeze({
    version: RHIZOH_FORMALIZATION_LAYER_VERSION,
    targets: Object.freeze(["SMT_LIB2", "proof_obligation_registry", "external_verifier_sidecar"]),
    note: "structural_IR_only_not_solver"
  });
}

/**
 * @param {object} bridgePayload — epistemicKernel gömülü olabilir
 */
export function buildFormalizationLayerSurface(bridgePayload = {}) {
  const smt =
    bridgePayload?.epistemicKernel?.smtIntermediateRepresentation ??
    buildEpistemicSmtIrV1(bridgePayload);
  return Object.freeze({
    layerId: "A_FORMALIZATION",
    version: RHIZOH_FORMALIZATION_LAYER_VERSION,
    spec: getFormalizationLayerSpec(),
    smtIntermediateRepresentation: smt,
    contractGraphRef: bridgePayload?.fullClosureContractGraph ?? null
  });
}
