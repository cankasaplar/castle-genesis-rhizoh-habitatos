/**
 * World · Space — dedicated map boot (no AppRhizoh528T0 / ApexEngine / fox stage).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */
import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import "./castleFlight/registerGlobals.js";
import { useCastleAuth } from "./firebase/useCastleAuth.js";
import { CastleAuthOverlay } from "./auth/CastleAuthOverlay.jsx";
import { useRhizohGatewayMonitor } from "./rhizoh/useRhizohGatewayMonitor.js";
import { UnifiedProductShellBar } from "./studio/ui/UnifiedProductShellBar.jsx";
import { RhizohWorldDomainShellV0 } from "./components/RhizohWorldDomainShellV0.jsx";
import { RhizohWorldSpaceMapHostV0 } from "./components/RhizohWorldSpaceMapHostV0.jsx";
import { RhizohWorldSpaceVoiceDockV0 } from "./components/RhizohWorldSpaceVoiceDockV0.jsx";
import {
  applyRhizohWorldMapToolV0,
  getRhizohWorldMapToolSnapshotV0,
  readRhizohWorldMapToolV0,
  subscribeRhizohWorldMapToolV0,
  writeRhizohWorldMapToolV0
} from "./rhizoh/runtime/rhizohWorldMapToolV0.js";
import { applyCesiumImageryForMapToolV0 } from "./rhizoh/runtime/rhizohCesiumImageryProfileV0.js";
import {
  resolveRhizohLayerModeV0,
  resolveRhizohWorldSpaceCesiumActiveV0
} from "./rhizoh/runtime/rhizohLayerContextV0.js";
import { RHIZOH_WORLD_DRAWER_DOMAIN_V0 } from "./rhizoh/runtime/rhizohWorldDrawerDomainV0.js";
import {
  resolveRhizohWorldSpaceMapStripBottomCssV0,
  resolveRhizohWorldSpaceVoiceDockBottomCssV0
} from "./rhizoh/runtime/rhizohWorldSurfacePolicyV0.js";
import { resolveRhizohProductPathV0 } from "./rhizoh/product/rhizohProductTopologyV0.js";
import {
  configureSpatialRealityInfraV0,
  clearSpatialRealityInfraV0
} from "./rhizoh/spatial/spatialRealityInfraV0.js";
import { reconcileMapSurfaceFromGateway, setRealityMode } from "./reality/realityDirector.js";
import { readUiLocaleV0 } from "./rhizoh/runtime/rhizohUiLocaleV0.js";
import { writeRhizohWorldDrawerDomainV0 } from "./rhizoh/runtime/rhizohWorldDrawerDomainV0.js";
import { handleWorldSpaceCapWheelNodeV0 } from "./rhizoh/runtime/rhizohWorldSpaceCapWheelV0.js";
import {
  readCastleNexusGeoV0,
  resolveWorldMapBootstrapGeoV0
} from "./rhizoh/runtime/worldMapBootstrapGeoV0.js";
import {
  queryWorldMapGeoPermissionV0,
  requestWorldMapGeoV0,
  WORLD_MAP_GEO_REQUEST_EVENT_V0
} from "./rhizoh/runtime/worldMapGeoRequestV0.js";
import { useCastleActiveCastles } from "./firebase/useCastleActiveCastles.js";
import { isWorldLayerEnabled } from "./rhizoh/runtime/castleWorldLayerGateV0.js";
import { runDomainGateForPathV0 } from "./rhizoh/runtime/rhizohDomainNervousSystemV0.js";
import { RhizohAtmospherePresenceBridge } from "./rhizoh/runtime/RhizohAtmospherePresenceBridge.jsx";
import { evaluateSpatialBootGateV0 } from "./rhizoh/runtime/spatialBootGateV0.js";

