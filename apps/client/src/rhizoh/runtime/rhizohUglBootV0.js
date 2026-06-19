/**
 * UGL boot — semantic compiler wiring + DevTools.
 * RESEARCH-ONLY
 */

import { CHESS_CLUSTER_MOVE_EVENT_V0, CHESS_CLUSTER_GAME_END_EVENT_V0 } from "./chessGameClusterV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";
import { RHIZOH_DRIFT_CUBE_EVENT_V0 } from "./rhizohGeometryDriftCubeV0.js";
import { RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0 } from "./rhizohChessLearningReportV0.js";
import { compileObservationToUglEventV0, buildUglDriftRewardReportV0 } from "./rhizohDriftRewardConverterV0.js";
import { appendUglEventV0, getUglEventStreamSnapshotV0, readUglEventStreamV0 } from "./rhizohUglEventV0.js";
import { buildUglStateEncoderReportV0 } from "./rhizohUglStateEncoderV0.js";
import { buildUglActionSpaceReportV0 } from "./rhizohUglActionSpaceV0.js";
import { buildUglRewardModelReportV0 } from "./rhizohUglRewardModelV0.js";
import { buildUglMatchSchedulerReportV0 } from "./rhizohUglMatchSchedulerV0.js";
import { getChessUglAdapterV0 } from "./rhizohUglChessAdapterV0.js";
import { getSportsUglAdapterV0 } from "./rhizohUglSportsAdapterV0.js";
import { getDomainFabricSnapshotV0 } from "./rhizohDomainFabricV0.js";
import { getArenaRouterSnapshotV0 } from "./rhizohArenaRouterV0.js";
import { RHIZOH_UGL_SCHEMA_V0, RHIZOH_UGL_VERSION_V0 } from "./rhizohUglSchemaV0.js";
import { chessTerminalRewardV0 } from "./rhizohUglChessAdapterV0.js";
import {
  trainingRecordFromPolicyDiffV0,
  trainingRecordFromPredictionScoreV0,
  appendUglTrainingRecordV0,
  getUglTrainingRecordSnapshotV0,
  readUglTrainingRecordsV0
} from "./rhizohUglTrainingRecordV0.js";
import {
  buildUglLeagueHarnessReportV0,
  exportUglTrainingRecordsJsonV0,
  getActiveUglLeagueTierV0
} from "./rhizohUglLeagueHarnessV0.js";
import { buildChessEngineHealthReportV0 } from "./rhizohChessEngineHealthV0.js";
import { getUglLearnBufferSnapshotV0 } from "./rhizohUglLearnBufferSinkV0.js";
import { drainUglLearnBufferV0 } from "./rhizohUglLearnBufferSinkV0.js";
import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  onChessEngineBridgeV0
} from "./chessEngineBridgeV0.js";

let listenersInstalledV0 = false;
/** @type {(() => void) | null} */
let unsubArenaBridgeV0 = null;
/** @type {Map<string, string>} */
const lastFenByMatchV0 = new Map();

export function buildRhizohUglReportV0() {
  return Object.freeze({
    schema: `${RHIZOH_UGL_SCHEMA_V0}.report`,
    version: RHIZOH_UGL_VERSION_V0,
    note: "UGL compiles domain play into canonical state-action-reward events",
    adapters: Object.freeze([getChessUglAdapterV0().gameType, getSportsUglAdapterV0().gameType]),
    domainFabric: getDomainFabricSnapshotV0(),
    arenaRouter: getArenaRouterSnapshotV0(),
    stateEncoder: buildUglStateEncoderReportV0(),
    actionSpace: buildUglActionSpaceReportV0(),
    rewardModel: buildUglRewardModelReportV0(),
    driftReward: buildUglDriftRewardReportV0(),
    scheduler: buildUglMatchSchedulerReportV0(),
    eventStream: getUglEventStreamSnapshotV0(),
    trainingRecords: getUglTrainingRecordSnapshotV0(),
    leagueHarness: buildUglLeagueHarnessReportV0(),
    engineHealth: buildChessEngineHealthReportV0(),
    learnBuffer: getUglLearnBufferSnapshotV0(),
    apis: Object.freeze({
      report: "window.__rhizoh.uglReport()",
      events: "window.__rhizoh.uglEventStream()",
      scheduler: "window.__rhizoh.uglScheduler()",
      adapter: "window.__rhizoh.uglChessAdapter()",
      domainFabric: "window.__rhizoh.uglDomainFabric()",
      arenaRouter: "window.__rhizoh.uglArenaRouter()",
      sportsAdapter: "window.__rhizoh.uglSportsAdapter()",
      league: "window.__rhizoh.uglLeagueHarness()",
      trainingRecords: "window.__rhizoh.uglTrainingRecords()",
      engineHealth: "window.__rhizoh.chessEngineHealthReport()",
      learnBuffer: "window.__rhizoh.uglLearnBuffer()"
    }),
    atMs: Date.now()
  });
}

