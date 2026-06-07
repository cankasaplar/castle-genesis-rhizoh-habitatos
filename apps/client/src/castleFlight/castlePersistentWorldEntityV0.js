/**
 * Castle Persistent World Entity (PWE) v0 — living castle pet / core entity.
 * Truth: state JSON + event log; map anchor + studio edits; 3D = visualizer only.
 * Lifecycle: spawn on CASTLE_CREATE (or hydrate); always_mounted; never destroyed.
 */

import { CASTLE_INIT_EVENT_V0 } from "./castleInitiationProtocolV0.js";
import {
  publishWorldObservationStateV0,
  WORLD_FIRST_OBS_EVENT_V0
} from "./worldFirstObservationV0.js";
import { createCastleWorldAnchorV0 } from "./castleWorldAnchorV0.js";
import { emitProductBindingActionV0 } from "../rhizoh/runtime/rhizohProductBindingV0.js";
import { getRhizohCalibrationRootAnchorV0 } from "../rhizoh/spatial/geographicAnchorsV0.js";
import {
  defaultCompanionCastleLinkV0,
  defaultCompanionObservationPresenceV0,
  defaultCompanionProjectionV0,
  readCompanionObservationCartographicV0
} from "./castleCompanionObservationPresenceV0.js";
import {
  COMPANION_PRESENCE_STATE_V0,
  normalizeCompanionPresenceStateV0
} from "./companionPresenceStateV0.js";

export const CASTLE_PWE_SCHEMA_V0 = "castle.pwe.v0";
export const CASTLE_PWE_EVENT_V0 = "castle:pwe-v0";
export const CASTLE_PWE_DEFAULT_MODEL_REF_V0 = "asset://castle/pet/shane-core.glb";

const MAX_EVENT_LOG = 64;

/** @type {import("./castlePersistentWorldEntityV0.js").CastlePweV0 | null} */
let activePwe = null;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function slugOwner(owner) {
  const s = String(owner || "guest")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .slice(0, 48);
  return s || "guest";
}

/**
 * @typedef {{
 *   schema: typeof CASTLE_PWE_SCHEMA_V0,
 *   id: string,
 *   type: "castle_pet",
 *   lifecycle: "always_mounted",
 *   destroyed: false,
 *   mounted: boolean,
 *   owner: string,
 *   castleType: string,
 *   createdAtMs: number,
 *   updatedAtMs: number,
 *   anchor: {
 *     mode: "geo" | "abstract",
 *     lat: number | null,
 *     lon: number | null,
 *     source: string,
 *     anchorId: string | null,
 *     calibrationRoot?: { lat: number, lon: number, id?: string } | null
 *   },
 *   state: {
 *     mood: string,
 *     energy: number,
 *     trust: number,
 *     animation: string,
 *     scale: number,
 *     appearance: { tint: string }
 *   },
 *   render: {
 *     modelRef: string,
 *     layers: readonly string[]
 *   },
 *   presence: CastlePwePresenceV0,
 *   projection: CastlePweProjectionV0,
 *   castleLink: CastlePweCastleLinkV0,
 *   eventLog: readonly object[]
 * }} CastlePweV0
 *
 * @typedef {{
 *   schema: string,
 *   kind: string,
 *   mode: "camera",
 *   observable: boolean,
 *   cameraOpen: boolean,
 *   dormancy: string,
 *   state: string,
 *   camera: { lat: number, lon: number, heightM?: number, atMs?: number } | null
 * }} CastlePwePresenceV0
 *
 * @typedef {{ primary: "camera", secondary: "map_pin" }} CastlePweProjectionV0
 *
 * @typedef {{ bound: boolean, castleId: string | null, role: string }} CastlePweCastleLinkV0
 */

function defaultPweStateV0() {
  return Object.freeze({
    mood: "idle",
    energy: 0.7,
    trust: 0.5,
    animation: "idle",
    scale: 1,
    appearance: Object.freeze({ tint: "#22d3ee" })
  });
}

function pushEventLogV0(pwe, action, payload = {}) {
  const row = Object.freeze({
    atMs: Date.now(),
    action,
    payload: Object.freeze(payload)
  });
  const log = [...(pwe.eventLog || []), row].slice(-MAX_EVENT_LOG);
  return log;
}

function publishCastlePweV0(pwe) {
  if (typeof window === "undefined") return pwe;
  window.__CASTLE_PWE__ = pwe;
  try {
    window.dispatchEvent(new CustomEvent(CASTLE_PWE_EVENT_V0, { detail: Object.freeze({ pwe }) }));
  } catch {
    /* noop */
  }
  return pwe;
}

