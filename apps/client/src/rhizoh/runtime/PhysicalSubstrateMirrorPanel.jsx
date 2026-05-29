import React, { useEffect, useMemo, useState } from "react";
import { getDeviceAckSnapshotV0 } from "./deviceAckLogV0.js";
import { verifyPhysicalParityV0 } from "./physicalParityVerifierV0.js";
import { DRIFT_SCOPE, PHYSICAL_DRIFT_DETECTED } from "./driftNamespaceV0.js";

/**
 * PR-3.3-D — Read-only mirror: virtual ambient box vs last device ACKs (never writes epistemic state).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Not a source of truth:** this panel is a **visualized proof surface** for debugging, replay,
 * drift audit, and physical verification — it observes logs + props; it does not author execution
 * or epistemic state.
 *
 * @param {{ virtualBox?: unknown, pollMs?: number, title?: string }} props
 */
export function PhysicalSubstrateMirrorPanel({ virtualBox = null, pollMs = 2000, title = "SUBSTRATE MIRROR" }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!pollMs || pollMs <= 0) return undefined;
    const id = window.setInterval(() => setTick((x) => x + 1), pollMs);
    return () => window.clearInterval(id);
  }, [pollMs]);

  const acks = useMemo(() => getDeviceAckSnapshotV0(), [tick]);

  const latestHue = useMemo(() => {
    for (let i = acks.length - 1; i >= 0; i--) {
      if (acks[i]?.actuator === "HUE") return acks[i];
    }
    return null;
  }, [acks]);

  const parity = useMemo(() => {
    if (!virtualBox) return { state: "idle", detail: "no virtual box" };
    if (!latestHue) return { state: "idle", detail: "no HUE ack in log" };
    const r = verifyPhysicalParityV0({ virtualBox, ackEnvelope: latestHue });
    if (r.ok) return { state: "match", detail: `${r.scope}` };
    if (r.code === PHYSICAL_DRIFT_DETECTED) return { state: "drift", detail: `${DRIFT_SCOPE.PHYSICAL} · ${r.code}` };
    return { state: "pending", detail: String(r.code ?? "check") };
  }, [virtualBox, latestHue]);

  return (
    <div className="space-y-2 rounded-xl border border-amber-400/25 bg-amber-950/20 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-black tracking-[0.2em] text-amber-200/95">{title}</div>
        <div
          className={`text-[8px] font-semibold ${
            parity.state === "match" ? "text-emerald-300" : parity.state === "drift" ? "text-rose-300" : "text-amber-100/70"
          }`}
        >
          {parity.state.toUpperCase()}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[8px] text-white/80">
        <div className="rounded-md border border-white/10 bg-black/30 p-2">
          <div className="mb-1 text-[7px] tracking-wide text-white/50">VIRTUAL</div>
          <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all font-mono text-[7px] leading-relaxed">
            {virtualBox ? JSON.stringify(virtualBox, null, 0) : "—"}
          </pre>
        </div>
        <div className="rounded-md border border-white/10 bg-black/30 p-2">
          <div className="mb-1 text-[7px] tracking-wide text-white/50">LAST HUE ACK</div>
          <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all font-mono text-[7px] leading-relaxed">
            {latestHue ? JSON.stringify(latestHue, null, 0) : "—"}
          </pre>
        </div>
      </div>
      <div className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[7px] text-white/60 normal-case">
        {parity.detail}. Proof surface only (not SSOT). Physical actuator state cannot mutate epistemic state; ACK
        stays in device_ack_log.
      </div>
    </div>
  );
}
