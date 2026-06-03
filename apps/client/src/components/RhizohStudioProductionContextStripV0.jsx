import React from "react";
import { useRhizohStudioProductionOrganismV0 } from "../rhizoh/runtime/useRhizohStudioProductionOrganismV0.js";
import { STUDIO_ORGANISM_UNITY_V0 } from "../rhizoh/runtime/rhizohStudioOrganismSurfaceRolesV0.js";

/**
 * Studio deep binding — compact world-as-production-organism readout (SCR-aligned).
 */
export function RhizohStudioProductionContextStripV0({ surfaceKind = "studio" }) {
  const organism = useRhizohStudioProductionOrganismV0();
  if (!organism) return null;

  const pet = organism.pet_actor;
  const mem = organism.memory_organ;
  const spatial = organism.spatial_truth;

  return (
    <div
      className="rounded-lg border border-cyan-500/20 bg-cyan-950/25 px-3 py-2 text-[9px] font-medium tracking-wide text-cyan-100/90 normal-case"
      data-rhizoh-studio-organism={STUDIO_ORGANISM_UNITY_V0}
      data-rhizoh-studio-panel={surfaceKind}
      data-rhizoh-episode-seq={mem.episode_seq ?? ""}
      data-rhizoh-wal-entry={mem.wal_entry_id ?? ""}
      data-rhizoh-pack-id={mem.pack_id ?? ""}
      data-rhizoh-pet-inhabited={pet.inhabited ? "1" : "0"}
      data-rhizoh-pet-spatial={spatial.cesium_bound ? "cesium" : "projection"}
    >
      <span className="uppercase text-cyan-300/80">World surface</span>
      <span className="mx-1 text-white/25">·</span>
      ep {mem.episode_seq ?? "—"}
      <span className="mx-1 text-white/25">·</span>
      {pet.inhabited ? "pet inhabited" : "pet absent"}
      <span className="mx-1 text-white/25">·</span>
      {spatial.cesium_bound ? "spatial truth (Cesium)" : "spatial projection"}
      <span className="mx-1 text-white/25">·</span>
      {mem.persistence || "memory"}
    </div>
  );
}
