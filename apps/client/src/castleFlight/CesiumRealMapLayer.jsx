import React, { memo, useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { ISTANBUL_GEO, ISTANBUL_POI } from "./geo.js";
import { getCastleFlightConfig } from "./castleFlightConfig.js";
import { subscribeCastleDroneTelemetry } from "./telemetryHub.js";

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

function createFallbackImportantPlaces() {
  return Object.entries(ISTANBUL_POI).map(([id, p]) => ({
    id: `fallback-${id}`,
    lat: p.lat,
    lon: p.lon,
    name: p.label,
    tags: { tourism: "attraction" }
  }));
}

async function loadIstanbulImportantPlaces(limit = 350) {
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

async function loadIstanbulBuildingFootprints(limit = 900) {
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

const CesiumRealMapLayer = memo(({ active }) => {
  const hostRef = useRef(null);
  const viewerRef = useRef(null);
  const droneEntitiesRef = useRef(new Map());
  const importantEntitiesRef = useRef([]);
  const importantRowsRef = useRef([]);
  const fallbackBuildingEntitiesRef = useRef([]);
  const activeRef = useRef(active);
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

  useEffect(() => {
    activeRef.current = active;
    if (!active) return;
    const c = window.__CASTLE_CESIUM__;
    c?.enableStreetNavigation?.(true);
  }, [active]);

  useEffect(() => {
    let dead = false;
    const cfg = getCastleFlightConfig();

    const boot = async () => {
      if (!hostRef.current || viewerRef.current || dead) return;

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
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 12;
      viewer.scene.screenSpaceCameraController.enableTilt = true;
      viewer.scene.screenSpaceCameraController.enableLook = true;
      viewer.scene.screenSpaceCameraController.inertiaSpin = 0.82;
      viewer.scene.screenSpaceCameraController.inertiaTranslate = 0.82;
      viewer.scene.screenSpaceCameraController.inertiaZoom = 0.75;
      viewer.scene.requestRender();

      if (cfg.cesiumIonToken) {
        void Cesium.createWorldTerrainAsync()
          .then((terrain) => {
            if (dead || !viewerRef.current) return;
            viewer.terrainProvider = terrain;
            viewer.scene.requestRender();
          })
          .catch(() => {
            /* ignore */
          });
      }

      if (cfg.satelliteTileTemplate) {
        try {
          const provider = new Cesium.UrlTemplateImageryProvider({ url: cfg.satelliteTileTemplate });
          viewer.imageryLayers.removeAll(true);
          viewer.imageryLayers.addImageryProvider(provider);
        } catch {
          /* ignore */
        }
      }

      let hasOsmBuildings = false;
      try {
        const osm = await Cesium.createOsmBuildingsAsync();
        viewer.scene.primitives.add(osm);
        hasOsmBuildings = true;
      } catch {
        hasOsmBuildings = false;
      }

      const fatih = ISTANBUL_POI.FATIH;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(fatih.lon, fatih.lat, 3800),
        duration: 0
      });
      viewer.camera.setView({
        orientation: {
          heading: Cesium.Math.toRadians(18),
          pitch: Cesium.Math.toRadians(-42),
          roll: 0
        }
      });

      if (!hasOsmBuildings) {
        const footprints = await loadIstanbulBuildingFootprints();
        if (!dead && viewerRef.current && footprints.length > 0) {
          fallbackBuildingEntitiesRef.current = footprints.map((b, idx) => {
            const h = Number.isFinite(b.height) && b.height > 0 ? b.height : Math.max(18, b.levels * 3.2 || 28 + (idx % 6) * 8);
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

      const applyCategoryVisibility = () => {
        for (const row of importantEntitiesRef.current) {
          row.entity.show = !!categoryStateRef.current[row.category];
        }
      };

      const important = await loadIstanbulImportantPlaces();
      importantRowsRef.current = important.map((p) => ({ ...p, category: classifyCategory(p.tags) }));
      if (!dead && viewerRef.current) {
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

      window.__CASTLE_CESIUM__ = {
        ready: true,
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
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(fatih.lon, fatih.lat, 3400),
            duration: 1.2
          });
        },
        focusCastle() {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(fatih.lon, fatih.lat, 1200),
            duration: 1.1
          });
        },
        focusPOI(key) {
          const poi = ISTANBUL_POI[key];
          if (!poi) return;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(poi.lon, poi.lat, 1800),
            duration: 1.1
          });
        },
        enableStreetNavigation(enabled = true) {
          navStateRef.current.enabled = !!enabled;
        },
        streetView(lat = fatih.lat, lon = fatih.lon, height = 130) {
          navStateRef.current.enabled = true;
          viewer.camera.flyTo({
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

      viewer.selectedEntityChanged.addEventListener((entity) => {
        const meta = entity?.__castleMeta;
        if (!meta) return;
        window.__CASTLE_CESIUM__.selectedPoi = {
          ...meta,
          categoryLabel: CATEGORY_LABELS[meta.category] || meta.category,
          color: CATEGORY_COLORS[meta.category] || "#e5e7eb"
        };
      });
    };

    void boot();

    const unsub = subscribeCastleDroneTelemetry((p) => {
      const viewer = viewerRef.current;
      if (!viewer || !p || p.lat == null || p.lon == null) return;
      const id = String(p.id || "drone");
      const map = droneEntitiesRef.current;
      let ent = map.get(id);
      if (!ent) {
        ent = viewer.entities.add({
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

    const onKeyDown = (e) => {
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
    const onKeyUp = (e) => {
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

    const preRender = () => {
      const viewer = viewerRef.current;
      if (!viewer || !activeRef.current || !navStateRef.current.enabled) return;
      const keys = navStateRef.current.keys;
      const move = keys.boost ? 18 : 6;
      if (keys.forward) viewer.camera.moveForward(move);
      if (keys.back) viewer.camera.moveBackward(move);
      if (keys.left) viewer.camera.moveLeft(move);
      if (keys.right) viewer.camera.moveRight(move);
      if (keys.up) viewer.camera.moveUp(move);
      if (keys.down) viewer.camera.moveDown(move);
    };
    viewerRef.current?.scene.preRender.addEventListener(preRender);

    return () => {
      dead = true;
      unsub?.();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      viewerRef.current?.scene?.preRender?.removeEventListener(preRender);
      const v = viewerRef.current;
      if (v && !v.isDestroyed()) v.destroy();
      viewerRef.current = null;
      droneEntitiesRef.current.clear();
      importantEntitiesRef.current = [];
      fallbackBuildingEntitiesRef.current = [];
      if (window.__CASTLE_CESIUM__) delete window.__CASTLE_CESIUM__;
    };
  }, []);

  return <div ref={hostRef} className={`absolute inset-0 z-[2] ${active ? "block" : "hidden"}`} />;
});

export default CesiumRealMapLayer;
