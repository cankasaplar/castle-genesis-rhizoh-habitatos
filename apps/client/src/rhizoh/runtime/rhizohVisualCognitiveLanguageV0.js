/**
 * Rhizoh Visual Cognitive Language (VCL) v0 — liquid crystal cognition field parameters.
 * @see docs/RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md
 */

import { resolveT0ContextStripV0 } from "./t0ContextStripV0.js";
import {
  T0_INTENT_CONNECT_V0,
  T0_INTENT_EXPLORE_V0,
  T0_INTENT_OBSERVE_V0,
  T0_INTENT_PRODUCE_V0
} from "./t0ContextStripV0.js";

export const RHIZOH_VCL_CONTRACT_V0 = "rhizoh-visual-cognitive-language-v0";

export const VCL_BINDING_SENTENCE_V0 =
  "Rhizoh does not display information. It deforms perception into a shared cognitive field.";

export const VCL_LAYER_SYSTEM_V0 = "system_language";
export const VCL_LAYER_AGENT_V0 = "agent_language";
export const VCL_LAYER_USER_V0 = "user_language";
export const VCL_LAYER_EVOLUTION_V0 = "shared_evolution_language";

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Intent → geometric deformation (not color-primary).
 * @param {string} intent
 */
function deformationForIntentV0(intent) {
  const id = String(intent || T0_INTENT_EXPLORE_V0);
  if (id === T0_INTENT_PRODUCE_V0) {
    return Object.freeze({ facets: 8, twistDeg: 22, breathScale: 1.06, shear: 0.12 });
  }
  if (id === T0_INTENT_CONNECT_V0) {
    return Object.freeze({ facets: 6, twistDeg: 14, breathScale: 1.04, shear: 0.18 });
  }
  if (id === T0_INTENT_OBSERVE_V0) {
    return Object.freeze({ facets: 5, twistDeg: 6, breathScale: 0.98, shear: 0.04 });
  }
  return Object.freeze({ facets: 7, twistDeg: 12, breathScale: 1.02, shear: 0.08 });
}

/**
 * @param {{
 *   activeSurface?: string,
 *   userIntent?: string | null,
 *   rhizohFieldState?: string,
 *   collectiveDensity?: number,
 *   anchorActive?: boolean,
 *   evolutionTrace?: number,
 *   agentActivity?: number
 * }} [input]
 */
export function composeRhizohCognitiveFieldV0(input = {}) {
  const context = resolveT0ContextStripV0({
    activeSurface: input.activeSurface,
    userIntent: input.userIntent
  });
  const intent = context.intent;
  const deformation = deformationForIntentV0(intent);

  const fieldState = String(input.rhizohFieldState || "IDLE").toUpperCase();
  const thinking =
    fieldState === "INTERPRETING" || fieldState === "GENERATING" || fieldState === "SPEAKING";
  const listening = fieldState === "LISTENING";

  const collective = clamp01(input.collectiveDensity ?? 0.4);
  const tension = clamp01(
    collective * 0.45 +
      (thinking ? 0.35 : 0) +
      (listening ? 0.15 : 0) +
      (input.anchorActive ? 0.12 : 0)
  );

  const evolution = clamp01(input.evolutionTrace ?? collective * 0.5);
  const agentLens = clamp01(input.agentActivity ?? (thinking ? 0.7 : 0.25));
  const userDistortion = clamp01(listening ? 0.55 : thinking ? 0.35 : 0.15);

  const systemLanguage = Object.freeze({
    layer: VCL_LAYER_SYSTEM_V0,
    latticeDensity: clamp01(0.35 + collective * 0.4),
    coherence: clamp01(1 - tension * 0.2)
  });

  const agentLanguage = Object.freeze({
    layer: VCL_LAYER_AGENT_V0,
    lensOpacity: clamp01(0.15 + agentLens * 0.45),
    rippleHz: thinking ? 0.9 : 0.35
  });

  const userLanguage = Object.freeze({
    layer: VCL_LAYER_USER_V0,
    distortion: userDistortion,
    pulse: listening
  });

  const sharedEvolutionLanguage = Object.freeze({
    layer: VCL_LAYER_EVOLUTION_V0,
    traceStrength: evolution,
    seedGlow: clamp01(evolution * 0.8 + (input.anchorActive ? 0.15 : 0))
  });

  return Object.freeze({
    contract_version: RHIZOH_VCL_CONTRACT_V0,
    binding: VCL_BINDING_SENTENCE_V0,
    metaphor: "liquid_crystal_cognition_field",
    context_strip: context.strip,
    intent,
    tension,
    deformation: Object.freeze({
      ...deformation,
      density: clamp01(0.4 + tension * 0.55)
    }),
    layers: Object.freeze({
      system: systemLanguage,
      agent: agentLanguage,
      user: userLanguage,
      evolution: sharedEvolutionLanguage
    }),
    motion: Object.freeze({
      reduced: typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
      breathMs: Math.round(3200 - tension * 1200)
    })
  });
}
