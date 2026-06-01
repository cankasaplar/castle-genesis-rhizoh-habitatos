/**
 * Grammar bridge — utterance → constitution-safe intent/surface before LLM.
 * @see docs/RHIZOH_GRAMMAR_CONSTITUTION_SYSTEM_V0.md
 */

import { resolveGrammarFromUtteranceV0 } from "./rhizohGrammarConstitutionV0.js";
import { writeT0UserIntentV0 } from "./t0ContextStripV0.js";
import { pushT0ContinuityPulseV0 } from "./t0ContinuitySurfaceStreamV0.js";
import { RHIZOH_GRAMMAR_RESOLUTION_EVENT_V0 } from "./rhizohHonestCognitionSurfaceV0.js";
import { recordFlowIntentV0 } from "./rhizohFlowContinuityV0.js";
import { triggerMessageMicroRtlV0 } from "./expressiveRealityMicroTransitionV0.js";

/**
 * @param {string} utterance
 * @param {{ onEnterSurface?: (surface: string) => void, emitMicroRtl?: boolean }} [opts]
 */
export function applyGrammarFromUtteranceV0(utterance, opts = {}) {
  const resolution = resolveGrammarFromUtteranceV0(utterance);
  if (!resolution.action) return resolution;

  if (resolution.intentBias) {
    writeT0UserIntentV0(resolution.intentBias);
    recordFlowIntentV0(
      utterance,
      resolution.surface || "",
      resolution.intentBias
    );
  }

  if (resolution.action === "ENTER_SURFACE" && resolution.surface) {
    opts.onEnterSurface?.(String(resolution.surface));
    pushT0ContinuityPulseV0(
      `Grammar · ${resolution.surface}`,
      "grammar_surface"
    );
    if (opts.emitMicroRtl !== false) {
      triggerMessageMicroRtlV0({ detail: { source: "grammar_bridge_v0" } });
    }
  } else if (resolution.action === "SET_INTENT") {
    pushT0ContinuityPulseV0(`Grammar · intent ${resolution.intentBias}`, "grammar_intent");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_GRAMMAR_RESOLUTION_EVENT_V0, {
        detail: Object.freeze({ ...resolution, utterance: String(utterance || "").slice(0, 240) })
      })
    );
  }

  return resolution;
}
