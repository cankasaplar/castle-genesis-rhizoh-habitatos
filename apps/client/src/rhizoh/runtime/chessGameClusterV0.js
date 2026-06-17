/**
 * Chess Game Cluster v0 — 8 parallel AI vs AI matches, round-robin Stockfish scheduler.
 * Simulation layer — always on; independent of spatial/world gates.
 * RESEARCH-ONLY
 */

import {
  CHESS_GAME_MODE_V0,
  createChessArenaGameV0
} from "./chessArenaEngineV0.js";
import { pickChessArenaEngineMoveV0 } from "./chessStockfishEngineV0.js";
import {
  CHESS_CLUSTER_SLOT_AGENTS_V0,
  resolveChessClusterAgentPolicyV0,
  resolveChessClusterStockfishOptsV0
} from "./chessClusterAgentPolicyV0.js";
import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  emitChessEngineBridgeV0
} from "./chessEngineBridgeV0.js";
import { observeChessClusterMoveV0 } from "./chessClusterObserverV0.js";
import { finalizeChessClusterGameV0 } from "./chessClusterLearningV0.js";
import { getChessClusterMemoryGraphSnapshotV0 } from "./chessClusterMemoryGraphV0.js";

export const CHESS_GAME_CLUSTER_SCHEMA_V0 = "castle.rhizoh.chess_game_cluster.v0";
export const CHESS_CLUSTER_SLOT_COUNT_V0 = 8;
export const CHESS_CLUSTER_TICK_EVENT_V0 = "rhizoh:chess-cluster-tick-v0";
export const CHESS_CLUSTER_MOVE_EVENT_V0 = "rhizoh:chess-cluster-move-v0";
export const CHESS_CLUSTER_GAME_END_EVENT_V0 = "rhizoh:chess-cluster-game-end-v0";
export const RHIZOH_OPEN_CHESS_CLUSTER_ARENA_EVENT_V0 = "RHIZOH_OPEN_CHESS_CLUSTER_ARENA";

/** @type {object[]} */
let slotsV0 = [];
let runningV0 = false;
let tickCountV0 = 0;
/** @type {ReturnType<typeof setInterval> | null} */
let tickTimerV0 = null;
let roundRobinIndexV0 = 0;
let busyV0 = false;

function createSlotV0(slotId) {
  const pair = CHESS_CLUSTER_SLOT_AGENTS_V0[slotId] || CHESS_CLUSTER_SLOT_AGENTS_V0[0];
  const matchId = `cluster_${slotId}_${Date.now().toString(36)}`;
  const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
  return {
    slotId,
    matchId,
    game,
    whiteAgent: pair[0],
    blackAgent: pair[1],
    moveHistory: [],
    evalStream: [],
    attentionWeight: 1,
    status: "active",
    outcome: null,
    ply: 0,
    lastMoveAtMs: Date.now(),
    criticalEvents: []
  };
}

function resetSlotV0(slot) {
  return createSlotV0(slot.slotId);
}

function publishClusterRegistryV0(extra = {}) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessGameCluster = Object.freeze({
    schema: CHESS_GAME_CLUSTER_SCHEMA_V0,
    running: runningV0,
    tickCount: tickCountV0,
    slotCount: CHESS_CLUSTER_SLOT_COUNT_V0,
    slots: slotsV0.map((s) => summarizeChessClusterSlotV0(s)),
    ...extra,
    atMs: Date.now()
  });
}

/**
 * @param {object} slot
 */
