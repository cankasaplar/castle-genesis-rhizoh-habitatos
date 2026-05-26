import React from "react";
import { getIngressErrorCopyV0 } from "./ingress_router.js";
import { INGRESS_SURFACE_V0 } from "./ingressFlowStylesV0.js";

/**
 * @param {{ kind?: 'offline' | 'timeout' | 'gateway' | 'unknown', onRetry?: () => void }} props
 */
export function IngressErrorScreen({ kind = "unknown", onRetry }) {
  const copy = getIngressErrorCopyV0(kind);
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
