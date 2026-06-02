/**
 * Output Language Policy (OLP) — owns output locale state.
 * UI writes preference via applyUiLanguagePreferenceToOlpV0 (event), not continuous read-back.
 */

import { resolveRhizohBcp47V0, resolveRhizohLanguageCatalogRowV0 } from "./rhizohMultilingualBridgeV0.js";
import { normalizeUiLocaleV0, resolveDefaultUiLocaleV0, RHIZOH_UI_LAUNCH_LOCALES_V0 } from "./rhizohUiLocaleV0.js";
import { resolveRhizohSpeechSttLanguageCodeV0 } from "./rhizohSpeechProfileV0.js";

export const RHIZOH_OUTPUT_LANGUAGE_POLICY_CONTRACT_V0 = "rhizoh.output_language_policy.v0";
export const RHIZOH_UI_LANGUAGE_PREFERENCE_EVENT_V0 = "rhizoh:ui-language-preference";

export const OLP_MODE_V0 = Object.freeze({
  UI_LOCKED_OUTPUT: "ui_locked_output",
  MIRROR: "mirror",
  ADAPTIVE: "adaptive"
});

const STORAGE_KEY_V0 = "rhizoh.user.language.v0";

/** @type {string | null} — owned by OLP; set only via apply/hydrate */
let olpPreferenceLocale = null;

function readPolicyModeFromEnvV0() {
  const raw = String(
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_RHIZOH_OUTPUT_LANGUAGE_POLICY || "" : ""
  )
    .trim()
    .toLowerCase();
  if (raw === OLP_MODE_V0.MIRROR) return OLP_MODE_V0.MIRROR;
  if (raw === OLP_MODE_V0.ADAPTIVE) return OLP_MODE_V0.ADAPTIVE;
  return OLP_MODE_V0.UI_LOCKED_OUTPUT;
}

function readPersistedPreferenceFromStorageV0() {
  if (typeof localStorage === "undefined") return resolveDefaultUiLocaleV0();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    if (raw && RHIZOH_UI_LAUNCH_LOCALES_V0.includes(String(raw).toLowerCase())) {
      return String(raw).toLowerCase();
    }
  } catch {
    /* noop */
  }
  return resolveDefaultUiLocaleV0();
}

/**
 * One-time boot: load persisted UI preference into OLP (not continuous UI read in hot path).
 */
export function hydrateOlpFromPersistedPreferenceV0() {
  return applyUiLanguagePreferenceToOlpV0(readPersistedPreferenceFromStorageV0(), "hydrate");
}

/**
 * UI → OLP write-once (ingress picker, settings). OLP absorbs; does not poll UI.
 * @param {string} localeCode
 * @param {string} [source]
 */
export function applyUiLanguagePreferenceToOlpV0(localeCode, source = "ui_write") {
  olpPreferenceLocale = normalizeUiLocaleV0(localeCode);
  const row = resolveRhizohLanguageCatalogRowV0(olpPreferenceLocale);
  const policy = publishOlpSnapshotV0(row, source);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_UI_LANGUAGE_PREFERENCE_EVENT_V0, {
        detail: Object.freeze({ locale: olpPreferenceLocale, source })
      })
    );
  }
  return policy;
}

function readOlpOwnedPreferenceLocaleV0() {
  if (!olpPreferenceLocale) {
    hydrateOlpFromPersistedPreferenceV0();
  }
  return olpPreferenceLocale || resolveDefaultUiLocaleV0();
}

function readForcedSttLanguageFromEnvV0() {
  const raw = String(
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_RHIZOH_STT_LANGUAGE || "" : ""
  )
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (raw === "auto" || raw === "und") return "auto";
  return resolveRhizohLanguageCatalogRowV0(normalizeUiLocaleV0(raw)).bcp47;
}

function sttInputLanguageBcp47ForRowV0(row) {
  const forced = readForcedSttLanguageFromEnvV0();
  if (forced) return forced;
  return row.bcp47;
}

function publishOlpSnapshotV0(row, source = "read") {
  const mode = readPolicyModeFromEnvV0();
  const policy = Object.freeze({
    mode,
    language: row.code,
    bcp47: row.bcp47,
    label: row.label,
    inputLanguage: sttInputLanguageBcp47ForRowV0(row),
    preferenceSource: String(source || "read")
  });
  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_OUTPUT_LANGUAGE_POLICY__ = policy;
  }
  return policy;
}

export function readOutputLanguagePolicyV0() {
  const row = resolveRhizohLanguageCatalogRowV0(readOlpOwnedPreferenceLocaleV0());
  return publishOlpSnapshotV0(row, "read");
}

export function resolveOutputLanguageCodeV0(detectedInputCode = "") {
  const olp = readOutputLanguagePolicyV0();
  if (olp.mode === OLP_MODE_V0.MIRROR) {
    return normalizeUiLocaleV0(detectedInputCode || olp.language);
  }
  if (olp.mode === OLP_MODE_V0.ADAPTIVE) {
    return normalizeUiLocaleV0(detectedInputCode || olp.language);
  }
  return olp.language;
}

export function resolveOutputBcp47V0(detectedInputCode = "") {
  return resolveRhizohBcp47V0(resolveOutputLanguageCodeV0(detectedInputCode));
}

/**
 * STT capture language — mirrors OLP UI locale (BCP-47) unless VITE_RHIZOH_STT_LANGUAGE overrides.
 * Output locale policy is unchanged; this only steers Google STT / Whisper input decoding.
 * @returns {string} e.g. tr-TR, en-US, or "auto" when env forces auto
 */
export function readSttInputLanguageCodeHintV0() {
  const forced = readForcedSttLanguageFromEnvV0();
  if (forced) return forced;
  const speech = resolveRhizohSpeechSttLanguageCodeV0();
  if (speech) return speech;
  return resolveRhizohLanguageCatalogRowV0(readOlpOwnedPreferenceLocaleV0()).bcp47;
}

export { readOlpInteractionToneV0, recordOlpBehavioralTurnV0 } from "./rhizohOlpInteractionToneV0.js";

export function buildOutputLanguagePolicyDirectiveV0(detectedInputCode, confidence = 0) {
  const olp = readOutputLanguagePolicyV0();
  const outCode = resolveOutputLanguageCodeV0(detectedInputCode);
  const outRow = resolveRhizohLanguageCatalogRowV0(outCode);
  const detected = String(detectedInputCode || "und").toLowerCase();

  if (olp.mode !== OLP_MODE_V0.UI_LOCKED_OUTPUT) {
    return "";
  }

  return [
    "[RHIZOH_OUTPUT_LANGUAGE_POLICY_V0]",
    `mode: ${olp.mode}`,
    `output_language: ${outRow.label} (${outRow.bcp47}) — MANDATORY for every reply.`,
    `input_detected_locale: ${detected} (confidence=${Number(confidence) || 0}) — hint only, not output.`,
    "Process user meaning in any input language; reasoning may be language-neutral.",
    `Respond ONLY in ${outRow.label}. Do not reply in Turkish or other languages unless output_language is that language.`,
    "Proper names, castle labels, and thread IDs stay untranslated."
  ].join("\n");
}

/** @internal vitest */
export function __resetOlpStateForTestV0() {
  olpPreferenceLocale = null;
}
