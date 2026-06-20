import React, { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import CesiumRealMapLayer from "../castleFlight/CesiumRealMapLayer.jsx";
import { RHIZOH_SPATIAL_RENDER_MODE_V0 } from "../rhizoh/runtime/spatialBootGateV0.js";
import {
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0
} from "../rhizoh/runtime/symbyoMapIntentBridgeV0.js";
import {
  readWorldMapClaimModeV0,
  writeWorldMapClaimModeV0,
  WORLD_MAP_CLAIM_MODE_EVENT_V0
} from "../rhizoh/runtime/worldMapClaimModeV0.js";
import {
  LOCAL_GHOST_CASTLE_EVENT_V0,
  readLocalGhostCastleAnchorsV0
} from "../rhizoh/runtime/localGhostCastleAnchorV0.js";
import { createCastleWorldAnchorV0 } from "../castleFlight/castleWorldAnchorV0.js";
import {
  readCastleNexusGeoV0,
  resolveUserCastleGeoForMapViewV0,
  resolveWorldMapBootstrapGeoV0,
  WORLD_MAP_OBSERVATION_ORIGIN_EVENT_V0
} from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";

import { dispatchV11MapEventPinV0 } from "../rhizoh/runtime/mapEventPinDispatchV0.js";
import {
  cancelMapPinHoverDwellV0,
  isMapTransitionBusyV0,
  runMapPinApproachThenV0,
  scheduleMapPinHoverDwellV0
} from "../rhizoh/runtime/worldMapMeaningfulTransitionV0.js";
import {
  resolveMapViewportFitNodesV0,
  resolveArenaPopulationViewportFitNodesV0,
  resolveWorldSpaceMapRecenterHomeV0
} from "../rhizoh/runtime/worldMapViewportBootstrapV0.js";
import {
  persistWorldMapPickOriginV0,
  WORLD_MAP_GEO_REQUEST_EVENT_V0
} from "../rhizoh/runtime/worldMapGeoRequestV0.js";
import {
  publishRhizohMapPinOwnerRegistryV0,
  readWorldSpaceSessionMapPinRowsV0
} from "../rhizoh/runtime/rhizohMapPinOwnerV0.js";
import {
  getPrismCubeMapPinRowsV0,
  PRISM_CUBE_MAP_PIN_EVENT_V0
} from "../rhizoh/runtime/cesiumWorldCommitV0.js";
import {
  readSpiralMapLayerFilterStateV0,
  subscribeSpiralMapLayerFilterStateV0
} from "../rhizoh/runtime/spiralMapLayerFilterStateV0.js";
import {
  CASTLE_IDENTITY_MODE_EVENT_V0,
  SPIRAL_MAP_REALITY_MODE_EVENT_V0,
  SPIRAL_MAP_REALITY_MODE_V0
} from "../rhizoh/runtime/spiralMapRealityModeV0.js";
import { resolveCastleIdentityViewportNodesV0 } from "../rhizoh/runtime/worldMapCastleIdentityV0.js";
import { isSpiralCountdownCalmVisualV0 } from "../rhizoh/runtime/worldDomainCalmModeV0.js";
import { RHIZOH_MAP_COMMAND_EVENT_V0 } from "../rhizoh/runtime/rhizohLocalCommandHandlersV0.js";
import { RhizohCatchUpCascadeOverlayV0 } from "./RhizohCatchUpCascadeOverlayV0.jsx";
import { RhizohSpiralMMOMapAwakeningOverlayV0 } from "./RhizohSpiralMMOMapAwakeningOverlayV0.jsx";
import { RhizohN12PersistenceGateV0 } from "./RhizohN12PersistenceGateV0.jsx";
import { RhizohCodexEventStreamV0 } from "./RhizohCodexEventStreamV0.jsx";
import { RhizohOfflineVoidOverlayV0 } from "./RhizohOfflineVoidOverlayV0.jsx";

export { RHIZOH_V11_MAP_INTENT_EVENT_V0, RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0 };

import {
  SOVEREIGN_MAP_DEFAULT_HOME_V0,
  buildRemoteCastleMapNodesV0,
  RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1,
  sovereignNodeIconHtmlV0,
  writeSovereignPortalCoordsV0
} from "../rhizoh/runtime/sovereignWorldMapNodesV0.js";
import {
  getLiveMatchMapPinsV0,
  RHIZOH_LIVE_MATCH_PINS_EVENT_V0
} from "../rhizoh/runtime/worldMapLiveMatchPinsV0.js";
import {
  buildShadowPeerCastleSimNodeV0,
  readShadowCastlePinPulseActiveV0,
  subscribeShadowCastlePinPulseV0
} from "../rhizoh/runtime/shadowDataPlaneLoopV0.js";
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
    persistWorldMapPickOriginV0(latlng.lat, latlng.lng, { source: "castle_init_map_pick" });
    writeWorldMapClaimModeV0(false);
    return true;
  }

  if (!readWorldMapClaimModeV0()) return false;
  createCastleWorldAnchorV0({
    lat: latlng.lat,
    lon: latlng.lng,
    label: `Castle · ${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)}`,
    source: "map_pick"
  });
  persistWorldMapPickOriginV0(latlng.lat, latlng.lng, { source: "world_map_pick" });
  writeWorldMapClaimModeV0(false);
  return true;
}

