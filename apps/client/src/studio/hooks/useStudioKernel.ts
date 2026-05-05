import { useCallback, useRef, useSyncExternalStore } from "react";
import type { StudioKernelState } from "../types/rskOntology";
import { getStudioKernelState, subscribeStudioKernelSelector } from "../store/internalStore";

export function useStudioKernel<T>(
  selector: (s: StudioKernelState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const sel = useRef(selector);
  sel.current = selector;
  const eq = useRef(isEqual);
  eq.current = isEqual;

  const stableSelector = useCallback((s: StudioKernelState) => sel.current(s), []);

  const getSnapshot = useCallback(() => stableSelector(getStudioKernelState()), [stableSelector]);

  const subscribe = useCallback(
    (cb: () => void) =>
      subscribeStudioKernelSelector(
        stableSelector,
        cb,
        (a, b) => eq.current(a as T, b as T)
      ),
    [stableSelector]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
