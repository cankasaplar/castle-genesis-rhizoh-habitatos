/**
 * Rhizoh Checkers learning report — RESEARCH-ONLY
 */

import {
  CHECKERS_ARENA_MOVE_EVENT_V0,
  getCheckersArenaEngineSnapshotV0
} from "./checkersArenaEngineV0.js";
import {
  CHECKERS_LEARNING_BATCH_EVENT_V0,
  getCheckersLearningBatchSnapshotV0
} from "./checkersLearningBatchV0.js";
import { getCheckersLearningAgreementGateSnapshotV0 } from "./checkersLearningAgreementGateV0.js";
import { buildCheckersSpacetimeObservationEnvelopeV0 } from "./checkersSpacetimeObservationEnvelopeV0.js";

export const RHIZOH_CHECKERS_LEARNING_REPORT_SCHEMA_V0 =
  "castle.rhizoh.checkers_learning_report.v0";

let movesSeenV0 = 0;
let batchesFlushedV0 = 0;
let lastBatchFlushV0 = null;
/** @type {Map<string, number>} */
const anchorCountsV0 = new Map();
let listenersInstalledV0 = false;

function recordAnchorV0(envelope) {
  const nodeId = String(envelope?.worldAnchor?.nodeId || "").trim();
  if (!nodeId) return;
  anchorCountsV0.set(nodeId, (anchorCountsV0.get(nodeId) || 0) + 1);
}

export function buildRhizohCheckersLearningReportV0() {
  const arena = getCheckersArenaEngineSnapshotV0();
  const batch = getCheckersLearningBatchSnapshotV0();
  const gate = getCheckersLearningAgreementGateSnapshotV0();
  const spacetime = buildCheckersSpacetimeObservationEnvelopeV0();

  return Object.freeze({
    schema: RHIZOH_CHECKERS_LEARNING_REPORT_SCHEMA_V0,
    interpretationOnly: true,
    movesSeen: movesSeenV0,
    arenaMoveCount: arena.moveCount,
    boardHash: arena.boardHash,
    batchesFlushed: batchesFlushedV0,
    batchPending: batch.pending,
    gateAccepted: gate.accepted,
    gateRejected: gate.rejected,
    worldAnchorDistribution: Object.freeze(Object.fromEntries(anchorCountsV0)),
    lastBatchFlush: lastBatchFlushV0,
    spacetimeSample: spacetime,
    atMs: Date.now()
  });
}

export function ensureRhizohCheckersLearningReportV0() {
  if (typeof window === "undefined") return null;
  if (!listenersInstalledV0) {
    listenersInstalledV0 = true;
    window.addEventListener(CHECKERS_ARENA_MOVE_EVENT_V0, () => {
      movesSeenV0 += 1;
    });
    window.addEventListener(CHECKERS_LEARNING_BATCH_EVENT_V0, (ev) => {
      batchesFlushedV0 += 1;
      lastBatchFlushV0 = ev?.detail || null;
      const anchors = ev?.detail?.spacetimeAnchors;
      if (Array.isArray(anchors)) {
        for (const nodeId of anchors) {
          recordAnchorV0({ worldAnchor: { nodeId } });
        }
      }
    });
  }
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.checkersLearningReport = () => buildRhizohCheckersLearningReportV0();
  return window.__rhizoh.checkersLearningReport;
}

/** @internal vitest */
export function resetRhizohCheckersLearningReportForTestV0() {
  movesSeenV0 = 0;
  batchesFlushedV0 = 0;
  lastBatchFlushV0 = null;
  anchorCountsV0.clear();
  listenersInstalledV0 = false;
}
