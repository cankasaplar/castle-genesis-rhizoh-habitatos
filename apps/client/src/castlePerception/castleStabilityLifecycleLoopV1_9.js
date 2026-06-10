/**
 * Castle Stability Lifecycle Loop v1.9 — cloud-sync lifecycle + observable learning strip.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9.md
 */

import { applyStabilityLifecycleLoopV1_8 } from "./castleStabilityLifecycleLoopV1_8.js";
import { pushPhysicsLifecycleCloudSyncV1_9, pullPhysicsLifecycleCloudSyncV1_9 } from "./castleStabilityCloudSyncV1_9.js";
import { buildLearningTraceStripV1_9 } from "./castleLearningTraceStripV1_9.js";
import { summarizeLearningTraceStripV1_9 } from "./castleStabilityLearningTraceUiV1_9.js";
import { resolvePhysicsSyncUserIdV1_9 } from "./castlePhysicsFirebaseAdapterV1_9.js";

export const CASTLE_STABILITY_LIFECYCLE_LOOP_SCHEMA_V1_9 = "castle.stability_lifecycle_loop.v1.9";

export const CASTLE_OS_LOOP_EVENT_V1_9 = "castle.os.loop.v1.9";

let cloudPullBootstrappedV1_9 = false;

export function applyStabilityLifecycleLoopV1_9(realityStability, input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const ownerId = resolvePhysicsSyncUserIdV1_9(
    String(input.ownerId || realityStability.dynamics?.contextualIdentity?.ownerId || "user_local")
  );

  if (!cloudPullBootstrappedV1_9 && input.cloudSync !== false) {
    cloudPullBootstrappedV1_9 = true;
    pullPhysicsLifecycleCloudSyncV1_9(ownerId, { merge: true, atMs });
  }

  const lifecycleResult = applyStabilityLifecycleLoopV1_8(realityStability, input);

  const cloudSync =
    input.cloudSync !== false && lifecycleResult.userPhysicsProfile?.observationCount > 0
      ? pushPhysicsLifecycleCloudSyncV1_9(ownerId, { atMs, debounceMs: input.cloudDebounceMs })
      : Object.freeze({ pushed: false, mode: "skipped" });

  const learningTraceStrip = buildLearningTraceStripV1_9(lifecycleResult.learningTrace, 3);
  const traceStrip = summarizeLearningTraceStripV1_9(lifecycleResult.learningTrace, 3);

  return Object.freeze({
    ...lifecycleResult,
    cloudSync,
    learningTraceStrip,
    traceStrip,
    schema: CASTLE_STABILITY_LIFECYCLE_LOOP_SCHEMA_V1_9
  });
}

export function publishCastleOsLoopEventV1_9(result) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CASTLE_OS_LOOP_EVENT_V1_9, {
      detail: Object.freeze({ result, atMs: result?.atMs || Date.now() })
    })
  );
}

export function getStabilityLifecycleLoopSnapshotV1_9() {
  return Object.freeze({
    schema: CASTLE_STABILITY_LIFECYCLE_LOOP_SCHEMA_V1_9,
    identity: "distributed_cognitive_physics_observable_learning"
  });
}

/** @internal vitest */
export function __resetStabilityLifecycleLoopForTestV1_9() {
  cloudPullBootstrappedV1_9 = false;
}
