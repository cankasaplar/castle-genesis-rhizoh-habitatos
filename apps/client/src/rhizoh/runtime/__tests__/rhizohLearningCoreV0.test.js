import { describe, expect, it, beforeEach } from "vitest";
import {
  lookupRhizohKnowledgeV0,
  normalizeRhizohQuestionV0,
  resetRhizohKnowledgeStoreForTestV0,
  RHIZOH_TEACHER_SOURCE_V0,
  upsertRhizohKnowledgeV0
} from "../rhizohKnowledgeStoreV0.js";
import {
  patchRhizohPreferencesV0,
  readRhizohPreferencesV0,
  resetRhizohPreferencesForTestV0,
  RHIZOH_ASK_MODE_V0
} from "../rhizohPreferenceStoreV0.js";
import { tryResolveRhizohLocalKnowledgeV0 } from "../rhizohPolicyRouterV0.js";
import { ingestTeacherExchangeV0 } from "../rhizohTeacherIngestV0.js";

describe("rhizohKnowledgeStoreV0", () => {
  beforeEach(() => {
    resetRhizohKnowledgeStoreForTestV0();
    resetRhizohPreferencesForTestV0();
  });

  it("normalizes and matches questions", () => {
    upsertRhizohKnowledgeV0({
      question: "What is your castle motto?",
      answer: "Observe · Connect · Remember",
      teacher: RHIZOH_TEACHER_SOURCE_V0.RHIZOH
    });
    const hit = lookupRhizohKnowledgeV0("what is your castle motto");
    expect(hit?.answer).toContain("Observe");
    expect(hit?.matchScore).toBeGreaterThan(0.9);
  });

  it("policy router returns local knowledge before teacher", () => {
    upsertRhizohKnowledgeV0({
      question: "Who am I?",
      answer: "You are the founder of this castle.",
      teacher: RHIZOH_TEACHER_SOURCE_V0.RHIZOH,
      confidence: 0.9
    });
    const resolved = tryResolveRhizohLocalKnowledgeV0("Who am I?", { traceId: "t1" });
    expect(resolved?.llmBypass).toBe(true);
    expect(resolved?.source).toBe(RHIZOH_TEACHER_SOURCE_V0.RHIZOH);
    expect(resolved?.reply).toContain("founder");
  });

  it("respects teacher_only preference", () => {
    upsertRhizohKnowledgeV0({
      question: "test question",
      answer: "local answer",
      teacher: RHIZOH_TEACHER_SOURCE_V0.RHIZOH
    });
    patchRhizohPreferencesV0({ askMode: RHIZOH_ASK_MODE_V0.TEACHER_ONLY });
    expect(readRhizohPreferencesV0().askMode).toBe(RHIZOH_ASK_MODE_V0.TEACHER_ONLY);
    expect(tryResolveRhizohLocalKnowledgeV0("test question")).toBeNull();
  });

  it("ingests teacher exchanges into knowledge store", () => {
    const entry = ingestTeacherExchangeV0({
      question: "What is Rhizoh?",
      answer: "Rhizoh is a continuity protocol for living castles.",
      teacher: RHIZOH_TEACHER_SOURCE_V0.GPT,
      traceId: "learn_1"
    });
    expect(entry?.teacher).toBe(RHIZOH_TEACHER_SOURCE_V0.GPT);
    const hit = lookupRhizohKnowledgeV0(normalizeRhizohQuestionV0("What is Rhizoh?"));
    expect(hit?.answer).toContain("continuity protocol");
  });
});
