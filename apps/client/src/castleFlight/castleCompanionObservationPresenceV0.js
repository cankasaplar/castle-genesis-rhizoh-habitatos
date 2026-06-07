/**
 * Layer 3 — Companion (PWE) observation presence.
 * Map frustum / Cesium geo only — not Rhizoh Box USB stream (see rhizohBoxMediaDeviceV0 + rhizohObservationFeedV0).
 * @see docs/RHIZOH_COMPANION_OBSERVATION_PRESENCE_V0.md
 * @see docs/RHIZOH_MEDIA_LAYER_STACK_V0.md
 */

import {
  CASTLE_PWE_EVENT_V0,
  appendCastlePweTimelineEventV0,
  readCastlePweV0,
  patchCastlePwePresenceV0
} from "./castlePersistentWorldEntityV0.js";
import {
  COMPANION_PRESENCE_STATE_V0,
  normalizeCompanionPresenceStateV0
} from "./companionPresenceStateV0.js";

export const COMPANION_OBS_PRESENCE_SCHEMA_V0 = "castle.companion_observation_presence.v0";
export const COMPANION_OBS_PRESENCE_EVENT_V0 = "castle:companion-observation-presence-v0";

export const COMPANION_PRESENCE_KIND_V0 = Object.freeze({
  OBSERVER_FOLLOW: "observer_follow",
  CAMERA: "camera"
});

export const COMPANION_DORMANCY_V0 = Object.freeze({
  ACTIVE: "active",
  WAITING: "waiting",
  DORMANT: "dormant"
});

/**
 * @returns {import("./castlePersistentWorldEntityV0.js").CastlePwePresenceV0}
 */
export function defaultCompanionObservationPresenceV0() {
  return Object.freeze({
    schema: COMPANION_OBS_PRESENCE_SCHEMA_V0,
    kind: COMPANION_PRESENCE_KIND_V0.OBSERVER_FOLLOW,
    mode: "camera",
    observable: false,
    cameraOpen: false,
    dormancy: COMPANION_DORMANCY_V0.WAITING,
    camera: null
  });
}

/**
 * @returns {import("./castlePersistentWorldEntityV0.js").CastlePweProjectionV0}
 */
export function defaultCompanionProjectionV0() {
  return Object.freeze({
    primary: "camera",
    secondary: "map_pin"
  });
}

/**
 * @returns {import("./castlePersistentWorldEntityV0.js").CastlePweCastleLinkV0}
 */
export function defaultCompanionCastleLinkV0() {
  return Object.freeze({
    bound: false,
    castleId: null,
    role: "continuity_archive"
  });
}

/**
 * @param {{ mapSurfaceActive?: boolean }} [ctx]
 */
export function readCesiumObservationCameraV0(ctx = {}) {
  if (ctx.mapSurfaceActive === false) return null;
  try {
    const geo = window.__CASTLE_CESIUM__?.getCameraGeo?.();
    if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) return null;
    return Object.freeze({
      lat: geo.lat,
      lon: geo.lon,
      heightM: Number(geo.height) || 120,
      atMs: Date.now()
    });
  } catch {
    return null;
  }
}

/**
 * @param {{ mapSurfaceActive?: boolean }} [ctx]
 */
export function resolveCompanionObservationPresenceV0(ctx = {}, prevPresence = null) {
  const mapActive = ctx.mapSurfaceActive !== false;
  const cesium = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
  const cesiumReady =
    cesium?.commandReady === true || (cesium?.ready === true && cesium?.commandReady !== false);
  const camera = readCesiumObservationCameraV0(ctx);
  const cameraOpen = mapActive && cesiumReady && !cesium?.renderDegraded && !!camera;

  let dormancy = COMPANION_DORMANCY_V0.WAITING;
  if (!mapActive) dormancy = COMPANION_DORMANCY_V0.DORMANT;
  else if (cameraOpen) dormancy = COMPANION_DORMANCY_V0.ACTIVE;

  const prevState = normalizeCompanionPresenceStateV0(
    prevPresence?.state || COMPANION_PRESENCE_STATE_V0.OBSERVING
  );

  return Object.freeze({
    schema: COMPANION_OBS_PRESENCE_SCHEMA_V0,
    kind: COMPANION_PRESENCE_KIND_V0.OBSERVER_FOLLOW,
    mode: "camera",
    observable: cameraOpen,
    cameraOpen,
    dormancy,
    state: prevState,
    camera: cameraOpen ? camera : null
  });
}

