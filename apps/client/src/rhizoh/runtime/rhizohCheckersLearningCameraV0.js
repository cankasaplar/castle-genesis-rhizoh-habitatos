/**
 * Checkers learning epistemic camera — RESEARCH-ONLY
 */

import { getCheckersArenaEngineSnapshotV0 } from "./checkersArenaEngineV0.js";
import { getCheckersLearningAgreementGateSnapshotV0 } from "./checkersLearningAgreementGateV0.js";
import { getCheckersLearningBatchSnapshotV0 } from "./checkersLearningBatchV0.js";
import { buildCheckersSpacetimeObservationEnvelopeV0 } from "./checkersSpacetimeObservationEnvelopeV0.js";
import { buildRhizohCheckersLearningReportV0 } from "./rhizohCheckersLearningReportV0.js";

export const RHIZOH_CHECKERS_LEARNING_CAMERA_SCHEMA_V0 =
  "castle.rhizoh.checkers_learning_camera.v0";

export function buildRhizohCheckersLearningCameraV0() {
  const arena = getCheckersArenaEngineSnapshotV0();
  const batch = getCheckersLearningBatchSnapshotV0();
  const gate = getCheckersLearningAgreementGateSnapshotV0();
  const report = buildRhizohCheckersLearningReportV0();
  const spacetime = buildCheckersSpacetimeObservationEnvelopeV0();

  return Object.freeze({
    schema: RHIZOH_CHECKERS_LEARNING_CAMERA_SCHEMA_V0,
    interpretationOnly: true,
    spacetime,
    pipeline: Object.freeze({
      movesSeen: report.movesSeen,
      gateAccepted: gate.accepted,
      gateRejected: gate.rejected,
      batchPending: batch.pending,
      batchesFlushed: batch.batchesFlushed
    }),
    arena: Object.freeze({
      moveCount: arena.moveCount,
      boardHash: arena.boardHash,
      pieceCount: arena.pieceCount,
      activeColor: arena.activeColor
    }),
    worldAnchors: report.worldAnchorDistribution,
    lastBatchFlush: report.lastBatchFlush,
    atMs: Date.now()
  });
}

export function ensureRhizohCheckersLearningCameraV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.checkersLearningCamera = () => buildRhizohCheckersLearningCameraV0();
  return window.__rhizoh.checkersLearningCamera;
}
