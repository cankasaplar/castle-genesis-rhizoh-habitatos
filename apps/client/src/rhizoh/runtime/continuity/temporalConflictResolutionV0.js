/**
 * Temporal Conflict Resolution Policy V0 (Faz 2.5.1)
 *
 * When two nodes share the same checkpoint but different issuance paths:
 * "equal rights" vs "rights conflict" — resolved via authority scoring,
 * witness decay, and checkpoint lineage weighting.
 */

import { EPISTEMIC_PAST_V0 } from "./replayCorruptionTaxonomyV0.js";
import {
  JURISDICTION_VERDICT_V0,
  arbitrateTemporalJurisdictionV0
} from "./temporalIdentityBindingV0.js";

export const TEMPORAL_CONFLICT_RESOLUTION_SCHEMA_V0 =
  "castle.rhizoh.temporal_conflict_resolution.v0";

/** How the time ownership contract was issued (provenance path). */
export const ISSUANCE_PATH_V0 = Object.freeze({
  CANONICAL_BOOT: "canonical_boot",
  REPAIRED_REANCHOR: "repaired_reanchor",
  TRUNCATED_RECOVERY: "truncated_recovery",
  WITNESS_RELAY: "witness_relay",
  UNKNOWN: "unknown"
});

export const TEMPORAL_CONFLICT_VERDICT_V0 = Object.freeze({
  /** Primary jurisdiction arbitration decided (no tie). */
  PRIMARY_JURISDICTION: "primary_jurisdiction",
  /** Same checkpoint + path class — shared observation, single-executor policy TBD. */
  SHARED_JURISDICTION_EQUAL_RIGHTS: "shared_jurisdiction_equal_rights",
  /** Same checkpoint, different paths — explicit conflict. */
  TEMPORAL_CONFLICT: "temporal_conflict",
  LOCAL_WINS_AUTHORITY: "local_wins_authority",
  REMOTE_WINS_AUTHORITY: "remote_wins_authority"
});

/** Lineage authority multiplier by issuance path (deterministic). */
const ISSUANCE_PATH_WEIGHT_V0 = Object.freeze({
  [ISSUANCE_PATH_V0.CANONICAL_BOOT]: 1.0,
  [ISSUANCE_PATH_V0.REPAIRED_REANCHOR]: 0.92,
  [ISSUANCE_PATH_V0.TRUNCATED_RECOVERY]: 0.85,
  [ISSUANCE_PATH_V0.WITNESS_RELAY]: 0.72,
  [ISSUANCE_PATH_V0.UNKNOWN]: 0.5
});

/** Default witness half-life (7 days). */
export const DEFAULT_WITNESS_DECAY_HALF_LIFE_MS_V0 = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {string} epistemicPast
 */
export function mapEpistemicPastToIssuancePathV0(epistemicPast) {
  switch (epistemicPast) {
    case EPISTEMIC_PAST_V0.CANONICAL_CHAIN:
      return ISSUANCE_PATH_V0.CANONICAL_BOOT;
    case EPISTEMIC_PAST_V0.REPAIRED_CHAIN:
      return ISSUANCE_PATH_V0.REPAIRED_REANCHOR;
    case EPISTEMIC_PAST_V0.TRUNCATED_TAIL:
      return ISSUANCE_PATH_V0.TRUNCATED_RECOVERY;
    default:
      return ISSUANCE_PATH_V0.UNKNOWN;
  }
}

/**
 * Exponential witness decay — stale passports lose authority.
 *
 * @param {number} issuedAtMs
 * @param {number} [nowMs]
 * @param {number} [halfLifeMs]
 */
export function computeWitnessDecayV0(issuedAtMs, nowMs, halfLifeMs = DEFAULT_WITNESS_DECAY_HALF_LIFE_MS_V0) {
  const issued = Number(issuedAtMs) || 0;
  const now = Number(nowMs) || Date.now();
  const half = Math.max(1, Number(halfLifeMs) || DEFAULT_WITNESS_DECAY_HALF_LIFE_MS_V0);
  const age = Math.max(0, now - issued);
  const factor = 0.5 ** (age / half);
  return {
    factor: Math.max(0, Math.min(1, factor)),
    ageMs: age,
    halfLifeMs: half
  };
}

