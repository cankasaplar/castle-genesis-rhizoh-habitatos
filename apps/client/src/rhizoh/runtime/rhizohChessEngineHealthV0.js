/**
 * Chess engine health dashboard — timeout + queue + scheduler observability.
 * RESEARCH-ONLY
 */

import { getChessEngineQueueSnapshotV0 } from "./chessEngineTaskQueueV0.js";
import { getChessEngineContentionSnapshotV0 } from "./chessEngineContentionGateV0.js";
import { getChessStockfishEngineDetailV0 } from "./chessStockfishEngineV0.js";
import { getUglMatchSchedulerSnapshotV0 } from "./rhizohUglMatchSchedulerV0.js";
import { getChessSchedulerUnifySnapshotV0 } from "./chessSchedulerUnifyV0.js";

export const RHIZOH_CHESS_ENGINE_HEALTH_SCHEMA_V0 = "castle.rhizoh.chess_engine_health.v0";
export const RHIZOH_CHESS_ENGINE_TIMEOUT_EVENT_V0 = "rhizoh:chess-engine-timeout-v0";

const MAX_TIMEOUT_RING_V0 = 64;
/** @type {object[]} */
let timeoutRingV0 = [];
let timeoutCountV0 = 0;

/**
 * @param {{ matchId?: string, slotId?: number|null, fen?: string, movetimeMs?: number, depth?: number, timeoutMs?: number }} detail
 */
export function recordChessEngineTimeoutV0(detail = {}) {
  timeoutCountV0 += 1;
  const row = Object.freeze({
    schema: `${RHIZOH_CHESS_ENGINE_HEALTH_SCHEMA_V0}.timeout`,
    count: timeoutCountV0,
    matchId: detail.matchId || null,
    slotId: detail.slotId ?? null,
    fen: detail.fen ? String(detail.fen).slice(0, 48) : null,
    movetimeMs: detail.movetimeMs ?? null,
    depth: detail.depth ?? null,
    timeoutMs: detail.timeoutMs ?? null,
    atMs: Date.now()
  });
  timeoutRingV0 = [row, ...timeoutRingV0].slice(0, MAX_TIMEOUT_RING_V0);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RHIZOH_CHESS_ENGINE_TIMEOUT_EVENT_V0, { detail: row }));
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessEngineHealth = buildChessEngineHealthReportV0();
  }
  return row;
}

export function buildChessEngineHealthReportV0() {
  const queue = getChessEngineQueueSnapshotV0();
  const contention = getChessEngineContentionSnapshotV0();
  const scheduler = getUglMatchSchedulerSnapshotV0();
  const chessLock = getChessSchedulerUnifySnapshotV0();
  const engine = getChessStockfishEngineDetailV0();

  const playPending =
    (queue.pendingByPriority?.arena || 0) + (queue.pendingByPriority?.cluster || 0);
  const learnPending = queue.pendingByPriority?.learning || 0;

  return Object.freeze({
    schema: RHIZOH_CHESS_ENGINE_HEALTH_SCHEMA_V0,
    status: engine.status,
    timeoutCount: timeoutCountV0,
    recentTimeouts: Object.freeze(timeoutRingV0.slice(0, 8)),
    queue: Object.freeze({
      pending: queue.pendingCount,
      playPending,
      learnPending,
      active: queue.active,
      preemptCount: queue.preemptCount,
      clusterSuperseded: queue.clusterSupersededCount
    }),
    contention,
    uglScheduler: scheduler,
    chessLock,
    bottleneck:
      timeoutCountV0 > 0 && playPending > 0
        ? "play_pipeline_latency"
        : contention.contended
          ? "engine_contention"
          : null,
    apis: Object.freeze({
      report: "window.__rhizoh.chessEngineHealthReport()",
      timeouts: "timeout ring on RHIZOH_CHESS_ENGINE_TIMEOUT_EVENT_V0"
    }),
    atMs: Date.now()
  });
}

export function ensureChessEngineHealthDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessEngineHealthReport = () => buildChessEngineHealthReportV0();
  if (!window.__rhizoh.chessEngineHealth) {
    window.__rhizoh.chessEngineHealth = buildChessEngineHealthReportV0();
  }
  return window.__rhizoh.chessEngineHealthReport;
}

/** @internal vitest */
export function __resetChessEngineHealthForTestV0() {
  timeoutRingV0 = [];
  timeoutCountV0 = 0;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.chessEngineHealth;
    delete window.__rhizoh.chessEngineHealthReport;
  }
}
