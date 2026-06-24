/**
 * Go learning media tube wire v0 — map pin → spacetime envelope → learning tube.
 * RESEARCH-ONLY — observation framing; no execution authority.
 */

import { getGoArenaEngineSnapshotV0 } from "./goArenaEngineV0.js";
import { getGoLearningBatchSnapshotV0 } from "./goLearningBatchV0.js";
import { buildGoSpacetimeObservationEnvelopeV0 } from "./goSpacetimeObservationEnvelopeV0.js";
import { ingestGoLearningDemoMoveAsyncV0 } from "./goLearningDemoIngestV0.js";
import { buildRhizohGoLearningCameraV0 } from "./rhizohGoLearningCameraV0.js";
import { RHIZOH_GO_LEARNING_CHANNEL_ID_V0 } from "./worldSpaceMediaChannelsV0.js";
import { dispatchOpenMediaTubeV0 } from "./sovereignWorldMapNodesV0.js";

export const GO_LEARNING_MEDIA_TUBE_WIRE_SCHEMA_V0 = "castle.rhizoh.go_learning_media_tube_wire.v0";

/**
 * Refresh Go learning observation surface when media tube opens.
 * @param {{ locale?: string, force?: boolean, demoMove?: boolean }} [opts]
 */
export async function wireGoLearningMediaTubeV0(opts = {}) {
  const locale = String(opts.locale || "tr");
  const spacetime = buildGoSpacetimeObservationEnvelopeV0({
    locale,
    nodeId: "go_arena",
    channelId: RHIZOH_GO_LEARNING_CHANNEL_ID_V0,
    mapPinSource: "map:node:go"
  });

  let demoIngest = null;
  if (opts.demoMove === true || opts.force === true) {
    demoIngest = await ingestGoLearningDemoMoveAsyncV0({
      x: 3 + (getGoArenaEngineSnapshotV0().moveCount % 12),
      y: 3 + Math.floor(getGoArenaEngineSnapshotV0().moveCount / 12),
      locale
    });
  }

  const arena = getGoArenaEngineSnapshotV0();
  const batch = getGoLearningBatchSnapshotV0();
  const camera = buildRhizohGoLearningCameraV0();

  return Object.freeze({
    schema: GO_LEARNING_MEDIA_TUBE_WIRE_SCHEMA_V0,
    ok: true,
    moveCount: arena.moveCount,
    batchPending: batch.pending,
    batchesFlushed: batch.batchesFlushed,
    spacetime,
    cameraSchema: camera.schema,
    demoIngestOk: demoIngest?.ok === true,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

/**
 * @param {{ locale?: string }} [opts]
 */
export function getGoLearningTubeSnapshotV0(opts = {}) {
  const locale = String(opts.locale || "tr");
  const arena = getGoArenaEngineSnapshotV0();
  const batch = getGoLearningBatchSnapshotV0();
  const spacetime = buildGoSpacetimeObservationEnvelopeV0({
    locale,
    nodeId: "go_arena",
    channelId: RHIZOH_GO_LEARNING_CHANNEL_ID_V0,
    mapPinSource: "map:node:go"
  });
  const camera = buildRhizohGoLearningCameraV0();

  return Object.freeze({
    schema: `${GO_LEARNING_MEDIA_TUBE_WIRE_SCHEMA_V0}.snapshot`,
    moveCount: arena.moveCount,
    boardHash: arena.boardHash,
    batchPending: batch.pending,
    batchesFlushed: batch.batchesFlushed,
    spacetime,
    pipeline: camera.pipeline,
    atMs: Date.now(),
    interpretationOnly: true
  });
}

/**
 * Open Go learning media tube from go map pin.
 */
export function dispatchOpenGoLearningMediaTubeV0(payload = {}) {
  void wireGoLearningMediaTubeV0({ locale: payload.locale, force: true, demoMove: true });
  dispatchOpenMediaTubeV0({
    ...payload,
    node: payload.node || {
      id: "go_arena",
      label: "GO",
      type: "zone",
      color: "#38bdf8"
    },
    source: payload.source || "map:node:go",
    initialChannelId: RHIZOH_GO_LEARNING_CHANNEL_ID_V0
  });
}

export function ensureGoLearningMediaTubeDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.goLearningTube = () => getGoLearningTubeSnapshotV0();
  window.__rhizoh.wireGoLearningTube = (opts) => wireGoLearningMediaTubeV0(opts);
  return window.__rhizoh.goLearningTube;
}

/** @internal vitest */
export function resetGoLearningMediaTubeWireForTestV0() {
  /* stateless — noop */
}
