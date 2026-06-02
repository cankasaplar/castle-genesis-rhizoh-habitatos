import { beforeEach, describe, expect, it, afterEach } from "vitest";
import {
  __resetLanguageViolationsForTestV0,
  checkTextMatchesOutputLanguageV0
} from "../rhizohLanguageViolationV0.js";

describe("rhizohLanguageViolationV0", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rhizoh.user.language.v0", "en");
      localStorage.setItem("rhizoh.ui.locale.picked.v1", "1");
    }
  });

  afterEach(() => {
    __resetLanguageViolationsForTestV0();
  });

  it("flags Turkish instant ack under ui_locked English output", () => {
    const r = checkTextMatchesOutputLanguageV0("Tamam, dinliyorum.", "instant_ack");
    expect(r.ok).toBe(false);
    expect(r.expected).toBe("en");
    expect(r.actual).toBe("tr");
  });

  it("allows English phrase under English policy", () => {
    const r = checkTextMatchesOutputLanguageV0("Got it, listening.", "instant_ack");
    expect(r.ok).toBe(true);
  });
});
