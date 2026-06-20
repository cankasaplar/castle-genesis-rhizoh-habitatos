/**
 * Shadow Castle peer registry — real remote castles + bound C2C reaction target.
 * RESEARCH-ONLY · aligns with SESSION_GRAPH_V1 CastleNode + SessionEdge
 * @see docs/SESSION_GRAPH_V1.md
 */

import { PEER_CASTLE_SIM_ID_V0, PEER_CASTLE_SIM_COORDS_V0 } from "./shadowCastleEventBusV0.js";
import { resolveUserCastleGeoForMapViewV0 } from "./worldMapBootstrapGeoV0.js";

export const SHADOW_CASTLE_PEER_REGISTRY_SCHEMA_V0 = "castle.rhizoh.shadow_peer_registry.v0";
export const SHADOW_CASTLE_PEER_REGISTRY_EVENT_V0 = "rhizoh:shadow-castle-peer-registry-v0";

/** @type {object[]} */
let remoteCastlesV0 = [];
/** @type {object | null} */
let boundPeerV0 = null;
let remoteCastlesVisibleV0 = false;

/**
 * @param {string} uid
 */
export function remoteCastlePinIdV0(uid) {
  const id = String(uid || "").trim();
  return id ? `remote_castle_${id}` : "";
}

/**
 * @param {string} pinId
 */
export function parseRemoteCastleUidFromPinIdV0(pinId) {
  const raw = String(pinId || "");
  return raw.startsWith("remote_castle_") ? raw.slice("remote_castle_".length) : null;
}

function haversineKmV0(a, b) {
  const lat1 = Number(a?.lat);
  const lon1 = Number(a?.lon);
  const lat2 = Number(b?.lat);
  const lon2 = Number(b?.lon);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}

function notifyRegistryListenersV0() {
  if (typeof globalThis === "undefined" || !globalThis.dispatchEvent) return;
  globalThis.dispatchEvent(
    new CustomEvent(SHADOW_CASTLE_PEER_REGISTRY_EVENT_V0, {
      detail: getShadowCastlePeerRegistrySnapshotV0()
    })
  );
}

/**
 * @param {{ remoteCastles?: object[], boundPeer?: object | null }} row
 */
export function publishShadowCastlePeerRegistryV0(row = {}) {
  if (Array.isArray(row.remoteCastles)) {
    remoteCastlesV0 = row.remoteCastles.map((r) => Object.freeze({ ...r }));
  }
  if (row.remoteCastlesVisible !== undefined) {
    remoteCastlesVisibleV0 = row.remoteCastlesVisible === true;
  }
  if (row.boundPeer !== undefined) {
    boundPeerV0 = row.boundPeer ? Object.freeze({ ...row.boundPeer }) : null;
  }
  notifyRegistryListenersV0();
  return getShadowCastlePeerRegistrySnapshotV0();
}

/**
 * Bind reaction target when user clicks a remote castle pin (C2C bridge).
 * @param {object} peerDetail
 */
export function bindShadowCastleReactionPeerV0(peerDetail) {
  if (!peerDetail?.uid) return null;
  const uid = String(peerDetail.uid);
  boundPeerV0 = Object.freeze({
    uid,
    pinId: remoteCastlePinIdV0(uid),
    lat: Number(peerDetail.lat),
    lon: Number(peerDetail.lon),
    displayName: String(peerDetail.displayName || peerDetail.name || "").trim() || null,
    gatewayClientId: peerDetail.gatewayClientId ? String(peerDetail.gatewayClientId) : null,
    boundAtMs: Date.now(),
    source: "remote_castle_click"
  });
  notifyRegistryListenersV0();
  return boundPeerV0;
}

export function clearShadowCastleReactionPeerV0() {
  boundPeerV0 = null;
  notifyRegistryListenersV0();
}

/**
 * Bind sim peer as explicit reaction target (solo / no Firestore peers).
 */
export function bindShadowCastleSimPeerV0() {
  boundPeerV0 = Object.freeze({
    uid: null,
    pinId: PEER_CASTLE_SIM_ID_V0,
    lat: PEER_CASTLE_SIM_COORDS_V0.lat,
    lon: PEER_CASTLE_SIM_COORDS_V0.lon,
    displayName: "Peer Castle · Istanbul Sim",
    isSim: true,
    boundAtMs: Date.now(),
    source: "sim_peer_bind"
  });
  notifyRegistryListenersV0();
  return boundPeerV0;
}

