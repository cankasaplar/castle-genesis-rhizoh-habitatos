import React from "react";

/**
 * Headless steril room — no Cesium / map / Ghost before legitimacy.
 *
 * @param {{ reason: string, detail?: string }} props
 */
export function QuarantineOntologicalGateShell({ reason, detail }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: 28,
        background: "#0a0a12",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif"
      }}
    >
      <h1 style={{ fontSize: 20, margin: "0 0 12px", fontWeight: 600 }}>Rhizoh — Ontological Quarantine</h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 16px", maxWidth: 560 }}>
        Execution blocked before visual substrate load. No living world bootstrap on disk, or epistemic
        legitimacy breach. Run continuity recovery and world legitimization in dev tools.
      </p>
      <pre
        style={{
          fontSize: 12,
          padding: 12,
          background: "#14141f",
          borderRadius: 8,
          margin: 0,
          whiteSpace: "pre-wrap"
        }}
      >
        {`reason: ${reason}\n${detail || ""}`}
      </pre>
      <p style={{ fontSize: 12, marginTop: 16, opacity: 0.75 }}>
        Dev: <code>__rhizoh.runContinuityRecovery</code> then legitimization / peer feed with fixation pipeline.
      </p>
    </div>
  );
}
