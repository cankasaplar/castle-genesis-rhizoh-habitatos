import { KERNEL_SEAL_V1 } from "../contracts/kernelSealV1.js";
import { RHIZOH_INTENT, RHIZOH_SUB_INTENT } from "../router/intentTypes.js";
import { RHIZOH_EPISTEMIC_LAYER, RHIZOH_LAYER_PROOF_SKETCH } from "./rhizohLayersV529.js";

/**
 * Niyet + alt niyet → birincil epistemik katman (MVP eşlemesi).
 * @param {{ intent?: string, subIntent?: string } | null | undefined} router
 */
export function resolvePrimaryEpistemicLayer(router) {
  const intent = String(router?.intent || RHIZOH_INTENT.CHAT).toUpperCase();
  const sub = String(router?.subIntent || RHIZOH_SUB_INTENT.NONE).toUpperCase();

  if (intent === RHIZOH_INTENT.CRISIS && sub === RHIZOH_SUB_INTENT.GATEWAY) {
    return {
      id: RHIZOH_EPISTEMIC_LAYER.L12,
      rationale: "Gateway / policy ihlali veya bağlantı krizi — doğrulama katmanı öncelikli.",
      proofObligations: [RHIZOH_LAYER_PROOF_SKETCH[RHIZOH_EPISTEMIC_LAYER.L12].proofSketch]
    };
  }
  if (intent === RHIZOH_INTENT.BUILD && sub === RHIZOH_SUB_INTENT.WORLD) {
    return {
      id: RHIZOH_EPISTEMIC_LAYER.L9,
      rationale: "Dünya / olay örgüsü inşası — event mesh ve sahadaki tutarlılık.",
      proofObligations: [
        RHIZOH_LAYER_PROOF_SKETCH[RHIZOH_EPISTEMIC_LAYER.L9].proofSketch,
        RHIZOH_LAYER_PROOF_SKETCH[RHIZOH_EPISTEMIC_LAYER.L8].proofSketch
      ]
    };
  }
  if (intent === RHIZOH_INTENT.PLAY) {
    return {
      id: RHIZOH_EPISTEMIC_LAYER.L7,
      rationale: "Oyun / companion yüzeyi — evrim ve orbit sınırları.",
      proofObligations: [RHIZOH_LAYER_PROOF_SKETCH[RHIZOH_EPISTEMIC_LAYER.L7].proofSketch]
    };
  }
  if (intent === RHIZOH_INTENT.REFLECT || intent === RHIZOH_INTENT.SILENCE) {
    return {
      id: RHIZOH_EPISTEMIC_LAYER.L11,
      rationale: "Sessizlik / yansıma — süreklilik ve hafıza sözleşmesi ön planda.",
      proofObligations: [RHIZOH_LAYER_PROOF_SKETCH[RHIZOH_EPISTEMIC_LAYER.L11].proofSketch]
    };
  }
  return {
    id: RHIZOH_EPISTEMIC_LAYER.L10,
    rationale: "Genel sohbet / yönlendirme — intent orchestration varsayılanı.",
    proofObligations: [RHIZOH_LAYER_PROOF_SKETCH[RHIZOH_EPISTEMIC_LAYER.L10].proofSketch]
  };
}

/**
 * Tek tur için “truth contract” zarfı — kanıt nesnesine giden yolun ilk adımı.
 * @param {{
 *   source?: string,
 *   gatewayPhase?: string,
 *   mapSurfaceActive?: boolean,
 *   router?: { intent?: string, subIntent?: string } | null
 * }} input
 */
export function buildEpistemicTruthContract(input = {}) {
  const layer = resolvePrimaryEpistemicLayer(input.router);
  return {
    schema: "rhizoh.epistemic.truth_contract.v529.0",
    at: Date.now(),
    kernelSeal: {
      version: KERNEL_SEAL_V1.version,
      sealedAt: KERNEL_SEAL_V1.sealedAt
    },
    routing: {
      primaryLayer: layer.id,
      rationale: layer.rationale,
      proofObligations: layer.proofObligations
    },
    runtime: {
      llmPath: String(input.source || "unknown"),
      gatewayPhase: String(input.gatewayPhase ?? "unknown"),
      mapSurfaceActive: !!input.mapSurfaceActive
    },
    intent: input.router
      ? { intent: input.router.intent ?? null, subIntent: input.router.subIntent ?? null }
      : null
  };
}
