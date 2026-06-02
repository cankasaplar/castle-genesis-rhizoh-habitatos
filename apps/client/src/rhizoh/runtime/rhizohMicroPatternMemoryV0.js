/**
 * Local micro-dialogue pattern memory — learns preferred short replies (no LLM).
 * Reflex layer personalization: template pool + usage-weighted selection.
 */

export const RHIZOH_MICRO_PATTERN_MEMORY_SCHEMA_V0 = "castle.rhizoh.micro_pattern_memory.v0";
const STORAGE_KEY_V0 = "rhizoh.micro_pattern_memory.v0";
const MAX_PER_INTENT_LOCALE_V0 = 8;

/**
 * @returns {{ schema: string, byIntent: Record<string, Record<string, Array<{ text: string, uses: number, lastMs: number }>>> }}
 */
function emptyStore() {
  return { schema: RHIZOH_MICRO_PATTERN_MEMORY_SCHEMA_V0, byIntent: {}, hotPhrases: {} };
}

function readStore() {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyStore();
    return {
      ...emptyStore(),
      ...parsed,
      byIntent: parsed.byIntent || {},
      hotPhrases: parsed.hotPhrases || {}
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_V0, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

/**
 * @param {string} intentId
 * @param {string} locale
 * @param {readonly string[]} templates
 */
export function pickMicroReplyWithMemoryV0(intentId, locale, templates) {
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  const list = Array.isArray(templates) ? [...templates] : [];
  const store = readStore();
  const bucket = store.byIntent?.[intentId]?.[loc] || [];
  if (!bucket.length) {
    return list[Math.floor(Math.random() * list.length)] || "";
  }
  const scored = bucket
    .filter((row) => row?.text && list.includes(row.text))
    .map((row) => ({ text: row.text, score: Number(row.uses || 0) + (row.lastMs > Date.now() - 86_400_000 ? 2 : 0) }));
  if (!scored.length) {
    return list[Math.floor(Math.random() * list.length)] || "";
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  const pick = top[Math.floor(Math.random() * top.length)];
  return pick?.text || list[0] || "";
}

/**
 * @param {string} intentId
 * @param {string} locale
 * @param {string} text
 */
export function recordMicroReplyPatternV0(intentId, locale, text) {
  const id = String(intentId || "").trim();
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  const reply = String(text || "").trim().slice(0, 240);
  if (!id || !reply) return;
  const store = readStore();
  if (!store.byIntent[id]) store.byIntent[id] = {};
  if (!Array.isArray(store.byIntent[id][loc])) store.byIntent[id][loc] = [];
  const arr = store.byIntent[id][loc];
  const idx = arr.findIndex((r) => r.text === reply);
  if (idx >= 0) {
    arr[idx].uses = Number(arr[idx].uses || 0) + 1;
    arr[idx].lastMs = Date.now();
  } else {
    arr.push({ text: reply, uses: 1, lastMs: Date.now() });
  }
  store.byIntent[id][loc] = arr
    .sort((a, b) => Number(b.uses) - Number(a.uses))
    .slice(0, MAX_PER_INTENT_LOCALE_V0);
  writeStore(store);
}

/**
 * O(1) hot phrase lookup (pre-intent cache).
 * @param {string} normalized
 * @param {string} locale
 */
export function readHotPhraseV0(normalized, locale, contextOpts = {}) {
  const n = String(normalized || "").trim();
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  if (!n) return null;
  const store = readStore();
  const row = store.hotPhrases?.[n];
  if (!row?.reply) return null;
  if (row.locale && row.locale !== loc) return null;
  const ctxTag = row.contextTag || "";
  if (ctxTag && contextOpts.requiredTag && ctxTag !== contextOpts.requiredTag) return null;
  return Object.freeze({
    intent: String(row.intent || "ack"),
    reply: String(row.reply),
    contextTag: ctxTag
  });
}

/**
 * @param {string} normalized
 * @param {string} locale
 * @param {string} intent
 * @param {string} reply
 */
export function recordHotPhraseV0(normalized, locale, intent, reply, contextTag = "") {
  const n = String(normalized || "").trim();
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  const text = String(reply || "").trim().slice(0, 240);
  if (!n || !text) return;
  const store = readStore();
  const prev = store.hotPhrases[n];
  store.hotPhrases[n] = {
    intent: String(intent || "ack"),
    reply: text,
    locale: loc,
    contextTag: String(contextTag || prev?.contextTag || ""),
    uses: Number(prev?.uses || 0) + 1,
    lastMs: Date.now()
  };
  const keys = Object.keys(store.hotPhrases);
  if (keys.length > 120) {
    const sorted = keys
      .map((k) => ({ k, uses: store.hotPhrases[k]?.uses || 0 }))
      .sort((a, b) => b.uses - a.uses);
    const keep = new Set(sorted.slice(0, 100).map((x) => x.k));
    for (const k of keys) {
      if (!keep.has(k)) delete store.hotPhrases[k];
    }
  }
  writeStore(store);
  recordMicroReplyPatternV0(intent, loc, text);
}

/** @internal test */
export function clearMicroPatternMemoryForTestV0() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