/**
 * Checkpoint lineage weight — deeper unbroken lineage scores higher.
 *
 * @param {{
 *   trustedCheckpointTick?: number,
 *   parentCheckpointTick?: number,
 *   lineageDepth?: number
 * }} lineage
 */
export function computeLineageWeightV0(lineage) {
  const tick = Math.max(0, Number(lineage.trustedCheckpointTick) || 0);
  const parent = Number(lineage.parentCheckpointTick);
  const depth = Math.max(0, Math.floor(Number(lineage.lineageDepth) || 0));
  const continuity =
    Number.isFinite(parent) && parent >= 0 && tick > parent ? 1 + Math.min(32, tick - parent) / 1000 : 1;
  const depthBoost = 1 + Math.min(16, depth) * 0.04;
  return {
    weight: continuity * depthBoost,
    continuity,
    depthBoost
  };
}

/**
 * Full temporal authority score for conflict resolution.
 *
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0 & {
 *   issuancePath?: string,
 *   parentCheckpointTick?: number,
 *   lineageDepth?: number,
 *   witnessStrength?: number
 * }} contract
 * @param {{ nowMs?: number, witnessHalfLifeMs?: number }} [opts]
 */
export function computeTemporalAuthorityScoreV0(contract, opts = {}) {
  const nowMs = Number(opts.nowMs) || Date.now();
  const path =
    contract.issuancePath || mapEpistemicPastToIssuancePathV0(contract.epistemicPast);
  const pathWeight = ISSUANCE_PATH_WEIGHT_V0[path] ?? ISSUANCE_PATH_WEIGHT_V0[ISSUANCE_PATH_V0.UNKNOWN];
  const decay = computeWitnessDecayV0(contract.issuedAtMs, nowMs, opts.witnessHalfLifeMs);
  const witnessStrength = Math.max(0, Math.min(1, Number(contract.witnessStrength) || 1));
  const lineage = computeLineageWeightV0({
    trustedCheckpointTick: contract.trustedCheckpointTick,
    parentCheckpointTick: contract.parentCheckpointTick,
    lineageDepth: contract.lineageDepth
  });

  const checkpointCore =
    (Number(contract.trustedCheckpointTick) || 0) * 1_000_000 +
    (Number(contract.trustedThroughTick) || 0) * 1_000;

  const score = Math.floor(
    checkpointCore * pathWeight * decay.factor * lineage.weight * witnessStrength
  );

  return {
    score,
    checkpointCore,
    path,
    pathWeight,
    witnessDecay: decay.factor,
    witnessStrength,
    lineageWeight: lineage.weight,
    components: { pathWeight, decay: decay.factor, lineage: lineage.weight, witnessStrength }
  };
}

/**
 * Resolve tie / equal-checkpoint conflict — Faz 2.5.1 policy.
 *
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} local
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} remote
 * @param {{ nowMs?: number, witnessHalfLifeMs?: number }} [opts]
 */
export function resolveTemporalConflictV0(local, remote, opts = {}) {
  const primary = arbitrateTemporalJurisdictionV0(local, remote);
  if (primary.verdict !== JURISDICTION_VERDICT_V0.DIVERGENT_JURISDICTION) {
    return {
      schema: TEMPORAL_CONFLICT_RESOLUTION_SCHEMA_V0,
      resolution: TEMPORAL_CONFLICT_VERDICT_V0.PRIMARY_JURISDICTION,
      primary,
      question: "resolved_by_checkpoint_precedence"
    };
  }

  const sameCheckpoint =
    Number(local.trustedCheckpointTick) === Number(remote.trustedCheckpointTick);
  if (!sameCheckpoint) {
    return {
      schema: TEMPORAL_CONFLICT_RESOLUTION_SCHEMA_V0,
      resolution: TEMPORAL_CONFLICT_VERDICT_V0.TEMPORAL_CONFLICT,
      primary,
      question: "hak_çatışması",
      statement: "Divergent checkpoint with equal composite score — conflict."
    };
  }

  const lPath = local.issuancePath || mapEpistemicPastToIssuancePathV0(local.epistemicPast);
  const rPath = remote.issuancePath || mapEpistemicPastToIssuancePathV0(remote.epistemicPast);
  const lAuth = computeTemporalAuthorityScoreV0(local, opts);
  const rAuth = computeTemporalAuthorityScoreV0(remote, opts);

  return classifyEqualCheckpointConflictV0({
    primary,
    lPath,
    rPath,
    lAuth,
    rAuth
  });
}

