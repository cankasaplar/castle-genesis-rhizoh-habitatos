/**
 * Rhizoh speech / STT control plane — separate from UI locale (menus, legal copy).
 */

import { resolveRhizohBcp47V0, resolveRhizohLanguageCatalogRowV0 } from "./rhizohMultilingualBridgeV0.js";
import { normalizeUiLocaleV0, readUiLocaleV0 } from "./rhizohUiLocaleV0.js";

export const RHIZOH_SPEECH_PROFILE_SCHEMA_V0 = "castle.rhizoh.speech_profile.v0";

export const RHIZOH_SPEECH_MODE_V0 = Object.freeze({
  AUTO: "auto",
  MIRROR_UI: "mirror_ui",
  MANUAL: "manual"
});

/** Manual wheel subset (STT + command bias). */
export const RHIZOH_SPEECH_WHEEL_LOCALES_V0 = Object.freeze(["tr", "en", "de", "fr"]);

const STORAGE_KEY_V0 = "rhizoh.speech.profile.v1";

/**
 * @returns {{ schema: string, mode: string, manualLocale: string | null, configuredAtMs: number } | null}
 */
export function readRhizohSpeechProfileV0() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p?.schema !== RHIZOH_SPEECH_PROFILE_SCHEMA_V0) return null;
    const mode = String(p.mode || "");
    if (!Object.values(RHIZOH_SPEECH_MODE_V0).includes(mode)) return null;
    return Object.freeze({
      schema: RHIZOH_SPEECH_PROFILE_SCHEMA_V0,
      mode,
      manualLocale:
        mode === RHIZOH_SPEECH_MODE_V0.MANUAL
          ? normalizeSpeechWheelLocaleV0(p.manualLocale)
          : null,
      configuredAtMs: Number(p.configuredAtMs) || 0
    });
  } catch {
    return null;
  }
}

export function hasRhizohSpeechProfileConfiguredV0() {
  return Boolean(readRhizohSpeechProfileV0());
}

/**
 * @param {string} code
 */
export function normalizeSpeechWheelLocaleV0(code) {
  const c = String(code || "").toLowerCase();
  if (RHIZOH_SPEECH_WHEEL_LOCALES_V0.includes(c)) return c;
  return "tr";
}

/**
 * @param {{ mode: string, manualLocale?: string }} opts
 */
export function writeRhizohSpeechProfileV0(opts = {}) {
  const mode = Object.values(RHIZOH_SPEECH_MODE_V0).includes(opts.mode)
    ? opts.mode
    : RHIZOH_SPEECH_MODE_V0.AUTO;
  const payload = Object.freeze({
    schema: RHIZOH_SPEECH_PROFILE_SCHEMA_V0,
    mode,
    manualLocale:
      mode === RHIZOH_SPEECH_MODE_V0.MANUAL
        ? normalizeSpeechWheelLocaleV0(opts.manualLocale)
        : null,
    configuredAtMs: Date.now()
  });
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(payload));
    }
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_SPEECH_PROFILE__ = payload;
  }
  return payload;
}

/**
 * BCP-47 for gateway STT (Whisper auto when mode=auto).
 * @returns {string}
 */
export function resolveRhizohSpeechSttLanguageCodeV0() {
  const profile = readRhizohSpeechProfileV0();
  const uiLocale = readUiLocaleV0();
  if (!profile || profile.mode === RHIZOH_SPEECH_MODE_V0.AUTO) {
    return "auto";
  }
  if (profile.mode === RHIZOH_SPEECH_MODE_V0.MIRROR_UI) {
    return resolveRhizohLanguageCatalogRowV0(uiLocale).bcp47;
  }
  return resolveRhizohLanguageCatalogRowV0(profile.manualLocale || uiLocale).bcp47;
}

export function clearRhizohSpeechProfileForTestV0() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_V0);
  }
}
