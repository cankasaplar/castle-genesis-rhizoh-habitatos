/**
 * Unified language propagation — UI / Speech / LLM planes (frontend SSOT).
 * @see docs/RHIZOH_MULTILINGUAL_BRIDGE_V0.md
 */

import { resolveRhizohBcp47V0, resolveRhizohLanguageCatalogRowV0 } from "./rhizohMultilingualBridgeV0.js";
import { readOutputLanguagePolicyV0, resolveOutputBcp47V0 } from "./rhizohOutputLanguagePolicyV0.js";
import {
  readRhizohSpeechProfileV0,
  RHIZOH_SPEECH_MODE_V0,
  resolveRhizohSpeechSttLanguageCodeV0
} from "./rhizohSpeechProfileV0.js";
import { readUiLocaleV0 } from "./rhizohUiLocaleV0.js";

export const RHIZOH_LANGUAGE_PROPAGATION_SCHEMA_V0 = "castle.rhizoh.language_propagation.v0";

export const RHIZOH_LANG_HEADER_UI_V0 = "x-rhizoh-ui-lang";
export const RHIZOH_LANG_HEADER_SPEECH_V0 = "x-rhizoh-speech-lang";
export const RHIZOH_LANG_HEADER_LLM_V0 = "x-rhizoh-llm-lang";
export const RHIZOH_LANG_HEADER_TRACE_V0 = "x-rhizoh-language-trace-id";

/** @returns {string} e.g. TRC-m3k9x2-a1b2c3 */
export function createRhizohLanguageTraceIdV0() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `TRC-${t}-${r}`;
}

/**
 * Compact snapshot for gateway correlation (LLM 500 / drift regression).
 * @param {ReturnType<typeof buildRhizohLanguagePropagationSnapshotV0>} snap
 */
export function toRhizohLanguageSnapshotCompactV0(snap) {
  return Object.freeze({
    ui: snap.uiLang,
    speech: snap.speechLang,
    llm: snap.llmBcp47
  });
}

/**
 * UI plane — immutable after ingress pick (read via OLP / storage, not navigator).
 * @returns {string} short code e.g. tr
 */
export function resolveRhizohUiLanguageCodeV0() {
  return readOutputLanguagePolicyV0().language || readUiLocaleV0();
}

/**
 * Speech plane token for headers (auto | short code | bcp47).
 * @returns {string}
 */
export function resolveRhizohSpeechLanguageTokenV0() {
  return resolveRhizohSpeechSttLanguageCodeV0() || "auto";
}

/**
 * LLM plane: UI soft prior; speech manual/mirror strong override; auto uses detected hint when present.
 * @param {string} [detectedSpeechCode] short or bcp47 from STT inference
 * @returns {{ bcp47: string, short: string, source: string }}
 */
export function resolveRhizohLlmLanguageV0(detectedSpeechCode = "") {
  const uiShort = resolveRhizohUiLanguageCodeV0();
  const uiBcp47 = resolveOutputBcp47V0();
  const profile = readRhizohSpeechProfileV0();
  const detected = String(detectedSpeechCode || "").trim().toLowerCase();

  if (profile?.mode === RHIZOH_SPEECH_MODE_V0.MANUAL && profile.manualLocale) {
    const row = resolveRhizohLanguageCatalogRowV0(profile.manualLocale);
    return Object.freeze({ bcp47: row.bcp47, short: row.code, source: "speech_manual" });
  }
  if (profile?.mode === RHIZOH_SPEECH_MODE_V0.MIRROR_UI) {
    return Object.freeze({ bcp47: uiBcp47, short: uiShort, source: "speech_mirror_ui" });
  }
  if (profile?.mode === RHIZOH_SPEECH_MODE_V0.AUTO && detected && detected !== "auto" && detected !== "und") {
    const row = resolveRhizohLanguageCatalogRowV0(detected.split("-")[0]);
    return Object.freeze({ bcp47: row.bcp47, short: row.code, source: "speech_auto_detected" });
  }
  return Object.freeze({ bcp47: uiBcp47, short: uiShort, source: "ui_prior" });
}

/**
 * @param {string} [detectedSpeechCode]
 */
export function buildRhizohLanguagePropagationSnapshotV0(detectedSpeechCode = "") {
  const uiShort = resolveRhizohUiLanguageCodeV0();
  const speechToken = resolveRhizohSpeechLanguageTokenV0();
  const llm = resolveRhizohLlmLanguageV0(detectedSpeechCode);
  const profile = readRhizohSpeechProfileV0();
  return Object.freeze({
    schema: RHIZOH_LANGUAGE_PROPAGATION_SCHEMA_V0,
    uiLang: uiShort,
    uiBcp47: resolveRhizohBcp47V0(uiShort),
    speechLang: speechToken,
    speechMode: profile?.mode || RHIZOH_SPEECH_MODE_V0.AUTO,
    llmLang: llm.short,
    llmBcp47: llm.bcp47,
    llmSource: llm.source,
    atMs: Date.now()
  });
}

/**
 * HTTP headers for gateway alignment (no silent EN fallback).
 * @param {string} [detectedSpeechCode]
 * @returns {Record<string, string>}
 */
export function buildRhizohLanguagePropagationHeadersV0(detectedSpeechCode = "") {
  return buildRhizohLanguagePropagationBundleV0(detectedSpeechCode).headers;
}

/**
 * Full propagation bundle: trace id, headers, body fields (single graph per request).
 * @param {string} [detectedSpeechCode]
 */
export function buildRhizohLanguagePropagationBundleV0(detectedSpeechCode = "") {
  const traceId = createRhizohLanguageTraceIdV0();
  const snapshot = buildRhizohLanguagePropagationSnapshotV0(detectedSpeechCode);
  const compact = toRhizohLanguageSnapshotCompactV0(snapshot);
  const headers = Object.freeze({
    [RHIZOH_LANG_HEADER_UI_V0]: snapshot.uiLang,
    [RHIZOH_LANG_HEADER_SPEECH_V0]: snapshot.speechLang,
    [RHIZOH_LANG_HEADER_LLM_V0]: snapshot.llmBcp47,
    [RHIZOH_LANG_HEADER_TRACE_V0]: traceId
  });
  const bodyFields = Object.freeze({
    rhizoh_language_trace_id: traceId,
    rhizoh_language_snapshot: compact,
    languagePropagation: Object.freeze({ ...snapshot, traceId, languageSnapshot: compact })
  });
  return Object.freeze({ traceId, snapshot, compact, headers, bodyFields });
}

/**
 * Last client-side propagation (debug / drift regression).
 * @param {ReturnType<typeof buildRhizohLanguagePropagationBundleV0>} bundle
 */
export function publishRhizohLanguagePropagationDebugV0(bundle) {
  if (typeof window === "undefined" || !bundle) return;
  try {
    window.__CASTLE_RHIZOH_LANGUAGE_PROPAGATION__ = Object.freeze({
      traceId: bundle.traceId,
      snapshot: bundle.compact,
      full: bundle.snapshot,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}

/**
 * @param {Record<string, string>} [base]
 * @param {string} [detectedSpeechCode]
 * @param {ReturnType<typeof buildRhizohLanguagePropagationBundleV0>} [existingBundle]
 */
export function mergeRhizohLanguagePropagationHeadersV0(
  base = {},
  detectedSpeechCode = "",
  existingBundle = null
) {
  const bundle = existingBundle || buildRhizohLanguagePropagationBundleV0(detectedSpeechCode);
  publishRhizohLanguagePropagationDebugV0(bundle);
  return { ...base, ...bundle.headers };
}
