/**
 * Core subsystem boot — legal/ingress independent.
 * Chess, learning, event graph, nervous system (without world spatial tick).
 * RESEARCH-ONLY — does not grant execution authority.
 */

import { runDomainGateForPathV0 } from "./rhizohDomainNervousSystemV0.js";
import { bootRhizohLearningCoreV0 } from "./rhizohLearningCoreBootV0.js";
import { startRhizohLegalPendingWaitLoopV0 } from "./rhizohLegalPendingWaitLoopV0.js";
import { publishRhizohWorldNamespaceGateV0 } from "./rhizohWorldNamespaceGateV0.js";
import { startChessGameClusterV0 } from "./chessGameClusterV0.js";
import {
  prewarmChessStockfishEngineV0,
  getChessStockfishEngineStatusV0,
  CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0
} from "./chessStockfishEngineV0.js";
import { publishRhizohChessManagerV0, ensureRhizohChessManagerListenersV0 } from "./rhizohChessManagerV0.js";
import { publishChessGameRouterV0 } from "./chessGameRouterV0.js";
import { ensureShadowTraceLedgerDevToolsV0 } from "./rhizohShadowTraceLedgerDevToolsV0.js";
import { ensureExecutionGovernanceSwitchboardDevToolsV0 } from "./rhizohExecutionGovernanceSwitchboardV0.js";
import { ensureHardSeparationDevToolsV0 } from "./rhizohHardSeparationLayerV0.js";

export const RHIZOH_CORE_SUBSYSTEM_BOOT_SCHEMA_V0 = "castle.rhizoh.core_subsystem_boot.v0";

const GUEST_SESSION_KEY_V0 = "rhizoh_guest_session_v0";

let coreBootedV0 = false;
/** @type {(() => void) | null} */
let stopLegalWaitLoopV0 = null;

/**
 * Stable guest id for learning seed before Firebase auth.
 */
export function readRhizohGuestSessionIdV0() {
  if (typeof localStorage === "undefined") return `guest_${Date.now()}`;
  try {
    let id = localStorage.getItem(GUEST_SESSION_KEY_V0);
    if (!id) {
      id = `guest_${Date.now()}`;
      localStorage.setItem(GUEST_SESSION_KEY_V0, id);
    }
    return id;
  } catch {
    return `guest_${Date.now()}`;
  }
}

/**
 * @param {string} [userId]
 */
export function ensureRhizohLearningCoreBootV0(userId) {
  const uid = String(userId || "").trim() || readRhizohGuestSessionIdV0();
  return bootRhizohLearningCoreV0({ userId: uid });
}

/**
 * Boot core stack once — safe during legal ingress overlay.
 * @param {{ userId?: string, pathname?: string }} [opts]
 */
export function ensureRhizohCoreSubsystemsBootV0(opts = {}) {
  if (typeof window === "undefined") {
    return Object.freeze({ ok: false, reason: "no_window" });
  }

  const pathname = String(opts.pathname || window.location.pathname || "/").trim() || "/";
  if (!coreBootedV0) {
    coreBootedV0 = true;
    ensureRhizohChessManagerListenersV0();
    ensureShadowTraceLedgerDevToolsV0();
    ensureExecutionGovernanceSwitchboardDevToolsV0();
    ensureHardSeparationDevToolsV0();
    runDomainGateForPathV0(pathname, { coreOnly: true });
    stopLegalWaitLoopV0 = startRhizohLegalPendingWaitLoopV0({ bootDelayMs: 2_500 });
  }

  const learning = ensureRhizohLearningCoreBootV0(opts.userId);
  const worldGate = publishRhizohWorldNamespaceGateV0();
  let cluster = Object.freeze({ ok: false, pendingEnginePrewarm: true });
  void prewarmChessStockfishEngineV0().finally(() => {
    const engineStatus = getChessStockfishEngineStatusV0();
    cluster = startChessGameClusterV0({ minIntervalMs: 900 });
    publishRhizohChessManagerV0("engine_prewarm_done");
    if (typeof window !== "undefined") {
      window.__CASTLE_BOOT_LOG__?.ok?.(
        "boot.chess_cluster",
        `engine=${engineStatus} minIntervalMs=900`
      );
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0, {
          detail: window.__rhizoh?.chessStockfishEngine || { reason: "engine_prewarm_done" }
        })
      );
    }
  });
  const chessManager = publishRhizohChessManagerV0("core_boot");
  const chessGameRouter = publishChessGameRouterV0("core_boot");

  const snap = Object.freeze({
    schema: RHIZOH_CORE_SUBSYSTEM_BOOT_SCHEMA_V0,
    ok: true,
    booted: true,
    pathname,
    learning,
    worldGate,
    chessCluster: cluster,
    chessManager,
    chessGameRouter,
    atMs: Date.now()
  });

  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.coreSubsystemBoot = snap;
  return snap;
}

/** @internal vitest */
export function resetRhizohCoreSubsystemBootForTestV0() {
  coreBootedV0 = false;
  if (stopLegalWaitLoopV0) {
    stopLegalWaitLoopV0();
    stopLegalWaitLoopV0 = null;
  }
}
