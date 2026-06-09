/**
 * Living conversation surface v1 — STT heard visibility, bridge copy, session strip.
 * Presentation only; does not alter frozen execution graph.
 */

export const RHIZOH_LIVING_CONVERSATION_SCHEMA_V1 = "castle.rhizoh_living_conversation_surface.v1";
export const RHIZOH_STT_HEARD_EVENT_V1 = "rhizoh:stt-heard-v1";
export const RHIZOH_CONVERSATION_CONTINUITY_EVENT_V1 = "rhizoh:conversation-continuity-v1";

const LS_HEARD_RING_V1 = "rhizoh.living.stt_heard_ring.v1";
const RING_MAX_V1 = 32;

/** @type {object[]} */
let memoryHeardRing = [];

/** Shallow intents — instant local reply OK even in living surface (deep chat still uses LLM). */
export const LIVING_SURFACE_FAST_PRECHECK_INTENTS_V1 = Object.freeze([
  "greeting",
  "ack",
  "hearing_check",
  "wellbeing",
  "thanks",
  "yes",
  "no",
  "help",
  "date_today",
  "time_query",
  "system_status",
  "weather_stub",
  "weather_live",
  "traffic_query",
  "sports_live",
  "sports_fixture",
  "news_headlines",
  "map_context",
  "presence_query",
  "social_ack",
  "chat_invite"
]);

/**
 * @param {string} [intent]
 */
export function isLivingSurfaceFastPrecheckEligibleV1(intent) {
  return LIVING_SURFACE_FAST_PRECHECK_INTENTS_V1.includes(String(intent || ""));
}

/**
 * Living conversation mode — surfaces continuity; local reflex does not replace LLM.
 */
export function isRhizohLivingConversationSurfaceV1() {
  try {
    const v = String(import.meta.env?.VITE_RHIZOH_LIVING_CONVERSATION_V1 ?? "1").trim();
    return v !== "0";
  } catch {
    return true;
  }
}

/**
 * @param {boolean} tr
 * @param {string} text
 * @param {{ reason?: string, executionAccepted?: boolean, showTranscript?: boolean }} [meta]
 */
export function resolveSttHeardHudCopyV1(tr, text, meta = {}) {
  const preview = String(text || "").trim().slice(0, 120);
  const showText = meta.showTranscript !== false && preview.length > 0;
  if (meta.executionAccepted === true) {
    return tr
      ? showText
        ? `Duyuyorum: «${preview}»`
        : "Duyuyorum — devam ediyorum."
      : showText
        ? `I hear you: “${preview}”`
        : "I hear you — continuing.";
  }
  if (tr) {
    if (showText) {
      return `Duyuyorum: «${preview}» — net değilse yazarak da gönderebilirsin.`;
    }
    return "Duyuyorum — net duyamadım; yazarak da devam edebilirsin.";
  }
  if (showText) {
    return `I hear you: “${preview}” — type to send if voice was unclear.`;
  }
  return "I hear you — if unclear, you can keep going by typing.";
}

/**
 * Pre-LLM bridge (not a final answer).
 * @param {boolean} tr
 * @param {string} [hint]
 */
export function resolveFastReflexBridgeCopyV1(tr, hint = "") {
  const h = String(hint || "").toLowerCase();
  if (tr) {
    if (h.includes("greet") || h.includes("merhaba") || h.includes("hello")) {
      return "Anladım — devam ediyorum.";
    }
    if (h.includes("ask") || h.includes("question")) {
      return "Bunu biraz açalım mı?";
    }
    return "Duyuyorum — cevabı hazırlıyorum.";
  }
  if (h.includes("greet") || h.includes("hello")) {
    return "Got it — continuing.";
  }
  if (h.includes("ask") || h.includes("question")) {
    return "Want to open this up a bit?";
  }
  return "I hear you — preparing a reply.";
}

/**
 * @param {boolean} tr
 * @param {{ sessionId?: string, turnCount?: number, continuingThought?: boolean, experienceSessionId?: string | null }} snap
 */
