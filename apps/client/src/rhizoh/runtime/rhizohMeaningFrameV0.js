/**
 * Universal Semantic Core — MF-0 (language-independent meaning skeleton).
 * CPU-light, deterministic. Never calls CLAG.
 */

import { RHIZOH_CONVERSATION_INTENT_V0 } from "./rhizohConversationDepthV0.js";

export const MF0_SCHEMA_V0 = "castle.rhizoh.meaning_frame.v0";

export const MF0_INTENT_V0 = Object.freeze({
  ASK: "ask",
  REFLECT: "reflect",
  CHALLENGE: "challenge",
  NARRATE: "narrate"
});

export const MF0_DETECTED_LANGUAGE_V0 = Object.freeze({
  TR: "tr",
  EN: "en",
  ES: "es",
  JP: "jp",
  MIXED: "mixed",
  UNKNOWN: "unknown"
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function clampDepth(n) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return 2;
  return Math.max(1, Math.min(5, x));
}

/**
 * @param {string} text
 */
export function detectInputLanguageV0(text) {
  const t = String(text || "");
  if (!t.trim()) return MF0_DETECTED_LANGUAGE_V0.UNKNOWN;
  if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(t)) return MF0_DETECTED_LANGUAGE_V0.JP;
  if (/[ğüşıöçĞÜŞİÖÇ]/.test(t) || /\b(merhaba|nasılsın|neden|çünkü|bir|değil)\b/ui.test(t)) {
    return MF0_DETECTED_LANGUAGE_V0.TR;
  }
  if (/[¿¡]/.test(t) || /\b(hola|gracias|porque|está|qué)\b/ui.test(t)) {
    return MF0_DETECTED_LANGUAGE_V0.ES;
  }
  if (/[a-z]/i.test(t)) return MF0_DETECTED_LANGUAGE_V0.EN;
  return MF0_DETECTED_LANGUAGE_V0.MIXED;
}

/**
 * @param {string} message
 */
function inferLegacyIntentV0(message) {
  const t = String(message || "").trim().toLowerCase();
  if (!t) return RHIZOH_CONVERSATION_INTENT_V0.REFLECT;
  if (/\b(özet|sonuç|kapan|bitir|toparla|conclude)\b/u.test(t)) {
    return RHIZOH_CONVERSATION_INTENT_V0.CONCLUDE;
  }
  if (/\b(ama|fakat|yanlış|katılm|challenge|neden öyle)\b/u.test(t) || (t.includes("?") && t.length > 80)) {
    return RHIZOH_CONVERSATION_INTENT_V0.CHALLENGE;
  }
  if (/\?/.test(t)) return RHIZOH_CONVERSATION_INTENT_V0.ASK;
  if (t.length > 220) return RHIZOH_CONVERSATION_INTENT_V0.EXTEND;
  if (/^(selam|merhaba|hey|günaydın|iyi akşam|naber|ne var)\b/u.test(t)) {
    return RHIZOH_CONVERSATION_INTENT_V0.REFLECT;
  }
  return RHIZOH_CONVERSATION_INTENT_V0.EXTEND;
}

/**
 * @param {string} legacyIntent
 */
function mapLegacyIntentToMf0V0(legacyIntent) {
  const i = String(legacyIntent || "").toLowerCase();
  if (i === RHIZOH_CONVERSATION_INTENT_V0.CHALLENGE) return MF0_INTENT_V0.CHALLENGE;
  if (i === RHIZOH_CONVERSATION_INTENT_V0.ASK) return MF0_INTENT_V0.ASK;
  if (i === RHIZOH_CONVERSATION_INTENT_V0.CONCLUDE) return MF0_INTENT_V0.REFLECT;
  if (i === RHIZOH_CONVERSATION_INTENT_V0.EXTEND) return MF0_INTENT_V0.NARRATE;
  return MF0_INTENT_V0.REFLECT;
}

/**
 * @param {string} text
 * @param {string} intent
 */
function emotionVectorFromTextV0(text, intent) {
  const t = String(text || "").toLowerCase();
  let calm = 0.55;
  let tension = 0.2;
  let curiosity = 0.35;

  if (/\?/.test(t)) curiosity = Math.min(1, curiosity + 0.25);
  if (/\b(ama|fakat|yanlış|no|but|why|por qué)\b/u.test(t)) tension = Math.min(1, tension + 0.3);
  if (/\b(üzgün|korku|stressed|worried|triste)\b/u.test(t)) {
    tension += 0.2;
    calm -= 0.15;
  }
  if (/\b(heyecan|harika|great|genial|すごい)\b/u.test(t)) {
    curiosity += 0.15;
    calm -= 0.05;
  }
  if (intent === MF0_INTENT_V0.CHALLENGE) tension = Math.min(1, tension + 0.2);
  if (intent === MF0_INTENT_V0.NARRATE) calm = Math.min(1, calm + 0.15);
  if (/^(selam|merhaba|hi|hello|hola|こん)/u.test(t)) calm = Math.min(1, calm + 0.2);

  return Object.freeze({
    calm: clamp01(calm),
    tension: clamp01(tension),
    curiosity: clamp01(curiosity)
  });
}

