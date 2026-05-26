/**
 * Temporal Identity Binding V0 — Node Identity = Time Ownership Contract.
 *
 * Jurisdiction stack (not truth stack):
 * - Boot guard → physical validity
 * - Repair kernel → structural fixability
 * - Orchestrator → execution permission (mayRehydrate)
 * - **This layer** → which node may run which past (time ownership)
 *
 * Multi-node: two nodes may hold the same WAL bytes but not the same time right.
 */

import { EPISTEMIC_PAST_V0, REHYDRATE_GATE_V0 } from "./replayCorruptionTaxonomyV0.js";
import { mapEpistemicPastToIssuancePathV0 } from "./temporalConflictResolutionV0.js";

export const TEMPORAL_IDENTITY_BINDING_SCHEMA_V0 = "castle.rhizoh.temporal_identity_binding.v0";

export const TIME_OWNERSHIP_CONTRACT_SCHEMA_V0 = "castle.rhizoh.time_ownership_contract.v0";

export const JURISDICTION_VERDICT_V0 = Object.freeze({
  LOCAL_EXECUTES: "local_executes",
  REMOTE_EXECUTES: "remote_executes",
  DIVERGENT_JURISDICTION: "divergent_jurisdiction",
  NO_EXECUTION_RIGHT: "no_execution_right"
});

/**
 * @typedef {Object} TimeOwnershipContractV0
 * @property {string} schema
 * @property {string} nodeId
 * @property {string} diskKey
 * @property {string} epistemicPast
 * @property {number} trustedCheckpointTick
 * @property {number} trustedThroughTick
 * @property {number} replayFromTick
 * @property {string} jurisdictionId
 * @property {number} issuedAtMs
 * @property {boolean} executionPermitted
 * @property {string} [issuancePath]
 * @property {number} [parentCheckpointTick]
 * @property {number} [lineageDepth]
 * @property {number} [witnessStrength]
 */

/**
 * @param {{
 *   nodeId: string,
 *   diskKey: string,
 *   epistemicPast: string,
 *   trustedCheckpointTick: number,
 *   trustedThroughTick: number,
 *   replayFromTick: number,
 *   jurisdictionId?: string,
 *   executionPermitted?: boolean,
 *   issuedAtMs?: number,
 *   issuancePath?: string,
 *   parentCheckpointTick?: number,
 *   lineageDepth?: number,
 *   witnessStrength?: number
 * }} input
 * @returns {TimeOwnershipContractV0}
 */
export function issueTimeOwnershipContractV0(input) {
  const nodeId = String(input.nodeId || "node:local");
  const diskKey = String(input.diskKey || "");
  return {
    schema: TIME_OWNERSHIP_CONTRACT_SCHEMA_V0,
    nodeId,
    diskKey,
    epistemicPast: String(input.epistemicPast || EPISTEMIC_PAST_V0.NO_TRUSTED_PAST),
    trustedCheckpointTick: Math.max(0, Math.floor(Number(input.trustedCheckpointTick) || 0)),
    trustedThroughTick: Math.max(-1, Math.floor(Number(input.trustedThroughTick) ?? -1)),
    replayFromTick: Math.max(-1, Math.floor(Number(input.replayFromTick) ?? -1)),
    jurisdictionId: String(input.jurisdictionId || diskKey || nodeId),
    issuedAtMs: Number(input.issuedAtMs) || Date.now(),
    executionPermitted: input.executionPermitted !== false,
    issuancePath: input.issuancePath || mapEpistemicPastToIssuancePathV0(String(input.epistemicPast)),
    parentCheckpointTick:
      input.parentCheckpointTick !== undefined
        ? Number(input.parentCheckpointTick)
        : Math.max(0, Math.floor(Number(input.trustedCheckpointTick) || 0) - 1),
    lineageDepth: Math.max(0, Math.floor(Number(input.lineageDepth) || 0)),
    witnessStrength: Math.max(0, Math.min(1, Number(input.witnessStrength) || 1))
  };
}

/**
 * Bind recovery outcome → time ownership contract (epistemic passport anchor).
 *
 * @param {Awaited<import('./continuityRecoveryOrchestratorV0.js').runContinuityRecoveryOrchestratorV0>} recovery
 * @param {{ nodeId?: string, jurisdictionId?: string }} [ctx]
 */
export function bindTemporalIdentityFromRecoveryV0(recovery, ctx = {}) {
  const epistemic = recovery?.epistemic;
  const permitted =
    recovery?.mayRehydrate === true && recovery?.rehydrateGate === REHYDRATE_GATE_V0.OPEN;

  return issueTimeOwnershipContractV0({
    nodeId: ctx.nodeId,
    diskKey: String(recovery?.diskKey || ""),
    jurisdictionId: ctx.jurisdictionId,
    epistemicPast: epistemic?.past ?? EPISTEMIC_PAST_V0.NO_TRUSTED_PAST,
    trustedCheckpointTick: Number(recovery?.suggestedCheckpointTick ?? recovery?.lastTrustedCheckpoint ?? 0),
    trustedThroughTick: Number(epistemic?.trustedThroughTick ?? -1),
    replayFromTick: Number(epistemic?.replayFromTick ?? -1),
    executionPermitted: permitted,
    parentCheckpointTick: Number(recovery?.lastTrustedCheckpoint ?? 0),
    lineageDepth: Number(recovery?.repair?.outcome ? 1 : 0)
  });
}

