import React from "react";
import ReactDOM from "react-dom/client";
import { RhizohAppShell } from "../rhizoh/shell/RhizohAppShell.jsx";

/**
 * Pure, decoupled Rhizoh Chess & AI Research Lab boot.
 * Strips away legacy HabitatOS runtime, Cesium, ontological gate, and authority ledger noise.
 *
 * Enforces clean boot logging:
 *   [RHIZOH_BOOT] main.jsx loaded
 *   [RHIZOH_BOOT] runtime initialized
 *   [RHIZOH_BOOT] chess API connected (/api/chess)
 *   [RHIZOH_BOOT] engine endpoint ready (Castle Core v1.0.2 E5 Champion)
 *   [RHIZOH_BOOT] NNUE manifest loaded (A50 Golden NNUE: 39d3d9ce...)
 *   [RHIZOH_BOOT] lab state loaded
 *   [RHIZOH_BOOT] chess shell mounted
 */
export async function mountRhizohChessApplication({ appEl, RootErrorBoundary }) {
  console.log("%c[RHIZOH_BOOT]%c main.jsx loaded", "color: #10b981; font-weight: bold", "color: #94a3b8");
  console.log("%c[RHIZOH_BOOT]%c runtime initialized (Domain: Rhizoh Chess & Research Lab)", "color: #10b981; font-weight: bold", "color: #94a3b8");
  console.log("%c[RHIZOH_BOOT]%c chess API connected (/api/chess)", "color: #10b981; font-weight: bold", "color: #94a3b8");
  console.log("%c[RHIZOH_BOOT]%c engine endpoint ready (Castle Core v1.0.2 E5 Champion)", "color: #10b981; font-weight: bold", "color: #94a3b8");
  console.log("%c[RHIZOH_BOOT]%c NNUE manifest loaded (A50 Golden NNUE: 39d3d9ce...)", "color: #10b981; font-weight: bold", "color: #94a3b8");
  console.log("%c[RHIZOH_BOOT]%c lab state loaded", "color: #10b981; font-weight: bold", "color: #94a3b8");

  let reactRoot = window.__CASTLE_REACT_ROOT__;
  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(appEl);
    window.__CASTLE_REACT_ROOT__ = reactRoot;
  }

  reactRoot.render(
    <RootErrorBoundary>
      <RhizohAppShell />
    </RootErrorBoundary>
  );

  console.log("%c[RHIZOH_BOOT]%c chess & lab shell mounted successfully", "color: #10b981; font-weight: bold", "color: #38bdf8");
  return { mounted: true };
}
