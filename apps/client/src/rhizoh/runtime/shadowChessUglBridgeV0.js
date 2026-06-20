/**
 * Shadow Chess ↔ UGL bridge v0 — Phase B soft data-plane.
 * UGL chess events → shadow castle bus (meaning transfer only).
 * RESEARCH-ONLY
 * @see docs/RHIZOH_SHADOW_DATA_PLANE_V0.md
 */

import { RHIZOH_UGL_EVENT_V0, RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";
import {
  emitShadowCastleEventV0,
  PEER_CASTLE_SIM_ID_V0,
  SHADOW_CASTLE_EVENT_TYPE_V0
} from "./shadowCastleEventBusV0.js";

export const SHADOW_CHESS_UGL_BRIDGE_SCHEMA_V0 = "castle.rhizoh.shadow_chess_ugl_bridge.v0";

/** @type {((ev: Event) => void) | null} */
let uglListenerV0 = null;
let bridgeInstalledV0 = false;

/**
 * @param {object} uglEvent
 */
export function bridgeUglEventToShadowCastleV0(uglEvent) {
  const gameType = String(uglEvent?.meta?.gameType || uglEvent?.s?.meta?.gameType || "");
  if (gameType && gameType !== RHIZOH_UGL_GAME_TYPE_V0.CHESS) return null;

  const source = String(uglEvent?.meta?.source || "");
  const isGameEnd = source === "game_end" || uglEvent?.r?.terminal != null;
  const type = isGameEnd
    ? SHADOW_CASTLE_EVENT_TYPE_V0.CHESS_GAME_END
    : SHADOW_CASTLE_EVENT_TYPE_V0.CHESS_MOVE;

  const rewardTotal = Number(uglEvent?.r?.total);
  const scalar = Number.isFinite(rewardTotal)
    ? Math.max(0, Math.min(1, (rewardTotal + 1) / 2))
    : 0.55;

  const san = uglEvent?.a?.payload?.san || uglEvent?.a?.payload?.uci || null;
  const matchId = String(uglEvent?.meta?.matchId || "unknown");

  return Object.freeze({
    type,
    fromCastleId: "my_castle",
    toCastleId: PEER_CASTLE_SIM_ID_V0,
    payload: Object.freeze({
      gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS,
      matchId,
      san,
      scalar,
      uglCausalChainId: uglEvent?.meta?.causalChainId || null,
      uglSource: source || "ugl_event"
    }),
    source: "shadow_chess_ugl_bridge"
  });
}

/**
 * @param {object} uglEvent
 */
export function emitShadowCastleEventFromUglV0(uglEvent) {
  const row = bridgeUglEventToShadowCastleV0(uglEvent);
  if (!row) return null;
  return emitShadowCastleEventV0(row);
}

/**
 * @param {object} [opts]
 */
export function demoChessShadowMoveEmitV0(opts = {}) {
  const uglEvent = Object.freeze({
    schema: "castle.rhizoh.ugl_event.v0",
    meta: Object.freeze({
      matchId: String(opts.matchId || "demo_match"),
      gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS,
      causalChainId: "ugl_demo_1",
      source: "demo"
    }),
    a: Object.freeze({
      type: "move",
      payload: Object.freeze({ san: String(opts.san || "Nf3") })
    }),
    r: Object.freeze({ total: Number.isFinite(Number(opts.reward)) ? Number(opts.reward) : 0.35 })
  });
  return emitShadowCastleEventFromUglV0(uglEvent);
}

export function installShadowChessUglBridgeV0() {
  if (bridgeInstalledV0 || typeof window === "undefined") return () => {};
  bridgeInstalledV0 = true;

  uglListenerV0 = (ev) => {
    const uglEvent = ev?.detail;
    if (!uglEvent?.schema?.includes("ugl_event")) return;
    emitShadowCastleEventFromUglV0(uglEvent);
  };
  window.addEventListener(RHIZOH_UGL_EVENT_V0, uglListenerV0);

  return uninstallShadowChessUglBridgeV0;
}

export function uninstallShadowChessUglBridgeV0() {
  bridgeInstalledV0 = false;
  if (typeof window !== "undefined" && uglListenerV0) {
    window.removeEventListener(RHIZOH_UGL_EVENT_V0, uglListenerV0);
  }
  uglListenerV0 = null;
}

export function getShadowChessUglBridgeSnapshotV0() {
  return Object.freeze({
    schema: `${SHADOW_CHESS_UGL_BRIDGE_SCHEMA_V0}.snapshot`,
    installed: bridgeInstalledV0,
    listensTo: RHIZOH_UGL_EVENT_V0,
    interpretationOnly: true,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetShadowChessUglBridgeForTestV0() {
  uninstallShadowChessUglBridgeV0();
}
