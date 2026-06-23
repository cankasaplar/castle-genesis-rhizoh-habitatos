/**
 * SpiralMMO closed spiral map pin — dimensional collapse gate rings (v0 visual).
 */

import { deriveSpiralMMOContinentCubeMotionV0 } from "./spiralMMOContinentCubeMotionV0.js";
import { deriveSpiralMMOPinSixFortyFourMotionV0 } from "./spiralMMOPinCitizenshipV0.js";

const GATE_ORDER_COLOR_V0 = "#00ccff";

/**
 * @param {object} node
 * @returns {string}
 */
export function spiralMMOClosedSpiralPinHtmlV0(node) {
  const motion = deriveSpiralMMOContinentCubeMotionV0(node);
  const sixFortyFour = deriveSpiralMMOPinSixFortyFourMotionV0(node);
  const id = String(node?.id || `spiralmmo_${motion.continent}`);
  const size = 26;
  const cx = 50;
  const cy = 50;
  const accent = GATE_ORDER_COLOR_V0;
  const chaosHint = motion.accent;

  const ringSvg = sixFortyFour.ringDefs.map((ring) => {
    const from = ring.speed > 0 ? `${sixFortyFour.phaseOffsetDeg} 50 50` : `${360 + sixFortyFour.phaseOffsetDeg} 50 50`;
    const to = ring.speed > 0 ? `${360 + sixFortyFour.phaseOffsetDeg} 50 50` : `${sixFortyFour.phaseOffsetDeg} 50 50`;
    return `<circle cx="${cx}" cy="${cy}" r="${ring.r}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="${ring.dash}" opacity="0.88">
      <animateTransform attributeName="transform" type="rotate" from="${from}" to="${to}" dur="${ring.dur}" repeatCount="indefinite"/>
    </circle>`;
  }).join("");

  const label = String(node?.shortLabel || motion.continent.slice(0, 2).toUpperCase());

  return `<div data-rhizoh-spiral-mmo-pin="${id}" data-rhizoh-spiral-mmo-rev="dim-collapse-gate-v0" data-rhizoh-spiral-continent="${motion.continent}" data-rhizoh-spiral-644-cycle-sec="${sixFortyFour.cycleSec}" data-rhizoh-spiral-pin-ordinal="${sixFortyFour.ordinal}" style="width:${size}px;height:${size}px;transform:translate(-50%,-50%);cursor:pointer;pointer-events:auto">
    <div style="width:${size}px;height:${size}px;border-radius:50%;background:#030308;box-shadow:0 0 10px ${accent}66,0 0 6px ${chaosHint}44;display:flex;align-items:center;justify-content:center">
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true" style="border-radius:50%">
        ${ringSvg}
        <circle cx="${cx}" cy="${cy}" r="5" fill="#ffffff" opacity="0.92"/>
        <text x="${cx}" y="88" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Courier New,monospace" font-size="10">${label}</text>
      </svg>
    </div>
  </div>`;
}

export { RHIZOH_SPIRAL_MMO_PIN_VISUAL_V0 } from "./spiralMMOContinentPinsV0.js";
