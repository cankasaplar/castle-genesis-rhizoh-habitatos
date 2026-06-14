/**
 * SpiralMMO closed spiral map pin — dormant portal rings (v0 visual).
 */

import { RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0 } from "./spiralMMOContinentPinsV0.js";
import { deriveSpiralMMOContinentCubeMotionV0 } from "./spiralMMOContinentCubeMotionV0.js";

/**
 * @param {object} node
 * @returns {string}
 */
export function spiralMMOClosedSpiralPinHtmlV0(node) {
  const motion = deriveSpiralMMOContinentCubeMotionV0(node);
  const id = String(node?.id || `spiralmmo_${motion.continent}`);
  const size = 24;
  const cx = 50;
  const cy = 50;

  const rings = [
    { r: 42, dash: "180 40", dur: "4s", dir: "1" },
    { r: 28, dash: "90 30", dur: "2.5s", dir: "-1" },
    { r: 14, dash: "40 15", dur: "1.5s", dir: "1" }
  ];

  const ringSvg = rings
    .map((ring) => {
      const from = ring.dir === "1" ? "0 50 50" : "360 50 50";
      const to = ring.dir === "1" ? "360 50 50" : "0 50 50";
      return `<circle cx="${cx}" cy="${cy}" r="${ring.r}" fill="none" stroke="${motion.accent}" stroke-width="5" stroke-dasharray="${ring.dash}" opacity="0.92">
        <animateTransform attributeName="transform" type="rotate" from="${from}" to="${to}" dur="${ring.dur}" repeatCount="indefinite"/>
      </circle>`;
    })
    .join("");

  return `<div data-rhizoh-spiral-mmo-pin="${id}" data-rhizoh-spiral-mmo-rev="closed-spiral-v0" data-rhizoh-spiral-continent="${motion.continent}" style="width:${size}px;height:${size}px;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto">
    <div style="width:${size}px;height:${size}px;border-radius:50%;background:#000;box-shadow:0 0 8px ${motion.accent}88,0 0 14px rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center">
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" style="border-radius:50%">
        ${ringSvg}
        <circle cx="${cx}" cy="${cy}" r="5" fill="${motion.accent}" opacity="0.95"/>
      </svg>
    </div>
  </div>`;
}

/**
 * Whirlpool path helper re-export for tests.
 */
export { RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0 };
