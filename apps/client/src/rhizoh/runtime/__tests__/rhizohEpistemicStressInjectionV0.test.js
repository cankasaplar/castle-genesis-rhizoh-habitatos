import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  __resetEpistemicStressInjectionForTestV0,
  buildEpistemicConflictGraphV0,
  EPISTEMIC_STRESS_GOVERNANCE_V0,
  EPISTEMIC_STRESS_PROFILE_V0,
  injectEpistemicStressV0
} from "../rhizohEpistemicStressInjectionV0.js";
import { __resetShadowTraceLedgerForTestV0 } from "../rhizohShadowTraceLedgerV0.js";
import { __resetEpistemicCouncilForTestV0 } from "../rhizohEpistemicCouncilV0.js";

describe("rhizohEpistemicStressInjectionV0", () => {
  beforeEach(() => {
    __resetShadowTraceLedgerForTestV0();
    __resetEpistemicStressInjectionForTestV0();
    __resetEpistemicCouncilForTestV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: true }, chessGameCluster: { running: true } };
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          anomalyScore: 0.62,
          synthesis: "test",
          reasoningChain: [{ step: "COLLECT" }],
          lenses: []
        })
      }))
    );
  });

  it("rejects injection when shadow mode inactive", async () => {
    if (typeof window !== "undefined") {
      window.__rhizoh = { shadowMode: { force: false }, chessGameCluster: { running: false } };
    }
    const out = await injectEpistemicStressV0({ profile: "light" });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("shadow_mode_inactive");
  });

  it("injects light profile with conflict graph and council trigger", async () => {
    const out = await injectEpistemicStressV0({
      profile: EPISTEMIC_STRESS_PROFILE_V0.LIGHT,
      matchId: "cluster_0_stress_test"
    });
    expect(out.ok).toBe(true);
    expect(out.stressRunId).toMatch(/^stress_/);
    expect(out.recordCount).toBeGreaterThanOrEqual(3);
    expect(out.conflictGraph.lensCount).toBe(2);
    expect(out.councilObservation?.sessionId).toBeTruthy();
    expect(out.governance.feedsDriftDetection).toBe(false);
  });

  it("injects adversarial profile with timeout and adversarial stream row", async () => {
    const out = await injectEpistemicStressV0({
      profile: EPISTEMIC_STRESS_PROFILE_V0.ADVERSARIAL,
      matchId: "cluster_0_adv"
    });
    expect(out.ok).toBe(true);
    expect(out.recordCount).toBeGreaterThanOrEqual(5);
    expect(out.conflictGraph.lensCount).toBe(4);
    expect(out.records.some((r) => r.eventType === "STOCKFISH_TIMEOUT")).toBe(true);
    expect(out.records.some((r) => r.trustClass === "adversarial")).toBe(true);
  });

  it("throttles rapid stress repetition unless forced", async () => {
    const first = await injectEpistemicStressV0({ profile: "light" });
    expect(first.ok).toBe(true);
    const second = await injectEpistemicStressV0({ profile: "light" });
    expect(second.ok).toBe(false);
    expect(second.reason).toBe("stress_repetition_throttled");
    const forced = await injectEpistemicStressV0({ profile: "light", force: true });
    expect(forced.ok).toBe(true);
  });

  it("builds conflict graph with stance divergence edges", () => {
    const graph = buildEpistemicConflictGraphV0({
      profile: "medium",
      evalVariance: 0.6,
      lensCount: 3
    });
    expect(graph.nodes.length).toBe(3);
    expect(graph.maxDisagreement).toBeGreaterThan(0);
    expect(EPISTEMIC_STRESS_GOVERNANCE_V0.executionEffect).toBe(false);
  });
});
