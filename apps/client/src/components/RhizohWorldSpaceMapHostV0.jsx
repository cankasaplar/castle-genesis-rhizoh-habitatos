import React, { memo, useEffect, useRef, useState } from "react";
import CesiumRealMapLayer from "../castleFlight/CesiumRealMapLayer.jsx";
import { RHIZOH_SPATIAL_RENDER_MODE_V0 } from "../rhizoh/runtime/spatialBootGateV0.js";
import {
  routeSymbyoMapInteractionToOrchestratorV0,
  SYMBYO_MAP_INTERACTION_V0
} from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";

export const RHIZOH_V11_MAP_INTENT_EVENT_V0 = "rhizoh:v11-map-intent-v0";

const V11_CORE_MAP_NODES_V0 = Object.freeze([
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

function projectV11CoreMapGeoV0(lat, lon) {
  const x = ((Number(lon) + 180) / 360) * 100;
  const clampedLat = Math.max(-70, Math.min(70, Number(lat)));
  const y = ((70 - clampedLat) / 140) * 100;
  return {
    left: `${Math.max(4, Math.min(96, x))}%`,
    top: `${Math.max(8, Math.min(88, y))}%`
  };
}

const LEAFLET_CSS_URL_V0 = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL_V0 = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
let leafletLoadPromiseV0 = null;

function loadLeafletV0() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.L?.map) return Promise.resolve(window.L);
  if (leafletLoadPromiseV0) return leafletLoadPromiseV0;
  leafletLoadPromiseV0 = new Promise((resolve) => {
    try {
      if (!document.querySelector(`link[href="${LEAFLET_CSS_URL_V0}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS_URL_V0;
        document.head.appendChild(link);
      }
      const existing = document.querySelector(`script[src="${LEAFLET_JS_URL_V0}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.L || null), { once: true });
        existing.addEventListener("error", () => resolve(null), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = LEAFLET_JS_URL_V0;
      script.async = true;
      script.onload = () => resolve(window.L || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    } catch {
      resolve(null);
    }
  });
  return leafletLoadPromiseV0;
}

function createLeafletNodeIconV0(L, node) {
  return L.divIcon({
    className: "rhizoh-v11-core-node-icon",
    html: `<div data-rhizoh-v11-leaflet-node="${node.id}" style="display:flex;width:96px;min-height:42px;flex-direction:column;align-items:center;justify-content:center;color:${node.color};font-family:monospace;pointer-events:auto;cursor:pointer">
      <div style="width:12px;height:12px;border-radius:999px;border:1px solid ${node.color};background:#020617;box-shadow:0 0 18px ${node.color}"></div>
      <div style="margin-top:4px;background:rgba(0,0,0,.62);padding:1px 5px;border-radius:4px;font-size:8px;font-weight:800;letter-spacing:.08em;white-space:nowrap">${node.label}</div>
    </div>`,
    iconSize: [96, 42],
    iconAnchor: [48, 21]
  });
}

function emitV11MapIntentV0(node, interaction) {
  const routed = routeSymbyoMapInteractionToOrchestratorV0({ node, interaction });
  if (typeof window !== "undefined") {
    try {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.v11MapLastIntent = routed;
      window.dispatchEvent(
        new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, {
          detail: routed
        })
      );
    } catch {
      /* noop */
    }
  }
  return routed;
}

function V11CoreMapLayerV0() {
  const mapRef = useRef(null);
  const hostRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map = null;
    void loadLeafletV0().then((L) => {
      if (cancelled || !L || !hostRef.current || mapRef.current) return;
      try {
        map = L.map(hostRef.current, {
          zoomControl: false,
          attributionControl: false,
          worldCopyJump: true,
          preferCanvas: true
        }).setView([20, 0], 2);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          maxZoom: 18
        }).addTo(map);
        for (const node of V11_CORE_MAP_NODES_V0) {
          const marker = L.marker([node.lat, node.lon], {
            icon: createLeafletNodeIconV0(L, node),
            keyboard: false,
            title: node.label
          }).addTo(map);
          marker.on("click", () => emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.CLICK));
          marker.on("mouseover", () => emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.HOVER));
        }
        mapRef.current = map;
        setLeafletReady(true);
        setTimeout(() => {
          try {
            map.invalidateSize();
          } catch {
            /* noop */
          }
        }, 80);
      } catch {
        setLeafletReady(false);
      }
    });
    return () => {
      cancelled = true;
      try {
        mapRef.current?.remove?.();
      } catch {
        /* noop */
      }
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(8,47,73,0.48),rgba(1,1,8,0.98)_68%)]"
      data-rhizoh-v11-core-map-layer="1"
      data-rhizoh-v11-leaflet-ready={leafletReady ? "1" : "0"}
      aria-label="Rhizoh Primary Spatial Surface V11"
    >
      <div ref={hostRef} className="pointer-events-auto absolute inset-0 z-[1]" data-rhizoh-v11-leaflet-host="1" />
      <div className="absolute inset-x-[8%] top-[18%] h-px bg-cyan-300/10" />
      <div className="absolute inset-x-[8%] top-[42%] h-px bg-cyan-300/10" />
      <div className="absolute inset-x-[8%] top-[66%] h-px bg-cyan-300/10" />
      <div className="absolute inset-y-[12%] left-[25%] w-px bg-cyan-300/10" />
      <div className="absolute inset-y-[12%] left-[50%] w-px bg-cyan-300/10" />
      <div className="absolute inset-y-[12%] left-[75%] w-px bg-cyan-300/10" />
      <div className="absolute left-4 top-4 rounded-xl border border-cyan-400/25 bg-black/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-100/80">
        RHIZOH PRIMARY SPATIAL SURFACE V11
      </div>
      {!leafletReady ? V11_CORE_MAP_NODES_V0.map((node) => {
        const pos = projectV11CoreMapGeoV0(node.lat, node.lon);
        return (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ ...pos, color: node.color }}
            data-rhizoh-v11-node={node.id}
            data-rhizoh-v11-node-type={node.type}
            onClick={() => emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.CLICK)}
            onMouseEnter={() => emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.HOVER)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.CLICK);
              }
            }}
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
      }) : null}
    </div>
  );
}

