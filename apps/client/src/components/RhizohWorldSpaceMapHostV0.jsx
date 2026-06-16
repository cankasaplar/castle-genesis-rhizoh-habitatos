import React, { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import CesiumRealMapLayer from "../castleFlight/CesiumRealMapLayer.jsx";
import { RHIZOH_SPATIAL_RENDER_MODE_V0 } from "../rhizoh/runtime/spatialBootGateV0.js";
import {
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0
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
import { createCastleWorldAnchorV0 } from "../castleFlight/castleWorldAnchorV0.js";
import {
  readCastleNexusGeoV0,
  resolveUserCastleGeoForMapViewV0
} from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";

import { dispatchV11MapEventPinV0 } from "../rhizoh/runtime/mapEventPinDispatchV0.js";
import { RhizohCatchUpCascadeOverlayV0 } from "./RhizohCatchUpCascadeOverlayV0.jsx";
import { RhizohSpiralMMOMapAwakeningOverlayV0 } from "./RhizohSpiralMMOMapAwakeningOverlayV0.jsx";
import { RhizohN12PersistenceGateV0 } from "./RhizohN12PersistenceGateV0.jsx";
import { RhizohCodexEventStreamV0 } from "./RhizohCodexEventStreamV0.jsx";
import { RhizohOfflineVoidOverlayV0 } from "./RhizohOfflineVoidOverlayV0.jsx";

export { RHIZOH_V11_MAP_INTENT_EVENT_V0, RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0 };

import {
  SOVEREIGN_MAP_DEFAULT_HOME_V0,
  SOVEREIGN_TOWER_GRAPH_EDGES_V0,
  buildRemoteCastleMapNodesV0,
  listSovereignWorldMapNodesForViewV0,
  RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1,
  sovereignNodeIconHtmlV0,
  writeSovereignPortalCoordsV0
} from "../rhizoh/runtime/sovereignWorldMapNodesV0.js";
import {
  getLiveMatchMapPinsV0,
  RHIZOH_LIVE_MATCH_PINS_EVENT_V0
} from "../rhizoh/runtime/worldMapLiveMatchPinsV0.js";
import {
  listCastlePresenceV0,
  mergeRemoteCastlesWithNetworkPresenceV0,
  subscribeCastlePresenceV0
} from "../rhizoh/runtime/castlePresenceRegistryV0.js";

function readPresenceCountSnapshotV0() {
  return listCastlePresenceV0().length;
}

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
  const isSpiral = node?.type === "spiralmmo";
  return L.divIcon({
    className: "rhizoh-sovereign-node-icon",
    html: sovereignNodeIconHtmlV0(node),
    iconSize: isSpiral ? [32, 32] : [96, 52],
    iconAnchor: isSpiral ? [16, 16] : [48, 26]
  });
}

function emitV11MapClearPreviewV0() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0));
    document.dispatchEvent(new CustomEvent(RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0));
  } catch {
    /* noop */
  }
}

function handleV11MapClickForClaimV0(ev) {
  const latlng = ev?.latlng;
  if (!Number.isFinite(latlng?.lat) || !Number.isFinite(latlng?.lng)) return false;

  const init = typeof window !== "undefined" ? window.__CASTLE_INIT__ : null;
  if (init?.pendingMapPick) {
    createCastleWorldAnchorV0({
      lat: latlng.lat,
      lon: latlng.lng,
      label: `Castle · ${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)}`,
      source: "map_pick"
    });
    writeWorldMapClaimModeV0(false);
    return true;
  }

  if (!readWorldMapClaimModeV0()) return false;
  createLocalGhostCastleAnchorV0({
    lat: latlng.lat,
    lon: latlng.lng,
    label: `Castle · ${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)}`
  });
  writeWorldMapClaimModeV0(false);
  return true;
}

