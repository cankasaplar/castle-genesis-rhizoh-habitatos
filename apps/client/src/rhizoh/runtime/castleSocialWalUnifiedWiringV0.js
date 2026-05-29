/**
 * Unified gateway WS: CASTLE_SOCIAL_* + CASTLE_WAL_PEER_* → slices ref + WAL convergence.
 *
 * Replaces side-channel-only peer loop when natural traffic is active.
 * Env: `VITE_PEER_WAL_CONVERGENCE=1`, optional `VITE_PEER_WAL_PUBLISH_FALLBACK=1` for 4s dedicated feed.
 */

import { createCastleSocialWsChannelV0 } from "../social/multiUser/castleSocialWsSyncV0.js";
import { createCastleWalPeerWsChannelV0 } from "./castleWalPeerWsSyncV0.js";
import {
  handleGatewayRoomEnvelopeForWalConvergenceV0,
  buildSocialPulseWithWalPeerFeedV0,
  buildCastleSocialWalBridgeSnapshotV0,
  ingestPeerWalFromCastleSlicesV0
} from "./castleSocialWalConvergenceBridgeV0.js";
import { isPeerWalConvergenceEnabledV0, PEER_WAL_PUBLISH_INTERVAL_MS_V0 } from "./peerWalConvergenceLiveWiringV0.js";
import { getWorldRuntimeDaemonStateV0 } from "./worldRuntimeDaemonQueueV0.js";

export const CASTLE_SOCIAL_WAL_UNIFIED_WIRING_SCHEMA_V0 =
  "castle.rhizoh.castle_social_wal_unified_wiring.v0";

const NATURAL_TRAFFIC_STALE_MS = 12_000;

export function isPeerWalPublishFallbackEnabledV0() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_PEER_WAL_PUBLISH_FALLBACK === "1";
  } catch {
    return false;
  }
}

function shouldUseDedicatedPublishFallbackV0() {
  if (isPeerWalPublishFallbackEnabledV0()) return true;
  const pc = getWorldRuntimeDaemonStateV0().peerConvergence;
  const last = Number(pc?.lastNaturalTrafficAtMs) || 0;
  if (!last) return true;
  return Date.now() - last > NATURAL_TRAFFIC_STALE_MS;
}

/**
 * @param {{
 *   wsBaseUrl: string,
 *   socialRoomKey?: string,
 *   walRoomKey?: string,
 *   castleId: string,
 *   userId?: string,
 *   token?: string,
 *   getState: () => import("../../studio/types/rskOntology.js").StudioKernelState,
 *   getSlices: () => unknown[],
 *   setSlices: (next: unknown[]) => void,
 *   onConvergenceEvent?: (row: unknown) => void
 * }} opts
 */
export function installCastleSocialWalUnifiedWiringV0(opts) {
  if (!isPeerWalConvergenceEnabledV0() || !opts?.wsBaseUrl) {
    return () => {};
  }

  const socialRoomKey = opts.socialRoomKey ?? "castle:main";
  const walRoomKey = opts.walRoomKey ?? "wal:convergence";

  const onRoom = (envelope) => {
    const out = handleGatewayRoomEnvelopeForWalConvergenceV0(envelope, {
      getState: opts.getState,
      priorSlices: opts.getSlices(),
      onSlicesUpdate: (next) => opts.setSlices(next)
    });
    for (const r of out.results ?? []) {
      opts.onConvergenceEvent?.(r);
    }
  };

  const social = createCastleSocialWsChannelV0({
    wsBaseUrl: opts.wsBaseUrl,
    castleRoomKey: socialRoomKey,
    userId: opts.userId ?? opts.castleId,
    token: opts.token,
    onRoom,
    onStatus: (s) => {
      if (s.state === "open") {
        social.sendPulse(buildSocialPulseWithWalPeerFeedV0(opts.getState, { castleId: opts.castleId }));
      }
    }
  });

  const wal = createCastleWalPeerWsChannelV0({
    wsBaseUrl: opts.wsBaseUrl,
    castleRoomKey: walRoomKey,
    castleId: opts.castleId,
    userId: opts.userId,
    token: opts.token,
    getState: opts.getState,
    onPeerResult: (results) => {
      for (const r of results) opts.onConvergenceEvent?.(r);
    }
  });

  social.connect();
  wal.connect();

  let publishId = 0;
  const scheduleFallbackPublish = () => {
    if (!shouldUseDedicatedPublishFallbackV0()) return;
    wal.sendLocalWalPeerFeed();
    social.sendPulse(buildSocialPulseWithWalPeerFeedV0(opts.getState, { castleId: opts.castleId }));
  };

  publishId = window.setInterval(scheduleFallbackPublish, PEER_WAL_PUBLISH_INTERVAL_MS_V0);
  scheduleFallbackPublish();

  return () => {
    if (publishId) window.clearInterval(publishId);
    social.dispose();
    wal.dispose();
  };
}

/**
 * Coherence tick hook — process slices already merged in App.
 *
 * @param {unknown[]} mergedSlices
 * @param {{ getState: () => import("../../studio/types/rskOntology.js").StudioKernelState }} ctx
 */
export function tickPeerWalFromMergedCastleSlicesV0(mergedSlices, ctx) {
  return ingestPeerWalFromCastleSlicesV0(mergedSlices, ctx);
}

export function getCastleSocialWalUnifiedDebugV0(getState, getSlices) {
  const slices = getSlices?.() ?? [];
  return {
    schema: CASTLE_SOCIAL_WAL_UNIFIED_WIRING_SCHEMA_V0,
    enabled: isPeerWalConvergenceEnabledV0(),
    publishFallback: isPeerWalPublishFallbackEnabledV0(),
    dedicatedPublishActive: shouldUseDedicatedPublishFallbackV0(),
    bridge: buildCastleSocialWalBridgeSnapshotV0(getState, slices)
  };
}
