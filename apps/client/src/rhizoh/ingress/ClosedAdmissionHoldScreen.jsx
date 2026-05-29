import React from "react";
import { getClosedAdmissionHoldCopyV0 } from "./ingress_router.js";
import { INGRESS_SURFACE_V0 } from "./ingressFlowStylesV0.js";

/**
 * @param {{ onRetry?: () => void }} props
 */
export function ClosedAdmissionHoldScreen({ onRetry }) {
  const copy = getClosedAdmissionHoldCopyV0();
  return (
    <div style={INGRESS_SURFACE_V0.page}>
      <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>
      <p style={INGRESS_SURFACE_V0.lead}>{copy.lead}</p>
      {onRetry ? (
        <button type="button" style={INGRESS_SURFACE_V0.primaryBtn(true)} onClick={onRetry}>
          {copy.retryLabel}
        </button>
      ) : null}
    </div>
  );
}