/**
 * @returns {CastlePweV0 | null}
 */
export function readCastlePweV0() {
  return activePwe;
}

/**
 * WGS84 for map/Cesium when geo anchor exists; abstract uses calibration root hint only.
 * @returns {{ lat: number, lon: number, heightM: number, source: string } | null}
 */
export function readCastlePweCartographicV0() {
  const pwe = activePwe;
  if (!pwe?.mounted || pwe.destroyed) return null;

  const cameraCarto = readCompanionObservationCartographicV0();
  if (cameraCarto) return cameraCarto;

  if (pwe.anchor.mode === "geo" && Number.isFinite(pwe.anchor.lat) && Number.isFinite(pwe.anchor.lon)) {
    const energy = clamp01(pwe.state.energy);
    return Object.freeze({
      lat: pwe.anchor.lat,
      lon: pwe.anchor.lon,
      heightM: 95 + energy * 85,
      source: "castle_pwe_geo"
    });
  }
  const cal = pwe.anchor.calibrationRoot;
  if (pwe.anchor.mode === "abstract" && cal && Number.isFinite(cal.lat) && Number.isFinite(cal.lon)) {
    return Object.freeze({
      lat: cal.lat,
      lon: cal.lon,
      heightM: 120,
      source: "castle_pwe_abstract_calibration"
    });
  }
  return null;
}

/**
 * @param {CastlePweV0} pwe
 * @param {{ readClientContinuity?: () => object, writeClientContinuity?: (d: object) => void }} [deps]
 */
function persistCastlePweV0(pwe, deps = {}) {
  activePwe = pwe;
  publishCastlePweV0(pwe);
  const read = deps.readClientContinuity;
  const write = deps.writeClientContinuity;
  if (!read || !write) return;
  try {
    const disk = read();
    const meta = { ...(disk.meta || {}) };
    meta.castlePwe = pwe;
    const prevGhost = meta.ghostPet && typeof meta.ghostPet === "object" ? meta.ghostPet : {};
    if (pwe.anchor.mode === "geo" && Number.isFinite(pwe.anchor.lat)) {
      meta.ghostPet = {
        ...prevGhost,
        mood: pwe.state.mood === "guard" ? "guard" : pwe.state.mood || "guard",
        castleLat: pwe.anchor.lat,
        castleLon: pwe.anchor.lon,
        guardSince: prevGhost.guardSince || pwe.createdAtMs,
        lastCastleSpawnAt: Date.now(),
        pweId: pwe.id
      };
    } else {
      meta.ghostPet = {
        ...prevGhost,
        mood: pwe.state.mood || "neutral",
        pweId: pwe.id,
        abstractMounted: true
      };
    }
    write({ ...disk, meta });
  } catch {
    /* noop */
  }
}

/**
 * @param {{ source: string, anchor?: object, owner?: string, castleType?: string }} detail
 * @param {{ readClientContinuity?: () => object, writeClientContinuity?: (d: object) => void }} [deps]
 * @returns {CastlePweV0}
 */
/**
 * Companion at world observation — no castle required.
 * @param {string} [owner]
 * @param {object} [deps]
 */
export function spawnObservationCompanionV0(owner = "GUEST", deps = {}) {
  const cal = getRhizohCalibrationRootAnchorV0();
  return spawnCastlePweFromCreateV0(
    {
      source: "world_observation",
      owner,
      companionOnly: true,
      anchor: {
        mode: "abstract_world_node",
        calibrationRoot: { lat: cal.lat, lon: cal.lon, id: cal.id }
      }
    },
    deps
  );
}

/**
 * @param {import("./castlePersistentWorldEntityV0.js").CastlePwePresenceV0} presence
 * @param {{ source?: string, readClientContinuity?: Function, writeClientContinuity?: Function }} [deps]
 */
export function appendCastlePweTimelineEventV0(action, payload = {}, deps = {}) {
  const prev = activePwe;
  if (!prev?.mounted) return null;
  const next = Object.freeze({
    ...prev,
    updatedAtMs: Date.now(),
    eventLog: Object.freeze(pushEventLogV0(prev, action, payload))
  });
  persistCastlePweV0(next, deps);
  return next;
}

