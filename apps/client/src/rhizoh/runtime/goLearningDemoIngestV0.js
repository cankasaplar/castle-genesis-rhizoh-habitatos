/**
 * Go learning demo ingest — wires arena moves through agreement gate → batch.
 * RESEARCH-ONLY
 */

import { applyGoArenaMoveV0 } from "./goArenaEngineV0.js";
import { evaluateGoLearningAgreementGateV0 } from "./goLearningAgreementGateV0.js";
import { enqueueGoLearningBatchSampleV0 } from "./goLearningBatchV0.js";
import { buildGoSpacetimeObservationEnvelopeV0 } from "./goSpacetimeObservationEnvelopeV0.js";
import { emitSpatialTemporalTrailV0 } from "./rhizohSpatialTemporalTrailV0.js";

export const GO_LEARNING_DEMO_INGEST_SCHEMA_V0 = "castle.rhizoh.go_learning_demo_ingest.v0";

/**
 * Demo move + learning sample for DevTools / media tube wire.
 * @param {{ x?: number, y?: number, confidence?: number, locale?: string }} [opts]
 */
export function ingestGoLearningDemoMoveV0(opts = {}) {
  const moveResult = applyGoArenaMoveV0({ x: opts.x, y: opts.y });
  if (!moveResult.ok) {
    return Object.freeze({ ok: false, reason: moveResult.reason, schema: GO_LEARNING_DEMO_INGEST_SCHEMA_V0 });
  }

  const confidence = Number.isFinite(opts.confidence) ? opts.confidence : 0.72;
  const gate = evaluateGoLearningAgreementGateV0({ confidence, sourceCount: 1 });
  const spacetime = buildGoSpacetimeObservationEnvelopeV0({
    locale: opts.locale,
    nodeId: "go_arena",
    channelId: "rhizoh_go_learning",
    mapPinSource: "map:node:go"
  });

  emitSpatialTemporalTrailV0("go", {
    nodeId: spacetime.worldAnchor.nodeId,
    kind: "go_learning_move",
    payload: { boardHash: moveResult.boardHash, moveN: moveResult.moveCount }
  });

  const batch = enqueueGoLearningBatchSampleV0({
    boardHash: moveResult.boardHash,
    move: `${moveResult.move?.color}@${moveResult.move?.x},${moveResult.move?.y}`,
    confidence,
    gate,
    spacetime
  });

  return Object.freeze({
    ok: true,
    schema: GO_LEARNING_DEMO_INGEST_SCHEMA_V0,
    move: moveResult,
    gate,
    batch,
    spacetime,
    interpretationOnly: true,
    atMs: Date.now()
  });
}
