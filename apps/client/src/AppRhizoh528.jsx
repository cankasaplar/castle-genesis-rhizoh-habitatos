/**
 * CORE-ELIGIBLE — Rhizoh canonical entry router (AppRhizoh528).
 *
 * Default (rhizoh.com): T0 full Castle shell — Three.js globe / swarm, agent HUD, product bar.
 * Opt-in: `VITE_RHIZOH_SPATIAL_SHELL=1` → map-first `RhizohSpatialWorldShell` (spatial-main track).
 */
import React, { Suspense } from "react";
import { isRhizohSpatialProductShellEnabled } from "./rhizoh/runtime/castleWorldLayerGateV0.js";
import AppRhizoh528T0 from "./AppRhizoh528T0.jsx";
import AppRhizoh528LivingEntry from "./AppRhizoh528LivingEntry.jsx";

export default function AppRhizoh528() {
  if (isRhizohSpatialProductShellEnabled()) {
    return <AppRhizoh528LivingEntry />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" data-rhizoh-t0-boot="1" />}>
      <AppRhizoh528T0 />
    </Suspense>
  );
}
