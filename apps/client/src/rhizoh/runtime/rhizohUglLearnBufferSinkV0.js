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

export const CHESS_LEARN_BUFFER_MAX_V0 = 128;
const MAX_BUFFER_V0 = CHESS_LEARN_BUFFER_MAX_V0;
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
 * @param {number} [buffered]
 */
export function resolveLearnDrainBurstLimitV0(buffered = bufferRingV0.length) {
  const n = Number(buffered) || 0;
  if (n > 96) return 4;
  if (n > 64) return 3;
  if (n > 32) return 2;
  return 1;
}

/**
 * @param {number} [buffered]
 */
export function resolveLearnDrainIntervalMsV0(buffered = bufferRingV0.length) {
  const n = Number(buffered) || 0;
  if (n > 96) return 400;
  if (n > 64) return 600;
  if (n > 32) return 800;
  return 1000;
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
    const burstLimit = resolveLearnDrainBurstLimitV0(bufferRingV0.length);
    let processed = 0;
    while (
      processed < burstLimit &&
      bufferRingV0.length > 0 &&
      isEngineIdleForLearnEnrichmentV0()
    ) {
      const row = bufferRingV0.pop();
      if (!row) break;
      enrichAttemptsV0 += 1;
      try {
        const out = await enrichHandlerV0(row);
        if (out === CHESS_LEARNING_ENRICH_RETRY_V0) {
          bufferRingV0.push(row);
          enrichThrottleSkipsV0 += 1;
          break;
        }
        if (out) enrichSuccessV0 += 1;
        processed += 1;
      } catch {
        bufferRingV0.push(row);
        break;
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
    enrichThrottleSkips: enrichThrottleSkipsV0,
    drainBurstLimit: resolveLearnDrainBurstLimitV0(bufferRingV0.length),
    drainIntervalMs: resolveLearnDrainIntervalMsV0(bufferRingV0.length),
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
