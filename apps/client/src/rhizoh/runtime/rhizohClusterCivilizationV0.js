/**
 * Cluster Civilization v0 — behavior ecology over multi-intent ecosystem (Sprint 39).
 * S38: single intent → domain migration. S39: multiple intents → cluster evolution.
 * RESEARCH-ONLY — manages ecology, not UI transitions.
 */

import { getLatestContextIntentSnapshotV0 } from "./rhizohContextIntentSnapshotV0.js";
import {
  getIntentClusterSnapshotV0,
  ingestIntentIntoClusterV0,
  resolveDominantClusterNodeV0,
  RHIZOH_INTENT_CLUSTER_EVENT_V0,
  __resetIntentClusterForTestV0
} from "./rhizohIntentClusterV0.js";
import {
  evaluateIntentDriftV0,
  INTENT_DRIFT_SEVERITY_V0,
  reconcileIntentDriftV0,
  RHIZOH_INTENT_DRIFT_SCHEMA_V0
} from "./rhizohIntentDriftGuardV0.js";

import {
  RHIZOH_CLUSTER_DRIFT_POLL_MS_V0
} from "./rhizohClusterEcologyLockV0.js";
import {
  dispatchRhizohKernelTraceEventV0,
  publishRhizohKernelTraceGlobalV0
} from "./rhizohKernelTraceMembraneV0.js";

export const RHIZOH_CLUSTER_CIVILIZATION_SCHEMA_V0 = "rhizoh.cluster_civilization.v0";
export const RHIZOH_CLUSTER_CIVILIZATION_EVENT_V0 = "rhizoh:cluster-civilization-profile-v0";

const CLUSTER_DRIFT_POLL_MS_V0 = RHIZOH_CLUSTER_DRIFT_POLL_MS_V0;

/** @type {ReturnType<typeof setInterval> | null} */
let driftPollHandleV0 = null;

function emitCivilizationProfileV0(profile) {
  if (typeof window === "undefined") return;
  publishRhizohKernelTraceGlobalV0("__RHIZOH_CLUSTER_CIVILIZATION__", profile);
  dispatchRhizohKernelTraceEventV0(RHIZOH_CLUSTER_CIVILIZATION_EVENT_V0, profile);
}

/**
 * Advance cluster ecology after a committed intent (post-migration hook).
 * @param {object | null | undefined} intent
 */
export function advanceClusterCivilizationFromIntentV0(intent) {
  if (intent?.intentId) ingestIntentIntoClusterV0(intent);

  const driftBefore = evaluateIntentDriftV0();
  const reconcile =
    driftBefore.drifted && driftBefore.severity === INTENT_DRIFT_SEVERITY_V0.HIGH
      ? reconcileIntentDriftV0()
      : Object.freeze({ ok: true, reconciled: false, drift: driftBefore });

  const profile = Object.freeze({
    schema: RHIZOH_CLUSTER_CIVILIZATION_SCHEMA_V0,
    cluster: getIntentClusterSnapshotV0(),
    drift: reconcile.drift || driftBefore,
    reconcile,
    dominantNode: resolveDominantClusterNodeV0(),
    atMs: Date.now()
  });

  emitCivilizationProfileV0(profile);
  return profile;
}

/**
 * Resolve overlay from intent when aligned; fall back to cluster ecology on high drift.
 * @param {string | null | undefined} [fallbackNode]
 */
export function resolveOverlayNodeFromClusterEcologyV0(fallbackNode = null) {
  const intent = getLatestContextIntentSnapshotV0();
  const drift = evaluateIntentDriftV0();

  if (
    intent?.overlayNode &&
    (!drift.drifted || drift.severity !== INTENT_DRIFT_SEVERITY_V0.HIGH)
  ) {
    return intent.overlayNode;
  }

  return resolveDominantClusterNodeV0() || fallbackNode;
}

export function getClusterCivilizationSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_CLUSTER_CIVILIZATION_SCHEMA_V0,
    cluster: getIntentClusterSnapshotV0(),
    drift: evaluateIntentDriftV0(),
    dominantNode: resolveDominantClusterNodeV0(),
    atMs: Date.now()
  });
}

/**
 * Boot long-session drift guard — periodic reconcile without route hops.
 * @returns {() => void} dispose
 */
export function bootClusterCivilizationV0() {
  getIntentClusterSnapshotV0();

  if (typeof window === "undefined") return () => {};

  if (driftPollHandleV0 != null) {
    clearInterval(driftPollHandleV0);
  }

  driftPollHandleV0 = setInterval(() => {
    const drift = evaluateIntentDriftV0();
    if (drift.drifted) {
      const profile = advanceClusterCivilizationFromIntentV0(getLatestContextIntentSnapshotV0());
      if (!profile.reconcile.reconciled && drift.severity === INTENT_DRIFT_SEVERITY_V0.LOW) {
        reconcileIntentDriftV0();
      }
    }
  }, CLUSTER_DRIFT_POLL_MS_V0);

  emitCivilizationProfileV0(getClusterCivilizationSnapshotV0());

  return () => {
    if (driftPollHandleV0 != null) {
      clearInterval(driftPollHandleV0);
      driftPollHandleV0 = null;
    }
  };
}

export { RHIZOH_INTENT_CLUSTER_EVENT_V0, RHIZOH_INTENT_DRIFT_SCHEMA_V0 };

/** @internal vitest */
export function __resetClusterCivilizationForTestV0() {
  if (driftPollHandleV0 != null) {
    clearInterval(driftPollHandleV0);
    driftPollHandleV0 = null;
  }
  __resetIntentClusterForTestV0();
}
