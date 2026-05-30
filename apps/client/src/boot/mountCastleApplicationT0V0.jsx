import React from "react";
import ReactDOM from "react-dom/client";
import { CastleShellRouter } from "../shell/CastleShellRouter.jsx";
import {
  deriveIngressPhaseV0,
  INGRESS_ROUTE_V0,
  resolveIngressRouteV0
} from "../rhizoh/ingress/ingress_router.js";
import { RhizohIngressFlow } from "../rhizoh/ingress/RhizohIngressFlow.jsx";
import { isCohortFeedbackRouteV0 } from "../rhizoh/cohort/cohortFeedbackUrlV0.js";
import { CohortSessionFeedbackScreen } from "../rhizoh/cohort/CohortSessionFeedbackScreen.jsx";
import { hideLegacyIndexHudV0 } from "./castleCrashTelemetry.js";

/**
 * T0 shell mount — legal/cohort ingress + monolithic AppRhizoh528 (no ontological gate).
 */
export async function mountCastleApplicationT0V0(ctx) {
  const { appEl, RootErrorBoundary, bootLog } = ctx;

  hideLegacyIndexHudV0();
  let reactRoot = window.__CASTLE_REACT_ROOT__;
  if (!reactRoot) {
    reactRoot = ReactDOM.createRoot(appEl);
    window.__CASTLE_REACT_ROOT__ = reactRoot;
  }

  if (isCohortFeedbackRouteV0()) {
    bootLog?.ok?.("boot.cohort_feedback", "feedback route");
    reactRoot.render(
      <RootErrorBoundary>
        <CohortSessionFeedbackScreen />
      </RootErrorBoundary>
    );
    return { mounted: true, quarantine: false, gate: null, ingress: "cohort_feedback" };
  }

  const ingress = resolveIngressRouteV0();
  const ingressPhase = deriveIngressPhaseV0();
  const needsIngressFlow = ingressPhase !== INGRESS_ROUTE_V0.APP;
  bootLog?.ok?.(
    "boot.ingress_resolve",
    `phase=${ingressPhase} route=${ingress.route} required=${ingress.required} acked=${ingress.acked}`
  );

  if (needsIngressFlow) {
    bootLog?.ok?.("boot.rhizoh_ingress", `route=${ingress.route}`);
    reactRoot.render(
      <RootErrorBoundary>
        <RhizohIngressFlow />
      </RootErrorBoundary>
    );
    return { mounted: true, quarantine: false, gate: null, ingress: ingress.route };
  }

  reactRoot.render(
    <RootErrorBoundary>
      <CastleShellRouter />
    </RootErrorBoundary>
  );
  bootLog?.ok?.("boot.react_mount", "root rendered; Rhizoh shell routing live");
  return { mounted: true, quarantine: false, gate: null, ingress: ingress.route };
}
