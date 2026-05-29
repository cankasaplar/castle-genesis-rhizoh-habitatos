/**
 * Mount Sprint C.1 peer WAL convergence on gateway WS.
 *
 * Env: `VITE_PEER_WAL_CONVERGENCE=1` (requires gateway WS URL + optional `VITE_WORLD_RUNTIME_DAEMON=1`)
 */

import { createCastleWalPeerWsChannelV0 } from "./castleWalPeerWsSyncV0.js";
import { buildLocalWalPeerFeedV0, buildPeerWalConvergenceDebugSnapshotV0 } from "./peerWalConvergenceWireV0.js";
import { isWorldRuntimeDaemonEnabledV0 } from "./worldRuntimeDaemonQueueV0.js";

export const PEER_WAL_CONVERGENCE_LIVE_WIRING_SCHEMA_V0 =
  "castle.rhizoh.peer_wal_convergence_live_wiring.v0";

export const PEER_WAL_PUBLISH_INTERVAL_MS_V0 = 4000;

export function isPeerWalConvergenceEnabledV0() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_PEER_WAL_CONVERGENCE === "1";
  } catch {
    return false;
  }
}

/**
 * @param {{
 *   wsBaseUrl: string,
 *   castleRoomKey?: string,
 *   castleId: string,
 *   userId?: string,
 *   token?: string,
 *   getState: () => import("../../studio/types/rskOntology.js").StudioKernelState,
 *   onDebugEvent?: (row: unknown) => void
 * }} opts
 */
export function installPeerWalConvergenceLiveWiringV0(opts) {
  if (!isPeerWalConvergenceEnabledV0()) {
    return () => {};
  }
  if (!opts?.wsBaseUrl) {
    return () => {};
  }

  const channel = createCastleWalPeerWsChannelV0({
    wsBaseUrl: opts.wsBaseUrl,
    castleRoomKey: opts.castleRoomKey ?? "wal:convergence",
    castleId: opts.castleId,
    userId: opts.userId,
    token: opts.token,
    getState: opts.getState,
    onPeerResult: (results) => {
      for (const r of results) {
        opts.onDebugEvent?.(r);
      }
    },
    onStatus: (s) => {
      if (s.state === "open" && isWorldRuntimeDaemonEnabledV0()) {
        channel.sendLocalWalPeerFeed();
      }
    }
  });

  channel.connect();

  const publishId = window.setInterval(() => {
    channel.sendLocalWalPeerFeed();
  }, PEER_WAL_PUBLISH_INTERVAL_MS_V0);

  return () => {
    window.clearInterval(publishId);
    channel.dispose();
  };
}

export function getPeerWalConvergenceLiveDebugV0(getState) {
  return {
    schema: PEER_WAL_CONVERGENCE_LIVE_WIRING_SCHEMA_V0,
    enabled: isPeerWalConvergenceEnabledV0(),
    daemonEnabled: isWorldRuntimeDaemonEnabledV0(),
    localFeed: buildLocalWalPeerFeedV0(getState, { castleId: "local" }),
    snapshot: buildPeerWalConvergenceDebugSnapshotV0(getState)
  };
}
