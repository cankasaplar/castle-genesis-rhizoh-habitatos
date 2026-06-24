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
import { prewarmChessLc0EngineV0 } from "./chessLc0UciBridgeV0.js";
import { publishRhizohChessManagerV0, ensureRhizohChessManagerListenersV0 } from "./rhizohChessManagerV0.js";
import { publishChessGameRouterV0 } from "./chessGameRouterV0.js";
import { ensureShadowTraceLedgerDevToolsV0 } from "./rhizohShadowTraceLedgerDevToolsV0.js";
import { ensureExecutionGovernanceSwitchboardDevToolsV0 } from "./rhizohExecutionGovernanceSwitchboardV0.js";
import { ensureHardSeparationDevToolsV0 } from "./rhizohHardSeparationLayerV0.js";
import { ensureRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";
import { ensureRhizohChessLearningCameraV0 } from "./rhizohChessLearningCameraV0.js";
import { ensureChessLearningDebugV0 } from "./rhizohChessLearningDebugV0.js";
import { ensureChessLc0UciBridgeDevToolsV0 } from "./chessLc0UciBridgeV0.js";
import { ensureCalendarShadowTimelineDevToolsV0 } from "./calendarShadowTimelineV0.js";
import { ensureMediaShadowTimelineDevToolsV0 } from "./mediaShadowTimelineV0.js";
import { ensureUserActivityShadowTimelineDevToolsV0 } from "./userActivityShadowTimelineV0.js";
import { ensureLifeShadowDayBranchDevToolsV0 } from "./lifeShadowDayBranchesV0.js";
import { ensureWorldBridgeMemoryGraphDevToolsV0 } from "./worldBridgeMemoryGraphV0.js";
import { ensureSpatialRendererRegistryDevToolsV0 } from "./rhizohSpatialSurfaceRendererRegistryV0.js";
import { ensureWorldLayerActivationDevToolsV0 } from "./rhizohWorldLayerActivationStatusV0.js";
import { ensureWorldSportsMediaTubeDevToolsV0 } from "./worldSportsMediaTubeWireV0.js";
import { ensureRhizohChessLifetimeReportV0 } from "./rhizohChessLifetimeReportV0.js";
import { ensureChessHistoryBrainV0 } from "./chessHistoryBrainReportV0.js";
import { ensureRhizohChessEvolutionCurveV0 } from "./rhizohChessEvolutionCurveV0.js";
import { ensureRhizohUglV0 } from "./rhizohUglBootV0.js";
import { ensureChessEngineHealthDevToolsV0 } from "./rhizohChessEngineHealthV0.js";
import { ensureRhizohChessLearningCheckpointV0 } from "./rhizohChessLearningCheckpointV0.js";
import { ensureRhizohOpeningBookGmSeedV0 } from "./rhizohOpeningBookGmSeedV0.js";
import { ensureChessUnifiedMemoryGraphV0 } from "./chessUnifiedMemoryGraphBootV0.js";
import { ensureChessOfflineBatchTrainerV0 } from "./chessOfflineBatchTrainerV0.js";
import { ensureChessBroadcastOpponentMatrixDevToolsV0 } from "./chessBroadcastOpponentMatrixV0.js";
import { ensureRhizohCausalGraphDevToolsV0 } from "./runtimeEventGraphBridgeV0.js";
import { ensureContinuityKernelDevToolsV0 } from "./rhizohContinuityKernelV0.js";
import { mountMatchmakingConsoleV0 } from "./matchmakingConsoleV0.js";
import { autoStartMatchSessionSyncFromLocationV0 } from "./matchSessionSyncBridgeV0.js";
import { parseMatchSessionFromLocationV0 } from "./matchIngressSessionRouterV0.js";
import { pruneRhizohLocalStorageOnBootV0 } from "./rhizohLocalStorageSafeV0.js";
import {
  isRhizohWorldSpacePathV0,
  isV11LeafletMapReadyV0,
  runAfterV11LeafletReadyV0
} from "./worldSpaceMapBootGateV0.js";

export const RHIZOH_CORE_SUBSYSTEM_BOOT_SCHEMA_V0 = "castle.rhizoh.core_subsystem_boot.v0";

const GUEST_SESSION_KEY_V0 = "rhizoh_guest_session_v0";

let coreBootedV0 = false;
/** @type {(() => void) | null} */
let stopLegalWaitLoopV0 = null;
let chessClusterBootArmedV0 = false;

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
    ensureRhizohChessLearningCheckpointV0();
    ensureRhizohOpeningBookGmSeedV0();
    pruneRhizohLocalStorageOnBootV0();
    ensureChessUnifiedMemoryGraphV0();
    ensureChessOfflineBatchTrainerV0();
    ensureRhizohChessLearningReportV0();
    ensureRhizohChessLearningCameraV0();
    ensureChessLearningDebugV0();
    ensureChessLc0UciBridgeDevToolsV0();
    ensureCalendarShadowTimelineDevToolsV0();
    ensureMediaShadowTimelineDevToolsV0();
    ensureUserActivityShadowTimelineDevToolsV0();
    ensureLifeShadowDayBranchDevToolsV0();
    ensureWorldBridgeMemoryGraphDevToolsV0();
    ensureSpatialRendererRegistryDevToolsV0();
    ensureWorldLayerActivationDevToolsV0();
    ensureWorldSportsMediaTubeDevToolsV0();
    ensureRhizohChessLifetimeReportV0();
    ensureChessHistoryBrainV0();
    ensureRhizohChessEvolutionCurveV0();
    ensureRhizohUglV0();
    ensureChessEngineHealthDevToolsV0();
    ensureChessBroadcastOpponentMatrixDevToolsV0();
    ensureRhizohCausalGraphDevToolsV0();
    ensureContinuityKernelDevToolsV0();
    runDomainGateForPathV0(pathname, { coreOnly: true });
    mountMatchmakingConsoleV0();
    const matchRoute = parseMatchSessionFromLocationV0();
    if (matchRoute?.sessionId) {
      void autoStartMatchSessionSyncFromLocationV0({
        waitForGateway: true,
        gatewayTimeoutMs: 20_000
      });
    }
    stopLegalWaitLoopV0 = startRhizohLegalPendingWaitLoopV0({ bootDelayMs: 2_500 });
  }

  const learning = ensureRhizohLearningCoreBootV0(opts.userId);
  const worldGate = publishRhizohWorldNamespaceGateV0();
  let cluster = Object.freeze({ ok: false, pendingEnginePrewarm: true });

  void prewarmChessStockfishEngineV0();
  void prewarmChessLc0EngineV0();

  const startChessClusterAfterPrewarmV0 = () => {
    chessClusterBootArmedV0 = true;
    void prewarmChessStockfishEngineV0().finally(() => {
      const engineStatus = getChessStockfishEngineStatusV0();
      cluster = startChessGameClusterV0({ minIntervalMs: 900, timeControlId: "cluster_sim_45_0" });
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
  };

  if (!chessClusterBootArmedV0) {
    const deferForMapV0 = isRhizohWorldSpacePathV0() && !isV11LeafletMapReadyV0();
    const scheduleClusterBootV0 = () => {
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(startChessClusterAfterPrewarmV0, { timeout: 2500 });
      } else {
        window.setTimeout(startChessClusterAfterPrewarmV0, 600);
      }
    };
    if (deferForMapV0) {
      runAfterV11LeafletReadyV0(scheduleClusterBootV0, { timeoutMs: 8000 });
    } else {
      scheduleClusterBootV0();
    }
  }
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
  chessClusterBootArmedV0 = false;
  if (stopLegalWaitLoopV0) {
    stopLegalWaitLoopV0();
    stopLegalWaitLoopV0 = null;
  }
}
