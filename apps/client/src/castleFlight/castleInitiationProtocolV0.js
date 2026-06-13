/**
 * CASTLE Initiation Protocol V1 — intent → permission gate → anchor → studio event.
 * No-Fiction: skip = abstract_world_node (no synthetic Overpass POI).
 */

import { detectCastleIntentWithoutCoords } from "../kernel/rhizohCommandParser.js";
import { parseDSL } from "../kernel/rhizohCommandParser.js";
import { createCastleWorldAnchorV0 } from "./castleWorldAnchorV0.js";
import { emitProductBindingActionV0 } from "../rhizoh/runtime/rhizohProductBindingV0.js";
import { getRhizohCalibrationRootAnchorV0 } from "../rhizoh/spatial/geographicAnchorsV0.js";
import { writeWorldMapClaimModeV0 } from "../rhizoh/runtime/worldMapClaimModeV0.js";

export const CASTLE_INIT_SCHEMA_V0 = "castle.initiation.v0";
export const CASTLE_INIT_EVENT_V0 = "castle:castle-create-v0";

/**
 * @param {string} message
 */
export function classifyCastleInitIntentV0(message) {
  const m = String(message || "").trim();
  if (!m) return null;
  if (detectCastleIntentWithoutCoords(m)) {
    return Object.freeze({ intent: "CASTLE_CREATE", needsLocation: true });
  }
  if (/rhizoh\s+kale\s+kur|rhizoh.*\bkale\s+kur\b/i.test(m)) {
    return Object.freeze({ intent: "CASTLE_CREATE", needsLocation: true });
  }
  return null;
}

/**
 * @param {Partial<typeof window.__CASTLE_INIT__>} patch
 */
export function publishCastleInitStateV0(patch) {
  if (typeof window === "undefined") return null;
  const prev = window.__CASTLE_INIT__ && typeof window.__CASTLE_INIT__ === "object" ? window.__CASTLE_INIT__ : {};
  window.__CASTLE_INIT__ = Object.freeze({
    schema: CASTLE_INIT_SCHEMA_V0,
    ...prev,
    ...patch
  });
  return window.__CASTLE_INIT__;
}

/**
 * @param {{ source: "gps" | "map" | "abstract", anchor?: object, owner?: string, castleType?: string }} detail
 */
export function emitCastleCreateEventV0(detail) {
  const row = Object.freeze({
    schema: CASTLE_INIT_SCHEMA_V0,
    type: "CASTLE_CREATE",
    atMs: Date.now(),
    source: detail.source,
    anchor: detail.anchor ? Object.freeze(detail.anchor) : null,
    owner: detail.owner || "GUEST",
    castleType: detail.castleType || "SANCTUARY"
  });
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CASTLE_INIT_EVENT_V0, { detail: row }));
    } catch {
      /* noop */
    }
  }
  try {
    emitProductBindingActionV0({
      source: "castle_init",
      mode: "ritual",
      action: "CASTLE_CREATE",
      payload: Object.freeze({
        source: detail.source,
        anchor: detail.anchor || null,
        owner: row.owner,
        castleType: row.castleType
      })
    });
  } catch {
    /* noop */
  }
  return row;
}

/**
 * @param {{
 *   owner: string,
 *   castleType?: string,
 *   applyPersonalCastleDsl: (parsed: object) => Promise<{ ok: boolean, reply?: string, directive?: string }>,
 *   readClientContinuity?: () => object,
 *   writeClientContinuity?: (disk: object) => void
 * }} deps
 */
export async function executeCastleInitGpsV0(deps) {
  const owner = String(deps.owner || "GUEST");
  const castleType = String(deps.castleType || "SANCTUARY");
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Object.freeze({ ok: false, code: "geo_unsupported", message: "Geolocation desteklenmiyor." });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const cmd = `SPAWN CASTLE --owner ${owner} --lat ${lat} --lon ${lon} --type ${castleType}`;
        const parsed = parseDSL(cmd);
        const out = parsed
          ? deps.applyPersonalCastleDsl
            ? await deps.applyPersonalCastleDsl(parsed)
            : { ok: true, reply: "Castle anchor kaydedildi." }
          : { ok: false, reply: "DSL parse failed" };
        const anchor = createCastleWorldAnchorV0({
          lat,
          lon,
          label: "Castle (GPS)",
          source: "gps",
          feed: "gps"
        });
        emitCastleCreateEventV0({ source: "gps", anchor, owner, castleType });
        publishCastleInitStateV0({ phase: "complete", source: "gps", pendingMapPick: false });
        resolve(Object.freeze({ ok: out.ok, source: "gps", lat, lon, reply: out.reply, directive: out.directive }));
      },
      (err) => {
        resolve(
          Object.freeze({
            ok: false,
            code: "geo_denied",
            message: String(err?.message || err?.code || "Konum izni reddedildi")
          })
        );
      },
      { enableHighAccuracy: false, timeout: 14_000, maximumAge: 60_000 }
    );
  });
}

