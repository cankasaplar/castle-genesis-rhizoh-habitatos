import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetFinalLanguageCommitForTestV0,
  alreadyCommittedLanguageV0,
  commitFinalUserVisibleLanguageV0
} from "../rhizohFinalLanguageCommitV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohFinalLanguageCommitV0", () => {
  beforeEach(() => {
    __resetFinalLanguageCommitForTestV0();
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("idempotent commit by traceId prevents double repair", () => {
    const traceId = "TRC-test-1";
    const a = commitFinalUserVisibleLanguageV0("How are you?", {
      traceId,
      idempotencyKey: traceId,
      lockKey: "language_commit_lock"
    });
    const b = commitFinalUserVisibleLanguageV0("Different text??", {
      traceId,
      idempotencyKey: traceId,
      lockKey: "language_commit_lock"
    });
    expect(b.fromCache).toBe(true);
    expect(b.text).toBe(a.text);
    expect(alreadyCommittedLanguageV0(traceId)).toBe(true);
  });

  it("records violation without alternate repair path in soft mode", () => {
    const c = commitFinalUserVisibleLanguageV0("Merhaba, nasılsın?", {
      traceId: "TRC-tr-violation"
    });
    expect(c.guardStep).toBe("soft_repair");
    expect(c.text).toBe("Merhaba, nasılsın?");
    expect(c.repaired).toBe(false);
  });
});
