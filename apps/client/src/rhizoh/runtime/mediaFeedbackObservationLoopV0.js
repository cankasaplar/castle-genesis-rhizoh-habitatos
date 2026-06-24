/**
 * Media Feedback Observation Loop v0 — one-way ingest → shadow → memory cycle.
 * RESEARCH-ONLY — feedbackToExecution: false; never controls player.
 */

import {
  ingestMediaTimelineEventV0,
  normalizeMediaTimelineEventV0,
  MEDIA_EVENT_TYPE_V0
} from "./mediaEventAdapterV0.js";
import { evaluateExecutionPermissionV0, EXECUTION_ACTION_CLASS_V0 } from "./executionPermissionLayerV0.js";

export const MEDIA_FEEDBACK_OBSERVATION_LOOP_SCHEMA_V0 =
  "castle.rhizoh.media_feedback_observation_loop.v0";
export const MEDIA_FEEDBACK_LOOP_EVENT_V0 = "rhizoh:media-feedback-loop-v0";

let cycleCountV0 = 0;
/** @type {object | null} */
let lastCycleV0 = null;

/**
 * @param {object} raw
 * @param {{ dispatchEvent?: boolean, fuse?: boolean }} [opts]
 */
export function runMediaFeedbackObservationCycleV0(raw = {}, opts = {}) {
  const permission = evaluateExecutionPermissionV0({
    actionClass: EXECUTION_ACTION_CLASS_V0.OBSERVE,
    domain: "media"
  });
  const normalized = normalizeMediaTimelineEventV0({
    source: "media_feedback_loop",
    ...raw
  });
  const ingest = ingestMediaTimelineEventV0(normalized, {
    dispatchEvent: opts.dispatchEvent !== false,
    fuse: opts.fuse
  });

  cycleCountV0 += 1;
  const cycle = Object.freeze({
    schema: MEDIA_FEEDBACK_OBSERVATION_LOOP_SCHEMA_V0,
    cycleSeq: cycleCountV0,
    normalized,
    ingest,
    permission,
    feedbackToExecution: false,
    controlsPlayer: false,
    memoryNodeWritten: Boolean(ingest.shadowEntry),
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
  lastCycleV0 = cycle;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MEDIA_FEEDBACK_LOOP_EVENT_V0, { detail: cycle }));
  }
  return cycle;
}

export function getMediaFeedbackObservationLoopSnapshotV0() {
  return Object.freeze({
    schema: `${MEDIA_FEEDBACK_OBSERVATION_LOOP_SCHEMA_V0}.snapshot`,
    cycleCount: cycleCountV0,
    lastCycle: lastCycleV0,
    atMs: Date.now(),
    interpretationOnly: true
  });
}

export function ensureMediaFeedbackObservationLoopDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.mediaFeedbackLoop = (raw, opts) => runMediaFeedbackObservationCycleV0(raw, opts);
  return window.__rhizoh.mediaFeedbackLoop;
}

/** @internal vitest */
export function resetMediaFeedbackObservationLoopForTestV0() {
  cycleCountV0 = 0;
  lastCycleV0 = null;
}

export { MEDIA_EVENT_TYPE_V0 };
