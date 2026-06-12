/**
 * Continuity recall intent — detect "what did we talk about" queries and
 * inject high-weight disk turns into LLM recollection (bypass shallow presence reflex).
 */

import { normalizeVoiceCommandTokenV0 } from "./rhizohVoiceCommandRouterV0.js";
import { foldCanonicalSurfaceV1 } from "./rhizohCanonicalIntentV1.js";

export const RHIZOH_CONTINUITY_RECALL_SCHEMA_V0 = "castle.rhizoh.continuity_recall_boost.v0";

export const RHIZOH_CONTINUITY_RECALL_PROMPT_DIRECTIVE_V0 =
  "User asks to RECALL prior conversation. Ground the answer in VERIFIED_RECALL lines below; cite concrete topics (names, places, sports, preferences) from those lines; use persona.firstName when relevant; do not invent facts absent from recall context.";

/** Story / narrative continuation — must reach LLM, not whisper_default_conf shadow-only. */
const STORY_CONTINUATION_PATTERNS_V0 = [
  /\b(tekrar\s+anlat\w*|yeniden\s+anlat\w*|bir\s+daha\s+anlat\w*)\b/i,
  /\b(devam\s+et|devam\s+eder|hikayeye\s+devam|hikayeyi\s+devam)\b/i,
  /\b(hikaye|hikayeyi|hikayeye)\b.*\b(devam|anlat|dinle)\b/i,
  /\b(devam|anlat|dinle)\b.*\b(hikaye|hikayeyi|hikayeye)\b/i,
  /\b(continue\s+the\s+story|keep\s+going|tell\s+me\s+more)\b/i
];

/** @type {{ tier: string, re: RegExp }[]} */
const RECALL_QUERY_PATTERNS_V0 = [
  {
    tier: "explicit",
    re: /\b(hatirliyor\s+musun|hatirliyor\s+mu|hatirladin\s+mi|hatirladigin|daha\s+once\s+soyle|ne\s+konusmustuk|ne\s+konusurduk|ne\s+demistik|ne\s+demistim|ne\s+soylemistim|az\s+once\s+ne|onceki\s+sohbet|gecen\s+sefer|anlatmistim|bahsetmistim|bahsetmistik|soylemistim)\b/i
  },
  {
    tier: "explicit",
    re: /\b(do\s+you\s+remember|remember\s+when|what\s+did\s+we\s+(talk|discuss|say)|earlier\s+we|previously\s+mentioned|recall\s+our)\b/i
  },
  {
    tier: "implicit",
    re: /\b(hatirla|hatirlat|remember\s+that|remind\s+me)\b/i
  },
  {
    tier: "topic_anchor",
    re: /\b(merak\s+ediyordum|merak\s+ediyorum|bahsetmistim|bahsetmistik|soylemistim|demistim)\b/i
  }
];

const RECALL_STOPWORDS_V0 = new Set([
  "ben",
  "beni",
  "sen",
  "siz",
  "biz",
  "ne",
  "mi",
  "mu",
  "mı",
  "musun",
  "musunuz",
  "misin",
  "misiniz",
  "rhizoh",
  "rizo",
  "rezo",
  "the",
  "and",
  "for",
  "you",
  "your",
  "that",
  "this",
  "what",
  "did",
  "was",
  "were",
  "have",
  "about",
  "with",
  "from",
  "bir",
  "veya",
  "ile",
  "icin",
  "için",
  "gibi",
  "cok",
  "çok",
  "var",
  "yok",
  "olan",
  "olur",
  "degil",
  "değil",
  "hatirliyor",
  "hatirla",
  "konusmustuk",
  "demistik",
  "remember",
  "recall"
]);

/** @type {Record<string, string[]>} */
const RECALL_TOPIC_ALIASES_V0 = {
  turkiye: ["turkiye", "turkey", "turk", "mac", "maclar", "fikstur", "fixture"],
  istanbul: ["istanbul", "ist"],
  futbol: ["futbol", "football", "soccer", "mac", "maclar", "lig", "fikstur"]
};

/**
 * @param {string} raw
 */
