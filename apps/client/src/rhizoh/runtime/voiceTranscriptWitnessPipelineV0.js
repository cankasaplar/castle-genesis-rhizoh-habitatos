/**
 * Canonical voice transcript order (always):
 *   RAW → WITNESS LOG → SHADOW EVAL → SANITY GATE → TURN GATE → shadow finalize
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import { classifyVoiceDirectedSpeechBandV0 } from "./voiceDirectedSpeechObservationV0.js";
import {
  evaluateVoiceShadowReleaseV0,
  recordVoiceObservationShadowV0,
  voiceWitnessBandWeightV0
} from "./voiceObservationShadowV0.js";
import { isVoiceWitnessShadowEnabledV0 } from "./isDirectedSpeechGateReleaseEnabledV0.js";
import {
  routeVoiceTranscriptConfidenceV0,
  voiceConfidenceRouterLogDetailV0
} from "./voiceTranscriptConfidenceRouterV0.js";
import { forwardVoiceTranscriptShadowV0 } from "./voiceTranscriptShadowForwardV0.js";
import {
  evaluateVoiceTurnAcceptanceV0,
  voiceTurnAcceptanceLogDetailV0
} from "./voiceTurnAcceptanceGateV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import {
  evaluateVoiceCommitmentFromBandV0,
  finalizeVoiceBehavioralCommitmentV0,
  publishVoiceBehavioralCommitmentV0
} from "./voiceBehavioralCommitmentV0.js";
import { resolvePostGateCommitmentV0 } from "./voicePostGateConsistencyV0.js";
import { recordVoiceInfluenceAttributionV0, deriveVoiceInfluenceAttributionV0 } from "./voiceInfluenceAttributionV0.js";
import { emitPipelineVoiceInfluenceAttributionV0 } from "./voiceInfluenceAttributionPipelineHookV0.js";
import { publishRhizohRelationshipKernelV0, resolveRhizohRelationshipKernelV0 } from "./rhizohRelationshipKernelV0.js";
import { publishVoiceAttentionContextV0, resolveVoiceAttentionContextV0 } from "./voiceAttentionContextV0.js";
import { applySttTemporalSmoothingV0 } from "./sttTemporalSmoothingV0.js";
import { VOICE_ROUTER_REJECTION_LAYER_V0 } from "./voiceTranscriptConfidenceRouterV0.js";

export const VOICE_TRANSCRIPT_WITNESS_PIPELINE_SCHEMA =
  "castle.rhizoh.voice_transcript_witness_pipeline.v0";

let lastShadowDedupKey = "";
let lastShadowDedupAtMs = 0;
const SHADOW_DEDUP_MS = 5000;

/**
 * Step 1–2 only: label + log + shadow eval (no gate authority).
 * @param {Parameters<typeof classifyVoiceDirectedSpeechBandV0>[0] & { stage?: string }} meta
 */
export function witnessRawVoiceTranscriptV0(meta = {}) {
  const stage = String(meta.stage || "raw_transcript");
  const observation = classifyVoiceDirectedSpeechBandV0(meta);

  const noiseWeight = voiceWitnessBandWeightV0(observation.band);
  logVoiceInfoV0("WITNESS", {
    stage,
    band: observation.band,
    noiseWeight,
    hints: observation.hints,
    preview: observation.preview,
    ambientScore: observation.ambientScore,
    directedScore: observation.directedScore,
    unknownScore: observation.unknownScore,
    reason: observation.reason,
    energyTier: observation.energyTier,
    energyRatio: observation.energyRatio,
    roomBaselineRms: observation.roomBaselineRms,
    confidence: observation.confidence,
    strategy: observation.strategy,
    source: observation.source,
    maxRms: Number.isFinite(Number(meta.maxRms)) ? Number(meta.maxRms) : undefined
  });
  logVoiceInfoV0("DIRECTED_SPEECH_CLASSIFIER", {
    stage,
    band: observation.band,
    directedScore: observation.directedScore,
    ambientScore: observation.ambientScore,
    unknownScore: observation.unknownScore,
    reason: observation.reason,
    preview: observation.preview
  });

  const shadow = isVoiceWitnessShadowEnabledV0() ? evaluateVoiceShadowReleaseV0(meta) : null;
  const attention = publishVoiceAttentionContextV0(
    resolveVoiceAttentionContextV0({
      band: observation.band,
      source: observation.source || meta.source,
      stage
    }),
    { preview: observation.preview, phase: "witness" }
  );
  const relationship = publishRhizohRelationshipKernelV0(
    resolveRhizohRelationshipKernelV0({
      attention,
      band: observation.band,
      source: observation.source || meta.source,
      stage,
      text: meta.text,
      maxRms: meta.maxRms,
      strategy: meta.strategy
    }),
    { preview: observation.preview, phase: "witness" }
  );
  return Object.freeze({ observation, shadow, stage, attention, relationship });
}

