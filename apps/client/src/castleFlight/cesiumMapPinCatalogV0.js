/**
 * Visual pin catalog — ported from archive rhizoh-hyper-kernel-v4-0-visual-pin + v15-6-2.
 * @see docs/archive/map-demos/rhizoh-hyper-kernel-v4-0-visual-pin/App.jsx
 */

export const CESIUM_MAP_PIN_CATALOG_SCHEMA_V0 = "castle.cesium_map_pin_catalog.v0";

/** Lucide-style SVG path `d` (viewBox 0 0 24 24). */
export const CESIUM_MAP_PIN_TYPES_V0 = Object.freeze({
  core_beacon: Object.freeze({
    id: "core_beacon",
    color: "#06b6d4",
    label: "CORE BEACON",
    pathD:
      "M2 20h20 M5 20v-9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v9 M9 20v-4h6v4 M6 10V4l6 3 6-3v6",
    pulse: false
  }),
  my_castle: Object.freeze({
    id: "my_castle",
    color: "#a855f7",
    label: "MY CASTLE",
    pathD:
      "M2 20h20 M5 20v-9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v9 M9 20v-4h6v4 M6 10V4l6 3 6-3v6",
    pulse: false
  }),
  user_anchor: Object.freeze({
    id: "user_anchor",
    color: "#22d3ee",
    label: "CASTLE",
    pathD:
      "M2 20h20 M5 20v-9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v9 M9 20v-4h6v4 M6 10V4l6 3 6-3v6",
    pulse: false
  }),
  ghost: Object.freeze({
    id: "ghost",
    color: "#ef4444",
    label: "GHOST CASTLE",
    pathD:
      "M9 10h.01 M15 10h.01 M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z",
    pulse: true
  }),
  witness: Object.freeze({
    id: "witness",
    color: "#34d399",
    label: "WITNESS",
    pathD: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    pulse: false
  }),
  event: Object.freeze({
    id: "event",
    color: "#a855f7",
    label: "EVENT",
    pathD:
      "M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z",
    pulse: false
  }),
  library: Object.freeze({
    id: "library",
    color: "#eab308",
    label: "VAULT",
    pathD: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20",
    pulse: false
  }),
  academy: Object.freeze({
    id: "academy",
    color: "#FFB300",
    label: "ACADEMY",
    pathD:
      "M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5",
    pulse: false
  }),
  culture: Object.freeze({
    id: "culture",
    color: "#FF1744",
    label: "CULTURE",
    pathD:
      "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9 M12 3v9 M12 12l4.5 4.5",
    pulse: false
  }),
  traffic: Object.freeze({
    id: "traffic",
    color: "#f97316",
    label: "TRAFFIC",
    pathD: "M9 17H7A5 5 0 0 1 7 7h2 M15 7h2a5 5 0 1 1 0 10h-2 M8 12h8",
    pulse: false
  }),
  weather: Object.freeze({
    id: "weather",
    color: "#38bdf8",
    label: "WEATHER",
    pathD:
      "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z M16 14v6 M19 17h-6",
    pulse: false
  }),
  poi: Object.freeze({
    id: "poi",
    color: "#94a3b8",
    label: "POI",
    pathD: "M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83",
    pulse: false
  })
});

const ECOSYSTEM_CATEGORY_PIN_V0 = Object.freeze({
  academy: "academy",
  sound_stage: "event",
  culture_portal: "culture",
  resonance_hub: "library"
});

/**
 * @param {string} category
 * @returns {keyof typeof CESIUM_MAP_PIN_TYPES_V0}
 */
export function resolvePinTypeForEcosystemCategoryV0(category) {
  return ECOSYSTEM_CATEGORY_PIN_V0[String(category || "")] || "poi";
}

/**
 * @param {string} pinType
 */
export function getCesiumMapPinSpecV0(pinType) {
  return CESIUM_MAP_PIN_TYPES_V0[String(pinType || "poi")] || CESIUM_MAP_PIN_TYPES_V0.poi;
}
