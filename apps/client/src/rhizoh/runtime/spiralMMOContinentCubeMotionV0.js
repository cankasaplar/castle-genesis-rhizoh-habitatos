/**
 * Continent cube motion — WGS84 surface-speed proxy (Earth rotation · RESEARCH-ONLY visual).
 * @see docs/RHIZOH_CUBE_FIELD_V0.md
 */

const SPIRAL_MMO_CONTINENT_IDS_LOCAL_V0 = Object.freeze([
  "africa",
  "antarctica",
  "asia",
  "europe",
  "north_america",
  "south_america",
  "oceania"
]);
export const SPIRAL_MMO_SIDEREAL_DAY_SEC_V0 = 86_164;

/** Pin cube visual duration bounds (seconds per revolution). */
export const SPIRAL_MMO_CUBE_PERIOD_MIN_SEC_V0 = 8.4;
export const SPIRAL_MMO_CUBE_PERIOD_MAX_SEC_V0 = 26.8;

const CONTINENT_COORDS_V0 = Object.freeze({
  africa: { lat: 1.5, lon: 18 },
  antarctica: { lat: -78, lon: 0 },
  asia: { lat: 45, lon: 95 },
  europe: { lat: 50, lon: 15 },
  north_america: { lat: 48, lon: -102 },
  south_america: { lat: -15, lon: -58 },
  oceania: { lat: -25, lon: 135 }
});

/** Neon yellow-orange family (kanagawa-wave-cube.svg edgeGlow). */
const CONTINENT_ACCENT_V0 = Object.freeze({
  africa: "#ffcc00",
  antarctica: "#ffe566",
  asia: "#ffb347",
  europe: "#ffd700",
  north_america: "#ffaa00",
  south_america: "#ffc933",
  oceania: "#ffdb4d"
});

/**
 * @param {number} lat
 * @returns {number}
 */
export function resolveEarthSurfaceSpeedRatioV0(lat) {
  const latRad = (Number(lat) * Math.PI) / 180;
  return Math.max(0.12, Math.cos(latRad));
}

/**
 * @param {number} speedRatio
 * @returns {number}
 */
export function resolveSpiralMMOCubePeriodSecV0(speedRatio) {
  const s = Math.max(0.12, Math.min(1, Number(speedRatio) || 0.12));
  const span = SPIRAL_MMO_CUBE_PERIOD_MAX_SEC_V0 - SPIRAL_MMO_CUBE_PERIOD_MIN_SEC_V0;
  return SPIRAL_MMO_CUBE_PERIOD_MIN_SEC_V0 + span * (1 - s);
}

/**
 * @param {string} continentOrNodeId
 * @returns {string}
 */
export function resolveSpiralMMOContinentIdV0(continentOrNodeId) {
  const raw = String(continentOrNodeId || "").trim();
  const id = raw.startsWith("spiralmmo_") ? raw.slice("spiralmmo_".length) : raw;
  return SPIRAL_MMO_CONTINENT_IDS_LOCAL_V0.includes(id) ? id : "europe";
}

/**
 * @param {{ continent?: string, lat?: number, lon?: number, id?: string }} node
 */
export function deriveSpiralMMOContinentCubeMotionV0(node = {}) {
  const continent = resolveSpiralMMOContinentIdV0(node.continent || node.id || "europe");
  const coords = CONTINENT_COORDS_V0[continent] || CONTINENT_COORDS_V0.europe;
  const lat = Number.isFinite(node.lat) ? node.lat : coords.lat;
  const lon = Number.isFinite(node.lon) ? node.lon : coords.lon;
  const speedRatio = resolveEarthSurfaceSpeedRatioV0(lat);
  const periodSec = resolveSpiralMMOCubePeriodSecV0(speedRatio);
  const direction = lat < 0 ? -1 : 1;
  const tiltX = -18 + (Math.min(90, Math.abs(lat)) / 90) * 12;
  const phaseDeg = (((lon + 180) / 360) * 360) % 360;
  const accent = CONTINENT_ACCENT_V0[continent] || "#ffcc00";

  return Object.freeze({
    schema: "rhizoh.spiral_mmo_continent_cube_motion.v0",
    continent,
    lat,
    lon,
    speedRatio,
    periodSec: Number(periodSec.toFixed(2)),
    direction,
    tiltX: Number(tiltX.toFixed(2)),
    phaseDeg: Number(phaseDeg.toFixed(2)),
    accent,
    edge: accent,
    faceFill: "#0a0a0a",
    siderealScale: Number((periodSec / (SPIRAL_MMO_SIDEREAL_DAY_SEC_V0 / 3600)).toFixed(4))
  });
}