/**
 * @param {ReturnType<typeof witnessRawVoiceTranscriptV0>} witnessed
 * @param {{ accepted?: boolean, reason?: string } | null} actualGate
 */
export function finalizeVoiceWitnessShadowV0(witnessed, actualGate = null) {
  if (!witnessed?.shadow || !isVoiceWitnessShadowEnabledV0()) {
    return getVoiceWitnessPipelineSnapshotV0();
  }

  const dedupKey = `${witnessed.observation.preview || ""}|${witnessed.stage || ""}`;
  const now = Date.now();
  if (dedupKey === lastShadowDedupKey && now - lastShadowDedupAtMs < SHADOW_DEDUP_MS) {
    return getVoiceWitnessPipelineSnapshotV0();
  }
  lastShadowDedupKey = dedupKey;
  lastShadowDedupAtMs = now;

  const shadow = witnessed.shadow;
  recordVoiceObservationShadowV0(shadow, actualGate);

  if (shadow.shadowWouldOpenTurn) {
    logVoiceInfoV0("SHADOW_RELEASE_WOULD_ACCEPT", {
      stage: witnessed.stage,
      band: witnessed.observation.band,
      preview: witnessed.observation.preview,
      confidence: shadow.confidence,
      threshold: shadow.threshold,
      sanityPass: shadow.sanityPass,
      actualAccepted: actualGate?.accepted === true,
      actualReason: actualGate?.reason || null
    });
  }
  if (shadow.shadowFalsePositive) {
    logVoiceInfoV0("SHADOW_FALSE_POSITIVE_RISK", {
      stage: witnessed.stage,
      band: witnessed.observation.band,
      preview: witnessed.observation.preview
    });
  }

  return getVoiceWitnessPipelineSnapshotV0();
}

/**
 * Lifecycle jitter (no transcript) — still witness for Atlas.
 * @param {{ code: string, detail?: Record<string, unknown>, source?: string, stage?: string }} evt
 */
export function witnessVoiceStreamLifecycleV0(evt = {}) {
  const code = String(evt.code || "unknown");
  logVoiceInfoV0("WITNESS_STREAM", {
    stage: evt.stage || "stream_lifecycle",
    code,
    source: evt.source || "mic_v3",
    ...evt.detail
  });
  recordVoiceInfluenceAttributionV0(
    deriveVoiceInfluenceAttributionV0({
      streamCode: code,
      source: evt.source || "mic_v3",
      stage: evt.stage || "stream_lifecycle",
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
    }),
    evt.detail || {}
  );
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.voiceWitnessLastStream = Object.freeze({
      atMs: Date.now(),
      code,
      detail: evt.detail || null
    });
  }
}

/**
 * Full pipeline for one raw transcript.
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   source?: string,
 *   stage?: string,
 *   checkRepeat?: boolean,
 *   runTurnGate?: boolean,
 *   recordedMs?: number,
 *   shadowForwardOnReject?: boolean
 * }} meta
 */
