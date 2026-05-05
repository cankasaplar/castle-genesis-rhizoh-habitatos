import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppRhizoh528 from "../AppRhizoh528.jsx";

/**
 * Single SPA shell — all product paths mount the same app; `AppRhizoh528` syncs from `useLocation()`.
 */
export function CastleShellRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<AppRhizoh528 />} />
      </Routes>
    </BrowserRouter>
  );
}
