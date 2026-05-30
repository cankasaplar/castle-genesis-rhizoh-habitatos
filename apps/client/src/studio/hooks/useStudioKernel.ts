import { useCallback, useRef, useSyncExternalStore } from "react";
import type { StudioKernelState } from "../types/rskOntology";
import { getStudioKernelState, subscribeStudioKernelSelector } from "../store/internalStore";

/**
 * `useSyncExternalStore` compares snapshots with `Object.is` between renders.
 * Selectors that return a fresh array each call (`Object.values`, `filter`, `?? []`)
 * violate that contract and can trigger **React #185** (maximum update depth).
 * Shallow array equality reuses the previous reference when only the container changed.
 */
function looseArraySnapshotEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

export function useStudioKernel<T>(
  selector: (s: StudioKernelState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const sel = useRef(selector);
  sel.current = selector;
  const eq = useRef(isEqual);
  eq.current = isEqual;

  const stableSelector = useCallback((s: StudioKernelState) => sel.current(s), []);

  const mergedEqual = useCallback((a: T, b: T) => {
    return eq.current(a, b) || looseArraySnapshotEqual(a, b);
  }, []);

  const lastSnap = useRef<{ has: boolean; value: T }>({ has: false, value: undefined as T });

  const getSnapshot = useCallback(() => {
    const next = stableSelector(getStudioKernelState());
    const prev = lastSnap.current;
    if (prev.has && mergedEqual(prev.value, next)) {
      return prev.value;
    }
    lastSnap.current = { has: true, value: next };
    return next;
  }, [stableSelector, mergedEqual]);

  const subscribe = useCallback(
    (cb: () => void) =>
      subscribeStudioKernelSelector(
        stableSelector,
        cb,
        (a, b) => mergedEqual(a as T, b as T)
      ),
    [stableSelector, mergedEqual]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
