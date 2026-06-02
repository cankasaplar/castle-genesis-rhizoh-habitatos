/**
 * Voice confidence breakdown — observation telemetry (not execution authority).
 */

import { VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import { resolveVoiceAttentionContextV0 } from "./voiceAttentionContextV0.js";

/**
 * @param {{
 *   confidence?: number,
 *   strategy?: string,
 *   directedScore?: number,
 *   ambientScore?: number,
 *   band?: string
 * }} [meta]
 * @param {ReturnType<import("./voiceTranscriptConfidenceRouterV0.js").routeVoiceTranscriptConfidenceV0>} [route]
 */
export function buildVoiceConfidenceBreakdownV0(meta = {}, route = null) {
  const whisperConfidence = Number.isFinite(Number(meta.confidence))
    ? Number(meta.confidence)
    : Number.isFinite(Number(route?.confidence))
      ? Number(route.confidence)
      : null;

  const directedScore = Number(meta.directedScore ?? 0);
  const ambientScore = Number(meta.ambientScore ?? 0);
  const semanticConfidence =
    directedScore >= 2
      ? 0.82
      : directedScore >= 1
        ? 0.68
        : ambientScore >= 2
          ? 0.25
          : 0.45;

  const attention = resolveVoiceAttentionContextV0({
    band: meta.band || route?.band,
    source: meta.source
  });
  const attentionConfidence = Number(attention?.attentionWeight ?? 0.5);

  let finalConfidence = whisperConfidence;
  if (Number.isFinite(whisperConfidence)) {
    finalConfidence = Math.min(
      1,
      Math.max(
        0,
        whisperConfidence * 0.55 + semanticConfidence * 0.3 + attentionConfidence * 0.15
      )
    );
  } else {
    finalConfidence = semanticConfidence * 0.7 + attentionConfidence * 0.3;
  }

  return Object.freeze({
    whisperConfidence,
    semanticConfidence: Number(semanticConfidence.toFixed(3)),
    attentionConfidence: Number(attentionConfidence.toFixed(3)),
    finalConfidence: Number.isFinite(finalConfidence)
      ? Number(finalConfidence.toFixed(3))
      : null,
    threshold: VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3,
    attentionMode: attention?.mode || null
  });
}
