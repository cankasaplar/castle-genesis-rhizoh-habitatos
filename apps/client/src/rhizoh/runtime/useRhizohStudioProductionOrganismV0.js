import { useEffect, useState } from "react";
import {
  buildStudioProductionOrganismV0,
  RHIZOH_STUDIO_PRODUCTION_ORGANISM_EVENT_V0
} from "./rhizohStudioProductionOrganismV0.js";
import { RHIZOH_STUDIO_EXECUTION_LOOP_EVENT_V0 } from "./rhizohStudioExecutionLoopV0.js";
import { RHIZOH_PET_CITIZEN_EVENT_V0 } from "./rhizohPetCitizenRuntimeV0.js";
import { RHIZOH_PET_SPATIAL_BINDING_EVENT_V0 } from "../spatial/rhizohPetCesiumSpatialBindingV0.js";

/**
 * React hook — studio production organism SSOT (deep binding).
 */
export function useRhizohStudioProductionOrganismV0() {
  const [organism, setOrganism] = useState(() => buildStudioProductionOrganismV0());

  useEffect(() => {
    const refresh = () => setOrganism(buildStudioProductionOrganismV0());
    const events = [
      RHIZOH_STUDIO_PRODUCTION_ORGANISM_EVENT_V0,
      RHIZOH_STUDIO_EXECUTION_LOOP_EVENT_V0,
      RHIZOH_PET_CITIZEN_EVENT_V0,
      RHIZOH_PET_SPATIAL_BINDING_EVENT_V0
    ];
    for (const name of events) {
      window.addEventListener(name, refresh);
    }
    refresh();
    return () => {
      for (const name of events) {
        window.removeEventListener(name, refresh);
      }
    };
  }, []);

  return organism;
}
