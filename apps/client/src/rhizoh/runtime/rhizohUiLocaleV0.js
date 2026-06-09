/**
 * UI locale SSOT — ingress picker + product chrome + LLM bridge sync.
 * @see docs/RHIZOH_MULTILINGUAL_BRIDGE_V0.md
 */

import {
  readRhizohSessionLanguagePreferenceV0,
  resolveRhizohBcp47V0,
  resolveRhizohLanguageCatalogRowV0,
  writeRhizohSessionLanguagePreferenceV0
} from "./rhizohMultilingualBridgeV0.js";
import { bootstrapCastleLanguageRuntimeV0 } from "./rhizohLanguageRuntimeV0.js";
import { applyUiLanguagePreferenceToOlpV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { hasRhizohSpeechProfileConfiguredV0, writeRhizohSpeechProfileV0, RHIZOH_SPEECH_MODE_V0 } from "./rhizohSpeechProfileV0.js";

export const RHIZOH_UI_LOCALE_CONTRACT_V0 = "rhizoh-ui-locale-v0";
export const RHIZOH_UI_LOCALE_CHANGE_EVENT_V0 = "rhizoh:ui-locale";

/** Launch cohort languages (UI + ingress). */
export const RHIZOH_UI_LAUNCH_LOCALES_V0 = Object.freeze([
  "en",
  "tr",
  "fi",
  "fr",
  "es",
  "zh",
  "ja"
]);

const STORAGE_KEY_V0 = "rhizoh.user.language.v0";
const PICKED_KEY_V0 = "rhizoh.ui.locale.picked.v1";
/** Product ingress hosts must complete picker once per contract bump. */
const INGRESS_PICK_CONTRACT_V0 = "rhizoh.ui.locale.ingress_pick.v2";

/**
 * rhizoh.com / castle-genesis hosting — language picker + legal ingress apply.
 * @returns {boolean}
 */
export function isRhizohProductIngressHostV0() {
  if (typeof window === "undefined") return false;
  const h = String(window.location.hostname || "").toLowerCase();
  return (
    h === "rhizoh.com" ||
    h.endsWith(".rhizoh.com") ||
    h === "castle-genesis.web.app" ||
    h === "castle-genesis.firebaseapp.com"
  );
}

function hasIngressLocalePickContractV0() {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(INGRESS_PICK_CONTRACT_V0) === "1";
  } catch {
    return false;
  }
}

function markIngressLocalePickContractV0() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(INGRESS_PICK_CONTRACT_V0, "1");
    }
  } catch {
    /* noop */
  }
}

/**
 * @param {string} [code]
 * @returns {string}
 */
export function normalizeUiLocaleV0(code) {
  const c = String(code || "").toLowerCase().slice(0, 8);
  if (RHIZOH_UI_LAUNCH_LOCALES_V0.includes(c)) return c;
  if (c === "zh-cn" || c === "zh-tw") return "zh";
  return resolveDefaultUiLocaleV0();
}

/**
 * Founder / deploy default — English unless env overrides.
 * @returns {string}
 */
export function resolveDefaultUiLocaleV0() {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const raw = String(import.meta.env.VITE_RHIZOH_DEFAULT_LOCALE || "").trim().toLowerCase();
    if (raw && RHIZOH_UI_LAUNCH_LOCALES_V0.includes(raw)) return raw;
  }
  return "en";
}

/**
 * @returns {string}
 */
export function readUiLocaleV0() {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V0);
      if (raw && RHIZOH_UI_LAUNCH_LOCALES_V0.includes(String(raw).toLowerCase())) {
        return String(raw).toLowerCase();
      }
    } catch {
      /* noop */
    }
  }
  const session = readRhizohSessionLanguagePreferenceV0();
  if (session && RHIZOH_UI_LAUNCH_LOCALES_V0.includes(session)) return session;
  const envDefault = resolveDefaultUiLocaleV0();
  const hasExplicitEnvDefault =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    Boolean(String(import.meta.env.VITE_RHIZOH_DEFAULT_LOCALE || "").trim());
  if (hasExplicitEnvDefault) return envDefault;
  const nav =
    typeof navigator !== "undefined"
      ? String(navigator.language || "").toLowerCase().split("-")[0]
      : "";
  if (nav && RHIZOH_UI_LAUNCH_LOCALES_V0.includes(nav)) return nav;
  return envDefault;
}