export default function AppRhizohWorldSpaceV0() {
  const navigate = useNavigate();
  const castleAuth = useCastleAuth();
  const { remoteCastles } = useCastleActiveCastles(castleAuth?.user?.uid);
  const gateway = useRhizohGatewayMonitor();
  const uiLocale = readUiLocaleV0();
  const [infraTick, setInfraTick] = useState(0);
  const [geoPrompt, setGeoPrompt] = useState("unknown");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState("");

  const worldMapToolV0 = useSyncExternalStore(
    subscribeRhizohWorldMapToolV0,
    getRhizohWorldMapToolSnapshotV0,
    getRhizohWorldMapToolSnapshotV0
  );

  const mapSurfaceActive = true;
  const worldLayerEnabledV0 = isWorldLayerEnabled();
  const identityAnchorV0 = readCastleNexusGeoV0();
  const bootstrapGeoV0 = resolveWorldMapBootstrapGeoV0();
  const spatialSnapshotNodesV0 = useMemo(() => {
    const rows = [];
    if (identityAnchorV0) rows.push(identityAnchorV0);
    if (Array.isArray(remoteCastles)) rows.push(...remoteCastles);
    return rows;
  }, [identityAnchorV0, remoteCastles]);
  const spatialBootGateV0 = useMemo(
    () =>
      evaluateSpatialBootGateV0({
        spatialEnabled: worldLayerEnabledV0,
        worldStateReady: Boolean(bootstrapGeoV0),
        identityReady: Boolean(identityAnchorV0),
        nodes: spatialSnapshotNodesV0
      }),
    [worldLayerEnabledV0, bootstrapGeoV0, identityAnchorV0, spatialSnapshotNodesV0]
  );

  const cesiumLayerActiveV0 = useMemo(
    () =>
      spatialBootGateV0.allowed &&
      resolveRhizohWorldSpaceCesiumActiveV0({
        pathname: "/world/space",
        worldDomain: RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE,
        mapTool: worldMapToolV0,
        mapSurfaceActive
      }),
    [worldMapToolV0, mapSurfaceActive, spatialBootGateV0]
  );

  const layerModeV0 = useMemo(
    () => resolveRhizohLayerModeV0({ pathname: "/world/space" }),
    []
  );

  useEffect(() => {
    runDomainGateForPathV0("/world/space", { userId: castleAuth?.user?.uid || null });
  }, [castleAuth?.user?.uid]);

  useEffect(() => {
    writeRhizohWorldDrawerDomainV0(RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE);
    configureSpatialRealityInfraV0({
      gatewayPhase: gateway.phase,
      mapSurfaceActive: true,
      onSync: () => setInfraTick((n) => n + 1)
    });

    void setRealityMode("REAL_MAP", {
      source: "WORLD_SPACE_BOOT",
      productSurface: "world"
    });

    const nexusGeo = readCastleNexusGeoV0();
    const tool = readRhizohWorldMapToolV0();
    const nextTool = !nexusGeo || tool === "globe" ? "city_map" : tool;
    if (!spatialBootGateV0.allowed) {
      writeRhizohWorldMapToolV0(nextTool);
    } else if (!nexusGeo) {
      void applyRhizohWorldMapToolV0("city_map", {
        setRealityMode,
        source: "WORLD_SPACE_BOOT_CITY"
      });
    } else if (tool === "globe") {
      void applyRhizohWorldMapToolV0("city_map", {
        setRealityMode,
        source: "WORLD_SPACE_BOOT_LOCAL"
      });
    } else {
      applyCesiumImageryForMapToolV0(tool);
      void applyRhizohWorldMapToolV0(tool, {
        setRealityMode,
        source: "WORLD_SPACE_BOOT"
      });
    }

    return () => clearSpatialRealityInfraV0();
  }, []);

  useEffect(() => {
    configureSpatialRealityInfraV0({
      gatewayPhase: gateway.phase,
      mapSurfaceActive: true,
      onSync: () => setInfraTick((n) => n + 1)
    });
    reconcileMapSurfaceFromGateway();
  }, [gateway.phase]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const witnesses = Array.isArray(remoteCastles) ? remoteCastles : [];
    window.__CASTLE_REMOTE_WITNESSES__ = Object.freeze(witnesses.slice());
    try {
      window.dispatchEvent(new CustomEvent("castle:remote-witnesses-v0"));
    } catch {
      /* noop */
    }
    return undefined;
  }, [remoteCastles]);

  useEffect(() => {
    let cancelled = false;
    void queryWorldMapGeoPermissionV0().then((state) => {
      if (!cancelled) setGeoPrompt(state);
    });
    const onGeo = () => {
      setGeoPrompt("granted");
      setGeoError("");
    };
    window.addEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);
    return () => {
      cancelled = true;
      window.removeEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);
    };
  }, []);

  const onRequestGeoV0 = useCallback(async () => {
    setGeoBusy(true);
    setGeoError("");
    const result = await requestWorldMapGeoV0({ source: "world_space_geo_chip" });
    setGeoBusy(false);
    if (result.ok) {
      setGeoPrompt("granted");
      return;
    }
    setGeoError(result.message || "Konum alınamadı.");
    const next = await queryWorldMapGeoPermissionV0();
    setGeoPrompt(next);
  }, []);

  const showGeoChip = !readCastleNexusGeoV0() && geoPrompt !== "granted";

  const onApplyWorldMapToolV0 = useCallback((mapTool, source = "WORLD_DOMAIN_MAP_STRIP") => {
    if (!spatialBootGateV0.allowed) {
      writeRhizohWorldMapToolV0(mapTool);
      return;
    }
    void applyRhizohWorldMapToolV0(mapTool, {
      setRealityMode,
      source
    });
  }, [spatialBootGateV0.allowed]);

  const onProductShellSelect = useCallback(
    (id) => {
      const surface = String(id || "world");
      if (surface === "world") {
        navigate("/world/space");
        return;
      }
      navigate(resolveRhizohProductPathV0(surface));
    },
    [navigate]
  );

  const voiceDockBottomCssV0 = resolveRhizohWorldSpaceVoiceDockBottomCssV0();
  const mapStripBottomCssV0 = resolveRhizohWorldSpaceMapStripBottomCssV0();
  const bootstrapPlaceLabelV0 = resolveWorldMapBootstrapGeoV0().label;

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#010103] text-white"
      data-rhizoh-world-space-app="1"
      data-cesium-active={cesiumLayerActiveV0 ? "1" : "0"}
      data-world-layer-enabled={worldLayerEnabledV0 ? "1" : "0"}
      data-spatial-render-mode={spatialBootGateV0.renderMode}
      data-spatial-boot-reason={spatialBootGateV0.reason}
      data-map-tool={worldMapToolV0}
    >
      <RhizohAtmospherePresenceBridge />
      <RhizohWorldSpaceMapHostV0
        active={cesiumLayerActiveV0}
        renderMode={spatialBootGateV0.renderMode}
        activeMapTool={worldMapToolV0}
      />

      <RhizohWorldDomainShellV0
        domain={RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE}
        layerMode={layerModeV0}
        uiLocale={uiLocale}
        activeMapTool={worldMapToolV0}
        onSelectMapTool={(toolId) => onApplyWorldMapToolV0(toolId, "WORLD_DOMAIN_MAP_STRIP")}
        spatialEngineActive={cesiumLayerActiveV0}
        onOpenGreenroom={() => navigate("/greenroom/main")}
        onOpenBroadcast={() => navigate("/broadcast/main")}
        onShareInvite={() => {}}
        onModeSelect={() => navigate("/world/modes")}
        onCapNodeIntent={handleWorldSpaceCapWheelNodeV0}
        onSeedIntent={() => {}}
        onFocusLayer={() => {}}
      />

      <div
        className="pointer-events-none fixed inset-x-0 z-[24] flex justify-center px-2 sm:px-4"
        style={{ bottom: voiceDockBottomCssV0 }}
      >
        <div className="pointer-events-auto w-full max-w-3xl">
          <RhizohWorldSpaceVoiceDockV0 firebaseUser={castleAuth?.user} uiLocale={uiLocale} />
        </div>
      </div>

      <UnifiedProductShellBar active="world" onSelect={onProductShellSelect} uiLocale={uiLocale} />

      {castleAuth.needsAuthGate || castleAuth.needsOnboarding ? (
        <CastleAuthOverlay auth={castleAuth} />
      ) : null}

      {showGeoChip ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[26] flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-md flex-col items-center gap-1 rounded-xl border border-cyan-500/35 bg-black/80 px-3 py-2 text-center backdrop-blur-md">
            <p className="text-[10px] text-cyan-100/90 normal-case">
              {uiLocale === "tr"
                ? `Harita ${bootstrapPlaceLabelV0} bağlantısında açıldı. Konumunu paylaşırsan kamerayı oraya taşırız.`
                : `Map opens at ${bootstrapPlaceLabelV0}. Share location to fly the camera to you.`}
            </p>
            <button
              type="button"
              disabled={geoBusy}
              onClick={() => void onRequestGeoV0()}
              className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-50"
            >
              {geoBusy
                ? uiLocale === "tr"
                  ? "Konum isteniyor…"
                  : "Requesting location…"
                : uiLocale === "tr"
                  ? "Konumumu kullan"
                  : "Use my location"}
            </button>
            {geoError ? (
              <p className="text-[9px] text-amber-200/85 normal-case">{geoError}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!cesiumLayerActiveV0 &&
      worldMapToolV0 !== "globe" &&
      spatialBootGateV0.renderMode !== "v11_core_map" ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-[25] flex justify-center px-4"
          style={{ bottom: `calc(${mapStripBottomCssV0} + 5rem)` }}
        >
          <p className="rounded-xl border border-amber-400/30 bg-black/75 px-3 py-2 text-[10px] text-amber-100/90 normal-case">
            {!worldLayerEnabledV0
              ? uiLocale === "tr"
                ? "3D Cesium katmanı kapalı — güvenli v11 dünya yüzeyi aktif."
                : "3D Cesium layer is off — safe v11 world surface is active."
              : uiLocale === "tr"
                ? "Harita yükleniyor… Gateway veya Cesium hazır değilse birkaç saniye bekleyin."
                : "Loading map… wait a few seconds if gateway or Cesium is still starting."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