/**
 * Intentional presence.state (PWE truth) — not dormancy UI, not animation.
 * @param {string} state
 * @param {{ source?: string, readClientContinuity?: Function, writeClientContinuity?: Function }} [deps]
 */
export function patchCastlePwePresenceStateV0(state, deps = {}) {
  const prev = activePwe;
  if (!prev?.mounted) return null;
  const normalized = normalizeCompanionPresenceStateV0(state);
  const next = Object.freeze({
    ...prev,
    updatedAtMs: Date.now(),
    presence: Object.freeze({
      ...prev.presence,
      state: normalized
    }),
    eventLog: Object.freeze(
      pushEventLogV0(prev, "PRESENCE_STATE", {
        state: normalized,
        source: deps.source || "studio"
      })
    )
  });
  persistCastlePweV0(next, deps);
  emitStudioPweActionV0("PWE_PRESENCE_STATE", next);
  return next;
}

export function patchCastlePwePresenceV0(presence, deps = {}) {
  const prev = activePwe;
  if (!prev?.mounted) return null;
  const mergedPresence = Object.freeze({
    ...prev.presence,
    ...presence,
    state: presence.state != null
      ? normalizeCompanionPresenceStateV0(presence.state)
      : prev.presence?.state || COMPANION_PRESENCE_STATE_V0.OBSERVING
  });
  const logPayload = {
    source: deps.source || "presence",
    observable: mergedPresence.observable,
    dormancy: mergedPresence.dormancy
  };
  if (presence.state != null) logPayload.presenceState = mergedPresence.state;
  const next = Object.freeze({
    ...prev,
    updatedAtMs: Date.now(),
    presence: mergedPresence,
    eventLog: Object.freeze(pushEventLogV0(prev, "PRESENCE_PATCH", logPayload))
  });
  persistCastlePweV0(next, deps);
  return next;
}

export function spawnCastlePweFromCreateV0(detail, deps = {}) {
  const owner = String(detail?.owner || "GUEST");
  const castleType = String(detail?.castleType || "SANCTUARY");
  const source = String(detail?.source || "unknown");
  const companionOnly = Boolean(detail?.companionOnly || source === "world_observation");
  const existing = activePwe;
  if (existing?.mounted && existing.owner === owner && !existing.destroyed) {
    return patchCastlePweFromCreateV0(existing, detail, deps);
  }

  const anchorIn = detail?.anchor || null;
  const isAbstract =
    companionOnly ||
    source === "abstract" ||
    anchorIn?.mode === "abstract_world_node" ||
    !Number.isFinite(anchorIn?.lat);

  let anchorId = null;
  let lat = null;
  let lon = null;
  let calibrationRoot = null;

  if (isAbstract) {
    calibrationRoot = anchorIn?.calibrationRoot || null;
  } else {
    lat = Number(anchorIn?.lat);
    lon = Number(anchorIn?.lon);
    const worldAnchor = createCastleWorldAnchorV0({
      lat,
      lon,
      label: "Castle pet anchor",
      source: source === "map" ? "map_pick" : source === "gps" ? "user" : "studio",
      feed: source
    });
    anchorId = worldAnchor?.id || null;
  }

  const now = Date.now();
  const pwe = Object.freeze({
    schema: CASTLE_PWE_SCHEMA_V0,
    id: `castle-pwe-${slugOwner(owner)}`,
    type: companionOnly ? "castle_companion" : "castle_pet",
    lifecycle: "always_mounted",
    destroyed: false,
    mounted: true,
    owner,
    castleType: companionOnly ? null : castleType,
    createdAtMs: now,
    updatedAtMs: now,
    anchor: Object.freeze({
      mode: isAbstract ? "abstract" : "geo",
      lat: isAbstract ? null : lat,
      lon: isAbstract ? null : lon,
      source,
      anchorId,
      calibrationRoot: calibrationRoot
        ? Object.freeze({
            lat: Number(calibrationRoot.lat),
            lon: Number(calibrationRoot.lon),
            id: calibrationRoot.id || null
          })
        : null
    }),
    state: defaultPweStateV0(),
    render: Object.freeze({
      modelRef: CASTLE_PWE_DEFAULT_MODEL_REF_V0,
      layers: Object.freeze(["base", "state", "animation"])
    }),
    presence: defaultCompanionObservationPresenceV0(),
    projection: defaultCompanionProjectionV0(),
    castleLink: companionOnly
      ? defaultCompanionCastleLinkV0()
      : Object.freeze({
          bound: true,
          castleId: `castle-${slugOwner(owner)}`,
          role: "continuity_archive"
        }),
    eventLog: Object.freeze([
      Object.freeze({
        atMs: now,
        action: companionOnly ? "COMPANION_OBS_SPAWN" : "CASTLE_PWE_SPAWN",
        payload: Object.freeze({
          source,
          castleType: companionOnly ? null : castleType,
          anchorMode: isAbstract ? "abstract" : "geo",
          companionOnly
        })
      })
    ])
  });

  persistCastlePweV0(pwe, deps);
  emitStudioPweActionV0("PWE_SPAWN", pwe);
  return pwe;
}

