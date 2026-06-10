/**
 * Castle Room Arbitration Layer v1.2 — multi-agent reality arbiter.
 * "Whose reality is active?" — identity-aware conflict resolution.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_2.md
 */

import { logVoiceInfoV0 } from "../rhizoh/runtime/rhizohProductionLogNamespacesV0.js";
import { SOURCE_PRIORITY_V1 } from "./castleRealtimeArbitrationV1.js";
import {
  getRoomRealityV1_2,
  getSharedAttentionFieldV1_2,
  setActiveRealityOwnerV1_2
} from "./castleRoomRealityV1_2.js";
import {
  getConversationThreadPriorityV1_2,
  getActiveThreadsV1_2
} from "./castleConversationThreadV1_2.js";

export const CASTLE_ROOM_ARBITRATION_SCHEMA_V1_2 = "castle.room_arbitration.v1.2";

export const ROOM_ARBITRATION_DISPOSITION_V1_2 = Object.freeze({
  GRANT: "grant",
  DEFER: "defer",
  YIELD: "yield"
});

/**
 * Build conflict candidates from room shared attention + current ingress.
 * @param {object} input
 */
export function collectRoomConflictCandidatesV1_2(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const windowMs = 15_000;
  const byOwner = getSharedAttentionFieldV1_2();
  /** @type {object[]} */
  const candidates = [];

  for (const [ownerId, events] of Object.entries(byOwner)) {
    const recent = events.filter((e) => atMs - e.timestamp <= windowMs);
    const top = recent.sort((a, b) => b.salience - a.salience)[0];
    if (!top) continue;
    candidates.push(
      Object.freeze({
        ownerId,
        eventId: top.eventId,
        threadId: top.threadId,
        priority: resolveCandidatePriorityV1_2(top, input),
        salience: top.salience,
        preview: top.preview,
        type: top.type,
        atMs: top.timestamp
      })
    );
  }

  if (input.identityEvent) {
    const ie = input.identityEvent;
    const exists = candidates.some((c) => c.ownerId === ie.ownerId);
    if (!exists) {
      candidates.push(
        Object.freeze({
          ownerId: ie.ownerId,
          eventId: ie.eventId,
          threadId: ie.threadId,
          priority: resolveCandidatePriorityV1_2(ie, input),
          salience: ie.salience,
          preview: ie.preview,
          type: ie.type,
          atMs: ie.timestamp
        })
      );
    }
  }

  return Object.freeze(candidates.sort((a, b) => b.priority - a.priority));
}

function resolveCandidatePriorityV1_2(event, input) {
  let p = 40;
  if (event.type === "emergency") p = SOURCE_PRIORITY_V1.EMERGENCY;
  else if (event.type === "intent") p = SOURCE_PRIORITY_V1.LIVE_INTERACTION;
  else if (event.type === "reference") p = SOURCE_PRIORITY_V1.MEDIA_CONTENT;
  if (event.threadId) {
    p = Math.max(p, getConversationThreadPriorityV1_2(event.threadId));
  }
  if (input.spike?.salienceScore) {
    p = Math.max(p, Math.round(input.spike.salienceScore * 100));
  }
  return p;
}

/**
 * resolveConflict — same priority → owner affinity → thread → recency.
 * @param {object[]} candidates
 * @param {object} context
 */
export function resolveRoomConflictV1_2(candidates, context = {}) {
  if (!candidates.length) {
    return Object.freeze({ winner: null, reason: "no_candidates" });
  }

  const localUserId = String(context.localUserId || getRoomRealityV1_2().activeRealityOwnerId || "user_local");
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);
  const topPriority = sorted[0].priority;
  const tied = sorted.filter((c) => c.priority === topPriority);

  if (tied.length === 1) {
    return Object.freeze({ winner: tied[0], reason: "priority_unique", tiedCount: 1 });
  }

  let winner = applyOwnerAffinityV1_2(tied, localUserId);
  if (winner) {
    return Object.freeze({ winner, reason: "owner_affinity", tiedCount: tied.length });
  }

  winner = applyConversationThreadPriorityV1_2(tied);
  if (winner) {
    return Object.freeze({ winner, reason: "thread_priority", tiedCount: tied.length });
  }

  winner = applyRecencyBiasV1_2(tied);
  return Object.freeze({ winner, reason: "recency_bias", tiedCount: tied.length });
}

