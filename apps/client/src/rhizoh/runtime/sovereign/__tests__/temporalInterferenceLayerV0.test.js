import { describe, expect, it } from "vitest";
import { EPISTEMIC_EVENT_CLASS_V0 } from "../../epistemicEventBusV0.js";
import {
  buildTemporalInterferenceLayersV0,
  computeTemporalCrossNodeInterferenceV0
} from "../temporalInterferenceLayerV0.js";
import {
  applyTemporalInterferenceToPairsV0,
  correlateEventsAcrossNodesV0
} from "../crossNodeCausalResonanceV0.js";

describe("temporalInterferenceLayerV0 (20b)", () => {
  it("builds history pattern per node across frames", () => {
    const trace = [
      {
        seq: 1,
        atMs: 0,
        atFrame: 0,
        eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
        kind: "a",
        nodeId: "node:barcelona_satellite",
        severity: 0.5
      },
      {
        seq: 2,
        atMs: 100,
        atFrame: 10,
        eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
        kind: "b",
        nodeId: "node:barcelona_satellite",
        severity: 0.6
      }
    ];
    const layers = buildTemporalInterferenceLayersV0(trace);
    const bcn = layers.find((l) => l.nodeId === "node:barcelona_satellite");
    expect(bcn?.isHistoryNotSnapshot).toBe(true);
    expect(bcn?.historyPattern.length).toBeGreaterThan(0);
    expect(bcn?.tickSpan).toBe(10);
  });

  it("applyTemporalInterferenceToPairs boosts score from history overlap", () => {
    const trace = [
      {
        seq: 1,
        atMs: 0,
        atFrame: 0,
        eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
        kind: "a",
        nodeId: "node:kadikoy_satellite",
        severity: 0.4
      },
      {
        seq: 2,
        atMs: 50,
        atFrame: 0,
        eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
        kind: "b",
        nodeId: "node:barcelona_satellite",
        severity: 0.5
      },
      {
        seq: 3,
        atMs: 200,
        atFrame: 10,
        eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS,
        kind: "c",
        nodeId: "node:barcelona_satellite",
        severity: 0.7
      }
    ];
    const layers = buildTemporalInterferenceLayersV0(trace);
    const pairs = applyTemporalInterferenceToPairsV0(
      correlateEventsAcrossNodesV0(trace),
      layers
    );
    expect(pairs[0].temporalInterferenceScore).toBeGreaterThan(0);
  });
});