function leafletTilePaneFilterCssV0(activeMapTool) {
  const tool = String(activeMapTool || "city_map");
  if (tool === "satellite") {
    return "filter: brightness(0.94) contrast(1.06) saturate(1.08);";
  }
  if (tool === "streets") {
    return "filter: invert(100%) hue-rotate(180deg) brightness(0.42) contrast(1.35);";
  }
  return "filter: invert(100%) hue-rotate(180deg) brightness(0.35) contrast(1.5);";
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

function V11CoreMapLayerV0({ activeMapTool = "city_map", remoteCastles = [], remoteCastlesVisible = false }) {
  const mapRef = useRef(null);
  const hostRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const graphLayerRef = useRef(null);
  const portalMarkerRef = useRef(null);
  const boundsFittedRef = useRef(false);
  const [userCastleGeo, setUserCastleGeo] = useState(() => resolveUserCastleGeoForMapViewV0());
  const presenceCountV0 = useSyncExternalStore(
    subscribeCastlePresenceV0,
    readPresenceCountSnapshotV0,
    () => 0
  );
  const mergedRemoteCastles = useMemo(
    () => mergeRemoteCastlesWithNetworkPresenceV0(remoteCastles, listCastlePresenceV0()),
    [remoteCastles, presenceCountV0]
  );
  const [liveMatchPins, setLiveMatchPins] = useState(() => getLiveMatchMapPinsV0());

  useEffect(() => {
    const onPins = (ev) => setLiveMatchPins(ev?.detail?.pins || getLiveMatchMapPinsV0());
    window.addEventListener(RHIZOH_LIVE_MATCH_PINS_EVENT_V0, onPins);
    return () => window.removeEventListener(RHIZOH_LIVE_MATCH_PINS_EVENT_V0, onPins);
  }, []);

  const displayNodes = useMemo(
    () => [...listSovereignWorldMapNodesForViewV0({ userCastle: userCastleGeo }), ...liveMatchPins],
    [userCastleGeo, liveMatchPins]
  );
  const remoteNodes = useMemo(
    () => (remoteCastlesVisible ? buildRemoteCastleMapNodesV0(mergedRemoteCastles) : []),
    [mergedRemoteCastles, remoteCastlesVisible]
  );
  const nodeById = useRef(new Map(displayNodes.map((n) => [n.id, n])));
  const [leafletReady, setLeafletReady] = useState(false);
  const [localAnchors, setLocalAnchors] = useState(() => readLocalGhostCastleAnchorsV0());

  useEffect(() => {
    let cancelled = false;
    let map = null;
    void loadLeafletV0().then((L) => {
      if (cancelled || !L || !hostRef.current || mapRef.current) return;
      try {
        map = L.map(hostRef.current, {
          zoomControl: true,
          attributionControl: false,
          worldCopyJump: true,
          preferCanvas: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          minZoom: 2,
          maxZoom: 18
        });
        const nexus = readCastleNexusGeoV0();
        if (nexus) {
          map.setView([nexus.lat, nexus.lon], 15);
        } else {
          map.setView([20, 0], 3);
        }
        tileLayerRef.current = L.tileLayer(leafletTileUrlForToolV0(activeMapTool), {
          maxZoom: 18
        }).addTo(map);
        map.on("click", (ev) => handleV11MapClickForClaimV0(ev));
        const onMapDismissPreview = () => emitV11MapClearPreviewV0();
        map.on("movestart", onMapDismissPreview);
        map.on("zoomstart", onMapDismissPreview);
        map.on("dragstart", onMapDismissPreview);
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
    const onCastle = () => setUserCastleGeo(resolveUserCastleGeoForMapViewV0());
    window.addEventListener(LOCAL_GHOST_CASTLE_EVENT_V0, onAnchor);
    window.addEventListener("castle:castle-create-v0", onCastle);
    return () => {
      window.removeEventListener(LOCAL_GHOST_CASTLE_EVENT_V0, onAnchor);
      window.removeEventListener("castle:castle-create-v0", onCastle);
    };
  }, []);

  useEffect(() => {
    const onWarp = (ev) => {
      const detail = ev?.detail;
      const lat = Number(detail?.lat);
      const lon = Number(detail?.lon);
      const zoom = Number(detail?.zoom) || 14;
      if (!mapRef.current || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
      try {
        mapRef.current.flyTo([lat, lon], zoom, { animate: true, duration: 2.5 });
      } catch {
        /* noop */
      }
    };
    window.addEventListener(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, onWarp);
    return () => window.removeEventListener(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, onWarp);
  }, []);

  useEffect(() => {
    if (!leafletReady || !portalMarkerRef.current) return undefined;
    if (userCastleGeo) return undefined;
    if (!("geolocation" in navigator)) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          portalMarkerRef.current?.setLatLng?.([latitude, longitude]);
        } catch {
          /* noop */
        }
        writeSovereignPortalCoordsV0(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [leafletReady, userCastleGeo]);

  useEffect(() => {
    const L = typeof window !== "undefined" ? window.L : null;
    if (!L?.marker || !mapRef.current || !leafletReady) return;
    try {
      nodeById.current = new Map(displayNodes.map((n) => [n.id, n]));
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
      const hasUserCastle = displayNodes.some((n) => n.id === "my_castle");
      const extraLocal = hasUserCastle ? [] : localNodes;
      const allNodes = [...displayNodes, ...extraLocal, ...remoteNodes];
      for (const node of allNodes) {
        const marker = L.marker([node.lat, node.lon], {
          icon: createLeafletNodeIconV0(L, node),
          keyboard: false,
          title: node.name || node.label,
          zIndexOffset:
            node.id === "my_castle"
              ? 900
              : node.type === "remote_castle"
                ? 100
                : node.type === "spiralmmo"
                  ? 320
                  : node.type === "tower"
                    ? 400
                    : 200
        }).addTo(markerLayerRef.current);
        marker.on("click", (ev) => {
          try {
            ev?.originalEvent?.stopPropagation?.();
          } catch {
            /* noop */
          }
          if (node.type !== "spiralmmo") {
            try {
              const z = Math.max(mapRef.current?.getZoom?.() || 14, 16);
              mapRef.current?.flyTo?.([node.lat, node.lon], z, { animate: true, duration: 1.2 });
            } catch {
              /* noop */
            }
          }
          if (node.type === "remote_castle") {
            dispatchV11MapEventPinV0(node, "click", mapRef.current);
            return;
          }
          dispatchV11MapEventPinV0(node, "click", mapRef.current);
        });
        marker.on("mouseover", () =>
          dispatchV11MapEventPinV0(node, "hover", mapRef.current)
        );
        marker.on("mouseout", () => emitV11MapClearPreviewV0());
        if (node.id === "rhizoh_portal") {
          portalMarkerRef.current = marker;
          writeSovereignPortalCoordsV0(node.lat, node.lon);
        }
      }

      if (!boundsFittedRef.current && allNodes.length) {
        const bounds = L.latLngBounds(allNodes.map((n) => [n.lat, n.lon]));
        mapRef.current.fitBounds(bounds, {
          paddingTopLeft: [28, 104],
          paddingBottomRight: [28, 36],
          maxZoom: userCastleGeo ? 16 : 5,
          animate: false
        });
        try {
          mapRef.current.panBy([0, 52], { animate: false });
        } catch {
          /* noop */
        }
        boundsFittedRef.current = true;
      }

      graphLayerRef.current?.clearLayers?.();
      if (!graphLayerRef.current) graphLayerRef.current = L.layerGroup().addTo(mapRef.current);
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
  }, [leafletReady, localAnchors, displayNodes, remoteNodes, userCastleGeo]);

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
      <style>{`
        [data-rhizoh-v11-leaflet-host="1"] .leaflet-container { background: #000 !important; cursor: grab !important; }
        [data-rhizoh-v11-leaflet-host="1"] .leaflet-container:active { cursor: grabbing !important; }
        [data-rhizoh-v11-leaflet-host="1"] .leaflet-tile-pane {
          ${leafletTilePaneFilterCssV0(activeMapTool)}
        }
        [data-rhizoh-v11-leaflet-host="1"] .leaflet-control-zoom {
          margin-top: 4.75rem !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          background: rgba(0,0,0,0.75) !important;
        }
        [data-rhizoh-v11-leaflet-host="1"] .leaflet-control-zoom a {
          color: #67e8f9 !important;
          background: transparent !important;
        }
      `}</style>
      <RhizohSpiralMMOMapAwakeningOverlayV0 />
      <RhizohCatchUpCascadeOverlayV0 />
      <RhizohN12PersistenceGateV0 />
      <RhizohCodexEventStreamV0 />
      <RhizohOfflineVoidOverlayV0 />
      {!leafletReady ? displayNodes.map((node) => {
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
            onClick={() => {
              dispatchV11MapEventPinV0(node, "tap");
            }}
            onMouseEnter={() => dispatchV11MapEventPinV0(node, "hover")}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                dispatchV11MapEventPinV0(node, "click");
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

function renderFallbackForModeV0(renderMode, activeMapTool, remoteCastles, remoteCastlesVisible) {
  if (renderMode === RHIZOH_SPATIAL_RENDER_MODE_V0.EMPTY_CANVAS) return <EmptyCanvasV0 />;
  if (renderMode === RHIZOH_SPATIAL_RENDER_MODE_V0.SAFE_WORLD_SHELL) return <SafeWorldShellV0 />;
  return (
    <V11CoreMapLayerV0
      activeMapTool={activeMapTool}
      remoteCastles={remoteCastles}
      remoteCastlesVisible={remoteCastlesVisible}
    />
  );
}

/**
 * World · Space map substrate — Cesium mounts only on /world/space, never on T0 live (/).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */
export const RhizohWorldSpaceMapHostV0 = memo(function RhizohWorldSpaceMapHostV0({
  active,
  renderMode = RHIZOH_SPATIAL_RENDER_MODE_V0.V11_CORE_MAP,
  activeMapTool = "city_map",
  remoteCastles = [],
  remoteCastlesVisible = false
}) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[11]"
      data-rhizoh-world-space-map-host="1"
      data-rhizoh-world-space-map-active={active ? "1" : "0"}
      data-rhizoh-world-space-render-mode={renderMode}
      data-remote-castles-visible={remoteCastlesVisible ? "1" : "0"}
    >
      {active ? (
        <CesiumRealMapLayer active />
      ) : (
        renderFallbackForModeV0(renderMode, activeMapTool, remoteCastles, remoteCastlesVisible)
      )}
    </div>
  );
});
