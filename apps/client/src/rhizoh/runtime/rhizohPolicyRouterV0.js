/**
 * Rhizoh Policy Router v0 — Ask Rhizoh: local knowledge first, teacher (LLM) on miss.
 */

import { commitFinalUserVisibleLanguageV0 } from "./rhizohFinalLanguageCommitV0.js";
import {
  lookupRhizohKnowledgeV0,
  RHIZOH_TEACHER_SOURCE_V0,
  touchRhizohKnowledgeHitV0
} from "./rhizohKnowledgeStoreV0.js";
import {
  readRhizohPreferencesV0,
  RHIZOH_ASK_MODE_V0
} from "./rhizohPreferenceStoreV0.js";

export const RHIZOH_POLICY_ROUTER_SCHEMA_V0 = "rhizoh.policy_router.v0";
export const RHIZOH_ASK_RHIZOH_EVENT_V0 = "rhizoh:ask-rhizoh-v0";

/**
 * @param {string} message
 * @param {{ traceId?: string, minScore?: number }} [opts]
 */
export function tryResolveRhizohLocalKnowledgeV0(message, opts = {}) {
  const trimmed = String(message || "").trim();
  if (!trimmed) return null;

  const prefs = readRhizohPreferencesV0();
  if (prefs.askMode === RHIZOH_ASK_MODE_V0.TEACHER_ONLY) return null;

  const hit = lookupRhizohKnowledgeV0(trimmed, {
    minScore: opts.minScore ?? prefs.localKnowledgeMinScore
  });
  if (!hit?.answer) return null;

  touchRhizohKnowledgeHitV0(hit.id);
  const committed = commitFinalUserVisibleLanguageV0(hit.answer, {
    source: RHIZOH_TEACHER_SOURCE_V0.RHIZOH,
    traceId: opts.traceId,
    lockKey: "language_commit_lock"
  });

  const result = Object.freeze({
    schema: RHIZOH_POLICY_ROUTER_SCHEMA_V0,
    reply: committed.text,
    directive: "FOCUS_RHIZOH",
    source: RHIZOH_TEACHER_SOURCE_V0.RHIZOH,
    knowledgeId: hit.id,
    teacher: hit.teacher,
    matchScore: hit.matchScore,
    confidence: hit.confidence,
    llmBypass: true,
    traceId: opts.traceId || null
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_ASK_RHIZOH_EVENT_V0, {
          detail: Object.freeze({
            source: result.source,
            knowledgeId: hit.id,
            matchScore: hit.matchScore
          })
        })
      );
    } catch {
      /* noop */
    }
  }

  return result;
}

/**
 * Map gateway provider id to teacher source tag.
 * @param {string} provider
 */
export function resolveTeacherSourceFromProviderV0(provider = "") {
  const p = String(provider || "").toLowerCase();
  if (p.includes("claude") || p.includes("anthropic")) return RHIZOH_TEACHER_SOURCE_V0.CLAUDE;
  if (p.includes("gemini") || p.includes("google")) return RHIZOH_TEACHER_SOURCE_V0.GEMINI;
  if (p.includes("gpt") || p.includes("openai")) return RHIZOH_TEACHER_SOURCE_V0.GPT;
  return RHIZOH_TEACHER_SOURCE_V0.GPT;
}
