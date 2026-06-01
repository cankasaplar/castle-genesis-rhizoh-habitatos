import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppRhizoh528 from "../AppRhizoh528.jsx";
import GenesisPortalPage from "../genesis/GenesisPortalPage.jsx";
import GenesisObservabilityHubPage from "../genesis/GenesisObservabilityHubPage.jsx";
import GenesisAcademyPage from "../genesis/GenesisAcademyPage.jsx";
import AcademicObservatoryPageV0 from "../surface/AcademicObservatoryPageV0.jsx";
import { PhysicalCognitionEngineExampleV0 } from "../rhizoh/experience/examples/PhysicalCognitionEngineExampleV0.jsx";
import { TemporalSemanticEngineExampleV0 } from "../rhizoh/experience/examples/TemporalSemanticEngineExampleV0.jsx";
import { RhizohThinkingEngineExampleV0 } from "../rhizoh/experience/examples/RhizohThinkingEngineExampleV0.jsx";

/**
 * SPA shell — Genesis hub `/genesis/hub` and product alias `/academy/observe`; legacy portal `/genesis/portal`. Rhizoh: `AppRhizoh528` syncs `useLocation()`.
 */
export function CastleShellRouter() {
  return (
    <BrowserRouter>
      <Routes>
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
        <Route path="*" element={<AppRhizoh528 />} />
      </Routes>
    </BrowserRouter>
  );
}
