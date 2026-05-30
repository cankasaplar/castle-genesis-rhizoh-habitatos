import React, { useCallback, useEffect, useState } from "react";
import { CastleShellRouter } from "../../shell/CastleShellRouter.jsx";
import { LegalPreambleScreen } from "./LegalPreambleScreen.jsx";
import { ClosedAdmissionCohortScreen } from "./ClosedAdmissionCohortScreen.jsx";
import { ClosedAdmissionHoldScreen } from "./ClosedAdmissionHoldScreen.jsx";
import { IngressErrorScreen } from "./IngressErrorScreen.jsx";
import { CookieConsentBanner } from "./CookieConsentBanner.jsx";
import {
  clearClosedAdmissionSessionForTestV0,
  deriveIngressPhaseV0,
  INGRESS_ROUTE_V0,
  isClosedAdmissionCohortStepRequiredV0,
  LEGAL_REALITY_SPEC_SHA256_V0,
  normalizeIngressPhaseV0
} from "./ingress_router.js";
import { recordCohortObservationV0 } from "./cohortObservationLogV0.js";

/**
 * rhizoh.com: legal → (optional) beta accept → app. Errors surface explicitly.
 */
export function RhizohIngressFlow() {
  const [phase, setPhase] = useState(() => normalizeIngressPhaseV0(deriveIngressPhaseV0()));
  const [errorKind, setErrorKind] = useState("unknown");

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

  if (phase === INGRESS_ROUTE_V0.ERROR) {
    return (
      <>
        <IngressErrorScreen
          kind={errorKind}
          onRetry={() => setPhase(normalizeIngressPhaseV0(null))}
        />
        <CookieConsentBanner />
      </>
    );
  }

  if (phase === INGRESS_ROUTE_V0.LEGAL_PREAMBLE) {
    return (
      <LegalPreambleScreen specSha256={LEGAL_REALITY_SPEC_SHA256_V0} onProceed={refreshAfterLegal} />
    );
  }

  if (phase === INGRESS_ROUTE_V0.COHORT) {
    return (
      <>
        <ClosedAdmissionCohortScreen onProceed={mountApp} />
        <CookieConsentBanner />
      </>
    );
  }

  if (phase === INGRESS_ROUTE_V0.HOLD) {
    return (
      <>
        <ClosedAdmissionHoldScreen
          onRetry={() => {
            clearClosedAdmissionSessionForTestV0();
            setPhase(INGRESS_ROUTE_V0.COHORT);
          }}
        />
        <CookieConsentBanner />
      </>
    );
  }

  return (
    <>
      <CastleShellRouter />
      <CookieConsentBanner />
    </>
  );
}