function safeCompileUglEventV0(input) {
  try {
    return compileObservationToUglEventV0(input);
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[RHIZOH_UGL] compile skipped", input?.source, err?.message || err);
    }
    return null;
  }
}

function handleClusterMoveV0(detail) {
  const move = detail?.move;
  if (!move?.matchId) return;
  const matchId = String(move.matchId);
  const fenBefore = move.fenBefore || lastFenByMatchV0.get(matchId);
  const fenAfter = move.fenAfter;
  if (fenBefore && fenAfter) {
    const event = safeCompileUglEventV0({
      matchId,
      fenBefore,
      fenAfter,
      uci: move.uci,
      san: move.san,
      actorId: move.agentId || `slot_${move.slotId ?? "?"}`,
      source: "cluster_move"
    });
    if (event) appendUglEventV0(event);
  }
  if (fenAfter) lastFenByMatchV0.set(matchId, fenAfter);
  while (lastFenByMatchV0.size > 128) {
    const first = lastFenByMatchV0.keys().next().value;
    lastFenByMatchV0.delete(first);
  }
}

function handlePolicyDiffV0(detail) {
  if (!detail) return;
  const matchId = String(detail.matchId || "");
  const fenBefore = lastFenByMatchV0.get(matchId);
  const tier = getActiveUglLeagueTierV0();
  const event = safeCompileUglEventV0({
    policyDiff: detail,
    matchId,
    fenBefore: fenBefore || undefined,
    fenAfter: fenBefore,
    uci: detail.played,
    actorId: detail.slotId != null ? `slot_${detail.slotId}` : "unknown",
    source: "policy_diff"
  });
  if (event) {
    appendUglEventV0(event);
    trainingRecordFromPolicyDiffV0(detail, {
      fenBefore,
      leagueTier: tier,
      uglReward: event.r?.total
    });
  }
}

function handlePredictionScoreV0(detail) {
  if (!detail) return;
  trainingRecordFromPredictionScoreV0(detail, { leagueTier: getActiveUglLeagueTierV0() });
}

function handleGeometryDriftV0(detail) {
  if (!detail) return;
  const matchId = String(detail.matchId || "");
  const event = safeCompileUglEventV0({
    geometryDrift: detail,
    matchId,
    source: "geometry_drift"
  });
  if (event) appendUglEventV0(event);
}

function handleGameEndV0(detail) {
  const slot = detail?.slot;
  if (!slot?.matchId) return;
  const matchId = String(slot.matchId);
  const outcome = slot.result || slot.outcome || null;
  const terminal = chessTerminalRewardV0(outcome, "white");
  const fenBefore = lastFenByMatchV0.get(matchId);
  if (fenBefore == null) return;
  const event = safeCompileUglEventV0({
    matchId,
    fenBefore,
    fenAfter: fenBefore,
    terminal,
    source: "game_end"
  });
  if (event) appendUglEventV0(event);
  appendUglTrainingRecordV0({
    position: fenBefore,
    outcome,
    leagueTier: getActiveUglLeagueTierV0(),
    uglReward: terminal,
    matchId,
    slotId: slot.slotId,
    source: "game_end"
  });
  lastFenByMatchV0.delete(matchId);
}

/** Map 1v1 arena moves — cluster slot moves use CHESS_CLUSTER_MOVE_EVENT instead. */
function handleArenaPlayedMoveV0(detail) {
  if (detail?.slotId != null) return;
  const fenBefore = String(detail.fenBefore || "").trim();
  const fenAfter = String(detail.fen || "").trim();
  const san = detail.san || detail.rhizohMove || detail.move;
  if (!fenBefore || !fenAfter || !san) return;

  const matchId = String(detail.matchId || "arena_local");
  const actorId =
    detail.engine === "human"
      ? "human"
      : String(detail.engine || "arena_engine").replace(/\s+/g, "_");

  const event = safeCompileUglEventV0({
    matchId,
    fenBefore,
    fenAfter,
    san,
    actorId,
    source: "arena_move"
  });
  if (event) appendUglEventV0(event);

  appendUglTrainingRecordV0({
    position: fenBefore,
    playedMove: String(san),
    leagueTier: getActiveUglLeagueTierV0(),
    matchId,
    source: "arena_move"
  });
  lastFenByMatchV0.set(matchId, fenAfter);
}

