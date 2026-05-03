import { classifyIntent } from "./classifyIntent.js";
import { computeUrgency, detectSilenceMode, inferEmotionalSignalFromLanguage } from "./intentSignals.js";
import { RHIZOH_INTENT, RHIZOH_SUB_INTENT, toolHintsForIntent } from "./intentTypes.js";

/**
 * Tek giriş noktası: ham metin + continuity + runtime → normalize intent (LLM öncesi).
 *
 * @param {string} rawText
 * @param {Record<string, unknown>} [continuity] — client continuity payload
 * @param {Record<string, unknown>} [runtime] — realityMode, mapSurfaceActive, layerFocus, governanceState, lastErrorSnippet, …
 * @returns {{
 *   intent: string,
 *   confidence: number,
 *   subIntent: string,
 *   urgency: number,
 *   emotionalSignal: string,
 *   toolHint: string[],
 *   silenceMode: boolean
 * }}
 */
export function routeRhizohInput(rawText, continuity = {}, runtime = {}) {
  const text = String(rawText || "").trim();

  const hs = runtime?.healthState;
  if (
    runtime?.gatewayPhase === "maintenance" ||
    (hs && typeof hs === "object" && hs.connectivity === "MAINTENANCE")
  ) {
    return {
      intent: RHIZOH_INTENT.SILENCE,
      confidence: 0.48,
      subIntent: RHIZOH_SUB_INTENT.NONE,
      urgency: 0,
      emotionalSignal: "CONTEMPLATIVE",
      toolHint: [],
      silenceMode: false,
      reliabilityIntentProfile: { listener: true, queueOnly: true, localStubSafe: true }
    };
  }

  if (detectSilenceMode(text)) {
    return {
      intent: RHIZOH_INTENT.SILENCE,
      confidence: 0.92,
      subIntent: RHIZOH_SUB_INTENT.NONE,
      urgency: 0,
      emotionalSignal: "CONTEMPLATIVE",
      toolHint: [],
      silenceMode: true
    };
  }

  const { intent, subIntent, confidence } = classifyIntent(text, continuity, runtime);
  const urgency = computeUrgency(text);
  const emotionalSignal = inferEmotionalSignalFromLanguage(text, intent);
  const toolHint = toolHintsForIntent(intent, subIntent, runtime);

  return {
    intent,
    confidence,
    subIntent,
    urgency,
    emotionalSignal,
    toolHint,
    silenceMode: false
  };
}
