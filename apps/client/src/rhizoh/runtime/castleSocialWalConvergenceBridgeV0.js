/**
 * Sprint C.1+ — `castleSocialWsSlicesRef` ↔ WAL peer convergence (natural traffic path).
 *
 * Convergence rides CASTLE_SOCIAL_ROOM / roster-embedded `walPeerFeed`, not only the
 * dedicated CASTLE_WAL_PEER publish loop.
 */

import { WS_MESSAGE } from "@castle/protocol";
import {
  processPeerWalConvergenceV0,
  ingestPeerWalRoomBroadcastV0,
  buildLocalWalPeerFeedV0
} from "./peerWalConvergenceWireV0.js";
import { getWorldRuntimeDaemonStateV0 } from "./worldRuntimeDaemonQueueV0.js";

export const CASTLE_SOCIAL_WAL_CONVERGENCE_BRIDGE_SCHEMA_V0 =
  "castle.rhizoh.peer_wal_convergence_bridge.v0";

/**
 * Extract WAL peer feeds from a coherence slice (roster + optional `peerFeeds`).
 *
 * @param {unknown} slice
 * @returns {{ castleId: string, walPeerFeed: Record<string, unknown>, observedAtMs?: number }[]}
 */
export function extractWalPeerFeedsFromCoherenceSliceV0(slice) {
  if (!slice || typeof slice !== "object") return [];
  const s = /** @type {Record<string, unknown>} */ (slice);
  const defaultCastleId = String(s.castleId || "").trim();
  /** @type {{ castleId: string, walPeerFeed: Record<string, unknown>, observedAtMs?: number }[]} */
  const out = [];

  const topFeeds = s.peerFeeds ?? s.walPeerFeeds;
  if (Array.isArray(topFeeds)) {
    for (const f of topFeeds) {
      const o = f && typeof f === "object" ? /** @type {Record<string, unknown>} */ (f) : {};
      const castleId = String(o.castleId || o.sourceCastleId || defaultCastleId || "").trim();
      const walPeerFeed = o.walPeerFeed ?? o.feed ?? o;
      if (!castleId || !walPeerFeed || typeof walPeerFeed !== "object") continue;
      out.push({
        castleId,
        walPeerFeed: /** @type {Record<string, unknown>} */ (walPeerFeed),
        observedAtMs: Number(o.lastMs) || Number(walPeerFeed.observedAtMs)
      });
    }
  }

  const wsRoom = s.wsRoom && typeof s.wsRoom === "object" ? /** @type {Record<string, unknown>} */ (s.wsRoom) : null;
  const roster = wsRoom && Array.isArray(wsRoom.roster) ? wsRoom.roster : [];
  for (const row of roster) {
    const m = row && typeof row === "object" ? /** @type {Record<string, unknown>} */ (row) : {};
    const walPeerFeed = m.walPeerFeed;
    if (!walPeerFeed || typeof walPeerFeed !== "object") continue;
    const castleId = String(
      m.sourceCastleId || m.castleId || m.userId || defaultCastleId || ""
    ).trim();
    if (!castleId) continue;
    out.push({
      castleId,
      walPeerFeed: /** @type {Record<string, unknown>} */ (walPeerFeed),
      observedAtMs: Number(m.lastMs) || Number(walPeerFeed.observedAtMs)
    });
  }

  return out;
}

/**
 * @param {unknown[]} slices
 */
export function extractWalPeerFeedsFromCastleSlicesV0(slices) {
  const list = Array.isArray(slices) ? slices : [];
  const out = [];
  for (const slice of list) {
    out.push(...extractWalPeerFeedsFromCoherenceSliceV0(slice));
  }
  return out;
}

/**
 * Convert gateway `CASTLE_SOCIAL_ROOM` envelope → coherence slice row for `castleSocialWsSlicesRef`.
 *
 * @param {{ type?: string, payload?: Record<string, unknown> }} envelope
 */
export function castleSocialRoomEnvelopeToCoherenceSliceV0(envelope) {
  const payload =
    envelope?.payload && typeof envelope.payload === "object" ? envelope.payload : {};
  const castleRoomKey = String(payload.castleRoomKey || "default").slice(0, 64);
  const seq = Number(payload.seq) || 0;
  const roster = Array.isArray(payload.roster) ? payload.roster : [];
  const peerFeeds = Array.isArray(payload.peerFeeds) ? payload.peerFeeds : [];

  return {
    castleId: `wsroom:${castleRoomKey}`,
    priority: seq,
    sliceKind: "full",
    wsRoom: {
      castleRoomKey,
      seq,
      roster
    },
    peerFeeds,
    receivedAtMs: Date.now(),
    transport: "castle_social_room"
  };
}

/**
 * Merge room broadcast into slices array (immutable return).
 *
 * @param {unknown[]} priorSlices
 * @param {{ type?: string, payload?: Record<string, unknown> }} envelope
 */
export function mergeCastleSocialRoomIntoSlicesV0(priorSlices, envelope) {
  const slice = castleSocialRoomEnvelopeToCoherenceSliceV0(envelope);
  const roomKey = slice.wsRoom.castleRoomKey;
  const list = Array.isArray(priorSlices) ? [...priorSlices] : [];
  const idx = list.findIndex(
    (s) =>
      s &&
      typeof s === "object" &&
      String(/** @type {Record<string, unknown>} */ (s).wsRoom?.castleRoomKey || "") === roomKey
  );
  if (idx >= 0) list[idx] = slice;
  else list.push(slice);
  return list;
}