export function ensureRhizohUglV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.uglReport) {
    window.__rhizoh.uglReport = () => buildRhizohUglReportV0();
  }
  if (!window.__rhizoh.uglEventStream) {
    window.__rhizoh.uglEventStream = (limit) => readUglEventStreamV0(limit);
  }
  if (!window.__rhizoh.uglScheduler) {
    window.__rhizoh.uglScheduler = () => buildUglMatchSchedulerReportV0();
  }
  if (!window.__rhizoh.uglRewardModel) {
    window.__rhizoh.uglRewardModel = () => buildUglRewardModelReportV0();
  }
  if (!window.__rhizoh.uglChessAdapter) {
    window.__rhizoh.uglChessAdapter = () => getChessUglAdapterV0();
  }
  if (!window.__rhizoh.uglDomainFabric) {
    window.__rhizoh.uglDomainFabric = () => getDomainFabricSnapshotV0();
  }
  if (!window.__rhizoh.uglArenaRouter) {
    window.__rhizoh.uglArenaRouter = () => getArenaRouterSnapshotV0();
  }
  if (!window.__rhizoh.uglSportsAdapter) {
    window.__rhizoh.uglSportsAdapter = () => getSportsUglAdapterV0();
  }
  if (!window.__rhizoh.uglLeagueHarness) {
    window.__rhizoh.uglLeagueHarness = () => buildUglLeagueHarnessReportV0();
  }
  if (!window.__rhizoh.uglTrainingRecords) {
    window.__rhizoh.uglTrainingRecords = (limit) => readUglTrainingRecordsV0(limit);
  }
  if (!window.__rhizoh.exportUglTrainingRecordsJson) {
    window.__rhizoh.exportUglTrainingRecordsJson = exportUglTrainingRecordsJsonV0;
  }
  if (!window.__rhizoh.uglLearnBuffer) {
    window.__rhizoh.uglLearnBuffer = () => getUglLearnBufferSnapshotV0();
  }

  if (listenersInstalledV0) return window.__rhizoh.uglReport;
  listenersInstalledV0 = true;

  window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, (ev) => handleClusterMoveV0(ev?.detail));
  window.addEventListener(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, (ev) => handlePolicyDiffV0(ev?.detail));
  window.addEventListener(RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0, (ev) =>
    handlePredictionScoreV0(ev?.detail)
  );
  window.addEventListener(RHIZOH_DRIFT_CUBE_EVENT_V0, (ev) => handleGeometryDriftV0(ev?.detail));
  window.addEventListener(CHESS_CLUSTER_GAME_END_EVENT_V0, (ev) => handleGameEndV0(ev?.detail));
  unsubArenaBridgeV0 = onChessEngineBridgeV0(
    CHESS_ENGINE_BRIDGE_KIND_V0.PLAYED_MOVE,
    handleArenaPlayedMoveV0
  );

  window.__rhizoh.uglBoot = Object.freeze({
    schema: `${RHIZOH_UGL_SCHEMA_V0}.boot`,
    version: RHIZOH_UGL_VERSION_V0,
    listeners: true,
    phase: "arena_transform_v0"
  });

  return window.__rhizoh.uglReport;
}

/** @internal vitest */
export function __resetRhizohUglBootForTestV0() {
  listenersInstalledV0 = false;
  if (unsubArenaBridgeV0) {
    unsubArenaBridgeV0();
    unsubArenaBridgeV0 = null;
  }
  lastFenByMatchV0.clear();
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.uglReport;
    delete window.__rhizoh.uglEventStream;
    delete window.__rhizoh.uglScheduler;
    delete window.__rhizoh.uglRewardModel;
    delete window.__rhizoh.uglChessAdapter;
    delete window.__rhizoh.uglDomainFabric;
    delete window.__rhizoh.uglArenaRouter;
    delete window.__rhizoh.uglSportsAdapter;
    delete window.__rhizoh.uglLeagueHarness;
    delete window.__rhizoh.uglTrainingRecords;
    delete window.__rhizoh.exportUglTrainingRecordsJson;
    delete window.__rhizoh.uglLearnBuffer;
    delete window.__rhizoh.uglBoot;
  }
}
