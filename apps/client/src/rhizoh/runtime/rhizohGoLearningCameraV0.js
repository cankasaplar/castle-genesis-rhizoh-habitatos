/**
 * Go learning epistemic camera — single OBS / DevTools / investor snapshot.
 * Observation only; no execution authority.
 * RESEARCH-ONLY
 */

import { getGoArenaEngineSnapshotV0 } from "./goArenaEngineV0.js";
import { getGoLearningAgreementGateSnapshotV0 } from "./goLearningAgreementGateV0.js";
import { getGoLearningBatchSnapshotV0 } from "./goLearningBatchV0.js";
import { buildGoSpacetimeObservationEnvelopeV0 } from "./goSpacetimeObservationEnvelopeV0.js";
import { buildRhizohGoLearningReportV0 } from "./rhizohGoLearningReportV0.js";

export const RHIZOH_GO_LEARNING_CAMERA_SCHEMA_V0 = "castle.rhizoh.go_learning_camera.v0";

export function buildRhizohGoLearningCameraV0() {
  const arena = getGoArenaEngineSnapshotV0();
  const batch = getGoLearningBatchSnapshotV0();
  const gate = getGoLearningAgreementGateSnapshotV0();
  const report = buildRhizohGoLearningReportV0();
  const spacetime = buildGoSpacetimeObservationEnvelopeV0();

  return Object.freeze({
    schema: RHIZOH_GO_LEARNING_CAMERA_SCHEMA_V0,
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
      stoneCount: arena.stoneCount,
      activeColor: arena.activeColor
    }),
    worldAnchors: report.worldAnchorDistribution,
    lastBatchFlush: report.lastBatchFlush,
    atMs: Date.now()
  });
}

export function ensureRhizohGoLearningCameraV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.goLearningCamera = () => buildRhizohGoLearningCameraV0();
  return window.__rhizoh.goLearningCamera;
}
