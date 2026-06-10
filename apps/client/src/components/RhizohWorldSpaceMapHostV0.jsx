import React, { memo } from "react";
import CesiumRealMapLayer from "../castleFlight/CesiumRealMapLayer.jsx";

/**
 * World · Space map substrate — Cesium mounts only on /world/space, never on T0 live (/).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */
export const RhizohWorldSpaceMapHostV0 = memo(function RhizohWorldSpaceMapHostV0({ active }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[11]"
      data-rhizoh-world-space-map-host="1"
      data-rhizoh-world-space-map-active={active ? "1" : "0"}
    >
      <CesiumRealMapLayer active={active} />
    </div>
  );
});
