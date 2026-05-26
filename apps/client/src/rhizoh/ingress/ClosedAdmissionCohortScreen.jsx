import React, { useState } from "react";
import {
  COHORT_GATE_DECISION_V0,
  completeCohortGateNoOpV0,
  getClosedAdmissionCohortCopyV0
} from "./ingress_router.js";
import { INGRESS_SURFACE_V0 } from "./ingressFlowStylesV0.js";

/**
 * UI decision gate — no-op evaluation hook (engine output ignored).
 * @param {{ onProceed: () => void }} props
 */
export function ClosedAdmissionCohortScreen({ onProceed }) {
  const copy = getClosedAdmissionCohortCopyV0();
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div style={INGRESS_SURFACE_V0.page}>
        <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
        <h1 style={INGRESS_SURFACE_V0.title}>{copy.declineTitle}</h1>
        <p style={INGRESS_SURFACE_V0.lead}>{copy.declineLead}</p>
      </div>
    );
  }

  return (
    <div style={INGRESS_SURFACE_V0.page}>
      <p style={INGRESS_SURFACE_V0.kicker}>{copy.kicker}</p>
      <h1 style={INGRESS_SURFACE_V0.title}>{copy.title}</h1>
      <p style={INGRESS_SURFACE_V0.lead}>{copy.lead}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
        <button
          type="button"
          style={INGRESS_SURFACE_V0.primaryBtn(true)}
          onClick={() => {
            completeCohortGateNoOpV0({ decision: COHORT_GATE_DECISION_V0.ACCEPTED });
            onProceed();
          }}
        >
          {copy.acceptLabel}
        </button>
        <button
          type="button"
          style={{
            ...INGRESS_SURFACE_V0.primaryBtn(true),
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid #475569"
          }}
          onClick={() => {
            completeCohortGateNoOpV0({ decision: COHORT_GATE_DECISION_V0.DECLINED });
            setDeclined(true);
          }}
        >
          {copy.declineLabel}
        </button>
      </div>
    </div>
  );
}
