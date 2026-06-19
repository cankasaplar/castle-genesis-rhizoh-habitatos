/**
 * Codex ghost → truth trace bridge v0.
 * RESEARCH-ONLY — observation path; influencesExecution: false.
 * Feeds causal map edge producer without force-linking EdgeStore.
 */

import { CODEX_EVENT_TYPE_V0 } from "../../core/codexReducerV0.js";
import { traceCodexGhostV0 } from "./rhizohTruthTraceLayerV0.js";

export const CODEX_GHOST_TRUTH_BRIDGE_SCHEMA_V0 = "rhizoh.codex_ghost_truth_bridge.v0";

const GHOST_TRUTH_EVENT_TYPES_V0 = new Set([
  CODEX_EVENT_TYPE_V0.GHOST_SPAWN,
  CODEX_EVENT_TYPE_V0.GHOST_DEATH,
  CODEX_EVENT_TYPE_V0.GHOST_DISPATCH,
  CODEX_EVENT_TYPE_V0.GHOST_ARCHIVED
]);

/**
 * @param {string} eventType
 * @param {object} [payload]
 * @param {{ persisted?: boolean, seq?: number | null, cycle?: number | null }} [meta]
 */
export function bridgeCodexGhostToTruthTraceV0(eventType, payload = {}, meta = {}) {
  const type = String(eventType || "").trim();
  if (!GHOST_TRUTH_EVENT_TYPES_V0.has(type)) return null;

  const phase =
    type === CODEX_EVENT_TYPE_V0.GHOST_SPAWN || type === CODEX_EVENT_TYPE_V0.GHOST_DISPATCH
      ? "spawn"
      : "death";

  const ghostId = String(payload.ghostId || payload.id || "").trim() || null;

  return traceCodexGhostV0(phase, {
    ghostId,
    origin: payload.origin || payload.src || null,
    destination: payload.destination || payload.dst || payload.loc || null,
    ghostKind: payload.type || payload.kind || null,
    codexEventType: type,
    persisted: meta.persisted === true,
    seq: meta.seq ?? null,
    cycle: meta.cycle ?? null,
    influencesExecution: false
  });
}

/**
 * Registry snapshot — window global is read-only observation.
 */
export function publishCodexGhostTruthBridgeRegistryV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.codexGhostTruthBridge = Object.freeze({
    schema: CODEX_GHOST_TRUTH_BRIDGE_SCHEMA_V0,
    influencesExecution: false,
    wiredEventTypes: Object.freeze([...GHOST_TRUTH_EVENT_TYPES_V0])
  });
}
