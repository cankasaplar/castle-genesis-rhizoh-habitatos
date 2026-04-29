/**
 * Kaçınılmaz evrim hattı — (A) Formalization (B) Closure enforcement (C) Identity compression.
 */

import { buildFormalizationLayerSurface } from "./rhizohFormalizationLayerV1.js";
import { buildClosureEnforcementLayerSurface } from "./rhizohClosureEnforcementLayerV1.js";
import { buildIdentityCompressionLayerSurface } from "./rhizohIdentityCompressionLayerV1.js";

export const RHIZOH_INEVITABLE_EVOLUTION_LINE_ID = "v529_inevitable_direction";

/**
 * @param {object} bridgePayload — epistemicKernel ve fullClosureContractGraph içermeli
 * @param {{ frameState?: object | null }} [extras]
 */
export function buildInevitableEvolutionLinePack(bridgePayload, extras = {}) {
  return Object.freeze({
    evolutionLineId: RHIZOH_INEVITABLE_EVOLUTION_LINE_ID,
    A_formalization: buildFormalizationLayerSurface(bridgePayload),
    B_closureEnforcement: buildClosureEnforcementLayerSurface(),
    C_identityCompression: buildIdentityCompressionLayerSurface(bridgePayload, extras)
  });
}
