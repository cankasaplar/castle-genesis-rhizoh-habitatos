import React from "react";
import { SSL_SURFACE_ID_V0 } from "../rhizoh/runtime/rhizohSurfaceSingularityLayerV0.js";
import { useSurfaceCitizenProjectionV0 } from "../rhizoh/runtime/useSurfaceCitizenProjectionV0.js";
import { readStudioCitizenProjectionV0 } from "../rhizoh/runtime/rhizohScrCitizenVisualProjectionV0.js";
import { useRhizohStudioProductionOrganismV0 } from "../rhizoh/runtime/useRhizohStudioProductionOrganismV0.js";
import { STUDIO_ORGANISM_SURFACE_ROLE_V0 } from "../rhizoh/runtime/rhizohStudioOrganismSurfaceRolesV0.js";
import { RhizohStudioProductionContextStripV0 } from "./RhizohStudioProductionContextStripV0.jsx";
import { RhizohCastleCoPresenceStripV0 } from "./RhizohCastleCoPresenceStripV0.jsx";

/**
 * Studio panels — SCR citizen shell (world editor frame, not isolated runtime).
 */
export function RhizohStudioCitizenShellV0({ children, surfaceKind = "studio" }) {
  const studioProjection = useSurfaceCitizenProjectionV0(SSL_SURFACE_ID_V0.STUDIO);
  const panelProjection = readStudioCitizenProjectionV0();
  const organism = useRhizohStudioProductionOrganismV0();
  const episode =
    typeof window !== "undefined" ? window.__rhizoh?.worldEpisode : null;
  const mem = organism?.memory_organ;

  return (
    <div
      className="space-y-3"
      data-rhizoh-scr-surface={SSL_SURFACE_ID_V0.STUDIO}
      data-rhizoh-studio-panel={surfaceKind}
      data-rhizoh-studio-organ-role={STUDIO_ORGANISM_SURFACE_ROLE_V0.STUDIO_PANEL}
      data-rhizoh-coherence-id={
        organism?.coherence_id ||
        studioProjection?.coherence_id ||
        panelProjection?.coherence_id ||
        ""
      }
      data-rhizoh-episode-seq={mem?.episode_seq ?? episode?.current_seq ?? ""}
      data-rhizoh-wal-entry={mem?.wal_entry_id ?? episode?.wal_entry_id ?? ""}
      data-rhizoh-pack-id={mem?.pack_id ?? ""}
    >
      <RhizohStudioProductionContextStripV0 surfaceKind={surfaceKind} />
      <RhizohCastleCoPresenceStripV0 />
      {children}
    </div>
  );
}
