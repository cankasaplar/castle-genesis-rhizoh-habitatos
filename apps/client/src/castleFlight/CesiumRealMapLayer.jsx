import React, { memo, useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { ISTANBUL_GEO, ISTANBUL_POI } from "./geo.js";
import { getCastleFlightConfig } from "./castleFlightConfig.js";
import { subscribeCastleDroneTelemetry } from "./telemetryHub.js";
import { installCesiumWorldProjectionBind } from "./cesiumWorldProjectionBind.js";
import { installWebglContextLostReporter, reportCastleFatal } from "../boot/castleCrashTelemetry.js";
import {
  notifyCesiumFlightStart,
  notifyCesiumFlightEnd,
  resetCesiumApexCameraCoordinator
} from "../reality/realityDirector.js";
import { cesiumSceneOverBudget } from "./cesiumSceneBudget.js";

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

/** display:none → block geçişinde canvas 0×0 iken Viewer açılırsa frustum bozulabilir */
async function waitForHostLayout(el, { minSize = 48, timeoutMs = 4000 } = {}) {
  if (!el) return false;
  const t0 = performance.now();
  while (performance.now() - t0 < timeoutMs) {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w >= minSize && h >= minSize) return true;
    await new Promise((r) => requestAnimationFrame(r));
  }
  return el.clientWidth > 4 && el.clientHeight > 4;
}

function createFallbackImportantPlaces() {
  return Object.entries(ISTANBUL_POI).map(([id, p]) => ({
    id: `fallback-${id}`,
    lat: p.lat,
    lon: p.lon,
    name: p.label,
    tags: { tourism: "attraction" }
  }));
}

async function loadIstanbulImportantPlaces(limit = 220) {
  const bbox = `${ISTANBUL_GEO.latMin},${ISTANBUL_GEO.lonMin},${ISTANBUL_GEO.latMax},${ISTANBUL_GEO.lonMax}`;
  const queryParts = IMPORTANT_OVERPASS_TAGS.map(([k, v]) => `node["${k}"="${v}"](${bbox});`).join("\n");
  const q = `
[out:json][timeout:30];
(
${queryParts}
);
out body;
`;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 14000);
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: q,
      signal: controller.signal,
      headers: { "Content-Type": "text/plain" }
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const json = await res.json();
    const rows = Array.isArray(json?.elements) ? json.elements : [];
    return rows
      .filter((r) => Number.isFinite(r?.lat) && Number.isFinite(r?.lon))
      .slice(0, limit)
      .map((r, i) => ({
        id: String(r.id ?? `n-${i}`),
        lat: Number(r.lat),
        lon: Number(r.lon),
        name: String(r?.tags?.name || r?.tags?.name_en || r?.tags?.operator || "Unnamed place"),
        tags: r.tags || {}
      }));
  } catch {
    return createFallbackImportantPlaces();
  }
}

async function loadIstanbulBuildingFootprints(limit = 280) {
  const bbox = `${ISTANBUL_GEO.latMin},${ISTANBUL_GEO.lonMin},${ISTANBUL_GEO.latMax},${ISTANBUL_GEO.lonMax}`;
  const q = `
[out:json][timeout:25];
(
  way["building"](${bbox});
);
out center tags;
`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: q,
      signal: controller.signal,
      headers: { "Content-Type": "text/plain" }
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`Overpass buildings ${res.status}`);
    const json = await res.json();
    const rows = Array.isArray(json?.elements) ? json.elements : [];
    return rows
      .filter((r) => Number.isFinite(r?.center?.lat) && Number.isFinite(r?.center?.lon))
      .slice(0, limit)
      .map((r, i) => ({
        id: String(r.id ?? `b-${i}`),
        lat: Number(r.center.lat),
        lon: Number(r.center.lon),
        levels: Number(r?.tags?.["building:levels"] || 0),
        height: Number(r?.tags?.height || 0)
      }));
  } catch {
    return [];
  }
}

function setCesiumActivity(viewer, on) {
  if (!viewer || viewer.isDestroyed?.()) return;
  try {
    viewer.clock.shouldAnimate = !!on;
    viewer.scene.requestRenderMode = true;
    viewer.scene.screenSpaceCameraController.enableInputs = !!on;
    if (on) viewer.scene.requestRender();
  } catch {
    /* noop */
  }
}

