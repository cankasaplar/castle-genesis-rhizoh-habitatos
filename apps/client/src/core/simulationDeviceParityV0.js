/**
 * Device parity — same deterministic simulation semantics on mobile + desktop.
 * Viewport / pointer differences must not change replay or canonical fold.
 */

import { spiralMMOAwakeningSeedV0 } from "../rhizoh/runtime/spiralMMOAwakeningCubeCalcV0.js";

export const RHIZOH_SIMULATION_DEVICE_PARITY_SCHEMA_V0 = "castle.rhizoh.simulation_device_parity.v0";

/**
 * Coarse pointer ≈ touch-primary device (phone/tablet).
 */
export function isCoarsePointerDeviceV0() {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

/**
 * Deterministic layer seed — identical on every device for same inputs.
 * @param {number} canonicalSeed
 * @param {number} layer
 */
export function deriveDeterministicLayerSeedV0(canonicalSeed, layer) {
  const base = Number(canonicalSeed) || 0;
  const L = Math.max(0, Number(layer) || 0);
  return Math.abs(spiralMMOAwakeningSeedV0(base, `layer-${L}`, "parity")) % 999999;
}

/**
 * Map gateway canonical tick → authority envelope (same on all clients).
 * @param {number} tickValue
 */
export function deriveCanonicalAuthorityFromTickV0(tickValue) {
  const tick = Math.max(0, Number(tickValue) || 0);
  const canonicalLayer = Math.max(1, tick);
  const seed = deriveDeterministicLayerSeedV0(99821, canonicalLayer);
  return Object.freeze({
    schema: RHIZOH_SIMULATION_DEVICE_PARITY_SCHEMA_V0,
    canonicalLayer,
    seed,
    tick,
    timestamp: Date.now()
  });
}

/**
 * Normalize map interaction for orchestrator (touch ≡ click).
 * @param {string} interaction
 */
export function normalizeMapInteractionV0(interaction) {
  const key = String(interaction || "").toLowerCase();
  if (key === "touch" || key === "tap" || key === "pointerdown") return "click";
  return key;
}

/**
 * Device-invariant replay clock — uses event seq, not wall clock.
 * @param {number} seq
 */
export function replayClockFromSeqV0(seq) {
  return Math.max(0, Number(seq) || 0) * 1000;
}
