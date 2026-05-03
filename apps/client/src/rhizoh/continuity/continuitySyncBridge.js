/** @type {null | ((next: { turns?: unknown[], persona?: unknown, meta?: Record<string, unknown> }) => void)} */
let _sync = null;

export function registerClientContinuitySync(fn) {
  _sync = typeof fn === "function" ? fn : null;
}

export function syncClientContinuityRef(next) {
  try {
    if (_sync && next && typeof next === "object") _sync(next);
  } catch {
    /* noop */
  }
}