export function summarizeChessClusterSlotV0(slot) {
  if (!slot) return null;
  return Object.freeze({
    slotId: slot.slotId,
    matchId: slot.matchId,
    fen: slot.game.fen(),
    turn: slot.game.turn(),
    status: slot.status,
    outcome: slot.outcome,
    ply: slot.ply,
    moveCount: slot.moveHistory.length,
    whiteAgent: slot.whiteAgent,
    blackAgent: slot.blackAgent,
    attentionWeight: slot.attentionWeight,
    lastEval: slot.evalStream[slot.evalStream.length - 1] || null,
    criticalEventCount: slot.criticalEvents.length
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

function dispatchClusterEventV0(name, detail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(name, { detail: Object.freeze(detail) }));
  } catch {
    /* noop */
  }
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
  const engine = await pickChessArenaEngineMoveV0(slot.game, {
    useStockfish: true,
    ...resolveChessClusterStockfishOptsV0(agentId)
  });

  const moveUci = engine?.move;
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
    fenBefore,
    fenAfter: result.fen,
    turn,
    agentId,
    engine: engine.engine || "unknown",
    atMs: Date.now()
  });

  slot.moveHistory.push(moveRow);
  slot.ply += 1;
  slot.lastMoveAtMs = Date.now();

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
    slot.status = "ended";
    slot.outcome = outcome;
    dispatchClusterEventV0(CHESS_CLUSTER_GAME_END_EVENT_V0, {
      slot: summarizeChessClusterSlotV0(slot),
      outcome,
      moves: [...slot.moveHistory]
    });
    void finalizeChessClusterGameV0(slot).then(() => {
      slotsV0[slot.slotId] = resetSlotV0(slot);
      publishClusterRegistryV0();
    });
  }

  return moveRow;
}

async function runClusterTickV0() {
  if (!runningV0 || busyV0 || slotsV0.length === 0) return;
  busyV0 = true;
  tickCountV0 += 1;

  let attempts = 0;
  let moved = false;
  while (attempts < CHESS_CLUSTER_SLOT_COUNT_V0 && !moved) {
    const idx = roundRobinIndexV0 % CHESS_CLUSTER_SLOT_COUNT_V0;
    roundRobinIndexV0 = (roundRobinIndexV0 + 1) % CHESS_CLUSTER_SLOT_COUNT_V0;
    attempts += 1;
    const slot = slotsV0[idx];
    if (slot?.status === "active" && !slot.game.isGameOver()) {
      const move = await advanceChessClusterSlotV0(slot);
      moved = Boolean(move);
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
  busyV0 = false;
}

/**
 * Start 8-game cluster simulation.
 * @param {{ intervalMs?: number }} [opts]
 */
export function startChessGameClusterV0(opts = {}) {
  if (typeof window === "undefined") return { ok: false, reason: "no_window" };
  if (runningV0) {
    return Object.freeze({ ok: true, already: true, running: true, slotCount: CHESS_CLUSTER_SLOT_COUNT_V0 });
  }
  const intervalMs = Math.max(120, Number(opts.intervalMs) || 320);

  slotsV0 = Array.from({ length: CHESS_CLUSTER_SLOT_COUNT_V0 }, (_, i) => createSlotV0(i));
  runningV0 = true;
  tickCountV0 = 0;
  roundRobinIndexV0 = 0;
  busyV0 = false;

  if (tickTimerV0) clearInterval(tickTimerV0);
  tickTimerV0 = setInterval(() => {
    void runClusterTickV0();
  }, intervalMs);

  void runClusterTickV0();
  publishClusterRegistryV0({ started: true });
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
    intervalMs
  });
}

export function stopChessGameClusterV0() {
  runningV0 = false;
  if (tickTimerV0) {
    clearInterval(tickTimerV0);
    tickTimerV0 = null;
  }
  publishClusterRegistryV0({ stopped: true });
  return { ok: true, running: false };
}

export function isChessGameClusterRunningV0() {
  return runningV0;
}

/** @internal vitest */
export function __resetChessGameClusterForTestV0() {
  stopChessGameClusterV0();
  slotsV0 = [];
  tickCountV0 = 0;
  roundRobinIndexV0 = 0;
  busyV0 = false;
}

/** @internal vitest — direct slot access */
export function __getChessClusterSlotsForTestV0() {
  return slotsV0;
}
