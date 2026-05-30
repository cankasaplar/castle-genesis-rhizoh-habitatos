/**
 * Phase 2 — full witness pipeline → attribution emit (staged).
 */

import {
  deriveVoiceInfluenceAttributionV0,
  recordVoiceInfluenceAttributionV0
} from "./voiceInfluenceAttributionV0.js";
import { resolveRhizohRelationshipKernelV0 } from "./rhizohRelationshipKernelV0.js";

/**
 * @param {{
 *   witnessed?: { observation?: { band?: string } },
 *   commitment?: { turnCounts?: boolean, memoryEligible?: boolean, behaviorEligible?: boolean },
 *   turnAcceptance?: { accepted?: boolean, reason?: string },
 *   sanityGate?: { accepted?: boolean }
 * }} pipeline
 * @param {{ source?: string, stage?: string, preview?: string, traceId?: string }} [detail]
 */
export function emitPipelineVoiceInfluenceAttributionV0(pipeline, detail = {}) {
  if (!pipeline?.witnessed?.observation) return null;
  const band = pipeline.witnessed.observation.band;
  const relationship = resolveRhizohRelationshipKernelV0({
    band,
    source: detail.source || "mic_v3",
    stage: detail.stage || "witness_pipeline",
    text: detail.preview
  });
  return recordVoiceInfluenceAttributionV0(
    deriveVoiceInfluenceAttributionV0({
      band,
      source: detail.source || "mic_v3",
      stage: detail.stage || "witness_pipeline",
      commitment: pipeline.commitment || null,
      turnAcceptance: pipeline.turnAcceptance || null,
      sanityAccepted: pipeline.sanityGate?.accepted
    }),
    {
      preview: detail.preview,
      phase: "pipeline",
      traceId: detail.traceId,
      attentionMode: relationship.legacyAttentionMode,
      attentionChannel: relationship.attentionChannel,
      attentionWeight: relationship.attentionWeight,
      sharedAttentionType: relationship.sharedAttentionType,
      interactionIntent: relationship.interactionIntent,
      responsePressure: relationship.effectiveResponsePressure,
      staticResponsePressure: relationship.staticResponsePressure,
      familiarityScore: relationship.mutualFamiliarity?.familiarityScore
    }
  );
}
