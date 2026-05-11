/**
 * vNext-543 — Anlatım penceresi: 2–8 dk + düşük güç çarpanı.
 */

import { nextNarrationCadenceDelayMs } from "./cadenceScheduler.js";

/**
 * @param {object} [opts]
 * @param {{ enabled: boolean }} [opts.lowPowerMode]
 */
export function createNarrationScheduler(opts = {}) {
  let nextDueAt = 0;

  function multiplier() {
    return opts.lowPowerMode?.enabled ? 1.35 : 1;
  }

  return {
    /** @param {number} nowMs */
    scheduleNextFrom(nowMs) {
      const delay = nextNarrationCadenceDelayMs({
        minMs: 120_000 * multiplier(),
        maxMs: 480_000 * multiplier()
      });
      nextDueAt = nowMs + delay;
      return nextDueAt;
    },
    /** @param {number} nowMs */
    isDue(nowMs) {
      return nowMs >= nextDueAt;
    },
    /** @param {number} nowMs */
    forceDueIn(nowMs, ms) {
      nextDueAt = nowMs + ms;
    },
    getNextDueAt() {
      return nextDueAt;
    }
  };
}
