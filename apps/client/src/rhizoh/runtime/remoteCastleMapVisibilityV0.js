/**
 * Opt-in visibility for peer castle pins on world/space map.
 */

export const REMOTE_CASTLES_VISIBLE_LS_KEY_V0 = "rhizoh.remoteCastlesVisible.v0";
export const REMOTE_CASTLES_VISIBILITY_EVENT_V0 = "rhizoh:remote-castles-visibility-v0";

/** @type {Set<(visible: boolean) => void>} */
const listeners = new Set();

/**
 * @returns {boolean}
 */
export function readRemoteCastlesVisibleV0() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REMOTE_CASTLES_VISIBLE_LS_KEY_V0) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {boolean} visible
 */
export function writeRemoteCastlesVisibleV0(visible) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REMOTE_CASTLES_VISIBLE_LS_KEY_V0, visible ? "1" : "0");
  } catch {
    /* noop */
  }
  for (const fn of listeners) {
    try {
      fn(visible === true);
    } catch {
      /* noop */
    }
  }
  try {
    window.dispatchEvent(
      new CustomEvent(REMOTE_CASTLES_VISIBILITY_EVENT_V0, {
        detail: Object.freeze({ visible: visible === true })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {(visible: boolean) => void} fn
 */
export function subscribeRemoteCastlesVisibleV0(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
