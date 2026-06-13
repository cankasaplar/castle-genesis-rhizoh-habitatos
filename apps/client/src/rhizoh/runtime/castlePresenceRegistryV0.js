/**
 * Castle presence registry v0 — live network state from gateway PEER_* + heartbeats.
 */

export const CASTLE_PRESENCE_REGISTRY_SCHEMA_V0 = "castle.presence_registry.v0";
export const CASTLE_NETWORK_PRESENCE_EVENT_V0 = "rhizoh:castle-network-presence-v0";

export const CASTLE_PRESENCE_STATE_V0 = Object.freeze({
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  THINKING: "THINKING",
  BROADCASTING: "BROADCASTING",
  SYNCING: "SYNCING"
});

/** @type {Map<string, object>} */
const presenceByCastleIdV0 = new Map();

function publishPresenceV0() {
  if (typeof window === "undefined") return;
  const rows = listCastlePresenceV0();
  try {
    window.__RHIZOH_CASTLE_PRESENCE__ = Object.freeze(rows);
    window.dispatchEvent(
      new CustomEvent(CASTLE_NETWORK_PRESENCE_EVENT_V0, {
        detail: Object.freeze({ count: rows.length, presence: rows })
      })
    );
  } catch {
    /* noop */
  }
}

/**
 * @param {object} row
 */
export function upsertCastlePresenceV0(row = {}) {
  const castleId = String(row.castleId || row.id || "").trim();
  if (!castleId) return null;
  const merged = Object.freeze({
    castleId,
    userId: String(row.userId || "").slice(0, 128),
    gatewayClientId: String(row.gatewayClientId || row.clientId || "").slice(0, 96),
    state: String(row.state || CASTLE_PRESENCE_STATE_V0.ONLINE).slice(0, 32),
    viewers: Math.max(0, Number(row.viewers) || 0),
    region: String(row.region || "GLOBAL").slice(0, 16),
    lat: Number.isFinite(Number(row.lat)) ? Number(row.lat) : null,
    lon: Number.isFinite(Number(row.lon)) ? Number(row.lon) : null,
    displayName: String(row.displayName || row.name || "").slice(0, 120),
    lastMs: Number(row.lastMs) || Date.now()
  });
  presenceByCastleIdV0.set(castleId, merged);
  publishPresenceV0();
  return merged;
}

/**
 * @param {string} castleId
 */
export function removeCastlePresenceV0(castleId) {
  const id = String(castleId || "").trim();
  if (!id) return;
  presenceByCastleIdV0.delete(id);
  publishPresenceV0();
}

/**
 * @returns {ReadonlyArray<object>}
 */
export function listCastlePresenceV0() {
  return Object.freeze([...presenceByCastleIdV0.values()].map((r) => Object.freeze({ ...r })));
}

function haversineKmV0(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * @param {{ lat?: number, lon?: number, radiusKm?: number, excludeCastleId?: string }} opts
 */
export function listNearbyCastlesV0(opts = {}) {
  const lat = Number(opts.lat);
  const lon = Number(opts.lon);
  const radiusKm = Math.max(1, Number(opts.radiusKm) || 120);
  const exclude = String(opts.excludeCastleId || "").trim();
  const rows = listCastlePresenceV0().filter((row) => {
    if (exclude && row.castleId === exclude) return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return true;
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) return false;
    return haversineKmV0(lat, lon, row.lat, row.lon) <= radiusKm;
  });
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return Object.freeze(
      rows
        .map((row) =>
          Object.freeze({
            ...row,
            distanceKm:
              Number.isFinite(row.lat) && Number.isFinite(row.lon)
                ? haversineKmV0(lat, lon, row.lat, row.lon)
                : null
          })
        )
        .sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999))
    );
  }
  return Object.freeze(rows);
}

export function subscribeCastlePresenceV0(cb) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb(listCastlePresenceV0());
  window.addEventListener(CASTLE_NETWORK_PRESENCE_EVENT_V0, handler);
  return () => window.removeEventListener(CASTLE_NETWORK_PRESENCE_EVENT_V0, handler);
}

/**
 * Merge Firestore remote castles with gateway PEER_* presence rows.
 * @param {ReadonlyArray<object>} remoteCastles
 * @param {ReadonlyArray<object>} presenceRows
 */
export function mergeRemoteCastlesWithNetworkPresenceV0(remoteCastles = [], presenceRows = []) {
  /** @type {Map<string, object>} */
  const byUid = new Map();
  for (const row of remoteCastles || []) {
    const uid = String(row?.id || "").trim();
    if (!uid) continue;
    byUid.set(uid, { ...row, id: uid });
  }
  for (const p of presenceRows || []) {
    const uid = String(p.userId || p.castleId || "").trim();
    if (!uid) continue;
    const existing = byUid.get(uid) || { id: uid };
    byUid.set(
      uid,
      Object.freeze({
        ...existing,
        id: uid,
        displayName: existing.displayName || p.displayName || "",
        lat: Number.isFinite(Number(existing.lat)) ? Number(existing.lat) : p.lat,
        lon: Number.isFinite(Number(existing.lon)) ? Number(existing.lon) : p.lon,
        gatewayClientId: p.gatewayClientId || existing.gatewayClientId || null,
        presenceState: p.state || existing.presenceState,
        presenceViewers: p.viewers ?? existing.presenceViewers ?? 0,
        presenceRegion: p.region || existing.presenceRegion || "GLOBAL",
        presenceLastMs: p.lastMs || existing.presenceLastMs || Date.now()
      })
    );
  }
  return Object.freeze([...byUid.values()]);
}

export function resetCastlePresenceRegistryForTestV0() {
  presenceByCastleIdV0.clear();
}

export function presenceColorForStateV0(state) {
  const s = String(state || "").toUpperCase();
  if (s === CASTLE_PRESENCE_STATE_V0.BROADCASTING) return "#a855f7";
  if (s === CASTLE_PRESENCE_STATE_V0.THINKING) return "#fbbf24";
  if (s === CASTLE_PRESENCE_STATE_V0.SYNCING) return "#38bdf8";
  if (s === CASTLE_PRESENCE_STATE_V0.OFFLINE) return "#94a3b8";
  return "#34d399";
}
