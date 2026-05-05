import React from "react";
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

export function RuntimeHealthPanel({ health }) {
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
        <StatusRow label="Economy" on={health.economyHealthy} detail={health.economyHealthy ? "healthy" : "draining"} />
        <StatusRow label="Memory Pack" on={health.memoryFresh} detail={health.memoryFresh ? "fresh" : "stale"} />
      </div>
      <div className="text-[8px] text-white/45 normal-case">
        RSK {CASTLE_RUNTIME_MODULE_VERSIONS.RSK_KERNEL} · World {CASTLE_RUNTIME_MODULE_VERSIONS.WORLD_OS} · Presence {CASTLE_RUNTIME_MODULE_VERSIONS.PRESENCE_OS} · Broadcast {CASTLE_RUNTIME_MODULE_VERSIONS.BROADCAST_OS} · Attention {CASTLE_RUNTIME_MODULE_VERSIONS.ATTENTION_OS} · Rhizoh {CASTLE_RUNTIME_MODULE_VERSIONS.RHIZOH_OS} · Product {CASTLE_RUNTIME_MODULE_VERSIONS.PRODUCT_SHELL}
      </div>
    </div>
  );
}
