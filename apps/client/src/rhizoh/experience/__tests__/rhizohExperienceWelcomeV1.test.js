import { afterEach, describe, expect, it } from "vitest";
import {
  __resetRhizohWelcomeSeenForTestV1,
  hasSeenRhizohWelcomeV1,
  markRhizohWelcomeSeenV1,
  resolveRhizohFirstWelcomeCopyV1,
  resolveRhizohInviteWelcomeCopyV1
} from "../rhizohExperienceWelcomeV1.js";

describe("rhizohExperienceWelcomeV1", () => {
  afterEach(() => {
    __resetRhizohWelcomeSeenForTestV1();
  });

  it("invite welcome mentions Rhizoh Octo map and Cap Wheel", () => {
    const copy = resolveRhizohInviteWelcomeCopyV1(true);
    expect(copy).toContain("Rhizoh");
    expect(copy).toContain("Octo");
    expect(copy).toMatch(/Cap Wheel|harit/i);
  });

  it("marks welcome seen once in localStorage", () => {
    expect(hasSeenRhizohWelcomeV1()).toBe(false);
    markRhizohWelcomeSeenV1();
    expect(hasSeenRhizohWelcomeV1()).toBe(true);
  });

  it("first welcome is shorter entry without invite framing", () => {
    expect(resolveRhizohFirstWelcomeCopyV1(false)).toContain("I'm Rhizoh");
    expect(resolveRhizohInviteWelcomeCopyV1(false)).toContain("entered an experience");
  });
});
