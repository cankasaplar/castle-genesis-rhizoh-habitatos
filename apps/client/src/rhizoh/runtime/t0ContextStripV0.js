/**
 * T0 Context Strip + intent anchoring — play-call clarity (attention architecture).
 * @see docs/RHIZOH_T0_CONTINUITY_SURFACE_V0.md § Attention architecture
 */

import { isRhizohCreativeSurfaceEnabledV0 } from "./castleCreativeSurfaceGateV0.js";
import { resolveExpressiveRealityModeV0 } from "./expressiveRealityModeV0.js";
import { readUserAnchorV0, resolveDisplayAnchorV0 } from "./memoryAnchorSystemV0.js";
import {
  readRhizohSessionLanguagePreferenceV0,
  resolveRhizohLanguageCatalogRowV0
} from "./rhizohMultilingualBridgeV0.js";

export const T0_CONTEXT_STRIP_CONTRACT_V0 = "t0-context-strip-v0";
const SESSION_INTENT_KEY_V0 = "rhizoh.t0.user_intent.v0";

export const T0_INTENT_EXPLORE_V0 = "explore";
export const T0_INTENT_PRODUCE_V0 = "produce";
export const T0_INTENT_OBSERVE_V0 = "observe";
export const T0_INTENT_CONNECT_V0 = "connect";

/** @type {readonly { id: string, label_tr: string, label_en: string }[]} */
export const T0_INTENT_ANCHORS_V0 = Object.freeze([
  Object.freeze({ id: T0_INTENT_EXPLORE_V0, label_tr: "Keşfet", label_en: "Explore" }),
  Object.freeze({ id: T0_INTENT_PRODUCE_V0, label_tr: "Üret", label_en: "Produce" }),
  Object.freeze({ id: T0_INTENT_OBSERVE_V0, label_tr: "İzle", label_en: "Observe" }),
  Object.freeze({ id: T0_INTENT_CONNECT_V0, label_tr: "Bağlan", label_en: "Connect" })
]);

/**
 * @returns {string | null}
 */
export function readT0UserIntentV0() {
  try {
    const v = String(sessionStorage.getItem(SESSION_INTENT_KEY_V0) || "").trim();
    return T0_INTENT_ANCHORS_V0.some((a) => a.id === v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} intentId
 */
export function writeT0UserIntentV0(intentId) {
  const id = String(intentId || "").trim();
  if (!T0_INTENT_ANCHORS_V0.some((a) => a.id === id)) return;
  try {
    sessionStorage.setItem(SESSION_INTENT_KEY_V0, id);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rhizoh:t0-intent", { detail: Object.freeze({ intent: id }) })
    );
  }
}

/**
 * @param {string} activeSurface
 * @param {string} [intent]
 */
export function inferT0UserIntentFromSurfaceV0(activeSurface, intent) {
  const stored = intent || readT0UserIntentV0();
  if (stored) return stored;
  const s = String(activeSurface || "world");
  if (s === "studio") return T0_INTENT_PRODUCE_V0;
  if (s === "broadcast" || s === "greenroom") return T0_INTENT_CONNECT_V0;
  if (s === "hall" || s === "profile") return T0_INTENT_OBSERVE_V0;
  return T0_INTENT_EXPLORE_V0;
}

/**
 * Suggested product surface when user picks intent (soft navigation hint).
 * @param {string} intentId
 */
export function resolveT0SurfaceForIntentV0(intentId) {
  const id = String(intentId || "");
  if (id === T0_INTENT_PRODUCE_V0) return "studio";
  if (id === T0_INTENT_CONNECT_V0) return "broadcast";
  if (id === T0_INTENT_OBSERVE_V0) return "hall";
  return "world";
}

/**
 * @param {{
 *   activeSurface?: string,
 *   userIntent?: string | null,
 *   creativeEnabled?: boolean,
 *   expressiveMode?: string
 * }} [input]
 */
export function resolveT0ContextStripV0(input = {}) {
  const activeSurface = String(input.activeSurface || "world");
  const creative =
    input.creativeEnabled !== undefined
      ? Boolean(input.creativeEnabled)
      : isRhizohCreativeSurfaceEnabledV0();
  const expressiveMode = String(input.expressiveMode || resolveExpressiveRealityModeV0());
  const intent = inferT0UserIntentFromSurfaceV0(activeSurface, input.userIntent || undefined);

  const display = resolveDisplayAnchorV0();
  const userAnchor = readUserAnchorV0();
  const anchorLabel = String(display?.primary_label || display?.label || "").trim();
  const hasUserAnchor = Boolean(userAnchor?.label);

  const langCode = readRhizohSessionLanguagePreferenceV0() || "tr";
  const langRow = resolveRhizohLanguageCatalogRowV0(langCode);
  const tr = langCode === "tr" || langCode === "und";

  /** @type {string} */
  let modeLabel;
  /** @type {string} */
  let stateLabel;

  if (intent === T0_INTENT_PRODUCE_V0 && creative) {
    modeLabel = tr ? "Üretim modu" : "Creative Mode";
    stateLabel =
      activeSurface === "studio"
        ? tr
          ? "Stüdyo hazır"
          : "Studio ready"
        : tr
          ? "Üretime geç"
          : "Ready to produce";
  } else if (intent === T0_INTENT_CONNECT_V0) {
    modeLabel = tr ? "Bağlantı modu" : "Binding Mode";
    stateLabel =
      activeSurface === "broadcast"
        ? tr
          ? "Dünya sinyalleri açık"
          : "World signals open"
        : tr
          ? "Etkinlik / dünya"
          : "Events · world";
  } else if (intent === T0_INTENT_OBSERVE_V0) {
    modeLabel = tr ? "Süreklilik modu" : "Continuity Mode";
    stateLabel = tr ? "Gözlemliyorsun" : "Observing";
  } else if (hasUserAnchor && anchorLabel) {
    modeLabel = tr ? "Hafıza modu" : "Memory Mode";
    stateLabel = tr ? `Çapa: ${anchorLabel.slice(0, 36)}` : `Anchor: ${anchorLabel.slice(0, 36)}`;
  } else if (activeSurface === "world" || intent === T0_INTENT_EXPLORE_V0) {
    modeLabel = tr ? "Keşif" : "Exploration";
    stateLabel = tr ? "Dünya açık" : "World open";
  } else {
    modeLabel = tr ? "Süreklilik modu" : "Continuity Mode";
    stateLabel = tr ? "Hazırsın" : "Ready";
  }

  if (expressiveMode === "E2-X" && creative && intent !== T0_INTENT_OBSERVE_V0) {
    stateLabel = `${stateLabel} · E2-X`;
  }

  const strip = `${modeLabel} · ${stateLabel}`;

  return Object.freeze({
    contract_version: T0_CONTEXT_STRIP_CONTRACT_V0,
    strip,
    mode_label: modeLabel,
    state_label: stateLabel,
    intent,
    active_surface: activeSurface,
    language_code: langRow.code,
    language_label: langRow.label,
    has_user_anchor: hasUserAnchor,
    play_call: tr ? "Şu an hangi oyundasın?" : "Which play are you in?"
  });
}
