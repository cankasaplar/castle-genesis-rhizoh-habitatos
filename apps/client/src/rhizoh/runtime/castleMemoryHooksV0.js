/**
 * Castle memory hooks v0 — chronicle + ghost memory from network, chess, library events.
 */

import { CASTLE_NETWORK_PRESENCE_EVENT_V0 } from "./castlePresenceRegistryV0.js";
import { CASTLE_CLOUD_SYNC_EVENT_V0 } from "./castleCloudSyncV0.js";
import { RHIZOH_OPEN_LIBRARY_EVENT_V1 } from "./symbyoMapIntentBridgeV0.js";
import { CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0, CASTLE_C2C_MESSAGE_TYPE_V0 } from "../castleSocial/castleC2cRealtimeBusV0.js";
import {
  incrementCastleIdentityStatV0,
  readCastleIdentityV0
} from "./castleIdentityV0.js";
import {
  recordChessMatchChronicleV0,
  recordFirstContactChronicleV0,
  recordLibraryWingChronicleV0,
  appendCastleChronicleEntryV0,
  CASTLE_CHRONICLE_KIND_V0
} from "./castleChronicleV0.js";
import { rememberGhostNetworkMomentV0 } from "./livingCastleMemoryV0.js";

/** @type {Set<string>} */
const seenPeerCastlesV0 = new Set();
let hooksInstalledV0 = false;
let localCastleIdV0 = "";

function onPresenceV0(ev) {
  const localId = localCastleIdV0;
  const rows = ev?.detail?.presence || [];
  for (const row of rows) {
    const peerId = String(row.userId || row.castleId || "").trim();
    if (!peerId || peerId === localId || seenPeerCastlesV0.has(peerId)) continue;
    seenPeerCastlesV0.add(peerId);
    recordFirstContactChronicleV0({
      peerCastleId: peerId,
      peerName: row.displayName || peerId.slice(0, 8),
      region: row.region
    });
    incrementCastleIdentityStatV0("firstContacts", 1);
    incrementCastleIdentityStatV0("visitors", 1);
    rememberGhostNetworkMomentV0({
      peerCastleId: peerId,
      kind: "first_contact",
      summary: `First contact with castle ${peerId.slice(0, 8)}`,
      tags: ["first_contact", "network"]
    });
  }
}

function onLibraryOpenV0() {
  const entry = recordLibraryWingChronicleV0({ source: "map_library" });
  if (entry) incrementCastleIdentityStatV0("libraryWingsOpened", 1);
}

function onCloudSyncV0(ev) {
  if (ev?.detail?.direction !== "push" || !ev?.detail?.snapshot) return;
  appendCastleChronicleEntryV0({
    kind: CASTLE_CHRONICLE_KIND_V0.SYNC,
    title: "Cloud Memory Synced",
    body: "Castle archive, identity, and chronicle merged with gateway vault.",
    dedupeKey: `chronicle:sync:${ev.detail.snapshot.updatedAt || Date.now()}`
  });
}

function onC2cRealtimeV0(ev) {
  const detail = ev?.detail;
  if (detail?.type !== CASTLE_C2C_MESSAGE_TYPE_V0.CHESS_MOVE) return;
  const matchId = detail?.payload?.matchId;
  const peerUid = String(detail?.peerUid || detail?.payload?.peerUid || "").trim();
  if (!matchId || !peerUid) return;
}

/**
 * Call when local chess game completes.
 * @param {{ opponentCastleId?: string, matchId?: string, won?: boolean, draw?: boolean }} opts
 */
export function recordLocalChessOutcomeV0(opts = {}) {
  const opponent = String(opts.opponentCastleId || "opponent").slice(0, 64);
  recordChessMatchChronicleV0({
    opponentCastleId: opponent,
    matchId: opts.matchId,
    won: opts.won === true,
    body: opts.draw ? "Draw on the neural chess board." : undefined
  });
  incrementCastleIdentityStatV0("matchesPlayed", 1);
  rememberGhostNetworkMomentV0({
    peerCastleId: opponent,
    kind: "chess",
    summary: opts.won
      ? `Won chess match against ${opponent.slice(0, 8)}`
      : `Played chess with ${opponent.slice(0, 8)}`,
    tags: ["chess", opts.won ? "victory" : "match"]
  });
}

/**
 * @param {string} castleId
 */
export function installCastleMemoryHooksV0(castleId) {
  if (typeof window === "undefined" || hooksInstalledV0) return;
  hooksInstalledV0 = true;
  localCastleIdV0 = String(castleId || readCastleIdentityV0()?.castleId || "").trim();
  window.addEventListener(CASTLE_NETWORK_PRESENCE_EVENT_V0, onPresenceV0);
  window.addEventListener(RHIZOH_OPEN_LIBRARY_EVENT_V1, onLibraryOpenV0);
  window.addEventListener(CASTLE_CLOUD_SYNC_EVENT_V0, onCloudSyncV0);
  window.addEventListener(CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0, onC2cRealtimeV0);
}

export function disposeCastleMemoryHooksV0() {
  if (typeof window === "undefined" || !hooksInstalledV0) return;
  hooksInstalledV0 = false;
  seenPeerCastlesV0.clear();
  localCastleIdV0 = "";
  window.removeEventListener(CASTLE_NETWORK_PRESENCE_EVENT_V0, onPresenceV0);
  window.removeEventListener(RHIZOH_OPEN_LIBRARY_EVENT_V1, onLibraryOpenV0);
  window.removeEventListener(CASTLE_CLOUD_SYNC_EVENT_V0, onCloudSyncV0);
  window.removeEventListener(CASTLE_C2C_REALTIME_MESSAGE_EVENT_V0, onC2cRealtimeV0);
}

export function resetCastleMemoryHooksForTestV0() {
  disposeCastleMemoryHooksV0();
  seenPeerCastlesV0.clear();
}