/**
 * Execution gate at node level — permission token, not boolean state.
 *
 * @param {TimeOwnershipContractV0 | null} contract
 * @param {{ replayFromTick?: number, epistemicPast?: string }} [requested]
 */
export function assertNodeExecutionJurisdictionV0(contract, requested = {}) {
  if (!contract || contract.executionPermitted !== true) {
    return {
      ok: false,
      code: "no_execution_right",
      mayExecute: false,
      basis: "contract_missing_or_denied"
    };
  }

  if (contract.epistemicPast === EPISTEMIC_PAST_V0.NO_TRUSTED_PAST) {
    return {
      ok: false,
      code: "no_trusted_past",
      mayExecute: false,
      basis: "epistemic_past_denied"
    };
  }

  const reqReplay = Number(requested.replayFromTick);
  if (Number.isFinite(reqReplay) && reqReplay < contract.trustedCheckpointTick) {
    return {
      ok: false,
      code: "before_trusted_checkpoint",
      mayExecute: false,
      basis: "replay_before_checkpoint"
    };
  }

  if (requested.epistemicPast && requested.epistemicPast !== contract.epistemicPast) {
    return {
      ok: false,
      code: "epistemic_past_mismatch",
      mayExecute: false,
      basis: "past_mode_conflict"
    };
  }

  return {
    ok: true,
    mayExecute: true,
    basis: "time_ownership_granted",
    contract
  };
}

/**
 * Temporal jurisdiction arbitration — Barcelona vs Istanbul is not "who is newer?"
 * but "who holds execution right on this timeline?"
 *
 * Deterministic tie-break: higher trustedCheckpoint, then trustedThroughTick, then issuedAtMs.
 *
 * @param {TimeOwnershipContractV0} local
 * @param {TimeOwnershipContractV0} remote
 */
export function arbitrateTemporalJurisdictionV0(local, remote) {
  if (!local?.executionPermitted && !remote?.executionPermitted) {
    return {
      verdict: JURISDICTION_VERDICT_V0.NO_EXECUTION_RIGHT,
      winner: null,
      statement: "Neither node holds execution right on this timeline."
    };
  }

  if (local?.diskKey && remote?.diskKey && local.diskKey !== remote.diskKey) {
    return {
      verdict: JURISDICTION_VERDICT_V0.DIVERGENT_JURISDICTION,
      winner: null,
      statement: "Universe boundary mismatch — no shared jurisdiction."
    };
  }

  if (local?.executionPermitted && !remote?.executionPermitted) {
    return {
      verdict: JURISDICTION_VERDICT_V0.LOCAL_EXECUTES,
      winner: "local",
      statement: "Local node holds execution right; remote denied."
    };
  }
  if (remote?.executionPermitted && !local?.executionPermitted) {
    return {
      verdict: JURISDICTION_VERDICT_V0.REMOTE_EXECUTES,
      winner: "remote",
      statement: "Remote node holds execution right; local denied."
    };
  }

  const lScore = jurisdictionScoreV0(local);
  const rScore = jurisdictionScoreV0(remote);
  if (lScore > rScore) {
    return {
      verdict: JURISDICTION_VERDICT_V0.LOCAL_EXECUTES,
      winner: "local",
      statement: "Local node wins temporal jurisdiction by checkpoint precedence."
    };
  }
  if (rScore > lScore) {
    return {
      verdict: JURISDICTION_VERDICT_V0.REMOTE_EXECUTES,
      winner: "remote",
      statement: "Remote node wins temporal jurisdiction by checkpoint precedence."
    };
  }

  return {
    verdict: JURISDICTION_VERDICT_V0.DIVERGENT_JURISDICTION,
    winner: null,
    statement: "Equal jurisdiction scores — explicit merge policy required."
  };
}

/**
 * @param {TimeOwnershipContractV0} c
 */
function jurisdictionScoreV0(c) {
  return (
    (Number(c.trustedCheckpointTick) || 0) * 1_000_000 +
    (Number(c.trustedThroughTick) || 0) * 1_000 +
    (Number(c.issuedAtMs) || 0)
  );
}

/**
 * @param {TimeOwnershipContractV0 | null} contract
 */
export function buildTemporalIdentitySnapshotV0(contract) {
  return {
    schema: TEMPORAL_IDENTITY_BINDING_SCHEMA_V0,
    ts: Date.now(),
    contract: contract ?? null,
    hasTimeOwnership: Boolean(contract?.executionPermitted),
    checkpointAnchor: contract?.trustedCheckpointTick ?? null,
    epistemicPast: contract?.epistemicPast ?? null
  };
}
