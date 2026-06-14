/**
 * SpiralMMO continent anchors — one monochrome neon spiral pin per continent (v0 visual only).
 * Capabilities / gameplay wiring deferred.
 */

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
      color: "#ffffff",
      owner: "SpiralMMO",
      description:
        "Monochrome spiral continent node — capabilities and gameplay hooks ship in a later pass.",
      capabilities: Object.freeze([])
    });
  })
);

let spiralPinStylesInstalled = false;

/**
 * Archimedean whirlpool path — winds from outer ring toward center (v0 map glyph).
 * @param {number} cx
 * @param {number} cy
 * @param {{ turns?: number, outerR?: number, innerR?: number, stepDeg?: number }} [opts]
 */
export function buildSpiralMMOWhirlpoolPathV0(cx, cy, opts = {}) {
  const turns = opts.turns ?? 2.85;
  const outerR = opts.outerR ?? 11.5;
  const innerR = opts.innerR ?? 1.1;
  const stepDeg = opts.stepDeg ?? 7;
  const totalSteps = Math.max(12, Math.ceil((turns * 360) / stepDeg));
  const parts = [];
  for (let i = 0; i <= totalSteps; i += 1) {
    const t = i / totalSteps;
    const angle = ((270 - t * turns * 360) * Math.PI) / 180;
    const radius = outerR - (outerR - innerR) * t;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return parts.join("");
}

export function ensureSpiralMMOPinStylesV0() {
  if (spiralPinStylesInstalled || typeof document === "undefined") return;
  if (document.getElementById("rhizoh-spiral-mmo-pin-style-v0")) {
    spiralPinStylesInstalled = true;
    return;
  }
  const style = document.createElement("style");
  style.id = "rhizoh-spiral-mmo-pin-style-v0";
  style.textContent = `
@keyframes rhizohSpiralMMOInV0 {
  0% { transform: rotate(0deg) scale(1.04); opacity: 0.72; }
  100% { transform: rotate(-720deg) scale(0.78); opacity: 1; }
}
@keyframes rhizohSpiralMMOPulseV0 {
  0%, 100% { box-shadow: 0 0 7px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.28), inset 0 0 8px rgba(255,255,255,0.06); }
  50% { box-shadow: 0 0 11px rgba(255,255,255,1), 0 0 22px rgba(255,255,255,0.42), inset 0 0 12px rgba(255,255,255,0.1); }
}
`;
  document.head.appendChild(style);
  spiralPinStylesInstalled = true;
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listSpiralMMOContinentMapPinsV0() {
  return RHIZOH_SPIRAL_MMO_CONTINENT_PINS_V0;
}

/**
 * Black / white inward-spiral neon pin (Leaflet divIcon HTML).
 * @param {object} node
 */
export function spiralMMOPinIconHtmlV0(node) {
  ensureSpiralMMOPinStylesV0();
  const id = String(node?.id || "spiralmmo");
  const short = String(node?.shortLabel || node?.continent || "MMO").slice(0, 3).toUpperCase();
  const filterId = `spiral-glow-${id.replace(/[^a-z0-9_-]/gi, "")}`;
  const whirlpool = buildSpiralMMOWhirlpoolPathV0(15, 15);
  return `<div data-rhizoh-spiral-mmo-pin="${id}" data-rhizoh-sovereign-node="${id}" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto">
    <div style="width:38px;height:38px;border-radius:50%;background:#000;border:1.5px solid #fff;display:flex;align-items:center;justify-content:center;animation:rhizohSpiralMMOPulseV0 2.4s ease-in-out infinite;overflow:hidden">
      <svg width="28" height="28" viewBox="0 0 30 30" aria-hidden="true" style="animation:rhizohSpiralMMOInV0 3.2s linear infinite">
        <defs>
          <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.55" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g fill="none" stroke="#fff" stroke-width="1.35" stroke-linecap="round" filter="url(#${filterId})">
          <path d="${whirlpool}"/>
          <circle cx="15" cy="15" r="1.1" fill="#fff" stroke="none"/>
        </g>
      </svg>
    </div>
    <div style="color:#fff;font-size:7px;font-weight:900;margin-top:3px;letter-spacing:0.12em;text-shadow:0 0 5px #000,0 0 8px rgba(255,255,255,0.5);font-family:monospace">SPIRAL·${short}</div>
  </div>`;
}
