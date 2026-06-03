import { useEffect, useState } from "react";
import { deriveScrCollectiveFieldV0 } from "./rhizohScrCitizenVisualProjectionV0.js";
import { RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0 } from "./rhizohSurfaceCitizenshipRuntimeV0.js";

/**
 * SCR collective field — Swarm / cognitive field temporal source (B3).
 */
export function useScrCitizenCollectiveFieldV0() {
  const [field, setField] = useState(() => deriveScrCollectiveFieldV0());

  useEffect(() => {
    const apply = () => setField(deriveScrCollectiveFieldV0());
    apply();
    window.addEventListener(RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0, apply);
    return () => window.removeEventListener(RHIZOH_SURFACE_CITIZENSHIP_EVENT_V0, apply);
  }, []);

  return field;
}
