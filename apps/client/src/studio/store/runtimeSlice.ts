import type { RuntimeState, StudioShellMode } from "../types/rskOntology";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export function patchRuntime(patch: Partial<RuntimeState>): void {
  const s = getStudioKernelState();
  setStudioKernelState({
    ...s,
    runtime: { ...s.runtime, ...patch }
  });
}

export function setActiveMind(uid: string | undefined): void {
  patchRuntime({ activeMind: uid });
}

export function setSelectedEntity(uid: string | undefined): void {
  patchRuntime({ selectedEntity: uid });
}

export function setCurrentPanel(panel: string): void {
  patchRuntime({ currentPanel: panel });
}

export function setShellMode(mode: StudioShellMode | undefined): void {
  patchRuntime({ shellMode: mode });
}

export function setActiveSoul(uid: string | undefined): void {
  patchRuntime({ activeSoul: uid });
}

export function setActiveBranchId(branchId: string | undefined): void {
  patchRuntime({ activeBranchId: branchId });
}
