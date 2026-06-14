/**
 * Per-continent SpiralMMO portal cube faces (visual only — RESEARCH-ONLY).
 */

import { SPIRAL_MMO_CONTINENT_IDS_V0 } from "./spiralMMOContinentPinsV0.js";

/** @typedef {{ id: string, accent: string, code: string, glyph: string, motif: string, motifTr: string }} SpiralMMOContinentCubeV0 */

/** @type {Record<string, SpiralMMOContinentCubeV0>} */
const CUBE_BY_CONTINENT_V0 = Object.freeze({
  africa: Object.freeze({
    id: "africa",
    accent: "#ff8800",
    code: "AF",
    glyph: "☀",
    motif: "savanna pulse",
    motifTr: "savana nabzı"
  }),
  antarctica: Object.freeze({
    id: "antarctica",
    accent: "#a5f3fc",
    code: "AN",
    glyph: "❄",
    motif: "ice silence",
    motifTr: "buz sessizliği"
  }),
  asia: Object.freeze({
    id: "asia",
    accent: "#f472b6",
    code: "AS",
    glyph: "⛩",
    motif: "monsoon arc",
    motifTr: "muson arkı"
  }),
  europe: Object.freeze({
    id: "europe",
    accent: "#60a5fa",
    code: "EU",
    glyph: "⚜",
    motif: "old world grid",
    motifTr: "eski dünya ızgarası"
  }),
  north_america: Object.freeze({
    id: "north_america",
    accent: "#34d399",
    code: "NA",
    glyph: "🦅",
    motif: "prairie signal",
    motifTr: "preri sinyali"
  }),
  south_america: Object.freeze({
    id: "south_america",
    accent: "#fbbf24",
    code: "SA",
    glyph: "🌿",
    motif: "rainforest coil",
    motifTr: "yağmur ormanı spiralı"
  }),
  oceania: Object.freeze({
    id: "oceania",
    accent: "#2dd4bf",
    code: "OC",
    glyph: "🌊",
    motif: "reef tide",
    motifTr: "resif gelgiti"
  })
});

/**
 * @param {string} continentOrNodeId
 * @returns {SpiralMMOContinentCubeV0}
 */
export function resolveSpiralMMOContinentCubeV0(continentOrNodeId) {
  const raw = String(continentOrNodeId || "").trim();
  const continent = raw.startsWith("spiralmmo_") ? raw.slice("spiralmmo_".length) : raw;
  return CUBE_BY_CONTINENT_V0[continent] || CUBE_BY_CONTINENT_V0.europe;
}

export function listSpiralMMOContinentCubeIdsV0() {
  return SPIRAL_MMO_CONTINENT_IDS_V0.map((id) => CUBE_BY_CONTINENT_V0[id]?.id || id);
}
