/**
 * Castle Stability Learning Trace UI v1.9 — human-readable trace strip formatting.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9.md
 */

import {
  buildLearningTraceStripV1_9,
  formatTraceItemDeltaV1_9,
  mapTraceEntryToLearningTraceItemV1_9
} from "./castleLearningTraceStripV1_9.js";

export const CASTLE_STABILITY_LEARNING_TRACE_UI_SCHEMA_V1_9 = "castle.stability_learning_trace_ui.v1.9";

export function formatLearningTraceEntryV1_9(entry) {
  if (!entry) return null;
  const item = mapTraceEntryToLearningTraceItemV1_9(entry);
  if (!item) return null;
  return Object.freeze({
    traceId: item.traceId,
    atMs: item.timestamp,
    kind: item.kind,
    trigger: item.trigger,
    label: item.triggerLabel,
    reason: entry.reason || "",
    detail: item.reason,
    deltaLine: formatTraceItemDeltaV1_9(item),
    modality: item.modality,
    source: item.source,
    humanVisible: item.humanVisible,
    deltas: item.delta
  });
}

export function summarizeLearningTraceStripV1_9(learningTrace, limit = 3) {
  const strip = buildLearningTraceStripV1_9(learningTrace, limit);
  const entries = strip.items.map((item) =>
    Object.freeze({
      traceId: item.traceId,
      atMs: item.timestamp,
      kind: item.kind,
      trigger: item.trigger,
      label: item.triggerLabel,
      reason: item.raw?.reason || "",
      detail: item.reason,
      deltaLine: formatTraceItemDeltaV1_9(item),
      modality: item.modality,
      source: item.source,
      humanVisible: item.humanVisible,
      deltas: item.delta
    })
  );

  return Object.freeze({
    schema: CASTLE_STABILITY_LEARNING_TRACE_UI_SCHEMA_V1_9,
    title: strip.title,
    entries: Object.freeze(entries),
    lines: strip.lines,
    totalCount: strip.totalCount,
    traceable: strip.traceable,
    replayable: strip.replayable,
    explainable: strip.explainable
  });
}

export function formatTraceAtMsV1_9(atMs) {
  try {
    return new Date(Number(atMs)).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return "—";
  }
}
