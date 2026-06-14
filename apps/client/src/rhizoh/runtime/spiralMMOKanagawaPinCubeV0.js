/**
 * Kanagawa-wave-cube.svg derived mini 3D pin cubes (CSS preserve-3d · no PNG).
 */

import { deriveSpiralMMOContinentCubeMotionV0 } from "./spiralMMOContinentCubeMotionV0.js";

const KANAGAWA_WAVE_PATHS_V0 = Object.freeze([
  "M0.08,0.82 C0.28,0.68 0.42,0.74 0.62,0.58 C0.76,0.46 0.86,0.52 0.98,0.36",
  "M0.04,0.9 C0.24,0.76 0.42,0.84 0.66,0.7 C0.8,0.6 0.9,0.68 1,0.5",
  "M0.14,0.94 C0.34,0.82 0.52,0.9 0.76,0.76 C0.88,0.68 0.94,0.76 1,0.58"
]);

let pinCubeStylesInstalled = false;

const KANAGAWA_CUBE_CONTINENTS_V0 = Object.freeze([
  "africa",
  "antarctica",
  "asia",
  "europe",
  "north_america",
  "south_america",
  "oceania"
]);

export function ensureSpiralMMOKanagawaPinCubeStylesV0() {
  if (pinCubeStylesInstalled || typeof document === "undefined") return;
  const motions = KANAGAWA_CUBE_CONTINENTS_V0.map((continent) =>
    deriveSpiralMMOContinentCubeMotionV0({ continent })
  );
  const style = document.createElement("style");
  style.id = "rhizoh-spiral-mmo-kanagawa-cube-style-v0";
  const blocks = motions.map((m) => {
    const key = m.continent.replace(/[^a-z0-9]/gi, "");
    const fromY = m.phaseDeg;
    const toY = m.phaseDeg + 360 * m.direction;
    return `
@keyframes rhizohKanagawaCube${key}V0 {
  from { transform: rotateX(${m.tiltX}deg) rotateY(${fromY}deg); }
  to { transform: rotateX(${m.tiltX}deg) rotateY(${toY}deg); }
}`;
  });
  style.textContent = blocks.join("\n");
  document.head.appendChild(style);
  pinCubeStylesInstalled = true;
}

/**
 * @param {string} accent
 * @param {string} paths
 */
function miniWaveSvgV0(accent, paths) {
  return `<svg width="100%" height="100%" viewBox="0 0 1 1" aria-hidden="true">${paths
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${accent}" stroke-width="0.08" stroke-linecap="round"/>`
    )
    .join("")}</svg>`;
}

/**
 * @param {string} accent
 */
function miniSealSvgV0(accent) {
  return `<svg width="100%" height="100%" viewBox="0 0 1 1" aria-hidden="true">
    <circle cx="0.5" cy="0.5" r="0.32" fill="none" stroke="${accent}" stroke-width="0.06" opacity="0.9"/>
    <circle cx="0.5" cy="0.5" r="0.2" fill="none" stroke="${accent}" stroke-width="0.04" opacity="0.55"/>
    <text x="0.5" y="0.54" text-anchor="middle" fill="${accent}" font-family="Consolas,monospace" font-size="0.22">6</text>
  </svg>`;
}

/**
 * @param {object} node
 * @returns {string}
 */
export function spiralMMOKanagawaPinCubeHtmlV0(node) {
  const motion = deriveSpiralMMOContinentCubeMotionV0(node);
  ensureSpiralMMOKanagawaPinCubeStylesV0();

  const id = String(node?.id || `spiralmmo_${motion.continent}`);
  const safeKey = motion.continent.replace(/[^a-z0-9]/gi, "");
  const size = 26;
  const half = size / 2;
  const wave = miniWaveSvgV0(motion.accent, KANAGAWA_WAVE_PATHS_V0);
  const seal = miniSealSvgV0(motion.accent);

  const face = (transform, inner) =>
    `<div style="position:absolute;width:${size}px;height:${size}px;background:rgba(10,10,10,0.94);border:1px solid ${motion.edge};box-shadow:0 0 8px ${motion.accent}88;display:flex;align-items:center;justify-content:center;backface-visibility:hidden;transform:${transform};overflow:hidden">${inner}</div>`;

  return `<div data-rhizoh-spiral-mmo-pin="${id}" data-rhizoh-spiral-mmo-rev="kanagawa-cube-v0" data-rhizoh-sovereign-node="${id}" data-rhizoh-spiral-continent="${motion.continent}" style="width:${size}px;height:${size}px;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto;filter:drop-shadow(0 0 6px ${motion.accent}) drop-shadow(0 0 14px ${motion.accent}44)">
    <div style="width:${size}px;height:${size}px;perspective:140px">
      <div style="position:relative;width:${size}px;height:${size}px;transform-style:preserve-3d;animation:rhizohKanagawaCube${safeKey}V0 ${motion.periodSec}s linear infinite">
        ${face(`translateZ(${half}px)`, wave)}
        ${face(`rotateY(180deg) translateZ(${half}px)`, seal)}
        ${face(`rotateY(90deg) translateZ(${half}px)`, `<span style="color:${motion.accent};font:bold 7px/1 monospace;text-shadow:0 0 4px ${motion.accent}">44</span>`)}
        ${face(`rotateY(-90deg) translateZ(${half}px)`, `<span style="color:${motion.accent};font:bold 6px/1 monospace;opacity:0.85">θπ</span>`)}
        ${face(`rotateX(90deg) translateZ(${half}px)`, `<span style="color:${motion.accent};font:bold 7px/1 monospace;text-shadow:0 0 5px ${motion.accent}">0644</span>`)}
        ${face(`rotateX(-90deg) translateZ(${half}px)`, wave)}
      </div>
    </div>
  </div>`;
}
