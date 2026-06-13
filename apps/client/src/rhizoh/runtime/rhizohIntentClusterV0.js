/**
 * Intent cluster v0 — multi-intent ecosystem (Sprint 39).
 * Single intent → domain migration (S38); multiple intents → cluster evolution.
 * RESEARCH-ONLY behavior ecology — not UI transitions.
 */

import {
  RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0,
  selectDominantClusterNodeV0
} from "./rhizohClusterEcologyLockV0.js";
import {
  dispatchRhizohKernelTraceEventV0,
  publishRhizohKernelTraceGlobalV0
} from "./rhizohKernelTraceMembraneV0.js";

export const RHIZOH_INTENT_CLUSTER_SCHEMA_V0 = "rhizoh.intent_cluster.v0";
export const RHIZOH_INTENT_CLUSTER_EVENT_V0 = "rhizoh:cluster-civilization-v0";

const MAX_CLUSTER_INTENTS_V0 = RHIZOH_INTENT_CLUSTER_MAX_SIZE_V0;

/** @type {{ schema: string, intents: object[], ecology: object, updatedAtMs: number } | null} */
let clusterSnapshotV0 = null;

/** @type {Set<() => void>} */
const clusterListenersV0 = new Set();

function emptyClusterV0() {
  return {
    schema: RHIZOH_INTENT_CLUSTER_SCHEMA_V0,
    intents: [],
    ecology: Object.freeze({
      dominantNode: null,
      nodeWeights: Object.freeze({}),
      intentCount: 0,
      exportExposure: 0,
      perceptionExposure: 0
    }),
    updatedAtMs: Date.now()
  };
}

function emitClusterV0() {
  const snap = getIntentClusterSnapshotV0();
  for (const fn of clusterListenersV0) {
    try {
      fn();
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    publishRhizohKernelTraceGlobalV0("__RHIZOH_INTENT_CLUSTER__", snap);
    dispatchRhizohKernelTraceEventV0(RHIZOH_INTENT_CLUSTER_EVENT_V0, snap);
  }
}

/**
 * @param {object} intent
 */
function clusterRowFromIntentV0(intent) {
  return Object.freeze({
    intentId: intent.intentId,
    atMs: intent.atMs,
    surfaceId: intent.surfaceId,
    hostNode: intent.hostNode,
    targetNode: intent.targetNode,
    overlayNode: intent.overlayNode,
    action: intent.action,
    migrate: intent.migrate === true,
    exportSensitive: intent.constraints?.exportSensitive === true,
    perceptionSensitive: intent.constraints?.perceptionSensitive === true,
    contextWeight: intent.constraints?.contextWeight ?? 0.5
  });
}

/**
 * Recompute ecology weights from intent history.
 * @param {object[]} intents
 */
export function evolveClusterEcologyFromIntentsV0(intents) {
  /** @type {Record<string, number>} */
  const nodeWeights = {};
  let exportExposure = 0;
  let perceptionExposure = 0;

  for (const row of intents) {
    const node = row.overlayNode || row.targetNode;
    if (node) nodeWeights[node] = (nodeWeights[node] || 0) + 1;
    if (row.exportSensitive) exportExposure += 1;
    if (row.perceptionSensitive) perceptionExposure += 1;
  }

  let dominantNode = selectDominantClusterNodeV0(nodeWeights);

  return Object.freeze({
    dominantNode,
    nodeWeights: Object.freeze({ ...nodeWeights }),
    intentCount: intents.length,
    exportExposure,
    perceptionExposure
  });
}

/**
 * Ingest committed intent into cluster — behavior ecology grows here.
 * @param {object} intent
 */
export function ingestIntentIntoClusterV0(intent) {
  if (!intent?.intentId) return getIntentClusterSnapshotV0();

  const base = clusterSnapshotV0 || emptyClusterV0();
  const row = clusterRowFromIntentV0(intent);
  const intents = [row, ...base.intents.filter((r) => r.intentId !== row.intentId)].slice(
    0,
    MAX_CLUSTER_INTENTS_V0
  );
  const ecology = evolveClusterEcologyFromIntentsV0(intents);

  clusterSnapshotV0 = Object.freeze({
    schema: RHIZOH_INTENT_CLUSTER_SCHEMA_V0,
    intents: Object.freeze(intents.map((r) => Object.freeze({ ...r }))),
    ecology,
    updatedAtMs: Date.now()
  });

  emitClusterV0();
  return clusterSnapshotV0;
}

export function getIntentClusterSnapshotV0() {
  if (!clusterSnapshotV0) {
    clusterSnapshotV0 = Object.freeze(emptyClusterV0());
  }
  return clusterSnapshotV0;
}

/**
 * Dominant federation node from cluster ecology (not latest intent guess).
 */
export function resolveDominantClusterNodeV0() {
  return getIntentClusterSnapshotV0().ecology?.dominantNode || null;
}

/** @param {() => void} onChange */
export function subscribeIntentClusterV0(onChange) {
  clusterListenersV0.add(onChange);
  return () => clusterListenersV0.delete(onChange);
}

/** @internal vitest */
export function __resetIntentClusterForTestV0() {
  clusterSnapshotV0 = null;
  clusterListenersV0.clear();
}
