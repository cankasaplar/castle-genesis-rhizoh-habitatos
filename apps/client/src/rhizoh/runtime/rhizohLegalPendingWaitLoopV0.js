/**
 * Legal / admission hold wait loop — Rhizoh plays real chess matches while approval pending.
 * C2 default: no auto-open; user opens cluster arena manually from lobby.
 */

import { CHESS_GAME_MODE_V0 } from "./chessArenaEngineV0.js";
import { RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0 } from "./chessGameClusterV0.js";
import { RHIZOH_OPEN_CHESS_ARENA_EVENT_V1 } from "./symbyoMapIntentBridgeV0.js";
import { hasLegalAccessAckV0, resolveIngressRouteV0 } from "../ingress/ingress_router.js";
import { ensureShadowTraceLedgerDevToolsV0 } from "./rhizohShadowTraceLedgerDevToolsV0.js";
import { CHESS_LEARNING_SESSION_PRESET_V0 } from "./chessLearningSessionV0.js";

export const RHIZOH_LEGAL_PENDING_WAIT_LOOP_SCHEMA_V0 = "castle.rhizoh.legal_pending_wait_loop.v0";
export const RHIZOH_LEGAL_PENDING_WAIT_TICK_EVENT_V0 = "rhizoh:legal-pending-wait-tick-v0";

const DEFAULT_POLL_MS_V0 = 45_000;

let loopTimer = null;
let chessDispatched = false;

/**
 * Opt-in auto chess during legal hold (legacy). Default off — manual gate (C2).
 * @returns {boolean}
 */
export function isLegalHoldAutoChessEnabledV0() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_LEGAL_HOLD_AUTO_CHESS === "1") {
    return true;
  }
  return false;
}

/**
 * @returns {boolean}
 */
export function isRhizohLegalPendingHoldV0() {
  const ingress = resolveIngressRouteV0();
  if (ingress.required && !ingress.acked && !hasLegalAccessAckV0()) return true;
  if (ingress.route === "closed_admission_hold") return true;

  try {
    const snap = typeof window !== "undefined" ? window.__rhizoh?.autonomySubstrateSnapshot : null;
    if (snap && Number(snap.approvalPending) > 0) return true;
    if (snap?.requiresHumanApprovalReset === true) return true;
  } catch {
    /* noop */
  }

  return false;
}

/**
 * @param {{ force?: boolean }} [opts]
 */
export function maybeDispatchLegalPendingChessArenaV0(opts = {}) {
  if (typeof window === "undefined") return false;
  if (!opts.force && !isRhizohLegalPendingHoldV0()) return false;
  if (!opts.force && !isLegalHoldAutoChessEnabledV0()) return false;
  if (!opts.force && chessDispatched) return false;

  return dispatchLegalHoldChessArenaManualV0();
}

/**
 * Manual cluster open during legal hold (C2 stable state machine).
 */
export function dispatchLegalHoldChessArenaManualV0() {
  if (typeof window === "undefined") return false;
  if (chessDispatched) return false;

  chessDispatched = true;
  const preset = CHESS_LEARNING_SESSION_PRESET_V0.BULLET_RESEARCH;
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0, {
        detail: Object.freeze({ source: "legal_hold_manual", atMs: Date.now() })
      })
    );
    window.dispatchEvent(
      new CustomEvent(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, {
        detail: Object.freeze({
          source: "legal_hold_manual",
          initialMode: CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH,
          autoPlay: true,
          learningPresetId: preset.id,
          node: Object.freeze({
            id: "chess_arena",
            type: "zone",
            label: "RHIZOH WAIT",
            name: "Rhizoh · Legal Hold Chess",
            color: "#22d3ee"
          })
        })
      })
    );
    window.dispatchEvent(
      new CustomEvent(RHIZOH_LEGAL_PENDING_WAIT_TICK_EVENT_V0, {
        detail: Object.freeze({ chessDispatched: true, manual: true, atMs: Date.now() })
      })
    );
  } catch {
    chessDispatched = false;
    return false;
  }
  return true;
}

function tickLegalPendingWaitLoopV0() {
  const hold = isRhizohLegalPendingHoldV0();
  if (!hold) {
    chessDispatched = false;
    return;
  }
  if (isLegalHoldAutoChessEnabledV0()) {
    maybeDispatchLegalPendingChessArenaV0();
  }
}

/**
 * Boot poll loop on World Space / T0 surfaces.
 * @param {{ pollMs?: number, bootDelayMs?: number }} [opts]
 */
export function startRhizohLegalPendingWaitLoopV0(opts = {}) {
  if (typeof window === "undefined" || loopTimer) return () => {};
  const pollMs = Math.max(15_000, Number(opts.pollMs || DEFAULT_POLL_MS_V0) || DEFAULT_POLL_MS_V0);
  const bootDelayMs = Math.max(0, Number(opts.bootDelayMs || 4_000) || 4_000);

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.openLegalHoldChessArena = dispatchLegalHoldChessArenaManualV0;
    ensureShadowTraceLedgerDevToolsV0();
  }

  const bootTimer = window.setTimeout(() => {
    tickLegalPendingWaitLoopV0();
    loopTimer = window.setInterval(tickLegalPendingWaitLoopV0, pollMs);
  }, bootDelayMs);

  return () => {
    window.clearTimeout(bootTimer);
    if (loopTimer) {
      window.clearInterval(loopTimer);
      loopTimer = null;
    }
    chessDispatched = false;
  };
}

export function resetRhizohLegalPendingWaitLoopForTestsV0() {
  chessDispatched = false;
  if (loopTimer && typeof window !== "undefined") {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}
