/**
 * FER-1 — OWIS world trigger bridge (closure patch §4.3).
 * event → world state özeti → Observe rendering tetik mantığı (istemci veya gateway).
 */

/** @typedef {"W0"|"W1"|"W2"|"W3"|"W3_PLUS"} OwisPhase */

/**
 * @param {{ type: string, primaryClaimCount?: number }} eventDoc
 * @returns {{ owisPhase: OwisPhase, triggerObserveRender: boolean, layerHint?: string }}
 */
export function mapObserveEventToOwis(eventDoc) {
  const t = String(eventDoc.type || "");
  if (t === "observe_skeleton_ready_v1") {
    return { owisPhase: "W1", triggerObserveRender: true, layerHint: "skeleton" };
  }
  if (t === "observe_anchor_committed_v1") {
    return { owisPhase: "W2", triggerObserveRender: true, layerHint: "anchor" };
  }
  if (t === "observe_live_feed_attached_v1") {
    return { owisPhase: "W3", triggerObserveRender: true, layerHint: "live" };
  }
  if (t === "observe_telemetry_deferred_v1") {
    return { owisPhase: "W3_PLUS", triggerObserveRender: false, layerHint: "telemetry" };
  }
  return { owisPhase: "W0", triggerObserveRender: false };
}