export function runVoiceTranscriptWitnessPipelineV0(meta = {}) {
  const text = String(meta.text || "").trim();
  const source = String(meta.source || "mic");
  const stage = String(meta.stage || "raw_transcript");

  const temporal =
    meta.skipTemporalIngest === true && meta.temporal && typeof meta.temporal === "object"
      ? meta.temporal
      : applySttTemporalSmoothingV0({
          text,
          confidence: meta.confidence,
          maxRms: meta.maxRms,
          source,
          isFinal: meta.isFinal !== false,
          stage,
          band: meta.band,
          ambientScore: meta.ambientScore,
          noiseDetectedHigh: meta.noiseDetectedHigh,
          userId: meta.userId,
          micDeviceId: meta.micDeviceId
        });

  const gateConfidence =
    Number.isFinite(Number(meta.gateConfidence)) && meta.skipTemporalIngest === true
      ? Number(meta.gateConfidence)
      : temporal.effectiveConfidence ?? meta.confidence;

  if (temporal.suppress) {
    const witnessed = witnessRawVoiceTranscriptV0({
      ...meta,
      text,
      source,
      stage,
      confidence: gateConfidence
    });
    const preCommitment = evaluateVoiceCommitmentFromBandV0(witnessed.observation.band, { source });
    publishVoiceBehavioralCommitmentV0(preCommitment, { stage, phase: "pre_gate" });
    const reason = temporal.scriptOutlier ? "temporal_script_outlier" : "temporal_noise_spike";
    const route = Object.freeze({
      executionAccepted: false,
      observationForward: temporal.scriptOutlier === true,
      reason,
      source,
      rejectionLayer: VOICE_ROUTER_REJECTION_LAYER_V0.SANITY,
      preview: text.slice(0, 96),
      confidence: gateConfidence
    });
    const sanityGate = Object.freeze({
      accepted: false,
      reason,
      observationForward: route.observationForward === true
    });
    const sane = Object.freeze({
      ok: false,
      text,
      reason,
      confidence: gateConfidence,
      strategy: meta.strategy,
      shadowForward: route.observationForward === true
    });
    logVoiceWarnV0("GATE_TEMPORAL_SUPPRESS", {
      stage,
      reason,
      majorityScript: temporal.majorityScript,
      scriptCoherence: temporal.scriptCoherence,
      preview: text.slice(0, 96)
    });
    const commitment = finalizeVoiceBehavioralCommitmentV0({
      band: witnessed.observation.band,
      source,
      sanityAccepted: false,
      turnAccepted: false,
      turnReason: reason
    });
    return Object.freeze({
      witnessed,
      preCommitment,
      commitment,
      attribution: null,
      sane,
      sanityGate,
      route,
      turnAcceptance: null,
      temporal,
      snapshot: getVoiceWitnessPipelineSnapshotV0()
    });
  }

  const witnessed = witnessRawVoiceTranscriptV0({ ...meta, text, source, stage, confidence: gateConfidence });
  const preCommitment = evaluateVoiceCommitmentFromBandV0(witnessed.observation.band, { source });
  publishVoiceBehavioralCommitmentV0(preCommitment, { stage, phase: "pre_gate" });

  const route = routeVoiceTranscriptConfidenceV0({
    text,
    confidence: gateConfidence,
    strategy: meta.strategy,
    maxRms: meta.maxRms,
    source,
    recordedMs: meta.recordedMs,
    checkRepeat: meta.checkRepeat !== false,
    band: witnessed.observation.band,
    sttLanguageHint: meta.sttLanguageHint,
    vepmConfidence: meta.vepmConfidence,
    phantomLikely: meta.phantomLikely
  });

  const sanityGate = Object.freeze({
    accepted: route.executionAccepted === true,
    reason: route.executionAccepted ? "sanity_ok" : route.reason || "quality_reject",
    observationForward: route.observationForward === true
  });

  const sane = Object.freeze({
    ok: route.executionAccepted === true,
    text,
    reason: route.reason,
    confidence: route.confidence,
    strategy: meta.strategy,
    shadowForward: route.shadowForward === true,
    softScriptMismatch:
      route.reason === "script_locale_mismatch" && route.observationForward === true
  });

  logVoiceInfoV0("GATE_CONFIDENCE_ROUTER", {
    stage,
    ...voiceConfidenceRouterLogDetailV0(route, {
      confidence: meta.confidence,
      strategy: meta.strategy,
      directedScore: witnessed.observation.directedScore,
      ambientScore: witnessed.observation.ambientScore,
      band: witnessed.observation.band,
      source
    }),
    band: witnessed.observation.band,
    preview: text.slice(0, 96)
  });

  if (!route.executionAccepted && route.reason !== "non_voice") {
    const layer = route.rejectionLayer;
    if (layer === "sanity") {
      logVoiceWarnV0("GATE_ROUTER_SANITY_REJECT", {
        stage,
        reason: route.reason,
        rejectionLayer: layer,
        band: witnessed.observation.band,
        preview: text.slice(0, 96),
        observationForward: route.observationForward === true
      });
    } else if (layer === "interaction") {
      logVoiceInfoV0("GATE_ROUTER_INTERACTION_REJECT", {
        stage,
        reason: route.reason,
        rejectionLayer: layer,
        band: witnessed.observation.band,
        preview: text.slice(0, 96),
        observationForward: route.observationForward === true,
        confidence: route.confidence,
        threshold: route.threshold
      });
    } else {
      logVoiceWarnV0("GATE_ROUTER_REJECT", {
        stage,
        reason: route.reason,
        rejectionLayer: layer,
        band: witnessed.observation.band,
        preview: text.slice(0, 96),
        observationForward: route.observationForward === true
      });
    }
  }

  /** @type {ReturnType<typeof evaluateVoiceTurnAcceptanceV0> | null} */
  let turnAcceptance = null;
  if (meta.runTurnGate === true) {
    turnAcceptance = evaluateVoiceTurnAcceptanceV0({
      text,
      confidence: gateConfidence,
      strategy: meta.strategy,
      maxRms: meta.maxRms,
      source,
      recordedMs: meta.recordedMs,
      band: witnessed.observation.band
    });
    logVoiceInfoV0("GATE_TURN", {
      stage,
      ...voiceTurnAcceptanceLogDetailV0(turnAcceptance),
      band: witnessed.observation.band
    });
    if (!turnAcceptance.accepted && turnAcceptance.reason !== "non_voice") {
      logVoiceInfoV0("GATE_TURN_REJECT", {
        stage,
        ...voiceTurnAcceptanceLogDetailV0(turnAcceptance),
        band: witnessed.observation.band
      });
    }
  }

  if (
    meta.shadowForwardOnReject !== false &&
    route.observationForward === true &&
    !route.executionAccepted
  ) {
    forwardVoiceTranscriptShadowV0({
      text,
      witnessed,
      route,
      source,
      stage: `${stage}_shadow_forward`,
      confidence: meta.confidence,
      strategy: meta.strategy,
      maxRms: meta.maxRms,
      recordedMs: meta.recordedMs
    });
  }

  const actualGate = Object.freeze({
    accepted: route.executionAccepted === true,
    reason: route.reason,
    source
  });

  finalizeVoiceWitnessShadowV0(witnessed, actualGate);

  const { commitment, consistency } = resolvePostGateCommitmentV0({
    route,
    turnAcceptance,
    band: witnessed.observation.band,
    source
  });
  publishVoiceBehavioralCommitmentV0(commitment, {
    stage,
    phase: "post_gate",
    routeExecutionAccepted: consistency.routeExecutionAccepted,
    turnExecutionAccepted: consistency.turnExecutionAccepted,
    turnRouteMismatch: consistency.turnRouteMismatch,
    policyDivergence: consistency.policyDivergence
  });

  const attribution = emitPipelineVoiceInfluenceAttributionV0(
    {
      witnessed,
      commitment,
      turnAcceptance,
      sanityGate
    },
    { source, stage, preview: text.slice(0, 96) }
  );

  const snapshot = getVoiceWitnessPipelineSnapshotV0();
  return Object.freeze({
    witnessed,
    preCommitment,
    commitment,
    attribution,
    sane,
    sanityGate,
    route,
    turnAcceptance,
    temporal,
    snapshot
  });
}

