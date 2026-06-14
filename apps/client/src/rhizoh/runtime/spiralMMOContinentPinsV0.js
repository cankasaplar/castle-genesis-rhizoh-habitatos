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
  0% { transform: rotate(0deg) scale(1.12); opacity: 0.65; }
  100% { transform: rotate(-540deg) scale(0.68); opacity: 1; }
}
@keyframes rhizohSpiralMMOPulseV0 {
  0%, 100% { box-shadow: 0 0 10px rgba(255,255,255,0.95), 0 0 22px rgba(255,255,255,0.35), inset 0 0 12px rgba(255,255,255,0.08); }
  50% { box-shadow: 0 0 16px rgba(255,255,255,1), 0 0 32px rgba(255,255,255,0.5), inset 0 0 18px rgba(255,255,255,0.14); }
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
  return `<div data-rhizoh-spiral-mmo-pin="${id}" data-rhizoh-sovereign-node="${id}" style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto">
    <div style="width:46px;height:46px;border-radius:50%;background:#000;border:2px solid #fff;display:flex;align-items:center;justify-content:center;animation:rhizohSpiralMMOPulseV0 2.4s ease-in-out infinite;overflow:hidden">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" style="animation:rhizohSpiralMMOInV0 2.8s ease-in-out infinite alternate">
        <defs>
          <filter id="${filterId}" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.8" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" filter="url(#${filterId})">
          <path d="M17 17 L17 5 A12 12 0 0 1 29 17 A9 9 0 0 1 20 26 A6 6 0 0 1 14 20 A3.5 3.5 0 0 1 17 17"/>
          <circle cx="17" cy="17" r="1.6" fill="#fff" stroke="none"/>
        </g>
      </svg>
    </div>
    <div style="color:#fff;font-size:8px;font-weight:900;margin-top:4px;letter-spacing:0.14em;text-shadow:0 0 6px #000,0 0 10px rgba(255,255,255,0.55);font-family:monospace">SPIRAL·${short}</div>
  </div>`;
}
