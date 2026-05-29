import { describe, expect, it } from "vitest";
import { EPISTEMIC_EVENT_CLASS_V0 } from "../../epistemicEventBusV0.js";
import {
  analyzeCrossNodeCausalResonanceV0,
  correlateEventsAcrossNodesV0
} from "../crossNodeCausalResonanceV0.js";

describe("crossNodeCausalResonanceV0 (phase 20)", () => {
  it("correlates physics events across kadikoy and barcelona within window", () => {
    const trace = [
      {
        seq: 1,
        atMs: 100,
        atFrame: 1,
        eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
        kind: "epistemic_drift_spike",
        nodeId: "node:kadikoy_satellite",
        focusNodeId: "node:kadikoy_satellite",
        severity: 0.6
      },
      {
        seq: 2,
        atMs: 400,
        atFrame: 2,
        eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
        kind: "terrain_stress_peak",
        nodeId: "node:barcelona_satellite",
        focusNodeId: "node:barcelona_satellite",
        severity: 0.7
      }
    ];
    const pairs = correlateEventsAcrossNodesV0(trace);
    const med = pairs.find((p) => p.patternKind === "mediterranean_interference");
    expect(med).toBeDefined();
    expect(med?.correlatedEventCount).toBeGreaterThan(0);
    expect(med?.executive).toBeUndefined();
  });

  it("analyzeCrossNodeCausalResonanceV0 is read-only report", () => {
    const report = analyzeCrossNodeCausalResonanceV0([]);
    expect(report.executive).toBe(false);
    expect(report.witnessWrite).toBe(false);
    expect(report.executionWrite).toBe(false);
    expect(Object.isFrozen(report)).toBe(true);
  });
});