export function getVoiceWitnessPipelineSnapshotV0() {
  if (typeof window === "undefined") return null;
  return window.__rhizoh?.voiceWitnessShadow ?? null;
}

export function resetVoiceWitnessPipelineForTestV0() {
  lastShadowDedupKey = "";
  lastShadowDedupAtMs = 0;
}

/** @deprecated Prefer runVoiceTranscriptWitnessPipelineV0 */
export function observeVoiceTranscriptWitnessV0(meta = {}) {
  if (meta.actualAcceptance != null) {
    const witnessed = witnessRawVoiceTranscriptV0(meta);
    finalizeVoiceWitnessShadowV0(witnessed, meta.actualAcceptance);
    return Object.freeze({ observation: witnessed.observation, shadow: witnessed.shadow });
  }
  const pipe = runVoiceTranscriptWitnessPipelineV0({
    ...meta,
    runTurnGate: meta.runTurnGate === true
  });
  return Object.freeze({
    observation: pipe.witnessed.observation,
    shadow: pipe.witnessed.shadow
  });
}

/**
 * Turn gate only — call after raw witness (e.g. v3 orchestrator already witnessed).
 * @param {ReturnType<typeof witnessRawVoiceTranscriptV0>} witnessed
 * @param {Parameters<typeof evaluateVoiceTurnAcceptanceV0>[0]} meta
 */
