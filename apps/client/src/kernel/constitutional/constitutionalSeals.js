/**
 * Immutable seal records for the constitutional ledger (created here; appended elsewhere).
 */

import { clamp01 } from "./constitutionalState.js";

/** @typedef {import('./constitutionalState.js').Seal} Seal */

export const VERIFY_TIER = Object.freeze({
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3
});

export function tierToSovereignScalar(tier) {
  return clamp01(tier / 3);
}

/**
 * @param {{ id: string, tier: number, confidence: number, entropy: number, timestamp: number }} o
 * @returns {Seal}
 */
export function createSeal(o) {
  return Object.freeze({
    id: o.id,
    tier: o.tier,
    confidence: clamp01(o.confidence),
    entropy: clamp01(o.entropy),
    timestamp: o.timestamp
  });
}
