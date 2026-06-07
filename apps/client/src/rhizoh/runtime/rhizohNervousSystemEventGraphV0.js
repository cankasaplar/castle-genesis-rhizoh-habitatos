/**
 * Rhizoh Nervous System — acyclic event graph.
 * Flow: domain event → adapter event → tensor decision → render output.
 * Circular re-entry is blocked.
 */

export const RHIZOH_NS_EVENT_GRAPH_SCHEMA_V0 = "rhizoh.nervous_system.event_graph.v0";

/** @type {Set<string>} */
const inFlightKeys = new Set();

/** @type {string[]} */
const eventTrace = [];
const TRACE_MAX = 64;

/**
 * @param {string} stage — domain | adapter | tensor | render
 * @param {string} domain
 * @param {string} key
 * @returns {boolean} true if dispatch allowed
 */
export function acquireNervousSystemEventSlotV0(stage, domain, key) {
  const slot = `${stage}:${domain}:${key}`;
  if (inFlightKeys.has(slot)) return false;
  inFlightKeys.add(slot);
  eventTrace.push(`${Date.now()}:${slot}`);
  if (eventTrace.length > TRACE_MAX) eventTrace.shift();
  return true;
}

/**
 * @param {string} stage
 * @param {string} domain
 * @param {string} key
 */
export function releaseNervousSystemEventSlotV0(stage, domain, key) {
  inFlightKeys.delete(`${stage}:${domain}:${key}`);
}

/**
 * Dispatch through acyclic graph — returns null if circular block.
 * @param {string} stage
 * @param {string} domain
 * @param {string} key
 * @param {() => unknown} fn
 */
export function dispatchNervousSystemEventV0(stage, domain, key, fn) {
  if (!acquireNervousSystemEventSlotV0(stage, domain, key)) {
    return Object.freeze({ ok: false, reason: "circular_event_blocked", stage, domain, key });
  }
  try {
    const result = fn();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("rhizoh:ns-event-graph-v0", {
          detail: Object.freeze({ stage, domain, key, atMs: Date.now() })
        })
      );
    }
    return Object.freeze({ ok: true, result });
  } finally {
    releaseNervousSystemEventSlotV0(stage, domain, key);
  }
}

/** @returns {string[]} */
export function getNervousSystemEventTraceV0() {
  return [...eventTrace];
}

/** @internal vitest */
export function __resetNervousSystemEventGraphForTestV0() {
  inFlightKeys.clear();
  eventTrace.length = 0;
}
