import React, { memo, useEffect, useState } from "react";
import {
  buildRhizohObservationStateV1,
  isRhizohProofModeEnabledV1,
  subscribeRhizohObservationStateV1
} from "../rhizoh/runtime/rhizohObservationStateV1.js";

const panelStyle = {
  position: "fixed",
  bottom: 12,
  left: 12,
  right: 12,
  maxWidth: 520,
  margin: "0 auto",
  zIndex: 99990,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 11,
  lineHeight: 1.45,
  color: "#e2e8f0",
  background: "rgba(2,8,23,0.92)",
  border: "1px solid rgba(56,189,248,0.35)",
  borderRadius: 10,
  padding: "10px 12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  pointerEvents: "none"
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "120px 1fr",
  gap: 8,
  padding: "2px 0"
};

function MetricRow({ label, value, ok }) {
  return (
    <div style={rowStyle}>
      <span style={{ opacity: 0.55 }}>{label}</span>
      <span style={{ color: ok === true ? "#86efac" : ok === false ? "#fca5a5" : "#cbd5e1" }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Proof Mode overlay — visible metrics for two-client observation demos.
 * Enable: ?proof=1 · VITE_RHIZOH_PROOF_MODE=1 · auto when reality sync active.
 */
export const RhizohObservationProofPanelV0 = memo(function RhizohObservationProofPanelV0() {
  const [state, setState] = useState(() => buildRhizohObservationStateV1());

  useEffect(() => {
    return subscribeRhizohObservationStateV1(setState);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setState(buildRhizohObservationStateV1()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const proofQuery = isRhizohProofModeEnabledV1();
  const show =
    proofQuery || state.reality?.syncActive || state.reality?.instrumentationTier !== "truth_only";

  if (!show) return null;

  const ackLabel =
    state.broadcast.recipientCount > 0
      ? `${state.broadcast.ackCount}/${state.broadcast.recipientCount}`
      : `${state.broadcast.ackCount}/?`;

  const deliveredLabel =
    state.broadcast.recipientCount > 0
      ? `${state.broadcast.delivered}/${state.broadcast.recipientCount}`
      : String(state.broadcast.delivered);

  const idle = !state.sessionId && !state.reality?.syncActive;
  const catchUp = state.sync?.catchUpLag === "awaiting_snapshot" || state.sync?.catchUpLag === "awaiting_gateway_seq";
  const syncLabel = idle
    ? "— (start session)"
    : catchUp
      ? "catching up…"
      : state.sync.projectionConsistency
        ? "yes"
        : "no";
  const syncOk = idle ? undefined : catchUp ? false : state.sync.projectionConsistency;

  return (
    <aside
      style={panelStyle}
      data-rhizoh-observation-proof="1"
      aria-label="Rhizoh observation proof"
    >
      <div style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.7, marginBottom: 6 }}>
        OBSERVATION PROOF · {state.narrative?.label}
      </div>
      {idle ? (
        <div style={{ fontSize: 10, color: "#7dd3fc", marginBottom: 8, lineHeight: 1.5 }}>
          IDLE · gateway wsOpen={state.reality?.wsOpen ? "yes" : "no"} · run challengePeer() to
          start proof
        </div>
      ) : null}
      <MetricRow label="sessionId" value={state.sessionId || "—"} />
      <MetricRow label="commitSeq" value={state.truth.commitSeq} />
      <MetricRow label="eventSeq" value={state.truth.eventSeq} />
      <MetricRow
        label="projectionVer"
        value={state.truth.projectionVersion}
        ok={state.sync.projectionConsistency}
      />
      <MetricRow label="fen hash" value={state.reality.sharedStateHash || "—"} />
      <MetricRow label="broadcastSeq" value={state.broadcast.broadcastSeq} />
      <MetricRow label="delivered" value={deliveredLabel} />
      <MetricRow label="ack" value={ackLabel} />
      <MetricRow
        label="in sync"
        value={syncLabel}
        ok={syncOk}
      />
      <MetricRow
        label="drift"
        value={state.sync.driftDetected ? "detected" : "none"}
        ok={!state.sync.driftDetected}
      />
      <MetricRow label="tier" value={state.reality.instrumentationTier} />
    </aside>
  );
});
