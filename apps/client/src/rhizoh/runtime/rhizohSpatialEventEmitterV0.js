/**
 * Spatial event emitter — domain events → spatial layer → map renderer → UI.
 * Domains MUST NOT bind map nodes directly; emit spatial events only.
 */

import { SPATIAL_NODE_TIER_V0, registerSpatialNodeV0 } from "./rhizohSpatialNodeLayerV0.js";
import { dispatchNervousSystemEventV0 } from "./rhizohNervousSystemEventGraphV0.js";
import { traceSpatialNodeV0, traceFallbackV0 } from "./rhizohTruthTraceLayerV0.js";
import { explainSpatialEventOriginV0 } from "./rhizohExplanationLayerV0.js";
import { noteSpatialNodeSpawnV0 } from "./rhizohLiveConsistencyAuditV0.js";
import {
  isSpatialReadyGateOpenV0,
  shouldSpatialReadyGateDomainV0,
  isSpatialReadyProbeNodeV0,
  enqueuePreReadySpatialEventV0
} from "./rhizohSpatialReadyGateV0.js";

export const RHIZOH_SPATIAL_EVENT_V0 = "rhizoh:spatial-event-v0";

/** @type {Set<string>} */
const blockedEmitters = new Set();

/**
 * Block spatial emissions from a failed domain (cascade isolation).
 * @param {string} domainId
 */
export function blockSpatialEmitterV0(domainId) {
  blockedEmitters.add(String(domainId || "").trim());
}

/** @param {string} domainId */
export function unblockSpatialEmitterV0(domainId) {
  blockedEmitters.delete(String(domainId || "").trim());
}

/**
 * Immediate spatial registry path (bypasses Spatial Ready Gate — drain only).
 * @param {string} sourceDomain
 * @param {{ tier?: string, nodeId: string, kind: string, payload?: object, trigger?: string }} event
 */
export function emitSpatialEventImmediateV0(sourceDomain, event = {}) {
  const domain = String(sourceDomain || "").trim();
  const nodeId = String(event.nodeId || "").trim();
  if (!nodeId) {
    const outcome = Object.freeze({ ok: false, reason: "missing_node_id" });
    explainSpatialEventOriginV0(domain, event, outcome, { trigger: "emitSpatialEventImmediateV0" });
    return outcome;
  }
  if (blockedEmitters.has(domain)) {
    traceFallbackV0(domain, "emitter_blocked", { nodeId: event.nodeId, tier: event.tier });
    const outcome = Object.freeze({ ok: false, reason: "emitter_blocked", domain });
    explainSpatialEventOriginV0(domain, event, outcome, { trigger: "cascade_isolation" });
    return outcome;
  }

  const tier = event.tier || SPATIAL_NODE_TIER_V0.STATIC;
  const dispatched = dispatchNervousSystemEventV0("spatial", domain, `${tier}:${nodeId}`, () => {
    const traceRow = traceSpatialNodeV0(tier, nodeId, {
      sourceDomain: domain,
      kind: event.kind || "node"
    });
    const row = registerSpatialNodeV0(tier, nodeId, {
      kind: event.kind || "node",
      sourceDomain: domain,
      ...(event.payload || {})
    });
    noteSpatialNodeSpawnV0(tier, nodeId);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_SPATIAL_EVENT_V0, {
          detail: Object.freeze({ domain, tier, nodeId, row, atMs: Date.now() })
        })
      );
    }
    return { row, traceRow };
  });

  if (!dispatched.ok) {
    const outcome = Object.freeze({ ok: false, reason: dispatched.reason || "spatial_dispatch_blocked" });
    explainSpatialEventOriginV0(domain, { ...event, tier, nodeId }, outcome, {
      trigger: "nervous_system_graph"
    });
    return outcome;
  }
  const { row, traceRow } = dispatched.result ?? {};
  const outcome = Object.freeze({ ok: true, node: row });
  explainSpatialEventOriginV0(
    domain,
    { ...event, tier, nodeId },
    outcome,
    { trigger: event.trigger || "domain_spatial_emit" },
    { traceRecorded: traceRow !== null }
  );
  return outcome;
}

/**
 * @param {string} sourceDomain
 * @param {{ tier?: string, nodeId: string, kind: string, payload?: object, trigger?: string }} event
 */
export function emitSpatialEventFromDomainV0(sourceDomain, event = {}) {
  const domain = String(sourceDomain || "").trim();
  const nodeId = String(event.nodeId || "").trim();
  if (
    nodeId &&
    shouldSpatialReadyGateDomainV0(domain) &&
    !isSpatialReadyGateOpenV0() &&
    !isSpatialReadyProbeNodeV0(nodeId)
  ) {
    enqueuePreReadySpatialEventV0(domain, event);
    traceFallbackV0(domain, "spatial_ready_buffered", { nodeId, tier: event.tier });
    const outcome = Object.freeze({
      ok: true,
      deferred: true,
      reason: "cesium_not_ready",
      buffered: true,
      domain
    });
    explainSpatialEventOriginV0(domain, event, outcome, { trigger: "spatial_ready_gate" });
    return outcome;
  }
  return emitSpatialEventImmediateV0(sourceDomain, event);
}

/** @internal vitest */
export function __resetSpatialEventEmitterForTestV0() {
  blockedEmitters.clear();
}
