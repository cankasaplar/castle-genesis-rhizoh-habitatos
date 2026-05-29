import { describe, expect, it, beforeEach } from "vitest";
import {
  buildEpistemicEventEnvelopeV0,
  clearEpistemicEventBusV0,
  EPISTEMIC_EVENT_CLASS_V0,
  exportEpistemicEventTraceJsonV0,
  getEpistemicEventTraceV0,
  publishEpistemicPhysicsEventV0,
  publishEpistemicPhysicsEventsBatchV0,
  publishObserverActionEnvelopeV0,
  resetEpistemicEventBusForTestsV0,
  setEpistemicEventBusEnabledV0,
  subscribeEpistemicEventBusV0
} from "../epistemicEventBusV0.js";
import { OBSERVER_ACTION_KIND_V0 } from "../epistemicObserverTelemetryContractV0.js";
import { EPISTEMIC_PHYSICS_EVENT_KIND_V0 as KIND } from "../continuity/__research__/causalTerrainMutationV0.js";

describe("epistemicEventBusV0 (9.4.3)", () => {
  beforeEach(() => {
    resetEpistemicEventBusForTestsV0();
  });

  it("does not publish when bus disabled", () => {
    const env = publishEpistemicPhysicsEventV0({
      kind: KIND.DRIFT_SPIKE,
      nodeId: "node:barcelona",
      severity: 0.6,
      atFrame: 1,
      statement: "test"
    });
    expect(env).toBeNull();
    expect(getEpistemicEventTraceV0()).toHaveLength(0);
  });

  it("publishes frozen envelopes and notifies subscribers", () => {
    setEpistemicEventBusEnabledV0(true);
    const received = [];
    const unsub = subscribeEpistemicEventBusV0((e) => received.push(e));

    const env = publishEpistemicPhysicsEventV0(
      {
        kind: KIND.TERRAIN_STRESS_PEAK,
        nodeId: "node:istanbul",
        severity: 0.8,
        atFrame: 10,
        statement: "Terrain stress peak"
      },
      { stabilizationMode: "parallel_hold" }
    );

    expect(env).not.toBeNull();
    expect(env?.plane).toBe("observation");
    expect(env?.readOnly).toBe(true);
    expect(env?.truthCollapsed).toBe(false);
    expect(Object.isFrozen(env)).toBe(true);
    expect(received).toHaveLength(1);
    expect(getEpistemicEventTraceV0()).toHaveLength(1);

    unsub();
    clearEpistemicEventBusV0();
  });

  it("dedupes same kind+node within frame window", () => {
    setEpistemicEventBusEnabledV0(true);
    publishEpistemicPhysicsEventV0({
      kind: KIND.DRIFT_SPIKE,
      nodeId: "node:barcelona",
      severity: 0.5,
      atFrame: 5,
      statement: "a"
    });
    publishEpistemicPhysicsEventV0({
      kind: KIND.DRIFT_SPIKE,
      nodeId: "node:barcelona",
      severity: 0.9,
      atFrame: 5,
      statement: "b"
    });
    expect(getEpistemicEventTraceV0()).toHaveLength(1);
  });

  it("batch publish and export trace json", () => {
    setEpistemicEventBusEnabledV0(true);
    const published = publishEpistemicPhysicsEventsBatchV0(
      [
        {
          kind: KIND.COHERENCE_COLLAPSE_ATTEMPT,
          nodeId: "node:istanbul",
          severity: 0.7,
          atFrame: 20,
          statement: "collapse attempt"
        },
        {
          kind: KIND.DISAGREEMENT_SURGE,
          nodeId: "node:istanbul",
          severity: 0.4,
          atFrame: 21,
          statement: "surge"
        }
      ],
      { atFrame: 21 }
    );
    expect(published.length).toBe(2);
    const json = exportEpistemicEventTraceJsonV0();
    expect(json).toContain("epistemic_perceptual_causality");
    expect(json).toContain("coherence_collapse_attempt");
  });

  it("buildEpistemicEventEnvelopeV0 assigns monotonic seq", () => {
    const a = buildEpistemicEventEnvelopeV0({
      kind: KIND.DRIFT_SPIKE,
      nodeId: "n",
      severity: 0.1,
      atFrame: 0,
      statement: "x"
    });
    const b = buildEpistemicEventEnvelopeV0({
      kind: KIND.DRIFT_SPIKE,
      nodeId: "n",
      severity: 0.2,
      atFrame: 1,
      statement: "y"
    });
    expect(b.seq).toBeGreaterThan(a.seq);
  });

  it("publishObserverActionEnvelopeV0 is read-only observer class", () => {
    setEpistemicEventBusEnabledV0(true);
    const env = publishObserverActionEnvelopeV0({
      action: OBSERVER_ACTION_KIND_V0.MANIFOLD_NAV,
      source: "test",
      targetNodeId: "node:istanbul",
      atFrame: 3
    });
    expect(env?.eventClass).toBe(EPISTEMIC_EVENT_CLASS_V0.OBSERVER);
    expect(env?.feedbackLoop).toBe(false);
    expect(env?.observerAction?.witnessWrite).toBe(false);
  });
});
