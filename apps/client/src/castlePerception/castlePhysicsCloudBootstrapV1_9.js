/**
 * Castle Physics Cloud Bootstrap v1.9 — lazy Firebase adapter install on auth + config.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_9_BRIDGE_V1.md
 */

import { registerPhysicsLifecycleCloudAdapterV1_9 } from "./castlePhysicsLifecycleCloudV1_9.js";
import {
  installPhysicsFirebaseCloudAdapterV1_9,
  resolvePhysicsSyncUserIdV1_9
} from "./castlePhysicsFirebaseAdapterV1_9.js";

let bootstrapAttemptedV1_9 = false;
let lastBootstrapResultV1_9 = null;

export function bootstrapPhysicsCloudSyncV1_9(options = {}) {
  if (bootstrapAttemptedV1_9 && !options.force) {
    return lastBootstrapResultV1_9;
  }

  bootstrapAttemptedV1_9 = true;
  lastBootstrapResultV1_9 = installPhysicsFirebaseCloudAdapterV1_9({
    registerAdapter: options.registerAdapter || registerPhysicsLifecycleCloudAdapterV1_9,
    getUid: options.getUid
  });

  if (typeof window !== "undefined" && lastBootstrapResultV1_9?.installed) {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.resolvePhysicsSyncUserId = resolvePhysicsSyncUserIdV1_9;
    window.__rhizoh.physicsCloudBootstrap = lastBootstrapResultV1_9;
  }

  return lastBootstrapResultV1_9;
}

export function getPhysicsCloudBootstrapSnapshotV1_9() {
  return Object.freeze({
    attempted: bootstrapAttemptedV1_9,
    result: lastBootstrapResultV1_9,
    syncUserId: resolvePhysicsSyncUserIdV1_9()
  });
}

/** @internal vitest */
export function __resetPhysicsCloudBootstrapForTestV1_9() {
  bootstrapAttemptedV1_9 = false;
  lastBootstrapResultV1_9 = null;
}
