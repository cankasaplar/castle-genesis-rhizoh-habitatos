/**
 * L1-alpha deterministic recall — citation bundle only (no LLM, no embeddings).
 * Path A: substring token match over life store turns.
 * @see docs/RHIZOH_L1_LIFE_CONTINUITY_V0.md
 * @see docs/schemas/life-continuity-v0.schema.json — LifeRecallResultV0
 */

import { LIFE_CONTINUITY_CONTRACT_V0 } from "./lifeContinuityStoreV0.js";
import { getLifeContinuityStoreV0 } from "./lifeContinuityStoreV0.js";

const DEFAULT_MAX_CITATIONS = 12;
const DEFAULT_EXCERPT_MAX = 480;
const MIN_TOKEN_LEN = 3;

/**
 * @param {string} text
 */
function normalizeForMatch(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * @param {string} query
 * @returns {string[]}
 */
export function tokenizeRecallQueryV0(query) {
  const norm = normalizeForMatch(query);
  const raw = norm.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const tokens = [...new Set(raw.filter((t) => t.length >= MIN_TOKEN_LEN))];
  return tokens;
}

/**
 * @param {string} text
 * @param {string[]} tokens
 */
function scoreTurnText(text, tokens) {
  if (!tokens.length) return 0;
  const hay = normalizeForMatch(text);
  let score = 0;
  for (const tok of tokens) {
    if (hay.includes(tok)) score += 1;
  }
  return score;
}

/**
 * @param {string} text
 * @param {string[]} tokens
 * @param {number} maxLen
 */
export function buildRecallExcerptV0(text, tokens, maxLen = DEFAULT_EXCERPT_MAX) {
  const raw = String(text || "");
  if (!raw.trim()) return "";
  const hay = normalizeForMatch(raw);
  let idx = -1;
  for (const tok of tokens) {
    const i = hay.indexOf(tok);
    if (i >= 0 && (idx < 0 || i < idx)) idx = i;
  }
  if (idx < 0) return raw.slice(0, maxLen);
  const start = Math.max(0, idx - Math.floor(maxLen / 4));
  const slice = raw.slice(start, start + maxLen);
  const prefix = start > 0 ? "…" : "";
  const suffix = start + maxLen < raw.length ? "…" : "";
  return `${prefix}${slice}${suffix}`;
}

/**
 * Deterministic recall — ranked citations only.
 * @param {{
 *   user_id: string,
 *   query: string,
 *   store?: import('./lifeContinuityStoreV0.js').LifeContinuityStoreV0,
 *   maxCitations?: number,
 *   excerptMax?: number,
 *   minScore?: number
 * }} input
 */
export function recallCitationsV0(input) {
  const user_id = String(input.user_id || "").trim();
  const query = String(input.query || "").trim();
  if (user_id.length < 8) {
    return { ok: false, code: "invalid_user_id", recall: null };
  }
  if (!query) {
    return { ok: false, code: "empty_query", recall: null };
  }

  const store = input.store || getLifeContinuityStoreV0();
  const tokens = tokenizeRecallQueryV0(query);
  if (!tokens.length) {
    return { ok: false, code: "no_query_tokens", recall: null };
  }

  const minScore = Math.max(1, Math.floor(Number(input.minScore) || 1));
  const maxCitations = Math.min(
    12,
    Math.max(1, Math.floor(Number(input.maxCitations) || DEFAULT_MAX_CITATIONS))
  );
  const excerptMax = Math.min(
    2000,
    Math.max(40, Math.floor(Number(input.excerptMax) || DEFAULT_EXCERPT_MAX))
  );

  const scan = store.getTurnsForUser(user_id, { maxTurns: 2000 });
  if (!scan.ok) return { ok: false, code: scan.code || "scan_failed", recall: null };

  /** @type {{ score: number, citation: Record<string, unknown> }[]} */
  const ranked = [];
  for (const { turn, thread } of scan.rows) {
    const score = scoreTurnText(String(turn.text || ""), tokens);
    if (score < minScore) continue;
    ranked.push({
      score,
      citation: Object.freeze({
        turn_id: turn.turn_id,
        thread_id: turn.thread_id,
        at: turn.at,
        excerpt: buildRecallExcerptV0(String(turn.text || ""), tokens, excerptMax),
        thread_title: thread.title,
        role: turn.role,
        match_score: score
      })
    });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return String(b.citation.at).localeCompare(String(a.citation.at));
  });

  const citations = ranked.slice(0, maxCitations).map((r) => {
    const { match_score, role, ...rest } = r.citation;
    void match_score;
    void role;
    return rest;
  });

  const recall = Object.freeze({
    contract_version: LIFE_CONTINUITY_CONTRACT_V0,
    user_id,
    query,
    citations,
    generated_at: new Date().toISOString(),
    recall_mode: "deterministic_token_match_v0"
  });

  return { ok: true, recall, tokens_matched: tokens.length, candidates: ranked.length };
}

/**
 * Lightweight intent — recall path vs normal chat (no NLP).
 * @param {string} message
 */
export function isLikelyRecallQueryV0(message) {
  const m = normalizeForMatch(message);
  if (!m) return false;
  const cues = [
    "hatirliyor",
    "hatırlıyor",
    "hatirla",
    "hatırla",
    "konustuk",
    "konuştuk",
    "demistik",
    "demiştik",
    "gecen",
    "geçen",
    "dun",
    "dün",
    "remember",
    "recall",
    "last week",
    "last monday",
    "pazartesi"
  ];
  return cues.some((c) => m.includes(normalizeForMatch(c)));
}
