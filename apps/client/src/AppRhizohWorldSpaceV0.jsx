/**
 * World · Space — dedicated map boot (no AppRhizoh528T0 / ApexEngine / fox stage).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import "./castleFlight/registerGlobals.js";
import { useCastleAuth } from "./firebase/useCastleAuth.js";
import { CastleAuthOverlay } from "./auth/CastleAuthOverlay.jsx";
import { useRhizohGatewayMonitor } from "./rhizoh/useRhizohGatewayMonitor.js";
import { UnifiedProductShellBar } from "./studio/ui/UnifiedProductShellBar.jsx";
import { RhizohWorldDomainShellV0 } from "./components/RhizohWorldDomainShellV0.jsx";
import {
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  RhizohWorldSpaceMapHostV0
} from "./components/RhizohWorldSpaceMapHostV0.jsx";
import { RhizohWorldSpaceVoiceDockV0 } from "./components/RhizohWorldSpaceVoiceDockV0.jsx";
import {
  applyRhizohWorldMapToolV0,
  getRhizohWorldMapToolSnapshotV0,
  normalizeRhizohWorldSpaceLeafletToolV0,
  readRhizohWorldMapToolV0,
  subscribeRhizohWorldMapToolV0,
  writeRhizohWorldMapToolV0
} from "./rhizoh/runtime/rhizohWorldMapToolV0.js";
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
  resolveUserCastleGeoForMapViewV0,
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
import { attachRhizohMapExecutionOrchestratorV1 } from "./rhizoh/runtime/rhizohMapExecutionOrchestratorV1.js";
import {
  RHIZOH_OPEN_CASTLE_EVENT_V1,
  RHIZOH_OPEN_CHESS_ARENA_EVENT_V1,
  RHIZOH_OPEN_LIBRARY_EVENT_V1,
  RHIZOH_OPEN_TOWER_PORTAL_EVENT_V1,
  RHIZOH_OPEN_WORKSPACE_EVENT_V1,
  RHIZOH_SHOW_INFO_EVENT_V1
} from "./rhizoh/runtime/symbyoMapIntentBridgeV0.js";
import { openCastleInitGateFromLocalCommandV0 } from "./rhizoh/runtime/rhizohLocalCommandHandlersV0.js";
import { CastleInitiationGateV0 } from "./components/CastleInitiationGateV0.jsx";
import { RhizohV11TowerWorkspaceHostV0 } from "./components/RhizohV11TowerWorkspaceHostV0.jsx";
import { RhizohCastleLibraryPanelV0 } from "./components/RhizohCastleLibraryPanelV0.jsx";
import { RhizohChessArenaWorkspaceV0 } from "./components/RhizohChessArenaWorkspaceV0.jsx";
import { RhizohTowerPortalDiscoveryV0 } from "./components/RhizohTowerPortalDiscoveryV0.jsx";
import { RhizohCastleLivingMemoryPanelV0 } from "./components/RhizohCastleLivingMemoryPanelV0.jsx";
import { RhizohWorldSpaceMediaTubeV0 } from "./components/RhizohWorldSpaceMediaTubeV0.jsx";
import { RhizohProductSurfaceDrawerV0 } from "./components/RhizohProductSurfaceDrawerV0.jsx";
import { getGenesisProtocolGatewayOrigin } from "./castleFlight/castleFlightConfig.js";
import { CASTLE_ARCHIVE_OPEN_MEDIA_EVENT_V0 } from "./rhizoh/runtime/castleArchiveVaultV0.js";
import { RhizohWorldSpaceC2cPanelV0 } from "./components/RhizohWorldSpaceC2cPanelV0.jsx";
import {
  RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1,
  RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1,
  RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1
} from "./rhizoh/runtime/sovereignWorldMapNodesV0.js";
import {
  readRemoteCastlesVisibleV0,
  subscribeRemoteCastlesVisibleV0,
  writeRemoteCastlesVisibleV0
} from "./rhizoh/runtime/remoteCastleMapVisibilityV0.js";
import { bootCastleC2cSignalingV0, disposeCastleC2cTransportV0 } from "./castleSocial/castleC2cWebRtcTransportV0.js";
import { bootLivingCastleMemoryV0 } from "./rhizoh/runtime/livingCastleMemoryV0.js";
import { bootRhizohLearningCoreV0 } from "./rhizoh/runtime/rhizohLearningCoreBootV0.js";
import {
  disposeCastleMemoryHooksV0,
  installCastleMemoryHooksV0
} from "./rhizoh/runtime/castleMemoryHooksV0.js";
import {
  completeCastleInitFromMapAnchorV0,
  installCastleInitMapPickListenerV0
} from "./castleFlight/castleInitiationProtocolV0.js";
import {
  applyDrawerDomainTagsV0,
  bootDrawerStateMachineV0,
  closeProductSurfaceDrawerV0,
  DRAWER_SHELL_ACTION_V0,
  getDrawerStateSnapshotV0,
  handleProductShellSelectV0,
  resolveDrawerDomainTagsV0,
  subscribeDrawerStateV0
} from "./rhizoh/runtime/rhizohDrawerStateMachineV0.js";
import {
  hydrateWorldSpaceCastleAnchorV0,
  persistWorldSpaceCastleAnchorV0
} from "./rhizoh/runtime/castleWorldSpaceContinuityV0.js";
import { bootRhizohOsStabilReleaseLayerV0 } from "./rhizoh/runtime/rhizohOsStabilReleaseLayerV0.js";
import { getActiveFederationOverlayNodeV0 } from "./rhizoh/runtime/rhizohDomainGraphV0.js";

export default function AppRhizohWorldSpaceV0() {
  const navigate = useNavigate();
  const castleAuth = useCastleAuth();
  const { remoteCastles, recordBridgePeer } = useCastleActiveCastles(castleAuth?.user?.uid);
  const remoteCastlesVisibleV0 = useSyncExternalStore(
    subscribeRemoteCastlesVisibleV0,
    readRemoteCastlesVisibleV0,
    () => false
  );
  const gateway = useRhizohGatewayMonitor();
  const uiLocale = readUiLocaleV0();
  const [infraTick, setInfraTick] = useState(0);
  const [geoPrompt, setGeoPrompt] = useState("unknown");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [v11NodePanel, setV11NodePanel] = useState(null);
  const [v11Workspace, setV11Workspace] = useState(null);
  const [v11Library, setV11Library] = useState(null);
  const [v11ChessArena, setV11ChessArena] = useState(null);
  const [v11TowerPortal, setV11TowerPortal] = useState(null);
  const [v11LivingMemory, setV11LivingMemory] = useState(false);
  const [v11MediaTube, setV11MediaTube] = useState(null);
  const [castleInitGateOpen, setCastleInitGateOpen] = useState(false);
  const [c2cPeer, setC2cPeer] = useState(null);

  const worldMapToolV0 = useSyncExternalStore(
    subscribeRhizohWorldMapToolV0,
    getRhizohWorldMapToolSnapshotV0,
    getRhizohWorldMapToolSnapshotV0
  );

  const mapSurfaceActive = true;
  const worldLayerEnabledV0 = isWorldLayerEnabled();
  const identityAnchorV0 = resolveUserCastleGeoForMapViewV0();
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
      resolveRhizohWorldSpaceCesiumActiveV0({
        pathname: "/world/space",
        worldDomain: RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE,
        mapTool: worldMapToolV0,
        mapSurfaceActive
      }),
    [worldMapToolV0, mapSurfaceActive]
  );

  const layerModeV0 = useMemo(
    () => resolveRhizohLayerModeV0({ pathname: "/world/space" }),
    []
  );

  const openPostCastleMediaTubeV0 = useCallback(
    (source = "castle_init") => {
      setV11MediaTube(
        Object.freeze({
          node: Object.freeze({
            id: "castle",
            label: "CASTLE",
            name: uiLocale === "tr" ? "Kale Yayını" : "Castle Broadcast",
            type: "broadcast",
            color: "#06b6d4",
            description:
              uiLocale === "tr"
                ? "Castle anchor tamamlandı — Symbio media tüneli açıldı."
                : "Castle anchor complete — Symbio media tube opened."
          }),
          title: uiLocale === "tr" ? "Kale Yayını — Castle Hub" : "Castle Broadcast — Castle Hub",
          source,
          initialChannelId: "castle_genesis"
        })
      );
      setV11Workspace(null);
      setV11NodePanel(null);
    },
    [uiLocale]
  );

  useEffect(() => {
    const uid = castleAuth?.user?.uid;
    if (!uid) return undefined;
    bootCastleC2cSignalingV0(uid);
    bootLivingCastleMemoryV0({
      userId: uid,
      founder: castleAuth?.user?.displayName || uid.slice(0, 8)
    });
    bootRhizohLearningCoreV0({ userId: uid });
    installCastleMemoryHooksV0(uid);
    return () => {
      disposeCastleC2cTransportV0();
      disposeCastleMemoryHooksV0();
    };
  }, [castleAuth?.user?.uid, castleAuth?.user?.displayName]);

  useEffect(() => {
    const onRemoteCastle = (ev) => {
      const detail = ev?.detail;
      if (!detail?.uid) return;
      setC2cPeer(Object.freeze({ ...detail }));
      setV11NodePanel(null);
    };
    window.addEventListener(RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1, onRemoteCastle);
    return () => window.removeEventListener(RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1, onRemoteCastle);
  }, []);

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

    const nexusGeo = resolveUserCastleGeoForMapViewV0();
    const savedTool = readRhizohWorldMapToolV0();
    const nextTool = normalizeRhizohWorldSpaceLeafletToolV0(
      !nexusGeo || savedTool === "globe" ? "city_map" : savedTool
    );
    writeRhizohWorldMapToolV0(nextTool);

    return () => clearSpatialRealityInfraV0();
  }, []);

  useEffect(() => {
    attachRhizohMapExecutionOrchestratorV1();

    const onOpenCastleGate = () => setCastleInitGateOpen(true);
    window.addEventListener("castle:open-init-gate-v0", onOpenCastleGate);
    window.addEventListener("castle:open-anchor-offer-v0", onOpenCastleGate);

    const onSovereignWarp = (ev) => {
      const detail = ev?.detail;
      const lat = Number(detail?.lat);
      const lon = Number(detail?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      try {
        window.__CASTLE_CESIUM__?.flyToCustom?.(lat, lon, 1200, { source: detail?.source || "voice_warp" });
      } catch {
        /* noop */
      }
    };
    window.addEventListener(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, onSovereignWarp);

    const onWorkspace = (ev) => {
      const detail = ev?.detail;
      if (!detail?.node) return;
      const nodeType = String(detail.node.type || "");
      if (nodeType === "tower") {
        setV11Workspace(detail);
        setV11MediaTube(null);
        setV11NodePanel(null);
      } else if (detail.mediaPlayer) {
        setV11MediaTube(
          Object.freeze({
            node: detail.node,
            title: detail.node.name || detail.node.label,
            source: `map:node:${detail.node?.id || "unknown"}`,
            initialChannelId: detail.initialChannelId
          })
        );
        setV11Workspace(null);
        setV11NodePanel(null);
      } else {
        setV11NodePanel(
          detail.routed || {
            nodeView: detail.node,
            normalizedDecision: { decision: "LOAD_WORLD_NODE" }
          }
        );
        setV11Workspace(null);
        setV11MediaTube(null);
      }
    };
    const onLibrary = (ev) => {
      const detail = ev?.detail;
      if (!detail?.node) return;
      setV11Library(detail);
      setV11ChessArena(null);
      setV11Workspace(null);
      setV11MediaTube(null);
      setV11NodePanel(null);
    };
    const onChessArena = (ev) => {
      const detail = ev?.detail;
      if (!detail?.node) return;
      setV11ChessArena(detail);
      setV11Library(null);
      setV11Workspace(null);
      setV11MediaTube(null);
      setV11TowerPortal(null);
      setV11NodePanel(null);
    };
    const onTowerPortal = (ev) => {
      const detail = ev?.detail;
      if (!detail?.node) return;
      setV11TowerPortal(detail);
      setV11Library(null);
      setV11Workspace(null);
      setV11MediaTube(null);
      setV11ChessArena(null);
      setV11NodePanel(null);
    };
    const onArchiveMedia = (ev) => {
      const entity = ev?.detail?.entity;
      if (!entity) return;
      setV11MediaTube(
        Object.freeze({
          node: Object.freeze({
            id: `archive:${entity.id}`,
            label: "ARCHIVE",
            name: entity.title,
            type: "vault",
            color: "#f59e0b"
          }),
          title: entity.title,
          source: `archive:${entity.id}`,
          initialChannelId: "archive_document",
          archiveEntity: entity
        })
      );
      setV11Library(null);
      setV11NodePanel(null);
    };

    const onMediaTube = (ev) => {
      const detail = ev?.detail;
      if (!detail) return;
      setV11MediaTube(detail);
      setV11Workspace(null);
      setV11NodePanel(null);
      setV11Library(null);
      setV11ChessArena(null);
    };
    const onCastle = () => {
      openCastleInitGateFromLocalCommandV0("v11_map_orchestrator");
    };
    const onInfo = (ev) => {
      const detail = ev?.detail;
      if (!detail?.node) return;
      setV11NodePanel(detail.routed || { nodeView: detail.node, normalizedDecision: { decision: "LOAD_WORLD_NODE" } });
    };

    window.addEventListener(RHIZOH_OPEN_WORKSPACE_EVENT_V1, onWorkspace);
    window.addEventListener(RHIZOH_OPEN_LIBRARY_EVENT_V1, onLibrary);
    window.addEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
    window.addEventListener(RHIZOH_OPEN_TOWER_PORTAL_EVENT_V1, onTowerPortal);
    window.addEventListener(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, onMediaTube);
    window.addEventListener(RHIZOH_OPEN_CASTLE_EVENT_V1, onCastle);
    window.addEventListener(RHIZOH_SHOW_INFO_EVENT_V1, onInfo);
    window.addEventListener(CASTLE_ARCHIVE_OPEN_MEDIA_EVENT_V0, onArchiveMedia);
    return () => {
      window.removeEventListener("castle:open-init-gate-v0", onOpenCastleGate);
      window.removeEventListener("castle:open-anchor-offer-v0", onOpenCastleGate);
      window.removeEventListener(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, onSovereignWarp);
      window.removeEventListener(RHIZOH_OPEN_WORKSPACE_EVENT_V1, onWorkspace);
      window.removeEventListener(RHIZOH_OPEN_LIBRARY_EVENT_V1, onLibrary);
      window.removeEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
      window.removeEventListener(RHIZOH_OPEN_TOWER_PORTAL_EVENT_V1, onTowerPortal);
      window.removeEventListener(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, onMediaTube);
      window.removeEventListener(RHIZOH_OPEN_CASTLE_EVENT_V1, onCastle);
      window.removeEventListener(RHIZOH_SHOW_INFO_EVENT_V1, onInfo);
      window.removeEventListener(CASTLE_ARCHIVE_OPEN_MEDIA_EVENT_V0, onArchiveMedia);
    };
  }, []);

  useEffect(() => {
    const onV11Intent = (ev) => {
      const detail = ev?.detail;
      if (!detail?.nodeView) return;
      if (detail?.intent?.intent === "PREVIEW_NODE") {
        setV11NodePanel(detail);
      }
    };
    window.addEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, onV11Intent);
    return () => window.removeEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, onV11Intent);
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
  const castleInitOwner = castleAuth?.user?.uid || "GUEST";

  useEffect(() => {
    hydrateWorldSpaceCastleAnchorV0({
      readClientContinuity: readWorldSpaceClientContinuityV0
    });
  }, []);

  const applySpatialCastleAnchorDsl = useCallback(
    async (parsed) => {
      if (!parsed?.verb) return { ok: false, reply: "Geçersiz DSL." };
      if (parsed.verb !== "SPAWN_CASTLE") {
        return { ok: false, reply: "Spatial shell: yalnızca castle anchor." };
      }
      const lat = Number(parsed.args.lat);
      const lon = Number(parsed.args.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return { ok: false, reply: "lat/lon gerekli." };
      }
      persistWorldSpaceCastleAnchorV0(lat, lon, {
        owner: castleInitOwner,
        source: "world_space_dsl",
        readClientContinuity: readWorldSpaceClientContinuityV0,
        writeClientContinuity: writeWorldSpaceClientContinuityV0
      });
      return { ok: true, reply: "Castle anchor bağlandı." };
    },
    [castleInitOwner]
  );

  useEffect(() => {
    return installCastleInitMapPickListenerV0((anchorDetail) => {
      void completeCastleInitFromMapAnchorV0(anchorDetail, {
        owner: castleInitOwner,
        castleType: "SANCTUARY",
        applyPersonalCastleDsl: applySpatialCastleAnchorDsl
      }).then((out) => {
        setCastleInitGateOpen(false);
        if (out?.ok) openPostCastleMediaTubeV0("castle_init_map");
      });
    });
  }, [castleInitOwner, applySpatialCastleAnchorDsl, openPostCastleMediaTubeV0]);

  const onApplyWorldMapToolV0 = useCallback((mapTool, source = "WORLD_DOMAIN_MAP_STRIP") => {
    void applyRhizohWorldMapToolV0(mapTool, {
      leafletOnly: true,
      source
    });
  }, []);

  const appRootRef = useRef(null);

  const onProductShellSelect = useCallback(
    (id) => {
      const result = handleProductShellSelectV0(id, {
        pathname: "/world/space",
        inPlace: true,
        worldPath: "/world/space"
      });
      if (result.action === DRAWER_SHELL_ACTION_V0.NAVIGATE) {
        navigate(resolveRhizohProductPathV0(result.surface));
      } else if (result.navigateTo) {
        navigate(result.navigateTo);
      }
      applyDrawerDomainTagsV0(appRootRef.current, result.tags);
    },
    [navigate]
  );

  const drawerStateV0 = useSyncExternalStore(
    subscribeDrawerStateV0,
    getDrawerStateSnapshotV0,
    getDrawerStateSnapshotV0
  );
  const chromePanelsV0 = drawerStateV0.panels;
  const openSurfaceDrawerIdV0 = drawerStateV0.openDrawerId;

  const onCloseSurfaceDrawerV0 = useCallback(() => {
    closeProductSurfaceDrawerV0();
  }, []);

  useEffect(() => {
    const tags = resolveDrawerDomainTagsV0(openSurfaceDrawerIdV0, {
      pathname: "/world/space",
      surfaceId: openSurfaceDrawerIdV0 || "world",
      overlayNode: getActiveFederationOverlayNodeV0()
    });
    applyDrawerDomainTagsV0(appRootRef.current, tags);
  }, [openSurfaceDrawerIdV0]);

  useEffect(() => {
    bootDrawerStateMachineV0();
    return bootRhizohOsStabilReleaseLayerV0();
  }, []);

  const onLibrarySeedIntentV0 = useCallback(() => {
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_OPEN_LIBRARY_EVENT_V1, {
          detail: Object.freeze({
            node: Object.freeze({
              id: "library",
              label: "LIBRARY",
              name: uiLocale === "tr" ? "Codex Vault" : "Codex Vault",
              type: "vault",
              color: "#f59e0b"
            }),
            source: "capability_halo"
          })
        })
      );
    } catch {
      /* noop */
    }
  }, [uiLocale]);

  const mapStripBottomCssV0 = resolveRhizohWorldSpaceMapStripBottomCssV0();
  const voiceDockBottomCssV0 = resolveRhizohWorldSpaceVoiceDockBottomCssV0();
  const bootstrapPlaceLabelV0 = resolveWorldMapBootstrapGeoV0().label;

  return (
    <div
      ref={appRootRef}
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
        remoteCastles={remoteCastles}
        remoteCastlesVisible={remoteCastlesVisibleV0}
      />

      <RhizohWorldDomainShellV0
        domain={RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE}
        layerMode={layerModeV0}
        uiLocale={uiLocale}
        activeMapTool={worldMapToolV0}
        onSelectMapTool={(toolId) => onApplyWorldMapToolV0(toolId, "WORLD_DOMAIN_MAP_STRIP")}
        spatialEngineActive
        mapToolCesiumReady={false}
        onOpenGreenroom={() => navigate("/greenroom/main")}
        onOpenBroadcast={() => navigate("/broadcast/main")}
        onShareInvite={() => {}}
        onModeSelect={() => navigate("/world/modes")}
        onCapNodeIntent={handleWorldSpaceCapWheelNodeV0}
        onSeedIntent={onLibrarySeedIntentV0}
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

      <UnifiedProductShellBar
        active="world"
        panelOpen={chromePanelsV0}
        onSelect={onProductShellSelect}
        uiLocale={uiLocale}
      />

      {openSurfaceDrawerIdV0 ? (
        <RhizohProductSurfaceDrawerV0
          surface={openSurfaceDrawerIdV0}
          open
          onClose={onCloseSurfaceDrawerV0}
          auth={castleAuth}
          gatewayOrigin={getGenesisProtocolGatewayOrigin()}
          uiLocale={uiLocale}
        />
      ) : null}

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

      {remoteCastles.length && !castleAuth.needsAuthGate ? (
        <div className="pointer-events-none fixed left-4 top-28 z-[26]">
          <button
            type="button"
            onClick={() => writeRemoteCastlesVisibleV0(!remoteCastlesVisibleV0)}
            className={`pointer-events-auto rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
              remoteCastlesVisibleV0
                ? "border-gray-400/50 bg-gray-500/20 text-gray-100"
                : "border-white/15 bg-black/70 text-white/55 hover:text-white"
            }`}
          >
            {uiLocale === "tr"
              ? remoteCastlesVisibleV0
                ? `${remoteCastles.length} peer kale gizle`
                : `${remoteCastles.length} peer kale göster`
              : remoteCastlesVisibleV0
                ? `Hide ${remoteCastles.length} peer castles`
                : `Show ${remoteCastles.length} peer castles`}
          </button>
        </div>
      ) : null}

      {c2cPeer && !v11MediaTube ? (
        <RhizohWorldSpaceC2cPanelV0
          peer={c2cPeer}
          userId={castleAuth?.user?.uid || ""}
          uiLocale={uiLocale}
          recordBridgePeer={recordBridgePeer}
          onClose={() => setC2cPeer(null)}
        />
      ) : null}

      {v11MediaTube ? (
        <RhizohWorldSpaceMediaTubeV0
          detail={v11MediaTube}
          onClose={() => setV11MediaTube(null)}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11Workspace && !v11MediaTube && !v11Library && !v11ChessArena ? (
        <RhizohV11TowerWorkspaceHostV0
          workspaceDetail={v11Workspace}
          onClose={() => setV11Workspace(null)}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11Library && !v11MediaTube ? (
        <RhizohCastleLibraryPanelV0
          open
          node={v11Library.node}
          onClose={() => setV11Library(null)}
          onOpenLivingMemory={() => setV11LivingMemory(true)}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11LivingMemory && !v11MediaTube ? (
        <RhizohCastleLivingMemoryPanelV0
          open
          onClose={() => setV11LivingMemory(false)}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11ChessArena && !v11MediaTube ? (
        <RhizohChessArenaWorkspaceV0
          open
          node={v11ChessArena.node}
          peerCastle={v11ChessArena.peerCastle || null}
          onClose={() => setV11ChessArena(null)}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11TowerPortal && !v11MediaTube && !v11ChessArena ? (
        <RhizohTowerPortalDiscoveryV0
          open
          node={v11TowerPortal.node}
          userId={castleAuth?.user?.uid || ""}
          onClose={() => setV11TowerPortal(null)}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11NodePanel && !v11Workspace && !v11MediaTube && !v11Library && !v11ChessArena && !v11TowerPortal ? (
        <div className="pointer-events-none fixed inset-x-0 top-28 z-[27] flex justify-center px-4">
          <div
            className="pointer-events-auto w-full max-w-sm rounded-2xl border bg-black/85 p-3 text-white shadow-2xl backdrop-blur-md"
            style={{ borderColor: `${v11NodePanel.nodeView.color}66` }}
            data-rhizoh-v11-node-panel="1"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
                  {uiLocale === "tr" ? "V11 düğüm" : "V11 node"}
                </p>
                <h2 className="mt-1 text-sm font-black" style={{ color: v11NodePanel.nodeView.color }}>
                  {v11NodePanel.nodeView.label}
                </h2>
                <p className="mt-1 text-[10px] text-white/55">
                  {v11NodePanel.nodeView.type} · {v11NodePanel.normalizedDecision?.decision || "LOAD_WORLD_NODE"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setV11NodePanel(null)}
                className="rounded-lg border border-white/15 px-2 py-1 text-[10px] text-white/60 hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-white/65">
              {uiLocale === "tr"
                ? "Harita niyeti üretildi; yürütme kararı orkestratörde kalır."
                : "Map intent emitted; execution remains with the orchestrator."}
            </p>
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

      <CastleInitiationGateV0
        open={castleInitGateOpen}
        onClose={() => setCastleInitGateOpen(false)}
        owner={castleInitOwner}
        castleType="SANCTUARY"
        applyPersonalCastleDsl={applySpatialCastleAnchorDsl}
        setRealityMode={setRealityMode}
        readClientContinuity={readWorldSpaceClientContinuityV0}
        writeClientContinuity={writeWorldSpaceClientContinuityV0}
        onComplete={(out) => {
          if (out?.source === "map") return;
          setCastleInitGateOpen(false);
          if (out?.ok !== false) {
            openPostCastleMediaTubeV0(`castle_init_${out?.source || "gate"}`);
          }
        }}
      />
    </div>
  );
}

function readWorldSpaceClientContinuityV0() {
  try {
    const raw = window.localStorage.getItem("rhizoh.continuity.v1") || "";
    if (!raw) return { turns: [], persona: {}, meta: {} };
    const parsed = JSON.parse(raw);
    return {
      turns: Array.isArray(parsed?.turns) ? parsed.turns.slice(-10) : [],
      persona: parsed?.persona && typeof parsed.persona === "object" ? parsed.persona : {},
      meta: parsed?.meta && typeof parsed.meta === "object" ? parsed.meta : {}
    };
  } catch {
    return { turns: [], persona: {}, meta: {} };
  }
}

function writeWorldSpaceClientContinuityV0(next) {
  try {
    window.localStorage.setItem("rhizoh.continuity.v1", JSON.stringify(next));
  } catch {
    /* noop */
  }
}
