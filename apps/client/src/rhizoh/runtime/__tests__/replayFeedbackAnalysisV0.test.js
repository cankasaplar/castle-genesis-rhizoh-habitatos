import { describe, expect, it } from "vitest";
import {
  correlateObserverToPhysicsV0,
  detectEpistemicPatternsV0,
  REPLAY_ANALYSIS_MODE_V0,
  runReplayFeedbackAnalysisV0,
  runReplayFeedbackAnalysisFromTraceJsonV0
} from "../replayFeedbackAnalysisV0.js";
import { EPISTEMIC_EVENT_CLASS_V0 } from "../epistemicEventBusV0.js";
import { OBSERVER_ACTION_KIND_V0 } from "../epistemicObserverTelemetryContractV0.js";
import { EPISTEMIC_PHYSICS_EVENT_KIND_V0 } from "../epistemicPhysicsEventContractV0.js";

function obs(seq, atMs, atFrame, action, nodeId = "node:istanbul") {
  return {
    seq,
    atMs,
    atFrame,
    eventClass: EPISTEMIC_EVENT_CLASS_V0.OBSERVER,
    kind: "observer_action",
    nodeId,
    focusNodeId: nodeId,
    severity: 0,
    observerAction: { action, source: "test", witnessWrite: false, feedbackLoop: false }
  };
}

function phy(seq, atMs, atFrame, kind, nodeId = "node:istanbul", severity = 0.7) {
  return {
    seq,
    atMs,
    atFrame,
    eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
    kind,
    nodeId,
    focusNodeId: nodeId,
    severity,
    physicsSnapshot: null
  };
}

describe("replayFeedbackAnalysisV0 (9.4.4b)", () => {
  it("correlates observer action before physics within window", () => {
    const trace = [
      obs(1, 100, 10, OBSERVER_ACTION_KIND_V0.MANIFOLD_NAV),
      phy(2, 250, 11, EPISTEMIC_PHYSICS_EVENT_KIND_V0.DRIFT_SPIKE)
    ];
    const corr = correlateObserverToPhysicsV0(trace);
    expect(corr.length).toBe(1);
    expect(corr[0].observerSeq).toBe(1);
    expect(corr[0].physicsSeq).toBe(2);
    expect(corr[0].deltaMs).toBe(150);
  });

  it("detects manifold_nav_precedes_stress pattern", () => {
    const trace = [
      obs(1, 0, 1, OBSERVER_ACTION_KIND_V0.MANIFOLD_NAV, "node:barcelona"),
      phy(2, 100, 2, EPISTEMIC_PHYSICS_EVENT_KIND_V0.TERRAIN_STRESS_PEAK, "node:barcelona")
    ];
    const corr = correlateObserverToPhysicsV0(trace);
    const patterns = detectEpistemicPatternsV0(trace, corr);
    expect(patterns.some((p) => p.kind === "manifold_nav_precedes_stress")).toBe(true);
  });

  it("runReplayFeedbackAnalysisV0 is replay_only with no feedback flags", () => {
    const report = runReplayFeedbackAnalysisV0([
      obs(1, 0, 1, OBSERVER_ACTION_KIND_V0.CAMERA_KEY),
      phy(2, 50, 2, EPISTEMIC_PHYSICS_EVENT_KIND_V0.DRIFT_SPIKE)
    ]);
    expect(report.mode).toBe(REPLAY_ANALYSIS_MODE_V0);
    expect(report.witnessWrite).toBe(false);
    expect(report.feedbackLoop).toBe(false);
    expect(Object.isFrozen(report)).toBe(true);
    expect(report.summary.correlationCount).toBeGreaterThan(0);
  });

  it("runReplayFeedbackAnalysisFromTraceJsonV0 parses export shape", () => {
    const json = JSON.stringify({
      events: [
        obs(1, 0, 1, OBSERVER_ACTION_KIND_V0.MANIFOLD_NAV),
        phy(2, 200, 3, EPISTEMIC_PHYSICS_EVENT_KIND_V0.COHERENCE_COLLAPSE_ATTEMPT),
        phy(3, 220, 4, EPISTEMIC_PHYSICS_EVENT_KIND_V0.COHERENCE_COLLAPSE_ATTEMPT)
      ]
    });
    const report = runReplayFeedbackAnalysisFromTraceJsonV0(json);
    expect(report.patterns.some((p) => p.kind === "coherence_collapse_burst")).toBe(true);
  });
});
