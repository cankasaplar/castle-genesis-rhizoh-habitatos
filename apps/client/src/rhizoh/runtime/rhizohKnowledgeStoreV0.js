/**
 * Rhizoh Knowledge Store v0 — distilled facts from teachers (LLM = Teacher, not Brain).
 */

import { detectRhizohMultilingualLocaleV0 } from "./rhizohMultilingualBridgeV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";

export const RHIZOH_KNOWLEDGE_STORE_SCHEMA_V0 = "rhizoh.knowledge_store.v0";
export const RHIZOH_KNOWLEDGE_LS_KEY_V0 = "rhizoh_knowledge_store_v0";
export const RHIZOH_KNOWLEDGE_EVENT_V0 = "rhizoh:knowledge-store-v0";

export const RHIZOH_TEACHER_SOURCE_V0 = Object.freeze({
  RHIZOH: "rhizoh_local",
  USER: "user",
  GPT: "teacher_gpt",
  CLAUDE: "teacher_claude",
  GEMINI: "teacher_gemini",
  STOCKFISH: "teacher_stockfish",
  WIKIPEDIA: "teacher_wikipedia",
  ARCHIVE: "teacher_archive"
});

const MAX_ENTRIES = 512;

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `know_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function answerMatchesUiLocaleV0(answer) {
  const expected = resolveOutputLanguageCodeV0();
  const sample = String(answer || "").trim();
  if (!sample || expected !== "tr") return true;
  if (/[ğıüşöçİĞÜŞÖÇ]/.test(sample)) return true;
  const detected = detectRhizohMultilingualLocaleV0(sample.slice(0, 400), "").code;
  return detected === "tr" || detected === "und" || detected === "mixed";
}

export function normalizeRhizohQuestionV0(text = "") {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 480);
}

function readRawV0() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RHIZOH_KNOWLEDGE_LS_KEY_V0);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function writeRawV0(entries) {
  if (typeof window === "undefined") return;
  const payload = {
    schema: RHIZOH_KNOWLEDGE_STORE_SCHEMA_V0,
    entries: entries.slice(0, MAX_ENTRIES)
  };
  window.localStorage.setItem(RHIZOH_KNOWLEDGE_LS_KEY_V0, JSON.stringify(payload));
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_KNOWLEDGE_EVENT_V0, {
        detail: Object.freeze({ count: payload.entries.length })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listRhizohKnowledgeV0() {
  return Object.freeze(readRawV0().map((e) => Object.freeze({ ...e })));
}

function scoreQuestionMatchV0(queryNorm, entryNorm) {
  if (!queryNorm || !entryNorm) return 0;
  if (queryNorm === entryNorm) return 1;
  if (entryNorm.includes(queryNorm) || queryNorm.includes(entryNorm)) return 0.88;
  const qTokens = new Set(queryNorm.split(" ").filter((t) => t.length > 2));
  if (!qTokens.size) return 0;
  const eTokens = entryNorm.split(" ").filter((t) => t.length > 2);
  let overlap = 0;
  for (const t of eTokens) if (qTokens.has(t)) overlap += 1;
  return overlap / Math.max(qTokens.size, eTokens.length || 1);
}

/**
 * @param {string} question
 * @param {{ minScore?: number }} [opts]
 */
export function lookupRhizohKnowledgeV0(question, opts = {}) {
  const queryNorm = normalizeRhizohQuestionV0(question);
  if (!queryNorm) return null;
  const minScore = Math.max(0.4, Math.min(1, Number(opts.minScore) || 0.62));
  let best = null;
  let bestScore = 0;
  for (const row of readRawV0()) {
    if (!answerMatchesUiLocaleV0(row.answer)) continue;
    const score = scoreQuestionMatchV0(queryNorm, row.questionNorm || normalizeRhizohQuestionV0(row.question));
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  if (!best || bestScore < minScore) return null;
  return Object.freeze({
    ...best,
    matchScore: bestScore
  });
}

/**
 * @param {{ question: string, answer: string, teacher?: string, tags?: string[], confidence?: number }} input
 */
export function upsertRhizohKnowledgeV0(input = {}) {
  const question = String(input.question || "").trim();
  const answer = String(input.answer || "").trim();
  if (!question || !answer) return null;
  const questionNorm = normalizeRhizohQuestionV0(question);
  const teacher = String(input.teacher || RHIZOH_TEACHER_SOURCE_V0.USER).slice(0, 48);
  const entries = readRawV0();
  const idx = entries.findIndex((e) => e.questionNorm === questionNorm);
  const now = nowIso();
  const row = Object.freeze({
    schema: `${RHIZOH_KNOWLEDGE_STORE_SCHEMA_V0}.entry`,
    id: idx >= 0 ? entries[idx].id : newId(),
    question: question.slice(0, 480),
    questionNorm,
    answer: answer.slice(0, 4000),
    teacher,
    tags: Object.freeze((input.tags || []).map((t) => String(t).slice(0, 32)).slice(0, 8)),
    confidence: Math.max(0, Math.min(1, Number(input.confidence) || 0.72)),
    hitCount: idx >= 0 ? (Number(entries[idx].hitCount) || 0) : 0,
    createdAt: idx >= 0 ? entries[idx].createdAt || now : now,
    updatedAt: now,
    lastUsedAt: idx >= 0 ? entries[idx].lastUsedAt || null : null
  });
  if (idx >= 0) entries[idx] = row;
  else entries.unshift(row);
  writeRawV0(entries);
  return row;
}

/**
 * @param {string} id
 */
export function touchRhizohKnowledgeHitV0(id) {
  const entries = readRawV0();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  entries[idx] = {
    ...entries[idx],
    hitCount: (Number(entries[idx].hitCount) || 0) + 1,
    lastUsedAt: nowIso()
  };
  writeRawV0(entries);
  return Object.freeze({ ...entries[idx] });
}

/**
 * @param {ReadonlyArray<object>} remoteEntries
 */
export function mergeRhizohKnowledgeFromCloudV0(remoteEntries = []) {
  const byNorm = new Map(readRawV0().map((e) => [e.questionNorm, e]));
  for (const row of remoteEntries || []) {
    if (!row?.questionNorm && !row?.question) continue;
    const norm = row.questionNorm || normalizeRhizohQuestionV0(row.question);
    const existing = byNorm.get(norm);
    byNorm.set(norm, {
      ...(existing || {}),
      ...row,
      questionNorm: norm,
      hitCount: Math.max(Number(existing?.hitCount) || 0, Number(row.hitCount) || 0),
      confidence: Math.max(Number(existing?.confidence) || 0, Number(row.confidence) || 0)
    });
  }
  writeRawV0([...byNorm.values()]);
  return listRhizohKnowledgeV0();
}

export function resetRhizohKnowledgeStoreForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RHIZOH_KNOWLEDGE_LS_KEY_V0);
  }
}
