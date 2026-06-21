/**
 * Early world-map geo bootstrap — user-gesture GPS without castle anchor.
 * Denied → Serencebey seed fallback remains via resolveWorldMapBootstrapGeoV0.
 */

import { publishWorldMapObservationOriginV0 } from "./worldMapBootstrapGeoV0.js";
import { scheduleExplorerOriginRefreshV0, WORLD_MAP_GEO_REQUEST_EVENT_V0 } from "./worldMapGeoRequestV0.js";

export const EARLY_GEO_BOOTSTRAP_SCHEMA_V0 = "castle.rhizoh.early_geo_bootstrap.v0";
const EARLY_GEO_SESSION_KEY_V0 = "rhizoh_early_geo_bootstrap_v0";

/**
 * @returns {boolean}
 */
export function shouldAttemptEarlyWorldMapGeoV0() {
  if (typeof sessionStorage === "undefined") return true;
  try {
    const raw = sessionStorage.getItem(EARLY_GEO_SESSION_KEY_V0);
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed?.attempted !== true;
  } catch {
    return true;
  }
}

/**
 * @param {{ ok: boolean, code?: string }} result
 */
function markEarlyGeoAttemptV0(result) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      EARLY_GEO_SESSION_KEY_V0,
      JSON.stringify({
        schema: EARLY_GEO_BOOTSTRAP_SCHEMA_V0,
        attempted: true,
        ok: result.ok === true,
        code: result.code || null,
        atMs: Date.now()
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * GPS-only bootstrap — sets __CASTLE_NEXUS_GEO__ without persisting castle anchor.
 * @param {{ source?: string, fly?: boolean }} [opts]
 * @returns {Promise<{ ok: boolean, lat?: number, lon?: number, code?: string, message?: string, skipped?: boolean }>}
 */
export function requestEarlyWorldMapGeoBootstrapV0(opts = {}) {
  if (!shouldAttemptEarlyWorldMapGeoV0()) {
    return Promise.resolve(Object.freeze({ ok: false, code: "already_attempted", skipped: true }));
  }

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    markEarlyGeoAttemptV0({ ok: false, code: "geo_unsupported" });
    return Promise.resolve(
      Object.freeze({ ok: false, code: "geo_unsupported", message: "Geolocation desteklenmiyor." })
    );
  }

  const source = String(opts.source || "early_geo_bootstrap");

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          window.__CASTLE_NEXUS_GEO__ = Object.freeze({
            mode: "geo",
            lat,
            lon,
            source
          });
          publishWorldMapObservationOriginV0();
          window.dispatchEvent(
            new CustomEvent(WORLD_MAP_GEO_REQUEST_EVENT_V0, {
              detail: Object.freeze({ ok: true, lat, lon, source })
            })
          );
          scheduleExplorerOriginRefreshV0();
        } catch {
          /* noop */
        }
        markEarlyGeoAttemptV0({ ok: true });
        resolve(Object.freeze({ ok: true, lat, lon, source }));
      },
      (err) => {
        const code = "geo_denied";
        const message = String(err?.message || err?.code || "Konum izni reddedildi");
        markEarlyGeoAttemptV0({ ok: false, code });
        resolve(Object.freeze({ ok: false, code, message }));
      },
      { enableHighAccuracy: false, timeout: 14_000, maximumAge: 60_000 }
    );
  });
}