/**
 * @param {CastlePweV0} prev
 * @param {object} detail
 * @param {object} deps
 */
function patchCastlePweFromCreateV0(prev, detail, deps) {
  const companionOnly = Boolean(detail?.companionOnly || detail?.source === "world_observation");
  const anchorIn = detail?.anchor;
  const source = String(detail?.source || prev.anchor.source);
  const isGeo = Number.isFinite(anchorIn?.lat) && Number.isFinite(anchorIn?.lon);
  let anchor = prev.anchor;
  if (isGeo) {
    const worldAnchor = createCastleWorldAnchorV0({
      lat: Number(anchorIn.lat),
      lon: Number(anchorIn.lon),
      label: "Castle pet anchor (rebind)",
      source: "studio",
      feed: source
    });
    anchor = Object.freeze({
      mode: "geo",
      lat: Number(anchorIn.lat),
      lon: Number(anchorIn.lon),
      source,
      anchorId: worldAnchor?.id || prev.anchor.anchorId,
      calibrationRoot: null
    });
  }
  const next = Object.freeze({
    ...prev,
    updatedAtMs: Date.now(),
    anchor,
    castleType: companionOnly ? prev.castleType : String(detail?.castleType || prev.castleType || "SANCTUARY"),
    castleLink: companionOnly
      ? prev.castleLink || defaultCompanionCastleLinkV0()
      : Object.freeze({
          ...(prev.castleLink || defaultCompanionCastleLinkV0()),
          bound: true,
          castleId: prev.castleLink?.castleId || `castle-${slugOwner(prev.owner)}`,
          role: "continuity_archive"
        }),
    eventLog: Object.freeze(
      pushEventLogV0(prev, "CASTLE_PWE_REBIND", { source })
    )
  });
  persistCastlePweV0(next, deps);
  emitStudioPweActionV0("PWE_REBIND", next);
  return next;
}

/**
 * @param {Partial<CastlePweV0["state"]> & { lat?: number, lon?: number }} patch
 * @param {{ readClientContinuity?: () => object, writeClientContinuity?: (d: object) => void, source?: string }} [deps]
 */
export function patchCastlePweStateV0(patch, deps = {}) {
  const prev = activePwe;
  if (!prev?.mounted) return null;

  let anchor = prev.anchor;
  if (Number.isFinite(patch.lat) && Number.isFinite(patch.lon)) {
    const worldAnchor = createCastleWorldAnchorV0({
      lat: Number(patch.lat),
      lon: Number(patch.lon),
      label: "Castle pet (studio move)",
      source: "studio",
      feed: deps.source || "studio"
    });
    anchor = Object.freeze({
      ...prev.anchor,
      mode: "geo",
      lat: Number(patch.lat),
      lon: Number(patch.lon),
      anchorId: worldAnchor?.id || prev.anchor.anchorId,
      source: deps.source || "studio"
    });
  }

  const st = { ...prev.state, ...patch };
  const nextState = Object.freeze({
    mood: String(st.mood ?? prev.state.mood),
    energy: clamp01(st.energy ?? prev.state.energy),
    trust: clamp01(st.trust ?? prev.state.trust),
    animation: String(st.animation ?? prev.state.animation),
    scale: Math.max(0.25, Math.min(3, Number(st.scale ?? prev.state.scale) || 1)),
    appearance: Object.freeze({
      ...prev.state.appearance,
      ...(st.appearance && typeof st.appearance === "object" ? st.appearance : {})
    })
  });

  const next = Object.freeze({
    ...prev,
    updatedAtMs: Date.now(),
    anchor,
    state: nextState,
    eventLog: Object.freeze(
      pushEventLogV0(prev, "STATE_PATCH", {
        keys: Object.keys(patch),
        animation: nextState.animation,
        mood: nextState.mood
      })
    )
  });
  persistCastlePweV0(next, deps);
  emitStudioPweActionV0("PWE_STATE_PATCH", next);
  return next;
}

