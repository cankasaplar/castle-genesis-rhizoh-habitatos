/**
 * Living World Drift & Re-Election V0 (Faz 2.9)
 *
 * World selection is not one-shot — running reality must be re-legitimized over time.
 */

import { invalidateTemporalAuthorityFixationV0 } from "./temporalAuthorityFixationV0.js";
import { runTemporalExecutionPipelineV0 } from "./temporalAuditRefixationV0.js";
import {
  enforceHydrateGateV0,
  normalizeBootstrapForSealV0,
  readLivingWorldBootstrapV0,
  revokeLivingWorldBootstrapV0,
  sealPipelineLivingWorldV0,
  shouldRevokeLivingWorldBootstrapV0
} from "./worldSealerV0.js";
import { AUDIT_INTEGRITY_VERDICT_V0 } from "./temporalAuditIntegrityV0.js";
import { FIXATION_AUDIT_VERDICT_V0 } from "./temporalAuditRefixationV0.js";
import { openSubstrateContinuityIdbV0, resolveSubstrateContinuityDiskKeyV0 } from "../substrateContinuityIdbV0.js";

export const LIVING_WORLD_DRIFT_SCHEMA_V0 = "castle.rhizoh.living_world_drift.v0";

export const RELEGITIMIZATION_VERDICT_V0 = Object.freeze({
  STILL_LEGITIMATE: "still_legitimate",
  DRIFT_DETECTED: "drift_detected",
  RE_ELECTION_REQUIRED: "re_election_required",
  QUARANTINE: "quarantine"
});

export const DEFAULT_RELEGITIMIZATION_POLICY_V0 = Object.freeze({
  /** Checkpoint drift ticks before re-election. */
  maxCheckpointDriftTicks: 8,
  /** Ms after seal before mandatory re-legitimization pass. */
  maxLegitimacyAgeMs: 60_000
});

/**
 * @param {import('./worldSealerV0.js').PersistedLivingWorldBootstrapV0 | null} persisted
 * @param {import('./worldSealerV0.js').PersistedLivingWorldBootstrapV0 | null} fresh
 * @param {{ nowMs?: number, policy?: Partial<typeof DEFAULT_RELEGITIMIZATION_POLICY_V0> }} [opts]
 */
export function assessLivingWorldDriftV0(persisted, fresh, opts = {}) {
  const policy = { ...DEFAULT_RELEGITIMIZATION_POLICY_V0, ...opts.policy };
  const nowMs = Number(opts.nowMs) || Date.now();

  if (!persisted) {
    return {
      schema: LIVING_WORLD_DRIFT_SCHEMA_V0,
      verdict: RELEGITIMIZATION_VERDICT_V0.STILL_LEGITIMATE,
      requiresReElection: false,
      statement: "No prior living world — first legitimization."
    };
  }

  if (!fresh || fresh.mayBootstrapRuntime !== true) {
    return {
      schema: LIVING_WORLD_DRIFT_SCHEMA_V0,
      verdict: RELEGITIMIZATION_VERDICT_V0.QUARANTINE,
      requiresReElection: false,
      statement: "Fresh selection denies bootstrap — quarantine running reality."
    };
  }

  const age = nowMs - (Number(persisted.sealedAtMs) || 0);
  const checkpointDrift = Math.abs(
    (Number(fresh.checkpointTick) || 0) - (Number(persisted.checkpointTick) || 0)
  );
  const worldChanged = String(persisted.livingWorldId || "") !== String(fresh.livingWorldId || "");
  const nodeChanged = String(persisted.livingNodeId || "") !== String(fresh.livingNodeId || "");
  const bootstrapRevoked = persisted.mayBootstrapRuntime === true && fresh.mayBootstrapRuntime !== true;

  if (bootstrapRevoked) {
    return {
      schema: LIVING_WORLD_DRIFT_SCHEMA_V0,
      verdict: RELEGITIMIZATION_VERDICT_V0.QUARANTINE,
      requiresReElection: false,
      checkpointDrift,
      worldChanged,
      statement: "Living world lost bootstrap permission."
    };
  }

  if (worldChanged || nodeChanged) {
    return {
      schema: LIVING_WORLD_DRIFT_SCHEMA_V0,
      verdict: RELEGITIMIZATION_VERDICT_V0.RE_ELECTION_REQUIRED,
      requiresReElection: true,
      checkpointDrift,
      worldChanged,
      nodeChanged,
      statement: "Living world identity shifted — re-election required."
    };
  }

  if (checkpointDrift > policy.maxCheckpointDriftTicks) {
    return {
      schema: LIVING_WORLD_DRIFT_SCHEMA_V0,
      verdict: RELEGITIMIZATION_VERDICT_V0.DRIFT_DETECTED,
      requiresReElection: true,
      checkpointDrift,
      statement: "Checkpoint drift exceeded — re-legitimize living world."
    };
  }

  if (age > policy.maxLegitimizationAgeMs) {
    return {
      schema: LIVING_WORLD_DRIFT_SCHEMA_V0,
      verdict: RELEGITIMIZATION_VERDICT_V0.DRIFT_DETECTED,
      requiresReElection: true,
      legitimacyAgeMs: age,
      statement: "Legitimacy window expired — periodic re-legitimization."
    };
  }

  return {
    schema: LIVING_WORLD_DRIFT_SCHEMA_V0,
    verdict: RELEGITIMIZATION_VERDICT_V0.STILL_LEGITIMATE,
    requiresReElection: false,
    checkpointDrift,
    legitimacyAgeMs: age,
    statement: "Living world still epistemically legitimate."
  };
}

