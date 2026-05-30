/**
 * Rollout lifecycle invariant v0 — execution correctness = state correctness.
 * Guarantees release on all gateway paths; delegates lease truth to phasedRolloutClusterV0.
 * @see docs/ops/ROLLOUT_LIFECYCLE_INVARIANT_V1.0.md
 */

import { randomUUID } from "node:crypto";
import {
  beginPhasedRolloutTurnV0,
  endPhasedRolloutTurnV0,
  reconcilePhasedRolloutInflightV0,
  readPhasedRolloutLeaseTtlMsV0
} from "./phasedRolloutClusterV0.js";

export const ROLLOUT_LIFECYCLE_SCHEMA_V0 = "rhizoh.rollout_lifecycle_invariant.v0";

/**
 * Run turn work with guaranteed rollout release (idempotent).
 * @param {{ traceId?: string }} ctx
 * @param {(slot: { phased: object, leaseId: string | null, release: () => Promise<void> }) => Promise<T>} fn
 * @returns {Promise<{ ok: true, value: T } | { ok: false, phased: object }>}
 */
export async function withRolloutTurnLifecycleV0(ctx, fn) {
  const traceId = String(ctx?.traceId || randomUUID());
  const phased = await beginPhasedRolloutTurnV0({ traceId });
  if (!phased.ok) {
    return { ok: false, phased };
  }
  const leaseId = phased.leaseId ?? null;
  let released = false;
  const release = async () => {
    if (released) return;
    if (leaseId) await endPhasedRolloutTurnV0(leaseId);
    else await endPhasedRolloutTurnV0();
    released = true;
  };
  try {
    const value = await fn({ phased, leaseId, release });
    return { ok: true, value };
  } finally {
    await release();
  }
}

/**
 * Post-stress or periodic sweep — reclaims TTL-expired in-flight slots.
 */
export async function runRolloutLifecycleReconcileV0() {
  return reconcilePhasedRolloutInflightV0();
}

export function readRolloutLifecycleConfigV0() {
  return Object.freeze({
    schema: ROLLOUT_LIFECYCLE_SCHEMA_V0,
    leaseTtlMs: readPhasedRolloutLeaseTtlMsV0(),
    invariant: "acquire_with_lease_guaranteed_release_or_ttl_reconcile"
  });
}
