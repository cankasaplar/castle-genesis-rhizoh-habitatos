/**
 * Castle-wide Quiet Presence sinyali — tek kaynak, çok dinleyici (L10, WebAudio, telemetry, hafıza UI).
 */

export const CASTLE_RHIZOH_PRESENCE_EVENT = "castle-rhizoh-presence";

/**
 * @param {Record<string, unknown>} detail
 */
export function emitRhizohPresence(detail) {
  if (typeof window === "undefined" || !detail || typeof detail !== "object") return;
  try {
    window.dispatchEvent(
      new CustomEvent(CASTLE_RHIZOH_PRESENCE_EVENT, {
        detail: { ts: Date.now(), ...detail }
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {(detail: Record<string, unknown>) => void} handler
 * @returns {() => void} unsubscribe
 */
export function subscribeRhizohPresence(handler) {
  if (typeof window === "undefined") return () => {};
  const fn = (ev) => {
    try {
      handler(ev.detail || {});
    } catch {
      /* noop */
    }
  };
  window.addEventListener(CASTLE_RHIZOH_PRESENCE_EVENT, fn);
  return () => window.removeEventListener(CASTLE_RHIZOH_PRESENCE_EVENT, fn);
}