function RhizohWorldMapClaimPickBannerV0({ uiLocale = "en" }) {
  const tr = String(uiLocale).toLowerCase().startsWith("tr");
  const [armed, setArmed] = useState(() => readWorldMapClaimModeV0());

  useEffect(() => {
    const onMode = (e) => setArmed(!!e.detail?.enabled);
    window.addEventListener(WORLD_MAP_CLAIM_MODE_EVENT_V0, onMode);
    return () => window.removeEventListener(WORLD_MAP_CLAIM_MODE_EVENT_V0, onMode);
  }, []);

  if (!armed) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-20 z-[5] flex justify-center px-4"
      data-rhizoh-world-map-claim-banner="1"
    >
      <p className="rounded-xl border border-purple-400/55 bg-purple-950/90 px-4 py-2 text-center text-[11px] font-semibold text-purple-100 shadow-lg backdrop-blur-md normal-case">
        {tr ? "Haritaya tıkla — başlangıç konumunu seç" : "Tap the map to choose your start location"}
      </p>
    </div>
  );
}

function leafletTilePaneFilterCssV0(activeMapTool) {
  const tool = String(activeMapTool || "city_map");
  if (tool === "satellite") {
    return "filter: brightness(1.04) contrast(1.1) saturate(1.14);";
  }
  if (tool === "streets") {
    return "filter: invert(94%) hue-rotate(180deg) brightness(0.92) contrast(1.08);";
  }
  return "filter: brightness(0.92) contrast(1.08) saturate(1.02);";
}

function leafletTileUrlForToolV0(activeMapTool) {
  const tool = String(activeMapTool || "city_map");
  if (tool === "satellite") {
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  }
  if (tool === "streets") {
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  }
  return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
}

