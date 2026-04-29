/**
 * Pass 4.5 — SLOW path: anlık mod N kare sabit kalınca uygulanır.
 * FAST path: QUARANTINE / REBUILD persistence’ı bypass (anında kilit).
 */

import { UNIFIED_EXECUTION_MODE } from "./rhizohExecutionRoadmap.js";

/**
 * @param {object} [opts]
 * @param {number} [opts.modePersistenceFrames]
 */
export function createExecutionModePersistence(opts = {}) {
  const nFrames = Math.max(1, opts.modePersistenceFrames ?? 4);
  /** @type {{ executionMode: string, reason: string } | null} */
  let locked = null;
  /** @type {string | null} */
  let pendingTarget = null;
  let stableCount = 0;

  return {
    /**
     * @param {{ executionMode: string, reason: string }} instantHint
     */
    step(instantHint) {
      const mode = instantHint?.executionMode ?? UNIFIED_EXECUTION_MODE.LOCAL;
      const immediate =
        mode === UNIFIED_EXECUTION_MODE.QUARANTINE || mode === UNIFIED_EXECUTION_MODE.REBUILD;

      if (immediate) {
        locked = { executionMode: mode, reason: instantHint.reason ?? "" };
        pendingTarget = null;
        stableCount = 0;
        return {
          instantHint,
          persistedHint: locked,
          persistenceStableFrames: 0,
          persistenceFramesRequired: nFrames,
          persistencePendingTarget: null,
          persistenceApplied: true
        };
      }

      if (locked == null) {
        locked = { executionMode: mode, reason: instantHint.reason ?? "" };
        pendingTarget = null;
        stableCount = 0;
        return {
          instantHint,
          persistedHint: locked,
          persistenceStableFrames: 0,
          persistenceFramesRequired: nFrames,
          persistencePendingTarget: null,
          persistenceApplied: true
        };
      }

      if (mode === locked.executionMode) {
        pendingTarget = null;
        stableCount = 0;
        return {
          instantHint,
          persistedHint: locked,
          persistenceStableFrames: 0,
          persistenceFramesRequired: nFrames,
          persistencePendingTarget: null,
          persistenceApplied: false
        };
      }

      if (pendingTarget !== mode) {
        pendingTarget = mode;
        stableCount = 1;
      } else {
        stableCount += 1;
      }

      if (stableCount >= nFrames) {
        locked = { executionMode: mode, reason: `${instantHint.reason ?? ""}|persisted_${nFrames}f` };
        pendingTarget = null;
        stableCount = 0;
        return {
          instantHint,
          persistedHint: locked,
          persistenceStableFrames: nFrames,
          persistenceFramesRequired: nFrames,
          persistencePendingTarget: null,
          persistenceApplied: true
        };
      }

      return {
        instantHint,
        persistedHint: locked,
        persistenceStableFrames: stableCount,
        persistenceFramesRequired: nFrames,
        persistencePendingTarget: pendingTarget,
        persistenceApplied: false
      };
    },
    reset() {
      locked = null;
      pendingTarget = null;
      stableCount = 0;
    }
  };
}
