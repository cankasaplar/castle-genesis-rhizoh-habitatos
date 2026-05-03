/**
 * Castle reality transition nerve — pub/sub + DOM event for third-party hooks.
 *
 * Payload shape (contract):
 * { from, to, source, durationMs, success, error?: unknown, reason?: string }
 */

const listeners = new Set();

/**
 * @param {(payload: Record<string, unknown>) => void} fn
 * @returns {() => void}
 */
export function subscribeRealityTransition(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** @param {Record<string, unknown>} payload */
export function emitRealityTransition(payload) {
  for (const fn of listeners) {
    try {
      fn(payload);
    } catch (e) {
      console.error("[castle:reality-nerve] listener error", e);
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("castle:reality-changed", { detail: payload }));
  }
}
