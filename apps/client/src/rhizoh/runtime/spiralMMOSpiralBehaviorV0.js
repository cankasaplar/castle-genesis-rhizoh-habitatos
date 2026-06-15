/**
 * SpiralMMO per-continent spiral behavior — unique dual flow + transition profile (v0 visual).
 */

import { SPIRAL_MMO_CONTINENT_IDS_V0 } from "./spiralMMOContinentPinsV0.js";

/** @typedef {'forward'|'reverse'} SpiralMMODualLeadV0 */

/**
 * @param {string} continent
 * @param {number} epoch
 */
export function resolveSpiralMMOBehaviorProfileV0(continent, epoch = 0) {
  const id = SPIRAL_MMO_CONTINENT_IDS_V0.includes(continent) ? continent : "europe";
  const ep = Math.max(0, Number(epoch) || 0);

  /** @type {Record<string, object>} */
  const presets = {
    africa: {
      dualLead: "forward",
      routeRotate: 0,
      depthLayerOrder: [0, 1, 2],
      staggerScale: 1,
      waveAmplitude: 4,
      gapPolarity: 1,
      transitionEase: "cubic-bezier(0.42, 0, 0.22, 1)",
      colorWaveOffset: 0
    },
    antarctica: {
      dualLead: "reverse",
      routeRotate: 2,
      depthLayerOrder: [2, 1, 0],
      staggerScale: 1.12,
      waveAmplitude: 3,
      gapPolarity: -1,
      transitionEase: "cubic-bezier(0.55, 0.03, 0.25, 0.99)",
      colorWaveOffset: 2
    },
    asia: {
      dualLead: "forward",
      routeRotate: 1,
      depthLayerOrder: [1, 0, 2],
      staggerScale: 0.9,
      waveAmplitude: 6,
      gapPolarity: 1,
      transitionEase: "cubic-bezier(0.33, 0, 0.2, 1)",
      colorWaveOffset: 4
    },
    europe: {
      dualLead: "reverse",
      routeRotate: 0,
      depthLayerOrder: [0, 2, 1],
      staggerScale: 0.95,
      waveAmplitude: 5,
      gapPolarity: -1,
      transitionEase: "cubic-bezier(0.45, 0.05, 0.15, 0.95)",
      colorWaveOffset: 1
    },
    north_america: {
      dualLead: "forward",
      routeRotate: 3,
      depthLayerOrder: [1, 2, 0],
      staggerScale: 1.05,
      waveAmplitude: 7,
      gapPolarity: 1,
      transitionEase: "cubic-bezier(0.4, 0, 0.2, 1)",
      colorWaveOffset: 6
    },
    south_america: {
      dualLead: "reverse",
      routeRotate: 1,
      depthLayerOrder: [2, 0, 1],
      staggerScale: 1.08,
      waveAmplitude: 5.5,
      gapPolarity: -1,
      transitionEase: "cubic-bezier(0.5, 0, 0.35, 1)",
      colorWaveOffset: 8
    },
    oceania: {
      dualLead: "forward",
      routeRotate: 2,
      depthLayerOrder: [0, 1, 2],
      staggerScale: 0.88,
      waveAmplitude: 4.5,
      gapPolarity: 1,
      transitionEase: "cubic-bezier(0.37, 0, 0.63, 1)",
      colorWaveOffset: 10
    }
  };

  const base = presets[id] || presets.europe;
  return Object.freeze({
    schema: "rhizoh.spiral_mmo_spiral_behavior.v0",
    continent: id,
    dualLead: /** @type {SpiralMMODualLeadV0} */ (base.dualLead),
    routeRotate: base.routeRotate,
    depthLayerOrder: Object.freeze(base.depthLayerOrder.slice()),
    staggerScale: base.staggerScale,
    waveAmplitude: base.waveAmplitude,
    gapPolarity: base.gapPolarity,
    transitionEase: base.transitionEase,
    colorWaveOffset: (base.colorWaveOffset + ep) % 11
  });
}
