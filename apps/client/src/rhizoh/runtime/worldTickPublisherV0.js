import { publishWorldObservationV0 } from "./worldObservationBusV0.js";

const WORLD_TICK_INTERVAL_MS = 5000;
const WORLD_TICK_SPIKE_GUARD_MS = 2500;
let lastPublishAt = 0;
let clientTickCount = 0;

/**
 * Throttled world heartbeat — normalized interval + spike guard.
 * @param {{ simTime: number, activeCount?: number, mode?: string }} snap
 */
export function maybePublishWorldTickObservationV0(snap) {
  const now = Date.now();
  const since = now - lastPublishAt;
  if (since < WORLD_TICK_SPIKE_GUARD_MS) return;
  if (since < WORLD_TICK_INTERVAL_MS) return;
  lastPublishAt = now;
  clientTickCount += 1;
  publishWorldObservationV0({
    type: "world.tick",
    payload: {
      simTime: Number(snap?.simTime) || 0,
      activeCount: Math.max(0, Math.floor(Number(snap?.activeCount) || 0)),
      mode: snap?.mode ? String(snap.mode) : "",
      clientTickCount
    }
  });
}

let lastAgentSpokeAt = 0;
const AGENT_SPOKE_MIN_MS = 1500;

/**
 * @param {{ text: string, source?: string, traceId?: string }} row
 */
export function publishAgentSpokeObservationV0(row) {
  const text = String(row?.text || "").trim();
  if (!text) return null;
  const now = Date.now();
  if (now - lastAgentSpokeAt < AGENT_SPOKE_MIN_MS) return null;
  lastAgentSpokeAt = now;
  return publishWorldObservationV0({
    type: "agent.spoke",
    payload: {
      preview: text,
      source: row?.source ? String(row.source) : "llm",
      traceId: row?.traceId ? String(row.traceId) : ""
    }
  });
}

export function resetWorldTickPublisherForTestV0() {
  lastPublishAt = 0;
  clientTickCount = 0;
  lastAgentSpokeAt = 0;
}
