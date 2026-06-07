/**
 * World observation gate — OBSERVE branch: world only (__RHIZOH_WORLD_OBS__).
 * Does not spawn companion or open box ingress; fusion layer derives PWE when map field opens.
 */

import { getRhizohCalibrationRootAnchorV0 } from "../rhizoh/spatial/geographicAnchorsV0.js";
import { emitProductBindingActionV0 } from "../rhizoh/runtime/rhizohProductBindingV0.js";
import { writeProductSurfaceV0 } from "../rhizoh/spatial/rhizohProductShellBridgeV0.js";
import { routeCesiumCommandV0 } from "./cesiumCommandRouterV0.js";

export const WORLD_FIRST_OBS_SCHEMA_V0 = "castle.world_first_observation.v0";
export const WORLD_FIRST_OBS_STORAGE_V0 = "rhizoh.world_first_observation.v0";
export const WORLD_FIRST_OBS_EVENT_V0 = "castle:world-first-observation-v0";
export const CASTLE_ANCHOR_OFFER_EVENT_V0 = "castle:open-anchor-offer-v0";

/**
 * @returns {boolean}
 */
export function isWorldFirstObservationCompleteV0() {
  if (typeof window === "undefined") return true;
  try {
    if (new URLSearchParams(window.location.search).get("skip_world_gate") === "1") {
      return true;
    }
    const raw = window.localStorage.getItem(WORLD_FIRST_OBS_STORAGE_V0);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.schema === WORLD_FIRST_OBS_SCHEMA_V0 && parsed?.phase === "complete";
  } catch {
    return false;
  }
}

/**
 * @returns {boolean}
 */
export function shouldShowWorldObservationGateV0() {
  return typeof window !== "undefined" && !isWorldFirstObservationCompleteV0();
}

/** DevTools / map strip — reopen location picker even after first completion. */
export function requestWorldObservationGateV0() {
  if (typeof window === "undefined") return false;
  try {
    window.dispatchEvent(new CustomEvent("rhizoh:world-observation-gate-open-v0"));
  } catch {
    /* noop */
  }
  return true;
}

/**
 * @param {Partial<typeof window.__RHIZOH_WORLD_OBS__>} patch
 */
export function publishWorldObservationStateV0(patch) {
  if (typeof window === "undefined") return null;
  const prev =
    window.__RHIZOH_WORLD_OBS__ && typeof window.__RHIZOH_WORLD_OBS__ === "object"
      ? window.__RHIZOH_WORLD_OBS__
      : {};
  window.__RHIZOH_WORLD_OBS__ = Object.freeze({
    schema: WORLD_FIRST_OBS_SCHEMA_V0,
    ...prev,
    ...patch
  });
  try {
    window.dispatchEvent(
      new CustomEvent(WORLD_FIRST_OBS_EVENT_V0, {
        detail: Object.freeze({ state: window.__RHIZOH_WORLD_OBS__ })
      })
    );
  } catch {
    /* noop */
  }
  return window.__RHIZOH_WORLD_OBS__;
}

function persistWorldObservationCompleteV0(row, deps = {}) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(WORLD_FIRST_OBS_STORAGE_V0, JSON.stringify(row));
    } catch {
      /* noop */
    }
  }
  publishWorldObservationStateV0(row);
  writeProductSurfaceV0("world");

  const read = deps.readClientContinuity;
  const write = deps.writeClientContinuity;
  if (read && write) {
    try {
      const disk = read();
      const meta = { ...(disk.meta || {}) };
      meta.worldFirstObservation = row;
      write({ ...disk, meta });
    } catch {
      /* noop */
    }
  }

  try {
    emitProductBindingActionV0({
      source: "world_first_observation",
      mode: "ingress",
      action: "WORLD_OBSERVATION_READY",
      payload: Object.freeze({
        mode: row.mode,
        lat: row.lat ?? null,
        lon: row.lon ?? null
      })
    });
  } catch {
    /* noop */
  }

  /* Companion: rhizohObserveFusionV0 on WORLD_FIRST_OBS_EVENT + map ready — not here. */
}

