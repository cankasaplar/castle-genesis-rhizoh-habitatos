/**
 * UGL boot — semantic compiler wiring + DevTools.
 * RESEARCH-ONLY
 */

import { CHESS_CLUSTER_MOVE_EVENT_V0, CHESS_CLUSTER_GAME_END_EVENT_V0 } from "./chessGameClusterV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";
import { RHIZOH_DRIFT_CUBE_EVENT_V0 } from "./rhizohGeometryDriftCubeV0.js";
import { compileObservationToUglEventV0, buildUglDriftRewardReportV0 } from "./rhizohDriftRewardConverterV0.js";
import { appendUglEventV0, getUglEventStreamSnapshotV0, readUglEventStreamV0 } from "./rhizohUglEventV0.js";
import { buildUglStateEncoderReportV0 } from "./rhizohUglStateEncoderV0.js";
import { buildUglActionSpaceReportV0 } from "./rhizohUglActionSpaceV0.js";
import { buildUglRewardModelReportV0 } from "./rhizohUglRewardModelV0.js";
import { buildUglMatchSchedulerReportV0 } from "./rhizohUglMatchSchedulerV0.js";
import { getChessUglAdapterV0 } from "./rhizohUglChessAdapterV0.js";
import { RHIZOH_UGL_SCHEMA_V0, RHIZOH_UGL_VERSION_V0 } from "./rhizohUglSchemaV0.js";
import { chessTerminalRewardV0 } from "./rhizohUglChessAdapterV0.js";

let listenersInstalledV0 = false;
/** @type {Map<string, string>} */
const lastFenByMatchV0 = new Map();

export function buildRhizohUglReportV0() {
  return Object.freeze({
    schema: `${RHIZOH_UGL_SCHEMA_V0}.report`,
    version: RHIZOH_UGL_VERSION_V0,
    note: "UGL compiles domain play into canonical state-action-reward events",
    adapters: Object.freeze([getChessUglAdapterV0().gameType]),
    stateEncoder: buildUglStateEncoderReportV0(),
    actionSpace: buildUglActionSpaceReportV0(),
    rewardModel: buildUglRewardModelReportV0(),
    driftReward: buildUglDriftRewardReportV0(),
    scheduler: buildUglMatchSchedulerReportV0(),
    eventStream: getUglEventStreamSnapshotV0(),
    apis: Object.freeze({
      report: "window.__rhizoh.uglReport()",
      events: "window.__rhizoh.uglEventStream()",
      scheduler: "window.__rhizoh.uglScheduler()",
      adapter: "window.__rhizoh.uglChessAdapter()"
    }),
    atMs: Date.now()
  });
}

function handleClusterMoveV0(detail) {
  const move = detail?.move;
  if (!move?.matchId) return;
  const matchId = String(move.matchId);
  const fenBefore = move.fenBefore || lastFenByMatchV0.get(matchId);
  const fenAfter = move.fenAfter;
  if (fenBefore && fenAfter) {
    const event = compileObservationToUglEventV0({
      matchId,
      fenBefore,
      fenAfter,
      uci: move.uci,
      san: move.san,
      actorId: move.agentId || `slot_${move.slotId ?? "?"}`,
      source: "cluster_move"
    });
    appendUglEventV0(event);
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
  const event = compileObservationToUglEventV0({
    policyDiff: detail,
    matchId,
    fenBefore: fenBefore || undefined,
    fenAfter: fenBefore,
    uci: detail.played,
    actorId: detail.slotId != null ? `slot_${detail.slotId}` : "unknown",
    source: "policy_diff"
  });
  appendUglEventV0(event);
}

function handleGeometryDriftV0(detail) {
  if (!detail) return;
  const matchId = String(detail.matchId || "");
  const event = compileObservationToUglEventV0({
    geometryDrift: detail,
    matchId,
    source: "geometry_drift"
  });
  appendUglEventV0(event);
}

function handleGameEndV0(detail) {
  const slot = detail?.slot;
  if (!slot?.matchId) return;
  const matchId = String(slot.matchId);
  const outcome = slot.result || slot.outcome || null;
  const terminal = chessTerminalRewardV0(outcome, "white");
  const fenBefore = lastFenByMatchV0.get(matchId);
  if (fenBefore == null) return;
  const event = compileObservationToUglEventV0({
    matchId,
    fenBefore,
    fenAfter: fenBefore,
    terminal,
    source: "game_end"
  });
  appendUglEventV0(event);
  lastFenByMatchV0.delete(matchId);
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

  if (listenersInstalledV0) return window.__rhizoh.uglReport;
  listenersInstalledV0 = true;

  window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, (ev) => handleClusterMoveV0(ev?.detail));
  window.addEventListener(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, (ev) => handlePolicyDiffV0(ev?.detail));
  window.addEventListener(RHIZOH_DRIFT_CUBE_EVENT_V0, (ev) => handleGeometryDriftV0(ev?.detail));
  window.addEventListener(CHESS_CLUSTER_GAME_END_EVENT_V0, (ev) => handleGameEndV0(ev?.detail));

  window.__rhizoh.uglBoot = Object.freeze({
    schema: `${RHIZOH_UGL_SCHEMA_V0}.boot`,
    version: RHIZOH_UGL_VERSION_V0,
    listeners: true
  });

  return window.__rhizoh.uglReport;
}

/** @internal vitest */
export function __resetRhizohUglBootForTestV0() {
  listenersInstalledV0 = false;
  lastFenByMatchV0.clear();
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.uglReport;
    delete window.__rhizoh.uglEventStream;
    delete window.__rhizoh.uglScheduler;
    delete window.__rhizoh.uglRewardModel;
    delete window.__rhizoh.uglChessAdapter;
    delete window.__rhizoh.uglBoot;
  }
}
