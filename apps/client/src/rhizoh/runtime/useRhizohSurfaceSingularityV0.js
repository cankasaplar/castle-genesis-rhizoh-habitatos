import { useEffect, useState } from "react";
import {
  readLastSurfaceSingularityV0,
  readSurfaceProjectionV0,
  RHIZOH_SURFACE_SINGULARITY_EVENT_V0
} from "./rhizohSurfaceSingularityLayerV0.js";

/**
 * React hook — SSL surface projection (T0 truth → surface endpoint only).
 * @param {string} [surfaceId]
 */
export function useRhizohSurfaceSingularityV0(surfaceId = null) {
  const [snap, setSnap] = useState(() => readLastSurfaceSingularityV0());

  useEffect(() => {
    const apply = () => setSnap(readLastSurfaceSingularityV0());
    apply();
    const onEvent = () => apply();
    window.addEventListener(RHIZOH_SURFACE_SINGULARITY_EVENT_V0, onEvent);
    return () => window.removeEventListener(RHIZOH_SURFACE_SINGULARITY_EVENT_V0, onEvent);
  }, []);

  if (surfaceId) {
    return readSurfaceProjectionV0(surfaceId) || snap?.surfaces?.[surfaceId] || null;
  }
  return snap;
}
