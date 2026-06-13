/**
 * Living Castle Memory v0 — boot identity, hydrate cloud sync, chronicle hooks.
 */

import {
  ensureCastleIdentityV0,
  mergeCastleIdentityFromCloudV0,
  readCastleIdentityV0
} from "./castleIdentityV0.js";
import {
  appendGhostMemoryV0,
  addGhostRelationshipV0,
  ensureGhostMemoryV0,
  mergeGhostMemoryFromCloudV0
} from "./ghostMemoryPersistenceV0.js";
import {
  listCastleChronicleV0,
  mergeCastleChronicleFromCloudV0,
  recordCastleFoundedChronicleV0
} from "./castleChronicleV0.js";
import { CASTLE_CLOUD_SYNC_EVENT_V0 } from "./castleCloudSyncV0.js";
import { importCastleArchiveEntitiesFromCloudV0 } from "./castleArchiveVaultV0.js";

let memoryBootedV0 = false;

/**
 * @param {{ userId?: string, founder?: string, motto?: string }} opts
 */
export function bootLivingCastleMemoryV0(opts = {}) {
  const userId = String(opts.userId || "").trim();
  if (!userId || memoryBootedV0) return readCastleIdentityV0();
  memoryBootedV0 = true;

  const identity = ensureCastleIdentityV0({
    castleId: userId,
    founder: opts.founder || userId,
    motto: opts.motto
  });
  ensureGhostMemoryV0({ ghostId: `ghost_${userId.slice(0, 32)}` });
  recordCastleFoundedChronicleV0({
    castleId: userId,
    founder: identity?.founder,
    title: "Castle Founded",
    body: identity?.motto
  });

  if (typeof window !== "undefined") {
    window.addEventListener(CASTLE_CLOUD_SYNC_EVENT_V0, onCloudSyncHydrateV0);
  }
  return identity;
}

function onCloudSyncHydrateV0(ev) {
  const snapshot = ev?.detail?.snapshot;
  if (!snapshot) return;
  hydrateLivingCastleMemoryFromCloudV0(snapshot);
}

/**
 * @param {object} snapshot — gateway cloud sync snapshot
 */
export function hydrateLivingCastleMemoryFromCloudV0(snapshot = {}) {
  if (snapshot.castleIdentity) mergeCastleIdentityFromCloudV0(snapshot.castleIdentity);
  if (Array.isArray(snapshot.ghostMemory)) mergeGhostMemoryFromCloudV0(snapshot.ghostMemory);
  if (Array.isArray(snapshot.chronicle)) mergeCastleChronicleFromCloudV0(snapshot.chronicle);
  if (Array.isArray(snapshot.knowledge)) mergeRhizohKnowledgeFromCloudV0(snapshot.knowledge);
  if (Array.isArray(snapshot.entities) || Array.isArray(snapshot.events)) {
    importCastleArchiveEntitiesFromCloudV0(snapshot);
  }
  return Object.freeze({
    identity: readCastleIdentityV0(),
    chronicleCount: listCastleChronicleV0().length
  });
}

/**
 * Snapshot slice for cloud push.
 */
export function buildLivingCastleMemoryCloudPatchV0() {
  return Object.freeze({
    castleIdentity: readCastleIdentityV0(),
    chronicle: listCastleChronicleV0()
  });
}

export function rememberGhostNetworkMomentV0(opts = {}) {
  const summary = String(opts.summary || "").trim();
  if (!summary) return null;
  if (opts.peerCastleId) {
    addGhostRelationshipV0({
      peerCastleId: opts.peerCastleId,
      kind: opts.kind || "network",
      note: summary
    });
  }
  return appendGhostMemoryV0({
    summary,
    tags: opts.tags || ["network"],
    peerCastleId: opts.peerCastleId
  });
}

export function resetLivingCastleMemoryBootForTestV0() {
  memoryBootedV0 = false;
  if (typeof window !== "undefined") {
    window.removeEventListener(CASTLE_CLOUD_SYNC_EVENT_V0, onCloudSyncHydrateV0);
  }
}
