/**
 * World namespace gate — LEGAL / ingress affects only world commit surfaces.
 * RESEARCH-ONLY policy boundary; core subsystems stay independent.
 *
 * WORLD DEPENDENT: Cesium, spatial projection, world adapter commit, spatial execution tick
 * ALWAYS ON: chess, UI core, learning, event graph, ghost simulation
 */

import { isRhizohWorldDomainPathV0 } from "./rhizohWorldDomainRoutesV0.js";
import { resolveSpatialSinkRoutePolicyV0 } from "./spatialSinkRoutePolicyV0.js";

export const RHIZOH_WORLD_NAMESPACE_GATE_SCHEMA_V0 = "castle.rhizoh.world_namespace_gate.v0";

/**
 * Spatial execution tick (graph→spatial registry) — off during ingress hold.
 */
export function isRhizohSpatialExecutionAllowedV0() {
  const policy = resolveSpatialSinkRoutePolicyV0();
  return !policy.onIngress;
}

/**
 * World commit surface (Cesium drain / spatialWorldAdapter.commit).
 */
export function isRhizohWorldNamespaceCommitAllowedV0() {
  const policy = resolveSpatialSinkRoutePolicyV0();
  return policy.sinkExpected && policy.drainAllowed && policy.engineReady;
}

/**
 * Whether world-domain UI chrome (calm mode, map tool defaults) may apply.
 */
export function isRhizohWorldDomainUiActiveV0() {
  if (typeof window === "undefined") return false;
  return isRhizohWorldDomainPathV0(window.location.pathname || "/");
}

/**
 * Snapshot for console probes.
 */
export function getRhizohWorldNamespaceGateSnapshotV0() {
  const policy = resolveSpatialSinkRoutePolicyV0();
  return Object.freeze({
    schema: RHIZOH_WORLD_NAMESPACE_GATE_SCHEMA_V0,
    spatialExecutionAllowed: isRhizohSpatialExecutionAllowedV0(),
    worldCommitAllowed: isRhizohWorldNamespaceCommitAllowedV0(),
    worldDomainUiActive: isRhizohWorldDomainUiActiveV0(),
    policy,
    atMs: Date.now()
  });
}

export function publishRhizohWorldNamespaceGateV0() {
  if (typeof window === "undefined") return null;
  const snap = getRhizohWorldNamespaceGateSnapshotV0();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldNamespaceGate = snap;
  return snap;
}
