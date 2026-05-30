/**
 * Read-only relationship kernel emit on voice ingress (friend posture; no coach execution).
 */

import { classifyVoiceDirectedSpeechBandV0 } from "./voiceDirectedSpeechObservationV0.js";
import {
  initRhizohRelationshipKernelDebugV0,
  publishRhizohRelationshipKernelV0,
  resolveRhizohRelationshipKernelV0
} from "./rhizohRelationshipKernelV0.js";
import { publishVoiceAttentionContextV0, resolveVoiceAttentionContextV0 } from "./voiceAttentionContextV0.js";

initRhizohRelationshipKernelDebugV0();

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   source?: string,
 *   stage?: string,
 *   maxRms?: number,
 *   explicitMode?: string,
 *   explicitSharedAttention?: string
 * }} meta
 */
export function emitReadOnlyRhizohRelationshipKernelV0(meta = {}) {
  const observation = classifyVoiceDirectedSpeechBandV0(meta);
  const attention = resolveVoiceAttentionContextV0({
    explicitMode: meta.explicitMode,
    band: observation.band,
    source: meta.source || "mic_v3",
    stage: meta.stage || "read_only_ingress"
  });
  publishVoiceAttentionContextV0(attention, {
    preview: observation.preview,
    phase: "read_only"
  });
  const kernel = resolveRhizohRelationshipKernelV0({
    attention,
    explicitSharedAttention: meta.explicitSharedAttention,
    band: observation.band,
    source: meta.source || "mic_v3",
    stage: meta.stage || "read_only_ingress",
    text: meta.text,
    maxRms: meta.maxRms,
    strategy: meta.strategy,
    lifecycleEvent: meta.lifecycleEvent,
    lat: meta.lat,
    lon: meta.lon
  });
  return publishRhizohRelationshipKernelV0(kernel, {
    preview: observation.preview,
    phase: "read_only"
  });
}
