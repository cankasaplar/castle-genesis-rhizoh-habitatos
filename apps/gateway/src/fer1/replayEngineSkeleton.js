/**
 * FER-1 — Replay engine skeleton (closure patch §4.4).
 * Hedef: aynı event alt kümesi → deterministik OWIS tetik dizisi (test + audit).
 */

import { compareEventsForReplay } from "./eventOrderingEngineSkeleton.js";
import { mapObserveEventToOwis } from "./owisWorldTriggerBridgeSkeleton.js";

/**
 * @param {Array<{ stream: string, type: string, correlationId: string, eventId: string, occurredAtMs?: number }>} events
 * @returns {Array<ReturnType<typeof mapObserveEventToOwis>>}
 */
export function replayObserveTriggersDeterministic(events) {
  const obs = events.filter((e) => e.stream === "observe").sort(compareEventsForReplay);
  return obs.map((e) => mapObserveEventToOwis(e));
}
