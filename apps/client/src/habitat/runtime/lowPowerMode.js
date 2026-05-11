/**
 * vNext-543 — Düşük güç: FPS tavanı + ağ/anlatım çarpanları.
 */

/**
 * @param {object} [state]
 * @param {boolean} [state.enabled]
 */
export function createLowPowerMode(state = {}) {
  let enabled = !!state.enabled;
  return {
    get enabled() {
      return enabled;
    },
    setEnabled(v) {
      enabled = !!v;
    },
    /** @returns {12 | 20} */
    targetFpsCap() {
      return enabled ? 12 : 20;
    },
    /** @returns {number} ms per frame */
    minFrameIntervalMs() {
      return 1000 / this.targetFpsCap();
    },
    /** Ağ isteklerini seyrekleştir */
    networkCadenceMultiplier() {
      return enabled ? 1.45 : 1;
    }
  };
}
