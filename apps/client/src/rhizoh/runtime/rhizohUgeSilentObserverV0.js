/**
 * UGE Silent Observer Mode — Phase 1 passive but complete observer.
 * Stockfish bestmove + Rhizoh move → embedding → drift → topology → store only.
 * RESEARCH-ONLY — zero policy change, zero move influence.
 */

import { analyzeRhizohRegretV0 } from "./chessRegretAnalysisV0.js";
import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
import { getChessStockfishEngineStatusV0 } from "./chessStockfishEngineV0.js";
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

export const RHIZOH_UGE_SILENT_OBSERVER_SCHEMA_V0 = "rhizoh.uge_silent_observer.v0";
export const RHIZOH_UGE_SILENT_OBSERVER_EVENT_V0 = "rhizoh:uge-silent-observer-v0";
export const RHIZOH_UGE_SILENT_OBSERVER_LOG_TAG_V0 = "[CASTLE_uge_silent_observer]";

/**
 * @param {{
 *   moves?: ReadonlyArray<string|object>,
 *   localColor?: 'w'|'b',
 *   matchId?: string|null,
 *   engineStatus?: string,
 *   regret?: object|null
 * }} opts
 */
export async function runRhizohUgeSilentObserverV0(opts = {}) {
  const engineStatus = opts.engineStatus || getChessStockfishEngineStatusV0();

  if (engineStatus === "heuristic_fallback") {
    return Object.freeze({
      schema: RHIZOH_UGE_SILENT_OBSERVER_SCHEMA_V0,
      skipped: true,
      reason: "teacher_offline",
      mode: "silent_observer",
      observationCount: 0,
      events: Object.freeze([]),
      governance: Object.freeze({
        policyInfluence: false,
        moveInfluence: false,
        phase: "silent_observer"
      })
    });
  }

  const fenRows = buildMatchMovesWithFenV0(opts.moves || []);
  const regret =
    opts.regret ||
    (await analyzeRhizohRegretV0({
      moves: opts.moves || [],
      localColor: opts.localColor === "b" ? "b" : "w",
      maxSamples: 16
    }));

  /** @type {object[]} */
  const observations = [];
  /** @type {object[]} */
  const events = [];

  for (const trace of regret.evalTrace || []) {
    const row = fenRows[(trace.moveNumber || 1) - 1];
    if (!row?.before || !row.san || !trace.bestMove) continue;

    const teacherTopology = encodeChessTopologyEventV0(row.before, trace.bestMove);
    const rhizohTopology = encodeChessTopologyEventV0(row.before, row.san);
    const drift = calculateTopologyDriftV0(rhizohTopology, teacherTopology);

    const cubePoint = commitDriftCubeObservationV0({
      sourceSpace: "chess_uge",
      matchId: opts.matchId || null,
      x: rhizohTopology?.to || [],
      y: trace.moveNumber || 0,
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
        layer: trace.moveNumber,
        matchId: opts.matchId || null,
        teacherMove: trace.bestMove,
        rhizohMove: row.san,
        played: rhizohTopology,
        expected: teacherTopology,
        drift
      });
      events.push(codexEvent);
    }

    observations.push(
      Object.freeze({
        moveNumber: trace.moveNumber,
        teacherMove: trace.bestMove,
        rhizohMove: row.san,
        teacherTopology,
        rhizohTopology,
        drift,
        eventType,
        cubePoint
      })
    );
  }

  const result = Object.freeze({
    schema: RHIZOH_UGE_SILENT_OBSERVER_SCHEMA_V0,
    skipped: false,
    mode: "silent_observer",
    matchId: opts.matchId || null,
    observationCount: observations.length,
    eventCount: events.length,
    observations: Object.freeze(observations),
    events: Object.freeze(events),
    summary: summarizeDriftCubeV0(observations.map((o) => o.cubePoint)),
    governance: Object.freeze({
      policyInfluence: false,
      moveInfluence: false,
      policyInfluenceForbidden: isPolicyInfluenceForbiddenV0(),
      phase: "silent_observer"
    })
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.ugeSilentObserver = Object.freeze({
      last: () => result,
      list: () => Object.freeze([result])
    });

    try {
      window.dispatchEvent(new CustomEvent(RHIZOH_UGE_SILENT_OBSERVER_EVENT_V0, { detail: result }));
    } catch {
      /* noop */
    }
  }

  if (typeof console !== "undefined" && console.info) {
    console.info(RHIZOH_UGE_SILENT_OBSERVER_LOG_TAG_V0, {
      matchId: result.matchId,
      observationCount: result.observationCount,
      eventCount: result.eventCount,
      mode: "silent_observer"
    });
  }

  return result;
}
