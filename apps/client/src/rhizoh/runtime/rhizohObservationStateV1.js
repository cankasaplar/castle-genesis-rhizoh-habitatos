/**
 * Rhizoh Observation State v1 — aggregates truth + broadcast signals into UI contract.
 * RESEARCH-ONLY · interpretation-only · proof visibility (not execution).
 * @see docs/RHIZOH_PRODUCTION_OBSERVATION_LAYER_V1.md
 */

import { getMatchSessionSyncSnapshotV0, isMatchRealitySyncActiveV0 } from "./matchSessionSyncBridgeV0.js";
import { getMatchmakingTruthSnapshotV0 } from "./matchmakingTruthKernelV0.js";
import { projectMatchTruthToUiV0 } from "./matchTruthUiProjectionV0.js";
import { getMatchGatewayWsStatusV0 } from "./matchmakingGatewayWsV0.js";

export const RHIZOH_OBSERVATION_STATE_SCHEMA_V1 = "castle.rhizoh.observation_state.v1";

export const INSTRUMENTATION_TIER_V1 = Object.freeze({
  TRUTH_ONLY: "truth_only",
  BROADCAST_PARTIAL: "broadcast_partial",
  BROADCAST_FULL: "broadcast_full"
});

/** @type {{ lastPresence: object | null, lastBroadcast: object | null, localAckCount: number, driftEvents: number, commitEvents: number, lastGatewayServerSeq: number, lastGatewayFenHash: string | null }} */
const broadcastVisStoreV1 = {
  lastPresence: null,
  lastBroadcast: null,
  localAckCount: 0,
  driftEvents: 0,
  commitEvents: 0,
  lastGatewayServerSeq: 0,
  lastGatewayFenHash: null
};

const subscribersV1 = new Set();

function fnv1aHashV0(str) {
  let h = 0x811c9dc5;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `fnv1a:${(h >>> 0).toString(16).padStart(8, "0")}`;
}

function readEventSeqV0(truthSnap) {
  const log = truthSnap?.truthLog;
  if (Array.isArray(log)) return log.length;
  const events = truthSnap?.events;
  if (Array.isArray(events)) return events.length;
  return 0;
}

function resolveInstrumentationTierV0(broadcast) {
  if (broadcast.ackCount > 0 && broadcast.recipientCount > 0 && broadcast.ackRate === 1) {
    return INSTRUMENTATION_TIER_V1.BROADCAST_FULL;
  }
  if (broadcast.delivered > 0 || broadcast.recipientCount > 0) {
    return INSTRUMENTATION_TIER_V1.BROADCAST_PARTIAL;
  }
  return INSTRUMENTATION_TIER_V1.TRUTH_ONLY;
}

/**
 * Record gateway/client broadcast visibility (called from transport hooks).
 * @param {{ commitSeq?: number, delivered?: number, recipientCount?: number, presence?: object }} patch
 */
