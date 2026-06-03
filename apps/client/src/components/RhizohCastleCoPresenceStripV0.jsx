import React from "react";
import { useRhizohStudioProductionOrganismV0 } from "../rhizoh/runtime/useRhizohStudioProductionOrganismV0.js";
import { readMultiInhabitantCoPresenceV0 } from "../rhizoh/runtime/rhizohMultiInhabitantCoPresenceV0.js";
import { readCastleProjectionV0 } from "../rhizoh/runtime/rhizohCastleProjectionLayerV0.js";
import { CASTLE_PROJECTION_UNITY_V0 } from "../rhizoh/runtime/rhizohCastleProjectionLayerV0.js";

/**
 * Castle co-presence readout — pet + agent + user in shared SCR frame (ICL-bound).
 */
export function RhizohCastleCoPresenceStripV0() {
  const organism = useRhizohStudioProductionOrganismV0();
  const coPresence =
    typeof window !== "undefined"
      ? window.__rhizoh?.coPresence || readMultiInhabitantCoPresenceV0()
      : null;
  const castle =
    typeof window !== "undefined"
      ? window.__rhizoh?.castleProjection || readCastleProjectionV0()
      : null;

  if (!coPresence && !castle) return null;

  return (
    <div
      className="rounded-lg border border-violet-500/25 bg-violet-950/20 px-3 py-2 text-[9px] font-medium tracking-wide text-violet-100/90 normal-case"
      data-rhizoh-castle-projection={CASTLE_PROJECTION_UNITY_V0}
      data-rhizoh-castle-node={castle?.castle_node_id || ""}
      data-rhizoh-co-presence-ok={coPresence?.ok ? "1" : "0"}
      data-rhizoh-inhabitant-count={coPresence?.inhabitant_count ?? ""}
      data-rhizoh-pet-present={coPresence?.pet_present ? "1" : "0"}
      data-rhizoh-agent-count={coPresence?.agent_count ?? ""}
    >
      <span className="uppercase text-violet-300/80">Castle surface</span>
      <span className="mx-1 text-white/25">·</span>
      {coPresence?.pet_present ? "pet" : "no pet"}
      <span className="mx-1 text-white/25">·</span>
      agents {coPresence?.agent_count ?? 0}
      <span className="mx-1 text-white/25">·</span>
      {coPresence?.user_present ? "user present" : "user absent"}
      <span className="mx-1 text-white/25">·</span>
      {organism?.world_identity_id ? "same world" : "unbound"}
    </div>
  );
}