function flyToObservationCoordsV0(lat, lon) {
  if (typeof window === "undefined") return;
  routeCesiumCommandV0({
    op: "fly_to",
    source: "world_first_observation",
    geo: Object.freeze({ lat, lon, alt: 1200 }),
    meta: Object.freeze({ ingress: "worldFirstObservationV0" })
  });
}

/**
 * Konum izni → gerçek dünya gözlemi (castle yok).
 * @param {{ setRealityMode?: (m: string, ctx?: object) => Promise<void>, onProductShellSelect?: (s: string) => void, readClientContinuity?: Function, writeClientContinuity?: Function }} deps
 */
export async function executeWorldObservationGpsV0(deps = {}) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Object.freeze({ ok: false, code: "geo_unsupported", message: "Geolocation desteklenmiyor." });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          window.__CASTLE_NEXUS_GEO__ = Object.freeze({ mode: "geo", lat, lon, source: "world_observation_gps" });
        } catch {
          /* noop */
        }
        try {
          if (deps.onProductShellSelect) deps.onProductShellSelect("world");
          if (deps.setRealityMode) {
            await deps.setRealityMode("REAL_MAP", { source: "WORLD_FIRST_OBS_GPS" });
          }
        } catch {
          /* noop */
        }
        flyToObservationCoordsV0(lat, lon);

        const row = Object.freeze({
          schema: WORLD_FIRST_OBS_SCHEMA_V0,
          phase: "complete",
          mode: "geo",
          lat,
          lon,
          completedAtMs: Date.now()
        });
        persistWorldObservationCompleteV0(row, deps);
        resolve(Object.freeze({ ok: true, mode: "geo", lat, lon }));
      },
      (err) =>
        resolve(
          Object.freeze({
            ok: false,
            code: "geo_denied",
            message: String(err?.message || err?.code || "Konum izni reddedildi")
          })
        ),
      { enableHighAccuracy: false, timeout: 14_000, maximumAge: 60_000 }
    );
  });
}

/**
 * Konumsuz → soyut dünya gözlemi (castle yok, sahte POI yok).
 * @param {typeof executeWorldObservationGpsV0 extends (d: infer D) => any ? D : never} deps
 */
export async function executeWorldObservationSkipV0(deps = {}) {
  const cal = getRhizohCalibrationRootAnchorV0();
  try {
    window.__CASTLE_NEXUS_GEO__ = Object.freeze({
      mode: "abstract_world_node",
      lat: cal.lat,
      lon: cal.lon,
      source: "world_observation_abstract"
    });
  } catch {
    /* noop */
  }

  try {
    if (deps.onProductShellSelect) deps.onProductShellSelect("world");
    if (deps.setRealityMode) {
      await deps.setRealityMode("GLOBE", { source: "WORLD_FIRST_OBS_ABSTRACT" });
    }
  } catch {
    /* noop */
  }

  const row = Object.freeze({
    schema: WORLD_FIRST_OBS_SCHEMA_V0,
    phase: "complete",
    mode: "abstract",
    lat: null,
    lon: null,
    calibrationRoot: Object.freeze({ lat: cal.lat, lon: cal.lon, id: cal.id }),
    completedAtMs: Date.now()
  });
  persistWorldObservationCompleteV0(row, deps);
  return Object.freeze({ ok: true, mode: "abstract", message: "Dünyayı konumsuz gözlemliyorsunuz." });
}

/** İsteğe bağlı castle anchor teklifi (kale kurulum kapısı). */
export function openCastleAnchorOfferV0() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(CASTLE_ANCHOR_OFFER_EVENT_V0));
    window.dispatchEvent(new CustomEvent("castle:open-init-gate-v0"));
  } catch {
    /* noop */
  }
}
