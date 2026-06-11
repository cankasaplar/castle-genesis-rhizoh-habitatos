import React, { memo, useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { ISTANBUL_GEO, ISTANBUL_POI } from "./geo.js";
import { getCastleFlightConfig } from "./castleFlightConfig.js";
import { isCesiumIonTokenUsableV0 } from "./cesiumIonGateV0.js";
import {
  capRowsForCesiumRenderV0,
  cesiumSceneOverBudget,
  CESIUM_SCENE_BUDGET,
  filterCesiumGeoRowsV0,
  logCesiumFootprintRenderCapV0,
  logCesiumPoiUxCapV0
} from "./cesiumSceneBudget.js";
import {
  activateCesiumViewerRenderV0,
  enableCesiumFreeCameraControlsV0,
  cancelCesiumCameraFlightV0,
  cesiumSafeFromDegreesV0,
  clearCesiumViewerSceneOverlaysV0,
  configureOsmBuildingsTilesetV0,
  installCesiumCameraPreRenderGuardV0,
  isCesiumCanvasRenderableV0,
  isCesiumSafeModeRenderErrorV0,
  removeOsmBuildingsTilesetV0,
  sanitizeCesiumCameraV0,
  startCesiumDefaultRenderLoopV0,
  stopCesiumDefaultRenderLoopV0,
  waitForCesiumRenderStableFramesV0
} from "./cesiumRenderGuardV0.js";
import { isWorldLayerEnabled } from "../rhizoh/runtime/castleWorldLayerGateV0.js";
import {
  emitRhizohDegradeMomentV1,
  RHIZOH_DEGRADE_KIND_V1
} from "../rhizoh/experience/rhizohExperienceDegradeCopyV1.js";
import { subscribeCastleDroneTelemetry } from "./telemetryHub.js";
import { installCesiumWorldProjectionBind } from "./cesiumWorldProjectionBind.js";
import { installWebglContextLostReporter, reportCastleFatal } from "../boot/castleCrashTelemetry.js";
import {
  notifyCesiumFlightStart,
  notifyCesiumFlightEnd,
  resetCesiumApexCameraCoordinator
} from "../reality/realityDirector.js";
import {
  installRhizohEpistemicCesiumBootstrapV0,
  buildRhizohEpistemicWorldPresenceForBootstrapV0
} from "../rhizoh/spatial/cesiumEpistemicBootstrapV0.js";
import { resyncCesiumEpistemicRuntimeWindowMirrorV0 } from "../rhizoh/spatial/cesiumEpistemicRuntimeStoreV0.js";
import { applyCesiumBasemapImageryV0 } from "./cesiumBasemapImageryV0.js";
import {
  applyCesiumImageryForMapToolV0,
  resolveCesiumImageryProfileForMapToolV0,
  resolveCesiumMapCameraAnchorV0,
  resolveCesiumMapZoomMaxHeightV0
} from "../rhizoh/runtime/rhizohCesiumImageryProfileV0.js";
import {
  readRhizohWorldMapToolV0,
  RHIZOH_WORLD_MAP_TOOL_CHANGE_EVENT_V0
} from "../rhizoh/runtime/rhizohWorldMapToolV0.js";
import { resolveCesiumLayerMatrixV0 } from "./cesiumLayerMatrixV0.js";
import { applyOsmBuildingsVisualStyleV0 } from "./cesiumOsmBuildingsStyleV0.js";
import { maybeInstallPerceptionDebugObserverV0 } from "../rhizoh/spatial/perceptionDebugRuntimeV0.js";
import {
  isEpistemicSimResearchEnabledV0,
  maybeInstallEpistemicSimResearchOnCesiumV0
} from "../rhizoh/runtime/epistemicSimResearchWireV0.js";
import { maybeInstallRhizohPetCesiumSpatialBindingV0 } from "../rhizoh/spatial/rhizohPetCesiumSpatialBindingV0.js";
import { recordCameraKeyObserverTelemetryV0, recordPoiSelectObserverTelemetryV0 } from "../rhizoh/runtime/epistemicObserverTelemetryV0.js";
import { maybeInstallEpistemicGraphVisualizationOnCesiumV0 } from "../rhizoh/runtime/sovereign/epistemicGraphCesiumV0.js";
import { installCesiumSovereignGeographicPickV0 } from "../rhizoh/runtime/sovereign/cesiumSovereignGeographicPickV0.js";
import { isSovereignNodeOnboardingEnabledV0 } from "../rhizoh/runtime/sovereign/sovereignNodeOnboardingWizardV0.js";
import { getEpistemicNavigationMoveScaleV0 } from "../rhizoh/runtime/epistemicPerceptionMirrorV0.js";
import { getRhizohCalibrationRootAnchorV0 } from "../rhizoh/spatial/geographicAnchorsV0.js";
import { deriveAnchorAtmosphereProjectionV0 } from "../rhizoh/spatial/deriveAnchorAtmosphereProjectionV0.js";
import {
  unregisterLiveRuntimeCesiumRenderSinkV0,
  registerLiveRuntimeProjectionConsumerV0,
  unregisterLiveRuntimeProjectionConsumerV0
} from "../rhizoh/runtime/liveRuntimeOrchestratorV0.js";
import { applyLiveRuntimeProjectionHintsToCesiumSceneV0 } from "./liveRuntimeCesiumAtmosphereBridgeV0.js";
import {
  getCastleWorldDataStateV2,
  loadCastleWorldBuildingFootprintsV2,
  loadCastleWorldImportantPlacesV2
} from "./castleWorldDataProviderV2.js";
import { installCastleStudioMapBridgeV0 } from "./castleStudioMapBridgeV0.js";
import { isCastleLightRuntimeV0 } from "./castleInitiationProtocolV0.js";
import {
  registerCesiumExecutorApiV0,
  clearCesiumExecutorApiV0,
  drainCesiumExecutorPendingV0,
  ensureCastleCesiumApiV0,
  CESIUM_ZOOM_MIN_HEIGHT_V0,
  CESIUM_ZOOM_MAX_HEIGHT_V0
} from "./cesiumCommandExecutorV0.js";
import { installCesiumCommandBridgeV0 } from "./cesiumCommandRouterV0.js";
import { installRhizohMapDiagnosticsV0 } from "./cesiumMapDiagnosticsV0.js";
import { resolveWorldMapBootstrapGeoV0 } from "../rhizoh/runtime/worldMapBootstrapGeoV0.js";
import { resolveWorldMapInitialCameraV0 } from "../rhizoh/runtime/worldMapViewBootstrapV0.js";
import {
  readWorldMapClaimModeV0,
  writeWorldMapClaimModeV0
} from "../rhizoh/runtime/worldMapClaimModeV0.js";
import { createLocalGhostCastleAnchorV0 } from "../rhizoh/runtime/localGhostCastleAnchorV0.js";
import { readWorldMapMarkerLayerStateV0 } from "../rhizoh/runtime/worldMapMarkerLayerStateV0.js";
import { resolveEpistemicPoiVisibilityV0 } from "../rhizoh/runtime/worldMapPoiProximityV0.js";
import { applyCesiumHardwareProfileV0 } from "./cesiumMapHardwareProfileV0.js";
import { installWorldMapAnchorMarkersV0 } from "./cesiumMapAnchorMarkersV0.js";
import {
  CESIUM_HOST_MIN_SIZE_V0,
  isCesiumHostLayoutReadyV0,
  measureCesiumHostLayoutV0,
  observeCesiumHostLayoutV0,
  resizeCesiumViewerToHostV0,
  waitForCesiumHostLayoutV0
} from "./cesiumHostLayoutV0.js";

const IMPORTANT_OVERPASS_TAGS = [
  ["tourism", "museum"],
  ["tourism", "attraction"],
  ["amenity", "library"],
  ["amenity", "university"],
  ["amenity", "school"],
  ["amenity", "hospital"],
  ["amenity", "arts_centre"],
  ["amenity", "theatre"],
  ["amenity", "cinema"],
  ["leisure", "sports_centre"],
  ["leisure", "stadium"],
  ["leisure", "fitness_centre"],
  ["shop", "mall"]
];

const CATEGORY_LABELS = {
  culture: "Muze/Kultur",
  library: "Kutuphane",
  sports: "Spor",
  education: "Egitim",
  health: "Saglik",
  shopping: "AVM/Ticaret",
  landmark: "Landmark",
  other: "Diger"
};

const CATEGORY_COLORS = {
  culture: "#facc15",
  library: "#84cc16",
  sports: "#22d3ee",
  education: "#a78bfa",
  health: "#fb7185",
  shopping: "#fb923c",
  landmark: "#38bdf8",
  other: "#e5e7eb"
};

function classifyCategory(tags = {}) {
  if (tags.tourism === "museum" || tags.amenity === "arts_centre" || tags.amenity === "theatre" || tags.amenity === "cinema") return "culture";
  if (tags.amenity === "library") return "library";
  if (tags.leisure === "sports_centre" || tags.leisure === "fitness_centre" || tags.leisure === "stadium") return "sports";
  if (tags.amenity === "school" || tags.amenity === "university") return "education";
  if (tags.amenity === "hospital") return "health";
  if (tags.shop === "mall") return "shopping";
  if (tags.tourism === "attraction") return "landmark";
  return "other";
}

function poiColorFor(tags, CesiumRef) {
  if (tags?.tourism === "museum") return CesiumRef.Color.GOLD;
  if (tags?.amenity === "library") return CesiumRef.Color.LIME;
  if (tags?.amenity === "hospital") return CesiumRef.Color.SALMON;
  if (tags?.leisure === "sports_centre" || tags?.leisure === "fitness_centre" || tags?.leisure === "stadium") return CesiumRef.Color.CYAN;
  if (tags?.shop === "mall") return CesiumRef.Color.ORANGE;
  return CesiumRef.Color.WHITE;
}

function haversineMeters(aLat, aLon, bLat, bLon) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const sa = Math.sin(dLat / 2);
  const sb = Math.sin(dLon / 2);
  const x = sa * sa + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * sb * sb;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Cesium destroy sonrası host'u boşalt — React unmount removeChild NotFoundError önler. */
function detachCesiumHostDomV0(host) {
  if (!host) return;
  try {
    host.replaceChildren();
    return;
  } catch {
    /* fall through */
  }
  try {
    while (host.firstChild) host.removeChild(host.firstChild);
  } catch {
    /* noop */
  }
}

function destroyCesiumViewerSafeV0(viewer, host) {
  if (!viewer) return;
  try {
    if (!viewer.isDestroyed()) viewer.destroy();
  } catch {
    /* noop */
  }
  detachCesiumHostDomV0(host);
}

/** @deprecated use waitForCesiumHostLayoutV0 */
async function waitForHostLayout(el, { minSize = CESIUM_HOST_MIN_SIZE_V0, timeoutMs = 12000 } = {}) {
  return waitForCesiumHostLayoutV0(el, { minSize, timeoutMs });
}

function setCesiumActivity(viewer, on, cameraAnchor) {
  if (!viewer || viewer.isDestroyed?.()) return;
  try {
    if (on) {
      if (cameraAnchor) {
        activateCesiumViewerRenderV0(viewer, Cesium, cameraAnchor);
      } else {
        startCesiumDefaultRenderLoopV0(viewer);
      }
      enableCesiumFreeCameraControlsV0(viewer);
    } else {
      stopCesiumDefaultRenderLoopV0(viewer);
    }
    viewer.clock.shouldAnimate = !!on;
    viewer.scene.requestRenderMode = !on;
    viewer.scene.screenSpaceCameraController.enableInputs = !!on;
    if (on && isCesiumCanvasRenderableV0(viewer)) {
      viewer.scene.requestRender();
      window.setTimeout(() => {
        try {
          if (!viewer.isDestroyed?.()) viewer.scene.requestRender();
        } catch {
          /* noop */
        }
      }, 120);
    }
  } catch {
    /* noop */
  }
}

const CesiumRealMapLayerImpl = memo(({ active }) => {
  const [light2dActive, setLight2dActive] = useState(false);
  const hostRef = useRef(null);
  const viewerRef = useRef(null);
  const droneEntitiesRef = useRef(new Map());
  const importantEntitiesRef = useRef([]);
  const importantRowsRef = useRef([]);
  const fallbackBuildingEntitiesRef = useRef([]);
  const activeRef = useRef(active);
  const bootedRef = useRef(false);
  const bootingRef = useRef(false);
  const bootAttemptRef = useRef(null);
  const layoutObserverCleanupRef = useRef(null);
  const attemptBootRef = useRef(null);
  const publishExecutorRef = useRef(null);
  const extrasCleanupRef = useRef(null);
  const navStateRef = useRef({
    enabled: false,
    keys: {
      forward: false,
      back: false,
      left: false,
      right: false,
      up: false,
      down: false,
      boost: false
    }
  });
  const categoryStateRef = useRef({
    culture: true,
    library: true,
    sports: true,
    education: true,
    health: true,
    shopping: true,
    landmark: true,
    other: true
  });

  activeRef.current = active;

  useEffect(() => {
    return () => {
      extrasCleanupRef.current?.();
      extrasCleanupRef.current = null;
      const v = viewerRef.current;
      const host = hostRef.current;
      viewerRef.current = null;
      bootedRef.current = false;
      bootingRef.current = false;
      destroyCesiumViewerSafeV0(v, host);
      droneEntitiesRef.current.clear();
      importantEntitiesRef.current = [];
      fallbackBuildingEntitiesRef.current = [];
      resetCesiumApexCameraCoordinator();
      if (window.__CASTLE_CESIUM__) delete window.__CASTLE_CESIUM__;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let dead = false;
    let uninstallWorldProjection = () => {};
    let removeRenderErrorListener = () => {};
      const cfg = getCastleFlightConfig();
      const vanilla = !!cfg.cesiumVanillaRealMap || isCastleLightRuntimeV0();
    let worldProjectionBindEnabled = cfg.cesiumWorldProjectionBind;
    let cesiumFatalTelemetryOnce = false;

    const boot = async () => {
      if (!hostRef.current || viewerRef.current || dead || cancelled) return;
      const layoutReady = await waitForCesiumHostLayoutV0(hostRef.current, {
        timeoutMs: 12_000
      });
      if (!layoutReady || !hostRef.current) {
        console.warn("[castle:cesium] boot waiting — host layout not measurable yet", {
          ...measureCesiumHostLayoutV0(hostRef.current)
        });
        return;
      }
      if (viewerRef.current || dead || cancelled) return;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!hostRef.current || viewerRef.current || dead || cancelled) return;

      const ionUsable = isCesiumIonTokenUsableV0(cfg.cesiumIonToken);
      if (ionUsable) Cesium.Ion.defaultAccessToken = cfg.cesiumIonToken;
      const bootOsm = new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/"
      });
      const viewer = new Cesium.Viewer(hostRef.current, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayerPicker: false,
        baseLayer: false,
        imageryProvider: bootOsm,
        shouldAnimate: true,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity
      });
      viewerRef.current = viewer;
      resizeCesiumViewerToHostV0(viewer, hostRef.current);
      if (cancelled || dead) {
        destroyCesiumViewerSafeV0(viewer, hostRef.current);
        viewerRef.current = null;
        return;
      }
      viewer.scene.globe.depthTestAgainstTerrain = true;
      const hwProfile = applyCesiumHardwareProfileV0(viewer, Cesium);
      if (hwProfile.lowHardware) setLight2dActive(true);
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 12;
      viewer.scene.screenSpaceCameraController.enableTilt = true;
      viewer.scene.screenSpaceCameraController.enableLook = true;
      viewer.scene.screenSpaceCameraController.inertiaSpin = 0.82;
      viewer.scene.screenSpaceCameraController.inertiaTranslate = 0.82;
      viewer.scene.screenSpaceCameraController.inertiaZoom = 0.75;
      if (vanilla) {
        viewer.scene.screenSpaceCameraController.enableInputs = false;
      }
      viewer.scene.rethrowRenderErrors = false;
      try {
        viewer.scene.logarithmicDepthBuffer = false;
      } catch {
        /* noop */
      }

      let osmBuildingsPrimitive = null;
      let renderErrorCount = 0;
      let renderRecoveryGen = 0;
      let renderOkFrames = 0;
      let renderDegraded = false;
      let pvsSafeModeLock = false;
      let removePostRenderOk = () => {};
      let sceneBudgetDowngraded = false;
      let teardownRhizohEpistemicBootstrap = () => {};
      let teardownPerceptionDebug = () => {};
      let teardownEpistemicSimResearch = () => {};
      let teardownPetSpatialBinding = () => {};
      let teardownEpistemicGraphViz = () => {};
      let teardownSovereignGeographicPick = () => {};
      let teardownAnchorMarkers = () => {};
      let uninstallCesiumCommandBridge = () => {};
      let removeCameraPreRenderGuard = () => {};

      const trackedCameraFlyTo = (flyOpts) => {
        if (!flyOpts || typeof flyOpts !== "object") return;
        const userComplete = flyOpts.complete;
        notifyCesiumFlightStart();
        viewer.camera.flyTo({
          ...flyOpts,
          complete: function () {
            notifyCesiumFlightEnd();
            if (typeof userComplete === "function") userComplete.apply(this, arguments);
          }
        });
      };

      const cameraSafeAnchor = () => resolveWorldMapInitialCameraV0(readRhizohWorldMapToolV0());

      removeCameraPreRenderGuard = installCesiumCameraPreRenderGuardV0(viewer, Cesium, cameraSafeAnchor);

      let worldMapLayersApplied = false;
      /** @type {import("cesium").PointPrimitiveCollection | null} */
      let poiPointCollection = null;
      /** @type {import("cesium").PointPrimitiveCollection | null} */
      let buildingPointCollection = null;
      let renderRecoveryUntilMs = 0;

      const clearPoiPointCollectionV0 = () => {
        try {
          if (poiPointCollection && viewer && !viewer.isDestroyed?.()) {
            viewer.scene.primitives.remove(poiPointCollection);
          }
        } catch {
          /* noop */
        }
        poiPointCollection = null;
        importantEntitiesRef.current = [];
      };

      const clearBuildingPointCollectionV0 = () => {
        try {
          if (buildingPointCollection && viewer && !viewer.isDestroyed?.()) {
            viewer.scene.primitives.remove(buildingPointCollection);
          }
        } catch {
          /* noop */
        }
        buildingPointCollection = null;
        fallbackBuildingEntitiesRef.current = [];
      };

      const applyCesiumSafeMode = () => {
        stopCesiumDefaultRenderLoopV0(viewer);
        try {
          viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        } catch {
          /* noop */
        }
        try {
          viewer.scene.globe.depthTestAgainstTerrain = false;
          viewer.scene.globe.maximumScreenSpaceError = 8;
        } catch {
          /* noop */
        }
        try {
          removeOsmBuildingsTilesetV0(viewer, osmBuildingsPrimitive);
          osmBuildingsPrimitive = null;
        } catch {
          /* noop */
        }
        try {
          teardownRhizohEpistemicBootstrap();
        } catch {
          /* noop */
        }
        teardownRhizohEpistemicBootstrap = () => {};
        try {
          teardownEpistemicGraphViz();
        } catch {
          /* noop */
        }
        teardownEpistemicGraphViz = () => {};
        try {
          teardownEpistemicSimResearch();
        } catch {
          /* noop */
        }
        teardownEpistemicSimResearch = () => {};
        try {
          teardownPetSpatialBinding();
        } catch {
          /* noop */
        }
        teardownPetSpatialBinding = () => {};
        try {
          teardownPerceptionDebug();
        } catch {
          /* noop */
        }
        teardownPerceptionDebug = () => {};
        try {
          teardownSovereignGeographicPick();
        } catch {
          /* noop */
        }
        teardownSovereignGeographicPick = () => {};
        try {
          uninstallWorldProjection();
          uninstallWorldProjection = () => {};
        } catch {
          /* noop */
        }
        try {
          clearPoiPointCollectionV0();
          clearBuildingPointCollectionV0();
        } catch {
          /* noop */
        }
        try {
          clearCesiumViewerSceneOverlaysV0(viewer);
        } catch {
          /* noop */
        }
        try {
          sanitizeCesiumCameraV0(viewer, Cesium, cameraSafeAnchor());
        } catch {
          /* noop */
        }
        sceneBudgetDowngraded = true;
        renderDegraded = true;
        worldMapLayersApplied = false;
        try {
          const api = ensureCastleCesiumApiV0();
          if (api) {
            api.renderDegraded = true;
            api.commandReady = true;
            registerCesiumExecutorApiV0(api);
          }
        } catch {
          /* noop */
        }
      };

      let cesiumDegradeNotifiedV1 = false;

      const publishCesiumRenderHealth = () => {
        if (!window.__CASTLE_CESIUM__) return;
        window.__CASTLE_CESIUM__.renderDegraded = renderDegraded;
        window.__CASTLE_CESIUM__.renderErrorCount = renderErrorCount;
        window.__CASTLE_CESIUM__.pvsSafeModeLock = pvsSafeModeLock;
        if (renderDegraded && renderErrorCount >= 2 && !cesiumDegradeNotifiedV1) {
          cesiumDegradeNotifiedV1 = true;
          try {
            const tr =
              typeof document !== "undefined" &&
              String(document.documentElement?.lang || "").toLowerCase().startsWith("tr");
            emitRhizohDegradeMomentV1(RHIZOH_DEGRADE_KIND_V1.MAP_FAILED, { tr });
          } catch {
            /* noop */
          }
        }
      };

      const scheduleRenderRecovery = () => {
        const gen = ++renderRecoveryGen;
        renderRecoveryUntilMs = Date.now() + 1_500;
        stopCesiumDefaultRenderLoopV0(viewer);
        window.setTimeout(async () => {
          if (dead || cancelled || viewerRef.current !== viewer || gen !== renderRecoveryGen) return;
          if (!activeRef.current || !isCesiumCanvasRenderableV0(viewer)) return;
          try {
            cancelCesiumCameraFlightV0(viewer);
            sanitizeCesiumCameraV0(viewer, Cesium, cameraSafeAnchor());
            await waitForCesiumRenderStableFramesV0(viewer, 2, 5_000);
            if (dead || cancelled || viewerRef.current !== viewer || gen !== renderRecoveryGen) return;
            if (typeof viewer.render === "function") {
              try {
                viewer.render();
              } catch {
                /* noop */
              }
            }
            publishExecutorRef.current?.("pvs-recovery");
            renderRecoveryUntilMs = Date.now() + 900;
            if (!pvsSafeModeLock) {
              startCesiumDefaultRenderLoopV0(viewer);
            } else {
              try {
                viewer.scene.requestRenderMode = true;
                viewer.scene.requestRender();
              } catch {
                /* noop */
              }
            }
            await waitForCesiumRenderStableFramesV0(viewer, 2, 4_000);
            publishExecutorRef.current?.("pvs-recovery-stable");
            const api = ensureCastleCesiumApiV0();
            if (api) api.commandReady = true;
            registerCesiumExecutorApiV0(api);
            drainCesiumExecutorPendingV0();
            viewer.scene.requestRender();
          } catch {
            /* noop */
          } finally {
            renderRecoveryUntilMs = 0;
          }
        }, 400);
      };

      const onPostRenderOk = () => {
        if (!renderErrorCount && !renderDegraded) return;
        renderOkFrames += 1;
        if (renderOkFrames < 2) return;
        renderErrorCount = 0;
        renderOkFrames = 0;
        if (pvsSafeModeLock) {
          publishCesiumRenderHealth();
          try {
            viewer.scene.requestRender();
          } catch {
            /* noop */
          }
          return;
        }
        if (activeRef.current && isCesiumCanvasRenderableV0(viewer)) {
          renderDegraded = false;
          startCesiumDefaultRenderLoopV0(viewer);
        }
        publishCesiumRenderHealth();
      };

      const onRenderError = (_scene, error) => {
        const errMsg = String(error?.message || "").toLowerCase();
        if (Date.now() < renderRecoveryUntilMs && (errMsg.includes("destroyed") || errMsg.includes("nan component"))) {
          return;
        }
        renderOkFrames = 0;
        renderErrorCount += 1;
        if (isCesiumSafeModeRenderErrorV0(error)) {
          pvsSafeModeLock = true;
        }
        stopCesiumDefaultRenderLoopV0(viewer);
        console.error("[CASTLE_CESIUM] render_error", renderErrorCount, error);

        const safeModeRenderError = isCesiumSafeModeRenderErrorV0(error);
        if (!safeModeRenderError && !cesiumFatalTelemetryOnce) {
          cesiumFatalTelemetryOnce = true;
          try {
            reportCastleFatal(
              "cesium_render_error",
              error instanceof Error ? error : new Error(String(error)),
              { recovered: renderErrorCount <= 2, renderErrorCount, pvs: false }
            );
          } catch {
            /* noop */
          }
        }

        try {
          sanitizeCesiumCameraV0(viewer, Cesium, cameraSafeAnchor());
        } catch {
          /* noop */
        }
        applyCesiumSafeMode();
        publishCesiumRenderHealth();

        if (renderErrorCount <= 3) {
          scheduleRenderRecovery();
          return;
        }

        const finalMsg = String(error?.message || error || "");
        console.error("[CASTLE_CESIUM] render loop stopped after repeated errors:", finalMsg.slice(0, 200));
      };

      removeRenderErrorListener = viewer.scene.renderError.addEventListener(onRenderError);
      try {
        viewer.scene.postRender.addEventListener(onPostRenderOk);
        removePostRenderOk = () => {
          try {
            viewer.scene.postRender.removeEventListener(onPostRenderOk);
          } catch {
            /* noop */
          }
        };
      } catch {
        removePostRenderOk = () => {};
      }
      installWebglContextLostReporter(viewer.canvas, "cesium");
      viewer.scene.requestRender();

      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const staged = !!cfg.cesiumStagedBoot && !vanilla;
      const logStages = !!(cfg.cesiumBootDiag || cfg.cesiumBootWatchdog);

      const bootSnapshot = () => {
        let primitives = -1;
        let entities = -1;
        try {
          primitives = viewer.scene?.primitives?.length ?? -1;
        } catch {
          primitives = -1;
        }
        try {
          entities = viewer.entities?.values?.length ?? -1;
        } catch {
          entities = -1;
        }
        return { primitiveCount: primitives, entityCount: entities };
      };

      /**
       * @param {string} stage
       * @param {() => Promise<void>} fn
       * @param {(() => void) | null} [rollback]
       */
      const runBootStage = async (stage, fn, rollback = null) => {
        const t0 = performance.now();
        const snap0 = bootSnapshot();
        if (logStages) {
          console.info(
            "[CASTLE_CESIUM_BOOT_STAGE]",
            JSON.stringify({ event: "start", stage, ...snap0, ts: Math.round(t0) })
          );
        }
        try {
          await fn();
          if (dead || cancelled || viewerRef.current !== viewer) return false;
          const dt = Math.round(performance.now() - t0);
          const snap1 = bootSnapshot();
          if (logStages) {
            console.info(
              "[CASTLE_CESIUM_BOOT_STAGE]",
              JSON.stringify({ event: "end", stage, ok: true, durationMs: dt, ...snap1 })
            );
          }
          return true;
        } catch (err) {
          const dt = Math.round(performance.now() - t0);
          const snap1 = bootSnapshot();
          const msg = String(err?.message || err || "error");
          console.warn(
            "[CASTLE_CESIUM_BOOT_STAGE]",
            JSON.stringify({
              event: "end",
              stage,
              ok: false,
              stageFailed: true,
              durationMs: dt,
              error: msg.slice(0, 240),
              ...snap1
            })
          );
          if (typeof rollback === "function") {
            try {
              rollback();
            } catch (rbErr) {
              console.warn("[CASTLE_CESIUM_BOOT_STAGE]", JSON.stringify({ stage, rollbackError: String(rbErr?.message || rbErr).slice(0, 120) }));
            }
          }
          try {
            viewer.scene.requestRender();
          } catch {
            /* noop */
          }
          return false;
        }
      };

      const logCesiumBootDiag = (label, extra = {}) => {
        if (!cfg.cesiumBootDiag) return;
        try {
          const canvas = viewer.canvas;
          const prims = viewer.scene?.primitives?.length ?? -1;
          let entCount = -1;
          try {
            entCount = viewer.entities?.values?.length ?? -1;
          } catch {
            entCount = -1;
          }
          console.info("[CASTLE_CESIUM_BOOT]", label, {
            canvasW: canvas?.width,
            canvasH: canvas?.height,
            clientW: canvas?.clientWidth,
            clientH: canvas?.clientHeight,
            dpr: typeof window !== "undefined" ? window.devicePixelRatio : null,
            primitives: prims,
            entities: entCount,
            terrainIon: !!(viewer.terrainProvider && viewer.terrainProvider.constructor?.name !== "EllipsoidTerrainProvider"),
            ...extra
          });
        } catch {
          /* noop */
        }
      };

      await runBootStage("imagery", async () => {
        try {
          const bootProfile = resolveCesiumImageryProfileForMapToolV0(readRhizohWorldMapToolV0());
          await applyCesiumBasemapImageryV0(viewer, Cesium, bootProfile, {
            ionUsable,
            satelliteTileTemplate: cfg.satelliteTileTemplate
          });
        } catch {
          /* Imagery yoksa boot devam eder; harita boş kalabilir */
        }
      });

      try {
        viewer.resize();
        viewer.scene.requestRender();
      } catch {
        /* noop */
      }

      const mapBootstrapGeo = resolveWorldMapBootstrapGeoV0();
      await runBootStage("initial_setView", async () => {
        const anchor = resolveWorldMapInitialCameraV0(readRhizohWorldMapToolV0());
        const height = hwProfile.lowHardware ? Math.min(anchor.height, 3200) : anchor.height;
        const pitchDeg = anchor.pitchDeg ?? -40;
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(anchor.lon, anchor.lat, height),
          orientation: {
            heading: Cesium.Math.toRadians(anchor.headingDeg ?? 0),
            pitch: Cesium.Math.toRadians(pitchDeg),
            roll: 0
          }
        });
      });
      logCesiumBootDiag("after_initial_setView");

      await runBootStage(
        "anchor_markers",
        async () => {
          if (!vanilla && !dead && viewerRef.current === viewer) {
            teardownAnchorMarkers = installWorldMapAnchorMarkersV0(viewer, Cesium);
          }
        },
        () => {
          teardownAnchorMarkers();
          teardownAnchorMarkers = () => {};
        }
      );

      if (dead || cancelled || viewerRef.current !== viewer) return;

      const buildCesiumCameraCommandSurfaceV0 = () => ({
        flyToBootstrapViewport() {
          const anchor = resolveCesiumMapCameraAnchorV0(readRhizohWorldMapToolV0());
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.height),
            orientation: {
              heading: Cesium.Math.toRadians(anchor.headingDeg),
              pitch: Cesium.Math.toRadians(anchor.pitchDeg),
              roll: 0
            },
            duration: 1.2
          });
        },
        flyToIstanbul() {
          this.flyToBootstrapViewport();
        },
        flyToTopologyGlobe() {
          const orbit = resolveWorldMapInitialCameraV0("globe");
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(orbit.lon, orbit.lat, orbit.height),
            orientation: {
              heading: Cesium.Math.toRadians(orbit.headingDeg ?? 0),
              pitch: Cesium.Math.toRadians(orbit.pitchDeg ?? -58),
              roll: 0
            },
            duration: 1.6
          });
        },
        focusCastle() {
          const anchor = resolveCesiumMapCameraAnchorV0(readRhizohWorldMapToolV0());
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.height),
            orientation: {
              heading: Cesium.Math.toRadians(anchor.headingDeg),
              pitch: Cesium.Math.toRadians(anchor.pitchDeg),
              roll: 0
            },
            duration: 1.1
          });
        },
        focusPOI(key) {
          const poi = ISTANBUL_POI[key];
          if (!poi) return;
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(poi.lon, poi.lat, 1800),
            duration: 1.1
          });
        },
        flyToCustom(lat, lon, height = 900, meta = {}) {
          const la = Number(lat);
          const lo = Number(lon);
          const h = Number(height);
          if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
          const tool = meta.mapTool || readRhizohWorldMapToolV0();
          const anchor = resolveCesiumMapCameraAnchorV0(tool);
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(lo, la, Number.isFinite(h) ? h : anchor.height),
            orientation: {
              heading: Cesium.Math.toRadians(
                Number.isFinite(meta.headingDeg) ? meta.headingDeg : anchor.headingDeg
              ),
              pitch: Cesium.Math.toRadians(
                Number.isFinite(meta.pitchDeg) ? meta.pitchDeg : anchor.pitchDeg
              ),
              roll: 0
            },
            duration: 1.35
          });
        },
        streetView(lat = mapBootstrapGeo.lat, lon = mapBootstrapGeo.lon, height = 130) {
          navStateRef.current.enabled = true;
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            orientation: {
              heading: Cesium.Math.toRadians(30),
              pitch: Cesium.Math.toRadians(-12),
              roll: 0
            },
            duration: 0.9
          });
        },
        getCameraGeo() {
          const c = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC);
          if (!c) return null;
          return {
            lat: Cesium.Math.toDegrees(c.latitude),
            lon: Cesium.Math.toDegrees(c.longitude),
            height: c.height
          };
        },
        zoomByFactor(factor) {
          const geo = this.getCameraGeo();
          if (!geo || !Number.isFinite(factor) || !Number.isFinite(geo.height)) {
            return { ok: false, reason: "no_geo" };
          }
          const zoomMax = resolveCesiumMapZoomMaxHeightV0(readRhizohWorldMapToolV0());
          const h = Math.min(
            Math.min(CESIUM_ZOOM_MAX_HEIGHT_V0, zoomMax),
            Math.max(CESIUM_ZOOM_MIN_HEIGHT_V0, geo.height * factor)
          );
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(geo.lon, geo.lat, h),
            duration: 0.35
          });
          return { ok: true, height: h, factor };
        }
      });

      let commandBridgeInstalled = false;

      const publishCesiumExecutorCoreV0 = (label = "core") => {
        const hostEl = hostRef.current;
        const viewer = viewerRef.current;
        if (!hostEl || !viewer || viewer.isDestroyed?.()) return false;
        resizeCesiumViewerToHostV0(viewer, hostEl);
        const layout = measureCesiumHostLayoutV0(hostEl);
        if (!layout.ready) {
          console.warn("[castle:cesium] defer executor register — layout gate", { label, ...layout });
          return false;
        }
        Object.assign(ensureCastleCesiumApiV0(), {
          ready: true,
          commandReady: true,
          renderDegraded: false,
          renderErrorCount: 0,
          isFlying: false,
          vanillaRealMap: vanilla,
          importantCount: ensureCastleCesiumApiV0()?.importantCount ?? 0,
          ...buildCesiumCameraCommandSurfaceV0()
        });
        registerCesiumExecutorApiV0(ensureCastleCesiumApiV0());
        if (!commandBridgeInstalled) {
          uninstallCesiumCommandBridge = installCesiumCommandBridgeV0();
          commandBridgeInstalled = true;
        }
        installRhizohMapDiagnosticsV0();
        console.info(`[castle:cesium] viewer command-ready (${label})`, {
          ready: true,
          commandReady: true,
          hostClientW: layout.hostW,
          hostClientH: layout.hostH,
          canvasClientW: layout.canvasW,
          canvasClientH: layout.canvasH,
          active: activeRef.current
        });
        window.dispatchEvent(
          new CustomEvent("castle:cesium-command-ready-v0", {
            detail: Object.freeze({ label, commandReady: true, atMs: Date.now() })
          })
        );
        return true;
      };

      publishExecutorRef.current = publishCesiumExecutorCoreV0;

      if (!publishCesiumExecutorCoreV0("core")) {
        console.warn("[castle:cesium] core executor deferred until host/canvas layout > 0");
      }

      if (staged) await sleep(cfg.cesiumStageMsTerrain);

      await runBootStage(
        "world_terrain",
        async () => {
          if (!vanilla && ionUsable && cfg.cesiumWorldTerrain && !hwProfile.lowHardware) {
            const terrain = await Cesium.createWorldTerrainAsync({
              requestWaterMask: true,
              requestVertexNormals: true
            });
            if (dead || cancelled || viewerRef.current !== viewer) return;
            viewer.terrainProvider = terrain;
            viewer.scene.requestRender();
            logCesiumBootDiag("after_world_terrain");
          }
        },
        () => {
          try {
            viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            viewer.scene.globe.depthTestAgainstTerrain = false;
            viewer.scene.requestRender();
          } catch {
            /* noop */
          }
        }
      );

      if (cfg.rhizohEpistemicCesiumBootstrap && !dead && !cancelled && viewerRef.current === viewer) {
        try {
          const presence = buildRhizohEpistemicWorldPresenceForBootstrapV0();
          teardownRhizohEpistemicBootstrap = installRhizohEpistemicCesiumBootstrapV0(viewer, Cesium, presence);
        } catch (e) {
          console.warn("[CASTLE_CESIUM] rhizoh epistemic bootstrap:", String(e?.message || e));
        }
      }

      if (dead || cancelled || viewerRef.current !== viewer) return;

      if (staged) await sleep(cfg.cesiumStageMsOsm);

      let hasOsmBuildings = false;

      const applyCategoryVisibility = () => {
        for (const row of importantEntitiesRef.current) {
          if (row.point) row.point.show = !!categoryStateRef.current[row.category];
        }
      };

      let important = [];

      const applyWorldMapLayersV0 = async () => {
        if (worldMapLayersApplied || dead || cancelled || vanilla || viewerRef.current !== viewer) {
          return false;
        }
        worldMapLayersApplied = true;
        sanitizeCesiumCameraV0(viewer, Cesium, cameraSafeAnchor());

        await runBootStage(
          "osm_buildings",
          async () => {
            if (
              !vanilla &&
              ionUsable &&
              cfg.cesiumOsmBuildings &&
              !pvsSafeModeLock &&
              !hwProfile.lowHardware
            ) {
              osmBuildingsPrimitive = await Cesium.createOsmBuildingsAsync();
              if (dead || cancelled || viewerRef.current !== viewer) return;
              configureOsmBuildingsTilesetV0(osmBuildingsPrimitive);
              applyOsmBuildingsVisualStyleV0(osmBuildingsPrimitive, Cesium, { neon: true });
              viewer.scene.primitives.add(osmBuildingsPrimitive);
              hasOsmBuildings = true;
              viewer.scene.requestRender();
              logCesiumBootDiag("after_osm_buildings");
            }
          },
          () => {
            try {
              removeOsmBuildingsTilesetV0(viewer, osmBuildingsPrimitive);
            } catch {
              /* noop */
            }
            osmBuildingsPrimitive = null;
            hasOsmBuildings = false;
          }
        );

        if (dead || cancelled || viewerRef.current !== viewer) return false;

        await runBootStage(
          "important_places",
          async () => {
            if (!vanilla) {
              const poiLoad = await loadCastleWorldImportantPlacesV2(IMPORTANT_OVERPASS_TAGS);
              important = poiLoad.rows;
            }
            if (!vanilla && important.length > 2000) important = important.slice(0, 2000);
            const poiGeo = filterCesiumGeoRowsV0(important);
            if (poiGeo.dropped > 0) {
              console.warn("[CASTLE_CESIUM] poi_geo_dropped", { dropped: poiGeo.dropped });
            }
            importantRowsRef.current = poiGeo.rows.map((p) => ({ ...p, category: classifyCategory(p.tags) }));
            const poiRender = capRowsForCesiumRenderV0(
              importantRowsRef.current,
              CESIUM_SCENE_BUDGET.MAX_POI_ENTITIES
            );
            if (poiRender.truncated) {
              logCesiumPoiUxCapV0({
                loaded: poiRender.total,
                rendered: poiRender.rows.length,
                cap: CESIUM_SCENE_BUDGET.MAX_POI_ENTITIES,
                dataRowsRetained: importantRowsRef.current.length
              });
            }
            if (!vanilla && !dead && viewerRef.current) {
              cancelCesiumCameraFlightV0(viewer);
              sanitizeCesiumCameraV0(viewer, Cesium, cameraSafeAnchor());
              await waitForCesiumRenderStableFramesV0(viewer, 2, 5_000);
              if (dead || cancelled || viewerRef.current !== viewer || pvsSafeModeLock) return;
              clearPoiPointCollectionV0();
              poiPointCollection = new Cesium.PointPrimitiveCollection();
              viewer.scene.primitives.add(poiPointCollection);
              importantEntitiesRef.current = poiRender.rows.flatMap((p) => {
                const category = p.category;
                const position = cesiumSafeFromDegreesV0(Cesium, p.lon, p.lat, 0);
                if (!position) return [];
                const point = poiPointCollection.add({
                  position,
                  pixelSize: 11,
                  color: poiColorFor(p.tags, Cesium),
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  show: !!categoryStateRef.current[category]
                });
                return [
                  {
                    category,
                    point,
                    meta: {
                      id: p.id,
                      name: p.name,
                      lat: p.lat,
                      lon: p.lon,
                      tags: p.tags,
                      category
                    }
                  }
                ];
              });
            }
          },
          () => {
            clearPoiPointCollectionV0();
            importantRowsRef.current = [];
            important = [];
          }
        );

        if (dead || cancelled || viewerRef.current !== viewer) return false;

        await runBootStage(
          "fallback_footprints",
          async () => {
            if (!vanilla && !hasOsmBuildings && !pvsSafeModeLock && !renderDegraded) {
              const { rows: footprintsRaw } = await loadCastleWorldBuildingFootprintsV2(
                CESIUM_SCENE_BUDGET.MAX_FOOTPRINT_ENTITIES
              );
              const capped = capRowsForCesiumRenderV0(
                footprintsRaw,
                CESIUM_SCENE_BUDGET.MAX_FOOTPRINT_ENTITIES
              );
              if (capped.truncated) {
                logCesiumFootprintRenderCapV0({
                  loaded: capped.total,
                  rendered: capped.rows.length,
                  cap: CESIUM_SCENE_BUDGET.MAX_FOOTPRINT_ENTITIES
                });
              }
              const footprintGeo = filterCesiumGeoRowsV0(capped.rows);
              const footprints = footprintGeo.rows;
              sanitizeCesiumCameraV0(viewer, Cesium, cameraSafeAnchor());
              if (!dead && viewerRef.current && footprints.length > 0) {
                clearBuildingPointCollectionV0();
                buildingPointCollection = new Cesium.PointPrimitiveCollection();
                viewer.scene.primitives.add(buildingPointCollection);
                fallbackBuildingEntitiesRef.current = footprints.flatMap((b) => {
                  const position = cesiumSafeFromDegreesV0(Cesium, b.lon, b.lat, 16);
                  if (!position) return [];
                  return [
                    buildingPointCollection.add({
                      position,
                      pixelSize: 4,
                      color: Cesium.Color.fromCssColorString("#8aa1b5").withAlpha(0.55),
                      outlineColor: Cesium.Color.BLACK,
                      outlineWidth: 1
                    })
                  ];
                });
              }
            }
          },
          () => {
            clearBuildingPointCollectionV0();
          }
        );

        if (window.__CASTLE_CESIUM__) {
          window.__CASTLE_CESIUM__.importantCount = importantEntitiesRef.current.length;
        }
        publishExecutorRef.current?.("world-layers");
        try {
          const api = ensureCastleCesiumApiV0();
          if (api) api.commandReady = true;
          registerCesiumExecutorApiV0(api);
          drainCesiumExecutorPendingV0();
          await new Promise((resolve) => {
            window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
          });
          if (!dead && viewerRef.current === viewer) {
            viewer.scene.requestRender();
          }
        } catch {
          /* noop */
        }
        return true;
      };

      if (!activeRef.current) {
        console.info("[castle:cesium] world layers deferred — map inactive");
      }

      if (dead || cancelled || viewerRef.current !== viewer) return;

      if (!vanilla && cesiumSceneOverBudget(viewer)) {
        console.warn("[CASTLE_CESIUM] Boot scene budget aşıldı — güvenli mod.");
        applyCesiumSafeMode();
      }

      let currentImageryProfile = cfg.satelliteTileTemplate ? "satellite" : "city_3d";

      const applyImageryProfile = async (profileId) => {
        if (!viewer || viewer.isDestroyed?.()) return false;
        const matrix = resolveCesiumLayerMatrixV0({
          mapTool: readRhizohWorldMapToolV0(),
          lowHardware: hwProfile.lowHardware,
          cfg
        });
        const profile = String(profileId || matrix.imageryProfile || "streets");
        currentImageryProfile = profile;
        try {
          await applyCesiumBasemapImageryV0(viewer, Cesium, profile, {
            ionUsable,
            satelliteTileTemplate: cfg.satelliteTileTemplate,
            mapboxToken: cfg.mapboxToken,
            lowHardware: matrix.lowHardware
          });

          if (osmBuildingsPrimitive && !osmBuildingsPrimitive.isDestroyed?.()) {
            osmBuildingsPrimitive.show = matrix.osmBuildingsVisible;
            if (matrix.osmBuildingsVisible && matrix.osmBuildingsNeonStyle) {
              applyOsmBuildingsVisualStyleV0(osmBuildingsPrimitive, Cesium, { neon: true });
            }
          }

          if (matrix.terrainEnabled && !vanilla && ionUsable && cfg.cesiumWorldTerrain) {
            try {
              const terrain = await Cesium.createWorldTerrainAsync({
                requestWaterMask: true,
                requestVertexNormals: true
              });
              viewer.terrainProvider = terrain;
              viewer.scene.globe.depthTestAgainstTerrain = true;
            } catch {
              viewer.scene.globe.depthTestAgainstTerrain = false;
            }
          } else {
            try {
              viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
            } catch {
              /* noop */
            }
            viewer.scene.globe.depthTestAgainstTerrain = false;
          }

          viewer.scene.requestRender();
          return true;
        } catch (e) {
          console.warn("[CASTLE_CESIUM] setImageryProfile", profile, e);
          return false;
        }
      };

      installCastleStudioMapBridgeV0();

      const bootImageryProfile = resolveCesiumImageryProfileForMapToolV0(readRhizohWorldMapToolV0());
      currentImageryProfile = bootImageryProfile;
      void applyImageryProfile(bootImageryProfile);

      const wdSnap = getCastleWorldDataStateV2();
      Object.assign(ensureCastleCesiumApiV0(), {
        ready: true,
        commandReady: true,
        renderDegraded: false,
        renderErrorCount: 0,
        worldRepresentation: wdSnap.representation,
        worldFeed: wdSnap.feed,
        worldDataHint: wdSnap.userHint,
        /** streets | satellite | city_3d | terrain | dark */
        getImageryProfile() {
          return currentImageryProfile;
        },
        getLayerMatrix() {
          return resolveCesiumLayerMatrixV0({
            mapTool: readRhizohWorldMapToolV0(),
            lowHardware: hwProfile.lowHardware,
            cfg
          });
        },
        setImageryProfile: applyImageryProfile,
        async refreshImageryForMapTool() {
          const matrix = resolveCesiumLayerMatrixV0({
            mapTool: readRhizohWorldMapToolV0(),
            lowHardware: hwProfile.lowHardware,
            cfg
          });
          return applyImageryProfile(matrix.imageryProfile);
        },
        setOsmBuildingsVisible(visible) {
          if (osmBuildingsPrimitive && !osmBuildingsPrimitive.isDestroyed?.()) {
            osmBuildingsPrimitive.show = !!visible;
            viewer.scene.requestRender();
          }
        },
        /** RealityDirector + Apex kuyruk kapısı — trackedCameraFlyTo ile güncellenir */
        isFlying: false,
        vanillaRealMap: vanilla,
        importantCount: importantRowsRef.current.length,
        ensureWorldLayers: applyWorldMapLayersV0,
        categoryLabels: CATEGORY_LABELS,
        categoryColors: CATEGORY_COLORS,
        getCategoryState() {
          return { ...categoryStateRef.current };
        },
        getCategoryCounts() {
          const out = {};
          for (const k of Object.keys(CATEGORY_LABELS)) out[k] = 0;
          for (const r of importantRowsRef.current) out[r.category] = (out[r.category] || 0) + 1;
          return out;
        },
        getImportantSample(limit = 16) {
          return importantRowsRef.current.slice(0, limit).map((r) => ({
            id: r.id,
            name: r.name,
            lat: r.lat,
            lon: r.lon,
            category: r.category,
            tags: r.tags
          }));
        },
        setCategoryVisible(category, visible) {
          if (!(category in categoryStateRef.current)) return;
          categoryStateRef.current[category] = !!visible;
          applyCategoryVisibility();
        },
        ...buildCesiumCameraCommandSurfaceV0(),
        enableStreetNavigation(enabled = true) {
          navStateRef.current.enabled = !!enabled;
        },
        findNearestImportant(lat, lon, maxMeters = 500) {
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          let best = null;
          let bestD = Number.POSITIVE_INFINITY;
          for (const p of importantRowsRef.current) {
            const d = haversineMeters(lat, lon, p.lat, p.lon);
            if (d < bestD) {
              best = p;
              bestD = d;
            }
          }
          if (!best || bestD > maxMeters) return null;
          return {
            id: best.id,
            name: best.name,
            lat: best.lat,
            lon: best.lon,
            category: best.category,
            distanceMeters: bestD,
            tags: best.tags
          };
        }
      });

      registerCesiumExecutorApiV0(ensureCastleCesiumApiV0());
      publishCesiumExecutorCoreV0("full");

      if (activeRef.current) {
        void (async () => {
          try {
            await waitForCesiumRenderStableFramesV0(viewer, 2, 6_000);
            if (dead || cancelled || viewerRef.current !== viewer || pvsSafeModeLock) return;
            await applyWorldMapLayersV0();
          } catch {
            /* noop */
          }
        })();
      }

      try {
        resyncCesiumEpistemicRuntimeWindowMirrorV0();
      } catch {
        /* noop */
      }

      const bootMapTool = readRhizohWorldMapToolV0();
      if (bootMapTool !== "globe") {
        applyCesiumImageryForMapToolV0(bootMapTool, { maxAttempts: 64 });
      }

      try {
        teardownPerceptionDebug = maybeInstallPerceptionDebugObserverV0(viewer, Cesium, () => {
          try {
            const root = getRhizohCalibrationRootAnchorV0();
            const st = buildRhizohEpistemicWorldPresenceForBootstrapV0();
            return deriveAnchorAtmosphereProjectionV0(root, st).localFog;
          } catch {
            return undefined;
          }
        });
      } catch {
        /* noop */
      }

      try {
        teardownEpistemicSimResearch = maybeInstallEpistemicSimResearchOnCesiumV0(viewer);
      } catch {
        /* noop */
      }

      try {
        teardownPetSpatialBinding = maybeInstallRhizohPetCesiumSpatialBindingV0(viewer);
      } catch {
        /* noop */
      }

      try {
        teardownEpistemicGraphViz = maybeInstallEpistemicGraphVisualizationOnCesiumV0(viewer);
      } catch {
        /* noop */
      }

      try {
        if (isSovereignNodeOnboardingEnabledV0()) {
          teardownSovereignGeographicPick = installCesiumSovereignGeographicPickV0(viewer);
        }
      } catch {
        /* noop */
      }

      try {
        registerLiveRuntimeProjectionConsumerV0(({ hints }) => {
          try {
            applyLiveRuntimeProjectionHintsToCesiumSceneV0(viewer, hints);
            if (viewer && typeof viewer.isDestroyed === "function" && !viewer.isDestroyed()) {
              viewer.scene.requestRender();
            }
          } catch {
            /* noop */
          }
        });
      } catch {
        /* noop */
      }

      if (staged && worldProjectionBindEnabled) {
        const t0DeferMs =
          String(import.meta.env.VITE_RHIZOH_T0_FIRST_MATCH ?? "").trim() === "1" ? 18_000 : cfg.cesiumStageMsProjection;
        await sleep(t0DeferMs);
        if (dead || cancelled || viewerRef.current !== viewer) return;
        if (t0DeferMs > cfg.cesiumStageMsProjection) {
          const stable = await waitForCesiumRenderStableFramesV0(viewer, 3, 12_000);
          if (!stable) {
            console.warn("[castle:cesium] skip world_projection_bind — render not stable (T0 defer)");
            worldProjectionBindEnabled = false;
          }
        }
      }
      await runBootStage(
        "world_projection_bind",
        async () => {
          if (!vanilla && worldProjectionBindEnabled && !dead && viewerRef.current === viewer) {
            sanitizeCesiumCameraV0(viewer, Cesium, cameraSafeAnchor());
            uninstallWorldProjection = installCesiumWorldProjectionBind(viewer, mapBootstrapGeo);
            logCesiumBootDiag("after_world_projection_bind");
          }
        },
        () => {
          try {
            uninstallWorldProjection();
          } catch {
            /* noop */
          }
          uninstallWorldProjection = () => {};
        }
      );

      viewer.selectedEntityChanged.addEventListener((entity) => {
        const meta = entity?.__castleMeta;
        if (!meta) return;
        if (isEpistemicSimResearchEnabledV0()) {
          recordPoiSelectObserverTelemetryV0({
            id: meta.id,
            category: meta.category,
            label: meta.label
          });
        }
        window.__CASTLE_CESIUM__.selectedPoi = {
          ...meta,
          categoryLabel: CATEGORY_LABELS[meta.category] || meta.category,
          color: CATEGORY_COLORS[meta.category] || "#e5e7eb"
        };
      });

      let preRender = null;
      let mapPickHandler = null;
      let unsub = () => {};
      let onKeyDown = () => {};
      let onKeyUp = () => {};
      if (!vanilla) {
        try {
          mapPickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
          mapPickHandler.setInputAction((click) => {
            if (!activeRef.current || !readWorldMapClaimModeV0()) return;
            const ray = viewer.camera.getPickRay(click.position);
            if (!ray) return;
            const cartesian =
              viewer.scene.globe.pick(ray, viewer.scene) ||
              viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
            if (!cartesian) return;
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(carto.latitude);
            const lon = Cesium.Math.toDegrees(carto.longitude);
            createLocalGhostCastleAnchorV0({
              lat,
              lon,
              label: `Ghost · ${lat.toFixed(3)}, ${lon.toFixed(3)}`
            });
            writeWorldMapClaimModeV0(false);
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        } catch {
          /* noop */
        }

        preRender = () => {
          const v = viewerRef.current;
          if (v && v === viewer) {
            try {
              if (!activeRef.current || !isCesiumCanvasRenderableV0(v)) {
                stopCesiumDefaultRenderLoopV0(v);
                return;
              }
              sanitizeCesiumCameraV0(v, Cesium, cameraSafeAnchor());
              const poiLayers = readWorldMapMarkerLayerStateV0();
              const poiVis = resolveEpistemicPoiVisibilityV0(v, Cesium);
              const showPoi = poiLayers.epistemicPoi && poiVis.visible;
              for (const row of importantEntitiesRef.current) {
                if (row.point) {
                  row.point.show = showPoi && !!categoryStateRef.current[row.category];
                }
              }
            } catch {
              /* noop */
            }
          }
          if (v && activeRef.current && navStateRef.current.enabled) {
            try {
              const keys = navStateRef.current.keys;
              const baseMove = keys.boost ? 18 : 6;
              const move = baseMove * getEpistemicNavigationMoveScaleV0();
              if (keys.forward) v.camera.moveForward(move);
              if (keys.back) v.camera.moveBackward(move);
              if (keys.left) v.camera.moveLeft(move);
              if (keys.right) v.camera.moveRight(move);
              if (keys.up) v.camera.moveUp(move);
              if (keys.down) v.camera.moveDown(move);
            } catch {
              /* noop */
            }
          }
          if (!sceneBudgetDowngraded && v && v === viewer && !vanilla) {
            try {
              if (cesiumSceneOverBudget(v)) {
                sceneBudgetDowngraded = true;
                console.warn("[CASTLE_CESIUM] Sahne bütçesi — güvenli mod (watchdog).");
                applyCesiumSafeMode();
              }
            } catch {
              /* noop */
            }
          }
        };
        viewer.scene.preRender.addEventListener(preRender);

        onKeyDown = (e) => {
          const keys = navStateRef.current.keys;
          const k = e.key.toLowerCase();
          if (k === "w") keys.forward = true;
          if (k === "s") keys.back = true;
          if (k === "a") keys.left = true;
          if (k === "d") keys.right = true;
          if (k === "q") keys.down = true;
          if (k === "e") keys.up = true;
          if (k === "shift") keys.boost = true;
          if (isEpistemicSimResearchEnabledV0() && "wsadqe".includes(k)) {
            recordCameraKeyObserverTelemetryV0(k);
          }
        };
        onKeyUp = (e) => {
          const keys = navStateRef.current.keys;
          const k = e.key.toLowerCase();
          if (k === "w") keys.forward = false;
          if (k === "s") keys.back = false;
          if (k === "a") keys.left = false;
          if (k === "d") keys.right = false;
          if (k === "q") keys.down = false;
          if (k === "e") keys.up = false;
          if (k === "shift") keys.boost = false;
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        unsub = subscribeCastleDroneTelemetry((p) => {
          const v = viewerRef.current;
          if (!v || !p || p.lat == null || p.lon == null) return;
          const id = String(p.id || "drone");
          const map = droneEntitiesRef.current;
          let ent = map.get(id);
          if (!ent) {
            ent = v.entities.add({
              id: `drone-${id}`,
              position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt ?? 120),
              point: { pixelSize: 7, color: Cesium.Color.CYAN, outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 },
              label: {
                text: id,
                font: "12px sans-serif",
                fillColor: Cesium.Color.CYAN,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -16)
              }
            });
            map.set(id, ent);
          } else {
            ent.position = Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt ?? 120);
          }
        });
      }

      extrasCleanupRef.current = () => {
        try {
          uninstallCesiumCommandBridge();
        } catch {
          /* noop */
        }
        uninstallCesiumCommandBridge = () => {};
        clearCesiumExecutorApiV0();
        try {
          unregisterLiveRuntimeProjectionConsumerV0();
        } catch {
          /* noop */
        }
        try {
          unregisterLiveRuntimeCesiumRenderSinkV0();
        } catch {
          /* noop */
        }
        try {
          teardownPerceptionDebug();
        } catch {
          /* noop */
        }
        teardownPerceptionDebug = () => {};
        try {
          teardownEpistemicSimResearch();
        } catch {
          /* noop */
        }
        teardownEpistemicSimResearch = () => {};
        try {
          teardownPetSpatialBinding();
        } catch {
          /* noop */
        }
        teardownPetSpatialBinding = () => {};
        try {
          teardownEpistemicGraphViz();
        } catch {
          /* noop */
        }
        teardownEpistemicGraphViz = () => {};
        try {
          teardownSovereignGeographicPick();
        } catch {
          /* noop */
        }
        teardownSovereignGeographicPick = () => {};
        try {
          teardownAnchorMarkers();
        } catch {
          /* noop */
        }
        teardownAnchorMarkers = () => {};
        try {
          teardownRhizohEpistemicBootstrap();
        } catch {
          /* noop */
        }
        teardownRhizohEpistemicBootstrap = () => {};
        try {
          removeCameraPreRenderGuard();
        } catch {
          /* noop */
        }
        removeCameraPreRenderGuard = () => {};
        if (preRender) {
          try {
            viewer.scene?.preRender?.removeEventListener(preRender);
          } catch {
            /* noop */
          }
        }
        try {
          mapPickHandler?.destroy?.();
        } catch {
          /* noop */
        }
        mapPickHandler = null;
        unsub?.();
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        try {
          removeRenderErrorListener();
        } catch {
          /* noop */
        }
        try {
          removePostRenderOk();
        } catch {
          /* noop */
        }
        removePostRenderOk = () => {};
        try {
          uninstallWorldProjection();
        } catch {
          /* noop */
        }
      };

      if (cancelled || dead) {
        extrasCleanupRef.current();
        extrasCleanupRef.current = null;
        destroyCesiumViewerSafeV0(viewer, hostRef.current);
        viewerRef.current = null;
        resetCesiumApexCameraCoordinator();
        if (window.__CASTLE_CESIUM__) delete window.__CASTLE_CESIUM__;
        return;
      }

      setCesiumActivity(viewer, activeRef.current, cameraSafeAnchor());
      if (vanilla && activeRef.current) {
        try {
          viewer.scene.screenSpaceCameraController.enableInputs = false;
        } catch {
          /* noop */
        }
      }
      if (activeRef.current && !vanilla) window.__CASTLE_CESIUM__?.enableStreetNavigation?.(true);
    };

    const run = async () => {
      if (bootedRef.current && viewerRef.current) return;
      if (bootingRef.current) return;
      if (!hostRef.current) return;
      bootingRef.current = true;
      try {
        await boot();
        if (!cancelled && !dead && viewerRef.current) bootedRef.current = true;
      } catch (err) {
        console.error("[castle:cesium] boot failed", err);
      } finally {
        bootingRef.current = false;
      }
    };

    attemptBootRef.current = run;
    if (hostRef.current) {
      layoutObserverCleanupRef.current?.();
      layoutObserverCleanupRef.current = observeCesiumHostLayoutV0(hostRef.current, () => {
        if (bootedRef.current && viewerRef.current && hostRef.current) {
          resizeCesiumViewerToHostV0(viewerRef.current, hostRef.current);
          publishExecutorRef.current?.("layout-resize");
          return;
        }
        if (!bootingRef.current && !bootedRef.current) {
          clearTimeout(bootAttemptRef.current);
          bootAttemptRef.current = window.setTimeout(() => {
            bootAttemptRef.current = null;
            void run();
          }, 32);
        }
      });
    }

    void run();

    return () => {
      cancelled = true;
      dead = true;
      attemptBootRef.current = null;
      clearTimeout(bootAttemptRef.current);
      layoutObserverCleanupRef.current?.();
      layoutObserverCleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onMapToolChange = () => {
      void window.__CASTLE_CESIUM__?.refreshImageryForMapTool?.();
    };
    window.addEventListener(RHIZOH_WORLD_MAP_TOOL_CHANGE_EVENT_V0, onMapToolChange);
    return () => window.removeEventListener(RHIZOH_WORLD_MAP_TOOL_CHANGE_EVENT_V0, onMapToolChange);
  }, []);

  useEffect(() => {
    const v = viewerRef.current;
    const host = hostRef.current;
    if (!v || v.isDestroyed?.()) return;
    if (host) resizeCesiumViewerToHostV0(v, host);
    const cameraAnchor = resolveCesiumMapCameraAnchorV0(readRhizohWorldMapToolV0());
    const flightCfg = getCastleFlightConfig();
    const noStreet = !!flightCfg.cesiumVanillaRealMap || isCastleLightRuntimeV0();
    if (active) {
      void (async () => {
        try {
          await window.__CASTLE_CESIUM__?.ensureWorldLayers?.();
        } catch {
          /* noop */
        }
        try {
          const profile = resolveCesiumImageryProfileForMapToolV0(readRhizohWorldMapToolV0());
          await window.__CASTLE_CESIUM__?.setImageryProfile?.(profile);
        } catch {
          /* noop */
        }
        setCesiumActivity(v, true, cameraAnchor);
        if (noStreet) {
          try {
            v.scene.screenSpaceCameraController.enableInputs = false;
          } catch {
            /* noop */
          }
        }
        if (!noStreet) window.__CASTLE_CESIUM__?.enableStreetNavigation?.(true);
      })();
      return;
    }
    setCesiumActivity(v, false);
    if (!noStreet) window.__CASTLE_CESIUM__?.enableStreetNavigation?.(false);
  }, [active]);

  return (
    <div className="absolute inset-0 z-[2] h-full w-full min-h-0">
      <div
        ref={hostRef}
        data-castle-cesium-host="1"
        data-cesium-active={active ? "1" : "0"}
        className={`h-full w-full transition-opacity duration-150 ease-out ${
          active ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none select-none"
        }`}
        aria-hidden={!active}
      />
      {light2dActive && active ? (
        <div className="pointer-events-none absolute left-4 top-4 rounded border border-cyan-500/30 bg-black/60 px-3 py-1.5 font-mono text-xs tracking-widest text-cyan-400 backdrop-blur-md animate-pulse">
          RHIZOH CORE OS // LIGHT-2D ACTIVE
        </div>
      ) : null}
    </div>
  );
});

/** WORLD layer opt-out — Genesis / survival surfaces must not mount Cesium/WebGL map stack. */
export default function CesiumRealMapLayer(props) {
  if (!isWorldLayerEnabled()) return null;
  return <CesiumRealMapLayerImpl {...props} />;
}
