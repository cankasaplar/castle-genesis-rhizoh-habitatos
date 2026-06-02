import { beforeEach, describe, expect, it, afterEach } from "vitest";
import { __resetLanguageViolationsForTestV0 } from "../rhizohLanguageViolationV0.js";
import { guardLlmOutputLanguageV0 } from "../rhizohLlmOutputLanguageGuardV0.js";

describe("rhizohLlmOutputLanguageGuardV0", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rhizoh.user.language.v0", "en");
    }
  });

  afterEach(() => {
    __resetLanguageViolationsForTestV0();
  });

  it("passes through English LLM text", () => {
    const g = guardLlmOutputLanguageV0("How are you today?");
    expect(g.repaired).toBe(false);
    expect(g.text).toContain("How are you");
  });

  it("soft-repair mode keeps Turkish text but records violation", () => {
    const g = guardLlmOutputLanguageV0("Merhaba, nasılsın?");
    expect(g.repaired).toBe(false);
    expect(g.violation?.ok).toBe(false);
  });
});
