/**
 * FEL / MVIC v1.0 — Failure Expression Layer (event-based narration on gate reject).
 * Not presence core — see rhizohPresenceStateEngineV0.js (RPSE).
 * @see docs/RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md
 * @see docs/RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md
 */

import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { normalizeUiLocaleV0 } from "./rhizohUiLocaleV0.js";

export const RHIZOH_MINIMUM_PRESENCE_EXPRESSION_SCHEMA_V0 =
  "castle.rhizoh.minimum_presence_expression.v0";

export const MVIC_PRESENCE_MODE_V0 = Object.freeze({
  ACKNOWLEDGE: "acknowledge",
  UNCERTAINTY: "uncertainty",
  RECONNECT: "reconnect",
  LISTENING: "listening",
  MIC_HINT: "mic_hint"
});

export const MVIC_TTS_POLICY_V0 = Object.freeze({
  NEVER: "never",
  OPTIONAL: "optional",
  CHAT_ONLY: "chat_only"
});

/** @typedef {"acknowledge"|"uncertainty"|"reconnect"|"listening"|"mic_hint"} MvicPresenceModeV0 */
/** @typedef {"never"|"optional"|"chat_only"} MvicTtsPolicyV0 */

/**
 * @typedef {object} MvicCatalogEntryV0
 * @property {string} mvicId
 * @property {string} reason
 * @property {Record<string, { primary: string, variants?: string[] }>} phrases
 * @property {MvicPresenceModeV0} presenceMode
 * @property {MvicTtsPolicyV0} tts
 * @property {number} baseIntensity
 */

/** @type {Record<string, MvicCatalogEntryV0>} */
const MVIC_BY_REASON_V0 = Object.freeze({
  whisper_default_conf: Object.freeze({
    mvicId: "mvic.whisper_default_conf",
    reason: "whisper_default_conf",
    phrases: Object.freeze({
      tr: Object.freeze({
        primary:
          "Seni duydum; tam net değil — bir kez daha söyler misin?"
      }),
      en: Object.freeze({
        primary: "I heard you; not fully clear — once more?"
      })
    }),
    presenceMode: MVIC_PRESENCE_MODE_V0.UNCERTAINTY,
    tts: MVIC_TTS_POLICY_V0.OPTIONAL,
    baseIntensity: 0.78
  }),
  unknown_band_hold: Object.freeze({
    mvicId: "mvic.unknown_band_hold",
    reason: "unknown_band_hold",
    phrases: Object.freeze({
      tr: Object.freeze({
        primary: "Buradayım — seni duyuyorum, devam edebilirsin."
      }),
      en: Object.freeze({
        primary: "I'm here — I hear you, go on."
      })
    }),
    presenceMode: MVIC_PRESENCE_MODE_V0.ACKNOWLEDGE,
    tts: MVIC_TTS_POLICY_V0.OPTIONAL,
    baseIntensity: 0.88
  }),
  strict_hold_suppressed: Object.freeze({
    mvicId: "mvic.strict_hold_suppressed",
    reason: "strict_hold_suppressed",
    phrases: Object.freeze({
      tr: Object.freeze({
        primary:
          "Şu an net değil ama buradayım — biraz sonra tekrar deneyebilirsin."
      }),
      en: Object.freeze({
        primary: "Not sure yet but I'm here — try again in a moment."
      })
    }),
    presenceMode: MVIC_PRESENCE_MODE_V0.LISTENING,
    tts: MVIC_TTS_POLICY_V0.NEVER,
    baseIntensity: 0.62
  }),
  STT_DISPATCH_BLOCKED: Object.freeze({
    mvicId: "mvic.stt_dispatch_blocked",
    reason: "STT_DISPATCH_BLOCKED",
    phrases: Object.freeze({
      tr: Object.freeze({
        primary:
          "Seni duydum; şu an yanıtı hazırlayamıyorum — metinle de yazabilirsin."
      }),
      en: Object.freeze({
        primary:
          "I heard you; can't respond by voice right now — you can type too."
      })
    }),
    presenceMode: MVIC_PRESENCE_MODE_V0.RECONNECT,
    tts: MVIC_TTS_POLICY_V0.CHAT_ONLY,
    baseIntensity: 0.8
  }),
  authority_silent: Object.freeze({
    mvicId: "mvic.authority_silent",
    reason: "authority_silent",
    phrases: Object.freeze({
      tr: Object.freeze({
        primary: "Ses yanıtı kapalı; sohbet satırından devam ediyorum."
      }),
      en: Object.freeze({
        primary: "Voice reply paused; continuing in chat."
      })
    }),
    presenceMode: MVIC_PRESENCE_MODE_V0.LISTENING,
    tts: MVIC_TTS_POLICY_V0.NEVER,
    baseIntensity: 0.58
  }),
  silent_drop: Object.freeze({
    mvicId: "mvic.speak_silent",
    reason: "silent_drop",
    phrases: Object.freeze({
      tr: Object.freeze({
        primary: "Dinliyorum; istersen yazarak da devam edebilirsin."
      }),
      en: Object.freeze({
        primary: "Listening; you can also continue in text."
      })
    }),
    presenceMode: MVIC_PRESENCE_MODE_V0.LISTENING,
    tts: MVIC_TTS_POLICY_V0.NEVER,
    baseIntensity: 0.6
  }),
  quality_reject: Object.freeze({
    mvicId: "mvic.quality_reject",
    reason: "quality_reject",
    phrases: Object.freeze({
      tr: Object.freeze({
        primary: "Şu an net değil ama buradayım — tekrar eder misin?"
      }),
      en: Object.freeze({
        primary: "Not clear yet but I'm here — repeat?"
      })
    }),
    presenceMode: MVIC_PRESENCE_MODE_V0.UNCERTAINTY,
    tts: MVIC_TTS_POLICY_V0.OPTIONAL,
    baseIntensity: 0.72
  })
});

