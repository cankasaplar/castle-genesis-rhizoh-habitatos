/**
 * Memory resonance R — carries organism history into the confidence update.
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @param {Record<string, unknown>} [memoryState]
 */
export function computeMemoryResonance(memoryState = {}) {
  const depth = typeof memoryState.depth === "number" ? clamp01(memoryState.depth) : 0.48;
  const stability = typeof memoryState.stability === "number" ? clamp01(memoryState.stability) : 0.52;
  const echo = typeof memoryState.echo === "number" ? clamp01(memoryState.echo) : 0.4;
  return clamp01(0.38 * depth + 0.36 * stability + 0.26 * echo);
}