/**
 * @param {string} text
 */
function extractEntitiesV0(text) {
  const entities = [];
  const proper = text.match(/\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}\b/g) || [];
  for (const p of proper.slice(0, 6)) {
    if (!entities.includes(p)) entities.push(p);
  }
  if (/\brhizoh\b/i.test(text) && !entities.some((e) => /rhizoh/i.test(e))) {
    entities.unshift("Rhizoh");
  }
  return Object.freeze(entities);
}

/**
 * @param {string} text
 * @param {boolean} continuityHook
 * @param {string[] | null} [priorThreads]
 */
function unresolvedThreadsV0(text, continuityHook, priorThreads = null) {
  const threads = [];
  if (Array.isArray(priorThreads)) threads.push(...priorThreads.slice(0, 3));
  if (continuityHook && /\b(dün|yesterday|ayer|昨日|hatırla|remember)\b/ui.test(text)) {
    threads.push("prior_turn_reference");
  }
  if (/\b(devam|continue|sigue|続け)\b/ui.test(text)) {
    threads.push("continuation_requested");
  }
  return Object.freeze([...new Set(threads)].slice(0, 5));
}

/**
 * Hot-path MF — minimal parse (intent, depth, language, emotion only).
 * @param {{ text?: string, traceId?: string | null, cohortLanguage?: string | null }} input
 */
export function extractMeaningFrameMinimalV0(input = {}) {
  const text = String(input.text || "").trim();
  const legacyIntent = inferLegacyIntentV0(text);
  const intent = mapLegacyIntentToMf0V0(legacyIntent);
  const detectedLanguage = detectInputLanguageV0(text);
  const cohortLang = String(input.cohortLanguage || "").toLowerCase();
  const language =
    cohortLang && ["tr", "en", "es", "jp"].includes(cohortLang) ? cohortLang : detectedLanguage;
  const depth = clampDepth(
    intent === MF0_INTENT_V0.CHALLENGE ? 4 : intent === MF0_INTENT_V0.NARRATE ? 3 : text.length > 120 ? 3 : 2
  );
  const continuityHook = /\b(dün|hatırla|devam|again|ayer|続)\b/ui.test(text);
  const emotionVector = emotionVectorFromTextV0(text, intent);

  return Object.freeze({
    schema: MF0_SCHEMA_V0,
    minimal: true,
    traceId: input.traceId ?? null,
    intent,
    depth,
    emotionVector,
    continuityHook,
    entities: Object.freeze([]),
    unresolvedThreads: Object.freeze([]),
    threadState: Object.freeze({ openCount: 0, narrativeForward: false }),
    detectedLanguage,
    language,
    tokenEstimate: text ? text.split(/\s+/).filter(Boolean).length : 0
  });
}

/**
 * @param {{
 *   text?: string,
 *   traceId?: string | null,
 *   depthLevel?: number,
 *   continuityStrength?: number,
 *   conversationMode?: string,
 *   priorThreads?: string[],
 *   cohortLanguage?: string | null
 * }} input
 */
export function extractMeaningFrameV0(input = {}) {
  const text = String(input.text || "").trim();
  const legacyIntent = inferLegacyIntentV0(text);
  const intent = mapLegacyIntentToMf0V0(legacyIntent);
  const detectedLanguage = detectInputLanguageV0(text);
  const cohortLang = String(input.cohortLanguage || "").toLowerCase();
  const language =
    cohortLang && ["tr", "en", "es", "jp"].includes(cohortLang) ? cohortLang : detectedLanguage;

  const depth = clampDepth(
    input.depthLevel ??
      (intent === MF0_INTENT_V0.CHALLENGE ? 4 : intent === MF0_INTENT_V0.NARRATE ? 3 : text.length > 180 ? 3 : 2)
  );

  const continuityHook =
    input.continuityStrength != null
      ? clamp01(input.continuityStrength) >= 0.45
      : /\b(dün|hatırla|devam|again|ayer|続)\b/ui.test(text) || depth >= 3;

  const emotionVector = emotionVectorFromTextV0(text, intent);
  const entities = extractEntitiesV0(text);
  const unresolvedThreads = unresolvedThreadsV0(text, continuityHook, input.priorThreads);

  return Object.freeze({
    schema: MF0_SCHEMA_V0,
    traceId: input.traceId ?? null,
    intent,
    depth,
    emotionVector,
    continuityHook,
    entities,
    unresolvedThreads,
    threadState: Object.freeze({
      openCount: unresolvedThreads.length,
      narrativeForward: intent === MF0_INTENT_V0.NARRATE
    }),
    detectedLanguage,
    language,
    tokenEstimate: text ? text.split(/\s+/).filter(Boolean).length : 0
  });
}

/**
 * Collapsed MF for product surface (no raw text).
 * @param {ReturnType<typeof extractMeaningFrameV0>} mf
 */
export function collapseMeaningFrameV0(mf) {
  return Object.freeze({
    intent: mf.intent,
    depth: mf.depth,
    continuityHook: mf.continuityHook,
    language: mf.language,
    emotion: mf.emotionVector
  });
}
