/**
 * Phase 2 — full witness pipeline → attribution emit (staged).
 * Call when voiceTranscriptWitnessPipelineV0 lands in this repo; no memory coupling.
 */

import {
  deriveVoiceInfluenceAttributionV0,
  recordVoiceInfluenceAttributionV0
} from "./voiceInfluenceAttributionV0.js";

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
  return recordVoiceInfluenceAttributionV0(
    deriveVoiceInfluenceAttributionV0({
      band: pipeline.witnessed.observation.band,
      source: detail.source || "mic_v3",
      stage: detail.stage || "witness_pipeline",
      commitment: pipeline.commitment || null,
      turnAcceptance: pipeline.turnAcceptance || null,
      sanityAccepted: pipeline.sanityGate?.accepted
    }),
    { preview: detail.preview, phase: "pipeline", traceId: detail.traceId }
  );
}
