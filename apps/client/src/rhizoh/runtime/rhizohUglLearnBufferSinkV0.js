/**
 * UGL learn buffer sink — WAL writes decoupled from play lock / engine.
 * Engine enrichment drains when idle via registered handler.
 * RESEARCH-ONLY
 */

import { appendUglTrainingRecordV0 } from "./rhizohUglTrainingRecordV0.js";
import { getActiveUglLeagueTierV0 } from "./rhizohUglLeagueHarnessV0.js";
import { getChessEngineQueueSnapshotV0 } from "./chessEngineTaskQueueV0.js";
import { CHESS_ENGINE_TASK_KIND_V0 } from "./chessEngineTaskQueueV0.js";
import { isChessArenaWorkspaceOpenV0 } from "./chessEngineContentionGateV0.js";

export const RHIZOH_UGL_LEARN_BUFFER_SCHEMA_V0 = "castle.rhizoh.ugl_learn_buffer.v0";

const MAX_BUFFER_V0 = 128;
/** @type {object[]} */
let bufferRingV0 = [];
let walWritesV0 = 0;
let enrichAttemptsV0 = 0;
let enrichSuccessV0 = 0;
let drainingV0 = false;
/** @type {((row: object) => Promise<unknown>) | null} */
let enrichHandlerV0 = null;

export function registerUglLearnBufferEnrichHandlerV0(handler) {
  enrichHandlerV0 = typeof handler === "function" ? handler : null;
}

function isEngineIdleForLearnEnrichmentV0() {
  if (isChessArenaWorkspaceOpenV0()) return false;
  const queue = getChessEngineQueueSnapshotV0();
  const playPending =
    (queue.pendingByPriority?.arena || 0) + (queue.pendingByPriority?.cluster || 0);
  if (playPending > 0) return false;
  if (
    queue.active?.kind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE ||
    queue.active?.kind === CHESS_ENGINE_TASK_KIND_V0.ARENA_MOVE
  ) {
    return false;
  }
  return true;
}

/**
 * @param {{ slot: object, moveRow: object, fenBefore: string }} obs
 */
export function enqueueUglLearnBufferObservationV0(obs) {
  const slot = obs?.slot;
  const moveRow = obs?.moveRow;
  const fenBefore = String(obs?.fenBefore || moveRow?.fenBefore || "").trim();
  if (!slot || !moveRow || !fenBefore) return null;

  const record = appendUglTrainingRecordV0({
    position: fenBefore,
    playedMove: moveRow.uci || moveRow.san || null,
    expectedMove: null,
    evalDelta: null,
    leagueTier: getActiveUglLeagueTierV0(),
    matchId: slot.matchId,
    slotId: slot.slotId,
    source: "learn_buffer_move"
  });
  walWritesV0 += 1;

  bufferRingV0 = [
    Object.freeze({ slot, moveRow, fenBefore, enqueuedAt: Date.now() }),
    ...bufferRingV0
  ].slice(0, MAX_BUFFER_V0);

  void drainUglLearnBufferV0();
  return record;
}

export async function drainUglLearnBufferV0() {
  if (drainingV0 || bufferRingV0.length === 0 || !enrichHandlerV0) return;
  if (!isEngineIdleForLearnEnrichmentV0()) return;

  drainingV0 = true;
  try {
    while (bufferRingV0.length > 0 && isEngineIdleForLearnEnrichmentV0()) {
      const row = bufferRingV0.pop();
      if (!row) break;
      enrichAttemptsV0 += 1;
      try {
        const out = await enrichHandlerV0(row);
        if (out) enrichSuccessV0 += 1;
      } catch {
        /* noop */
      }
    }
  } finally {
    drainingV0 = false;
  }
}

export function getUglLearnBufferSnapshotV0() {
  return Object.freeze({
    schema: `${RHIZOH_UGL_LEARN_BUFFER_SCHEMA_V0}.snapshot`,
    buffered: bufferRingV0.length,
    walWrites: walWritesV0,
    enrichAttempts: enrichAttemptsV0,
    enrichSuccess: enrichSuccessV0,
    engineIdle: isEngineIdleForLearnEnrichmentV0(),
    draining: drainingV0,
    handlerRegistered: Boolean(enrichHandlerV0),
    note: "WAL sink immediate; MultiPV enrichment when play pipeline idle",
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetUglLearnBufferForTestV0() {
  bufferRingV0 = [];
  walWritesV0 = 0;
  enrichAttemptsV0 = 0;
  enrichSuccessV0 = 0;
  drainingV0 = false;
  enrichHandlerV0 = null;
}
