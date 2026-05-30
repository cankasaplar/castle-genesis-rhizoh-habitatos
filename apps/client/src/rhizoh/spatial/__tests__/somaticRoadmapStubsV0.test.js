import { describe, expect, it } from "vitest";
import { summarizeGhostPetLookAtPipelineV0, LOOK_AT_IMPLEMENTED_PHASE_INDEX_V0 } from "../ghostPetLookAtSolverStubV0.js";
import { summarizeLocomotionFsmGapsV0 } from "../ghostPetLocomotionFsmStubV0.js";
import { summarizeObstacleAwarenessGapsV0 } from "../obstacleAwarenessStubV0.js";
import { summarizeMultiPetEcologyRoadmapV0 } from "../ghostPetMultiPetSocialPhysicsStubV0.js";

describe("somatic roadmap stubs", () => {
  it("look-at pipeline marks yaw-only implemented", () => {
    const s = summarizeGhostPetLookAtPipelineV0();
    expect(s.implementedThroughIndex).toBe(LOOK_AT_IMPLEMENTED_PHASE_INDEX_V0);
    expect(s.deferred).toContain("quaternion_blend");
  });

  it("locomotion FSM summary lists path graph gaps", () => {
    const g = summarizeLocomotionFsmGapsV0("FOLLOW");
    expect(g.intentFromKernel).toBe("FOLLOW");
    expect(g.missing).toContain("transition_graph");
  });

  it("obstacle summary keys off readiness missing list", () => {
    const o = summarizeObstacleAwarenessGapsV0(["world_space_nav_mesh", "collision_resolve_tick"]);
    expect(o.navMeshLinked).toBe(false);
    expect(o.active).toBe(false);
  });

  it("multi-pet ecology defers flocking", () => {
    const m = summarizeMultiPetEcologyRoadmapV0();
    expect(m.deferred).toContain("pet_to_pet_signaling");
  });
});