export function normalizeForContinuityRecallV0(raw) {
  return foldCanonicalSurfaceV1(normalizeVoiceCommandTokenV0(String(raw || "").trim()));
}

/**
 * Narrative continuation ("devam eder misin", "tekrar anlat") — LLM path, not presence reflex.
 * @param {string} raw
 */
export function probeStoryContinuationIntentV0(raw) {
  const normalized = normalizeForContinuityRecallV0(raw);
  if (!normalized || normalized.length < 8) {
    return Object.freeze({ active: false, reason: "too_short" });
  }
  const hit = STORY_CONTINUATION_PATTERNS_V0.find((re) => re.test(normalized));
  return Object.freeze({
    active: Boolean(hit),
    reason: hit ? "story_continuation" : "none"
  });
}

/**
 * @param {string} normalized
 */
export function probeContinuityRecallIntentV0(raw) {
  const normalized = normalizeForContinuityRecallV0(raw)
    .replace(/[?!.,;:]+$/g, "")
    .trim();
  if (!normalized) {
    return Object.freeze({ active: false, tier: null, anchorTokens: [], reason: "empty" });
  }

  let tier = null;
  let reason = null;
  for (const row of RECALL_QUERY_PATTERNS_V0) {
    if (row.re.test(normalized)) {
      tier = row.tier;
      reason = `pattern_${row.tier}`;
      break;
    }
  }

  const anchorTokens = tier ? extractRecallAnchorTokensV0(normalized) : [];
  const active = Boolean(tier);

  return Object.freeze({
    active,
    tier: tier || null,
    anchorTokens: Object.freeze([...anchorTokens]),
    reason: reason || "none"
  });
}

/**
 * @param {string} normalized
 */
