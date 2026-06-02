import { describe, expect, it, beforeEach } from "vitest";
import { __resetFinalLanguageCommitForTestV0 } from "../rhizohFinalLanguageCommitV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";
import {
  attackHybridMustNotPureLlmV0,
  attackLlmCommandInjectionV0,
  attackMustRouteLocalV0,
  runHybridLeakageAttackSuiteV0
} from "../rhizohHybridLeakageAttackSuiteV0.js";

describe("rhizohHybridLeakageAttackSuiteV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    __resetFinalLanguageCommitForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("local commands never fall through to LLM route", () => {
    expect(attackMustRouteLocalV0("tamam dur").pass).toBe(true);
    expect(attackMustRouteLocalV0("enter ghost mode").pass).toBe(true);
  });

  it("command injection phrases route local", () => {
    expect(attackLlmCommandInjectionV0("mute voice").pass).toBe(true);
  });

  it("hybrid queries avoid pure llm execution label", () => {
    expect(attackHybridMustNotPureLlmV0("what is my current state").pass).toBe(true);
  });

  it("full red-team suite passes default cases", () => {
    const report = runHybridLeakageAttackSuiteV0();
    expect(report.failCount).toBe(0);
    expect(report.passCount).toBe(report.total);
  });
});
