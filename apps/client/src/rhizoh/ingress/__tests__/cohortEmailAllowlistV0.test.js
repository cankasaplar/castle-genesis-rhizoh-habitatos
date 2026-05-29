import { describe, expect, it } from "vitest";
import {
  getCohortEmailAllowlistV0,
  isCohortEmailAllowlistActiveV0,
  isEmailAllowedOnCohortAllowlistV0,
  parseCohortEmailAllowlistV0
} from "../cohortEmailAllowlistV0.js";

describe("cohortEmailAllowlistV0", () => {
  it("parses comma and semicolon lists with case fold intent", () => {
    expect(parseCohortEmailAllowlistV0(" A@test.com , b@test.com ")).toEqual(["a@test.com", "b@test.com"]);
    expect(parseCohortEmailAllowlistV0("x@y.co;z@y.co")).toEqual(["x@y.co", "z@y.co"]);
  });

  it("getCohortEmailAllowlistV0 reads from passed env object", () => {
    expect(getCohortEmailAllowlistV0({ VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST: "u@x.com" })).toEqual(["u@x.com"]);
  });

  it("isEmailAllowedOnCohortAllowlistV0 uses env override list", () => {
    const env = { VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST: "only@one.org" };
    expect(isEmailAllowedOnCohortAllowlistV0("only@one.org", env)).toBe(true);
    expect(isEmailAllowedOnCohortAllowlistV0("other@one.org", env)).toBe(false);
  });

  it("client allowlist enforcement off when server gate is enabled", () => {
    const env = {
      VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST: "a@b.com",
      VITE_RHIZOH_COHORT_SERVER_GATE: "1"
    };
    expect(isCohortEmailAllowlistActiveV0(env)).toBe(false);
  });

  it("client allowlist enforcement on when list set and server gate off", () => {
    expect(isCohortEmailAllowlistActiveV0({ VITE_RHIZOH_COHORT_EMAIL_ALLOWLIST: "a@b.com" })).toBe(true);
  });
});
