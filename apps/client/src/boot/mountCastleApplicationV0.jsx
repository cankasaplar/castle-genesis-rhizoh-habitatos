import React from "react";
import ReactDOM from "react-dom/client";
import { CastleShellRouter } from "../shell/CastleShellRouter.jsx";
import { bootstrapRhizohOntologicalGateV0 } from "../rhizoh/runtime/continuity/bootstrapOntologicalGateV0.js";
import { QuarantineOntologicalGateShell } from "./QuarantineOntologicalGateShell.jsx";
import { resolveIngressRouteV0 } from "../rhizoh/ingress/ingress_router.js";
import { RhizohIngressFlow } from "../rhizoh/ingress/RhizohIngressFlow.jsx";
import { hideLegacyIndexHudV0 } from "./castleCrashTelemetry.js";

/**
 * CORE-ELIGIBLE: mount after ontological gate (pre-render).
 *
 * @param {{
 *   appEl: HTMLElement,
 *   RootErrorBoundary: React.ComponentType<{ children: React.ReactNode }>,
 *   bootLog?: { ok?: (k: string, m: string) => void, fail?: (k: string, m: string) => void }
 * }} ctx
 */
export async function mountCastleApplicationV0(ctx) {
  const { appEl, RootErrorBoundary, bootLog } = ctx;

  hideLegacyIndexHudV0();
  bootLog?.ok?.("boot.ontological_gate", "pre-render gate starting");

  const gate = await bootstrapRhizohOntologicalGateV0();

  let reactRoot = window.__CASTLE_REACT_ROOT__;
  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(appEl);
    window.__CASTLE_REACT_ROOT__ = reactRoot;
  }

  if (!gate.proceed) {
    bootLog?.fail?.("boot.ontological_gate", String(gate.reason || "blocked"));
    reactRoot.render(
      <RootErrorBoundary>
        <QuarantineOntologicalGateShell
          reason={String(gate.reason || "EPISTEMIC_LEGITIMACY_BREACH")}
          detail={gate.error || gate.gateVerdict?.statement || ""}
        />
      </RootErrorBoundary>
    );
    return { mounted: true, quarantine: true, gate };
  }

  bootLog?.ok?.(
    "boot.ontological_gate",
    `CONTINUITY_OK world=${gate.bootContext?.livingWorldId || "?"} tick=${gate.bootContext?.targetTick ?? "?"}`
  );

  const ingress = resolveIngressRouteV0();
  const needsIngressFlow =
    ingress.required ||
    ingress.route === "legal_preamble" ||
    ingress.route === "closed_admission_hold" ||
    ingress.closedAdmission?.enabled;

  if (needsIngressFlow) {
    bootLog?.ok?.("boot.rhizoh_ingress", `route=${ingress.route}`);
    reactRoot.render(
      <RootErrorBoundary>
        <RhizohIngressFlow />
      </RootErrorBoundary>
    );
    return { mounted: true, quarantine: false, gate, ingress: ingress.route };
  }

  reactRoot.render(
    <RootErrorBoundary>
      <CastleShellRouter />
    </RootErrorBoundary>
  );

  return { mounted: true, quarantine: false, gate, ingress: ingress.route };
}