export function readBoundShadowCastlePeerV0() {
  return boundPeerV0;
}

export function listShadowRemoteCastlesV0() {
  return Object.freeze([...remoteCastlesV0]);
}

/**
 * Resolve where a shadow reaction should land (real peer preferred over sim).
 * @param {{ toCastleId?: string | null, preferSim?: boolean }} [opts]
 */
export function resolveShadowReactionTargetV0(opts = {}) {
  const explicit = String(opts.toCastleId || "").trim();
  if (explicit && explicit !== PEER_CASTLE_SIM_ID_V0) {
    const uid = parseRemoteCastleUidFromPinIdV0(explicit);
    const remote = uid ? remoteCastlesV0.find((r) => String(r.id) === uid) : null;
    if (remote && Number.isFinite(Number(remote.lat)) && Number.isFinite(Number(remote.lon))) {
      return Object.freeze({
        pinId: explicit,
        uid,
        lat: Number(remote.lat),
        lon: Number(remote.lon),
        displayName: remote.displayName || null,
        isSim: false,
        source: "explicit_toCastleId"
      });
    }
    if (boundPeerV0 && boundPeerV0.pinId === explicit) {
      return Object.freeze({
        pinId: explicit,
        uid: boundPeerV0.uid,
        lat: boundPeerV0.lat,
        lon: boundPeerV0.lon,
        displayName: boundPeerV0.displayName,
        isSim: false,
        source: "explicit_bound_peer"
      });
    }
  }

  if (!opts.preferSim && boundPeerV0?.isSim) {
    return Object.freeze({
      pinId: PEER_CASTLE_SIM_ID_V0,
      uid: null,
      lat: PEER_CASTLE_SIM_COORDS_V0.lat,
      lon: PEER_CASTLE_SIM_COORDS_V0.lon,
      displayName: boundPeerV0.displayName || "Peer Castle · Istanbul Sim",
      isSim: true,
      source: "bound_sim_peer"
    });
  }

  if (!opts.preferSim && boundPeerV0?.uid) {
    return Object.freeze({
      pinId: boundPeerV0.pinId,
      uid: boundPeerV0.uid,
      lat: boundPeerV0.lat,
      lon: boundPeerV0.lon,
      displayName: boundPeerV0.displayName,
      isSim: false,
      source: "bound_peer"
    });
  }

  if (!opts.preferSim && remoteCastlesVisibleV0 && remoteCastlesV0.length) {
    const origin = resolveUserCastleGeoForMapViewV0();
    const candidates = remoteCastlesV0.filter(
      (r) => Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lon))
    );
    const nearest =
      origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lon)
        ? [...candidates].sort((a, b) => haversineKmV0(origin, a) - haversineKmV0(origin, b))[0]
        : candidates[0];
    if (nearest) {
      return Object.freeze({
        pinId: remoteCastlePinIdV0(nearest.id),
        uid: String(nearest.id),
        lat: Number(nearest.lat),
        lon: Number(nearest.lon),
        displayName: nearest.displayName || null,
        isSim: false,
        source: "nearest_remote"
      });
    }
  }

  return Object.freeze({
    pinId: PEER_CASTLE_SIM_ID_V0,
    uid: null,
    lat: PEER_CASTLE_SIM_COORDS_V0.lat,
    lon: PEER_CASTLE_SIM_COORDS_V0.lon,
    displayName: "Peer Castle · Istanbul Sim",
    isSim: true,
    source: "sim_fallback"
  });
}

export function shouldShowShadowPeerSimPinV0() {
  if (boundPeerV0?.uid) return false;
  if (remoteCastlesV0.length > 0 && remoteCastlesVisibleV0) return false;
  return true;
}

export function getShadowCastlePeerRegistrySnapshotV0() {
  return Object.freeze({
    schema: `${SHADOW_CASTLE_PEER_REGISTRY_SCHEMA_V0}.snapshot`,
    remoteCount: remoteCastlesV0.length,
    remoteCastlesVisible: remoteCastlesVisibleV0,
    boundPeer: boundPeerV0,
    reactionTarget: resolveShadowReactionTargetV0(),
    showSimPin: shouldShowShadowPeerSimPinV0(),
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetShadowCastlePeerRegistryForTestV0() {
  remoteCastlesV0 = [];
  boundPeerV0 = null;
  remoteCastlesVisibleV0 = false;
}
