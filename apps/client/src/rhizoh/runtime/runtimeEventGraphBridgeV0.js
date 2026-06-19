/**
 * Runtime Event → Graph Bridge v0.
 * Commits pulse / identity / presence / genesis observations into truth_trace + causal map.
 * RESEARCH-ONLY — influencesExecution: false; does not replace gateway genesis persistence.
 */

import { traceRuntimeSubstrateEventV0 } from "./rhizohTruthTraceLayerV0.js";
import { publishCausalMapLayerV0 } from "./rhizohCausalMapLayerV0.js";
import {
  consumeCausalGraphDiffV0,
  detectOrphanCausalGraphV0,
  projectCausalNodesToSpatialV0
} from "./causalGraphSpatialBridgeV0.js";

export const RUNTIME_EVENT_GRAPH_BRIDGE_SCHEMA_V0 = "rhizoh.runtime_event_graph_bridge.v0";

export const RUNTIME_SUBSTRATE_SOURCE_V0 = Object.freeze({
  IDENTITY: "identity",
  PULSE: "pulse",
  PRESENCE: "presence",
  GENESIS: "genesis",
  GROUNDING: "grounding"
});

/** @type {number | null} */
let commitTimerV0 = null;

/** @type {{ committed: number, lastCommitAtMs: number | null, lastSource: string | null }} */
const statsV0 = { committed: 0, lastCommitAtMs: null, lastSource: null };

/**
 * @param {string} source
 * @param {object} [detail]
 */
export function commitRuntimeEventToGraphV0(source, detail = {}) {
  const src = String(source || "").trim();
  if (!src) return null;

  const row = traceRuntimeSubstrateEventV0(src, {
    source: src,
    ...detail,
    influencesExecution: false
  });

  statsV0.committed += 1;
  statsV0.lastSource = src;
  scheduleCausalMapCommitV0();

  return row;
}

/**
 * Debounced causal map refresh — avoids republishing on every 2s pulse tick.
 */
export function scheduleCausalMapCommitV0() {
  if (typeof window === "undefined") return;
  if (commitTimerV0 !== null) return;
  commitTimerV0 = window.setTimeout(() => {
    commitTimerV0 = null;
    const map = publishCausalMapLayerV0();
    statsV0.lastCommitAtMs = Date.now();
    const spatialBridge = consumeCausalGraphDiffV0({ causalMap: map });
    publishRuntimeEventGraphBridgeRegistryV0(map, spatialBridge);
  }, 120);
}

export function flushCausalMapCommitV0() {
  if (typeof window === "undefined") return publishCausalMapLayerV0();
  if (commitTimerV0 !== null) {
    window.clearTimeout(commitTimerV0);
    commitTimerV0 = null;
  }
  const map = publishCausalMapLayerV0();
  statsV0.lastCommitAtMs = Date.now();
  const spatialBridge = consumeCausalGraphDiffV0({ causalMap: map });
  publishRuntimeEventGraphBridgeRegistryV0(map, spatialBridge);
  return map;
}

/**
 * DevTools repair — rebuild causal map + optional spatial bridge (fixes 0-edge orphan graph).
 * @param {{ forceSpatialBridge?: boolean }} [opts]
 */
export function rebuildRhizohCausalGraphV0(opts = {}) {
  const map = flushCausalMapCommitV0();
  const orphan = detectOrphanCausalGraphV0();
  let spatialBridge = null;
  if (orphan.orphan || opts.forceSpatialBridge) {
    spatialBridge = projectCausalNodesToSpatialV0(map, { force: true });
    consumeCausalGraphDiffV0({ causalMap: map, force: true });
  }
  const result = Object.freeze({
    ok: true,
    schema: `${RUNTIME_EVENT_GRAPH_BRIDGE_SCHEMA_V0}.rebuild`,
    nodeCount: map?.nodeCount ?? 0,
    edgeCount: map?.edgeCount ?? 0,
    rawEdgeCount: map?.causalMapRaw?.edgeCount ?? 0,
    orphanBefore: Object.freeze({ ...orphan }),
    spatialBridge: spatialBridge
      ? Object.freeze({
          consumed: spatialBridge.consumed ?? 0,
          staged: spatialBridge.staged ?? spatialBridge.projected ?? 0,
          skipped: spatialBridge.skipped ?? 0
        })
      : null,
    atMs: Date.now()
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastCausalGraphRebuild = result;
    window.__rhizoh.rebuildCausalGraph = rebuildRhizohCausalGraphV0;
  }
  return result;
}

export function ensureRhizohCausalGraphDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.rebuildCausalGraph = rebuildRhizohCausalGraphV0;
  window.__rhizoh.flushCausalMapCommit = flushCausalMapCommitV0;
  return rebuildRhizohCausalGraphV0;
}

/**
 * @param {object} [map]
 * @param {object} [spatialBridge]
 */
export function publishRuntimeEventGraphBridgeRegistryV0(map = null, spatialBridge = null) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.runtimeEventGraphBridge = Object.freeze({
    schema: RUNTIME_EVENT_GRAPH_BRIDGE_SCHEMA_V0,
    influencesExecution: false,
    stats: Object.freeze({ ...statsV0 }),
    lastCausalMap: map
      ? Object.freeze({
          nodeCount: map.nodeCount ?? 0,
          edgeCount: map.edgeCount ?? 0,
          rawEdgeCount: map.causalMapRaw?.edgeCount ?? null
        })
      : null,
    lastSpatialBridge: spatialBridge
      ? Object.freeze({
          consumed: spatialBridge.consumed ?? 0,
          staged: spatialBridge.staged ?? spatialBridge.projected ?? 0,
          skipped: spatialBridge.skipped ?? 0,
          spatialNodeCount: spatialBridge.spatialNodeCount ?? 0
        })
      : null
  });
}

/** @internal vitest */
export function __resetRuntimeEventGraphBridgeForTestV0() {
  if (typeof window !== "undefined" && commitTimerV0 !== null) {
    window.clearTimeout(commitTimerV0);
  }
  commitTimerV0 = null;
  statsV0.committed = 0;
  statsV0.lastCommitAtMs = null;
  statsV0.lastSource = null;
}
