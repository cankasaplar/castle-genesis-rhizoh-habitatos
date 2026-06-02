import React, { useEffect, useState } from "react";
import { getVoiceAdapterRegistrySnapshot } from "./voiceInputAdapterRegistryV0.js";
export function isCastleLayersDebugEnabledV0() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  if (import.meta.env.DEV) return true;
  const raw = String(import.meta.env.VITE_CASTLE_LAYERS_DEBUG || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "on";
}

/**
 * Runtime topology panel — observation only, no execution authority.
 */
export function RhizohCastleLayersDebugV0({ gatewayPhase = "" }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1200);
    return () => window.clearInterval(id);
  }, []);

  if (!isCastleLayersDebugEnabledV0()) return null;

  const llm = typeof window !== "undefined" ? window.__CASTLE_RHIZOH_LLM_LAST_RESPONSE__ : null;
  const cesium = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
  const voice = getVoiceAdapterRegistrySnapshot();
  const layerAudit = typeof window !== "undefined" ? window.__CASTLE_LAYER_AUDIT__ : null;
  const epistemic = typeof window !== "undefined" ? window.__CASTLE_EPISTEMIC_TELEMETRY__ : null;
  const gw = String(gatewayPhase || "").toLowerCase();
  const gwOn = gw === "connected" || gw === "ready" || gw === "live" || gw === "uncertain";

  const drift = String(llm?.replyContractDriftClass || "—");
  const driftTone =
    drift === "ok"
      ? "text-emerald-300"
      : drift === "informative"
        ? "text-cyan-300"
        : drift === "breaking"
          ? "text-rose-300"
          : "text-white/55";

  const rows = [
    {
      id: "t0",
      label: "T0 / Chat",
      on: true,
      detail: llm?.replyPreview ? `${llm.replyPreview.slice(0, 56)}…` : "awaiting reply"
    },
    {
      id: "llm",
      label: "LLM schema",
      on: drift === "ok" || drift === "informative",
      detail: llm?.replySchemaVersion
        ? `${llm.replySchemaVersion.split(".").pop() || "v1"} · ${llm.replyChars ?? "?"} chars`
        : "no mirror"
    },
    {
      id: "voice",
      label: "Voice v3",
      on: voice.hydrated && !voice.fallbackMode,
      detail: `${voice.sttStatus || "?"} · ${voice.providerId || "no adapter"}`
    },
    {
      id: "spatial",
      label: "Spatial / Cesium",
      on: cesium?.ready === true,
      detail: cesium?.ready
        ? `map=${String(cesium.getImageryProfile?.() || "?")} fly=${cesium.isFlying ? "1" : "0"}`
        : "viewer not ready"
    },
    {
      id: "gateway",
      label: "Gateway",
      on: gwOn,
      detail: gw || "?"
    },
    {
      id: "telemetry",
      label: "Epistemic telemetry",
      on: epistemic?.lastStatus === "ok",
      detail: epistemic?.lastError
        ? String(epistemic.lastError).slice(0, 48)
        : epistemic?.lastStatus || "idle"
    }
  ];

  return (
    <div
      className="pointer-events-auto fixed right-2 top-2 z-[90] max-w-[min(19rem,44vw)] rounded-xl border border-amber-400/35 bg-black/80 p-2 text-[9px] font-mono normal-case text-amber-50/90 backdrop-blur-md"
      data-rhizoh-castle-layers-debug="1"
      data-tick={tick}
    >
      <div className="mb-1 text-[8px] font-bold tracking-[0.18em] text-amber-200/80">CASTLE LAYERS</div>
      <div className={`mb-1 ${driftTone}`}>
        drift: {drift}
        {llm?.traceId ? ` · ${String(llm.traceId).slice(0, 14)}` : ""}
      </div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <span
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${r.on ? "bg-emerald-400" : "bg-rose-400"}`}
            />
            <span>
              <span className="text-amber-100">{r.label}</span>
              <span className="block text-white/55">{r.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      {layerAudit?.mismatches?.length ? (
        <div className="mt-1 text-rose-300/90">layer mismatch: {layerAudit.mismatches.join(", ")}</div>
      ) : null}
    </div>
  );
}
