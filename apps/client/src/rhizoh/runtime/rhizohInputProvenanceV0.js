/**
 * Input provenance — explicit source/modality separation (STT ≠ UI ≠ assistant).
 * UI-origin text MUST NOT enter mic-derived intent pipeline.
 */

import { computeExecutionCommandHashV0 } from "./executionCommandHashV0.js";

export const RHIZOH_INPUT_PROVENANCE_SCHEMA_V0 = "castle.rhizoh.input_provenance.v0";

/** Canonical input origins — MUST be explicit at execution boundaries. */
export const RHIZOH_INPUT_SOURCE_V0 = Object.freeze({
  MIC: "mic",
  MIC_V3: "mic_v3",
  MIC_ONEND: "mic_onend",
  BARGE_IN: "barge_in",
  SPEECH_RECOGNITION: "speech_recognition_onresult",
  UI_TEXT: "ui_text",
  ASSISTANT: "assistant",
  SYSTEM: "system"
});

export const RHIZOH_INPUT_MODALITY_V0 = Object.freeze({
  VOICE: "voice",
  STT: "stt",
  TEXT: "text"
});

const MIC_DERIVED_SOURCES_V0 = new Set([
  RHIZOH_INPUT_SOURCE_V0.MIC,
  RHIZOH_INPUT_SOURCE_V0.MIC_V3,
  RHIZOH_INPUT_SOURCE_V0.MIC_ONEND,
  RHIZOH_INPUT_SOURCE_V0.BARGE_IN,
  RHIZOH_INPUT_SOURCE_V0.SPEECH_RECOGNITION
]);

const NON_MIC_SOURCES_V0 = new Set([
  RHIZOH_INPUT_SOURCE_V0.UI_TEXT,
  RHIZOH_INPUT_SOURCE_V0.ASSISTANT,
  RHIZOH_INPUT_SOURCE_V0.SYSTEM
]);

/**
 * @param {string} [source]
 */
export function isMicDerivedSourceV0(source) {
  return MIC_DERIVED_SOURCES_V0.has(String(source || ""));
}

/**
 * @param {string} [source]
 */
export function isUiOriginatedSourceV0(source) {
  return String(source || "") === RHIZOH_INPUT_SOURCE_V0.UI_TEXT;
}

/**
 * @param {string} [source]
 * @param {string} [modality]
 */
export function normalizeInputModalityV0(source, modality) {
  const m = String(modality || "").toLowerCase();
  if (m === RHIZOH_INPUT_MODALITY_V0.TEXT || m === RHIZOH_INPUT_MODALITY_V0.STT || m === RHIZOH_INPUT_MODALITY_V0.VOICE) {
    return m;
  }
  if (isUiOriginatedSourceV0(source)) return RHIZOH_INPUT_MODALITY_V0.TEXT;
  if (isMicDerivedSourceV0(source)) return RHIZOH_INPUT_MODALITY_V0.STT;
  return RHIZOH_INPUT_MODALITY_V0.TEXT;
}

/**
 * @param {{
 *   text?: string,
 *   source?: string,
 *   modality?: string,
 *   confidence?: number,
 *   band?: string,
 *   strategy?: string,
 *   traceId?: string
 * }} input
 */
export function buildInputProvenanceEnvelopeV0(input = {}) {
  const text = String(input.text || "").trim();
  const source = String(input.source || RHIZOH_INPUT_SOURCE_V0.MIC_V3);
  const modality = normalizeInputModalityV0(source, input.modality);
  const envelope = Object.freeze({
    schema: RHIZOH_INPUT_PROVENANCE_SCHEMA_V0,
    text,
    source,
    modality,
    confidence: Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : undefined,
    band: input.band ? String(input.band) : undefined,
    strategy: input.strategy ? String(input.strategy) : undefined,
    traceId: input.traceId ? String(input.traceId) : undefined,
    atMs: Date.now()
  });
  const originHash = computeInputOriginHashV0(envelope);
  return Object.freeze({ ...envelope, originHash });
}

/**
 * @param {ReturnType<typeof buildInputProvenanceEnvelopeV0>} envelope
 */
export function computeInputOriginHashV0(envelope) {
  return computeExecutionCommandHashV0({
    lane: "rhizoh_input_provenance",
    provenance: envelope.source,
    namespace: envelope.modality,
    type: "origin",
    payload: {
      text: envelope.text.slice(0, 256),
      confidence: envelope.confidence ?? null,
      band: envelope.band ?? null,
      strategy: envelope.strategy ?? null
    }
  });
}

/**
 * Mic/STT intent pipeline gate — UI and assistant origins forbidden.
 * @param {ReturnType<typeof buildInputProvenanceEnvelopeV0>} envelope
 */
export function validateMicIntentProvenanceV0(envelope) {
  if (!envelope?.text) {
    return Object.freeze({ ok: false, error: "empty_provenance", envelope });
  }
  if (isUiOriginatedSourceV0(envelope.source)) {
    return Object.freeze({
      ok: false,
      error: "ui_text_stt_pipeline_forbidden",
      envelope,
      rule: "UI-origin NEVER enters STT-derived intent pipeline"
    });
  }
  if (NON_MIC_SOURCES_V0.has(envelope.source) && envelope.modality === RHIZOH_INPUT_MODALITY_V0.STT) {
    return Object.freeze({
      ok: false,
      error: "non_mic_stt_modality_forbidden",
      envelope,
      rule: `${envelope.source} cannot claim STT modality`
    });
  }
  if (
    envelope.modality === RHIZOH_INPUT_MODALITY_V0.STT &&
    !isMicDerivedSourceV0(envelope.source)
  ) {
    return Object.freeze({
      ok: false,
      error: "implicit_stt_source_rejected",
      envelope,
      rule: "STT modality requires explicit mic-derived source"
    });
  }
  return Object.freeze({ ok: true, envelope });
}
