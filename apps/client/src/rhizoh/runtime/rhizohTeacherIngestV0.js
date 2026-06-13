/**
 * Rhizoh Teacher Ingest v0 — record teacher exchanges into knowledge + ghost memory.
 */

import { appendCastleChronicleEntryV0, CASTLE_CHRONICLE_KIND_V0 } from "./castleChronicleV0.js";
import { appendGhostMemoryV0 } from "./ghostMemoryPersistenceV0.js";
import {
  readRhizohPreferencesV0
} from "./rhizohPreferenceStoreV0.js";
import {
  RHIZOH_TEACHER_SOURCE_V0,
  upsertRhizohKnowledgeV0
} from "./rhizohKnowledgeStoreV0.js";
import { resolveTeacherSourceFromProviderV0 } from "./rhizohPolicyRouterV0.js";

export const RHIZOH_TEACHER_INGEST_SCHEMA_V0 = "rhizoh.teacher_ingest.v0";

/**
 * @param {{ question: string, answer: string, teacher?: string, provider?: string, tags?: string[], traceId?: string }} input
 */
export function ingestTeacherExchangeV0(input = {}) {
  const prefs = readRhizohPreferencesV0();
  if (!prefs.autoLearnFromTeachers) return null;

  const question = String(input.question || "").trim();
  const answer = String(input.answer || "").trim();
  if (!question || !answer || answer.length < 8) return null;

  const teacher =
    input.teacher ||
    resolveTeacherSourceFromProviderV0(input.provider) ||
    RHIZOH_TEACHER_SOURCE_V0.GPT;

  const entry = upsertRhizohKnowledgeV0({
    question,
    answer,
    teacher,
    tags: input.tags || ["teacher_ingest"],
    confidence: 0.75
  });

  appendGhostMemoryV0({
    summary: `Learned: ${question.slice(0, 120)} → ${answer.slice(0, 160)}`,
    tags: ["teacher_ingest", teacher]
  });

  appendCastleChronicleEntryV0({
    kind: CASTLE_CHRONICLE_KIND_V0.CUSTOM,
    title: "Rhizoh learned from teacher",
    body: `${teacher.replace("teacher_", "")}: ${question.slice(0, 80)}`,
    dedupeKey: input.traceId ? `chronicle:learn:${input.traceId}` : undefined,
    payload: { teacher, knowledgeId: entry?.id }
  });

  return entry;
}

/**
 * Seed castle-local knowledge from identity/chronicle (no LLM).
 * @param {{ castleId?: string, motto?: string, chronicleTitles?: string[] }} seed
 */
export function seedRhizohLocalKnowledgeV0(seed = {}) {
  const rows = [];
  if (seed.motto) {
    rows.push(
      upsertRhizohKnowledgeV0({
        question: "What is your castle motto?",
        answer: String(seed.motto),
        teacher: RHIZOH_TEACHER_SOURCE_V0.RHIZOH,
        tags: ["identity", "castle"],
        confidence: 0.95
      })
    );
  }
  if (seed.castleId) {
    rows.push(
      upsertRhizohKnowledgeV0({
        question: "What is my castle id?",
        answer: `Your castle id is ${seed.castleId}.`,
        teacher: RHIZOH_TEACHER_SOURCE_V0.RHIZOH,
        tags: ["identity"],
        confidence: 0.99
      })
    );
  }
  for (const title of seed.chronicleTitles || []) {
    rows.push(
      upsertRhizohKnowledgeV0({
        question: `Tell me about: ${title}`,
        answer: `This is recorded in your Castle Chronicle: ${title}.`,
        teacher: RHIZOH_TEACHER_SOURCE_V0.RHIZOH,
        tags: ["chronicle"],
        confidence: 0.9
      })
    );
  }
  return Object.freeze(rows.filter(Boolean));
}
