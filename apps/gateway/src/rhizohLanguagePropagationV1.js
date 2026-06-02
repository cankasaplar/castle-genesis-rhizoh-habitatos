/**
 * Gateway — parse client language propagation; no silent EN fallback.
 */

export const RHIZOH_LANGUAGE_PROPAGATION_SCHEMA_V0 = "castle.rhizoh.language_propagation.v0";

export const RHIZOH_LANG_HEADER_UI_V0 = "x-rhizoh-ui-lang";
export const RHIZOH_LANG_HEADER_SPEECH_V0 = "x-rhizoh-speech-lang";
export const RHIZOH_LANG_HEADER_LLM_V0 = "x-rhizoh-llm-lang";
export const RHIZOH_LANG_HEADER_TRACE_V1 = "x-rhizoh-language-trace-id";

const UI_DEFAULT_V0 = "tr";

function headerVal(req, name) {
  const v = req?.headers?.[name];
  return String(Array.isArray(v) ? v[0] : v || "").trim();
}

function normalizeShort(code) {
  const c = String(code || "").trim().toLowerCase();
  if (!c || c === "auto" || c === "und") return "";
  return c.split("-")[0] || c;
}

function shortToBcp47(short) {
  const s = normalizeShort(short) || UI_DEFAULT_V0;
  if (s === "tr") return "tr-TR";
  if (s === "en") return "en-US";
  if (s === "de") return "de-DE";
  if (s === "fr") return "fr-FR";
  if (s === "fi") return "fi-FI";
  if (s === "es") return "es-ES";
  if (s === "zh") return "zh-CN";
  if (s === "ja") return "ja-JP";
  return s.includes("-") ? s : `${s}-${s.toUpperCase()}`;
}

/**
 * @param {{ uiLang?: string, speechLang?: string, llmBcp47?: string }} p
 */
