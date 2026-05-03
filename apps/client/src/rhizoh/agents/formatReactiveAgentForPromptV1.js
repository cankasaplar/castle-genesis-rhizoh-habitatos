/**
 * Optional one-line shadow for Rhizoh prompt assembly — does not mutate ecology or conductor.
 *
 * @param {Record<string, unknown> | null | undefined} reactiveLayer
 * @returns {string}
 */
export function formatReactiveAgentLayerForPromptV1(reactiveLayer) {
  const r = reactiveLayer && typeof reactiveLayer === "object" ? reactiveLayer : null;
  if (!r || r.ecologyWriteBack !== false) return "";
  const is = r.intentShapingSoft && typeof r.intentShapingSoft === "object" ? r.intentShapingSoft : {};
  const steer = r.attentionSteering && typeof r.attentionSteering === "object" ? r.attentionSteering : {};
  const bias = r.chorusSoftBias && typeof r.chorusSoftBias === "object" ? r.chorusSoftBias : {};
  const nf = r.narrativeFraming && typeof r.narrativeFraming === "object" ? r.narrativeFraming : {};
  const parts = [
    "Reactive agent shadow (read-only — no ecology write-back):",
    `soft deltas B${Number(is.BUILD).toFixed(2)} C${Number(is.CRISIS).toFixed(2)} P${Number(is.PLAY).toFixed(2)} O${Number(is.OBSERVE).toFixed(2)}`,
    steer.focusThreadId ? `attention_hint=${steer.focusThreadId} · urgency=${steer.urgency}` : null,
    bias.suggestedAccent ? `accent=${bias.suggestedAccent}` : null,
    nf.toneHint ? `tone=${nf.toneHint}` : null
  ].filter(Boolean);
  return parts.join(" · ");
}
