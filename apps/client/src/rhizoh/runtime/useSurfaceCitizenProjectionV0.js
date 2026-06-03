import { useEffect, useState } from "react";
import {
  readCitizenProjectionV0,
  readLastSurfaceCitizenshipV0,
  RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0
} from "./rhizohSurfaceCitizenshipRuntimeV0.js";

/**
 * React hook — SCR citizen projection (reverse ownership: T0 only).
 * @param {string} surfaceId
 */
export function useSurfaceCitizenProjectionV0(surfaceId) {
  const [citizenship, setCitizenship] = useState(() => readLastSurfaceCitizenshipV0());

  useEffect(() => {
    const apply = () => setCitizenship(readLastSurfaceCitizenshipV0());
    apply();
    window.addEventListener(RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0, apply);
    return () => window.removeEventListener(RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0, apply);
  }, []);

  return readCitizenProjectionV0(surfaceId) || citizenship?.citizens?.[surfaceId]?.projection || null;
}
