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
import { sanitizeVoiceTranscriptForDispatchV3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";
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
import { recordVoiceInfluenceAttributionV0, deriveVoiceInfluenceAttributionV0 } from "./voiceInfluenceAttributionV0.js";
import { emitPipelineVoiceInfluenceAttributionV0 } from "./voiceInfluenceAttributionPipelineHookV0.js";
import { publishRhizohRelationshipKernelV0, resolveRhizohRelationshipKernelV0 } from "./rhizohRelationshipKernelV0.js";
import { publishVoiceAttentionContextV0, resolveVoiceAttentionContextV0 } from "./voiceAttentionContextV0.js";

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
    confidence: observation.confidence,
    strategy: observation.strategy,
    source: observation.source,
    maxRms: Number.isFinite(Number(meta.maxRms)) ? Number(meta.maxRms) : undefined
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
 *   runTurnGate?: boolean
 * }} meta
 */
export function runVoiceTranscriptWitnessPipelineV0(meta = {}) {
  const text = String(meta.text || "").trim();
  const source = String(meta.source || "mic");
  const stage = String(meta.stage || "raw_transcript");

  const witnessed = witnessRawVoiceTranscriptV0({ ...meta, text, source, stage });
  const preCommitment = evaluateVoiceCommitmentFromBandV0(witnessed.observation.band, { source });
  publishVoiceBehavioralCommitmentV0(preCommitment, { stage, phase: "pre_gate" });

  const sane = sanitizeVoiceTranscriptForDispatchV3(text, {
    confidence: Number.isFinite(Number(meta.confidence)) ? Number(meta.confidence) : undefined,
    strategy: meta.strategy || "",
    checkRepeat: meta.checkRepeat !== false
  });

  const sanityGate = Object.freeze({
    accepted: sane.ok === true,
    reason: sane.ok ? "sanity_ok" : sane.reason || "quality_reject"
  });

  logVoiceInfoV0("GATE_SANITY", {
    stage,
    accepted: sanityGate.accepted,
    reason: sanityGate.reason,
    band: witnessed.observation.band,
    preview: text.slice(0, 96),
    confidence: meta.confidence,
    source
  });

  if (!sanityGate.accepted) {
    logVoiceWarnV0("GATE_SANITY_REJECT", {
      stage,
      reason: sanityGate.reason,
      band: witnessed.observation.band,
      preview: text.slice(0, 96)
    });
  }

  /** @type {ReturnType<typeof evaluateVoiceTurnAcceptanceV0> | null} */
  let turnAcceptance = null;
  if (meta.runTurnGate === true && sanityGate.accepted) {
    turnAcceptance = evaluateVoiceTurnAcceptanceV0({
      text: sane.text,
      confidence: meta.confidence,
      strategy: meta.strategy,
      maxRms: meta.maxRms,
      source
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

  const actualGate =
    turnAcceptance ||
    (sanityGate.accepted
      ? null
      : Object.freeze({ accepted: false, reason: sanityGate.reason, source }));

  finalizeVoiceWitnessShadowV0(witnessed, actualGate);

  const commitment = finalizeVoiceBehavioralCommitmentV0({
    band: witnessed.observation.band,
    source,
    sanityAccepted: sanityGate.accepted,
    turnAccepted: turnAcceptance?.accepted === true,
    turnReason: turnAcceptance?.reason
  });
  publishVoiceBehavioralCommitmentV0(commitment, { stage, phase: "post_gate" });

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
    turnAcceptance,
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
  const commitment = finalizeVoiceBehavioralCommitmentV0({
    band: witnessed.observation.band,
    source: meta.source,
    sanityAccepted: true,
    turnAccepted: turnAcceptance.accepted === true,
    turnReason: turnAcceptance.reason
  });
  publishVoiceBehavioralCommitmentV0(commitment, { stage, phase: "post_turn_gate" });
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
  return turnAcceptance;
}
