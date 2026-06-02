import React, { useEffect, useState } from "react";
import { isCastleLayerRenderableV1 } from "../../castle/layers/castleLayerGateV1.js";
import { CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1 } from "../../castle/layers/castleLayerBehaviorGraphV1.js";
import { getCastleLayerDecisionTraceSnapshotV1 } from "../../castle/layers/castleLayerDecisionTraceV1.js";
import { resolveRhizohVoiceUiDomainV0 } from "./rhizohVoiceUiDomainV0.js";
import { getVoiceAdapterRegistrySnapshot } from "./voiceInputAdapterRegistryV0.js";

export function isCastleLayersDebugEnabledV0() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  if (import.meta.env.DEV) return true;
  const raw = String(import.meta.env.VITE_CASTLE_LAYERS_DEBUG || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "on";
}

function isCastleLayersPipelineHudRenderableV0() {
  if (import.meta.env?.DEV) return isCastleLayersDebugEnabledV0();
  return isCastleLayerRenderableV1("castle_layers_pipeline_hud");
}

/**
 * Runtime topology panel — observation only, no execution authority.
 * @param {{ gatewayPhase?: string }} props
 */
export function RhizohCastleLayersDebugV0({ gatewayPhase = "" }) {
  const [tick, setTick] = useState(0);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem("castle.layers.hud.collapsed");
      if (stored === "1") return true;
      if (stored === "0") return false;
    } catch {
      /* noop */
    }
    return !import.meta.env?.DEV;
  });

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const id = window.setInterval(bump, 400);
    const events = ["castle:reality-changed", "castle:reality-shift", "rhizoh:voice-init", "rhizoh:gateway-phase"];
    events.forEach((name) => window.addEventListener(name, bump));
    return () => {
      window.clearInterval(id);
      events.forEach((name) => window.removeEventListener(name, bump));
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("castle.layers.hud.collapsed", next ? "1" : "0");
      } catch {
        /* noop */
      }
      return next;
    });
  };

  if (!isCastleLayersPipelineHudRenderableV0()) return null;

  const layersRuntime = typeof window !== "undefined" ? window.__CASTLE_LAYERS_RUNTIME__ : null;
  const activeUiDomain = layersRuntime?.activeUiDomain || resolveRhizohVoiceUiDomainV0();
  const llm = typeof window !== "undefined" ? window.__CASTLE_RHIZOH_LLM_LAST_RESPONSE__ : null;
  const cesium = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
  const voice = getVoiceAdapterRegistrySnapshot();
  const layerAudit = typeof window !== "undefined" ? window.__CASTLE_LAYER_AUDIT__ : null;
  const epistemic = typeof window !== "undefined" ? window.__CASTLE_EPISTEMIC_TELEMETRY__ : null;
  const telemetryBarrier =
    typeof window !== "undefined" ? window.__CASTLE_EPISTEMIC_TELEMETRY_BARRIER__ : null;
  const decisionTrace =
    typeof window !== "undefined"
      ? window.__CASTLE_LAYERS_RUNTIME__?.lastDecisionTrace || getCastleLayerDecisionTraceSnapshotV1()?.last
      : null;
  const streamLock = typeof window !== "undefined" ? window.__CASTLE_VOICE_STREAM_LOCK__ : null;
  const sessionKeeper = typeof window !== "undefined" ? window.__CASTLE_GATEWAY_SESSION_KEEPER__ : null;
  const gw = String(gatewayPhase || "").toLowerCase();
  const gwOn = gw === "connected" || gw === "ready" || gw === "live" || gw === "uncertain";

  const drift = String(llm?.replyContractDriftClass || "—");
  const llmPipelineReady =
    gwOn &&
    (voice.hydrated || voice.sttStatus === "engine_v3_registered" || Boolean(voice.sttProvider));
  const llmMirrorReady = drift === "ok" || drift === "informative";
  const telemetryStatus = String(epistemic?.lastStatus || "idle");
  const telemetryReady =
    telemetryStatus === "ok" ||
    telemetryStatus === "attached" ||
    telemetryStatus === "flush_pending" ||
    telemetryStatus === "buffering" ||
    telemetryStatus === "attach_pending" ||
    telemetryBarrier?.channelAttached === true ||
    (gwOn && telemetryStatus !== "error" && telemetryStatus !== "skipped");
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
      on: llmMirrorReady || llmPipelineReady,
      detail: llm?.replySchemaVersion
        ? `${llm.replySchemaVersion.split(".").pop() || "v1"} · ${llm.replyChars ?? "?"} chars`
        : llmPipelineReady
          ? "standby · pipeline ready"
          : "no mirror"
    },
    {
      id: "voice",
      label: "Voice v3",
      on: voice.hydrated && !voice.fallbackMode,
      detail: `${voice.sttStatus || "?"} · ${voice.sttProvider || voice.voice?.provider || "no adapter"}`
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
      on: telemetryReady,
      detail: epistemic?.lastError
        ? String(epistemic.lastError).slice(0, 48)
        : telemetryBarrier?.channelAttached
          ? "attached · channel live"
          : telemetryStatus === "buffering"
            ? `buffering · ${epistemic?.shadowCount ?? telemetryBarrier?.shadowCount ?? 0} shadow`
            : telemetryStatus === "attach_pending"
              ? "await gateway attach"
              : gwOn && telemetryStatus === "idle"
                ? "standby · gateway ready"
                : telemetryStatus
    }
  ];

  return (
    <div
      className="pointer-events-auto fixed right-2 z-[61] max-w-[min(17rem,40vw)] rounded-xl border border-amber-400/35 bg-black/85 p-2 text-[9px] font-mono normal-case text-amber-50/90 shadow-lg backdrop-blur-md"
      style={{
        bottom: "calc(3.35rem + 6.25rem + env(safe-area-inset-bottom, 0px))"
      }}
      data-rhizoh-castle-layers-debug="1"
      data-tick={tick}
      data-collapsed={collapsed ? "1" : "0"}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-[8px] font-bold tracking-[0.18em] text-amber-200/80">CASTLE LAYERS</div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="shrink-0 rounded border border-amber-400/30 px-1.5 py-0.5 text-[7px] text-amber-100/80 hover:bg-amber-400/10"
          aria-expanded={!collapsed}
          title={collapsed ? "Expand layers HUD" : "Collapse layers HUD"}
        >
          {collapsed ? "+" : "−"}
        </button>
      </div>
      {collapsed ? (
        <div className="text-[7px] text-amber-100/65">
          {CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1} · {activeUiDomain} · gw={gw || "?"}
        </div>
      ) : (
        <>
      <div className="mb-1 text-[7px] text-amber-100/70">
        {CASTLE_LAYERS_BEHAVIOR_GRAPH_VERSION_V1} · ui={activeUiDomain}
        {streamLock?.active ? ` · lock=${String(streamLock.active.lockId).slice(0, 12)}` : " · lock=idle"}
        {sessionKeeper?.sessionStable ? " · gw=stable" : sessionKeeper?.voicePressure ? " · gw=defer" : ""}
      </div>
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
      {decisionTrace ? (
        <div className="mt-2 border-t border-amber-400/20 pt-1">
          <div className="text-[7px] font-bold tracking-[0.14em] text-amber-200/70">DECISION TRACE</div>
          <div className="text-[7px] text-white/60">
            {decisionTrace.traceId?.slice(0, 18)} · {decisionTrace.outcome}
            {decisionTrace.eventTag ? ` · ${decisionTrace.eventTag}` : ""}
          </div>
          {decisionTrace.primaryRejectReason ? (
            <div className="text-[7px] text-rose-300/90">
              reject: {decisionTrace.primaryRejectLayer} / {decisionTrace.primaryRejectReason}
            </div>
          ) : (
            <div className="text-[7px] text-emerald-300/80">eligible: execute</div>
          )}
          {decisionTrace.decisionPath?.length ? (
            <div className="mt-0.5 max-h-16 overflow-y-auto text-[6px] leading-tight text-white/45">
              {decisionTrace.decisionPath.map((s) => (
                <div key={`${s.layer}-${s.rule}`}>
                  {s.passed ? "✓" : "✗"} {s.rule} ({s.layer.slice(0, 2)})
                  {s.detail ? `: ${s.detail.slice(0, 40)}` : ""}
                </div>
              ))}
            </div>
          ) : null}
          {decisionTrace.scopeMismatchChain?.length ? (
            <div className="text-[6px] text-cyan-300/80">
              scope: {decisionTrace.scopeMismatchChain.map((c) => `${c.got}≠${c.expected}`).join(" · ")}
            </div>
          ) : null}
        </div>
      ) : null}
        </>
      )}
    </div>
  );
}