function EmptyCanvasV0() {
  return (
    <div
      className="absolute inset-0 bg-[#010103]"
      data-rhizoh-spatial-empty-canvas="1"
      aria-label="Rhizoh spatial empty canvas"
    />
  );
}

function SafeWorldShellV0() {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.55),rgba(1,1,8,0.98)_70%)]"
      data-rhizoh-spatial-safe-world-shell="1"
      aria-label="Rhizoh safe world shell"
    >
      <div className="absolute left-1/2 top-1/2 h-[42vmin] w-[42vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.025]" />
      <div className="absolute left-4 top-4 rounded-xl border border-white/10 bg-black/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
        SAFE WORLD SHELL
      </div>
    </div>
  );
}

function renderFallbackForModeV0(renderMode) {
  if (renderMode === RHIZOH_SPATIAL_RENDER_MODE_V0.EMPTY_CANVAS) return <EmptyCanvasV0 />;
  if (renderMode === RHIZOH_SPATIAL_RENDER_MODE_V0.SAFE_WORLD_SHELL) return <SafeWorldShellV0 />;
  return <V11CoreMapLayerV0 />;
}

/**
 * World · Space map substrate — Cesium mounts only on /world/space, never on T0 live (/).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */
export const RhizohWorldSpaceMapHostV0 = memo(function RhizohWorldSpaceMapHostV0({
  active,
  renderMode = RHIZOH_SPATIAL_RENDER_MODE_V0.V11_CORE_MAP
}) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[11]"
      data-rhizoh-world-space-map-host="1"
      data-rhizoh-world-space-map-active={active ? "1" : "0"}
      data-rhizoh-world-space-render-mode={renderMode}
    >
      {active ? <CesiumRealMapLayer active /> : renderFallbackForModeV0(renderMode)}
    </div>
  );
});
