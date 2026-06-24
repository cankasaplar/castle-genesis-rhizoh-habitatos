/**
 * Checkers learning media tube wire v0 — map pin → spacetime envelope → learning tube.
 * RESEARCH-ONLY — observation framing; no execution authority.
 */

import { getCheckersArenaEngineSnapshotV0 } from "./checkersArenaEngineV0.js";
import { getCheckersLearningBatchSnapshotV0 } from "./checkersLearningBatchV0.js";
import { buildCheckersSpacetimeObservationEnvelopeV0 } from "./checkersSpacetimeObservationEnvelopeV0.js";
import { ingestCheckersLearningDemoMoveV0 } from "./checkersLearningDemoIngestV0.js";
import { buildRhizohCheckersLearningCameraV0 } from "./rhizohCheckersLearningCameraV0.js";
import { RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0 } from "./worldSpaceMediaChannelsV0.js";
import { dispatchOpenMediaTubeV0 } from "./sovereignWorldMapNodesV0.js";

export const CHECKERS_LEARNING_MEDIA_TUBE_WIRE_SCHEMA_V0 =
  "castle.rhizoh.checkers_learning_media_tube_wire.v0";

/**
 * Refresh Checkers learning observation surface when media tube opens.
 * @param {{ locale?: string, force?: boolean, demoMove?: boolean }} [opts]
 */
export async function wireCheckersLearningMediaTubeV0(opts = {}) {
  const locale = String(opts.locale || "tr");
  const spacetime = buildCheckersSpacetimeObservationEnvelopeV0({
    locale,
    nodeId: "checkers_arena",
    channelId: RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0,
    mapPinSource: "map:node:checkers"
  });

  let demoIngest = null;
  if (opts.demoMove === true || opts.force === true) {
    const snap = getCheckersArenaEngineSnapshotV0();
    demoIngest = ingestCheckersLearningDemoMoveV0({
      x: 2 + (snap.moveCount % 4),
      y: 2 + Math.floor(snap.moveCount / 4),
      confidence: 0.76,
      locale
    });
  }

  const arena = getCheckersArenaEngineSnapshotV0();
  const batch = getCheckersLearningBatchSnapshotV0();
  const camera = buildRhizohCheckersLearningCameraV0();

  return Object.freeze({
    schema: CHECKERS_LEARNING_MEDIA_TUBE_WIRE_SCHEMA_V0,
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
export function getCheckersLearningTubeSnapshotV0(opts = {}) {
  const locale = String(opts.locale || "tr");
  const arena = getCheckersArenaEngineSnapshotV0();
  const batch = getCheckersLearningBatchSnapshotV0();
  const spacetime = buildCheckersSpacetimeObservationEnvelopeV0({
    locale,
    nodeId: "checkers_arena",
    channelId: RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0,
    mapPinSource: "map:node:checkers"
  });
  const camera = buildRhizohCheckersLearningCameraV0();

  return Object.freeze({
    schema: `${CHECKERS_LEARNING_MEDIA_TUBE_WIRE_SCHEMA_V0}.snapshot`,
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
 * Open Checkers learning media tube from checkers map pin.
 */
export function dispatchOpenCheckersLearningMediaTubeV0(payload = {}) {
  void wireCheckersLearningMediaTubeV0({ locale: payload.locale, force: true, demoMove: true });
  dispatchOpenMediaTubeV0({
    ...payload,
    node: payload.node || {
      id: "checkers_arena",
      label: "CHECKERS",
      type: "zone",
      color: "#f472b6"
    },
    source: payload.source || "map:node:checkers",
    initialChannelId: RHIZOH_CHECKERS_LEARNING_CHANNEL_ID_V0
  });
}

export function ensureCheckersLearningMediaTubeDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.checkersLearningTube = () => getCheckersLearningTubeSnapshotV0();
  window.__rhizoh.wireCheckersLearningTube = (opts) => wireCheckersLearningMediaTubeV0(opts);
  return window.__rhizoh.checkersLearningTube;
}

/** @internal vitest */
export function resetCheckersLearningMediaTubeWireForTestV0() {
  /* stateless — noop */
}