const AUTHORITY_REASON_ALIASES_V0 = Object.freeze({
  strict_hold_suppressed: "strict_hold_suppressed",
  strict_guard_block: "strict_hold_suppressed",
  silent_drop: "silent_drop",
  noise_suppression: "strict_hold_suppressed",
  authority_silent: "authority_silent",
  VOICE_AUTHORITY_SILENT: "authority_silent"
});

/**
 * RESL extension hook — scales presence weight (not phrase randomness in v1).
 * @param {{ baseIntensity?: number, presenceMode?: string, returningUser?: boolean, relationshipTier?: number }} [ctx]
 */
export function resolveMvicPresenceIntensityV0(ctx = {}) {
  let intensity = Number(ctx.baseIntensity);
  if (!Number.isFinite(intensity)) intensity = 0.75;
  if (ctx.returningUser === true) intensity = Math.min(1, intensity + 0.08);
  const tier = Number(ctx.relationshipTier);
  if (Number.isFinite(tier) && tier > 0) {
    intensity = Math.min(1, intensity + Math.min(0.12, tier * 0.04));
  }
  if (ctx.presenceMode === MVIC_PRESENCE_MODE_V0.LISTENING) {
    intensity = Math.max(0.45, intensity - 0.06);
  }
  return Number(intensity.toFixed(3));
}

function resolveLocaleKeyV0(locale) {
  const raw = String(locale || resolveOutputLanguageCodeV0() || "")
    .trim()
    .toLowerCase();
  if (raw.startsWith("tr")) return "tr";
  const code = normalizeUiLocaleV0(raw);
  return code === "tr" ? "tr" : "en";
}

function stableVariantIndexV0(sessionId, mvicId, variantCount) {
  if (variantCount <= 1) return 0;
  const seed = `${sessionId || ""}:${mvicId}`;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % variantCount;
}

function normalizeMvicLookupReasonV0(reason, eventTag) {
  const r = String(reason || "").trim();
  const tag = String(eventTag || "").trim();
  if (r && MVIC_BY_REASON_V0[r]) return r;
  if (r && AUTHORITY_REASON_ALIASES_V0[r]) return AUTHORITY_REASON_ALIASES_V0[r];
  if (tag === "STT_DISPATCH_BLOCKED") return "STT_DISPATCH_BLOCKED";
  if (r === "strict_hold_suppressed") return "strict_hold_suppressed";
  if (r === "unknown_band_hold") return "unknown_band_hold";
  if (r === "whisper_default_conf") return "whisper_default_conf";
  return r || tag || "quality_reject";
}

/**
 * Deterministic MVIC resolution — primary phrase only in v1 (variants via stable hash).
 * @param {{
 *   reason?: string,
 *   eventTag?: string,
 *   locale?: string,
 *   sessionId?: string,
 *   displayName?: string,
 *   returningUser?: boolean,
 *   relationshipTier?: number
 * }} [opts]
 */
export function resolveMvicV0(opts = {}) {
  const lookup = normalizeMvicLookupReasonV0(opts.reason, opts.eventTag);
  const entry =
    MVIC_BY_REASON_V0[lookup] ||
    MVIC_BY_REASON_V0.quality_reject;
  const localeKey = resolveLocaleKeyV0(opts.locale);
  const phraseRow = entry.phrases[localeKey] || entry.phrases.en;
  let text = phraseRow.primary;
  const variants = phraseRow.variants;
  if (Array.isArray(variants) && variants.length > 0) {
    const idx = stableVariantIndexV0(opts.sessionId, entry.mvicId, variants.length + 1);
    if (idx > 0 && variants[idx - 1]) {
      text = variants[idx - 1];
    }
  }
  const name = String(opts.displayName || "").trim();
  if (entry.mvicId === "mvic.name_recall" && name) {
    text = localeKey === "tr" ? `${name}, buradayım.` : `${name}, I'm here.`;
  }
  const intensity = resolveMvicPresenceIntensityV0({
    baseIntensity: entry.baseIntensity,
    presenceMode: entry.presenceMode,
    returningUser: opts.returningUser,
    relationshipTier: opts.relationshipTier
  });
  return Object.freeze({
    schema: RHIZOH_MINIMUM_PRESENCE_EXPRESSION_SCHEMA_V0,
    mvicId: entry.mvicId,
    reason: entry.reason,
    lookupReason: lookup,
    eventTag: opts.eventTag ? String(opts.eventTag) : undefined,
    text,
    locale: localeKey,
    presenceMode: entry.presenceMode,
    ttsPolicy: entry.tts,
    intensity,
    chatRequired: true
  });
}

/**
 * HUD/chat payload for T0 chrome.
 * @param {Parameters<typeof resolveMvicV0>[0]} opts
 */
export function buildMvicHudReplyV0(opts = {}) {
  const mvic = resolveMvicV0(opts);
  return Object.freeze({
    text: mvic.text,
    source: "mvic",
    at: Date.now(),
    mvicId: mvic.mvicId,
    presenceMode: mvic.presenceMode,
    intensity: mvic.intensity,
    meta: Object.freeze({
      reason: mvic.reason,
      lookupReason: mvic.lookupReason,
      eventTag: mvic.eventTag,
      ttsPolicy: mvic.ttsPolicy
    })
  });
}

/**
 * @param {string} reason
 */
export function listMvicCatalogReasonsV0() {
  return Object.freeze(Object.keys(MVIC_BY_REASON_V0));
}