export function runVoiceTurnGateAfterWitnessV0(witnessed, meta = {}) {
  const turnAcceptance = evaluateVoiceTurnAcceptanceV0(meta);
  const stage = String(meta.stage || "turn_gate");
  logVoiceInfoV0("GATE_TURN", {
    stage,
    ...voiceTurnAcceptanceLogDetailV0(turnAcceptance),
    band: witnessed.observation.band
  });
  if (!turnAcceptance.accepted && turnAcceptance.reason !== "non_voice") {
    logVoiceInfoV0("GATE_TURN_REJECT", {
      stage,
      ...voiceTurnAcceptanceLogDetailV0(turnAcceptance),
      band: witnessed.observation.band
    });
  }
  finalizeVoiceWitnessShadowV0(witnessed, turnAcceptance);
  const route = routeVoiceTranscriptConfidenceV0({
    text: meta.text,
    confidence: meta.confidence,
    strategy: meta.strategy,
    maxRms: meta.maxRms,
    source: meta.source,
    recordedMs: meta.recordedMs,
    checkRepeat: false,
    band: witnessed.observation.band
  });
  const { commitment, consistency } = resolvePostGateCommitmentV0({
    route,
    turnAcceptance,
    band: witnessed.observation.band,
    source: meta.source
  });
  publishVoiceBehavioralCommitmentV0(commitment, {
    stage,
    phase: "post_turn_gate",
    policyDivergence: consistency.policyDivergence,
    turnRouteMismatch: consistency.turnRouteMismatch
  });
  recordVoiceInfluenceAttributionV0(
    deriveVoiceInfluenceAttributionV0({
      band: witnessed.observation.band,
      source: meta.source,
      stage,
      commitment,
      turnAcceptance,
      sanityAccepted: true
    }),
    { preview: String(meta.text || "").slice(0, 96), phase: "post_turn_gate" }
  );
  return Object.freeze({
    ...turnAcceptance,
    commitment,
    consistency
  });
}
