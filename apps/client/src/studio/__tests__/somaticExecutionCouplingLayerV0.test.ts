import { describe, expect, it, beforeEach } from "vitest";
import {
  clearSomaticExecutionCouplingHandlersV0,
  getSomaticExecutionCouplingTickStatsV0,
  registerSomaticExecutionCouplingHandlersV0,
  tickSomaticExecutionCouplingV0
} from "../lib/somaticExecutionCouplingLayerV0";
import { createInitialStudioKernelState } from "../store/initialState";

describe("somaticExecutionCouplingLayerV0", () => {
  beforeEach(() => {
    clearSomaticExecutionCouplingHandlersV0();
  });

  it("runs handlers in nav → flock → fsm → look-at → integrator post order", () => {
    const order: string[] = [];
    registerSomaticExecutionCouplingHandlersV0({
      onLookAtQuaternionSolve: () => order.push("look"),
      onFsmToTransform: () => order.push("fsm"),
      onFlockSolverStep: () => order.push("flock"),
      onNavMeshRuntimeFeed: () => order.push("nav"),
      onFrameIntegratorPost: () => order.push("integrate")
    });
    const s = createInitialStudioKernelState();
    tickSomaticExecutionCouplingV0({ dtMs: 16, nowMs: 1, getState: () => s });
    expect(order).toEqual(["nav", "flock", "fsm", "look", "integrate"]);
    const stats = getSomaticExecutionCouplingTickStatsV0();
    expect(stats.frameCount).toBe(1);
    expect(stats.lastDtMs).toBe(16);
  });

  it("skips integrator post when handler omitted", () => {
    const order: string[] = [];
    registerSomaticExecutionCouplingHandlersV0({
      onLookAtQuaternionSolve: () => order.push("look"),
      onFsmToTransform: () => order.push("fsm"),
      onFlockSolverStep: () => order.push("flock"),
      onNavMeshRuntimeFeed: () => order.push("nav")
    });
    const s = createInitialStudioKernelState();
    tickSomaticExecutionCouplingV0({ dtMs: 8, nowMs: 2, getState: () => s });
    expect(order).toEqual(["nav", "flock", "fsm", "look"]);
  });
});
