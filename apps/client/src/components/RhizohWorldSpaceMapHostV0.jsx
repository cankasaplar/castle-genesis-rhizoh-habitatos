import React, { memo, useEffect, useRef, useState } from "react";
import CesiumRealMapLayer from "../castleFlight/CesiumRealMapLayer.jsx";
import { RHIZOH_SPATIAL_RENDER_MODE_V0 } from "../rhizoh/runtime/spatialBootGateV0.js";
import {
  routeSymbyoMapInteractionToOrchestratorV0,
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  SYMBYO_MAP_INTERACTION_V0
} from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";
import {
  readWorldMapClaimModeV0,
  writeWorldMapClaimModeV0
} from "../rhizoh/runtime/worldMapClaimModeV0.js";
import {
  createLocalGhostCastleAnchorV0,
  LOCAL_GHOST_CASTLE_EVENT_V0,
  readLocalGhostCastleAnchorsV0
} from "../rhizoh/runtime/localGhostCastleAnchorV0.js";

export { RHIZOH_V11_MAP_INTENT_EVENT_V0 };

import {
  SOVEREIGN_MAP_DEFAULT_HOME_V0,
  SOVEREIGN_TOWER_GRAPH_EDGES_V0,
  SOVEREIGN_WORLD_MAP_NODES_V0,
  sovereignNodeIconHtmlV0
} from "../rhizoh/runtime/sovereignWorldMapNodesV0.js";

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
    className: "rhizoh-sovereign-node-icon",
    html: sovereignNodeIconHtmlV0(node),
    iconSize: [96, 52],
    iconAnchor: [48, 26]
  });
}

function emitV11MapIntentV0(node, interaction) {
  const routed = routeSymbyoMapInteractionToOrchestratorV0({ node, interaction });
  const detail = Object.freeze({
    ...routed,
    nodeView: Object.freeze({
      id: node.id,
      label: node.label,
      name: node.name,
      type: node.type,
      color: node.color,
      lat: node.lat,
      lon: node.lon,
      description: node.description,
      provider: node.provider
    })
  });
  if (typeof window !== "undefined") {
    try {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.v11MapLastIntent = detail;
      window.dispatchEvent(
        new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, {
          detail
        })
      );
      document.dispatchEvent(
        new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, {
          detail
        })
      );
    } catch {
      /* noop */
    }
  }
  return detail;
}

function handleV11MapClickForClaimV0(ev) {
  if (!readWorldMapClaimModeV0()) return false;
  const latlng = ev?.latlng;
  if (!Number.isFinite(latlng?.lat) || !Number.isFinite(latlng?.lng)) return false;
  createLocalGhostCastleAnchorV0({
    lat: latlng.lat,
    lon: latlng.lng,
    label: `Castle · ${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)}`
  });
  writeWorldMapClaimModeV0(false);
  return true;
}

function leafletTileUrlForToolV0(activeMapTool) {
  const tool = String(activeMapTool || "city_map");
  if (tool === "satellite") {
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  }
  if (tool === "streets") {
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  }
  return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
}