/**
 * Full re-legitimization pass: pipeline → drift → seal → hydrate gate.
 *
 * @param {Parameters<typeof runTemporalExecutionPipelineV0>[0] & {
 *   diskKey?: string,
 *   persist?: boolean,
 *   policy?: Partial<typeof DEFAULT_RELEGITIMIZATION_POLICY_V0>
 * }} input
 */
export async function runLivingWorldLegitimizationV0(input) {
  const diskKey = resolveSubstrateContinuityDiskKeyV0(
    input.diskKey || input.localContract?.diskKey
  );
  const nowMs = Number(input.nowMs) || Date.now();

  let persisted = null;
  let db = null;
  if (typeof indexedDB !== "undefined") {
    db = await openSubstrateContinuityIdbV0();
    persisted = await readLivingWorldBootstrapV0(db, diskKey);
  }

  const pipeline = runTemporalExecutionPipelineV0(input);
  const freshBootstrap = normalizeBootstrapForSealV0(
    pipeline.livingWorldBootstrap,
    pipeline.activeContract,
    diskKey
  );

  const drift = assessLivingWorldDriftV0(persisted, freshBootstrap, {
    nowMs,
    policy: input.policy
  });

  const revokeDecision = shouldRevokeLivingWorldBootstrapV0({ drift, pipeline });
  let revoke = null;
  if (revokeDecision.revoke) {
    revoke = await revokeLivingWorldBootstrapV0(db, diskKey, revokeDecision.reason);
    persisted = null;
  }

  let refixation = null;
  if (drift.requiresReElection) {
    refixation = invalidateTemporalAuthorityFixationV0(diskKey, drift.verdict);
  }

  let seal = null;
  const auditStale =
    pipeline.auditIntegrity?.verdict === AUDIT_INTEGRITY_VERDICT_V0.STALE_AUDIT_INTERPRETATION ||
    pipeline.audit?.verdict === FIXATION_AUDIT_VERDICT_V0.HISTORICAL_ONLY;

  if (
    input.persist !== false &&
    !revokeDecision.revoke &&
    !auditStale &&
    (drift.verdict === RELEGITIMIZATION_VERDICT_V0.STILL_LEGITIMATE ||
      (drift.requiresReElection && freshBootstrap.mayBootstrapRuntime))
  ) {
    seal = await sealPipelineLivingWorldV0(pipeline, db ?? undefined);
  }

  const gate = enforceHydrateGateV0(
    drift.verdict === RELEGITIMIZATION_VERDICT_V0.QUARANTINE ? null : freshBootstrap
  );

  db?.close();

  return {
    schema: LIVING_WORLD_DRIFT_SCHEMA_V0,
    pipeline,
    persisted,
    freshBootstrap,
    drift,
    refixation,
    revoke,
    seal,
    hydrateGate: gate,
    bootstrapRevoked: revoke?.ok === true,
    allowExecution:
      !revokeDecision.revoke &&
      gate.allowExecution === true &&
      pipeline.livingWorldBootstrap?.mayBootstrapRuntime === true,
    forceReSelectionOnNextBoot: revoke?.ok === true
  };
}