/**
 * Same-checkpoint branch — hak eşitliği vs hak çatışması.
 *
 * @param {{
 *   primary: object,
 *   lPath: string,
 *   rPath: string,
 *   lAuth: { score: number },
 *   rAuth: { score: number }
 * }} input
 */
export function classifyEqualCheckpointConflictV0(input) {
  const { primary, lPath, rPath, lAuth, rAuth } = input;

  if (lAuth.score > rAuth.score) {
    return {
      schema: TEMPORAL_CONFLICT_RESOLUTION_SCHEMA_V0,
      resolution: TEMPORAL_CONFLICT_VERDICT_V0.LOCAL_WINS_AUTHORITY,
      primary,
      question: "hak_çatışması",
      winner: "local",
      localAuthority: lAuth,
      remoteAuthority: rAuth,
      localPath: lPath,
      remotePath: rPath,
      statement: "Same checkpoint; local wins by authority score (lineage × witness × path)."
    };
  }
  if (rAuth.score > lAuth.score) {
    return {
      schema: TEMPORAL_CONFLICT_RESOLUTION_SCHEMA_V0,
      resolution: TEMPORAL_CONFLICT_VERDICT_V0.REMOTE_WINS_AUTHORITY,
      primary,
      question: "hak_çatışması",
      winner: "remote",
      localAuthority: lAuth,
      remoteAuthority: rAuth,
      localPath: lPath,
      remotePath: rPath,
      statement: "Same checkpoint; remote wins by authority score (lineage × witness × path)."
    };
  }

  if (lPath === rPath) {
    return {
      schema: TEMPORAL_CONFLICT_RESOLUTION_SCHEMA_V0,
      resolution: TEMPORAL_CONFLICT_VERDICT_V0.SHARED_JURISDICTION_EQUAL_RIGHTS,
      primary,
      question: "hak_eşitliği",
      localAuthority: lAuth,
      remoteAuthority: rAuth,
      issuancePath: lPath,
      statement:
        "Same checkpoint and issuance path with equal authority — shared jurisdiction (single-executor policy required)."
    };
  }

  return {
    schema: TEMPORAL_CONFLICT_RESOLUTION_SCHEMA_V0,
    resolution: TEMPORAL_CONFLICT_VERDICT_V0.TEMPORAL_CONFLICT,
    primary,
    question: "hak_çatışması",
    localAuthority: lAuth,
    remoteAuthority: rAuth,
    localPath: lPath,
    remotePath: rPath,
    statement:
      "Same checkpoint, different issuance paths, equal authority — unresolved temporal conflict."
  };
}

/**
 * Enriched contract fields for conflict policy.
 *
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0} base
 * @param {{
 *   issuancePath?: string,
 *   parentCheckpointTick?: number,
 *   lineageDepth?: number,
 *   witnessStrength?: number
 * }} [extra]
 */
export function enrichTimeOwnershipContractV0(base, extra = {}) {
  return {
    ...base,
    issuancePath: extra.issuancePath || mapEpistemicPastToIssuancePathV0(base.epistemicPast),
    parentCheckpointTick:
      extra.parentCheckpointTick !== undefined
        ? Number(extra.parentCheckpointTick)
        : Math.max(0, Number(base.trustedCheckpointTick) - 1),
    lineageDepth: Number(extra.lineageDepth) || 0,
    witnessStrength: Number(extra.witnessStrength) || 1
  };
}