function V11CoreMapLayerV0({ activeMapTool = "city_map", remoteCastles = [], remoteCastlesVisible = false, uiLocale = "en" }) {
  const mapRef = useRef(null);
  const hostRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const graphLayerRef = useRef(null);
  const portalMarkerRef = useRef(null);
  const boundsFittedRef = useRef(false);
  const [userCastleGeo, setUserCastleGeo] = useState(() => resolveUserCastleGeoForMapViewV0());
  const [localAnchors, setLocalAnchors] = useState(() => readLocalGhostCastleAnchorsV0());
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
  const [prismCubePins, setPrismCubePins] = useState(() => getPrismCubeMapPinRowsV0());
  const [spiralLayerFilter, setSpiralLayerFilter] = useState(() => readSpiralMapLayerFilterStateV0());
  const [shadowPinPulseTick, setShadowPinPulseTick] = useState(0);

  useEffect(() => subscribeShadowCastlePinPulseV0(() => setShadowPinPulseTick((n) => n + 1)), []);

  const recenterMapToObservationOriginV0 = useCallback((opts = {}) => {
    const map = mapRef.current;
    if (!map) return;
    const anchor = resolveWorldMapBootstrapGeoV0();
    const zoom = Number(opts.zoom) || (userCastleGeo ? 15 : 14);
    try {
      if (opts.animate === false) {
        map.setView([anchor.lat, anchor.lon], zoom, { animate: false });
      } else {
        map.flyTo([anchor.lat, anchor.lon], zoom, { animate: true, duration: 1.6 });
      }
    } catch {
      /* noop */
    }
  }, [userCastleGeo]);

  const fitCastleIdentityViewportV0 = useCallback(() => {
    const L = typeof window !== "undefined" ? window.L : null;
    const map = mapRef.current;
    if (!L?.latLngBounds || !map) return;
    const nodes = resolveCastleIdentityViewportNodesV0();
    if (nodes.length >= 2) {
      const bounds = L.latLngBounds(nodes.map((n) => [n.lat, n.lon]));
      map.fitBounds(bounds, {
        paddingTopLeft: [28, 88],
        paddingBottomRight: [28, 120],
        maxZoom: 13,
        animate: true
      });
    } else if (nodes.length === 1) {
      map.flyTo([nodes[0].lat, nodes[0].lon], 14, { animate: true, duration: 1.2 });
    }
  }, []);

  useEffect(() => {
    const onPins = (ev) => setLiveMatchPins(ev?.detail?.pins || getLiveMatchMapPinsV0());
    window.addEventListener(RHIZOH_LIVE_MATCH_PINS_EVENT_V0, onPins);
    return () => window.removeEventListener(RHIZOH_LIVE_MATCH_PINS_EVENT_V0, onPins);
  }, []);

  useEffect(() => {
    const refreshPrismPins = () => setPrismCubePins(getPrismCubeMapPinRowsV0());
    window.addEventListener(PRISM_CUBE_MAP_PIN_EVENT_V0, refreshPrismPins);
    window.addEventListener("rhizoh:arena-population-v0", refreshPrismPins);
    return () => {
      window.removeEventListener(PRISM_CUBE_MAP_PIN_EVENT_V0, refreshPrismPins);
      window.removeEventListener("rhizoh:arena-population-v0", refreshPrismPins);
    };
  }, []);

  useEffect(() => subscribeSpiralMapLayerFilterStateV0(() => {
    setSpiralLayerFilter(readSpiralMapLayerFilterStateV0());
  }), []);

  useEffect(() => {
    const onCastleIdentity = () => fitCastleIdentityViewportV0();
    const onRealityMode = (ev) => {
      if (ev?.detail?.mode === SPIRAL_MAP_REALITY_MODE_V0.CASTLE) {
        fitCastleIdentityViewportV0();
      }
    };
    window.addEventListener(CASTLE_IDENTITY_MODE_EVENT_V0, onCastleIdentity);
    window.addEventListener(SPIRAL_MAP_REALITY_MODE_EVENT_V0, onRealityMode);
    return () => {
      window.removeEventListener(CASTLE_IDENTITY_MODE_EVENT_V0, onCastleIdentity);
      window.removeEventListener(SPIRAL_MAP_REALITY_MODE_EVENT_V0, onRealityMode);
    };
  }, [fitCastleIdentityViewportV0]);

  const displayNodes = useMemo(
    () =>
      readWorldSpaceSessionMapPinRowsV0({
        userCastle: userCastleGeo,
        liveMatchPins,
        prismCubePins,
        spiralLayerFilter
      }),
    [userCastleGeo, liveMatchPins, prismCubePins, spiralLayerFilter]
  );
  const remoteNodes = useMemo(
    () => (remoteCastlesVisible ? buildRemoteCastleMapNodesV0(mergedRemoteCastles) : []),
    [mergedRemoteCastles, remoteCastlesVisible]
  );
  const shadowPeerNode = useMemo(() => {
    void shadowPinPulseTick;
    const node = buildShadowPeerCastleSimNodeV0();
    return Object.freeze({
      ...node,
      shadowPulseActive: readShadowCastlePinPulseActiveV0(node.id)
    });
  }, [shadowPinPulseTick]);
  const nodeById = useRef(new Map(displayNodes.map((n) => [n.id, n])));
  const [leafletReady, setLeafletReady] = useState(false);
  const [spiralCalmVisual, setSpiralCalmVisual] = useState(() => isSpiralCountdownCalmVisualV0());

  useEffect(() => {
    const tick = () => setSpiralCalmVisual(isSpiralCountdownCalmVisualV0());
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, []);

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
        const home = resolveWorldSpaceMapRecenterHomeV0();
        map.setView([home.lat, home.lon], home.zoom || 14);
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
        try {
          window.__rhizoh = window.__rhizoh || {};
          window.__rhizoh.v11LeafletMap = map;
        } catch {
          /* noop */
        }
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
    const onCastle = () => {
      setUserCastleGeo(resolveUserCastleGeoForMapViewV0());
      boundsFittedRef.current = false;
      recenterMapToObservationOriginV0({ animate: true });
    };
    const onGeo = () => {
      setUserCastleGeo(resolveUserCastleGeoForMapViewV0());
      boundsFittedRef.current = false;
      recenterMapToObservationOriginV0({ animate: true });
    };
    const onObservationOrigin = () => {
      boundsFittedRef.current = false;
      recenterMapToObservationOriginV0({ animate: true });
    };
    window.addEventListener(LOCAL_GHOST_CASTLE_EVENT_V0, onAnchor);
    window.addEventListener("castle:castle-create-v0", onCastle);
    window.addEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);
    window.addEventListener(WORLD_MAP_OBSERVATION_ORIGIN_EVENT_V0, onObservationOrigin);
    return () => {
      window.removeEventListener(LOCAL_GHOST_CASTLE_EVENT_V0, onAnchor);
      window.removeEventListener("castle:castle-create-v0", onCastle);
      window.removeEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);
      window.removeEventListener(WORLD_MAP_OBSERVATION_ORIGIN_EVENT_V0, onObservationOrigin);
    };
  }, [recenterMapToObservationOriginV0]);

  useEffect(() => {
    if (!leafletReady) return undefined;
    const onMapCommand = (ev) => {
      const action = String(ev?.detail?.action || "");
      const map = mapRef.current;
      if (!map) return;
      try {
        if (action === "zoom_in") map.zoomIn();
        else if (action === "zoom_out") map.zoomOut();
      } catch {
        /* noop */
      }
    };
    window.addEventListener(RHIZOH_MAP_COMMAND_EVENT_V0, onMapCommand);
    return () => window.removeEventListener(RHIZOH_MAP_COMMAND_EVENT_V0, onMapCommand);
  }, [leafletReady]);

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
      const allNodes = [...displayNodes, ...extraLocal, shadowPeerNode, ...remoteNodes];
      for (const node of allNodes) {
        const renderNode =
          node.shadowPulseActive || readShadowCastlePinPulseActiveV0(node.id)
            ? Object.freeze({ ...node, shadowPulseActive: true })
            : node;
        const marker = L.marker([node.lat, node.lon], {
          icon: createLeafletNodeIconV0(L, renderNode),
          keyboard: false,
          title: node.name || node.label,
          zIndexOffset:
            node.id === "my_castle"
              ? 900
              : node.type === "memory_beacon"
                ? 350
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
          if (isMapTransitionBusyV0()) return;
          const map = mapRef.current;
          if (node.type === "remote_castle") {
            dispatchV11MapEventPinV0(node, "click", map);
            return;
          }
          if (node.type === "spiralmmo") {
            dispatchV11MapEventPinV0(node, "click", map);
            return;
          }
          runMapPinApproachThenV0(map, node, {}, () =>
            dispatchV11MapEventPinV0(node, "click", map)
          );
        });
        marker.on("mouseover", () => {
          if (node.type === "spiralmmo") return;
          scheduleMapPinHoverDwellV0(
            node,
            (n) => dispatchV11MapEventPinV0(n, "hover", mapRef.current),
            () => emitV11MapClearPreviewV0()
          );
        });
        marker.on("mouseout", () => {
          cancelMapPinHoverDwellV0(() => emitV11MapClearPreviewV0());
        });
        if (node.id === "rhizoh_portal") {
          portalMarkerRef.current = marker;
          writeSovereignPortalCoordsV0(node.lat, node.lon);
        }
      }

      if (!boundsFittedRef.current && allNodes.length) {
        const arenaFit = resolveArenaPopulationViewportFitNodesV0(allNodes, {
          spiralLayerFilter
        });
        const fitNodes =
          arenaFit.length >= 1
            ? arenaFit
            : resolveMapViewportFitNodesV0(allNodes, {
                worldSpaceNeutral: true,
                userCastle: userCastleGeo
              });
        if (fitNodes.length >= 2) {
          const bounds = L.latLngBounds(fitNodes.map((n) => [n.lat, n.lon]));
          mapRef.current.fitBounds(bounds, {
            paddingTopLeft: [28, 88],
            paddingBottomRight: [28, 32],
            maxZoom: userCastleGeo ? 15 : 14,
            animate: false
          });
        } else if (fitNodes.length === 1) {
          const node = fitNodes[0];
          mapRef.current.setView([node.lat, node.lon], userCastleGeo ? 15 : 14, { animate: false });
        } else if (userCastleGeo) {
          mapRef.current.setView([userCastleGeo.lat, userCastleGeo.lon], 15, { animate: false });
        } else {
          const anchor = resolveWorldMapBootstrapGeoV0();
          mapRef.current.setView([anchor.lat, anchor.lon], 14, { animate: false });
        }
        boundsFittedRef.current = true;
      }

      graphLayerRef.current?.clearLayers?.();
      if (!graphLayerRef.current) graphLayerRef.current = L.layerGroup().addTo(mapRef.current);
      /* Route polylines removed — dimensional collapse uses gate arcs only (no static mesh). */
    } catch {
      /* noop */
    }
  }, [leafletReady, localAnchors, displayNodes, remoteNodes, shadowPeerNode, userCastleGeo, spiralLayerFilter]);

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
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.18),rgba(8,14,28,0.52)_72%)] transition-opacity duration-700 ease-in-out"
      data-rhizoh-v11-core-map-layer="1"
      data-rhizoh-v11-leaflet-ready={leafletReady ? "1" : "0"}
      aria-label="Rhizoh Primary Spatial Surface V11"
    >
      <div ref={hostRef} className="pointer-events-auto absolute inset-0 z-[1]" data-rhizoh-v11-leaflet-host="1" />
      <RhizohWorldMapClaimPickBannerV0 uiLocale={uiLocale} />
      <style>{`
        [data-rhizoh-v11-leaflet-host="1"] .leaflet-container { background: #0b1220 !important; cursor: grab !important; }
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
      <RhizohSpiralMMOMapAwakeningOverlayV0 calmVisual={spiralCalmVisual} uiLocale={uiLocale} />
      {!spiralCalmVisual ? <RhizohCatchUpCascadeOverlayV0 /> : null}
      {!spiralCalmVisual ? <RhizohN12PersistenceGateV0 /> : null}
      {!spiralCalmVisual ? <RhizohCodexEventStreamV0 /> : null}
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

function renderFallbackForModeV0(renderMode, activeMapTool, remoteCastles, remoteCastlesVisible, uiLocale) {
  if (renderMode === RHIZOH_SPATIAL_RENDER_MODE_V0.EMPTY_CANVAS) return <EmptyCanvasV0 />;
  if (renderMode === RHIZOH_SPATIAL_RENDER_MODE_V0.SAFE_WORLD_SHELL) return <SafeWorldShellV0 />;
  return (
    <V11CoreMapLayerV0
      activeMapTool={activeMapTool}
      remoteCastles={remoteCastles}
      remoteCastlesVisible={remoteCastlesVisible}
      uiLocale={uiLocale}
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
  remoteCastlesVisible = false,
  uiLocale = "en"
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
        renderFallbackForModeV0(renderMode, activeMapTool, remoteCastles, remoteCastlesVisible, uiLocale)
      )}
    </div>
  );
});
