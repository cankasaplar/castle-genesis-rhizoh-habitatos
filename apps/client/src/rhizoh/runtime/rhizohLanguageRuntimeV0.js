/**
 * Single execution-time language snapshot — UI vs STT vs OLP vs TTS.
 * Presentation (ui) never drives STT; OLP drives LLM output + TTS + instant ack.
 */

import { publishCastleCommandInvariantV0 } from "./castleCommandInvariantV0.js";
import { exportCohortRuntimeSnapshotV0 } from "./rhizohCohortRuntimeSnapshotV0.js";
import { prewarmCommandRoutingV0 } from "./rhizohCommandRoutePreheatV0.js";
import { publishCastleExecutionInvariantV0 } from "./castleExecutionInvariantV0.js";
import { readCastleLanguageInvariantV0 } from "./rhizohLanguageInvariantV0.js";
import {
  hydrateOlpFromPersistedPreferenceV0,
  readOutputLanguagePolicyV0,
  readSttInputLanguageCodeHintV0,
  resolveOutputBcp47V0,
  resolveOutputLanguageCodeV0
} from "./rhizohOutputLanguagePolicyV0.js";
import { readVoiceLanguageLockBcp47V0, readVoiceLanguageLockV0 } from "./rhizohConversationLanguageV0.js";
import { readUiLocaleV0 } from "./rhizohUiLocaleV0.js";
import { resolveRhizohBcp47V0 } from "./rhizohMultilingualBridgeV0.js";

export const RHIZOH_LANGUAGE_RUNTIME_CONTRACT_V0 = "rhizoh.language_runtime.v0";

/**
 * @param {{ sttInferred?: string, sessionId?: string }} [opts]
 * @returns {Readonly<{
 *   schema: string,
 *   atMs: number,
 *   ui: { locale: string, bcp47: string, role: string },
 *   stt: { inputHint: string, inferred: string | null, role: string },
 *   olp: ReturnType<typeof readOutputLanguagePolicyV0> & { outputLocale: string, outputBcp47: string },
 *   tts: { voiceLocale: string, voiceBcp47: string, role: string },
 *   sessionId: string
 * }>}
 */
export function buildRhizohLanguageRuntimeSnapshotV0(opts = {}) {
  const uiLocale = readUiLocaleV0();
  const olp = readOutputLanguagePolicyV0();
  const outputLocale = resolveOutputLanguageCodeV0(opts.sttInferred || "");
  const outputBcp47 = resolveOutputBcp47V0(opts.sttInferred || "");
  const voiceLocale = readVoiceLanguageLockV0();
  const voiceBcp47 = readVoiceLanguageLockBcp47V0();

  const violations =
    typeof window !== "undefined" && Array.isArray(window.__RHIZOH_LANGUAGE_VIOLATIONS__)
      ? window.__RHIZOH_LANGUAGE_VIOLATIONS__
      : Object.freeze([]);

  return Object.freeze({
    schema: RHIZOH_LANGUAGE_RUNTIME_CONTRACT_V0,
    atMs: Date.now(),
    ui: Object.freeze({
      locale: uiLocale,
      bcp47: resolveRhizohBcp47V0(uiLocale),
      role: "presentation_only"
    }),
    stt: Object.freeze({
      inputHint: readSttInputLanguageCodeHintV0(),
      inferred: opts.sttInferred ? String(opts.sttInferred) : null,
      role: "input_capture_not_output"
    }),
    olp: Object.freeze({
      ...olp,
      outputLocale,
      outputBcp47,
      role: "behavior_controller_llm_output"
    }),
    tts: Object.freeze({
      voiceLocale,
      voiceBcp47,
      role: "rendering_aligned_to_olp"
    }),
    sessionId: String(opts.sessionId || ""),
    violations
  });
}

/**
 * Publish to window for prod debugging (Castle Layers / console).
 * @param {{ sttInferred?: string, sessionId?: string }} [opts]
 */
export function publishRhizohLanguageRuntimeSnapshotV0(opts = {}) {
  const snap = buildRhizohLanguageRuntimeSnapshotV0(opts);
  if (typeof window !== "undefined") {
    window.__RHIZOH_LANGUAGE_RUNTIME__ = snap;
    window.__CASTLE_LANGUAGE_RUNTIME__ = snap;
  }
  return snap;
}

/**
 * Boot order: OLP/runtime first — UI only reflects preference, never drives STT.
 * Call once before voice/LLM paths (App mount, ingress locale write).
 */
export function bootstrapCastleLanguageRuntimeV0() {
  hydrateOlpFromPersistedPreferenceV0();
  readOutputLanguagePolicyV0();
  readCastleLanguageInvariantV0();
  publishCastleCommandInvariantV0();
  publishCastleExecutionInvariantV0();
  prewarmCommandRoutingV0();
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_COHORT_SNAPSHOT_ON_BOOT === "1") {
    exportCohortRuntimeSnapshotV0({ runAttackSuite: true, maxReplayTapes: 20 });
  }
  return publishRhizohLanguageRuntimeSnapshotV0();
}
