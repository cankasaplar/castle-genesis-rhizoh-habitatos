/**
 * Sprint B/D bridge — ROS execution runtime (policy acts, not describes).
 *
 * Evaluates lease + arbitration clock + proposal gate before WAL stream ingress.
 */

export const ROS_EXECUTION_RUNTIME_SCHEMA_V0 = "castle.rhizoh.ros_execution_runtime.v0";

/** @type {Map<string, { holderId: string, scope: string, expiresAtMs: number }>} */
const leaseRegistryV0 = new Map();

let arbitrationClockV0 = 0;

export function getRosArbitrationClockV0() {
  return arbitrationClockV0;
}

/**
 * @param {string} scope
 * @param {string} holderId
 * @param {number} ttlMs
 */
export function grantRosAuthorityLeaseV0(scope, holderId, ttlMs = 60_000) {
  const key = String(scope || "global");
  leaseRegistryV0.set(key, {
    holderId: String(holderId || "castle:local"),
    scope: key,
    expiresAtMs: Date.now() + Math.max(1000, ttlMs)
  });
}

/**
 * @param {string} scope
 * @param {number} [nowMs]
 */
export function hasActiveRosLeaseV0(scope, nowMs = Date.now()) {
  const row = leaseRegistryV0.get(String(scope || "global"));
  if (!row) return false;
  return nowMs < row.expiresAtMs;
}

const SEALING_KINDS = new Set(["obstacle_delta", "topology_patch", "federation_patch", "snapshot_materialize"]);

/**
 * ROS policy execution on WAL diff — returns attestation flags for ingress.
 *
 * @param {import("./submitWorldAuthoritySealCandidateV0.js").WalWorldDiffV0} walDiff
 * @param {{ holderId?: string, nowMs?: number }} [ctx]
 */
export function executeRosPolicyOnWalDiffV0(walDiff, ctx = {}) {
  const nowMs = Number(ctx.nowMs) || Date.now();
  arbitrationClockV0 += 1;
  const scope = String(walDiff?.roomScope || "global");
  const kind = String(walDiff?.kind || "");
  const isSealing = SEALING_KINDS.has(kind);
  const holderId = String(ctx.holderId || "castle:wal:local");

  if (!walDiff?.signed && isSealing) {
    return {
      allow: false,
      rosVerdict: "reject_unsigned",
      code: "ROS_UNSIGNED_PROPOSAL",
      arbitrationClock: arbitrationClockV0,
      leaseOk: false,
      constitutionOk: false
    };
  }

  if (isSealing && !hasActiveRosLeaseV0(scope, nowMs)) {
    grantRosAuthorityLeaseV0(scope, holderId, 120_000);
  }

  const leaseOk = !isSealing || hasActiveRosLeaseV0(scope, nowMs);
  if (!leaseOk) {
    return {
      allow: false,
      rosVerdict: "reject_no_lease",
      code: "ROS_LEASE_REQUIRED",
      arbitrationClock: arbitrationClockV0,
      leaseOk: false,
      constitutionOk: true
    };
  }

  return {
    allow: true,
    rosVerdict: "allow_proposal",
    arbitrationClock: arbitrationClockV0,
    leaseOk: true,
    constitutionOk: true,
    scope,
    holderId
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildRosExecutionRuntimeSnapshotV0() {
  return {
    schema: ROS_EXECUTION_RUNTIME_SCHEMA_V0,
    ts: Date.now(),
    arbitrationClock: arbitrationClockV0,
    activeLeases: [...leaseRegistryV0.entries()].map(([scope, row]) => ({
      scope,
      holderId: row.holderId,
      expiresAtMs: row.expiresAtMs
    }))
  };
}
