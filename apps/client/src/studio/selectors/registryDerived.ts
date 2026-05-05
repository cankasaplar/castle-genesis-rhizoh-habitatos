import type { Soul, StudioKernelState } from "../types/rskOntology";

export function selectSoulsForOwner(state: StudioKernelState, ownerId: string | null): Soul[] {
  if (!ownerId) return [];
  return Object.values(state.registry.soul).filter((s) => s.ownerId === ownerId);
}

export function selectMindLinksForEntity(state: StudioKernelState, entityId: string): string[] {
  return Object.values(state.registry.link)
    .filter((l) => l.entityId === entityId)
    .map((l) => l.uid);
}

export function selectMindLinksForInstance(state: StudioKernelState, mindInstanceId: string): string[] {
  return Object.values(state.registry.link)
    .filter((l) => l.mindInstanceId === mindInstanceId)
    .map((l) => l.uid);
}