function V11CoreMapLayerV0({ activeMapTool = "city_map" }) {
  const mapRef = useRef(null);
  const hostRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const graphLayerRef = useRef(null);
  const nodeById = useRef(new Map(SOVEREIGN_WORLD_MAP_NODES_V0.map((n) => [n.id, n])));
  const [leafletReady, setLeafletReady] = useState(false);
  const [localAnchors, setLocalAnchors] = useState(() => readLocalGhostCastleAnchorsV0());

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
        }).setView(
          [SOVEREIGN_MAP_DEFAULT_HOME_V0.lat, SOVEREIGN_MAP_DEFAULT_HOME_V0.lon],
          SOVEREIGN_MAP_DEFAULT_HOME_V0.zoom
        );
        tileLayerRef.current = L.tileLayer(leafletTileUrlForToolV0(activeMapTool), {
          maxZoom: 18
        }).addTo(map);
        map.on("click", (ev) => handleV11MapClickForClaimV0(ev));
        markerLayerRef.current = L.layerGroup().addTo(map);
        graphLayerRef.current = L.layerGroup().addTo(map);
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
      markerLayerRef.current = null;
      graphLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onAnchor = () => setLocalAnchors(readLocalGhostCastleAnchorsV0());
    window.addEventListener(LOCAL_GHOST_CASTLE_EVENT_V0, onAnchor);
    return () => window.removeEventListener(LOCAL_GHOST_CASTLE_EVENT_V0, onAnchor);
  }, []);

  useEffect(() => {
    const L = typeof window !== "undefined" ? window.L : null;
    if (!L?.marker || !mapRef.current || !leafletReady) return;
    try {
      markerLayerRef.current?.clearLayers?.();
      if (!markerLayerRef.current) markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
      const localNodes = localAnchors.map((anchor) => ({
        id: anchor.id,
        label: anchor.label || "CASTLE",
        type: "castle",
        lat: anchor.lat,
        lon: anchor.lon,
        color: "#22c55e"
      }));
      for (const node of [...SOVEREIGN_WORLD_MAP_NODES_V0, ...localNodes]) {
        const marker = L.marker([node.lat, node.lon], {
          icon: createLeafletNodeIconV0(L, node),
          keyboard: false,
          title: node.name || node.label
        }).addTo(markerLayerRef.current);
        marker.on("click", (ev) => {
          try {
            ev?.originalEvent?.stopPropagation?.();
          } catch {
            /* noop */
          }
          emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.CLICK);
        });
        marker.on("mouseover", () => emitV11MapIntentV0(node, SYMBYO_MAP_INTERACTION_V0.HOVER));
      }

      graphLayerRef.current?.clearLayers?.();
      for (const edge of SOVEREIGN_TOWER_GRAPH_EDGES_V0) {
        const n1 = nodeById.current.get(edge.source);
        const n2 = nodeById.current.get(edge.target);
        if (!n1 || !n2) continue;
        L.polyline(
          [
            [n1.lat, n1.lon],
            [n2.lat, n2.lon]
          ],
          { color: "#a855f7", weight: 1, opacity: 0.18, dashArray: "5, 10" }
        ).addTo(graphLayerRef.current);
      }
    } catch {
      /* noop */
    }
  }, [leafletReady, localAnchors]);

  useEffect(() => {
    const L = typeof window !== "undefined" ? window.L : null;
    if (!L?.tileLayer || !mapRef.current || !leafletReady) return;
    try {
      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }
      tileLayerRef.current = L.tileLayer(leafletTileUrlForToolV0(activeMapTool), {
        maxZoom: 18
      }).addTo(mapRef.current);
    } catch {
      /* noop */
    }
  }, [activeMapTool, leafletReady]);

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
        RHIZOH SOVEREIGN MAP V11 · {SOVEREIGN_WORLD_MAP_NODES_V0.length} nodes
      </div>
      <style>{`
        [data-rhizoh-v11-leaflet-host="1"] .leaflet-container { background: #000 !important; cursor: crosshair !important; }
        [data-rhizoh-v11-leaflet-host="1"] .leaflet-tile-pane {
          filter: invert(100%) hue-rotate(180deg) brightness(0.35) contrast(1.5);
        }
      `}</style>
      {!leafletReady ? SOVEREIGN_WORLD_MAP_NODES_V0.map((node) => {
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

function renderFallbackForModeV0(renderMode, activeMapTool) {
  if (renderMode === RHIZOH_SPATIAL_RENDER_MODE_V0.EMPTY_CANVAS) return <EmptyCanvasV0 />;
  if (renderMode === RHIZOH_SPATIAL_RENDER_MODE_V0.SAFE_WORLD_SHELL) return <SafeWorldShellV0 />;
  return <V11CoreMapLayerV0 activeMapTool={activeMapTool} />;
}

/**
 * World · Space map substrate — Cesium mounts only on /world/space, never on T0 live (/).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */
export const RhizohWorldSpaceMapHostV0 = memo(function RhizohWorldSpaceMapHostV0({
  active,
  renderMode = RHIZOH_SPATIAL_RENDER_MODE_V0.V11_CORE_MAP,
  activeMapTool = "city_map"
}) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[11]"
      data-rhizoh-world-space-map-host="1"
      data-rhizoh-world-space-map-active={active ? "1" : "0"}
      data-rhizoh-world-space-render-mode={renderMode}
    >
      {active ? <CesiumRealMapLayer active /> : renderFallbackForModeV0(renderMode, activeMapTool)}
    </div>
  );
});
