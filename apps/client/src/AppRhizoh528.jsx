/**
 * CORE-ELIGIBLE — Rhizoh canonical entry router (AppRhizoh528).
 *
 * Product SSOT: single T0 experience shell — docs/RHIZOH_T0_EXPERIENCE_SHELL_V1.md
 * Default (rhizoh.com): `AppRhizoh528T0` — Octo + chat dock + capability wheel + Castle drawers; map optional.
 * Opt-in only: `VITE_RHIZOH_SPATIAL_SHELL=1` → `RhizohSpatialWorldShell` (research; not rhizoh.com default).
 */
import React, { Suspense, useEffect, lazy } from "react";
import { isRhizohSpatialProductShellEnabled } from "./rhizoh/runtime/castleWorldLayerGateV0.js";
import AppRhizoh528T0 from "./AppRhizoh528T0.jsx";
import AppRhizoh528LivingEntry from "./AppRhizoh528LivingEntry.jsx";
import { ExpressiveRealityTransitionHostV0 } from "./rhizoh/runtime/ExpressiveRealityTransitionHostV0.jsx";
import {
  startProdWorldObservabilityBridgeV0,
  stopProdWorldObservabilityBridgeV0
} from "./rhizoh/runtime/rhizohProdWorldObservabilityBridgeV0.js";
import {
  installRhizohControlCenterV0,
  shouldMountRhizohControlCenterV0
} from "./rhizoh/debug/rhizohControlCenterV0.js";

function ProdWorldObservabilityHost({ children }) {
  useEffect(() => {
    startProdWorldObservabilityBridgeV0();
    return () => stopProdWorldObservabilityBridgeV0();
  }, []);
  return children;
}

export default function AppRhizoh528() {
  const spatialShell = isRhizohSpatialProductShellEnabled();
  const mountControlCenterBridge = !spatialShell && shouldMountRhizohControlCenterV0();

  useEffect(() => {
    if (mountControlCenterBridge) installRhizohControlCenterV0();
  }, [mountControlCenterBridge]);

  if (spatialShell) {
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
