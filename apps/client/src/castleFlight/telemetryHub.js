/** Uçuş / telemetri dinleyicileri — Three DroneBridge ve Cesium aynı HUD'a besler */

const listeners = new Set();

export function subscribeCastleDroneTelemetry(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function publishCastleTelemetry(payload) {
  for (const fn of listeners) {
    try {
      fn(payload);
    } catch {
      /* ignore */
    }
  }
}
