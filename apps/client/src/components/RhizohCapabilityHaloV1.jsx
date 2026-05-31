import React, { useCallback, useMemo, useState } from "react";
import {
  RHIZOH_CAPABILITY_HALO_NODES_V1,
  RHIZOH_CAPABILITY_HALO_INTRO_WHISPER,
  RHIZOH_ROBOTICS_DEVICE_CHIPS_V1,
  RHIZOH_LIBRARY_ROUTE_V1
} from "../kernel/visual/rhizohCapabilityHaloConfigV1.js";

const RING_R = 118;
const NODE_COUNT = RHIZOH_CAPABILITY_HALO_NODES_V1.length;

/** Capability Wheel — cognition-only (layerFocus + seedIntent). Navigation = Product Bar. */
export function RhizohCapabilityHaloV1({
  onSeedIntent,
  onFocusLayer,
  collectivePulse = 1,
  className = ""
}) {
  const [hoverId, setHoverId] = useState(null);
  const [roboticsOpen, setRoboticsOpen] = useState(false);
  const [deviceHoverId, setDeviceHoverId] = useState(null);

  const whisper = useMemo(() => {
    if (deviceHoverId) {
      const d = RHIZOH_ROBOTICS_DEVICE_CHIPS_V1.find((x) => x.id === deviceHoverId);
      return d?.whisper || RHIZOH_CAPABILITY_HALO_INTRO_WHISPER;
    }
    if (hoverId === "library") return RHIZOH_LIBRARY_ROUTE_V1.whisper;
    if (!hoverId) return RHIZOH_CAPABILITY_HALO_INTRO_WHISPER;
    const n = RHIZOH_CAPABILITY_HALO_NODES_V1.find((x) => x.id === hoverId);
    return n?.whisper || RHIZOH_CAPABILITY_HALO_INTRO_WHISPER;
  }, [hoverId, deviceHoverId]);

  const handleNodeEnter = useCallback((node) => {
    setHoverId(node.id);
    if (node.isRoboticsHub) setRoboticsOpen(true);
    else setRoboticsOpen(false);
    setDeviceHoverId(null);
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoverId(null);
    setDeviceHoverId(null);
  }, []);

  const applyNode = useCallback(
    (node) => {
      if (node.layerFocus != null && onFocusLayer) {
        onFocusLayer(node.layerFocus);
      }
      if (node.seedIntent && onSeedIntent) {
        onSeedIntent(node.seedIntent);
      }
      if (node.isRoboticsHub) {
        setRoboticsOpen(true);
        if (onFocusLayer) onFocusLayer(13);
      }
    },
    [onFocusLayer, onSeedIntent]
  );

  const scaleBreath = 0.96 + collectivePulse * 0.04;

  return (
    <div className={`relative mx-auto flex flex-col items-center ${className}`} data-rhizoh-capability-halo="1">
      <div
        className="pointer-events-none absolute -inset-8 rounded-full opacity-[0.14] blur-2xl transition-transform duration-[2.8s] ease-in-out"
        style={{
          background: `radial-gradient(circle at 50% 45%, rgba(34,211,238,0.5) 0%, transparent 62%)`,
          transform: `scale(${scaleBreath})`
        }}
      />
      <div
        className="relative mb-2 min-h-[3.25rem] max-w-[min(36rem,92vw)] rounded-2xl border border-cyan-400/25 bg-black/55 px-4 py-2.5 text-center backdrop-blur-md pointer-events-none"
        style={{ boxShadow: "0 0 40px rgba(34,211,238,0.08)" }}
      >
        <div className="text-[8px] tracking-[0.28em] text-cyan-300/80 mb-1">RHIZOH · CAPABILITY WHISPER</div>
        <div className="text-[11px] font-medium normal-case leading-snug text-cyan-50/95">{whisper}</div>
      </div>

      <div
        className="relative h-[256px] w-[min(100%,400px)]"
        onMouseLeave={() => {
          handleNodeLeave();
          setRoboticsOpen(false);
        }}
      >
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/80 shadow-[0_0_24px_rgba(34,211,238,0.7)]" />
        {RHIZOH_CAPABILITY_HALO_NODES_V1.map((node, i) => {
          const deg = (360 / NODE_COUNT) * i - 90;
          const rad = (deg * Math.PI) / 180;
          const x = Math.cos(rad) * RING_R;
          const y = Math.sin(rad) * RING_R;
          const active = hoverId === node.id;
          return (
            <button
              key={node.id}
              type="button"
              className={`absolute left-1/2 top-1/2 w-[4.5rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-1.5 py-2 text-[8px] font-black tracking-[0.12em] transition-all normal-case pointer-events-auto ${
                active
                  ? "border-cyan-300/80 bg-cyan-400/20 text-white shadow-[0_0_28px_rgba(34,211,238,0.35)] scale-105 z-10"
                  : "border-white/20 bg-black/40 text-white/80 hover:border-cyan-400/45 hover:bg-cyan-400/10"
              }`}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              onMouseEnter={() => handleNodeEnter(node)}
              onFocus={() => handleNodeEnter(node)}
              onBlur={handleNodeLeave}
              onClick={() => applyNode(node)}
            >
              {node.label}
            </button>
          );
        })}

        <button
          type="button"
          className="absolute left-1/2 top-[82%] w-[4.8rem] -translate-x-1/2 rounded-2xl border border-amber-300/40 bg-amber-400/15 px-1.5 py-1.5 text-[7px] font-black tracking-[0.1em] text-amber-100/95 normal-case pointer-events-auto hover:bg-amber-400/25"
          onMouseEnter={() => {
            setHoverId("library");
            setRoboticsOpen(false);
            setDeviceHoverId(null);
          }}
          onClick={() => {
            if (onSeedIntent) onSeedIntent(RHIZOH_LIBRARY_ROUTE_V1.seedIntent);
          }}
        >
          Library
        </button>
      </div>

      {roboticsOpen ? (
        <div className="mt-1 flex max-w-[min(36rem,94vw)] flex-wrap justify-center gap-1.5 pointer-events-auto">
          {RHIZOH_ROBOTICS_DEVICE_CHIPS_V1.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`rounded-full border px-2.5 py-1 text-[8px] font-bold tracking-wide normal-case transition-colors ${
                deviceHoverId === d.id
                  ? "border-fuchsia-300/70 bg-fuchsia-500/25 text-fuchsia-50"
                  : "border-white/20 bg-black/35 text-white/75 hover:border-fuchsia-400/50"
              }`}
              onMouseEnter={() => {
                setDeviceHoverId(d.id);
                setHoverId("robotics");
              }}
              onClick={() => {
                if (onFocusLayer) onFocusLayer(13);
                if (onSeedIntent) onSeedIntent(d.seedIntent);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