export function resolveConversationContinuityStripCopyV1(tr, snap = {}) {
  const turns = Math.max(0, Math.floor(Number(snap.turnCount) || 0));
  const continuing = snap.continuingThought === true || turns > 0;
  if (tr) {
    if (continuing) {
      return `Önceki düşünce devam ediyor · aynı oturum aktif · bağlam korunuyor${turns ? ` · ${turns} tur` : ""}`;
    }
    return "Yeni oturum · konuşma burada başlıyor";
  }
  if (continuing) {
    return `Continuing previous thought · same session active · context retained${turns ? ` · ${turns} turns` : ""}`;
  }
  return "New session · conversation starts here";
}

/**
 * @param {{
 *   productSessionId?: string | null,
 *   userTurnCount?: number,
 *   experienceSessionId?: string | null,
 *   lastHeardAtMs?: number | null
 * }} input
 */
export function buildConversationContinuitySnapshotV1(input = {}) {
  const turnCount = Math.max(0, Math.floor(Number(input.userTurnCount) || 0));
  return Object.freeze({
    schema: RHIZOH_LIVING_CONVERSATION_SCHEMA_V1,
    sessionId: input.productSessionId ? String(input.productSessionId) : null,
    experienceSessionId: input.experienceSessionId ? String(input.experienceSessionId) : null,
    turnCount,
    continuingThought: turnCount > 0 || Boolean(input.lastHeardAtMs),
    lastHeardAtMs: input.lastHeardAtMs ?? null,
    atMs: Date.now()
  });
}

function readHeardRingV1() {
  if (typeof window === "undefined") return memoryHeardRing.slice(-RING_MAX_V1);
  try {
    const raw = JSON.parse(window.localStorage.getItem(LS_HEARD_RING_V1) || "[]");
    return Array.isArray(raw) ? raw.slice(-RING_MAX_V1) : [];
  } catch {
    return memoryHeardRing.slice(-RING_MAX_V1);
  }
}

function writeHeardRingV1(ring) {
  memoryHeardRing = ring.slice(-RING_MAX_V1);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_HEARD_RING_V1, JSON.stringify(memoryHeardRing));
  } catch {
    /* noop */
  }
}

/**
 * @param {{
 *   text?: string,
 *   reason?: string,
 *   source?: string,
 *   executionAccepted?: boolean,
 *   showTranscript?: boolean,
 *   tr?: boolean
 * }} detail
 */
export function emitRhizohSttHeardSurfaceV1(detail = {}) {
  const text = String(detail.text || "").trim();
  const entry = Object.freeze({
    schema: RHIZOH_LIVING_CONVERSATION_SCHEMA_V1,
    text: text.slice(0, 240),
    reason: String(detail.reason || "stt_heard"),
    source: String(detail.source || "voice"),
    executionAccepted: detail.executionAccepted === true,
    showTranscript: detail.showTranscript !== false,
    atMs: Date.now()
  });
  const ring = [...readHeardRingV1(), entry];
  writeHeardRingV1(ring);
  const tr = detail.tr === true;
  const hudCopy = resolveSttHeardHudCopyV1(tr, text, {
    reason: entry.reason,
    executionAccepted: entry.executionAccepted,
    showTranscript: entry.showTranscript
  });
  const payload = Object.freeze({
    ...entry,
    hudCopy,
    heardCount: ring.length
  });
  if (typeof window !== "undefined") {
    window.__RHIZOH_STT_HEARD_SURFACE__ = Object.freeze({
      readOnly: true,
      last: payload,
      count: ring.length
    });
    window.dispatchEvent(new CustomEvent(RHIZOH_STT_HEARD_EVENT_V1, { detail: payload }));
  }
  return payload;
}

/**
 * @param {ReturnType<typeof buildConversationContinuitySnapshotV1>} snap
 */
export function publishConversationContinuitySurfaceV1(snap) {
  if (typeof window === "undefined" || !snap) return snap;
  window.__RHIZOH_CONVERSATION_CONTINUITY__ = Object.freeze({
    readOnly: true,
    ...snap
  });
  window.dispatchEvent(new CustomEvent(RHIZOH_CONVERSATION_CONTINUITY_EVENT_V1, { detail: snap }));
  return snap;
}

/** @internal vitest */
export function __resetLivingConversationSurfaceForTestV1() {
  memoryHeardRing = [];
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_HEARD_RING_V1);
      delete window.__RHIZOH_STT_HEARD_SURFACE__;
      delete window.__RHIZOH_CONVERSATION_CONTINUITY__;
    }
  } catch {
    /* noop */
  }
}