/**
 * Ingest all WAL peer feeds found in coherence slices (natural traffic path).
 *
 * @param {unknown[]} slices
 * @param {{ getState: () => import("../../studio/types/rskOntology.js").StudioKernelState, nowMs?: number }} ctx
 */
export function ingestPeerWalFromCastleSlicesV0(slices, ctx) {
  const nowMs = Number(ctx.nowMs) || Date.now();
  const feeds = extractWalPeerFeedsFromCastleSlicesV0(slices);
  const results = [];

  for (const row of feeds) {
    const feed = {
      ...row.walPeerFeed,
      observedAtMs: Number(row.walPeerFeed.observedAtMs) || Number(row.observedAtMs) || nowMs
    };
    results.push(
      processPeerWalConvergenceV0(feed, {
        castleId: row.castleId,
        getState: ctx.getState,
        nowMs
      })
    );
  }

  const daemon = getWorldRuntimeDaemonStateV0();
  if (!daemon.peerConvergence) {
    daemon.peerConvergence = { quarantineByCastleId: {}, acceptedByCastleId: {}, debugEvents: [] };
  }
  if (results.length > 0) {
    daemon.peerConvergence.lastNaturalTrafficAtMs = nowMs;
    daemon.peerConvergence.lastNaturalFeedCount = results.length;
  }

  return {
    feedCount: feeds.length,
    results,
    transport: "castle_social_slices"
  };
}

/**
 * Handle any gateway room envelope relevant to convergence (social + dedicated wal room).
 *
 * @param {{ type?: string, payload?: Record<string, unknown> }} envelope
 * @param {{
 *   getState: () => import("../../studio/types/rskOntology.js").StudioKernelState,
 *   onSlicesUpdate?: (next: unknown[]) => void,
 *   priorSlices?: unknown[]
 * }} ctx
 */
export function handleGatewayRoomEnvelopeForWalConvergenceV0(envelope, ctx) {
  const type = String(envelope?.type || "");
  const nowMs = Date.now();

  if (type === WS_MESSAGE.CASTLE_WAL_PEER_ROOM) {
    const results = ingestPeerWalRoomBroadcastV0(envelope, {
      getState: ctx.getState,
      nowMs
    });
    const daemon = getWorldRuntimeDaemonStateV0();
    if (daemon.peerConvergence && results.length) {
      daemon.peerConvergence.lastNaturalTrafficAtMs = nowMs;
      daemon.peerConvergence.lastDedicatedWalRoomAtMs = nowMs;
    }
    const slice = {
      castleId: `walroom:${envelope.payload?.castleRoomKey || "wal"}`,
      priority: Number(envelope.payload?.seq) || 0,
      sliceKind: "full",
      peerFeeds: envelope.payload?.peerFeeds ?? [],
      receivedAtMs: nowMs,
      transport: "castle_wal_peer_room"
    };
    const next = mergeCastleSocialRoomIntoSlicesV0(ctx.priorSlices ?? [], {
      type: WS_MESSAGE.CASTLE_SOCIAL_ROOM,
      payload: {
        castleRoomKey: slice.castleId,
        seq: slice.priority,
        roster: [],
        peerFeeds: slice.peerFeeds
      }
    });
    ctx.onSlicesUpdate?.(next);
    return { transport: "wal_peer_room", results, slice, nextSlices: next };
  }

  if (type === WS_MESSAGE.CASTLE_SOCIAL_ROOM) {
    const next = mergeCastleSocialRoomIntoSlicesV0(ctx.priorSlices ?? [], envelope);
    ctx.onSlicesUpdate?.(next);
    const ingest = ingestPeerWalFromCastleSlicesV0(next, {
      getState: ctx.getState,
      nowMs
    });
    return { ...ingest, transport: "castle_social_room", nextSlices: next };
  }

  return { transport: "ignored", feedCount: 0, results: [] };
}

/**
 * Build social pulse payload embedding local WAL feed for natural room fan-out.
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {{ castleId?: string }} [opts]
 */
export function buildSocialPulseWithWalPeerFeedV0(getState, opts = {}) {
  const built = buildLocalWalPeerFeedV0(getState, { castleId: opts.castleId ?? "local" });
  return {
    walPeerFeed: built.walPeerFeed,
    walConvergence: {
      schema: CASTLE_SOCIAL_WAL_CONVERGENCE_BRIDGE_SCHEMA_V0,
      castleId: built.castleId,
      atMs: Date.now()
    }
  };
}

export function buildCastleSocialWalBridgeSnapshotV0(getState, slices) {
  const daemon = getWorldRuntimeDaemonStateV0();
  const pc = daemon.peerConvergence ?? {};
  return {
    schema: CASTLE_SOCIAL_WAL_CONVERGENCE_BRIDGE_SCHEMA_V0,
    ts: Date.now(),
    sliceCount: Array.isArray(slices) ? slices.length : 0,
    extractableFeeds: extractWalPeerFeedsFromCastleSlicesV0(slices).length,
    lastNaturalTrafficAtMs: pc.lastNaturalTrafficAtMs ?? null,
    lastDedicatedWalRoomAtMs: pc.lastDedicatedWalRoomAtMs ?? null,
    lastNaturalFeedCount: pc.lastNaturalFeedCount ?? 0,
    quarantineCount: Object.keys(pc.quarantineByCastleId ?? {}).length,
    acceptedCount: Object.keys(pc.acceptedByCastleId ?? {}).length
  };
}
