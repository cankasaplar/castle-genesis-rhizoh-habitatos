/**
 * Shadow-forward — rejected STT still feeds observation ring (no execution / no turn count).
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { observeMutualFamiliarityV0, publishMutualFamiliarityObservationV0 } from "./rhizohMutualFamiliarityFieldV0.js";
import {
  deriveVoiceInfluenceAttributionV0,
  recordVoiceInfluenceAttributionV0
} from "./voiceInfluenceAttributionV0.js";
import { finalizeVoiceWitnessShadowV0 } from "./voiceTranscriptWitnessPipelineV0.js";
import { voiceConfidenceRouterLogDetailV0 } from "./voiceTranscriptConfidenceRouterV0.js";
import { maybeEmitShadowReplaySignalsV0 } from "./voiceShadowReplayHookV0.js";
import { maybeEmitInterpretationStabilityV0 } from "./voiceInterpretationStabilityV0.js";
import { installShadowVoiceAnalysisExportV0 } from "./voiceShadowAnalysisExportV0.js";
import { recordVoiceTimelineFromRouteV0, installVoiceShadowTimelineV0 } from "./voiceShadowTimelineV0.js";

export const VOICE_TRANSCRIPT_SHADOW_FORWARD_SCHEMA =
  "castle.rhizoh.voice_transcript_shadow_forward.v0";

/**
 * @param {{
 *   text?: string,
 *   witnessed?: ReturnType<import("./voiceTranscriptWitnessPipelineV0.js").witnessRawVoiceTranscriptV0>,
 *   route?: ReturnType<import("./voiceTranscriptConfidenceRouterV0.js").routeVoiceTranscriptConfidenceV0>,
 *   source?: string,
 *   stage?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   recordedMs?: number
 * }} meta
 */
export function forwardVoiceTranscriptShadowV0(meta = {}) {
  const text = String(meta.text || "").trim();
  if (!text) return null;

  const route = meta.route || null;
  const witnessed = meta.witnessed || null;
  const source = String(meta.source || "mic_v3");
  const stage = String(meta.stage || "shadow_forward");
  const band = route?.band || witnessed?.observation?.band || "unknown";

  const actualGate = Object.freeze({
    accepted: false,
    reason: route?.reason || "shadow_forward",
    source
  });

  if (witnessed?.shadow) {
    finalizeVoiceWitnessShadowV0(witnessed, actualGate);
  }

  const familiarity = observeMutualFamiliarityV0({
    band,
    strategy: meta.strategy,
    maxRms: meta.maxRms
  });
  publishMutualFamiliarityObservationV0(familiarity, { stage, phase: "shadow_forward" });

  const attribution = recordVoiceInfluenceAttributionV0(
    deriveVoiceInfluenceAttributionV0({
      band,
      source,
      stage,
      sanityAccepted: route?.sanityAccepted,
      turnAcceptance: Object.freeze({ accepted: false, reason: route?.reason || "shadow_forward" })
    }),
    {
      preview: text.slice(0, 96),
      phase: "shadow_forward",
      shadowForward: true,
      recordedMs: meta.recordedMs,
      confidence: meta.confidence
    }
  );

  const payload = Object.freeze({
    schema: VOICE_TRANSCRIPT_SHADOW_FORWARD_SCHEMA,
    stage,
    source,
    preview: text.slice(0, 96),
    band,
    route: route ? voiceConfidenceRouterLogDetailV0(route) : null,
    familiarityScore: familiarity.familiarityScore
  });

  logVoiceInfoV0("SHADOW_FORWARD", payload);

  recordVoiceTimelineFromRouteV0(route, {
    preview: text.slice(0, 72),
    source,
    stage
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    const ring = Array.isArray(window.__rhizoh.voiceShadowForwardRing)
      ? window.__rhizoh.voiceShadowForwardRing
      : [];
    const entry = Object.freeze({
      ...payload,
      atMs: Date.now(),
      attributionKind: attribution?.kind,
      rejectionLayer: route?.rejectionLayer
    });
    ring.push(entry);
    window.__rhizoh.voiceShadowForwardRing = ring.slice(-32);
    maybeEmitShadowReplaySignalsV0(entry);
    maybeEmitInterpretationStabilityV0(entry);
    installShadowVoiceAnalysisExportV0();
    installVoiceShadowTimelineV0();
  }

  return Object.freeze({ familiarity, attribution, payload });
}
