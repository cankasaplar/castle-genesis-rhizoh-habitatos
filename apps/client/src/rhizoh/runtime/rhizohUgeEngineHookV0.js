/**
 * UGE Engine Hook v0 — event-driven observation via EngineBridge (not boot mount).
 * Phase 2: subscribes on Chess Arena lifecycle; skips during temporal replay.
 * RESEARCH-ONLY — zero policy / move influence.
 */

import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  emitChessEngineBridgeV0,
  offChessEngineBridgeV0,
  onChessEngineBridgeV0
} from "./chessEngineBridgeV0.js";
import {
  CHESS_ENGINE_TASK_KIND_V0,
  CHESS_ENGINE_TASK_PRIORITY_V0
} from "./chessEngineTaskQueueV0.js";
import { analyzeChessPositionViaTeacherV0 } from "./chessTeacherInterfaceV0.js";
import { encodeChessTopologyEventV0 } from "./rhizohGeometryChessEncoderV0.js";
import { calculateTopologyDriftV0 } from "./rhizohGeometryTopologyV0.js";
import {
  commitDriftCubeObservationV0,
  summarizeDriftCubeV0
} from "./rhizohGeometryDriftCubeV0.js";
import {
  classifyTopologyCodexEventV0,
  emitTopologyCodexEventV0
} from "./rhizohTopologyEventEmitterV0.js";
import { isPolicyInfluenceForbiddenV0 } from "./rhizohObservationPhaseV0.js";
import { isReplayModeActiveV0 } from "./temporalBridgeV0.js";
import {
  logChessTelemetryGatedV0,
  shouldLogChessUgeHookV0
} from "./chessTelemetryLogV0.js";

export const RHIZOH_UGE_ENGINE_HOOK_SCHEMA_V0 = "rhizoh.uge_engine_hook.v0";
export const RHIZOH_UGE_ENGINE_HOOK_EVENT_V0 = "rhizoh:uge-engine-hook-v0";
export const RHIZOH_UGE_ENGINE_HOOK_LOG_TAG_V0 = "[CASTLE_uge_engine_hook]";

/** @type {Map<string, object>} fenBefore -> last teacher bestmove payload */
const teacherByFenV0 = new Map();

/** @type {(() => void) | null} */
let unsubscribeBestmoveV0 = null;

/** @type {(() => void) | null} */
let unsubscribePlayedV0 = null;

/** @type {object[]} */
const liveObservationsV0 = [];

let attachedV0 = false;
let matchIdV0 = null;
let moveCounterV0 = 0;

function publishUgeRegistryV0(lastObservation = null) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.uge = Object.freeze({
    schema: RHIZOH_UGE_ENGINE_HOOK_SCHEMA_V0,
    attached: attachedV0,
    matchId: matchIdV0,
    observationCount: liveObservationsV0.length,
    last: lastObservation,
    replaySkipped: isReplayModeActiveV0()
  });
}

/**
 * @param {{
 *   fenBefore: string,
 *   teacherMove: string,
 *   rhizohMove: string,
 *   stockfishEval?: object|null,
 *   rhizohEval?: object|null,
 *   matchId?: string|null,
 *   moveNumber?: number
 * }} row
 */
export function observeRhizohUgeMovePairV0(row) {
  if (!row?.fenBefore || !row.teacherMove || !row.rhizohMove) return null;
  if (isReplayModeActiveV0()) {
    return Object.freeze({
      schema: RHIZOH_UGE_ENGINE_HOOK_SCHEMA_V0,
      skipped: true,
      reason: "temporal_replay_active"
    });
  }

  const teacherTopology = encodeChessTopologyEventV0(row.fenBefore, row.teacherMove);
  const rhizohTopology = encodeChessTopologyEventV0(row.fenBefore, row.rhizohMove);
  const drift = calculateTopologyDriftV0(rhizohTopology, teacherTopology);

  const cubePoint = commitDriftCubeObservationV0({
    sourceSpace: "chess_uge_live",
    matchId: row.matchId || matchIdV0,
    x: rhizohTopology?.to || [],
    y: row.moveNumber || moveCounterV0,
    z: drift.magnitude,
    played: rhizohTopology,
    expected: teacherTopology,
    drift
  });

  const eventType = classifyTopologyCodexEventV0(rhizohTopology, teacherTopology, drift);
  let codexEvent = null;
  if (eventType) {
    codexEvent = emitTopologyCodexEventV0({
      eventType,
      layer: row.moveNumber || moveCounterV0,
      matchId: row.matchId || matchIdV0,
      teacherMove: row.teacherMove,
      rhizohMove: row.rhizohMove,
      played: rhizohTopology,
      expected: teacherTopology,
      drift
    });
  }

  const observation = Object.freeze({
    schema: RHIZOH_UGE_ENGINE_HOOK_SCHEMA_V0,
    skipped: false,
    matchId: row.matchId || matchIdV0,
    moveNumber: row.moveNumber || moveCounterV0,
    fenBefore: row.fenBefore,
    teacherMove: row.teacherMove,
    rhizohMove: row.rhizohMove,
    stockfishEval: row.stockfishEval || null,
    rhizohEval: row.rhizohEval || null,
    teacherTopology,
    rhizohTopology,
    drift,
    eventType,
    cubePoint,
    codexEvent,
    governance: Object.freeze({
      policyInfluence: false,
      moveInfluence: false,
      policyInfluenceForbidden: isPolicyInfluenceForbiddenV0()
    })
  });

  liveObservationsV0.push(observation);
  if (liveObservationsV0.length > 128) liveObservationsV0.shift();

  publishUgeRegistryV0(observation);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(RHIZOH_UGE_ENGINE_HOOK_EVENT_V0, { detail: observation }));
    } catch {
      /* noop */
    }
  }

  if (typeof console !== "undefined" && console.info) {
    if (
      shouldLogChessUgeHookV0({
        matchId: observation.matchId,
        driftMagnitude: drift.magnitude,
        moveNumber: observation.moveNumber
      })
    ) {
      logChessTelemetryGatedV0("info", RHIZOH_UGE_ENGINE_HOOK_LOG_TAG_V0, {
        matchId: observation.matchId,
        moveNumber: observation.moveNumber,
        drift: drift.magnitude,
        replayActive: false
      });
    }
  }

  return observation;
}

