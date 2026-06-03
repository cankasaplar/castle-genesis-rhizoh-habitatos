/**
 * CORE-ELIGIBLE — Rhizoh canonical entry router (AppRhizoh528).
 *
 * Default (rhizoh.com): `AppRhizoh528T0` — GLOBE + swarm core, mic/text dock, capability wheel, bottom drawers.
 * Opt-in: `VITE_RHIZOH_SPATIAL_SHELL=1` → map-first `RhizohSpatialWorldShell` (spatial research track; not main product).
 */
import React, { Suspense, useEffect } from "react";
import { isRhizohSpatialProductShellEnabled } from "./rhizoh/runtime/castleWorldLayerGateV0.js";
import AppRhizoh528T0 from "./AppRhizoh528T0.jsx";
import AppRhizoh528LivingEntry from "./AppRhizoh528LivingEntry.jsx";
import { ExpressiveRealityTransitionHostV0 } from "./rhizoh/runtime/ExpressiveRealityTransitionHostV0.jsx";
import {
  startProdWorldObservabilityBridgeV0,
  stopProdWorldObservabilityBridgeV0
} from "./rhizoh/runtime/rhizohProdWorldObservabilityBridgeV0.js";

function ProdWorldObservabilityHost({ children }) {
  useEffect(() => {
    startProdWorldObservabilityBridgeV0();
    return () => stopProdWorldObservabilityBridgeV0();
  }, []);
  return children;
}

export default function AppRhizoh528() {
  if (isRhizohSpatialProductShellEnabled()) {
    return (
      <>
        <ExpressiveRealityTransitionHostV0 />
        <AppRhizoh528LivingEntry />
      </>
    );
  }

  return (
    <ProdWorldObservabilityHost>
      <Suspense fallback={<div className="min-h-screen bg-black" data-rhizoh-t0-boot="1" />}>
        <ExpressiveRealityTransitionHostV0 />
        <AppRhizoh528T0 />
      </Suspense>
    </ProdWorldObservabilityHost>
  );
}