/**
 * @returns {boolean}
 */
export function isCompanionObservableV0() {
  const pwe = readCastlePweV0();
  return Boolean(pwe?.mounted && pwe.presence?.observable);
}

/**
 * Primary render/geo truth for companion: camera frustum center when observable.
 * @returns {{ lat: number, lon: number, heightM: number, source: string } | null}
 */
export function readCompanionObservationCartographicV0() {
  const pwe = readCastlePweV0();
  if (!pwe?.mounted) return null;
  const cam = pwe.presence?.camera;
  if (pwe.presence?.observable && cam && Number.isFinite(cam.lat) && Number.isFinite(cam.lon)) {
    return Object.freeze({
      lat: cam.lat,
      lon: cam.lon,
      heightM: cam.heightM ?? 120,
      source: "companion_camera_frustum"
    });
  }
  return null;
}

function publishCompanionObsPresenceV0(snap) {
  if (typeof window === "undefined") return;
  window.__RHIZOH_COMPANION_PRESENCE__ = snap;
  try {
    window.dispatchEvent(
      new CustomEvent(COMPANION_OBS_PRESENCE_EVENT_V0, { detail: Object.freeze({ presence: snap }) })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {{ mapSurfaceActive?: boolean }} [ctx]
 */
export function tickCompanionObservationPresenceV0(ctx = {}) {
  const pwe = readCastlePweV0();
  if (!pwe?.mounted) return null;

  const prev = pwe.presence;
  const presence = resolveCompanionObservationPresenceV0(ctx, prev);
  const becameObservable = !prev?.observable && presence.observable;
  const changed =
    !prev ||
    prev.observable !== presence.observable ||
    prev.dormancy !== presence.dormancy ||
    prev.camera?.lat !== presence.camera?.lat ||
    prev.camera?.lon !== presence.camera?.lon;

  publishCompanionObsPresenceV0(
    Object.freeze({
      pweId: pwe.id,
      presence,
      projection: pwe.projection,
      castleLink: pwe.castleLink,
      dormancyOverlay: presence.observable
        ? null
        : presence.dormancy === COMPANION_DORMANCY_V0.DORMANT
          ? "not_observed"
          : "waiting"
    })
  );

  if (changed) {
    patchCastlePwePresenceV0(presence, { source: "observation_camera_tick" });
  }
  if (becameObservable) {
    appendCastlePweTimelineEventV0("PRESENCE_PATCH", {
      observable: true,
      source: "observation_field_open"
    });
  }
  return presence;
}

/**
 * @param {() => boolean} [getMapActive]
 * @returns {() => void}
 */
let companionObsPresenceBridgeTeardownV0 = null;

export function installCompanionObservationPresenceBridgeV0(getMapActive = () => true) {
  if (typeof window === "undefined") return () => {};
  try {
    companionObsPresenceBridgeTeardownV0?.();
  } catch {
    /* noop */
  }

  let raf = 0;
  let lastMs = 0;

  const tickNow = () => tickCompanionObservationPresenceV0({ mapSurfaceActive: getMapActive() });
  tickNow();

  const loop = (now) => {
    if (now - lastMs >= 220) {
      lastMs = now;
      tickNow();
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const onPwe = () => tickNow();
  window.addEventListener(CASTLE_PWE_EVENT_V0, onPwe);

  const teardown = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener(CASTLE_PWE_EVENT_V0, onPwe);
    if (companionObsPresenceBridgeTeardownV0 === teardown) {
      companionObsPresenceBridgeTeardownV0 = null;
    }
  };
  companionObsPresenceBridgeTeardownV0 = teardown;
  return teardown;
}
