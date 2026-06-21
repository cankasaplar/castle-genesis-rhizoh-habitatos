import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppRhizoh528 from "../AppRhizoh528.jsx";
import GenesisPortalPage from "../genesis/GenesisPortalPage.jsx";
import GenesisObservabilityHubPage from "../genesis/GenesisObservabilityHubPage.jsx";
import GenesisAcademyPage from "../genesis/GenesisAcademyPage.jsx";
import AcademicObservatoryPageV0 from "../surface/AcademicObservatoryPageV0.jsx";
import { PhysicalCognitionEngineExampleV0 } from "../rhizoh/experience/examples/PhysicalCognitionEngineExampleV0.jsx";
import { TemporalSemanticEngineExampleV0 } from "../rhizoh/experience/examples/TemporalSemanticEngineExampleV0.jsx";
import { RhizohThinkingEngineExampleV0 } from "../rhizoh/experience/examples/RhizohThinkingEngineExampleV0.jsx";
import { StudioLiveRoomV1 } from "../studio/StudioLiveRoomV1.jsx";
import { FoxConversationLabPageV1 } from "../studio/FoxConversationLabPageV1.jsx";
import { RhizohObserverInviteLandingPageV0 } from "../components/RhizohObserverInviteLandingPageV0.jsx";
import { RhizohInviteSearchRedirectV0 } from "../components/RhizohInviteSearchRedirectV0.jsx";

const AppRhizohWorldSpaceV0 = lazy(() => import("../AppRhizohWorldSpaceV0.jsx"));

function WorldSpaceBootFallback() {
  return <div className="min-h-screen bg-[#010103]" data-rhizoh-world-space-boot="1" />;
}

const worldSpaceRouteV0 = (
  <Suspense fallback={<WorldSpaceBootFallback />}>
    <AppRhizohWorldSpaceV0 />
  </Suspense>
);

/**
 * Product rule: single continuous world — `/` always mounts AppRhizoh528 → AppRhizoh528T0.
 * @see docs/RHIZOH_T0_EXPERIENCE_SHELL_V1.md
 * Secondary: /dev/octo-lab · env-gated /studio-live · genesis/academy hubs (not main product).
 */
const STUDIO_LIVE_ROUTE_ENABLED_V0 =
  String(import.meta.env.VITE_ENABLE_STUDIO_LIVE_ROUTE ?? "").trim() === "1";

/**
 * SPA shell — Genesis hub `/genesis/hub` and product alias `/academy/observe`; legacy portal `/genesis/portal`. Rhizoh: `AppRhizoh528` syncs `useLocation()`.
 */
export function CastleShellRouter() {
  return (
    <BrowserRouter>
      <RhizohInviteSearchRedirectV0 />
      <Routes>
        <Route path="/invite" element={<RhizohObserverInviteLandingPageV0 />} />
        <Route path="/world" element={<Navigate to="/world/space" replace />} />
        <Route path="/world/space" element={worldSpaceRouteV0} />
        <Route path="/world/social" element={worldSpaceRouteV0} />
        <Route path="/world/modes" element={worldSpaceRouteV0} />
        <Route path="/" element={<AppRhizoh528 />} />
        <Route path="/genesis" element={<Navigate to="/genesis/hub" replace />} />
        <Route path="/genesis/observe" element={<Navigate to="/academy/observe" replace />} />
        <Route path="/genesis/hub" element={<GenesisObservabilityHubPage />} />
        <Route path="/genesis/academy" element={<GenesisAcademyPage />} />
        {/* Product entry: same observability surface as Hub, stable URL for Academy → Observe */}
        <Route path="/academy/observe" element={<GenesisObservabilityHubPage />} />
        <Route path="/academy/research" element={<AcademicObservatoryPageV0 />} />
        <Route path="/genesis/portal" element={<GenesisPortalPage />} />
        <Route path="/continuity" element={<Navigate to="/genesis/hub" replace />} />
        <Route
          path="/rhizoh/examples/physical-cognition-v0"
          element={<PhysicalCognitionEngineExampleV0 />}
        />
        <Route
          path="/rhizoh/examples/temporal-semantic-v0"
          element={<TemporalSemanticEngineExampleV0 />}
        />
        <Route
          path="/rhizoh/examples/thinking-engine-v0"
          element={<RhizohThinkingEngineExampleV0 />}
        />
        {STUDIO_LIVE_ROUTE_ENABLED_V0 ? (
          <Route path="/studio-live" element={<StudioLiveRoomV1 />} />
        ) : (
          <Route path="/studio-live" element={<Navigate to="/" replace />} />
        )}
        <Route path="/dev/fox-lab" element={<FoxConversationLabPageV1 />} />
        <Route path="/dev/octo-lab" element={<FoxConversationLabPageV1 />} />
        <Route path="/hall/*" element={<AppRhizoh528 />} />
        <Route path="/greenroom/*" element={<AppRhizoh528 />} />
        <Route path="/broadcast/*" element={<AppRhizoh528 />} />
        <Route path="/studio" element={<AppRhizoh528 />} />
        <Route path="/spiral" element={<AppRhizoh528 />} />
        <Route path="/map" element={<AppRhizoh528 />} />
        <Route path="/settings" element={<AppRhizoh528 />} />
        <Route path="/observer/settings" element={<AppRhizoh528 />} />
        <Route path="/academy" element={<AppRhizoh528 />} />
        <Route path="*" element={<AppRhizoh528 />} />
      </Routes>
    </BrowserRouter>
  );
}
