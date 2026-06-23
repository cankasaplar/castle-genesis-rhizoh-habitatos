/**
 * LLM tower map viewport — world-wide fit for all provider towers on Leaflet.
 * SPECFLOW: CORE-ELIGIBLE (map diagnostic + viewport; frozen core untouched)
 */

import {
  SOVEREIGN_TOWERS_V0,
  SOVEREIGN_RHIZOH_PORTAL_V0,
  buildSovereignTowerGraphEdgesV0
} from "./sovereignWorldMapNodesV0.js";
import { resolveRhizohTowerProviderV0 } from "./rhizohTowerProviderRegistryV0.js";
import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";

export const RHIZOH_LLM_TOWER_FIT_EVENT_V0 = "rhizoh:llm-tower-fit-v0";
export const RHIZOH_SPIRAL_SATELLITE_FIT_EVENT_V0 = "rhizoh:spiral-satellite-fit-v0";
export const LLM_TOWER_MAP_REGISTRY_SCHEMA_V0 = "rhizoh.llm_tower_map_registry.v0";

/** World-zoom fan — keeps all 7 labels readable (true coords unchanged for warp). */
export const LLM_TOWER_WORLD_FAN_OFFSETS_V0 = Object.freeze({
  gemini_tower: Object.freeze({ dLat: 3, dLon: -5 }),
  claude_tower: Object.freeze({ dLat: 6, dLon: 1 }),
  chatgpt_tower: Object.freeze({ dLat: -1, dLon: 6 }),
  deepmind_tower: Object.freeze({ dLat: 4, dLon: -4 }),
  mistral_tower: Object.freeze({ dLat: -2, dLon: 5 }),
  kyoto_tower: Object.freeze({ dLat: 0, dLon: 0 }),
  sora_tower: Object.freeze({ dLat: -5, dLon: -7 })
});

/**
 * @returns {ReadonlyArray<object>}
 */
export function listLlmTowerMapNodesV0() {
  return SOVEREIGN_TOWERS_V0;
}

/**
 * Spread tower pins at low zoom so SF/EU clusters do not stack (display only).
 * @param {object} node
 * @param {number} [mapZoom]
 */
export function resolveLlmTowerMarkerCoordsV0(node, mapZoom = 14) {
  const lat = Number(node?.lat);
  const lon = Number(node?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Object.freeze({ lat: 0, lon: 0 });
  }
  if (String(node?.type || "") !== "tower") {
    return Object.freeze({ lat, lon });
  }
  const zoom = Number(mapZoom);
  if (Number.isFinite(zoom) && zoom > 5) {
    return Object.freeze({ lat, lon });
  }
  const off = LLM_TOWER_WORLD_FAN_OFFSETS_V0[String(node.id || "")];
  if (!off) return Object.freeze({ lat, lon });
  return Object.freeze({ lat: lat + off.dLat, lon: lon + off.dLon });
}

/**
 * SpiralMMO continent pins for satellite viewport fit.
 * @returns {readonly object[]}
 */
export function resolveSpiralSatelliteViewportFitNodesV0() {
  return listSpiralMMOContinentMapPinsV0();
}

/**
 * Nodes for world-wide fitBounds — all LLM towers + Rhizoh portal.
 * @param {{ includePortal?: boolean }} [opts]
 * @returns {readonly object[]}
 */
export function resolveLlmTowerViewportFitNodesV0(opts = {}) {
  const includePortal = opts.includePortal !== false;
  /** @type {object[]} */
  const nodes = [...SOVEREIGN_TOWERS_V0];
  if (includePortal) nodes.push(SOVEREIGN_RHIZOH_PORTAL_V0);
  return Object.freeze(
    nodes.filter((n) => Number.isFinite(Number(n.lat)) && Number.isFinite(Number(n.lon)))
  );
}

/**
 * LLM provider tower registry for diagnostics / system report.
 */
export function buildLlmTowerMapRegistrySnapshotV0() {
  return Object.freeze({
    schema: LLM_TOWER_MAP_REGISTRY_SCHEMA_V0,
    count: SOVEREIGN_TOWERS_V0.length,
    portalId: SOVEREIGN_RHIZOH_PORTAL_V0.id,
    towerLabels: Object.freeze(SOVEREIGN_TOWERS_V0.map((t) => String(t.label || t.id))),
    towers: Object.freeze(
      SOVEREIGN_TOWERS_V0.map((tower) => {
        const provider = resolveRhizohTowerProviderV0(tower.id);
        return Object.freeze({
          id: tower.id,
          label: tower.label,
          name: tower.name,
          provider: provider.provider,
          model: provider.model,
          lat: tower.lat,
          lon: tower.lon,
          color: tower.color
        });
      })
    )
  });
}