export function recordBroadcastVisibilityV1(patch = {}) {
  if (patch.presence) {
    broadcastVisStoreV1.lastPresence = patch.presence;
  }
  if (typeof patch.commitSeq === "number") {
    broadcastVisStoreV1.commitEvents += 1;
    broadcastVisStoreV1.lastBroadcast = {
      ...(broadcastVisStoreV1.lastBroadcast || {}),
      commitSeq: patch.commitSeq,
      broadcastSeq: patch.broadcastSeq ?? patch.commitSeq,
      delivered: patch.delivered ?? broadcastVisStoreV1.lastBroadcast?.delivered ?? 0,
      recipientCount:
        patch.recipientCount ??
        patch.presence?.count ??
        broadcastVisStoreV1.lastPresence?.count ??
        0
    };
  }
  if (typeof patch.gatewayServerSeq === "number" && patch.gatewayServerSeq > 0) {
    broadcastVisStoreV1.lastGatewayServerSeq = patch.gatewayServerSeq;
  }
  if (patch.gatewayFen) {
    broadcastVisStoreV1.lastGatewayFenHash = fnv1aHashV0(patch.gatewayFen);
  }
  if (typeof patch.delivered === "number" || typeof patch.recipientCount === "number") {
    broadcastVisStoreV1.lastBroadcast = {
      ...(broadcastVisStoreV1.lastBroadcast || {}),
      delivered: patch.delivered ?? broadcastVisStoreV1.lastBroadcast?.delivered ?? 0,
      recipientCount:
        patch.recipientCount ??
        broadcastVisStoreV1.lastBroadcast?.recipientCount ??
        broadcastVisStoreV1.lastPresence?.count ??
        0,
      broadcastSeq:
        broadcastVisStoreV1.lastBroadcast?.broadcastSeq ??
        broadcastVisStoreV1.lastBroadcast?.commitSeq ??
        0
    };
  }
  if (patch.driftDetected) {
    broadcastVisStoreV1.driftEvents += 1;
  }
  if (patch.localAck) {
    broadcastVisStoreV1.localAckCount += 1;
  }
  notifyObservationSubscribersV1();
}

/** @internal vitest */
export function resetBroadcastVisibilityForTestV1() {
  broadcastVisStoreV1.lastPresence = null;
  broadcastVisStoreV1.lastBroadcast = null;
  broadcastVisStoreV1.localAckCount = 0;
  broadcastVisStoreV1.driftEvents = 0;
  broadcastVisStoreV1.commitEvents = 0;
  broadcastVisStoreV1.lastGatewayServerSeq = 0;
  broadcastVisStoreV1.lastGatewayFenHash = null;
}

function notifyObservationSubscribersV1() {
  const snap = buildRhizohObservationStateV1();
  for (const fn of subscribersV1) {
    try {
      fn(snap);
    } catch {
      /* noop */
    }
  }
}

/**
 * Build RHIZOH_OBSERVATION_STATE_V1 from live runtime signals.
 * @param {{ proofMode?: boolean }} [opts]
 */
