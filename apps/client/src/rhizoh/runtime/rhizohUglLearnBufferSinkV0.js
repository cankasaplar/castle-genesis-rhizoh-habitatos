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
/** Enrich handler returns this when throttled — row stays in buffer. */
export const CHESS_LEARNING_ENRICH_RETRY_V0 = Symbol.for("castle.rhizoh.chess_learning_enrich_retry.v0");

const MAX_BUFFER_V0 = 128;
/** @type {object[]} */
let bufferRingV0 = [];
let walWritesV0 = 0;
let enrichAttemptsV0 = 0;
let enrichSuccessV0 = 0;
let enrichThrottleSkipsV0 = 0;
let drainingV0 = false;
/** @type {((row: object) => Promise<unknown>) | null} */
let enrichHandlerV0 = null;

export function registerUglLearnBufferEnrichHandlerV0(handler) {
  enrichHandlerV0 = typeof handler === "function" ? handler : null;
}

function isEngineIdleForLearnEnrichmentV0() {
  if (isChessArenaWorkspaceOpenV0()) return false;
  const queue = getChessEngineQueueSnapshotV0();
  if ((queue.pendingByPriority?.arena || 0) > 0) return false;
  if (queue.active?.kind === CHESS_ENGINE_TASK_KIND_V0.ARENA_MOVE) return false;
  // Cluster may run continuously — learn MultiPV interleaves via LEARNING_MEASURE priority.
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
    // One row per drain tick — burst pops + throttle used to drop rows permanently.
    const row = bufferRingV0.pop();
    if (!row) return;
    enrichAttemptsV0 += 1;
    try {
      const out = await enrichHandlerV0(row);
      if (out === CHESS_LEARNING_ENRICH_RETRY_V0) {
        bufferRingV0.push(row);
        enrichThrottleSkipsV0 += 1;
        return;
      }
      if (out) enrichSuccessV0 += 1;
    } catch {
      bufferRingV0.push(row);
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
    enrichThrottleSkips: enrichThrottleSkipsV0,
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
  enrichThrottleSkipsV0 = 0;
  drainingV0 = false;
  enrichHandlerV0 = null;
}
