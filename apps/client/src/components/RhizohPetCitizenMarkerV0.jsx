import React, { useEffect, useState } from "react";
import { useSurfaceCitizenProjectionV0 } from "../rhizoh/runtime/useSurfaceCitizenProjectionV0.js";
import { SSL_SURFACE_ID_V0 } from "../rhizoh/runtime/rhizohSurfaceSingularityLayerV0.js";
import { readPetCitizenV0, RHIZOH_PET_CITIZEN_EVENT_V0 } from "../rhizoh/runtime/rhizohPetCitizenRuntimeV0.js";
import { RHIZOH_PET_SPATIAL_BINDING_EVENT_V0 } from "../rhizoh/spatial/rhizohPetCesiumSpatialBindingV0.js";

/**
 * Minimal pet marker — SCR citizen, position from RCAL (non-authoring).
 */
export function RhizohPetCitizenMarkerV0({ className = "" }) {
  const petProjection = useSurfaceCitizenProjectionV0(SSL_SURFACE_ID_V0.PET);
  const [citizen, setCitizen] = useState(() => readPetCitizenV0());
  const [spatialBound, setSpatialBound] = useState(
    () => typeof window !== "undefined" && window.__rhizoh?.petSpatialBinding?.cesium_bound === true
  );

  useEffect(() => {
    const apply = () => {
      setCitizen(readPetCitizenV0());
      setSpatialBound(window.__rhizoh?.petSpatialBinding?.cesium_bound === true);
    };
    apply();
    window.addEventListener(RHIZOH_PET_CITIZEN_EVENT_V0, apply);
    window.addEventListener(RHIZOH_PET_SPATIAL_BINDING_EVENT_V0, apply);
    return () => {
      window.removeEventListener(RHIZOH_PET_CITIZEN_EVENT_V0, apply);
      window.removeEventListener(RHIZOH_PET_SPATIAL_BINDING_EVENT_V0, apply);
    };
  }, []);

  if (spatialBound) return null;
  if (!citizen?.inhabited || !citizen.position) return null;

  const leftPct = 50 + citizen.position.x * 18;
  const topPct = 42 - citizen.position.y * 14;

  return (
    <div
      className={`pointer-events-none absolute z-[6] ${className}`}
      data-rhizoh-scr-surface={SSL_SURFACE_ID_V0.PET}
      data-rhizoh-pet-inhabited="1"
      data-rhizoh-coherence-id={citizen.coherence_id || petProjection?.coherence_id || ""}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: `translate(-50%, -50%) scale(${0.85 + (citizen.breathe01 || 0) * 0.2})`,
        transition: "transform 2.8s ease-in-out"
      }}
      aria-hidden
    >
      <div className="h-3 w-3 rounded-full bg-cyan-300/90 shadow-[0_0_12px_rgba(34,211,238,0.65)]" />
    </div>
  );
}