const CesiumRealMapLayer = memo(({ active }) => {
  const hostRef = useRef(null);
  const viewerRef = useRef(null);
  const droneEntitiesRef = useRef(new Map());
  const importantEntitiesRef = useRef([]);
  const importantRowsRef = useRef([]);
  const fallbackBuildingEntitiesRef = useRef([]);
  const activeRef = useRef(active);
  const bootedRef = useRef(false);
  const bootingRef = useRef(false);
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
      viewerRef.current = null;
      bootedRef.current = false;
      bootingRef.current = false;
      if (v && !v.isDestroyed()) {
        try {
          v.destroy();
        } catch {
          /* noop */
        }
      }
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
    const vanilla = !!cfg.cesiumVanillaRealMap;
    let cesiumFatalTelemetryOnce = false;

    const boot = async () => {
      if (!hostRef.current || viewerRef.current || dead || cancelled) return;
      await waitForHostLayout(hostRef.current);
      if (!hostRef.current || viewerRef.current || dead || cancelled) return;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!hostRef.current || viewerRef.current || dead || cancelled) return;

      if (cfg.cesiumIonToken) Cesium.Ion.defaultAccessToken = cfg.cesiumIonToken;
      const viewer = new Cesium.Viewer(hostRef.current, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayerPicker: true,
        shouldAnimate: true,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity
      });
      viewerRef.current = viewer;
      if (cancelled || dead) {
        try {
          viewer.destroy();
        } catch {
          /* noop */
        }
        viewerRef.current = null;
        return;
      }
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.globe.maximumScreenSpaceError = 2;
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

      const fatihSafe = ISTANBUL_POI.FATIH;
      let osmBuildingsPrimitive = null;
      let renderErrorCount = 0;
      let sceneBudgetDowngraded = false;

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

      const applyCesiumSafeMode = () => {
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
          if (osmBuildingsPrimitive && !osmBuildingsPrimitive.isDestroyed?.()) {
            viewer.scene.primitives.remove(osmBuildingsPrimitive);
            osmBuildingsPrimitive = null;
          }
        } catch {
          /* noop */
        }
        try {
          uninstallWorldProjection();
          uninstallWorldProjection = () => {};
        } catch {
          /* noop */
        }
        try {
          for (const ent of fallbackBuildingEntitiesRef.current) {
            try {
              viewer.entities.remove(ent);
            } catch {
              /* noop */
            }
          }
          fallbackBuildingEntitiesRef.current = [];
        } catch {
          /* noop */
        }
        try {
          for (const row of importantEntitiesRef.current) {
            try {
              viewer.entities.remove(row.entity);
            } catch {
              /* noop */
            }
          }
          importantEntitiesRef.current = [];
        } catch {
          /* noop */
        }
        try {
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(fatihSafe.lon, fatihSafe.lat, 5200),
            orientation: {
              heading: Cesium.Math.toRadians(18),
              pitch: Cesium.Math.toRadians(-35),
              roll: 0
            }
          });
        } catch {
          /* noop */
        }
      };

      const onRenderError = (_scene, error) => {
        renderErrorCount += 1;
        const msg = String(error?.message || error || "");
        console.error("[CASTLE_CESIUM] render_error", renderErrorCount, error);

        if (!cesiumFatalTelemetryOnce) {
          cesiumFatalTelemetryOnce = true;
          try {
            reportCastleFatal(
              "cesium_render_error",
              error instanceof Error ? error : new Error(String(error)),
              { recovered: renderErrorCount === 1, renderErrorCount }
            );
          } catch {
            /* noop */
          }
        }

        // İlk hatada güvenli mod; her kare requestRender() sonsuz RangeError döngüsü yapıyordu.
        if (renderErrorCount === 1) {
          applyCesiumSafeMode();
          try {
            viewer.useDefaultRenderLoop = true;
            viewer.scene.requestRender();
          } catch {
            /* noop */
          }
          return;
        }

        if (renderErrorCount >= 2) {
          try {
            viewer.useDefaultRenderLoop = false;
          } catch {
            /* noop */
          }
          console.error("[CASTLE_CESIUM] render loop stopped after repeated errors:", msg.slice(0, 200));
        }
      };
      removeRenderErrorListener = viewer.scene.renderError.addEventListener(onRenderError);
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
          if (cfg.satelliteTileTemplate) {
            const provider = new Cesium.UrlTemplateImageryProvider({ url: cfg.satelliteTileTemplate });
            viewer.imageryLayers.removeAll(true);
            viewer.imageryLayers.addImageryProvider(provider);
          } else {
            const osmProvider = new Cesium.OpenStreetMapImageryProvider({
              url: "https://tile.openstreetmap.org/"
            });
            viewer.imageryLayers.removeAll(true);
            viewer.imageryLayers.addImageryProvider(osmProvider);
          }
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

      const fatih = ISTANBUL_POI.FATIH;
      await runBootStage("initial_setView", async () => {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(fatih.lon, fatih.lat, 3800),
          orientation: {
            heading: Cesium.Math.toRadians(18),
            pitch: Cesium.Math.toRadians(-42),
            roll: 0
          }
        });
      });
      logCesiumBootDiag("after_initial_setView");

      if (dead || cancelled || viewerRef.current !== viewer) return;

      if (staged) await sleep(cfg.cesiumStageMsTerrain);

      await runBootStage(
        "world_terrain",
        async () => {
          if (!vanilla && cfg.cesiumIonToken && cfg.cesiumWorldTerrain) {
            const terrain = await Cesium.createWorldTerrainAsync();
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

      if (dead || cancelled || viewerRef.current !== viewer) return;

      if (staged) await sleep(cfg.cesiumStageMsOsm);

      let hasOsmBuildings = false;
      await runBootStage(
        "osm_buildings",
        async () => {
          if (!vanilla && cfg.cesiumOsmBuildings) {
            osmBuildingsPrimitive = await Cesium.createOsmBuildingsAsync();
            if (dead || cancelled || viewerRef.current !== viewer) return;
            viewer.scene.primitives.add(osmBuildingsPrimitive);
            hasOsmBuildings = true;
            viewer.scene.requestRender();
            logCesiumBootDiag("after_osm_buildings");
          }
        },
        () => {
          try {
            if (osmBuildingsPrimitive && !osmBuildingsPrimitive.isDestroyed?.()) {
              viewer.scene.primitives.remove(osmBuildingsPrimitive);
            }
          } catch {
            /* noop */
          }
          osmBuildingsPrimitive = null;
          hasOsmBuildings = false;
        }
      );

      if (dead || cancelled || viewerRef.current !== viewer) return;

      await runBootStage(
        "fallback_footprints",
        async () => {
          if (!vanilla && !hasOsmBuildings) {
            const footprints = await loadIstanbulBuildingFootprints();
            if (!dead && viewerRef.current && footprints.length > 0) {
              fallbackBuildingEntitiesRef.current = footprints.map((b, idx) => {
                const h =
                  Number.isFinite(b.height) && b.height > 0 ? b.height : Math.max(18, b.levels * 3.2 || 28 + (idx % 6) * 8);
                return viewer.entities.add({
                  id: `fallback-building-${b.id}`,
                  position: Cesium.Cartesian3.fromDegrees(b.lon, b.lat, h * 0.5),
                  box: {
                    dimensions: new Cesium.Cartesian3(14, 14, h),
                    material: Cesium.Color.fromCssColorString("#8aa1b5").withAlpha(0.45),
                    outline: false
                  }
                });
              });
            }
          }
        },
        () => {
          try {
            for (const ent of fallbackBuildingEntitiesRef.current) {
              try {
                viewer.entities.remove(ent);
              } catch {
                /* noop */
              }
            }
          } catch {
            /* noop */
          }
          fallbackBuildingEntitiesRef.current = [];
        }
      );

      const applyCategoryVisibility = () => {
        for (const row of importantEntitiesRef.current) {
          row.entity.show = !!categoryStateRef.current[row.category];
        }
      };

      let important = [];
      await runBootStage(
        "important_places",
        async () => {
          important = vanilla ? [] : await loadIstanbulImportantPlaces();
          if (!vanilla && important.length > 2000) important = important.slice(0, 2000);
          importantRowsRef.current = important.map((p) => ({ ...p, category: classifyCategory(p.tags) }));
          if (!vanilla && !dead && viewerRef.current) {
            importantEntitiesRef.current = importantRowsRef.current.map((p) => {
              const category = p.category;
              const entity = viewer.entities.add({
                id: `important-${p.id}`,
                position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 40),
                point: {
                  pixelSize: 6,
                  color: poiColorFor(p.tags, Cesium),
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 1.25
                },
                label: {
                  text: p.name,
                  font: "11px sans-serif",
                  fillColor: Cesium.Color.WHITE,
                  outlineColor: Cesium.Color.BLACK,
                  outlineWidth: 2,
                  style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                  pixelOffset: new Cesium.Cartesian2(0, -14),
                  showBackground: true,
                  backgroundColor: Cesium.Color.BLACK.withAlpha(0.45),
                  scale: 0.85,
                  horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                  distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 22000)
                }
              });
              entity.__castleMeta = {
                id: p.id,
                name: p.name,
                lat: p.lat,
                lon: p.lon,
                tags: p.tags,
                category
              };
              return { category, entity };
            });
            applyCategoryVisibility();
          }
        },
        () => {
          try {
            for (const row of importantEntitiesRef.current) {
              try {
                viewer.entities.remove(row.entity);
              } catch {
                /* noop */
              }
            }
          } catch {
            /* noop */
          }
          importantEntitiesRef.current = [];
          importantRowsRef.current = [];
          important = [];
        }
      );

      if (dead || cancelled || viewerRef.current !== viewer) return;

      if (!vanilla && cesiumSceneOverBudget(viewer)) {
        console.warn("[CASTLE_CESIUM] Boot scene budget aşıldı — güvenli mod.");
        applyCesiumSafeMode();
      }

      window.__CASTLE_CESIUM__ = {
        ready: true,
        /** RealityDirector + Apex kuyruk kapısı — trackedCameraFlyTo ile güncellenir */
        isFlying: false,
        vanillaRealMap: vanilla,
        importantCount: important.length,
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
        flyToIstanbul() {
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(fatih.lon, fatih.lat, 3400),
            duration: 1.2
          });
        },
        focusCastle() {
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(fatih.lon, fatih.lat, 1200),
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
        flyToCustom(lat, lon, height = 900) {
          const la = Number(lat);
          const lo = Number(lon);
          const h = Number(height);
          if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
          trackedCameraFlyTo({
            destination: Cesium.Cartesian3.fromDegrees(lo, la, Number.isFinite(h) ? h : 900),
            orientation: {
              heading: Cesium.Math.toRadians(20),
              pitch: Cesium.Math.toRadians(-38),
              roll: 0
            },
            duration: 1.35
          });
        },
        enableStreetNavigation(enabled = true) {
          navStateRef.current.enabled = !!enabled;
        },
        streetView(lat = fatih.lat, lon = fatih.lon, height = 130) {
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
      };

      if (staged && cfg.cesiumWorldProjectionBind) {
        await sleep(cfg.cesiumStageMsProjection);
        if (dead || cancelled || viewerRef.current !== viewer) return;
      }
      await runBootStage(
        "world_projection_bind",
        async () => {
          if (!vanilla && cfg.cesiumWorldProjectionBind && !dead && viewerRef.current === viewer) {
            uninstallWorldProjection = installCesiumWorldProjectionBind(viewer, fatih);
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
        window.__CASTLE_CESIUM__.selectedPoi = {
          ...meta,
          categoryLabel: CATEGORY_LABELS[meta.category] || meta.category,
          color: CATEGORY_COLORS[meta.category] || "#e5e7eb"
        };
      });

      let preRender = null;
      let unsub = () => {};
      let onKeyDown = () => {};
      let onKeyUp = () => {};
      if (!vanilla) {
        preRender = () => {
          const v = viewerRef.current;
          if (v && activeRef.current && navStateRef.current.enabled) {
            try {
              const keys = navStateRef.current.keys;
              const move = keys.boost ? 18 : 6;
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
        if (preRender) {
          try {
            viewer.scene?.preRender?.removeEventListener(preRender);
          } catch {
            /* noop */
          }
        }
        unsub?.();
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        try {
          removeRenderErrorListener();
        } catch {
          /* noop */
        }
        try {
          uninstallWorldProjection();
        } catch {
          /* noop */
        }
      };

      if (cancelled || dead) {
        extrasCleanupRef.current();
        extrasCleanupRef.current = null;
        try {
          if (!viewer.isDestroyed()) viewer.destroy();
        } catch {
          /* noop */
        }
        viewerRef.current = null;
        resetCesiumApexCameraCoordinator();
        if (window.__CASTLE_CESIUM__) delete window.__CASTLE_CESIUM__;
        return;
      }

      setCesiumActivity(viewer, activeRef.current);
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
      const flightCfg = getCastleFlightConfig();
      const noStreet = !!flightCfg.cesiumVanillaRealMap;
      if (!active) {
        setCesiumActivity(viewerRef.current, false);
        return;
      }
      if (bootedRef.current && viewerRef.current) {
        setCesiumActivity(viewerRef.current, true);
        if (noStreet) {
          try {
            viewerRef.current.scene.screenSpaceCameraController.enableInputs = false;
          } catch {
            /* noop */
          }
        }
        if (!noStreet) window.__CASTLE_CESIUM__?.enableStreetNavigation?.(true);
        return;
      }
      if (bootingRef.current || bootedRef.current) return;
      if (!hostRef.current) return;
      bootingRef.current = true;
      try {
        await boot();
        if (!cancelled && !dead) bootedRef.current = true;
      } finally {
        bootingRef.current = false;
      }
    };

    void run();

    return () => {
      cancelled = true;
      dead = true;
    };
  }, [active]);

  return (
    <div
      ref={hostRef}
      className={`absolute inset-0 z-[2] transition-opacity duration-150 ease-out ${
        active ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none select-none"
      }`}
      aria-hidden={!active}
    />
  );
});

export default CesiumRealMapLayer;
