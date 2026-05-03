/**
 * Idle / passive learning — field evolves without new user tokens (v0).
 * Drives weighted-memory decay + gentle prune so long silence still moves state.
 */

import { RHIZOH_WEIGHTED_MEMORY_CAP } from "../memory/constants.js";

const DECAY_FRESH_MS = 90_000;
const DECAY_FACTOR = 0.993;
const DECAY_FLOOR_DELTA = 0.0008;

/**
 * @param {Record<string, unknown>} meta
 * @param {number} [now]
 */
export function applyIdleMemoryDecayToMeta(meta, now = Date.now()) {
  const m = meta && typeof meta === "object" ? meta : {};
  const turns = Array.isArray(m.rhizohWeightedTurns) ? m.rhizohWeightedTurns : [];
  if (!turns.length) return m;
  let changed = false;
  const nextTurns = turns.map((t) => {
    if (!t || typeof t !== "object") return t;
    const ts = Number(t.ts) || 0;
    if (now - ts < DECAY_FRESH_MS) return t;
    const imp = Number(t.importance) || 0;
    const res = Number(t.resonance) || 0;
    const sal = Number(t.emotionalSalience) || 0;
    if (imp < 0.018 && res < 0.018 && sal < 0.018) return t;
    changed = true;
    return {
      ...t,
      importance: Math.max(0, imp * DECAY_FACTOR - DECAY_FLOOR_DELTA),
      resonance: Math.max(0, res * DECAY_FACTOR - DECAY_FLOOR_DELTA),
      emotionalSalience: Math.max(0, sal * DECAY_FACTOR - DECAY_FLOOR_DELTA)
    };
  });
  if (!changed) return m;
  return { ...m, rhizohWeightedTurns: nextTurns, rhizohIdleDecayAt: now };
}

/**
 * @param {Record<string, unknown>} meta
 * @param {number} [now]
 * @param {{ aggressive?: boolean }} [opts]
 */
export function applyIdleMemoryPruneToMeta(meta, now = Date.now(), opts = {}) {
  const aggressive = !!opts.aggressive;
  const m = meta && typeof meta === "object" ? meta : {};
  const turns = Array.isArray(m.rhizohWeightedTurns) ? m.rhizohWeightedTurns : [];
  if (turns.length < 5) return m;
  const minImp = aggressive ? 0.055 : 0.038;
  const minRes = aggressive ? 0.05 : 0.035;
  const maxAge = aggressive ? 2_700_000 : 3_600_000;
  const nextTurns = turns.filter((t) => {
    if (!t || typeof t !== "object") return false;
    const ts = Number(t.ts) || 0;
    const imp = Number(t.importance) || 0;
    const res = Number(t.resonance) || 0;
    if (now - ts < maxAge) return true;
    return imp > minImp || res > minRes;
  });
  const capped = nextTurns.slice(-RHIZOH_WEIGHTED_MEMORY_CAP);
  if (capped.length === turns.length) return m;
  return { ...m, rhizohWeightedTurns: capped, rhizohIdlePruneAt: now };
}
