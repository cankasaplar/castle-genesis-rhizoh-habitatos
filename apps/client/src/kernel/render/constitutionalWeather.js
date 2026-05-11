/**
 * vNext-538 — Layer A: constitutional weather coefficients for volumetric / VFX art direction.
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @param {import('./fieldAtlasBuilder.js').FieldCell} cell
 */
export function sampleConstitutionalWeather(cell) {
  const be = cell.branchEntropy ?? 0;
  const cs = cell.conflictSeverity ?? 0;
  return Object.freeze({
    glowDensity: clamp01(cell.truth * 0.85 + (1 - cell.entropy) * 0.15),
    turbulence: clamp01(cell.contradiction * 0.9 + cell.entropy * 0.35 + cs * 0.25),
    crystalStability: clamp01(cell.legitimacy * (1 - cell.contradiction * 0.4) * (1 - be * 0.15)),
    sparks: clamp01(cell.novelty * 0.95),
    echoMist: clamp01(cell.memory * 0.8 + cell.entropy * 0.15)
  });
}