export function buildRhizohObservationStateV1(opts = {}) {
  const syncSnap = getMatchSessionSyncSnapshotV0();
  const truthSnap = getMatchmakingTruthSnapshotV0();
  const projection = projectMatchTruthToUiV0();
  const ws = getMatchGatewayWsStatusV0();

  const sessionId = syncSnap.sessionId || truthSnap?.activeSession?.sessionId || null;
  const commitSeq =
    projection.serverSeq ??
    truthSnap?.activeSession?.committed?.serverSeq ??
    broadcastVisStoreV1.lastBroadcast?.commitSeq ??
    0;
  const eventSeq = readEventSeqV0(truthSnap);
  const projectionVersion = commitSeq;
  const fen = projection.fen || truthSnap?.activeSession?.committed?.fen || null;

  const recipientCount =
    broadcastVisStoreV1.lastBroadcast?.recipientCount ??
    broadcastVisStoreV1.lastPresence?.count ??
    (ws.open ? 1 : 0);
  const delivered = broadcastVisStoreV1.lastBroadcast?.delivered ?? (ws.open ? 1 : 0);
  const ackCount = broadcastVisStoreV1.localAckCount;
  const ackRate =
    recipientCount > 0 ? Math.min(1, ackCount / recipientCount) : null;

  const committedFen = truthSnap?.activeSession?.committed?.fen;
  const syncActive = isMatchRealitySyncActiveV0();
  const gatewaySeq = broadcastVisStoreV1.lastGatewayServerSeq ?? 0;
  const localFenHash = fen ? fnv1aHashV0(fen) : null;
  const gatewayFenHash = broadcastVisStoreV1.lastGatewayFenHash;
  const projectionConsistency = (() => {
    if (!fen) return false;
    if (syncActive && gatewaySeq > 0 && commitSeq < gatewaySeq) return false;
    if (syncActive && gatewayFenHash && localFenHash && gatewayFenHash !== localFenHash) return false;
    if (committedFen) return fnv1aHashV0(fen) === fnv1aHashV0(committedFen);
    if (syncActive && commitSeq === 0 && gatewaySeq === 0) return true;
    if (syncActive && commitSeq === 0) return false;
    return commitSeq > 0;
  })();

  const driftDetected = Boolean(truthSnap?.activeSession?.drift?.detected);
  const driftRate =
    broadcastVisStoreV1.commitEvents > 0
      ? broadcastVisStoreV1.driftEvents / broadcastVisStoreV1.commitEvents
      : null;

  const broadcast = Object.freeze({
    broadcastSeq: broadcastVisStoreV1.lastBroadcast?.broadcastSeq ?? commitSeq,
    recipientCount,
    delivered,
    ackCount,
    ackRate
  });

  const instrumentationTier = resolveInstrumentationTierV0(broadcast);

  const proofMode =
    opts.proofMode === true ||
    (typeof window !== "undefined" &&
      (new URLSearchParams(window.location.search).get("proof") === "1" ||
        String(import.meta.env?.VITE_RHIZOH_PROOF_MODE ?? "") === "1"));

  return Object.freeze({
    schema: RHIZOH_OBSERVATION_STATE_SCHEMA_V1,
    atMs: Date.now(),
    sessionId,
    truth: Object.freeze({
      commitSeq,
      eventSeq,
      projectionVersion,
      fen,
      serverSeq: commitSeq
    }),
    broadcast,
    sync: Object.freeze({
      projectionConsistency,
      driftDetected,
      lastSyncMs: syncSnap.atMs || Date.now(),
      driftRate,
      catchUpLag:
        syncActive && gatewaySeq > 0 && commitSeq < gatewaySeq
          ? "awaiting_gateway_seq"
          : syncActive && commitSeq === 0 && eventSeq > 0
            ? "awaiting_snapshot"
            : null
    }),
    reality: Object.freeze({
      clientsInSync: recipientCount > 0 && projectionConsistency ? Math.min(recipientCount, 2) : ws.open ? 1 : 0,
      sharedStateHash: fen ? fnv1aHashV0(fen) : null,
      instrumentationTier,
      wsOpen: Boolean(ws.open),
      syncActive: isMatchRealitySyncActiveV0()
    }),
    narrative: Object.freeze({
      mode: proofMode ? "proof" : "demo",
      label: proofMode
        ? "Two-client state proof — not a game demo"
        : "Rhizoh research preview — enable ?proof=1 for observation layer"
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function subscribeRhizohObservationStateV1(fn) {
  if (typeof fn !== "function") return () => {};
  subscribersV1.add(fn);
  return () => subscribersV1.delete(fn);
}

export function isRhizohProofModeEnabledV1() {
  if (typeof window === "undefined") return false;
  return (
    new URLSearchParams(window.location.search).get("proof") === "1" ||
    String(import.meta.env?.VITE_RHIZOH_PROOF_MODE ?? "") === "1"
  );
}

let observationConsoleMountedV1 = false;

export function mountRhizohObservationStateConsoleV1() {
  if (typeof window === "undefined" || observationConsoleMountedV1) return;
  observationConsoleMountedV1 = true;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.observationState = Object.freeze({
    schema: RHIZOH_OBSERVATION_STATE_SCHEMA_V1,
    snapshot: buildRhizohObservationStateV1,
    subscribe: subscribeRhizohObservationStateV1,
    recordBroadcast: recordBroadcastVisibilityV1,
    isProofMode: isRhizohProofModeEnabledV1,
    interpretationOnly: true
  });
}

/** @internal vitest */
export function resetRhizohObservationStateConsoleForTestV1() {
  observationConsoleMountedV1 = false;
  subscribersV1.clear();
  if (typeof window !== "undefined" && window.__rhizoh?.observationState) {
    delete window.__rhizoh.observationState;
  }
}
