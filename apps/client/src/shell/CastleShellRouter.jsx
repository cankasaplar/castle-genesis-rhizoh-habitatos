import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppRhizoh528 from "../AppRhizoh528.jsx";
import GenesisPortalPage from "../genesis/GenesisPortalPage.jsx";

/**
 * SPA shell — `/genesis` is the observational portal; other paths mount Rhizoh (`AppRhizoh528` syncs `useLocation()`).
 */
export function CastleShellRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/genesis" element={<GenesisPortalPage />} />
        <Route path="/continuity" element={<Navigate to="/genesis" replace />} />
        <Route path="*" element={<AppRhizoh528 />} />
      </Routes>
    </BrowserRouter>
  );
}
