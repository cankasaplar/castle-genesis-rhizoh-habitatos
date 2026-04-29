/**
 * Ufuk düzeltmesi v0 — kare bazlı hash sapmasının EMA’sı; uzun ufuk “düzeltme” bayrağı.
 */

const DEFAULT_ALPHA = 0.12;
const STABLE_EPS = 0.0008;
const STABLE_FRAMES_NEEDED = 6;

export function createRhizohDriftStabilizer(options = {}) {
  const alpha = Number(options.alpha ?? DEFAULT_ALPHA);
  let emaDelta = 0;
  let prevHash = null;
  let stableRun = 0;
  let frameIndex = 0;

  return {
    /**
     * @param {{ inputSnapshotHash?: string | null }} frameProbe
     */
    step(frameProbe) {
      frameIndex++;
      const h = frameProbe?.inputSnapshotHash ?? null;
      let delta = 0;
      if (prevHash != null && h != null) {
        delta = prevHash === h ? 0 : 1;
      } else if (h == null) {
        delta = 1;
      }
      prevHash = h;
      emaDelta = alpha * delta + (1 - alpha) * emaDelta;
      if (emaDelta < STABLE_EPS) stableRun++;
      else stableRun = 0;
      const driftControlled = stableRun >= STABLE_FRAMES_NEEDED;
      return Object.freeze({
        frameIndex,
        emaDelta,
        stableRun,
        driftControlled
      });
    },
    reset() {
      emaDelta = 0;
      prevHash = null;
      stableRun = 0;
      frameIndex = 0;
    }
  };
}