function onBridgeBestmoveV0(detail) {
  const fen = String(detail?.fen || "");
  if (!fen || !detail?.stockfishEval?.bestMove) return;
  teacherByFenV0.set(fen, detail);
  if (teacherByFenV0.size > 64) {
    const firstKey = teacherByFenV0.keys().next().value;
    if (firstKey) teacherByFenV0.delete(firstKey);
  }
}

function onBridgePlayedMoveV0(detail) {
  if (isReplayModeActiveV0()) {
    publishUgeRegistryV0(
      Object.freeze({
        schema: RHIZOH_UGE_ENGINE_HOOK_SCHEMA_V0,
        skipped: true,
        reason: "temporal_replay_active"
      })
    );
    return;
  }

  void processPlayedMoveObservationV0(detail);
}

async function processPlayedMoveObservationV0(detail) {
  const fenBefore = String(detail?.fenBefore || "");
  const rhizohMove = String(detail?.rhizohMove || detail?.san || "");
  if (!fenBefore || !rhizohMove) return;
  if (isReplayModeActiveV0()) return;

  moveCounterV0 += 1;
  const teacher = teacherByFenV0.get(fenBefore);
  let teacherMove = teacher?.stockfishEval?.bestMove || detail?.teacherMove || null;
  let stockfishEval = teacher?.stockfishEval || detail?.stockfishEval || null;

  if (!teacherMove) {
    const clusterBusy =
      detail?.cluster &&
      typeof window !== "undefined" &&
      Boolean(window.__rhizoh?.chessGameCluster?.running);
    if (!clusterBusy) {
      const analysis = await analyzeChessPositionViaTeacherV0(fenBefore, {
        movetimeMs: 240,
        depth: 8,
        queuePriority: CHESS_ENGINE_TASK_PRIORITY_V0.BACKGROUND,
        queueKind: CHESS_ENGINE_TASK_KIND_V0.ANALYSIS,
        queueLabel: "uge_teacher"
      });
      teacherMove = analysis?.bestMove || null;
      stockfishEval = analysis;
      if (teacherMove) {
        teacherByFenV0.set(fenBefore, {
          fen: fenBefore,
          stockfishEval: Object.freeze({
            bestMove: teacherMove,
            cp: analysis?.cp ?? null,
            mate: analysis?.mate ?? null,
            depth: analysis?.depth ?? 0,
            pv: analysis?.pv ?? ""
          })
        });
      }
    }
  }

  if (!teacherMove) return;

  observeRhizohUgeMovePairV0({
    fenBefore,
    teacherMove,
    rhizohMove,
    stockfishEval,
    rhizohEval: detail?.rhizohEval || null,
    matchId: detail?.matchId || matchIdV0,
    moveNumber: detail?.moveNumber || moveCounterV0
  });
}

/**
 * Attach UGE to EngineBridge — call from Chess Arena open lifecycle, not app boot.
 * @param {{ matchId?: string }} [opts]
 */
export function attachRhizohUgeEngineHookV0(opts = {}) {
  if (attachedV0) return false;
  matchIdV0 = opts.matchId || `chess_live_${Date.now().toString(36)}`;
  moveCounterV0 = 0;
  teacherByFenV0.clear();
  liveObservationsV0.length = 0;

  unsubscribeBestmoveV0 = onChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.BESTMOVE, onBridgeBestmoveV0);
  unsubscribePlayedV0 = onChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.PLAYED_MOVE, onBridgePlayedMoveV0);
  attachedV0 = true;
  publishUgeRegistryV0();
  return true;
}

/** Detach UGE from EngineBridge — call when Chess Arena closes. */
export function detachRhizohUgeEngineHookV0() {
  if (!attachedV0) return false;
  unsubscribeBestmoveV0?.();
  unsubscribePlayedV0?.();
  unsubscribeBestmoveV0 = null;
  unsubscribePlayedV0 = null;
  attachedV0 = false;
  teacherByFenV0.clear();
  publishUgeRegistryV0();
  return true;
}

export function isRhizohUgeEngineHookAttachedV0() {
  return attachedV0;
}

export function summarizeRhizohUgeLiveObservationsV0() {
  return summarizeDriftCubeV0(liveObservationsV0.map((o) => o.cubePoint));
}

/** @internal test reset */
export function __resetRhizohUgeEngineHookForTestV0() {
  detachRhizohUgeEngineHookV0();
  liveObservationsV0.length = 0;
  matchIdV0 = null;
  moveCounterV0 = 0;
  teacherByFenV0.clear();
  if (typeof window !== "undefined" && window.__rhizoh?.uge) {
    delete window.__rhizoh.uge;
  }
}

/**
 * Emit played_move through bridge — used by arena telemetry path.
 * @param {object} row
 */
export function emitRhizohUgePlayedMoveV0(row) {
  return emitChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.PLAYED_MOVE, row);
}