/**
 * @returns {boolean}
 */
export function hasUiLocaleBeenPickedV0() {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(PICKED_KEY_V0) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {string} code
 */
export function writeUiLocaleV0(code) {
  const locale = normalizeUiLocaleV0(code);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_V0, locale);
      localStorage.setItem(PICKED_KEY_V0, "1");
      markIngressLocalePickContractV0();
    }
  } catch {
    /* noop */
  }
  writeRhizohSessionLanguagePreferenceV0(locale);
  applyUiLanguagePreferenceToOlpV0(locale, "ui_write");
  if (typeof document !== "undefined") {
    document.documentElement.lang = resolveRhizohBcp47V0(locale).split("-")[0];
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_UI_LOCALE_CHANGE_EVENT_V0, {
        detail: Object.freeze({ locale })
      })
    );
    bootstrapCastleLanguageRuntimeV0();
  }
  return locale;
}

/** @returns {string} */
export function getUiLocaleSnapshotV0() {
  return readUiLocaleV0();
}

/** @param {() => void} onChange */
export function subscribeUiLocaleV0(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(RHIZOH_UI_LOCALE_CHANGE_EVENT_V0, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY_V0 || e.key === PICKED_KEY_V0 || e.key === null) handler();
  });
  return () => window.removeEventListener(RHIZOH_UI_LOCALE_CHANGE_EVENT_V0, handler);
}

/**
 * @param {string} [locale]
 */
export function isTrUiLocaleV0(locale) {
  return normalizeUiLocaleV0(locale ?? readUiLocaleV0()) === "tr";
}

/**
 * Launch picker labels (native script).
 * @param {string} code
 */
export function resolveLaunchLocaleLabelV0(code) {
  return resolveRhizohLanguageCatalogRowV0(code).label;
}

export function clearUiLocalePickedForTestV0() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(PICKED_KEY_V0);
    localStorage.removeItem(STORAGE_KEY_V0);
    localStorage.removeItem(INGRESS_PICK_CONTRACT_V0);
  }
}

/**
 * Re-show ingress language picker on next load (keeps legal/cohort ack).
 */
export function resetLanguagePickerForIngressV0() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(PICKED_KEY_V0);
    localStorage.removeItem(INGRESS_PICK_CONTRACT_V0);
  }
  try {
    // dynamic import avoided — speech profile lives in sibling module
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("rhizoh.speech.profile.v1");
    }
  } catch {
    /* noop */
  }
}

/**
 * Founder / direct-app entry: ?locale=tr | ?uiLocale=tr | ?lang=tr
 * @returns {string | null} applied locale code
 */
export function applyUiLocaleFromLocationSearchV0() {
  if (typeof window === "undefined") return null;
  try {
    const q = new URLSearchParams(window.location.search);
    const raw = q.get("locale") || q.get("uiLocale") || q.get("lang");
    if (!raw) return null;
    const locale = writeUiLocaleV0(raw);
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    return locale;
  } catch {
    return null;
  }
}

/**
 * DevTools bridge — set locale without ingress language screen.
 * @param {string} code e.g. "tr"
 * @param {{ mirrorSpeech?: boolean }} [opts]
 */
export function installRhizohLocaleDebugBridgeV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  if (typeof window.__rhizoh.setUiLocale === "function") return;
  window.__rhizoh.setUiLocale = (code) => {
    const locale = writeUiLocaleV0(code);
    writeRhizohSpeechProfileV0({ mode: RHIZOH_SPEECH_MODE_V0.MIRROR_UI });
    bootstrapCastleLanguageRuntimeV0();
    return locale;
  };
  window.__rhizoh.resetLanguagePicker = () => {
    resetLanguagePickerForIngressV0();
    return true;
  };
}

/**
 * Ingress language screen — explicit pick on product hosts (contract v2).
 * @returns {boolean}
 */
export function isLanguagePickerRequiredForIngressV0() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_SKIP_LANGUAGE_PICKER === "1") {
    return false;
  }
  if (!hasUiLocaleBeenPickedV0()) return true;
  if (!hasIngressLocalePickContractV0()) return true;
  if (!hasRhizohSpeechProfileConfiguredV0()) return true;
  return false;
}
