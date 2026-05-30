/**
 * Phase 1 — read-only influence attribution (no gate / memory / behavior coupling).
 * Classifies ingress transcripts and stream lifecycle; does not change dispatch.
 */

import { classifyVoiceDirectedSpeechBandV0 } from "./voiceDirectedSpeechObservationV0.js";

import { emitReadOnlyRhizohRelationshipKernelV0 } from "./rhizohRelationshipKernelReadOnlyHookV0.js";
import {
  publishRhizohRelationshipKernelV0,
  resolveRhizohRelationshipKernelV0
} from "./rhizohRelationshipKernelV0.js";
import {
  deriveVoiceInfluenceAttributionV0,
  initVoiceInfluenceAttributionDebugV0,
  recordVoiceInfluenceAttributionV0
} from "./voiceInfluenceAttributionV0.js";

initVoiceInfluenceAttributionDebugV0();

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   source?: string,
 *   stage?: string,
 *   maxRms?: number
 * }} meta
 */
export function emitReadOnlyVoiceInfluenceAttributionV0(meta = {}) {
  const observation = classifyVoiceDirectedSpeechBandV0(meta);
  const kernel = emitReadOnlyRhizohRelationshipKernelV0(meta);
  return recordVoiceInfluenceAttributionV0(
    deriveVoiceInfluenceAttributionV0({
      band: observation.band,
      source: meta.source || "mic_v3",
      stage: meta.stage || "read_only_ingress"
    }),
    {
      preview: observation.preview,
      phase: "read_only",
      hints: observation.hints,
      attentionMode: kernel.legacyAttentionMode,
      attentionChannel: kernel.attentionChannel,
      attentionWeight: kernel.attentionWeight,
      sharedAttentionType: kernel.sharedAttentionType,
      interactionIntent: kernel.interactionIntent,
      responsePressure: kernel.effectiveResponsePressure,
      staticResponsePressure: kernel.staticResponsePressure,
      familiarityScore: kernel.mutualFamiliarity?.familiarityScore
    }
  );
}

/**
 * @param {string} code
 * @param {Record<string, unknown>} [detail]
 */
export function emitStreamLifecycleInfluenceV0(code, detail = {}) {
  publishRhizohRelationshipKernelV0(
    resolveRhizohRelationshipKernelV0({
      lifecycleEvent: code,
      source: detail.source || "mic_v3",
      stage: detail.stage || "stream_lifecycle",
      band: detail.band
    }),
    { phase: "read_only_lifecycle", code }
  );
  return recordVoiceInfluenceAttributionV0(
    deriveVoiceInfluenceAttributionV0({
      streamCode: code,
      source: String(detail.source || "mic_v3"),
      stage: String(detail.stage || "stream_lifecycle")
    }),
    { phase: "read_only", ...detail }
  );
}
