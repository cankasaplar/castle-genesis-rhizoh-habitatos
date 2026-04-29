/**
 * Partition skew kontrol yüzeyi — anlık tier yerine Schmitt histerezis (GPU thrash / flip-flop önleme).
 * Örnek: hybrid’e gir 40+, çık 28 altı (32–64 bandında salınım kesilir).
 */

import { CELL_SKEW_PARTITION_SIGNAL } from "./rhizohExecutionRoadmap.js";

const TIER_ACTIONS = CELL_SKEW_PARTITION_SIGNAL.tiers;

function instantTierIndex(r) {
  if (r < 32) return 0;
  if (r < 64) return 1;
  if (r < 128) return 2;
  return 3;
}

function tierPayload(idx) {
  const i = Math.max(0, Math.min(idx, TIER_ACTIONS.length - 1));
  return { lockedTierIndex: idx, ...TIER_ACTIONS[i] };
}

/**
 * @param {object} [opts]
 * @param {typeof CELL_SKEW_PARTITION_SIGNAL.hysteresis} [opts.hysteresis]
 */
export function createPartitionSkewSmoother(opts = {}) {
  const hysteresis = opts.hysteresis ?? CELL_SKEW_PARTITION_SIGNAL.hysteresis;
  const transitions = hysteresis?.transitions ?? [];
  let lockedTier = 0;

  return {
    step(ratioMaxAvg) {
      const r = Number(ratioMaxAvg) || 0;
      const rawTier = instantTierIndex(r);
      let changed = true;
      while (changed) {
        changed = false;
        for (const t of transitions) {
          if (t.fromTier !== lockedTier) continue;
          if (t.toTier > lockedTier && t.enterWhenRgte != null && r >= t.enterWhenRgte) {
            lockedTier = t.toTier;
            changed = true;
            break;
          }
          if (t.toTier < lockedTier && t.exitWhenRlt != null && r < t.exitWhenRlt) {
            lockedTier = t.toTier;
            changed = true;
            break;
          }
        }
      }
      const smoothed = tierPayload(lockedTier);
      const instant = resolveInstantAction(r);
      return {
        ratioMaxAvg: r,
        rawInstantTier: rawTier,
        instantAction: instant.action,
        hysteresisApplied: lockedTier !== rawTier,
        ...smoothed
      };
    },
    getLockedTier() {
      return lockedTier;
    },
    reset() {
      lockedTier = 0;
    }
  };
}

function resolveInstantAction(r) {
  for (const t of TIER_ACTIONS) {
    if (r < t.maxRatio) return t;
  }
  return TIER_ACTIONS[TIER_ACTIONS.length - 1];
}