/**
 * @param {string} [source]
 * @returns {boolean}
 */
export function requestFitLlmTowersOnMapV0(source = "console") {
  if (typeof window === "undefined") return false;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_LLM_TOWER_FIT_EVENT_V0, {
      detail: Object.freeze({
        source: String(source || "console"),
        nodes: resolveLlmTowerViewportFitNodesV0()
      })
    })
  );
  return true;
}

/**
 * Switch viewport to SpiralMMO satellite layer (Uydu) pin set.
 * @param {string} [source]
 */
export function requestFitSpiralSatelliteMapV0(source = "console") {
  if (typeof window === "undefined") return false;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_SPIRAL_SATELLITE_FIT_EVENT_V0, {
      detail: Object.freeze({
        source: String(source || "console"),
        nodes: resolveSpiralSatelliteViewportFitNodesV0()
      })
    })
  );
  return true;
}

/**
 * Voice / chat: "tüm kuleler", "all towers", …
 * @param {string} text
 * @param {{ source?: string, tr?: boolean }} [opts]
 */
export function tryExecuteLlmTowerFitFromTextV0(text = "", opts = {}) {
  const normalized = String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (!normalized) return null;
  const towerHit =
    /\b(tum kuleler|tum llm|butun kuleler|kuleleri goster|llm kuleleri|kule agi)\b/.test(
      normalized
    ) || /\b(all towers|show towers|llm towers|every tower|tower mesh)\b/.test(normalized);
  if (towerHit) {
    requestFitLlmTowersOnMapV0(opts.source || "voice_command");
    const tr = opts.tr !== false;
    return Object.freeze({
      ok: true,
      kind: "LLM_TOWER_FIT",
      reply: tr
        ? "Tüm LLM kulelerini haritada gösteriyorum."
        : "Showing all LLM towers on the map."
    });
  }

  const spiralHit =
    /\b(uydu|spiralmmo|spiral mmo|uydu haritasi|satellite map)\b/.test(normalized) ||
    /\b(spiral satellite|spiral map)\b/.test(normalized);
  if (spiralHit) {
    requestFitSpiralSatelliteMapV0(opts.source || "voice_command");
    const tr = opts.tr !== false;
    return Object.freeze({
      ok: true,
      kind: "SPIRAL_SATELLITE_FIT",
      reply: tr
        ? "SpiralMMO uydu haritasına geçiyorum."
        : "Switching to SpiralMMO satellite map."
    });
  }

  return null;
}

/**
 * @param {typeof import('leaflet')} L
 * @param {import('leaflet').LayerGroup | null | undefined} layerGroup
 * @param {Map<string, { lat: number, lon: number }>} nodeById
 */
export function drawLlmTowerGraphPolylinesV0(L, layerGroup, nodeById) {
  if (!L?.polyline || !layerGroup?.clearLayers) return;
  try {
    layerGroup.clearLayers();
  } catch {
    /* noop */
  }
  for (const edge of buildSovereignTowerGraphEdgesV0()) {
    const n1 = nodeById.get(edge.source);
    const n2 = nodeById.get(edge.target);
    if (!n1 || !n2) continue;
    L.polyline(
      [
        [n1.lat, n1.lon],
        [n2.lat, n2.lon]
      ],
      {
        color: "rgba(6,182,212,0.38)",
        weight: 1.4,
        dashArray: "5 7",
        opacity: 0.85
      }
    ).addTo(layerGroup);
  }
}

let consoleMountedV0 = false;

export function mountLlmTowerMapConsoleV0() {
  if (typeof window === "undefined" || consoleMountedV0) return;
  consoleMountedV0 = true;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.listLlmTowers = () => {
    const snap = buildLlmTowerMapRegistrySnapshotV0();
    try {
      if (typeof console !== "undefined" && console.table) {
        console.table(
          snap.towers.map((t) => ({
            label: t.label,
            id: t.id,
            provider: t.provider,
            lat: t.lat,
            lon: t.lon
          }))
        );
      }
    } catch {
      /* noop */
    }
    return snap;
  };
  window.__rhizoh.fitAllLlmTowers = (source) => requestFitLlmTowersOnMapV0(source || "console");
  window.__rhizoh.fitSpiralSatellite = (source) =>
    requestFitSpiralSatelliteMapV0(source || "console");
}
