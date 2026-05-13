import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { GenesisSurfaceNav } from "./GenesisSurfaceNav.jsx";
import { resolveGenesisGatewayOriginCached } from "./genesisNetworkResolverV1.js";
import { GenesisRuntimeObservationPanel } from "../studio/ui/GenesisRuntimeObservationPanel.jsx";
import { GenesisClientCapabilityPanel } from "./GenesisClientCapabilityPanel.jsx";
import { GenesisContinuityMicroStream } from "./GenesisContinuityMicroStream.jsx";
import { GenesisTemporalQueryPlayground } from "./GenesisTemporalQueryPlayground.jsx";
import { GenesisReplaySessionViewer } from "./GenesisReplaySessionViewer.jsx";
import { GENESIS_SURFACE_PROTOCOL_ARTIFACT_VERSION } from "./genesisSurfaceArtifactV0.js";

/**
 * Protocol-facing observational entry — not the full Rhizoh studio shell.
 * Treat as a low-churn protocol artifact (continuity onboarding + runtime observation).
 */
export default function GenesisPortalPage() {
  const gatewayOrigin = useMemo(() => resolveGenesisGatewayOriginCached(), []);

  return (
    <div className="min-h-screen bg-[#07060d] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        <GenesisSurfaceNav active="portal" />
        <header className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-violet-200/80">Castle Genesis</div>
          <h1 className="text-lg font-light tracking-tight text-white/90">Runtime observation</h1>
          <p className="text-[11px] leading-relaxed text-white/45 normal-case">
            Gateway-authoritative read surface. No client-side continuity synthesis.
          </p>
          <p className="text-[9px] text-white/30 normal-case">
            Protocol artifact {GENESIS_SURFACE_PROTOCOL_ARTIFACT_VERSION} — prefer rare surface churn.
          </p>
        </header>

        <GenesisRuntimeObservationPanel gatewayOrigin={gatewayOrigin} />
        <GenesisTemporalQueryPlayground gatewayOrigin={gatewayOrigin} />
        <GenesisReplaySessionViewer gatewayOrigin={gatewayOrigin} />
        <GenesisClientCapabilityPanel />
        <GenesisContinuityMicroStream gatewayOrigin={gatewayOrigin} />

        <footer className="space-y-2 pt-2">
          <Link
            to="/"
            className="text-[10px] uppercase tracking-[0.2em] text-violet-300/80 underline-offset-4 hover:text-violet-200 hover:underline"
          >
            ← Rhizoh shell
          </Link>
        </footer>
      </div>
    </div>
  );
}
