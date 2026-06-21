/**
 * World · Space map boot gate — defer heavy subsystems until Leaflet is interactive.
 * SPECFLOW: RESEARCH-ONLY
 */

export const RHIZOH_V11_LEAFLET_READY_EVENT_V0 = "rhizoh:v11-leaflet-ready-v0";

/**
 * @returns {boolean}
 */
export function isRhizohWorldSpacePathV0() {
  if (typeof window === "undefined") return false;
  return String(window.location.pathname || "").includes("/world/space");
}

/**
 * @returns {boolean}
 */
export function isV11LeafletMapReadyV0() {
  if (typeof window === "undefined") return false;
  return Boolean(window.__rhizoh?.v11LeafletMap);
}

/**
 * Heavy work should wait while user is on map route but tiles are not up yet.
 * @returns {boolean}
 */
export function isWorldSpaceMapBootingV0() {
  return isRhizohWorldSpacePathV0() && !isV11LeafletMapReadyV0();
}

/**
 * @param {object} [detail]
 */
export function publishV11LeafletReadyV0(detail = {}) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.v11LeafletReady = Object.freeze({
    ready: true,
    atMs: Date.now(),
    ...detail
  });
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_V11_LEAFLET_READY_EVENT_V0, {
        detail: window.__rhizoh.v11LeafletReady
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {() => void} fn
 * @param {{ timeoutMs?: number }} [opts]
 */
export function runAfterV11LeafletReadyV0(fn, opts = {}) {
  if (typeof window === "undefined") return () => {};
  const timeoutMs = Number(opts.timeoutMs) || 15_000;
  if (isV11LeafletMapReadyV0()) {
    fn();
    return () => {};
  }
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };
  const onReady = () => run();
  window.addEventListener(RHIZOH_V11_LEAFLET_READY_EVENT_V0, onReady, { once: true });
  const timer = window.setTimeout(run, timeoutMs);
  return () => {
    done = true;
    window.removeEventListener(RHIZOH_V11_LEAFLET_READY_EVENT_V0, onReady);
    window.clearTimeout(timer);
  };
}
