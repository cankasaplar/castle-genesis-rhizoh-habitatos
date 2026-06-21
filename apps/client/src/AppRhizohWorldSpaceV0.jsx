/**
 * World · Space — dedicated map boot (no AppRhizoh528T0 / ApexEngine / fox stage).
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./castleFlight/registerGlobals.js";
import { useCastleAuth } from "./firebase/useCastleAuth.js";
import { CastleAuthOverlay } from "./auth/CastleAuthOverlay.jsx";
import { useRhizohGatewayMonitor } from "./rhizoh/useRhizohGatewayMonitor.js";
import { UnifiedProductShellBar } from "./studio/ui/UnifiedProductShellBar.jsx";
import { RhizohWorldDomainShellV0 } from "./components/RhizohWorldDomainShellV0.jsx";
import {
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0,
  RhizohWorldSpaceMapHostV0
} from "./components/RhizohWorldSpaceMapHostV0.jsx";
import { RhizohWorldSpaceVoiceDockV0 } from "./components/RhizohWorldSpaceVoiceDockV0.jsx";
import { RhizohConversationDockShellV0 } from "./components/RhizohConversationDockShellV0.jsx";
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
  resolveRhizohWorldSpaceCesiumActiveV0,
  isRhizohWorldSpaceCesiumEnvEnabledV0
} from "./rhizoh/runtime/rhizohLayerContextV0.js";
import { RHIZOH_WORLD_DRAWER_DOMAIN_V0, writeRhizohWorldDrawerDomainV0 } from "./rhizoh/runtime/rhizohWorldDrawerDomainV0.js";
import { resolveWorldDomainFromPathV0 } from "./rhizoh/runtime/rhizohWorldDomainRoutesV0.js";
import { shouldObserverInviteLandHomeV0 } from "./rhizoh/ingress/observerInviteLandingV0.js";
import { observeV0 } from "./rhizoh/ingress/observerReadOnlyHookV0.js";
import { RHIZOH_MAP_OVERLAY_PANEL_CLASS_V0 } from "./rhizoh/runtime/rhizohWorldMapPanelSurfaceV0.js";
import {
  resolveRhizohUiLayoutV0,
  RHIZOH_UI_SURFACE_V0
} from "./rhizoh/runtime/rhizohUiLayoutResolverV0.js";
import { navigateRhizohProductSurfaceV0 } from "./rhizoh/product/rhizohProductTopologyV0.js";
import { publishRhizohSpatialModeV0 } from "./rhizoh/runtime/rhizohSpatialModeV0.js";
import { publishRhizohMapPinOwnerRegistryV0, installRhizohMapPinOwnerAutoRefreshV0 } from "./rhizoh/runtime/rhizohMapPinOwnerV0.js";
import {
  configureSpatialRealityInfraV0,
  clearSpatialRealityInfraV0
} from "./rhizoh/spatial/spatialRealityInfraV0.js";
import { reconcileMapSurfaceFromGateway, setRealityMode } from "./reality/realityDirector.js";
import { readUiLocaleV0 } from "./rhizoh/runtime/rhizohUiLocaleV0.js";
import { handleWorldSpaceCapWheelNodeV0 } from "./rhizoh/runtime/rhizohWorldSpaceCapWheelV0.js";
import {
  readCastleNexusGeoV0,
  resolveUserCastleGeoForMapViewV0,
  resolveWorldMapBootstrapGeoV0,
  publishWorldMapObservationOriginV0
} from "./rhizoh/runtime/worldMapBootstrapGeoV0.js";
import {
  queryWorldMapGeoPermissionV0,
  requestWorldMapGeoV0,
  WORLD_MAP_GEO_REQUEST_EVENT_V0
} from "./rhizoh/runtime/worldMapGeoRequestV0.js";
import { useCastleActiveCastles } from "./firebase/useCastleActiveCastles.js";
import { isWorldLayerEnabled } from "./rhizoh/runtime/castleWorldLayerGateV0.js";
import { runDomainGateForPathV0, startRhizohSpatialExecutionTickV0 } from "./rhizoh/runtime/rhizohDomainNervousSystemV0.js";
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
import { RhizohSpiralMMOPortalWorkspaceV0 } from "./components/RhizohSpiralMMOPortalWorkspaceV0.jsx";
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
import {
  dispatchWorldSpaceMapFlyV0,
  installWorldSpaceMapCommandFacadeV0
} from "./rhizoh/runtime/worldSpaceMapCommandFacadeV0.js";
import { getActiveFederationOverlayNodeV0 } from "./rhizoh/runtime/rhizohDomainGraphV0.js";
import {
  RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0,
  RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0
} from "./rhizoh/runtime/spiralMMOAwakeningCycleV0.js";
import { startCanonicalTickClientV0 } from "./core/canonicalTickClientV0.js";
import { runAfterV11LeafletReadyV0 } from "./rhizoh/runtime/worldSpaceMapBootGateV0.js";
import { startYoutubeLabOctoBridgeV1, RHIZOH_OCTO_LAB_DISMISS_EVENT_V1 } from "./rhizoh/runtime/octoYuvaMediaLabBridgeV1.js";
import { startRhizohLegalPendingWaitLoopV0 } from "./rhizoh/runtime/rhizohLegalPendingWaitLoopV0.js";
import { startCityMapLegalCountdownMediaGateV0 } from "./rhizoh/runtime/cityMapLegalCountdownMediaGateV0.js";
import { RhizohCityMapLegalCountdownStripV0 } from "./components/RhizohCityMapLegalCountdownStripV0.jsx";
import { resolveWorldEntryMapToolV0, isWorldDomainCalmModeV0 } from "./rhizoh/runtime/worldDomainCalmModeV0.js";
import { runSpiralImmersionEnterStagedV0, clearMapTransitionBusyV0 } from "./rhizoh/runtime/worldMapMeaningfulTransitionV0.js";
import { releaseBroadcastForArenaPlayV0 } from "./rhizoh/runtime/chessEngineContentionGateV0.js";
import { RhizohMapTransitionApproachStripV0 } from "./components/RhizohMapTransitionApproachStripV0.jsx";
import { loadRhizohExperienceSessionContextV0 } from "./rhizoh/experience/rhizohExperienceSessionContextV0.js";
import { loadRhizohProductSession } from "./rhizoh/product/rhizohProductSessionPersistenceV1.js";
import {
  applySpiralMapLayerFromQueryV0,
  focusSpiralMapLayerV0,
  SPIRAL_MAP_LAYER_FILTER_EVENT_V0
} from "./rhizoh/runtime/spiralMapLayerFilterStateV0.js";
import {
  ensureSpiralMapRealityModeHydratedV0,
  publishSpiralMapRealityDevtoolsV0,
  SPIRAL_MAP_REALITY_MODE_EVENT_V0
} from "./rhizoh/runtime/spiralMapRealityModeV0.js";
import { SPIRAL_MAP_LAYER_V0 } from "./rhizoh/runtime/spatialDistributionLayerV0.js";
import { startSportsLiveInjectionV0 } from "./rhizoh/runtime/worldMapSportsLiveInjectionV0.js";
import {
  SHADOW_CASTLE_REACTION_EVENT_V0,
  emitCastleVisitEchoShadowEventV0,
  flyToShadowPeerCastleV0,
  startShadowDataPlaneLoopV0
} from "./rhizoh/runtime/shadowDataPlaneLoopV0.js";
import {
  bindShadowCastleReactionPeerV0,
  bindShadowCastleSimPeerV0,
  clearShadowCastleReactionPeerV0,
  publishShadowCastlePeerRegistryV0
} from "./rhizoh/runtime/shadowCastlePeerRegistryV0.js";
import {
  publishShadowCastleInboxDevtoolsV0,
  startShadowCastleInboxV0
} from "./rhizoh/runtime/shadowCastleInboxV0.js";
import { RhizohCastleShadowInboxV0 } from "./components/RhizohCastleShadowInboxV0.jsx";

function resolveSpiralLayerFromHaloFocusV0(layerFocus) {
  const focus = Number(layerFocus);
  if (focus === 13) return SPIRAL_MAP_LAYER_V0.EXPLORER;
  if (focus === 10 || focus === 11) return SPIRAL_MAP_LAYER_V0.CASTLE;
  if (focus === 6) return SPIRAL_MAP_LAYER_V0.ECONOMY;
  return null;
}

export default function AppRhizohWorldSpaceV0() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [spiralImmersionActive, setSpiralImmersionActive] = useState(false);
  const [shadowReactionToast, setShadowReactionToast] = useState(null);
  const preSpiralMapToolRef = useRef(null);
  const experienceSessionCtxV0 = useMemo(() => loadRhizohExperienceSessionContextV0(), []);
  const productSessionV0 = useMemo(() => loadRhizohProductSession(), []);

  useEffect(() => {
    if (!shouldObserverInviteLandHomeV0()) return;
    navigate("/", { replace: true });
  }, [navigate]);

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
    () => resolveRhizohLayerModeV0({ pathname: location.pathname || "/world/space" }),
    [location.pathname]
  );

  const worldDrawerDomainV0 = useMemo(() => {
    const fromPath = resolveWorldDomainFromPathV0(location.pathname);
    return fromPath || RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE;
  }, [location.pathname]);

  useEffect(() => {
    publishRhizohMapPinOwnerRegistryV0({
      pathname: location.pathname || "/world/space",
      worldDomain: worldDrawerDomainV0,
      mapTool: worldMapToolV0,
      mapSurfaceActive
    });
  }, [location.pathname, worldDrawerDomainV0, worldMapToolV0, mapSurfaceActive, cesiumLayerActiveV0]);

  useEffect(() => {
    const refreshPins = () => {
      publishRhizohMapPinOwnerRegistryV0({
        pathname: location.pathname || "/world/space",
        worldDomain: worldDrawerDomainV0,
        mapTool: worldMapToolV0,
        mapSurfaceActive
      });
    };
    window.addEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, refreshPins);
    window.addEventListener(SPIRAL_MAP_REALITY_MODE_EVENT_V0, refreshPins);
    return () => {
      window.removeEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, refreshPins);
      window.removeEventListener(SPIRAL_MAP_REALITY_MODE_EVENT_V0, refreshPins);
    };
  }, [location.pathname, worldDrawerDomainV0, worldMapToolV0, mapSurfaceActive]);

  useEffect(() => {
    writeRhizohWorldDrawerDomainV0(worldDrawerDomainV0);
  }, [worldDrawerDomainV0]);

  useEffect(() => {
    applySpiralMapLayerFromQueryV0(location.search);
  }, [location.search]);

  const onSpiralMapLayerFocusV0 = useCallback((layerFocus) => {
    if (typeof layerFocus === "string") {
      focusSpiralMapLayerV0(layerFocus);
      return;
    }
    const spiral = resolveSpiralLayerFromHaloFocusV0(layerFocus);
    if (spiral) focusSpiralMapLayerV0(spiral);
  }, []);

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
      writeRemoteCastlesVisibleV0(true);
      bindShadowCastleReactionPeerV0(detail);
      emitCastleVisitEchoShadowEventV0(detail);
      setC2cPeer(Object.freeze({ ...detail }));
      setV11NodePanel(null);
    };
    window.addEventListener(RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1, onRemoteCastle);
    return () => window.removeEventListener(RHIZOH_REMOTE_CASTLE_CLICK_EVENT_V1, onRemoteCastle);
  }, []);

  useEffect(() => {
    publishShadowCastlePeerRegistryV0({
      remoteCastles,
      remoteCastlesVisible: remoteCastlesVisibleV0,
      ...(c2cPeer != null ? { boundPeer: c2cPeer } : {})
    });
  }, [remoteCastles, remoteCastlesVisibleV0, c2cPeer]);

  useEffect(() => {
    runDomainGateForPathV0("/world/space", {
      userId: castleAuth?.user?.uid || null,
      coreOnly: true
    });
  }, [castleAuth?.user?.uid]);

  useEffect(() => {
    writeRhizohWorldDrawerDomainV0(RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE);
    publishRhizohSpatialModeV0();
    ensureSpiralMapRealityModeHydratedV0();
    publishSpiralMapRealityDevtoolsV0();
    configureSpatialRealityInfraV0({
      gatewayPhase: gateway.phase,
      mapSurfaceActive: true,
      onSync: () => setInfraTick((n) => n + 1)
    });

    const nexusGeo = resolveUserCastleGeoForMapViewV0();
    const savedTool = readRhizohWorldMapToolV0();
    const nextTool = normalizeRhizohWorldSpaceLeafletToolV0(
      resolveWorldEntryMapToolV0(savedTool, Boolean(nexusGeo))
    );
    writeRhizohWorldMapToolV0(nextTool);

    const stopMapPinOwnerAutoRefresh = installRhizohMapPinOwnerAutoRefreshV0({
      pathname: "/world/space",
      worldDomain: RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE,
      mapSurfaceActive: true
    });

    return () => {
      stopMapPinOwnerAutoRefresh?.();
      clearSpatialRealityInfraV0();
    };
  }, []);

  useEffect(() => {
    return runAfterV11LeafletReadyV0(() => {
      startRhizohSpatialExecutionTickV0();
    });
  }, []);

  useEffect(() => {
    attachRhizohMapExecutionOrchestratorV1();
    installWorldSpaceMapCommandFacadeV0();

    let cancelled = false;
    /** @type {(() => void) | null} */
    let stopYoutubeLab = null;
    /** @type {(() => void) | null} */
    let stopLegalPendingLoop = null;
    /** @type {(() => void) | null} */
    let stopCityMapLegalGate = null;
    /** @type {(() => void) | null} */
    let stopSportsLiveInjection = null;
    /** @type {(() => void) | null} */
    let stopShadowDataPlane = null;
    /** @type {(() => void) | null} */
    let stopShadowInbox = null;

    const startDeferredWorldSpaceLoopsV0 = () => {
      if (cancelled) return;
      startCanonicalTickClientV0();
      stopYoutubeLab = startYoutubeLabOctoBridgeV1();
      stopLegalPendingLoop = startRhizohLegalPendingWaitLoopV0();
      stopCityMapLegalGate = startCityMapLegalCountdownMediaGateV0({ uiLocale });
      stopSportsLiveInjection = startSportsLiveInjectionV0({ locale: uiLocale, intervalMs: 90_000 });
      stopShadowDataPlane = startShadowDataPlaneLoopV0();
      stopShadowInbox = startShadowCastleInboxV0();
      publishShadowCastleInboxDevtoolsV0();
    };

    const deferredBootHandle =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback(startDeferredWorldSpaceLoopsV0, { timeout: 3200 })
        : window.setTimeout(startDeferredWorldSpaceLoopsV0, 700);

    const onShadowReaction = (ev) => {
      const toast = ev?.detail?.reaction?.toast;
      if (!toast) return;
      const message = uiLocale === "tr" ? toast.tr : toast.en;
      setShadowReactionToast(Object.freeze({ message, atMs: Date.now() }));
      window.setTimeout(() => setShadowReactionToast(null), 5200);
    };
    window.addEventListener(SHADOW_CASTLE_REACTION_EVENT_V0, onShadowReaction);

    const onOpenCastleGate = () => setCastleInitGateOpen(true);
    window.addEventListener("castle:open-init-gate-v0", onOpenCastleGate);
    window.addEventListener("castle:open-anchor-offer-v0", onOpenCastleGate);

    const onSovereignWarp = (ev) => {
      const detail = ev?.detail;
      const lat = Number(detail?.lat);
      const lon = Number(detail?.lon);
      const zoom = Number(detail?.zoom) || 14;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      dispatchWorldSpaceMapFlyV0({
        lat,
        lon,
        zoom,
        source: detail?.source || "voice_warp"
      });
    };
    window.addEventListener(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, onSovereignWarp);

    const onWorkspace = (ev) => {
      const detail = ev?.detail;
      if (!detail?.node) return;
      clearMapTransitionBusyV0("workspace_open");
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
      clearMapTransitionBusyV0("library_open");
      setV11Library(detail);
      setV11ChessArena(null);
      setV11Workspace(null);
      setV11MediaTube(null);
      setV11NodePanel(null);
    };
    const onChessArena = (ev) => {
      const detail = ev?.detail;
      if (!detail?.node) return;
      observeV0({ type: "chess_arena_open", target: detail?.node?.id || "arena", meta: { surface: "chess", focus: 0.45 } });
      clearMapTransitionBusyV0("chess_arena_open");
      releaseBroadcastForArenaPlayV0();
      window.dispatchEvent(new CustomEvent(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0));
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
      clearMapTransitionBusyV0("tower_portal_open");
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
      clearMapTransitionBusyV0("media_tube_open");
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
      if (detail.node.type === "spiralmmo") return;
      setV11NodePanel(detail.routed || { nodeView: detail.node, normalizedDecision: { decision: "LOAD_WORLD_NODE" } });
    };

    window.addEventListener(RHIZOH_OPEN_WORKSPACE_EVENT_V1, onWorkspace);
    window.addEventListener(RHIZOH_OPEN_LIBRARY_EVENT_V1, onLibrary);
    window.addEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
    window.addEventListener(RHIZOH_OPEN_TOWER_PORTAL_EVENT_V1, onTowerPortal);
    const onOctoLabDismiss = () => setV11MediaTube(null);
    window.addEventListener(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, onMediaTube);
    window.addEventListener(RHIZOH_OCTO_LAB_DISMISS_EVENT_V1, onOctoLabDismiss);
    window.addEventListener(RHIZOH_OPEN_CASTLE_EVENT_V1, onCastle);
    window.addEventListener(RHIZOH_SHOW_INFO_EVENT_V1, onInfo);
    window.addEventListener(CASTLE_ARCHIVE_OPEN_MEDIA_EVENT_V0, onArchiveMedia);
    return () => {
      cancelled = true;
      if (typeof requestIdleCallback !== "undefined" && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(deferredBootHandle);
      } else {
        window.clearTimeout(deferredBootHandle);
      }
      stopYoutubeLab?.();
      stopLegalPendingLoop?.();
      stopCityMapLegalGate?.();
      stopSportsLiveInjection?.();
      stopShadowDataPlane?.();
      stopShadowInbox?.();
      window.removeEventListener(SHADOW_CASTLE_REACTION_EVENT_V0, onShadowReaction);
      window.removeEventListener("castle:open-init-gate-v0", onOpenCastleGate);
      window.removeEventListener("castle:open-anchor-offer-v0", onOpenCastleGate);
      window.removeEventListener(RHIZOH_SOVEREIGN_VOICE_WARP_EVENT_V1, onSovereignWarp);
      window.removeEventListener(RHIZOH_OPEN_WORKSPACE_EVENT_V1, onWorkspace);
      window.removeEventListener(RHIZOH_OPEN_LIBRARY_EVENT_V1, onLibrary);
      window.removeEventListener(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, onChessArena);
      window.removeEventListener(RHIZOH_OPEN_TOWER_PORTAL_EVENT_V1, onTowerPortal);
      window.removeEventListener(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, onMediaTube);
      window.removeEventListener(RHIZOH_OCTO_LAB_DISMISS_EVENT_V1, onOctoLabDismiss);
      window.removeEventListener(RHIZOH_OPEN_CASTLE_EVENT_V1, onCastle);
      window.removeEventListener(RHIZOH_SHOW_INFO_EVENT_V1, onInfo);
      window.removeEventListener(CASTLE_ARCHIVE_OPEN_MEDIA_EVENT_V0, onArchiveMedia);
    };
  }, []);

  useEffect(() => {
    const onV11Intent = (ev) => {
      const detail = ev?.detail;
      if (!detail?.nodeView) return;
      if (detail.nodeView.type === "spiralmmo") return;
      if (detail?.intent?.intent === "PREVIEW_NODE") {
        setV11NodePanel(detail);
      }
    };
    const onClearPreview = () => setV11NodePanel(null);
    window.addEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, onV11Intent);
    window.addEventListener(RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0, onClearPreview);
    return () => {
      window.removeEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, onV11Intent);
      window.removeEventListener(RHIZOH_V11_MAP_CLEAR_PREVIEW_EVENT_V0, onClearPreview);
    };
  }, []);

  useEffect(() => {
    const enterImmersion = () => {
      preSpiralMapToolRef.current = readRhizohWorldMapToolV0();
      runSpiralImmersionEnterStagedV0(() => {
        setSpiralImmersionActive(true);
        setV11NodePanel(null);
        closeProductSurfaceDrawerV0();
      });
    };
    const exitImmersion = (ev) => {
      setSpiralImmersionActive(false);
      setV11NodePanel(null);
      const requestedRaw = ev?.detail?.requestedMapTool;
      const requested =
        requestedRaw != null && String(requestedRaw).trim() !== ""
          ? normalizeRhizohWorldSpaceLeafletToolV0(requestedRaw)
          : null;
      const restore = preSpiralMapToolRef.current;
      const nextTool =
        requested ??
        (restore && restore !== "satellite" && restore !== "globe" ? restore : "city_map");
      void applyRhizohWorldMapToolV0(nextTool, {
        leafletOnly: true,
        source: String(ev?.detail?.source || "SPIRAL_MMO_EXIT")
      });
      preSpiralMapToolRef.current = null;
    };
    const onKeyDown = (ev) => {
      if (ev.key === "Escape") {
        window.dispatchEvent(new CustomEvent(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0));
      }
    };
    window.addEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, enterImmersion);
    window.addEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, exitImmersion);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, enterImmersion);
      window.removeEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, exitImmersion);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const onModalEscapeV0 = (ev) => {
      if (ev.key !== "Escape") return;
      if (v11ChessArena) {
        clearMapTransitionBusyV0("modal_escape");
        setV11ChessArena(null);
        ev.preventDefault();
        return;
      }
      if (v11Library) {
        clearMapTransitionBusyV0("modal_escape");
        setV11Library(null);
        ev.preventDefault();
        return;
      }
      if (v11Workspace) {
        clearMapTransitionBusyV0("modal_escape");
        setV11Workspace(null);
        ev.preventDefault();
        return;
      }
      if (v11MediaTube) {
        setV11MediaTube(null);
        ev.preventDefault();
        return;
      }
      if (v11TowerPortal) {
        clearMapTransitionBusyV0("modal_escape");
        setV11TowerPortal(null);
        ev.preventDefault();
        return;
      }
      if (v11LivingMemory) {
        setV11LivingMemory(false);
        ev.preventDefault();
      }
    };
    window.addEventListener("keydown", onModalEscapeV0, true);
    return () => window.removeEventListener("keydown", onModalEscapeV0, true);
  }, [
    v11ChessArena,
    v11Library,
    v11Workspace,
    v11MediaTube,
    v11TowerPortal,
    v11LivingMemory
  ]);

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
    const onGeo = async () => {
      setGeoPrompt("granted");
      setGeoError("");
      try {
        if (typeof window !== "undefined" && window.__rhizoh?.epochMergeAndAssimilate) {
          await window.__rhizoh.epochMergeAndAssimilate();
        }
        publishWorldMapObservationOriginV0();
      } catch {
        /* noop */
      }
    };
    window.addEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);
    return () => {
      cancelled = true;
      window.removeEventListener(WORLD_MAP_GEO_REQUEST_EVENT_V0, onGeo);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const stopEpochDefer = runAfterV11LeafletReadyV0(() => {
      void (async () => {
        try {
          if (typeof window === "undefined" || !window.__rhizoh?.epochMergeAndAssimilate) return;
          await window.__rhizoh.epochMergeAndAssimilate();
          if (!cancelled) publishWorldMapObservationOriginV0();
        } catch {
          /* noop */
        }
      })();
    });
    return () => {
      cancelled = true;
      stopEpochDefer?.();
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

  const showGeoChip = false;
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
    const tool = normalizeRhizohWorldSpaceLeafletToolV0(mapTool);
    if (spiralImmersionActive) {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, {
          detail: Object.freeze({ requestedMapTool: tool, source })
        })
      );
      return;
    }
    void applyRhizohWorldMapToolV0(tool, {
      leafletOnly: true,
      source
    });
  }, [spiralImmersionActive]);

  const appRootRef = useRef(null);

  const onProductShellSelect = useCallback(
    (id) => {
      const surface = String(id || "world");
      if (surface === "world") {
        handleProductShellSelectV0("world", { pathname: "/world/space", worldPath: "/world/space" });
        applyDrawerDomainTagsV0(
          appRootRef.current,
          resolveDrawerDomainTagsV0(null, { pathname: "/world/space", surfaceId: "world" })
        );
        return;
      }
      const transition = handleProductShellSelectV0(surface, {
        pathname: "/world/space",
        inPlace: true
      });
      applyDrawerDomainTagsV0(
        appRootRef.current,
        resolveDrawerDomainTagsV0(transition.nextOpenDrawerId, {
          pathname: "/world/space",
          surfaceId: surface,
          overlayNode: transition.nextOpenDrawerId ? surface : null
        })
      );
      if (transition.action === DRAWER_SHELL_ACTION_V0.NAVIGATE) {
        navigateRhizohProductSurfaceV0(surface, navigate, "/world/space");
      }
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

  const uiLayoutV0 = useMemo(
    () =>
      resolveRhizohUiLayoutV0({
        surface: RHIZOH_UI_SURFACE_V0.WORLD_SPACE,
        drawerOpen: Boolean(openSurfaceDrawerIdV0),
        publish: true
      }),
    [openSurfaceDrawerIdV0]
  );
  const mapStripBottomCssV0 = uiLayoutV0.bottomCss.mapStrip;
  const bootstrapPlaceLabelV0 = resolveWorldMapBootstrapGeoV0().label;

  return (
    <div
      ref={appRootRef}
      className="fixed inset-0 overflow-hidden bg-[#010103] text-white pointer-events-none"
      data-rhizoh-world-space-app="1"
      data-rhizoh-spiral-immersion={spiralImmersionActive ? "1" : "0"}
      data-cesium-active={cesiumLayerActiveV0 ? "1" : "0"}
      data-world-layer-enabled={worldLayerEnabledV0 ? "1" : "0"}
      data-world-domain-calm={isWorldDomainCalmModeV0() ? "1" : "0"}
      data-spatial-render-mode={spatialBootGateV0.renderMode}
      data-spatial-boot-reason={spatialBootGateV0.reason}
      data-map-tool={worldMapToolV0}
    >
      <style>{`
        [data-rhizoh-spiral-immersion="1"] [data-rhizoh-world-domain-shell],
        [data-rhizoh-spiral-immersion="1"] [data-rhizoh-world-space-voice-dock],
        [data-rhizoh-spiral-immersion="1"] nav[aria-label*="Rhizoh"],
        [data-rhizoh-spiral-immersion="1"] [data-rhizoh-product-drawer],
        [data-rhizoh-spiral-immersion="1"] [data-rhizoh-v11-node-panel],
        [data-rhizoh-spiral-immersion="1"] [data-rhizoh-spiral-mmo-portal],
        [data-rhizoh-spiral-immersion="1"] .leaflet-control-zoom {
          display: none !important;
        }
        [data-rhizoh-spiral-immersion="1"] [data-rhizoh-world-space-map-host] {
          z-index: 30 !important;
        }
        [data-rhizoh-spiral-immersion="1"] [data-rhizoh-spiral-mmo-awakening-overlay] {
          z-index: 31 !important;
        }
        [data-rhizoh-world-space-map-host] {
          transition: opacity 0.85s ease-in-out, filter 0.85s ease-in-out;
        }
        [data-rhizoh-world-space-app] [data-rhizoh-v11-leaflet-host],
        [data-rhizoh-world-space-app] [data-rhizoh-world-space-chrome],
        [data-rhizoh-world-space-app] [data-rhizoh-world-domain-interactive],
        [data-rhizoh-world-space-app] [data-rhizoh-v11-surface-modal],
        [data-rhizoh-world-space-app] [data-rhizoh-product-drawer],
        [data-rhizoh-world-space-app] [data-rhizoh-world-layer-quick-chip],
        [data-rhizoh-world-space-app] nav[aria-label*="Rhizoh"],
        [data-rhizoh-world-space-app] [data-rhizoh-conversation-dock-shell] > div {
          pointer-events: auto;
          touch-action: manipulation;
        }
        [data-rhizoh-v11-leaflet-host] .leaflet-control-zoom {
          display: none !important;
        }
        .rhizoh-map-camera-pulse-v0 {
          animation: rhizoh-map-camera-pulse-keyframes 0.52s ease-out;
        }
        @keyframes rhizoh-map-camera-pulse-keyframes {
          0% { box-shadow: inset 0 0 0 0 rgba(34, 211, 238, 0); filter: brightness(1); }
          35% { box-shadow: inset 0 0 0 3px rgba(34, 211, 238, 0.55); filter: brightness(1.08); }
          100% { box-shadow: inset 0 0 0 0 rgba(34, 211, 238, 0); filter: brightness(1); }
        }
        @keyframes rhizoh-shadow-pulse {
          0%, 100% { filter: brightness(1); transform: scale(1); }
          50% { filter: brightness(1.35); transform: scale(1.06); }
        }
        [data-rhizoh-spiral-immersion="1"] [data-rhizoh-world-space-map-host] {
          opacity: 1;
          filter: none;
        }
      `}</style>
      <RhizohAtmospherePresenceBridge />
      <RhizohWorldSpaceMapHostV0
        active={cesiumLayerActiveV0}
        renderMode={spatialBootGateV0.renderMode}
        activeMapTool={worldMapToolV0}
        remoteCastles={remoteCastles}
        remoteCastlesVisible={remoteCastlesVisibleV0}
        uiLocale={uiLocale}
      />

      {shadowReactionToast ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-[420] max-w-sm -translate-x-1/2 rounded-xl border border-sky-400/45 bg-sky-950/90 px-4 py-2.5 text-center font-mono text-[11px] font-semibold text-sky-100 shadow-lg backdrop-blur-md">
          {shadowReactionToast.message}
        </div>
      ) : null}

      {spiralImmersionActive ? (
        <button
          type="button"
          className="pointer-events-auto fixed left-4 top-[4.75rem] z-[400] rounded-lg border border-cyan-400/40 bg-black/85 px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-cyan-100 shadow-lg touch-manipulation backdrop-blur-sm sm:top-20"
          data-rhizoh-spiral-immersion-exit="1"
          onClick={() => {
            window.dispatchEvent(new CustomEvent(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0));
          }}
        >
          {uiLocale === "tr" ? "← V11 Harita" : "← V11 Map"}
        </button>
      ) : null}

      <RhizohWorldDomainShellV0
        domain={worldDrawerDomainV0}
        layerMode={layerModeV0}
        uiLocale={uiLocale}
        activeMapTool={worldMapToolV0}
        onSelectMapTool={(toolId) => onApplyWorldMapToolV0(toolId, "WORLD_DOMAIN_MAP_STRIP")}
        spatialEngineActive
        mapToolCesiumReady={isRhizohWorldSpaceCesiumEnvEnabledV0()}
        mapStripBottomCss={mapStripBottomCssV0}
        onOpenGreenroom={() => navigate("/greenroom/main")}
        onOpenBroadcast={() => navigate("/broadcast/main")}
        onShareInvite={() => {}}
        onModeSelect={() => navigate("/world/modes")}
        onCapNodeIntent={handleWorldSpaceCapWheelNodeV0}
        onSeedIntent={onLibrarySeedIntentV0}
        onFocusLayer={onSpiralMapLayerFocusV0}
        onRequestGeo={onRequestGeoV0}
      />

      <RhizohConversationDockShellV0
        surface={RHIZOH_UI_SURFACE_V0.WORLD_SPACE}
        drawerOpen={Boolean(openSurfaceDrawerIdV0)}
        publish
      >
        <RhizohWorldSpaceVoiceDockV0
          firebaseUser={castleAuth?.user}
          uiLocale={uiLocale}
          activeMapTool={worldMapToolV0}
          onRequestGeo={onRequestGeoV0}
          onSelectMapTool={(toolId) => onApplyWorldMapToolV0(toolId, "WORLD_VOICE_DOCK")}
        />
      </RhizohConversationDockShellV0>

      <UnifiedProductShellBar
        active={openSurfaceDrawerIdV0 || "world"}
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
          gatewayPhase={gateway.phase}
          runtimeHealth={gateway}
          uiLocale={uiLocale}
          experienceSessionId={experienceSessionCtxV0?.experienceSessionId || null}
          productSessionId={productSessionV0?.sessionId || null}
        />
      ) : null}

      {castleAuth.needsAuthGate || castleAuth.needsOnboarding ? (
        <CastleAuthOverlay auth={castleAuth} />
      ) : null}

      {!spiralImmersionActive ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[27] flex flex-col items-center gap-2 px-4">
          <RhizohCityMapLegalCountdownStripV0 uiLocale={uiLocale} />
          <RhizohMapTransitionApproachStripV0 uiLocale={uiLocale} />
        </div>
      ) : null}

      {showGeoChip && !spiralImmersionActive ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[25] flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-md flex-col items-center gap-1 rounded-xl border border-cyan-500/35 bg-black/80 px-3 py-2 text-center backdrop-blur-md" data-rhizoh-world-space-chrome="1">
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

      {!castleAuth.needsAuthGate && !spiralImmersionActive && !v11MediaTube ? (
        <>
          <RhizohCastleShadowInboxV0 uiLocale={uiLocale} compact anchor="bottom-right" panelPlacement="portal" />
          <div
            className="pointer-events-none fixed left-4 z-[30] max-w-[15rem]"
            data-rhizoh-world-space-chrome="1"
            style={{ bottom: "calc(10.5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="pointer-events-auto rounded-xl border border-white/15 bg-black/88 p-3 shadow-lg backdrop-blur-md">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
                {uiLocale === "tr" ? "Peer kaleler" : "Peer castles"}
              </p>
              <p className="mt-1 text-[10px] normal-case leading-snug text-white/70">
                {remoteCastles.length
                  ? uiLocale === "tr"
                    ? `${remoteCastles.length} çevrimiçi — gri pin`
                    : `${remoteCastles.length} online — grey pin`
                  : uiLocale === "tr"
                    ? "0 çevrimiçi — sim hedefi"
                    : "0 online — sim target"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
              {remoteCastles.length ? (
                <button
                  type="button"
                  onClick={() => writeRemoteCastlesVisibleV0(!remoteCastlesVisibleV0)}
                  className={`min-h-[2rem] touch-manipulation rounded-lg border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${
                    remoteCastlesVisibleV0
                      ? "border-gray-400/50 bg-gray-500/20 text-gray-100"
                      : "border-white/15 bg-black/60 text-white/60 hover:text-white"
                  }`}
                >
                  {uiLocale === "tr"
                    ? remoteCastlesVisibleV0
                      ? "Pinleri gizle"
                      : "Pinleri göster"
                    : remoteCastlesVisibleV0
                      ? "Hide pins"
                      : "Show pins"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => flyToShadowPeerCastleV0(13)}
                    className="min-h-[2rem] touch-manipulation rounded-lg border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-sky-100 hover:bg-sky-500/25"
                  >
                    {uiLocale === "tr" ? "Sim pin" : "Sim pin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      bindShadowCastleSimPeerV0();
                      flyToShadowPeerCastleV0(13);
                    }}
                    className="min-h-[2rem] touch-manipulation rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-100 hover:bg-emerald-500/20"
                  >
                    {uiLocale === "tr" ? "Sim bağla" : "Bind sim"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        </>
      ) : null}

      {c2cPeer && !v11MediaTube ? (
        <RhizohWorldSpaceC2cPanelV0
          peer={c2cPeer}
          userId={castleAuth?.user?.uid || ""}
          uiLocale={uiLocale}
          recordBridgePeer={recordBridgePeer}
          onClose={() => {
            setC2cPeer(null);
            clearShadowCastleReactionPeerV0();
          }}
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
          onClose={() => {
            clearMapTransitionBusyV0("workspace_close");
            setV11Workspace(null);
          }}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11Library && !v11MediaTube ? (
        <RhizohCastleLibraryPanelV0
          open
          node={v11Library.node}
          onClose={() => {
            clearMapTransitionBusyV0("library_close");
            setV11Library(null);
          }}
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
          initialMode={v11ChessArena.initialMode || null}
          autoPlay={Boolean(v11ChessArena.autoPlay)}
          onClose={() => {
            clearMapTransitionBusyV0("chess_arena_close");
            setV11ChessArena(null);
          }}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11TowerPortal && !v11MediaTube && !v11ChessArena ? (
        <RhizohTowerPortalDiscoveryV0
          open
          node={v11TowerPortal.node}
          userId={castleAuth?.user?.uid || ""}
          onClose={() => {
            clearMapTransitionBusyV0("tower_portal_close");
            setV11TowerPortal(null);
          }}
          uiLocale={uiLocale}
        />
      ) : null}

      {v11NodePanel && !v11Workspace && !v11MediaTube && !v11Library && !v11ChessArena && !v11TowerPortal ? (
        <div
          className="pointer-events-none fixed z-[27]"
          style={
            v11NodePanel.screenAnchor
              ? {
                  left: v11NodePanel.screenAnchor.left,
                  top: v11NodePanel.screenAnchor.top,
                  transform: "translate(-50%, calc(-100% - 3.5rem))"
                }
              : { insetInline: 0, top: "7rem", display: "flex", justifyContent: "center", paddingInline: "1rem" }
          }
        >
          {v11NodePanel.nodeView?.type === "spiralmmo" ? (
            <RhizohSpiralMMOPortalWorkspaceV0
              uiLocale={uiLocale}
              node={v11NodePanel.nodeView}
              onClose={() => setV11NodePanel(null)}
            />
          ) : (
            <div
              className={`pointer-events-auto w-full max-w-xs p-3 ${RHIZOH_MAP_OVERLAY_PANEL_CLASS_V0}`}
              style={{ borderColor: `${v11NodePanel.nodeView.color}66` }}
              data-rhizoh-v11-node-panel="1"
              onMouseLeave={() => setV11NodePanel(null)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
                    {uiLocale === "tr" ? "V11 düğüm" : "V11 node"}
                  </p>
                  <h2 className="mt-1 text-sm font-black" style={{ color: v11NodePanel.nodeView.color }}>
                    {v11NodePanel.nodeView.label}
                  </h2>
                  <p className="mt-1 text-[10px] text-white/75">
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
              <p className="mt-3 text-[10px] leading-relaxed text-white/82">
                {uiLocale === "tr"
                  ? "Harita niyeti üretildi; yürütme kararı orkestratörde kalır."
                  : "Map intent emitted; execution remains with the orchestrator."}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {!cesiumLayerActiveV0 && worldMapToolV0 === "globe" && !spiralImmersionActive ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-[25] flex justify-center px-4"
          style={{ bottom: `calc(${mapStripBottomCssV0} + 5rem)` }}
        >
          <p className="rounded-xl border border-amber-400/30 bg-black/75 px-3 py-2 text-[10px] text-amber-100/90 normal-case">
            {uiLocale === "tr"
              ? "3D küre yükleniyor… Cesium hazır değilse birkaç saniye bekleyin."
              : "Loading 3D globe… wait a few seconds if Cesium is still starting."}
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
