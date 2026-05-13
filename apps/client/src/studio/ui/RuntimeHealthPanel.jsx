import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CASTLE_RUNTIME_MODULE_VERSIONS, CASTLE_RUNTIME_VERSION } from "../runtime/castleRuntimeVersion";

function StatusRow({ label, on, detail }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-black/25 px-2 py-1.5">
      <span className="text-[9px] text-white/75 normal-case">{label}</span>
      <span className={`flex items-center gap-1 text-[8px] ${on ? "text-emerald-200" : "text-amber-200"}`}>
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-300" : "bg-amber-300"}`} />
        {detail}
      </span>
    </div>
  );
}

export function RuntimeHealthPanel({ health, gatewayBaseUrl = "", workerInfraUrl = "" }) {
  const [infra, setInfra] = useState({ status: "unknown", score: 0, reasons: [], worker: null });
  const gatewayHealthUrl = useMemo(() => {
    const base = String(gatewayBaseUrl || "").trim();
    if (!base) return "/infra/health";
    return `${base.replace(/\/+$/, "")}/infra/health`;
  }, [gatewayBaseUrl]);

  useEffect(() => {
    let dead = false;
    const poll = async () => {
      try {
        const res = await fetch(gatewayHealthUrl, { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        if (dead) return;
        setInfra({
          status: String(data?.status || "unknown"),
          score: Number(data?.score || 0),
          reasons: Array.isArray(data?.reasons) ? data.reasons : [],
          worker: data?.worker || null
        });
      } catch {
        /* noop */
      }
    };
    poll();
    const id = window.setInterval(poll, 4000);
    return () => {
      dead = true;
      window.clearInterval(id);
    };
  }, [gatewayHealthUrl, workerInfraUrl]);

  return (
    <div className="space-y-2 rounded-xl border border-cyan-400/25 bg-cyan-950/15 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-black tracking-[0.24em] text-cyan-200/95">RUNTIME HEALTH</div>
        <div className="text-[8px] text-cyan-100/70">{CASTLE_RUNTIME_VERSION}</div>
      </div>
      <div className="grid gap-1.5">
        <StatusRow label="Gateway" on={health.gatewayConnected} detail={health.gatewayConnected ? "connected" : health.gatewayPhase} />
        <StatusRow label="Mesh" on={health.meshConnected} detail={health.meshConnected ? "connected" : "idle"} />
        <StatusRow label="World" on={health.worldActive} detail={health.worldActive ? "active" : "idle"} />
        <StatusRow label="Presence" on={health.presenceActive} detail={health.presenceActive ? "active" : "idle"} />
        <StatusRow label="Broadcast" on={health.broadcastLive} detail={health.broadcastLive ? "live" : "idle"} />
        <StatusRow label="Rhizoh" on={health.rhizohHeartbeat} detail={health.rhizohHeartbeat ? "heartbeat" : "cold"} />
        <StatusRow
          label="Studio tier"
          on={!health.studioDegraded}
          detail={
            health.studioTier
              ? `${String(health.studioTier)}${health.studioDetail ? ` · ${health.studioDetail}` : ""}`
              : "pending"
          }
        />
        <StatusRow label="Economy" on={health.economyHealthy} detail={health.economyHealthy ? "healthy" : "draining"} />
        <StatusRow label="Memory Pack" on={health.memoryFresh} detail={health.memoryFresh ? "fresh" : "stale"} />
        <StatusRow
          label="Determinism"
          on={infra.status !== "readonly"}
          detail={infra.status === "readonly" ? "readonly" : "stable"}
        />
      </div>
      <div className="rounded-md border border-white/10 bg-black/25 px-2 py-1.5 text-[8px] text-white/70 normal-case">
        HEALTH SCORE: {infra.score.toFixed(2)} · STATE: {String(infra.status || "unknown").toUpperCase()}
        {infra.reasons?.length ? ` · CAUSE: ${infra.reasons.join(",")}` : ""}
      </div>
      <div className="text-[8px] text-white/45 normal-case">
        RSK {CASTLE_RUNTIME_MODULE_VERSIONS.RSK_KERNEL} · World {CASTLE_RUNTIME_MODULE_VERSIONS.WORLD_OS} · Presence{" "}
        {CASTLE_RUNTIME_MODULE_VERSIONS.PRESENCE_OS} · Broadcast {CASTLE_RUNTIME_MODULE_VERSIONS.BROADCAST_OS} ·
        Attention {CASTLE_RUNTIME_MODULE_VERSIONS.ATTENTION_OS} · Rhizoh {CASTLE_RUNTIME_MODULE_VERSIONS.RHIZOH_OS} ·
        Product {CASTLE_RUNTIME_MODULE_VERSIONS.PRODUCT_SHELL}
      </div>
      <div className="border-t border-white/[0.06] pt-2">
        <Link
          to="/academy/observe"
          className="text-[8px] font-semibold uppercase tracking-[0.12em] text-violet-300/90 underline-offset-2 hover:text-violet-200 hover:underline"
        >
          Genesis Observe Live (SSE · replay · evolution)
        </Link>
      </div>
    </div>
  );
}
