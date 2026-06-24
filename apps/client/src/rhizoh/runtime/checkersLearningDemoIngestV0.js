/**
 * Checkers learning demo ingest — RESEARCH-ONLY
 */

import { applyCheckersArenaMoveV0 } from "./checkersArenaEngineV0.js";
import { evaluateCheckersLearningAgreementGateV0 } from "./checkersLearningAgreementGateV0.js";
import { enqueueCheckersLearningBatchSampleV0 } from "./checkersLearningBatchV0.js";
import { buildCheckersSpacetimeObservationEnvelopeV0 } from "./checkersSpacetimeObservationEnvelopeV0.js";
import { emitSpatialTemporalTrailV0 } from "./rhizohSpatialTemporalTrailV0.js";

export const CHECKERS_LEARNING_DEMO_INGEST_SCHEMA_V0 =
  "castle.rhizoh.checkers_learning_demo_ingest.v0";

/**
 * @param {{ x?: number, y?: number, confidence?: number, locale?: string }} [opts]
 */
export function ingestCheckersLearningDemoMoveV0(opts = {}) {
  const moveResult = applyCheckersArenaMoveV0({ x: opts.x, y: opts.y });
  if (!moveResult.ok) {
    return Object.freeze({ ok: false, reason: moveResult.reason, schema: CHECKERS_LEARNING_DEMO_INGEST_SCHEMA_V0 });
  }

  const confidence = Number.isFinite(opts.confidence) ? opts.confidence : 0.74;
  const gate = evaluateCheckersLearningAgreementGateV0({ confidence, sourceCount: 1 });
  const spacetime = buildCheckersSpacetimeObservationEnvelopeV0({
    locale: opts.locale,
    nodeId: "checkers_arena",
    channelId: "rhizoh_checkers_learning",
    mapPinSource: "map:node:checkers"
  });

  emitSpatialTemporalTrailV0("checkers", {
    nodeId: spacetime.worldAnchor.nodeId,
    kind: "checkers_learning_move",
    payload: { boardHash: moveResult.boardHash, moveN: moveResult.moveCount }
  });

  const batch = enqueueCheckersLearningBatchSampleV0({
    boardHash: moveResult.boardHash,
    move: `${moveResult.move?.color}@${moveResult.move?.x},${moveResult.move?.y}`,
    confidence,
    gate,
    spacetime
  });

  return Object.freeze({
    ok: true,
    schema: CHECKERS_LEARNING_DEMO_INGEST_SCHEMA_V0,
    move: moveResult,
    gate,
    batch,
    spacetime,
    interpretationOnly: true,
    atMs: Date.now()
  });
}