export function compactRhizohLanguageSnapshotV1(p) {
  return Object.freeze({
    ui: String(p?.uiLang || UI_DEFAULT_V0),
    speech: String(p?.speechLang || "auto"),
    llm: String(p?.llmBcp47 || shortToBcp47(p?.uiLang || UI_DEFAULT_V0))
  });
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {Record<string, unknown>} body
 * @param {Record<string, unknown> | null} fromBody
 */
function collectPropagationGapsV1(req, body, fromBody) {
  const gaps = [];
  const bodySnap =
    body?.rhizoh_language_snapshot && typeof body.rhizoh_language_snapshot === "object"
      ? body.rhizoh_language_snapshot
      : null;
  if (!headerVal(req, RHIZOH_LANG_HEADER_UI_V0) && !normalizeShort(fromBody?.uiLang) && !bodySnap?.ui) {
    gaps.push("missing_ui_signal");
  }
  if (
    !headerVal(req, RHIZOH_LANG_HEADER_SPEECH_V0) &&
    !String(fromBody?.speechLang || fromBody?.speechBcp47 || bodySnap?.speech || "").trim()
  ) {
    gaps.push("missing_speech_signal");
  }
  if (
    !headerVal(req, RHIZOH_LANG_HEADER_LLM_V0) &&
    !String(fromBody?.llmBcp47 || fromBody?.llmLang || bodySnap?.llm || "").trim()
  ) {
    gaps.push("missing_llm_signal");
  }
  const traceFromClient =
    headerVal(req, RHIZOH_LANG_HEADER_TRACE_V1) ||
    String(body?.rhizoh_language_trace_id || fromBody?.traceId || "").trim();
  if (!traceFromClient) gaps.push("missing_trace_id");
  return gaps;
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {Record<string, unknown>} [body]
 */
export function parseRhizohLanguagePropagationV1(req, body = {}) {
  const fromBody =
    body?.languagePropagation && typeof body.languagePropagation === "object"
      ? body.languagePropagation
      : null;
  const bodySnap =
    body?.rhizoh_language_snapshot && typeof body.rhizoh_language_snapshot === "object"
      ? body.rhizoh_language_snapshot
      : null;
  const uiLang =
    normalizeShort(headerVal(req, RHIZOH_LANG_HEADER_UI_V0)) ||
    normalizeShort(fromBody?.uiLang) ||
    normalizeShort(bodySnap?.ui) ||
    UI_DEFAULT_V0;
  const speechRaw =
    headerVal(req, RHIZOH_LANG_HEADER_SPEECH_V0) ||
    String(fromBody?.speechLang || fromBody?.speechBcp47 || bodySnap?.speech || "").trim() ||
    "auto";
  const speechLower = speechRaw.toLowerCase();
  const llmRaw =
    headerVal(req, RHIZOH_LANG_HEADER_LLM_V0) ||
    String(fromBody?.llmBcp47 || fromBody?.llmLang || bodySnap?.llm || "").trim() ||
    "";
  const llmBcp47 = llmRaw.includes("-") ? llmRaw : shortToBcp47(llmRaw || uiLang);
  const traceId =
    headerVal(req, RHIZOH_LANG_HEADER_TRACE_V1) ||
    String(body?.rhizoh_language_trace_id || fromBody?.traceId || "").trim() ||
    "";
  const propagationGaps = collectPropagationGapsV1(req, body, fromBody);
  const partialPropagation = propagationGaps.length > 0;
  const languageSnapshot = bodySnap
    ? Object.freeze({
        ui: String(bodySnap.ui || uiLang),
        speech: String(bodySnap.speech || speechRaw),
        llm: String(bodySnap.llm || llmBcp47)
      })
    : compactRhizohLanguageSnapshotV1({ uiLang, speechLang: speechRaw, llmBcp47 });

  return Object.freeze({
    schema: RHIZOH_LANGUAGE_PROPAGATION_SCHEMA_V0,
    uiLang,
    uiBcp47: shortToBcp47(uiLang),
    speechLang: speechLower === "auto" || speechLower === "und" ? "auto" : speechRaw,
    llmBcp47,
    llmShort: normalizeShort(llmBcp47) || uiLang,
    traceId,
    languageSnapshot,
    partialPropagation,
    propagationGaps: Object.freeze([...propagationGaps]),
    usedDefaultUi: propagationGaps.includes("missing_ui_signal"),
    source: fromBody || bodySnap ? "header+body" : headerVal(req, RHIZOH_LANG_HEADER_UI_V0) ? "header" : "default"
  });
}

/**
 * Echo fields for JSON responses (success + error).
 * @param {ReturnType<typeof parseRhizohLanguagePropagationV1>} propagation
 */
export function buildRhizohLanguagePropagationEchoV1(propagation) {
  return Object.freeze({
    languagePropagation: propagation,
    rhizoh_language_trace_id: propagation.traceId || "",
    rhizoh_language_snapshot: propagation.languageSnapshot,
    partialPropagation: propagation.partialPropagation === true
  });
}

/**
 * @param {Record<string, unknown>} body
 * @param {ReturnType<typeof parseRhizohLanguagePropagationV1>} propagation
 */
export function applyLanguagePropagationToVoiceBodyV1(body, propagation) {
  const next = { ...(body || {}) };
  const speech = String(propagation.speechLang || "auto").toLowerCase();
  const fallback = speech === "auto" ? propagation.uiBcp47 : propagation.speechLang;
  next.languageCode = String(next.languageCode || body?.languageCode || fallback);
  next.rhizoh_language_trace_id = propagation.traceId || next.rhizoh_language_trace_id || "";
  next.rhizoh_language_snapshot = propagation.languageSnapshot;
  next.languagePropagation = propagation;
  return next;
}

/**
 * @param {Record<string, unknown>} payload
 * @param {ReturnType<typeof parseRhizohLanguagePropagationV1>} propagation
 */
export function applyLanguagePropagationToLlmPayloadV1(payload, propagation) {
  const next = { ...(payload || {}) };
  const ctx = next.context && typeof next.context === "object" ? { ...next.context } : {};
  ctx.languagePropagation = propagation;
  next.context = ctx;
  const opts = next.options && typeof next.options === "object" ? { ...next.options } : {};
  opts.language = String(opts.language || propagation.llmBcp47);
  next.options = opts;
  next.rhizoh_language_trace_id = propagation.traceId || next.rhizoh_language_trace_id || "";
  next.rhizoh_language_snapshot = propagation.languageSnapshot;
  return next;
}
