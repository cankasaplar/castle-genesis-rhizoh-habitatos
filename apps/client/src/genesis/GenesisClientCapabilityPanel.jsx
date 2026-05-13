import React, { useEffect, useState } from "react";
import {
  getRuntimeClientCapabilitiesSnapshotV0,
  probeWebGpuAdapterResolvableV0
} from "./runtimeClientCapabilitiesV0.js";

function Row({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded border border-white/[0.06] bg-black/25 px-2 py-1">
      <span className="text-[8px] uppercase tracking-[0.16em] text-white/45">{k}</span>
      <span className="max-w-[70%] text-right font-mono text-[9px] text-white/80 normal-case">{String(v)}</span>
    </div>
  );
}

/** Observer-only: browser + build flags — not gateway authority. */
export function GenesisClientCapabilityPanel() {
  const [snap, setSnap] = useState(() => getRuntimeClientCapabilitiesSnapshotV0());
  const [webgpuAdapter, setWebgpuAdapter] = useState(/** @type {boolean | null} */ (null));

  useEffect(() => {
    const id = window.setInterval(() => setSnap(getRuntimeClientCapabilitiesSnapshotV0()), 8000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let dead = false;
    void probeWebGpuAdapterResolvableV0().then((ok) => {
      if (!dead) setWebgpuAdapter(ok);
    });
    return () => {
      dead = true;
    };
  }, []);

  const merged = { ...snap, webgpuAdapterResolved: webgpuAdapter };

  return (
    <div className="rounded-xl border border-slate-500/20 bg-slate-950/20 p-3">
      <div className="mb-2 text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-300/80">
        client capabilities
      </div>
      <p className="mb-2 text-[8px] leading-relaxed text-white/35 normal-case">
        Soft model — adapter null is not a protocol failure (mobile / observer nodes).
      </p>
      <div className="grid gap-1">
        <Row k="world_layer" v={merged.worldLayerEnabled ? "on" : "off"} />
        <Row k="cesium_mountable" v={merged.cesiumMountable ? "yes" : "no"} />
        <Row k="gateway_http" v={merged.gatewayHttpConfigured ? "configured" : "missing"} />
        <Row k="gateway_ws" v={merged.gatewayWsConfigured ? "configured" : "missing"} />
        <Row k="webgl / webgl2" v={`${merged.webgl} / ${merged.webgl2}`} />
        <Row k="webgpu_api" v={merged.webgpuApiPresent ? "present" : "absent"} />
        <Row k="webgpu_adapter" v={webgpuAdapter == null ? "pending" : webgpuAdapter ? "available" : "none"} />
      </div>
    </div>
  );
}