export function extractRecallAnchorTokensV0(normalized) {
  const n = String(normalized || "").trim();
  if (!n) return [];

  /** @type {Set<string>} */
  const anchors = new Set();
  const words = n.split(/\s+/).filter(Boolean);

  for (const word of words) {
    const w = word.replace(/[^a-z0-9']/gi, "");
    if (!w || w.length < 3 || RECALL_STOPWORDS_V0.has(w)) continue;
    anchors.add(w);
    for (const [root, aliases] of Object.entries(RECALL_TOPIC_ALIASES_V0)) {
      if (aliases.some((a) => w.startsWith(a) || a.startsWith(w))) {
        anchors.add(root);
        for (const alias of aliases) anchors.add(alias);
      }
    }
  }

  return [...anchors].slice(0, 10);
}

/**
 * @param {Record<string, unknown>} disk
 */
export function collectContinuityRecallCandidatesV0(disk = {}) {
  const d = disk && typeof disk === "object" ? disk : {};
  const meta = d.meta && typeof d.meta === "object" ? d.meta : {};
  const turns = Array.isArray(d.turns) ? d.turns : [];
  const episodes = Array.isArray(meta.rhizohMemoryEpisodes) ? meta.rhizohMemoryEpisodes : [];
  /** @type {object[]} */
  const out = [];

  for (const t of turns) {
    if (!t || typeof t !== "object") continue;
    const user = String(t.user || t.text || t.userInput || "").trim();
    const assistant = String(t.assistant || t.rhizohOutput || "").trim();
    const tsRaw = t.ts ?? t.atMs ?? t.timestamps?.startedAt ?? t.timestamps?.closedAt;
    const ts = Number(tsRaw);
    if (!user && !assistant) continue;
    out.push({
      user,
      assistant,
      ts: Number.isFinite(ts) && ts > 0 ? ts : Date.now(),
      intent: String(t.intent || "CHAT"),
      source: "turn"
    });
  }

  for (const ep of episodes) {
    if (!ep || typeof ep !== "object") continue;
    const user = String(ep.user || ep.summary || ep.text || ep.content || "").trim();
    const assistant = String(ep.assistant || "").trim();
    const tsRaw = ep.atMs ?? ep.ts ?? ep.endMs;
    const ts = Number(tsRaw);
    if (!user && !assistant) continue;
    out.push({
      user,
      assistant,
      ts: Number.isFinite(ts) && ts > 0 ? ts : Date.now(),
      intent: String(ep.intent || "CHAT"),
      source: "episode"
    });
  }

  return out;
}

/**
 * @param {object} candidate
 * @param {string[]} anchorTokens
 * @param {number} now
 */
function scoreRecallCandidateV0(candidate, anchorTokens, now) {
  const textNorm = normalizeForContinuityRecallV0(`${candidate.user} ${candidate.assistant}`);
  let overlap = 0;
  for (const anchor of anchorTokens) {
    if (!anchor) continue;
    if (textNorm.includes(anchor)) overlap += 1;
    else if (anchor.length >= 4 && textNorm.split(/\s+/).some((w) => w.startsWith(anchor.slice(0, 4)))) {
      overlap += 0.5;
    }
  }

  const ageMs = Math.max(0, now - Number(candidate.ts || now));
  const recency = Math.exp(-ageMs / (45 * 60 * 1000));
  const substance = Math.min(1.2, String(candidate.user || "").trim().length / 40);
  const anchorBoost = overlap > 0 ? 2.5 + overlap : 0;

  return anchorBoost + recency + substance;
}

/**
 * @param {object} candidate
 * @param {number} score
 */
function candidateToRecallLineV0(candidate, score) {
  const retrievalWeight = Math.min(0.99, Math.max(0.72, 0.78 + score * 0.06));
  return Object.freeze({
    ts: candidate.ts,
    user: String(candidate.user || "").slice(0, 220),
    assistant: String(candidate.assistant || "").slice(0, 300),
    intent: candidate.intent || "CHAT",
    retrievalWeight,
    recallBoost: true,
    memoryFieldScores: Object.freeze({
      semantic: Math.min(0.98, 0.82 + score * 0.04),
      physicsCollapse: 0.9,
      recallBoost: 1
    })
  });
}

/**
 * @param {string} message
 * @param {Record<string, unknown>} disk
 */
export function buildContinuityRecallBoostV0(message, disk = {}) {
  const probe = probeContinuityRecallIntentV0(message);
  if (!probe.active) return null;

  const now = Date.now();
  const candidates = collectContinuityRecallCandidatesV0(disk);
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scoreRecallCandidateV0(candidate, probe.anchorTokens, now)
    }))
    .sort((a, b) => b.score - a.score);

  let picked = scored.filter((row) => row.score >= 1.2).slice(0, 6);
  if (!picked.length) {
    picked = candidates
      .filter((c) => String(c.user || "").trim().length >= 8)
      .slice(-5)
      .map((candidate) => ({ candidate, score: 1 }));
  }

  const lines = picked.map(({ candidate, score }) => candidateToRecallLineV0(candidate, score));
  if (!lines.length) return null;

  return Object.freeze({
    schema: RHIZOH_CONTINUITY_RECALL_SCHEMA_V0,
    active: true,
    tier: probe.tier,
    reason: probe.reason,
    anchorTokens: probe.anchorTokens,
    promptDirective: RHIZOH_CONTINUITY_RECALL_PROMPT_DIRECTIVE_V0,
    lines: Object.freeze(lines.map((line) => Object.freeze({ ...line })))
  });
}

/**
 * @param {unknown[]} baseRecollection
 * @param {ReturnType<typeof buildContinuityRecallBoostV0>} recallBoost
 * @param {{ limit?: number }} [opts]
 */
export function mergeRecallBoostIntoRecollectionV0(baseRecollection, recallBoost, opts = {}) {
  const base = Array.isArray(baseRecollection) ? baseRecollection : [];
  const boostLines = recallBoost?.lines;
  if (!Array.isArray(boostLines) || !boostLines.length) return base;

  const limit = Math.max(Number(opts.limit) || 14, boostLines.length + 6);
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {object[]} */
  const merged = [];

  for (const row of [...boostLines, ...base]) {
    if (!row || typeof row !== "object") continue;
    const key = `${row.ts || 0}:${String(row.user || row.text || "").slice(0, 48)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }

  return merged.slice(0, limit);
}
