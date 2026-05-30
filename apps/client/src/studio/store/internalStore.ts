import type { StudioKernelState } from "../types/rskOntology";
import { createInitialStudioKernelState } from "./initialState";
import { applyBootRealitySealContinuityToKernelV0 } from "../../rhizoh/runtime/realitySealBootContinuityV0.js";

function bootstrapStudioKernelState(): StudioKernelState {
  return applyBootRealitySealContinuityToKernelV0(createInitialStudioKernelState()).kernel;
}

let state: StudioKernelState = bootstrapStudioKernelState();
const listeners = new Set<() => void>();

export function getStudioKernelState(): StudioKernelState {
  return state;
}

export function setStudioKernelState(next: StudioKernelState): void {
  state = next;
  for (const fn of listeners) {
    try {
      fn();
    } catch (e) {
      console.error("[RSK internalStore listener]", e);
    }
  }
}

/** Full-store subscription (any kernel mutation). */
export function subscribeStudioKernel(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Selector-based subscription — listener fires only when `selector(state)` changes
 * per `isEqual` (default: Object.is).
 */
export function subscribeStudioKernelSelector<T>(
  selector: (s: StudioKernelState) => T,
  listener: () => void,
  isEqual: (a: T, b: T) => boolean = Object.is
): () => void {
  let prev = selector(state);
  const wrapped = () => {
    const next = selector(state);
    if (!isEqual(next, prev)) {
      prev = next;
      listener();
    }
  };
  listeners.add(wrapped);
  return () => listeners.delete(wrapped);
}

export function resetStudioKernelInternal(): void {
  state = createInitialStudioKernelState();
  for (const fn of listeners) {
    try {
      fn();
    } catch (e) {
      console.error("[RSK internalStore reset listener]", e);
    }
  }
}
