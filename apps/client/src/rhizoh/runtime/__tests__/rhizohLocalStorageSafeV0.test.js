import { describe, expect, it, beforeEach } from "vitest";
import {
  evictRhizohOptionalLocalStorageV0,
  isRhizohStorageQuotaErrorV0,
  pruneRhizohLocalStorageOnBootV0,
  setRhizohLocalStorageJsonV0
} from "../rhizohLocalStorageSafeV0.js";
import {
  resetRhizohKnowledgeStoreForTestV0,
  upsertRhizohKnowledgeV0
} from "../rhizohKnowledgeStoreV0.js";
import {
  recordOpeningFromMatchV0,
  resetRhizohOpeningBookForTestV0
} from "../rhizohOpeningBookV0.js";

describe("rhizohLocalStorageSafeV0", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRhizohKnowledgeStoreForTestV0();
    resetRhizohOpeningBookForTestV0();
  });

  it("detects quota errors", () => {
    expect(isRhizohStorageQuotaErrorV0({ name: "QuotaExceededError" })).toBe(true);
    expect(isRhizohStorageQuotaErrorV0(new Error("exceeded the quota"))).toBe(true);
    expect(isRhizohStorageQuotaErrorV0(new Error("other"))).toBe(false);
  });

  it("writes json without throwing", () => {
    const out = setRhizohLocalStorageJsonV0("test.safe.v0", { ok: true });
    expect(out.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem("test.safe.v0"))).toEqual({ ok: true });
  });

  it("evicts optional keys on quota pressure", () => {
    localStorage.setItem("rhizoh.chess.learning_report.v0", JSON.stringify({ big: "x".repeat(2000) }));
    const freed = evictRhizohOptionalLocalStorageV0();
    expect(freed).toBeGreaterThan(0);
    expect(localStorage.getItem("rhizoh.chess.learning_report.v0")).toBeNull();
  });

  it("knowledge store write survives quota by compacting", () => {
    const original = localStorage.setItem.bind(localStorage);
    let calls = 0;
    localStorage.setItem = (key, value) => {
      calls += 1;
      if (key === "rhizoh_knowledge_store_v0" && calls === 1) {
        const err = new Error("exceeded the quota");
        err.name = "QuotaExceededError";
        throw err;
      }
      return original(key, value);
    };

    expect(() =>
      upsertRhizohKnowledgeV0({
        question: "quota test",
        answer: "still persisted"
      })
    ).not.toThrow();

    const hit = JSON.parse(localStorage.getItem("rhizoh_knowledge_store_v0"));
    expect(hit.entries[0].answer).toContain("still persisted");
    localStorage.setItem = original;
  });

  it("opening book write survives quota by compacting", () => {
    const original = localStorage.setItem.bind(localStorage);
    let calls = 0;
    localStorage.setItem = (key, value) => {
      calls += 1;
      if (key === "rhizoh_opening_book_v0" && calls === 1) {
        const err = new Error("exceeded the quota");
        err.name = "QuotaExceededError";
        throw err;
      }
      return original(key, value);
    };

    expect(() =>
      recordOpeningFromMatchV0({ name: "French Defense", eco: "C00", won: true })
    ).not.toThrow();

    const book = JSON.parse(localStorage.getItem("rhizoh_opening_book_v0"));
    expect(book.entries[0].name).toBe("French Defense");
    localStorage.setItem = original;
  });

  it("boot prune reports store sizes", () => {
    upsertRhizohKnowledgeV0({ question: "boot", answer: "ok" });
    const out = pruneRhizohLocalStorageOnBootV0();
    expect(out.ok).toBe(true);
    expect(out.knowledgeBytes).toBeGreaterThan(0);
  });
});
