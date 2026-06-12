import React, { memo } from "react";
import CesiumRealMapLayer from "../castleFlight/CesiumRealMapLayer.jsx";

const V11_FALLBACK_NODES_V0 = Object.freeze([
  { id: "rhizoh", label: "RHIZOH", type: "core", lat: 41.045, lon: 29.006, color: "#22d3ee" },
  { id: "ghost", label: "GHOST", type: "ghost", lat: 41.047, lon: 29.008, color: "#a855f7" },
  { id: "gemini_tower", label: "GEMINI", type: "tower", lat: 37.422, lon: -122.0841, color: "#d946ef" },
  { id: "claude_tower", label: "CLAUDE", type: "tower", lat: 37.7749, lon: -122.4194, color: "#3b82f6" },
  { id: "chatgpt_tower", label: "OPENAI", type: "tower", lat: 37.7624, lon: -122.4148, color: "#10b981" },
  { id: "deepmind_tower", label: "DEEPMIND", type: "tower", lat: 51.5303, lon: -0.1245, color: "#06b6d4" },
  { id: "mistral_tower", label: "MISTRAL", type: "tower", lat: 48.8566, lon: 2.3522, color: "#f97316" },
  { id: "kyoto_tower", label: "KYOTO", type: "tower", lat: 35.0116, lon: 135.7681, color: "#eab308" },
  { id: "sora_tower", label: "SORA", type: "tower", lat: 34.0522, lon: -118.2437, color: "#ec4899" }
]);

function projectFallbackGeoV0(lat, lon) {
  const x = ((Number(lon) + 180) / 360) * 100;
  const clampedLat = Math.max(-70, Math.min(70, Number(lat)));
  const y = ((70 - clampedLat) / 140) * 100;
  return {
    left: `${Math.max(4, Math.min(96, x))}%`,
    top: `${Math.max(8, Math.min(88, y))}%`
  };
}

function V11FallbackMapV0() {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(8,47,73,0.48),rgba(1,1,8,0.98)_68%)]"
      data-rhizoh-v11-map-fallback="1"
      aria-label="Rhizoh v11 safe world map"
    >
      <div className="absolute inset-x-[8%] top-[18%] h-px bg-cyan-300/10" />
      <div className="absolute inset-x-[8%] top-[42%] h-px bg-cyan-300/10" />
      <div className="absolute inset-x-[8%] top-[66%] h-px bg-cyan-300/10" />
      <div className="absolute inset-y-[12%] left-[25%] w-px bg-cyan-300/10" />
      <div className="absolute inset-y-[12%] left-[50%] w-px bg-cyan-300/10" />
      <div className="absolute inset-y-[12%] left-[75%] w-px bg-cyan-300/10" />
      <div className="absolute left-4 top-4 rounded-xl border border-cyan-400/25 bg-black/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-100/80">
        RHIZOH V11 SAFE MAP
      </div>
      {V11_FALLBACK_NODES_V0.map((node) => {
        const pos = projectFallbackGeoV0(node.lat, node.lon);
        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ ...pos, color: node.color }}
            data-rhizoh-v11-node={node.id}
            data-rhizoh-v11-node-type={node.type}
          >
            <div
              className="h-3 w-3 rounded-full border bg-black shadow-[0_0_18px_currentColor]"
              style={{ borderColor: node.color }}
            />
            <div className="mt-1 whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider">
              {node.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * World · Space map substrate — Cesium mounts only on /world/space, never on T0 live (/).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */
export const RhizohWorldSpaceMapHostV0 = memo(function RhizohWorldSpaceMapHostV0({ active }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[11]"
      data-rhizoh-world-space-map-host="1"
      data-rhizoh-world-space-map-active={active ? "1" : "0"}
    >
      {!active ? <V11FallbackMapV0 /> : null}
      <CesiumRealMapLayer active={active} />
    </div>
  );
});
