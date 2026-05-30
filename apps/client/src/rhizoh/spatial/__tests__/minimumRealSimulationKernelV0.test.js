import { describe, expect, it } from "vitest";
import {
  MINIMUM_REAL_SIMULATION_KERNEL_SCHEMA_V0,
  MINIMUM_REAL_SIMULATION_KERNEL_COMPONENTS_V0,
  MINIMUM_KERNEL_SOMATIC_COUPLE_ORDER_V0,
  buildMinimumRealSimulationKernelSnapshotV0
} from "../minimumRealSimulationKernelV0.js";

describe("minimumRealSimulationKernelV0", () => {
  it("defines exactly five kernel engines", () => {
    expect(MINIMUM_REAL_SIMULATION_KERNEL_COMPONENTS_V0).toHaveLength(5);
    const ids = MINIMUM_REAL_SIMULATION_KERNEL_COMPONENTS_V0.map((c) => c.id);
    expect(ids).toEqual([
      "nav_solver",
      "fsm_graph",
      "look_at_constraint_solver",
      "flocking_rule_set",
      "frame_integrator"
    ]);
  });

  it("exposes somatic coupling inject order aligned with execution layer", () => {
    expect(MINIMUM_KERNEL_SOMATIC_COUPLE_ORDER_V0).toEqual([
      "onNavMeshRuntimeFeed",
      "onFlockSolverStep",
      "onFsmToTransform",
      "onLookAtQuaternionSolve",
      "onFrameIntegratorPost"
    ]);
  });

  it("snapshot bundles schema and components", () => {
    const s = buildMinimumRealSimulationKernelSnapshotV0();
    expect(s.schema).toBe(MINIMUM_REAL_SIMULATION_KERNEL_SCHEMA_V0);
    expect(s.components.length).toBe(5);
    expect(s.somaticCoupleOrder.length).toBe(5);
  });
});
