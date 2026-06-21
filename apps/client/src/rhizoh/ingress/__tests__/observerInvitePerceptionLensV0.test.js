import { describe, expect, it } from "vitest";
import {
  getInviteExpectationFramingV0,
  INVITE_PERCEPTION_MODE_V0,
  resolveInvitePerceptionLensV0
} from "../observerInvitePerceptionLensV0.js";

describe("observerInvitePerceptionLensV0", () => {
  it("maps investor role to signal mode", () => {
    const lens = resolveInvitePerceptionLensV0("investor", "en");
    expect(lens.mode).toBe(INVITE_PERCEPTION_MODE_V0.SIGNAL);
    expect(lens.panels.showInfrastructureSummary).toBe(true);
    expect(lens.panels.showCausalTimeline).toBe(false);
  });

  it("maps reviewer role to research mode with full panels", () => {
    const lens = resolveInvitePerceptionLensV0("reviewer", "en");
    expect(lens.mode).toBe(INVITE_PERCEPTION_MODE_V0.RESEARCH);
    expect(lens.panels.showEpistemicSubject).toBe(true);
    expect(lens.panels.showCausalTimeline).toBe(true);
  });

  it("maps observer role to explorer mode without technical panels", () => {
    const lens = resolveInvitePerceptionLensV0("observer", "tr");
    expect(lens.mode).toBe(INVITE_PERCEPTION_MODE_V0.EXPLORER);
    expect(lens.panels.showEpistemicSubject).toBe(false);
    expect(lens.copy.activities.length).toBeGreaterThan(0);
  });

  it("includes expectation framing string", () => {
    const framing = getInviteExpectationFramingV0("investor", "en");
    expect(framing.toLowerCase()).toContain("not a startup demo");
  });
});
