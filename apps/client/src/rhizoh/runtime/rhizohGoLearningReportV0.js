/**
 * Rhizoh Go learning report — observable aggregate from arena + batch + gate.
 * window.__rhizoh.goLearningReport() — DevTools / shadow prod observability.
 * RESEARCH-ONLY — interpretation only; no execution authority.
 */

import { GO_ARENA_MOVE_EVENT_V0, getGoArenaEngineSnapshotV0 } from "./goArenaEngineV0.js";
import { GO_LEARNING_BATCH_EVENT_V0, getGoLearningBatchSnapshotV0 } from "./goLearningBatchV0.js";
import { getGoLearningAgreementGateSnapshotV0 } from "./goLearningAgreementGateV0.js";
import { buildGoSpacetimeObservationEnvelopeV0 } from "./goSpacetimeObservationEnvelopeV0.js";

export const RHIZOH_GO_LEARNING_REPORT_SCHEMA_V0 = "castle.rhizoh.go_learning_report.v0";

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

export function buildRhizohGoLearningReportV0() {
  const arena = getGoArenaEngineSnapshotV0();
  const batch = getGoLearningBatchSnapshotV0();
  const gate = getGoLearningAgreementGateSnapshotV0();
  const spacetime = buildGoSpacetimeObservationEnvelopeV0();

  return Object.freeze({
    schema: RHIZOH_GO_LEARNING_REPORT_SCHEMA_V0,
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

export function ensureRhizohGoLearningReportV0() {
  if (typeof window === "undefined") return null;
  if (!listenersInstalledV0) {
    listenersInstalledV0 = true;
    window.addEventListener(GO_ARENA_MOVE_EVENT_V0, () => {
      movesSeenV0 += 1;
    });
    window.addEventListener(GO_LEARNING_BATCH_EVENT_V0, (ev) => {
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
  window.__rhizoh.goLearningReport = () => buildRhizohGoLearningReportV0();
  return window.__rhizoh.goLearningReport;
}

/** @internal vitest */
export function resetRhizohGoLearningReportForTestV0() {
  movesSeenV0 = 0;
  batchesFlushedV0 = 0;
  lastBatchFlushV0 = null;
  anchorCountsV0.clear();
  listenersInstalledV0 = false;
}
