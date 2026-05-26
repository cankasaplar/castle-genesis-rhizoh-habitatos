import { describe, expect, it } from "vitest";
import {
  deriveCausalTerrainMutationV0,
  deriveEpistemicNavigationPhysicsV0,
  emitEpistemicPhysicsEventsV0,
  EPISTEMIC_PHYSICS_EVENT_KIND_V0
} from "../causalTerrainMutationV0.js";

describe("causalTerrainMutationV0 (9.4.2 RESEARCH)", () => {
  it("high stress increases movement cost and lowers moveScale", () => {
    const low = deriveEpistemicNavigationPhysicsV0({
      epistemicSplitBrainScore: 0.1,
      coherenceGradient: 0.9
    });
    const high = deriveEpistemicNavigationPhysicsV0({
      epistemicSplitBrainScore: 0.8,
      coherenceGradient: 0.3
    });
    expect(high.movementCost).toBeGreaterThan(low.movementCost);
    expect(high.moveScale).toBeLessThan(low.moveScale);
    expect(high.pathDistortion).toBeGreaterThan(low.pathDistortion);
  });

  it("emitEpistemicPhysicsEvents on stress peak", () => {
    const physics = deriveEpistemicNavigationPhysicsV0({
      epistemicSplitBrainScore: 0.9,
      coherenceGradient: 0.2
    });
    const events = emitEpistemicPhysicsEventsV0(physics, {
      focusNodeId: "node:barcelona",
      frame: 10,
      stabilizationMode: "parallel_hold"
    });
    expect(events.some((e) => e.kind === EPISTEMIC_PHYSICS_EVENT_KIND_V0.TERRAIN_STRESS_PEAK)).toBe(true);
    expect(events.some((e) => e.kind === EPISTEMIC_PHYSICS_EVENT_KIND_V0.DRIFT_SPIKE)).toBe(true);
  });

  it("deriveCausalTerrainMutation bundles physics + events", () => {
    const m = deriveCausalTerrainMutationV0(
      {
        frame: 5,
        epistemicSplitBrainScore: 0.85,
        coherenceGradient: 0.25,
        focusNodeId: "node:istanbul",
        stabilizationMode: "parallel_hold"
      },
      { visitCount: 4 }
    );
    expect(m.physics.traversable).toBe(true);
    expect(m.events.length).toBeGreaterThan(0);
    expect(m.truthCollapsed).toBe(false);
  });
});
