import { describe, expect, it, beforeEach } from "vitest";
import {
  FCL_BINDING_SENTENCE_V0,
  FCL_ENTRY_FIRST_V0,
  FCL_ENTRY_RETURN_V0,
  generateSinceLastVisitV0,
  recordFlowContinuityStepV0,
  resolveEntryContinuityV0,
  resolveFlowContinuityV0,
  resolveFlowDriftV0,
  RHIZOH_PRODUCT_BINDING_V0,
  snapshotLastVisitV0
} from "../rhizohFlowContinuityV0.js";
import { ARL_PHASE_SILENCE_V0 } from "../rhizohAttentionRhythmV0.js";

describe("rhizohFlowContinuityV0", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("exposes product and FCL bindings", () => {
    expect(RHIZOH_PRODUCT_BINDING_V0).toContain("continuity-first");
    expect(FCL_BINDING_SENTENCE_V0).toContain("where play began");
  });

  it("resolves first entry when no prior visit", () => {
    const e = resolveEntryContinuityV0({ localeTr: true });
    expect(e.entry_mode).toBe(FCL_ENTRY_FIRST_V0);
    expect(e.orientation_line).toContain("Buradasın");
  });

  it("resolves return entry from last visit snapshot", () => {
    snapshotLastVisitV0("world", "explore");
    const e = resolveEntryContinuityV0({ activeSurface: "studio", userIntent: "produce", localeTr: true });
    expect(e.entry_mode).toBe(FCL_ENTRY_RETURN_V0);
  });

  it("generates since-last-visit line when surface changed", () => {
    snapshotLastVisitV0("world", "explore");
    const s = generateSinceLastVisitV0({
      activeSurface: "studio",
      userIntent: "produce",
      localeTr: true
    });
    expect(s.has_prior_visit).toBe(true);
    expect(s.since_last_visit_line).toContain("Son ziyaret");
  });

  it("tracks drift and return when diverged", () => {
    recordFlowContinuityStepV0({
      activeSurface: "world",
      userIntent: "explore",
      forceOrigin: true
    });
    recordFlowContinuityStepV0({ activeSurface: "studio", userIntent: "produce" });
    const f = resolveFlowContinuityV0({
      activeSurface: "studio",
      rhythmPhase: ARL_PHASE_SILENCE_V0,
      localeTr: true
    });
    expect(f.diverged_from_origin).toBe(true);
    expect(f.can_return).toBe(true);
    expect(f.return_state.continued_not_reset).toBe(true);
  });

  it("resolveFlowDrift detects intent shift", () => {
    recordFlowContinuityStepV0({
      activeSurface: "world",
      userIntent: "explore",
      forceOrigin: true
    });
    recordFlowContinuityStepV0({ activeSurface: "studio", userIntent: "produce" });
    sessionStorage.setItem(
      "rhizoh.flow.continuity.v0",
      JSON.stringify({
        ...JSON.parse(sessionStorage.getItem("rhizoh.flow.continuity.v0") || "{}"),
        last_stated_intent: "explore",
        last_stated_surface: "world"
      })
    );
    const d = resolveFlowDriftV0({ activeSurface: "studio", userIntent: "produce", localeTr: true });
    expect(d.has_drift).toBe(true);
    expect(d.drift_line).toContain("Kayma");
  });
});
