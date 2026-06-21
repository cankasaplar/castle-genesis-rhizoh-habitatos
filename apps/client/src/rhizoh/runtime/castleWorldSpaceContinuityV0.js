/**
 * World · Space castle anchor — persist to rhizoh.continuity.v1 and hydrate on boot.
 * Deploy does not clear localStorage; session globals are restored here.
 */

const CONTINUITY_KEY_V0 = "rhizoh.continuity.v1";

/**
 * @param {{ readClientContinuity?: () => object, writeClientContinuity?: (d: object) => void }} io
 */
function readDiskV0(io) {
  if (typeof io.readClientContinuity === "function") return io.readClientContinuity();
  try {
    const raw = window.localStorage.getItem(CONTINUITY_KEY_V0) || "";
    if (!raw) return { turns: [], persona: {}, meta: {} };
    const parsed = JSON.parse(raw);
    return {
      turns: Array.isArray(parsed?.turns) ? parsed.turns : [],
      persona: parsed?.persona && typeof parsed.persona === "object" ? parsed.persona : {},
      meta: parsed?.meta && typeof parsed.meta === "object" ? parsed.meta : {}
    };
  } catch {
    return { turns: [], persona: {}, meta: {} };
  }
}

/**
 * @param {object} next
 * @param {{ writeClientContinuity?: (d: object) => void }} io
 */
function writeDiskV0(next, io) {
  if (typeof io.writeClientContinuity === "function") {
    io.writeClientContinuity(next);
    return;
  }
  try {
    window.localStorage.setItem(CONTINUITY_KEY_V0, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

/**
 * Persist geo anchor after kale kur (world space path).
 * @param {number} lat
 * @param {number} lon
 * @param {{ owner?: string, source?: string, readClientContinuity?: () => object, writeClientContinuity?: (d: object) => void }} [opts]
 */
export function persistWorldSpaceCastleAnchorV0(lat, lon, opts = {}) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

  const disk = readDiskV0(opts);
  const meta = { ...(disk.meta || {}) };
  const prevPet = meta.ghostPet && typeof meta.ghostPet === "object" ? meta.ghostPet : {};
  meta.ghostPet = {
    ...prevPet,
    mood: "guard",
    castleLat: lat,
    castleLon: lon,
    guardSince: Date.now(),
    lastCastleSpawnAt: Date.now()
  };
  const prevCs = meta.castleState && typeof meta.castleState === "object" ? meta.castleState : {};
  if (prevCs.phase === "PURGED") {
    return;
  }
  meta.castleState = {
    ...prevCs,
    phase: "SEED",
    anchorLat: lat,
    anchorLon: lon,
    owner: opts.owner || prevCs.owner || "GUEST",
    castleType: prevCs.castleType || "SANCTUARY",
    updatedAt: Date.now(),
    source: opts.source || "world_space_anchor"
  };
  const log = Array.isArray(meta.realityLog) ? meta.realityLog.slice() : [];
  log.push({
    at: Date.now(),
    note: `Kale SEED · ${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`,
    source: opts.source || "world_space_anchor"
  });
  meta.realityLog = log.slice(-24);
  writeDiskV0({ ...disk, meta }, opts);

  window.__CASTLE_NEXUS_GEO__ = { mode: "geo", lat, lon, source: opts.source || "continuity" };
  window.__CASTLE_CLIENT_CASTLE_STATE__ = "ACTIVE";
}

/**
 * Restore session geo from continuity when user already built a castle.
 * @param {{ readClientContinuity?: () => object }} [opts]
 * @returns {boolean} hydrated
 */
/**
 * @param {{ readClientContinuity?: () => object }} [opts]
 * @returns {boolean}
 */
export function hasPersistedWorldSpaceCastleV0(opts = {}) {
  if (typeof window === "undefined") return false;
  const disk = readDiskV0(opts);
  const cs = disk?.meta?.castleState;
  if (cs?.phase === "PURGED") return false;
  const lat = Number(cs?.anchorLat ?? disk?.meta?.ghostPet?.castleLat);
  const lon = Number(cs?.anchorLon ?? disk?.meta?.ghostPet?.castleLon);
  return Number.isFinite(lat) && Number.isFinite(lon);
}

export function hydrateWorldSpaceCastleAnchorV0(opts = {}) {
  if (typeof window === "undefined") return false;
  if (window.__CASTLE_NEXUS_GEO__?.lat != null && window.__CASTLE_NEXUS_GEO__?.lon != null) {
    return true;
  }

  const disk = readDiskV0(opts);
  const cs = disk?.meta?.castleState;
  if (cs?.phase === "PURGED") return false;

  const lat = Number(cs?.anchorLat ?? disk?.meta?.ghostPet?.castleLat);
  const lon = Number(cs?.anchorLon ?? disk?.meta?.ghostPet?.castleLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;

  window.__CASTLE_NEXUS_GEO__ = { mode: "geo", lat, lon, source: "continuity_hydrate" };
  window.__CASTLE_CLIENT_CASTLE_STATE__ = "ACTIVE";
  return true;
}
