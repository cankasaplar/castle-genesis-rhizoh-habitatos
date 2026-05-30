import { describe, expect, it, beforeEach } from "vitest";
import {
  clearSomaticExecutionCouplingHandlersV0,
  tickSomaticExecutionCouplingV0
} from "../lib/somaticExecutionCouplingLayerV0";
import { registerMinimumRealSimulationKernelHandlersV0 } from "../lib/minimumRealSimulationKernelRegistrationV0";
import { createInitialStudioKernelState } from "../store/initialState";

describe("minimumRealSimulationKernelRegistrationV0", () => {
  beforeEach(() => {
    clearSomaticExecutionCouplingHandlersV0();
  });

  it("maps kernel engines to coupling handlers in pipeline order", () => {
    const order: string[] = [];
    registerMinimumRealSimulationKernelHandlersV0({
      navSolverRuntimeBind: () => order.push("nav"),
      flockSolverHook: () => order.push("flock"),
      fsmGraphTick: () => order.push("fsm"),
      lookAtSolverInject: () => order.push("look"),
      integratorFrameOwner: () => order.push("integrate")
    });
    const s = createInitialStudioKernelState();
    tickSomaticExecutionCouplingV0({ dtMs: 16, nowMs: 0, getState: () => s });
    expect(order).toEqual(["nav", "flock", "fsm", "look", "integrate"]);
  });
});
