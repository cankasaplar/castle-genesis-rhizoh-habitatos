/**
 * Chess Game Cluster v0 — Rhizoh Multi-Arena Learning Loop.
 * 8 boards (parallel games) → 1 shared Stockfish worker → MultiPV learning trace.
 * Simulation + learning survive engine sandbox failures (heuristic fallback).
 * RESEARCH-ONLY
 */

import { pickChessArenaAiMoveV0, CHESS_GAME_MODE_V0, createChessArenaGameV0 } from "./chessArenaEngineV0.js";
import { pickChessClusterMoveV0 } from "./chessClusterMovePickerV0.js";
import { resolveChessClusterSlotModeV0 } from "./chessClusterSlotModesV0.js";
import { getChessClusterEngineSchedulerSnapshotV0 } from "./chessClusterEngineSchedulerV0.js";
import { resolveChessClusterAgentPolicyV0 } from "./chessClusterAgentPolicyV0.js";
import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  emitChessEngineBridgeV0
} from "./chessEngineBridgeV0.js";
import { observeChessClusterMoveV0 } from "./chessClusterObserverV0.js";
import { finalizeChessClusterGameV0 } from "./chessClusterLearningV0.js";
import { getChessClusterMemoryGraphSnapshotV0 } from "./chessClusterMemoryGraphV0.js";
import {
  applyChessClusterClockIncrementV0,
  createChessClusterClockStateV0,
  summarizeChessClusterClockV0,
  tickChessClusterSlotClockV0
} from "./chessClusterClockV0.js";
import { ensureChessLearningMonitorListenersV0, CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";
import { ensureRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";
import { shouldPauseClusterTickForArenaV0 } from "./chessEngineContentionGateV0.js";
import {
  CHESS_CLUSTER_BROADCAST_TICK_MIN_MS_V0,
  isChessClusterBroadcastModeV0,
  resolveChessClusterBroadcastMovesPerTickV0,
  resolveChessClusterBroadcastTickPlanV0,
  resolveChessClusterTickSlotOrderV0,
  shouldFinalizeClusterBroadcastEndV0,
  shouldTickChessClusterSlotClockV0
} from "./chessClusterBroadcastEnginePolicyV0.js";
import { resolveChessLegalMoveUciV0 } from "./chessArenaMoveResolveV0.js";
import { logChessMovePlayedV0 } from "./chessArenaTelemetryV0.js";
import { publishRhizohChessManagerV0 } from "./rhizohChessManagerV0.js";
import { publishChessGameRouterV0 } from "./chessGameRouterV0.js";
import {
  CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0,
  CHESS_CLUSTER_FEATURED_MAX_PLY_V0,
  CHESS_CLUSTER_FEATURED_TIME_CONTROL_ID_V0,
  CHESS_CLUSTER_MAX_PLY_V0,
  isChessClusterSimulationTimeControlIdV0,
  resolveChessClusterBootOptsV0,
  resolveChessClusterTimeControlV0,
  shouldEndChessClusterGameByPlyCapV0
} from "./chessClusterSimulationPolicyV0.js";
import {
  CHESS_SCHEDULER_MIN_GAP_MS_V0,
  endChessSchedulerCallV0,
  tryBeginChessSchedulerCallV0,
  __resetChessSchedulerUnifyForTestV0
} from "./chessSchedulerUnifyV0.js";
import { CHESS_ARENA_SESSION_EVENT_V0 } from "./chessArenaSessionV0.js";

export const CHESS_GAME_CLUSTER_SCHEMA_V0 = "castle.rhizoh.chess_game_cluster.v0";
export const CHESS_CLUSTER_SLOT_COUNT_V0 = 8;
/** Minimum wall-clock gap between cluster engine ticks (prod). */
export const CHESS_CLUSTER_MIN_INTERVAL_MS_V0 = 800;
/** Default cluster tick floor when boot does not override. */
export const CHESS_CLUSTER_DEFAULT_INTERVAL_MS_V0 = 900;
/** Upper bound for adaptive reschedule after slow WASM moves. */
export const CHESS_CLUSTER_MAX_INTERVAL_MS_V0 = 2400;
export const CHESS_CLUSTER_TICK_EVENT_V0 = "rhizoh:chess-cluster-tick-v0";
export const CHESS_CLUSTER_MOVE_EVENT_V0 = "rhizoh:chess-cluster-move-v0";
export const CHESS_CLUSTER_GAME_END_EVENT_V0 = "rhizoh:chess-cluster-game-end-v0";
export const RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0 = "RHIZOH_OPEN_CHESS_CLUSTER_ARENA";

/** @type {object[]} */
let slotsV0 = [];
let runningV0 = false;
let tickCountV0 = 0;
/** @type {ReturnType<typeof setTimeout> | null} */
let tickTimerV0 = null;
/** @type {ReturnType<typeof setInterval> | null} */
let clockTimerV0 = null;
let roundRobinIndexV0 = 0;
let busyV0 = false;
let lastMoveWallMsV0 = 0;
let configuredMinIntervalMsV0 = CHESS_CLUSTER_DEFAULT_INTERVAL_MS_V0;
let testFastTickV0 = false;
let clusterTimeControlIdV0 = CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0;
let clusterMaxPlyV0 = CHESS_CLUSTER_MAX_PLY_V0;
let sessionGamesEndedV0 = 0;
let featuredRhizohColorV0 = "w";
/** @type {object | null} */
let lastGameEndV0 = null;
let sessionListenerInstalledV0 = false;

function ensureChessClusterSessionListenerV0() {
  if (typeof window === "undefined" || sessionListenerInstalledV0) return;
  sessionListenerInstalledV0 = true;
  window.addEventListener(CHESS_ARENA_SESSION_EVENT_V0, (ev) => {
    const tcId = ev?.detail?.timeControlId;
    if (!tcId || !runningV0) return;
    if (!isChessClusterSimulationTimeControlIdV0(tcId)) return;
    applyChessClusterTimeControlV0(tcId);
  });
}

/**
 * Hot-apply arena session time control to active cluster slots (ply 0 clocks reset).
 * @param {string} timeControlId
 */
export function applyChessClusterTimeControlV0(timeControlId) {
  const tc = resolveChessClusterTimeControlV0(timeControlId);
  clusterTimeControlIdV0 = tc.id;
  for (const slot of slotsV0) {
    if (!slot || slot.status !== "active") continue;
    const slotTcId = resolveSlotTimeControlIdV0(slot.slotId);
    slot.timeControlId = slotTcId;
    const slotTc = resolveChessClusterTimeControlV0(slotTcId);
    slot.incrementMs = slotTc.incrementMs;
    if ((slot.ply || 0) < 1) {
      slot.whiteClockMs = slotTc.initialMs;
      slot.blackClockMs = slotTc.initialMs;
    }
  }
  publishClusterRegistryV0({ timeControlId: tc.id });
}

function resolveSlotTimeControlIdV0(slotId) {
  return Number(slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0
    ? CHESS_CLUSTER_FEATURED_TIME_CONTROL_ID_V0
    : clusterTimeControlIdV0;
}

function resolveSlotMaxPlyV0(slotId) {
  return Number(slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0
    ? CHESS_CLUSTER_FEATURED_MAX_PLY_V0
    : clusterMaxPlyV0;
}

function createSlotV0(slotId, timeControlId = clusterTimeControlIdV0) {
  const mode = resolveChessClusterSlotModeV0(slotId);
  const slotTcId = resolveSlotTimeControlIdV0(slotId);
  const clock = createChessClusterClockStateV0(slotTcId);
  const matchId = `cluster_${slotId}_${Date.now().toString(36)}`;
  const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
  let rhizohColor = "w";
  let whiteAgent = mode.whiteAgent;
  let blackAgent = mode.blackAgent;
  if (Number(slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) {
    rhizohColor = featuredRhizohColorV0;
    if (rhizohColor === "b") {
      whiteAgent = mode.blackAgent;
      blackAgent = mode.whiteAgent;
    }
  }
  return {
    slotId,
    matchId,
    modeId: mode.modeId,
    modeLabel: mode.label,
    learningTag: mode.learningTag,
    spectatorFeatured: Boolean(mode.spectatorFeatured),
    rhizohColor,
    game,
    whiteAgent,
    blackAgent,
    timeControlId: clock.timeControlId,
    whiteClockMs: clock.whiteClockMs,
    blackClockMs: clock.blackClockMs,
    incrementMs: clock.incrementMs,
    moveHistory: [],
    evalStream: [],
    attentionWeight: 1,
    status: "active",
    outcome: null,
    endReason: null,
    ply: 0,
    lastMoveAtMs: Date.now(),
    criticalEvents: []
  };
}

function resetSlotV0(slot) {
  if (Number(slot?.slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) {
    featuredRhizohColorV0 = featuredRhizohColorV0 === "w" ? "b" : "w";
  }
  return createSlotV0(slot.slotId, clusterTimeControlIdV0);
}

function publishClusterRegistryV0(extra = {}) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessGameCluster = Object.freeze({
    schema: CHESS_GAME_CLUSTER_SCHEMA_V0,
    architecture: "single_engine_multi_pv",
    running: runningV0,
    tickCount: tickCountV0,
    slotCount: CHESS_CLUSTER_SLOT_COUNT_V0,
    engineScheduler: getChessClusterEngineSchedulerSnapshotV0(),
    sessionGamesEnded: sessionGamesEndedV0,
    lastGameEnd: lastGameEndV0 ? Object.freeze({ ...lastGameEndV0 }) : null,
    slots: slotsV0.map((s) => summarizeChessClusterSlotV0(s)),
    ...extra,
    atMs: Date.now()
  });
  publishRhizohChessManagerV0("cluster_registry");
  publishChessGameRouterV0("cluster_registry");
}

/**
 * @param {object} slot
 */
export function summarizeChessClusterSlotV0(slot) {
  if (!slot) return null;
  return Object.freeze({
    slotId: slot.slotId,
    matchId: slot.matchId,
    modeId: slot.modeId,
    modeLabel: slot.modeLabel,
    spectatorFeatured: Boolean(slot.spectatorFeatured),
    fen: slot.game.fen(),
    turn: slot.game.turn(),
    status: slot.status,
    outcome: slot.outcome,
    endReason: slot.endReason || null,
    ply: slot.ply,
    moveCount: slot.moveHistory.length,
    whiteAgent: slot.whiteAgent,
    blackAgent: slot.blackAgent,
    rhizohColor: slot.rhizohColor || "w",
    attentionWeight: slot.attentionWeight,
    lastEval: slot.evalStream[slot.evalStream.length - 1] || null,
    criticalEventCount: slot.criticalEvents.length,
    clock: summarizeChessClusterClockV0(slot),
    lastMove: (() => {
      const hist = slot.moveHistory[slot.moveHistory.length - 1];
      if (!hist) return null;
      return Object.freeze({ uci: hist.uci, san: hist.san });
    })()
  });
}

export function listChessClusterSlotsV0() {
  return slotsV0.map((s) => summarizeChessClusterSlotV0(s));
}

export function getChessClusterSlotV0(slotId) {
  const id = Number(slotId);
  const slot = slotsV0[id];
  return slot ? summarizeChessClusterSlotV0(slot) : null;
}

/**
 * @param {{ intervalMs?: number, minIntervalMs?: number, testFastTick?: boolean }} [opts]
 */
export function resolveChessClusterMinIntervalMsV0(opts = {}) {
  if (opts.testFastTick) {
    return Math.max(20, Number(opts.minIntervalMs ?? opts.intervalMs) || 50);
  }
  const requested =
    Number(opts.minIntervalMs ?? opts.intervalMs) || CHESS_CLUSTER_DEFAULT_INTERVAL_MS_V0;
  return Math.max(CHESS_CLUSTER_MIN_INTERVAL_MS_V0, requested);
}

/**
 * Adaptive delay — never schedule the next tick until the previous move wall time elapses.
 * @param {number} [lastMoveMs]
 */
export function resolveChessClusterTickDelayMsV0(lastMoveMs = lastMoveWallMsV0) {
  const floorMs = isChessClusterBroadcastModeV0()
    ? Math.min(configuredMinIntervalMsV0, CHESS_CLUSTER_BROADCAST_TICK_MIN_MS_V0)
    : configuredMinIntervalMsV0;
  const adaptive = Math.max(floorMs, Number(lastMoveMs) || 0);
  return Math.min(CHESS_CLUSTER_MAX_INTERVAL_MS_V0, adaptive);
}

function scheduleClusterTickV0() {
  if (!runningV0) return;
  if (tickTimerV0) clearTimeout(tickTimerV0);
  const delayMs = resolveChessClusterTickDelayMsV0();
  tickTimerV0 = setTimeout(() => {
    tickTimerV0 = null;
    void runClusterTickV0({ testFast: testFastTickV0 }).finally(() => {
      if (runningV0) scheduleClusterTickV0();
    });
  }, delayMs);
}

function dispatchClusterEventV0(name, detail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(name, { detail: Object.freeze(detail) }));
  } catch {
    /* noop */
  }
}

function snapshotChessClusterSlotForFinalizeV0(slot, outcome, endReason) {
  return Object.freeze({
    slotId: slot.slotId,
    matchId: slot.matchId,
    modeId: slot.modeId,
    outcome,
    endReason,
    ply: slot.ply,
    moveHistory: [...slot.moveHistory],
    criticalEvents: [...(slot.criticalEvents || [])]
  });
}

function endChessClusterSlotV0(slot, outcome, endReason = "normal") {
  if (!slot || slot.status === "ended") return;
  if (!shouldFinalizeClusterBroadcastEndV0(slot, outcome, endReason)) return;
  const endedSummary = summarizeChessClusterSlotV0({
    ...slot,
    status: "ended",
    outcome,
    endReason
  });
  const finalizePayload = snapshotChessClusterSlotForFinalizeV0(slot, outcome, endReason);
  sessionGamesEndedV0 += 1;
  lastGameEndV0 = Object.freeze({
    slotId: slot.slotId,
    matchId: slot.matchId,
    outcome,
    endReason,
    ply: slot.ply,
    atMs: Date.now()
  });
  dispatchClusterEventV0(CHESS_CLUSTER_GAME_END_EVENT_V0, {
    slot: endedSummary,
    outcome,
    endReason,
    moves: [...slot.moveHistory]
  });
  slotsV0[slot.slotId] = resetSlotV0(slot);
  publishClusterRegistryV0();
  void finalizeChessClusterGameV0(finalizePayload);
}

function runClusterClockTickV0() {
  if (!runningV0 || slotsV0.length === 0) return;
  for (const slot of slotsV0) {
    if (slot?.status !== "active") continue;
    if (!shouldTickChessClusterSlotClockV0(slot)) continue;
    const flagOutcome = tickChessClusterSlotClockV0(slot, 1000);
    if (flagOutcome) {
      if (shouldFinalizeClusterBroadcastEndV0(slot, flagOutcome, "timeout")) {
        endChessClusterSlotV0(slot, flagOutcome, "timeout");
      } else if (Number(slot.slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0) {
        const refillMs = 45_000;
        slot.whiteClockMs = Math.max(Number(slot.whiteClockMs) || 0, refillMs);
        slot.blackClockMs = Math.max(Number(slot.blackClockMs) || 0, refillMs);
      }
    }
  }
  publishClusterRegistryV0({ clockTick: true });
}

/**
 * Advance one slot by one move (async — Stockfish round-robin).
 * @param {object} slot
 */
async function advanceChessClusterSlotV0(slot) {
  if (!slot || slot.status !== "active" || slot.game.isGameOver()) return null;

  const turn = slot.game.turn();
  const agentId = turn === "w" ? slot.whiteAgent : slot.blackAgent;
  const policy = resolveChessClusterAgentPolicyV0(agentId);
  const moveStartedMs = Date.now();
  const engine = await pickChessClusterMoveV0(slot, slot.game);
  lastMoveWallMsV0 = Date.now() - moveStartedMs;

  let moveUci = resolveChessLegalMoveUciV0(slot.game, engine?.move);
  let engineLabel = engine?.engine || "unknown";
  if (!moveUci) {
    const legal = slot.game.legalMoves();
    if (legal.length) {
      const pick = legal[0];
      moveUci = `${pick.from}${pick.to}${pick.promotion || ""}`;
      engineLabel = "cluster_last_resort";
    }
  }
  if (!moveUci) return null;

  const fenBefore = slot.game.fen();
  const result = slot.game.tryMove(moveUci);
  if (!result.ok) return null;

  const moveRow = Object.freeze({
    slotId: slot.slotId,
    matchId: slot.matchId,
    ply: slot.ply + 1,
    san: result.move?.san || moveUci,
    uci: moveUci,
    color: turn,
    fenBefore,
    fenAfter: result.fen,
    turn,
    agentId,
    engine: engineLabel,
    atMs: Date.now()
  });

  slot.moveHistory.push(moveRow);
  slot.ply += 1;
  slot.lastMoveAtMs = Date.now();
  applyChessClusterClockIncrementV0(slot, turn);

  logChessMovePlayedV0({
    san: moveRow.san,
    color: turn === "w" ? "w" : "b",
    engine: moveRow.engine,
    fen: result.fen,
    fenBefore,
    slotId: slot.slotId,
    matchId: slot.matchId,
    moveNumber: slot.ply,
    policyMode: slot.modeId
  });

  emitChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.PLAYED_MOVE, {
    matchId: slot.matchId,
    slotId: slot.slotId,
    fen: result.fen,
    move: moveRow.san,
    agentId,
    cluster: true
  });

  const observation = observeChessClusterMoveV0(slot, moveRow, policy);
  if (observation?.evalDelta != null) {
    slot.evalStream.push(observation.evalDelta);
  }
  if (observation?.critical) {
    slot.criticalEvents.push(observation);
    slot.attentionWeight = Math.min(2.5, slot.attentionWeight + 0.18);
  }

  dispatchClusterEventV0(CHESS_CLUSTER_MOVE_EVENT_V0, {
    slot: summarizeChessClusterSlotV0(slot),
    move: moveRow,
    observation
  });

  const outcome = result.outcome || slot.game.outcome();
  if (outcome) {
    endChessClusterSlotV0(slot, outcome, "checkmate_or_draw");
  } else if (shouldEndChessClusterGameByPlyCapV0(slot.ply, resolveSlotMaxPlyV0(slot.slotId))) {
    endChessClusterSlotV0(slot, "draw", "max_ply_cap");
  }

  return moveRow;
}

async function runClusterTickV0(opts = {}) {
  if (!runningV0 || slotsV0.length === 0) return;
  if (shouldPauseClusterTickForArenaV0()) return;
  if (!tryBeginChessSchedulerCallV0({
    minGapMs: configuredMinIntervalMsV0,
    testFast: opts.testFast
  })) {
    return;
  }
  busyV0 = true;
  tickCountV0 += 1;

  let attempts = 0;
  let moved = false;
  let movesThisTick = 0;
  const movesPerTick = resolveChessClusterBroadcastMovesPerTickV0();
  const slotOrder = resolveChessClusterTickSlotOrderV0(
    roundRobinIndexV0,
    CHESS_CLUSTER_SLOT_COUNT_V0
  );
  try {
    const broadcastPlan = resolveChessClusterBroadcastTickPlanV0(roundRobinIndexV0);
    if (broadcastPlan) {
      for (const slotId of broadcastPlan) {
        roundRobinIndexV0 = (slotId + 1) % CHESS_CLUSTER_SLOT_COUNT_V0;
        const slot = slotsV0[slotId];
        if (slot?.status === "active" && !slot.game.isGameOver()) {
          const move = await advanceChessClusterSlotV0(slot);
          if (move) moved = true;
        }
      }
    } else {
      while (movesThisTick < movesPerTick && attempts < CHESS_CLUSTER_SLOT_COUNT_V0) {
        const slotId = slotOrder[attempts];
        attempts += 1;
        if (slotId == null) continue;
        roundRobinIndexV0 = (slotId + 1) % CHESS_CLUSTER_SLOT_COUNT_V0;
        const slot = slotsV0[slotId];
        if (slot?.status === "active" && !slot.game.isGameOver()) {
          const move = await advanceChessClusterSlotV0(slot);
          if (move) {
            moved = true;
            movesThisTick += 1;
          }
        }
      }
    }

    const snap = Object.freeze({
      schema: CHESS_GAME_CLUSTER_SCHEMA_V0,
      tickCount: tickCountV0,
      moved,
      slots: listChessClusterSlotsV0(),
      atMs: Date.now()
    });

    publishClusterRegistryV0({ lastTick: snap });
    dispatchClusterEventV0(CHESS_CLUSTER_TICK_EVENT_V0, snap);
  } finally {
    busyV0 = false;
    endChessSchedulerCallV0({
      releaseMs: Math.max(configuredMinIntervalMsV0, CHESS_SCHEDULER_MIN_GAP_MS_V0),
      testFast: opts.testFast
    });
  }
}

/**
 * Start 8-game cluster simulation.
 * @param {{ intervalMs?: number, minIntervalMs?: number, testFastTick?: boolean, timeControlId?: string }} [opts]
 */
export function startChessGameClusterV0(opts = {}) {
  if (typeof window === "undefined") return { ok: false, reason: "no_window" };
  if (runningV0) {
    return Object.freeze({ ok: true, already: true, running: true, slotCount: CHESS_CLUSTER_SLOT_COUNT_V0 });
  }
  configuredMinIntervalMsV0 = resolveChessClusterMinIntervalMsV0(opts);
  testFastTickV0 = Boolean(opts.testFastTick);
  const boot = resolveChessClusterBootOptsV0(opts);
  clusterTimeControlIdV0 = boot.timeControlId;
  clusterMaxPlyV0 = boot.maxPly;
  sessionGamesEndedV0 = 0;
  lastGameEndV0 = null;

  ensureChessLearningMonitorListenersV0();
  ensureChessClusterSessionListenerV0();
  ensureRhizohChessLearningReportV0();

  slotsV0 = Array.from({ length: CHESS_CLUSTER_SLOT_COUNT_V0 }, (_, i) =>
    createSlotV0(i, clusterTimeControlIdV0)
  );
  runningV0 = true;
  tickCountV0 = 0;
  roundRobinIndexV0 = 0;
  busyV0 = false;
  lastMoveWallMsV0 = 0;

  if (tickTimerV0) clearTimeout(tickTimerV0);
  tickTimerV0 = null;

  if (clockTimerV0) clearInterval(clockTimerV0);
  clockTimerV0 = setInterval(() => {
    runClusterClockTickV0();
  }, 1000);

  scheduleClusterTickV0();
  void runClusterTickV0({ testFast: testFastTickV0 });
  publishClusterRegistryV0({
    started: true,
    timeControlId: clusterTimeControlIdV0,
    maxPly: clusterMaxPlyV0,
    minIntervalMs: configuredMinIntervalMsV0,
    tickScheduling: "adaptive_settimeout_chess_lock"
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessClusterMemory = getChessClusterMemoryGraphSnapshotV0();
    window.__rhizoh.chessClusterLearning = Object.freeze({
      schema: "castle.rhizoh.chess_cluster_learning.registry.v0",
      last: null,
      atMs: Date.now()
    });
  }

  return Object.freeze({
    ok: true,
    running: true,
    slotCount: CHESS_CLUSTER_SLOT_COUNT_V0,
    minIntervalMs: configuredMinIntervalMsV0,
    timeControlId: clusterTimeControlIdV0
  });
}

export function stopChessGameClusterV0() {
  runningV0 = false;
  if (tickTimerV0) {
    clearTimeout(tickTimerV0);
    tickTimerV0 = null;
  }
  if (clockTimerV0) {
    clearInterval(clockTimerV0);
    clockTimerV0 = null;
  }
  publishClusterRegistryV0({ stopped: true });
  return { ok: true, running: false };
}

export function isChessGameClusterRunningV0() {
  return runningV0;
}

export function getChessClusterRouterMetaV0() {
  return Object.freeze({
    roundRobinIndex: roundRobinIndexV0,
    busy: busyV0,
    tickCount: tickCountV0,
    running: runningV0,
    slotCount: CHESS_CLUSTER_SLOT_COUNT_V0,
    minIntervalMs: configuredMinIntervalMsV0,
    lastMoveWallMs: lastMoveWallMsV0,
    nextTickDelayMs: runningV0 ? resolveChessClusterTickDelayMsV0() : 0
  });
}

/** @internal vitest */
export function __resetChessGameClusterForTestV0() {
  stopChessGameClusterV0();
  slotsV0 = [];
  tickCountV0 = 0;
  roundRobinIndexV0 = 0;
  busyV0 = false;
  lastMoveWallMsV0 = 0;
  configuredMinIntervalMsV0 = CHESS_CLUSTER_DEFAULT_INTERVAL_MS_V0;
  __resetChessSchedulerUnifyForTestV0();
  testFastTickV0 = false;
  clusterTimeControlIdV0 = CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0;
  sessionGamesEndedV0 = 0;
  lastGameEndV0 = null;
}

/** @internal vitest — direct slot access */
export function __getChessClusterSlotsForTestV0() {
  return slotsV0;
}

/** @internal vitest — trigger game end path */
export function __endChessClusterSlotForTestV0(slotId, outcome = "draw") {
  const slot = slotsV0[Number(slotId)];
  if (!slot) return null;
  endChessClusterSlotV0(slot, outcome, "test");
  return summarizeChessClusterSlotV0(slotsV0[Number(slotId)]);
}
