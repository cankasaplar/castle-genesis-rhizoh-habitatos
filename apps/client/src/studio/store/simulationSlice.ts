import type { SimulationDiff, SimulationState } from "../types/rskOntology";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export function patchSimulation(patch: Partial<SimulationState>): void {
  const s = getStudioKernelState();
  setStudioKernelState({
    ...s,
    simulation: { ...s.simulation, ...patch }
  });
}

export function setSimulationDiff(diff: SimulationDiff | undefined): void {
  patchSimulation({ diff });
}