function applyOwnerAffinityV1_2(candidates, localUserId) {
  const local = candidates.find((c) => c.ownerId === localUserId);
  if (local) return local;
  const room = getRoomRealityV1_2();
  const host = candidates.find((c) =>
    room.users?.some((u) => u.userId === c.ownerId && u.role === "host")
  );
  return host || null;
}

function applyConversationThreadPriorityV1_2(candidates) {
  let best = null;
  let bestTp = 0;
  for (const c of candidates) {
    if (!c.threadId) continue;
    const tp = getConversationThreadPriorityV1_2(c.threadId);
    if (tp > bestTp) {
      bestTp = tp;
      best = c;
    }
  }
  return best;
}

function applyRecencyBiasV1_2(candidates) {
  return [...candidates].sort((a, b) => b.atMs - a.atMs)[0];
}

/**
 * Room-level arbitration before v1.1 realtime layer.
 * @param {object} input
 */
export function arbitrateRoomRealityV1_2(input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const ingressOwner = String(
    input.identityEvent?.ownerId || input.ingressOwnerId || input.ownerId || "user_local"
  );
  const localUserId = String(
    input.localUserId || getRoomRealityV1_2().activeRealityOwnerId || ingressOwner
  );
  const candidates = collectRoomConflictCandidatesV1_2({
    identityEvent: input.identityEvent,
    spike: input.spike,
    atMs
  });

  const resolution = resolveRoomConflictV1_2(candidates, { localUserId, atMs });
  const winner = resolution.winner;

  if (!winner) {
    return Object.freeze({
      schema: CASTLE_ROOM_ARBITRATION_SCHEMA_V1_2,
      disposition: ROOM_ARBITRATION_DISPOSITION_V1_2.YIELD,
      gatedActionPlan: input.actionPlan,
      activeRealityOwnerId: getRoomRealityV1_2().activeRealityOwnerId,
      reason: "no_conflict_winner",
      candidates
    });
  }

  setActiveRealityOwnerV1_2(winner.ownerId);

  const granted = winner.ownerId === ingressOwner;
  let disposition = ROOM_ARBITRATION_DISPOSITION_V1_2.GRANT;
  let gatedActionPlan = input.actionPlan;

  if (!granted) {
    disposition = ROOM_ARBITRATION_DISPOSITION_V1_2.DEFER;
    gatedActionPlan = Object.freeze({
      ...input.actionPlan,
      speak: false,
      reason: `room_yield_${winner.ownerId}`,
      deferredToOwner: winner.ownerId
    });
  } else if (candidates.length > 1 && winner.ownerId !== ingressOwner) {
    disposition = ROOM_ARBITRATION_DISPOSITION_V1_2.YIELD;
  }

  logVoiceInfoV0("ROOM_ARBITRATION", {
    disposition,
    winner: winner.ownerId,
    ingressOwner,
    reason: resolution.reason,
    candidateCount: candidates.length,
    activeThreadCount: getActiveThreadsV1_2().length
  });

  return Object.freeze({
    schema: CASTLE_ROOM_ARBITRATION_SCHEMA_V1_2,
    disposition,
    gatedActionPlan,
    winner,
    resolution,
    candidates,
    activeRealityOwnerId: winner.ownerId,
    identityEvent: input.identityEvent,
    reason: resolution.reason
  });
}

export function getRoomArbitrationSnapshotV1_2() {
  return Object.freeze({
    schema: CASTLE_ROOM_ARBITRATION_SCHEMA_V1_2,
    room: getRoomRealityV1_2(),
    sharedAttention: getSharedAttentionFieldV1_2(),
    threads: getActiveThreadsV1_2()
  });
}

/** @internal vitest */
export function __resetRoomArbitrationForTestV1_2() {
  /* room + thread resets handled in their modules */
}
