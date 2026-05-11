/**
 * vNext-543 — Ambient render döngüsü: 12–20 fps adaptive (30 fps değil).
 */

/**
 * @typedef {object} AmbientLoopOptions
 * @property {(dtMs: number, meta: { targetIntervalMs: number }) => void} [onTick]
 * @property {() => number} [getFrameIntervalMs] override; yoksa lowPowerMode kullanılır
 * @property {ReturnType<import("./lowPowerMode.js").createLowPowerMode>} [lowPowerMode]
 */

/**
 * @param {AmbientLoopOptions} [options]
 */
export function createAmbientLoop(options = {}) {
  const lowPowerMode = options.lowPowerMode;
  let rafId = 0;
  let last = 0;
  let running = false;

  function intervalMs() {
    if (typeof options.getFrameIntervalMs === "function") return options.getFrameIntervalMs();
    if (lowPowerMode) return lowPowerMode.minFrameIntervalMs();
    return 1000 / 16;
  }

  function frame(now) {
    if (!running) return;
    if (!last) last = now;
    const iv = intervalMs();
    if (now - last >= iv) {
      const dt = now - last;
      last = now;
      options.onTick?.(dt, { targetIntervalMs: iv });
    }
    rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }
  };
}
