import React, { useCallback, useEffect, useState } from "react";
import { CastleShellRouter } from "../../shell/CastleShellRouter.jsx";
import { ClosedAdmissionCohortScreen } from "./ClosedAdmissionCohortScreen.jsx";
import { ClosedAdmissionHoldScreen } from "./ClosedAdmissionHoldScreen.jsx";
import { IngressErrorScreen } from "./IngressErrorScreen.jsx";
import { CookieConsentBanner } from "./CookieConsentBanner.jsx";
import { RhizohUnifiedEntryScreen } from "./RhizohUnifiedEntryScreen.jsx";
import {
  clearClosedAdmissionSessionForTestV0,
  deriveIngressPhaseV0,
  INGRESS_ROUTE_V0,
  isClosedAdmissionCohortStepRequiredV0,
  LEGAL_REALITY_SPEC_SHA256_V0,
  isLegalPreambleRequiredV0,
  normalizeIngressPhaseV0
} from "./ingress_router.js";
import { recordCohortObservationV0 } from "./cohortObservationLogV0.js";
import { startProdWorldObservabilityBridgeV0 } from "../runtime/rhizohProdWorldObservabilityBridgeV0.js";
import { publishIngressRouteV0 } from "../runtime/spatialSinkRoutePolicyV0.js";
import { RhizohCoreSubsystemHostV0 } from "../../components/RhizohCoreSubsystemHostV0.jsx";
import {
  isObserverInvitePathV0,
  subscribeObserverInviteProceedV0
} from "./observerInviteLandingV0.js";

const INGRESS_OVERLAY_STYLE_V0 = Object.freeze({
  position: "fixed",
  inset: 0,
  zIndex: 280,
  overflow: "auto",
  background: "linear-gradient(180deg, #050810 0%, #0a1220 100%)"
});

/**
 * rhizoh.com: legal → (optional) beta accept → app.
 * Core shell always mounted; ingress is an overlay (not a global kill switch).
 */
export function RhizohIngressFlow() {
  const [phase, setPhase] = useState(() => {
    if (typeof window !== "undefined" && isObserverInvitePathV0(window.location.pathname)) {
      return INGRESS_ROUTE_V0.APP;
    }
    return normalizeIngressPhaseV0(deriveIngressPhaseV0());
  });
  const [errorKind, setErrorKind] = useState("unknown");

  useEffect(() => {
    return subscribeObserverInviteProceedV0(() => {
      setPhase(normalizeIngressPhaseV0(deriveIngressPhaseV0()));
    });
  }, []);

  useEffect(() => {
    publishIngressRouteV0(phase, { source: "ingress.flow" });
  }, [phase]);

  useEffect(() => {
    const onOffline = () => {
      setErrorKind("offline");
      setPhase(INGRESS_ROUTE_V0.ERROR);
    };
    const onOnline = () => {
      if (phase === INGRESS_ROUTE_V0.ERROR && errorKind === "offline") {
        setPhase(normalizeIngressPhaseV0(null));
      }
    };
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      onOffline();
    }
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [phase, errorKind]);

  const mountApp = useCallback(() => {
    startProdWorldObservabilityBridgeV0();
    recordCohortObservationV0({ tag: "ingress_shell_app_mount", meta: {} });
    setPhase(INGRESS_ROUTE_V0.APP);
  }, []);

  const refreshAfterLegal = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setErrorKind("offline");
      setPhase(INGRESS_ROUTE_V0.ERROR);
      return;
    }
    if (isClosedAdmissionCohortStepRequiredV0()) {
      setPhase(INGRESS_ROUTE_V0.COHORT);
    } else {
      mountApp();
    }
  }, [mountApp]);

  const onInvitePath =
    typeof window !== "undefined" && isObserverInvitePathV0(window.location.pathname);
  const showIngressOverlay = phase !== INGRESS_ROUTE_V0.APP && !onInvitePath;

  const ingressOverlay = (() => {
    if (phase === INGRESS_ROUTE_V0.LANGUAGE || phase === INGRESS_ROUTE_V0.LEGAL_PREAMBLE) {
      return (
        <RhizohUnifiedEntryScreen
          specSha256={LEGAL_REALITY_SPEC_SHA256_V0}
          legalRequired={isLegalPreambleRequiredV0()}
          onProceed={refreshAfterLegal}
        />
      );
    }
    if (phase === INGRESS_ROUTE_V0.ERROR) {
      return (
        <IngressErrorScreen
          kind={errorKind}
          onRetry={() => setPhase(normalizeIngressPhaseV0(null))}
        />
      );
    }
    if (phase === INGRESS_ROUTE_V0.COHORT) {
      return (
        <ClosedAdmissionCohortScreen
          onProceed={mountApp}
          onHold={() => setPhase(INGRESS_ROUTE_V0.HOLD)}
        />
      );
    }
    if (phase === INGRESS_ROUTE_V0.HOLD) {
      return (
        <ClosedAdmissionHoldScreen
          onRetry={() => {
            clearClosedAdmissionSessionForTestV0();
            setPhase(INGRESS_ROUTE_V0.COHORT);
          }}
        />
      );
    }
    return null;
  })();

  return (
    <>
      <RhizohCoreSubsystemHostV0 />
      <CastleShellRouter />
      {showIngressOverlay && ingressOverlay ? (
        <div
          className="rhizoh-ingress-overlay"
          data-rhizoh-ingress-phase={phase}
          style={INGRESS_OVERLAY_STYLE_V0}
        >
          {ingressOverlay}
        </div>
      ) : null}
      <CookieConsentBanner />
    </>
  );
}