function emitStudioPweActionV0(action, pwe) {
  try {
    emitProductBindingActionV0({
      source: "castle_pwe",
      mode: "entity",
      action,
      payload: Object.freeze({
        pweId: pwe.id,
        anchorMode: pwe.anchor.mode,
        lat: pwe.anchor.lat,
        lon: pwe.anchor.lon,
        mood: pwe.state.mood,
        animation: pwe.state.animation,
        modelRef: pwe.render.modelRef
      })
    });
  } catch {
    /* noop */
  }
}

/**
 * Sync legacy ghostPet + castleState when DSL spawn runs (no CASTLE_CREATE event).
 * @param {number} lat
 * @param {number} lon
 * @param {{ owner?: string, readClientContinuity: () => object, writeClientContinuity: (d: object) => void }} deps
 */
export function syncCastlePweWithGhostPetV0(lat, lon, deps) {
  return spawnCastlePweFromCreateV0(
    {
      source: "dsl_spawn",
      owner: deps.owner || "GUEST",
      castleType: "SANCTUARY",
      anchor: { lat, lon, source: "dsl_spawn" }
    },
    deps
  );
}

/**
 * @param {{ readClientContinuity?: () => object, writeClientContinuity?: (d: object) => void }} deps
 */
export function hydrateCastlePweFromContinuityV0(deps = {}) {
  const read = deps.readClientContinuity;
  if (!read) return activePwe;
  try {
    const disk = read();
    const meta = disk?.meta || {};
    if (meta.castlePwe && meta.castlePwe.schema === CASTLE_PWE_SCHEMA_V0) {
      const raw = meta.castlePwe;
      const pres = raw.presence || defaultCompanionObservationPresenceV0();
      activePwe = Object.freeze({
        ...raw,
        presence: Object.freeze({
          ...pres,
          state: normalizeCompanionPresenceStateV0(pres.state)
        }),
        projection: raw.projection || defaultCompanionProjectionV0(),
        castleLink: raw.castleLink || defaultCompanionCastleLinkV0()
      });
      publishCastlePweV0(activePwe);
      return activePwe;
    }
    if (meta.worldFirstObservation?.phase === "complete") {
      try {
        publishWorldObservationStateV0(meta.worldFirstObservation);
        window.dispatchEvent(
          new CustomEvent(WORLD_FIRST_OBS_EVENT_V0, {
            detail: Object.freeze({ state: meta.worldFirstObservation })
          })
        );
      } catch {
        /* noop */
      }
      return activePwe;
    }
    const cs = meta.castleState;
    if (cs?.phase === "SEED" && Number.isFinite(cs.anchorLat) && Number.isFinite(cs.anchorLon)) {
      return spawnCastlePweFromCreateV0(
        {
          source: "continuity_hydrate",
          owner: cs.owner || "GUEST",
          castleType: cs.castleType || "SANCTUARY",
          anchor: { lat: cs.anchorLat, lon: cs.anchorLon, source: "continuity_hydrate" }
        },
        deps
      );
    }
    if (cs?.phase === "ABSTRACT" || cs?.anchorMode === "abstract_world_node") {
      const cal = getRhizohCalibrationRootAnchorV0();
      return spawnCastlePweFromCreateV0(
        {
          source: "abstract",
          owner: cs.owner || "GUEST",
          castleType: cs.castleType || "SANCTUARY",
          anchor: {
            mode: "abstract_world_node",
            lat: null,
            lon: null,
            calibrationRoot: { lat: cal.lat, lon: cal.lon, id: cal.id }
          }
        },
        deps
      );
    }
  } catch {
    /* noop */
  }
  return activePwe;
}

/**
 * @param {{ readClientContinuity?: () => object, writeClientContinuity?: (d: object) => void }} deps
 * @returns {() => void}
 */
export function installCastlePweLifecycleV0(deps = {}) {
  if (typeof window === "undefined") return () => {};
  hydrateCastlePweFromContinuityV0(deps);

  const onCreate = (ev) => {
    const detail = ev?.detail;
    if (!detail || detail.type !== "CASTLE_CREATE") return;
    spawnCastlePweFromCreateV0(detail, deps);
  };

  window.addEventListener(CASTLE_INIT_EVENT_V0, onCreate);
  return () => window.removeEventListener(CASTLE_INIT_EVENT_V0, onCreate);
}
