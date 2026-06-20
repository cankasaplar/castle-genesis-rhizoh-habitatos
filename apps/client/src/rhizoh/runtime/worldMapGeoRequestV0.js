/**
 * World map geolocation — user-gesture friendly GPS bootstrap for /world/space.
 */

import { applyRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";
import { persistWorldSpaceCastleAnchorV0 } from "./castleWorldSpaceContinuityV0.js";
import { publishWorldMapObservationOriginV0 } from "./worldMapBootstrapGeoV0.js";

export const WORLD_MAP_GEO_REQUEST_EVENT_V0 = "rhizoh:world-map-geo-request-v0";

/**
 * @returns {"granted"|"denied"|"prompt"|"unsupported"|"unknown"}
 */
export async function queryWorldMapGeoPermissionV0() {
  if (typeof navigator === "undefined" || !navigator.geolocation) return "unsupported";
  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: "geolocation" });
      return /** @type {"granted"|"denied"|"prompt"} */ (status.state);
    }
  } catch {
    /* noop */
  }
  return "unknown";
}

/**
 * @param {{ fly?: boolean, alt?: number, source?: string }} [opts]
 * @returns {Promise<{ ok: boolean, lat?: number, lon?: number, code?: string, message?: string }>}
 */
export function requestWorldMapGeoV0(opts = {}) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(
      Object.freeze({ ok: false, code: "geo_unsupported", message: "Geolocation desteklenmiyor." })
    );
  }

  const fly = opts.fly !== false;
  const alt = Number.isFinite(Number(opts.alt)) ? Number(opts.alt) : 560;
  const source = String(opts.source || "world_map_geo_request");

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
          window.__CASTLE_CLIENT_CASTLE_STATE__ = "ACTIVE";
          persistWorldSpaceCastleAnchorV0(lat, lon, { source });
        } catch {
          /* noop */
        }
        if (fly) {
          void applyRhizohWorldMapToolV0("city_map", { source: `${source}_after_geo` });
        }
        try {
          publishWorldMapObservationOriginV0();
          window.dispatchEvent(
            new CustomEvent(WORLD_MAP_GEO_REQUEST_EVENT_V0, {
              detail: Object.freeze({ ok: true, lat, lon, source })
            })
          );
        } catch {
          /* noop */
        }
        resolve(Object.freeze({ ok: true, lat, lon }));
      },
      (err) => {
        const message = String(err?.message || err?.code || "Konum izni reddedildi");
        resolve(Object.freeze({ ok: false, code: "geo_denied", message }));
      },
      { enableHighAccuracy: true, timeout: 16_000, maximumAge: 30_000 }
    );
  });
}
