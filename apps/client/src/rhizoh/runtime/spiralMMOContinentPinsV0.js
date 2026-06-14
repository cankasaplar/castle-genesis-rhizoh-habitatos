/**
 * SpiralMMO continent anchors — kanagawa mini-cube map pins (v0 visual only).
 */

import { spiralMMOKanagawaPinCubeHtmlV0 } from "./spiralMMOKanagawaPinCubeV0.js";

export const RHIZOH_SPIRAL_MMO_CONTINENT_PIN_SCHEMA_V0 = "rhizoh.spiral_mmo_continent_pin.v0";

/** @typedef {'africa'|'antarctica'|'asia'|'europe'|'north_america'|'south_america'|'oceania'} SpiralMMOContinentIdV0 */

export const SPIRAL_MMO_CONTINENT_IDS_V0 = Object.freeze([
  "africa",
  "antarctica",
  "asia",
  "europe",
  "north_america",
  "south_america",
  "oceania"
]);

const CONTINENT_META_V0 = Object.freeze({
  africa: Object.freeze({ label: "AF", nameTr: "Afrika", nameEn: "Africa" }),
  antarctica: Object.freeze({ label: "AN", nameTr: "Antarktika", nameEn: "Antarctica" }),
  asia: Object.freeze({ label: "AS", nameTr: "Asya", nameEn: "Asia" }),
  europe: Object.freeze({ label: "EU", nameTr: "Avrupa", nameEn: "Europe" }),
  north_america: Object.freeze({ label: "NA", nameTr: "Kuzey Amerika", nameEn: "North America" }),
  south_america: Object.freeze({ label: "SA", nameTr: "Güney Amerika", nameEn: "South America" }),
  oceania: Object.freeze({ label: "OC", nameTr: "Okyanusya", nameEn: "Oceania" })
});

/** WGS84 anchors — continental interior (not capital cities). */
export const RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0 = Object.freeze(
  SPIRAL_MMO_CONTINENT_IDS_V0.map((continent) => {
    const meta = CONTINENT_META_V0[continent];
    const coords = {
      africa: { lat: 1.5, lon: 18 },
      antarctica: { lat: -78, lon: 0 },
      asia: { lat: 45, lon: 95 },
      europe: { lat: 50, lon: 15 },
      north_america: { lat: 48, lon: -102 },
      south_america: { lat: -15, lon: -58 },
      oceania: { lat: -25, lon: 135 }
    }[continent];
    return Object.freeze({
      id: `spiralmmo_${continent}`,
      name: `SpiralMMO · ${meta.nameEn}`,
      label: "SPIRAL",
      shortLabel: meta.label,
      type: "spiralmmo",
      continent,
      lat: coords.lat,
      lon: coords.lon,
      color: "#ffcc00",
      owner: "SpiralMMO",
      description: "",
      capabilities: Object.freeze([])
    });
  })
);

export const RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0 = Object.freeze({
  sizePx: 26,
  spiralTurns: 3.25,
  spiralOuterRadius: 16.85,
  spiralInnerRadius: 0.55
});

/**
 * Logarithmic whirlpool path — shared math helper (tests + cube field research).
 */
export function buildSpiralMMOWhirlpoolPathV0(cx, cy, opts = {}) {
  const turns = opts.turns ?? RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0.spiralTurns;
  const outerR = opts.outerR ?? RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0.spiralOuterRadius;
  const innerR = opts.innerR ?? RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0.spiralInnerRadius;
  const startAngleDeg = opts.startAngleDeg ?? 0;
  const stepDeg = opts.stepDeg ?? 5.5;
  const totalSteps = Math.max(20, Math.ceil((turns * 360) / stepDeg));
  const parts = [];
  for (let i = 0; i <= totalSteps; i += 1) {
    const t = i / totalSteps;
    const angle = ((startAngleDeg - t * turns * 360) * Math.PI) / 180;
    const radius = outerR * (innerR / outerR) ** t;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return parts.join("");
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listSpiralMMOContinentMapPinsV0() {
  return RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0;
}

/**
 * @param {string} continentOrNodeId
 * @param {"tr"|"en"} [locale]
 * @returns {string}
 */
export function resolveSpiralMMOContinentDisplayNameV0(continentOrNodeId, locale = "en") {
  const raw = String(continentOrNodeId || "").trim();
  const continent = raw.startsWith("spiralmmo_") ? raw.slice("spiralmmo_".length) : raw;
  const meta = CONTINENT_META_V0[continent];
  if (!meta) return raw || "SpiralMMO";
  return locale === "tr" ? meta.nameTr : meta.nameEn;
}

/**
 * Kanagawa-style mini 3D cube pin (no label text).
 * @param {object} node
 */
export function spiralMMOPinIconHtmlV0(node) {
  return spiralMMOKanagawaPinCubeHtmlV0(node);
}
