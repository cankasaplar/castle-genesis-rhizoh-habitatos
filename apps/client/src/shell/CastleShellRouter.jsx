import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppRhizoh528 from "../AppRhizoh528.jsx";
import GenesisPortalPage from "../genesis/GenesisPortalPage.jsx";
import GenesisObservabilityHubPage from "../genesis/GenesisObservabilityHubPage.jsx";
import GenesisAcademyPage from "../genesis/GenesisAcademyPage.jsx";

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
        <Route path="/genesis/portal" element={<GenesisPortalPage />} />
        <Route path="/continuity" element={<Navigate to="/genesis/hub" replace />} />
        <Route path="*" element={<AppRhizoh528 />} />
      </Routes>
    </BrowserRouter>
  );
}