/**
 * @param {{
 *   setRealityMode?: (mode: string, ctx?: object) => Promise<void>,
 *   onProductShellSelect?: (surface: string) => void
 * }} deps
 */
export async function executeCastleInitMapPickV0(deps) {
  publishCastleInitStateV0({ phase: "map_pick", source: "map", pendingMapPick: true });
  writeWorldMapClaimModeV0(true);
  try {
    if (deps.onProductShellSelect) deps.onProductShellSelect("world");
    // v11 Leaflet pick — do NOT setRealityMode REAL_MAP (that mounts Cesium on /world/space).
  } catch {
    /* noop */
  }
  return Object.freeze({
    ok: true,
    source: "map",
    message: "Haritaya tıklayarak pin bırakın (tek tık = castle anchor)."
  });
}

/**
 * Map pick completion — call from anchor event when pendingMapPick.
 * @param {object} anchorDetail
 * @param {{ owner: string, castleType?: string, applyPersonalCastleDsl: Function }} deps
 */
export async function completeCastleInitFromMapAnchorV0(anchorDetail, deps) {
  if (!anchorDetail || !Number.isFinite(anchorDetail.lat) || !Number.isFinite(anchorDetail.lon)) {
    return Object.freeze({ ok: false, code: "invalid_anchor" });
  }
  const owner = String(deps.owner || "GUEST");
  const castleType = String(deps.castleType || "SANCTUARY");
  const lat = anchorDetail.lat;
  const lon = anchorDetail.lon;
  const cmd = `SPAWN CASTLE --owner ${owner} --lat ${lat} --lon ${lon} --type ${castleType}`;
  const parsed = parseDSL(cmd);
  const out = parsed
    ? deps.applyPersonalCastleDsl
      ? await deps.applyPersonalCastleDsl(parsed)
      : { ok: true, reply: "Castle anchor kaydedildi." }
    : { ok: false };
  emitCastleCreateEventV0({
    source: "map",
    anchor: { ...anchorDetail, source: "map" },
    owner,
    castleType
  });
  publishCastleInitStateV0({ phase: "complete", source: "map", pendingMapPick: false });
  return Object.freeze({ ok: out.ok, source: "map", lat, lon, reply: out.reply });
}

/**
 * Location-optional: abstract world node — system stays up, no fake Overpass POI.
 * @param {{ owner: string, castleType?: string, readClientContinuity?: Function, writeClientContinuity?: Function }} deps
 */
export async function executeCastleInitSkipV0(deps) {
  const owner = String(deps.owner || "GUEST");
  const castleType = String(deps.castleType || "SANCTUARY");
  const cal = getRhizohCalibrationRootAnchorV0();
  const anchor = Object.freeze({
    id: `abstract_${Date.now()}`,
    mode: "abstract_world_node",
    lat: null,
    lon: null,
    calibrationRoot: Object.freeze({ lat: cal.lat, lon: cal.lon, id: cal.id }),
    label: "Abstract world node",
    source: "abstract",
    owner,
    castleType
  });
  try {
    if (deps.readClientContinuity && deps.writeClientContinuity) {
      const disk = deps.readClientContinuity();
      const meta = { ...(disk.meta || {}) };
      meta.castleState = {
        phase: "ABSTRACT",
        anchorMode: "abstract_world_node",
        anchorLat: null,
        anchorLon: null,
        owner,
        castleType,
        updatedAt: Date.now()
      };
      deps.writeClientContinuity({ ...disk, meta });
    }
  } catch {
    /* noop */
  }
  try {
    window.__CASTLE_CLIENT_CASTLE_STATE__ = "ACTIVE";
    window.__CASTLE_NEXUS_GEO__ = { mode: "abstract_world_node", lat: cal.lat, lon: cal.lon };
  } catch {
    /* noop */
  }
  emitCastleCreateEventV0({ source: "abstract", anchor, owner, castleType });
  publishCastleInitStateV0({ phase: "complete", source: "abstract", pendingMapPick: false });
  return Object.freeze({
    ok: true,
    source: "abstract",
    reply:
      "Kale soyut düğüm olarak başlatıldı — konum zorunlu değil. Harita verisi gelince gerçek anchor eklenebilir."
  });
}

/**
 * @param {(detail: object) => void} onMapAnchor
 * @returns {() => void}
 */
export function installCastleInitMapPickListenerV0(onMapAnchor) {
  if (typeof window === "undefined") return () => {};
  const handler = (ev) => {
    const init = window.__CASTLE_INIT__;
    if (!init?.pendingMapPick) return;
    onMapAnchor(ev.detail);
  };
  window.addEventListener("castle:world-anchor-v0", handler);
  return () => window.removeEventListener("castle:world-anchor-v0", handler);
}

/** Light runtime: UI + 2D + studio; defer heavy 3D simulation. */
export function isCastleLightRuntimeV0() {
  try {
    return String(import.meta.env?.VITE_CASTLE_LIGHT_RUNTIME || "").trim() === "1";
  } catch {
    return false;
  }
}
