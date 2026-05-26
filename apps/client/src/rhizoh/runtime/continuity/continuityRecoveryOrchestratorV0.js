/**
 * Continuity Recovery Orchestrator V0 — epistemic policy / temporal legitimacy layer.
 *
 * Stack:
 * - Boot guard → reality validity
 * - Repair kernel → structural fixability
 * - Orchestrator → epistemic legitimacy ("which past is safe for execution?")
 *
 * Past is an authority object, not raw data. `mayRehydrate` is permission, not state.
 *
 * Flow: boot guard → repair vs reject (+ eligibility) → re-validate → rehydrate gate
 */

import { resolveSubstrateContinuityBootGuardV0 } from "./continuityBootGuardV0.js";
import {
  SUBSTRATE_BOOT_PHASE_V0,
  REPLAY_CORRUPTION_BREACH_V0,
  BREACH_TO_AXIS_V0,
  EPISTEMIC_PAST_V0,
  REHYDRATE_GATE_V0
} from "./replayCorruptionTaxonomyV0.js";

export { EPISTEMIC_PAST_V0, REHYDRATE_GATE_V0 };
import {
  runReplayRepairKernelV0,
  REPAIR_OUTCOME_V0,
  scanWalChainCorruptionV0,
  computeRollbackTargetTickV0,
  DEFAULT_REPLAY_ROLLBACK_WINDOW_TICKS_V0
} from "./replayRepairKernelV0.js";

export const CONTINUITY_RECOVERY_ORCHESTRATOR_SCHEMA_V0 =
  "castle.rhizoh.continuity_recovery_orchestrator.v0";

export const RECOVERY_ACTION_V0 = Object.freeze({
  ACCEPT: "accept",
  REPAIR: "repair",
  REJECT: "reject"
});

/**
 * Repair Eligibility Rule — anti "repair bias drift" / false continuity healing.
 * Repair only when replay window does not dive below last trusted checkpoint.
 *
 * @param {number} replayFromTick
 * @param {number} lastTrustedCheckpoint
 */
export function assertRepairEligibilityV0(replayFromTick, lastTrustedCheckpoint) {
  const replay = Number(replayFromTick);
  const checkpoint = Number(lastTrustedCheckpoint);
  if (!Number.isFinite(checkpoint) || checkpoint < 0) {
    return { ok: false, code: "no_trusted_checkpoint" };
  }
  if (!Number.isFinite(replay) || replay < checkpoint) {
    return {
      ok: false,
      code: "repair_before_checkpoint",
      replayFromTick: replay,
      lastTrustedCheckpoint: checkpoint
    };
  }
  return { ok: true };
}

/**
 * @param {import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null} cursor
 * @param {Awaited<ReturnType<typeof scanWalChainCorruptionV0>> | null} scan
 * @param {{ phase?: string }} bootBefore
 * @param {number} [explicitCheckpoint]
 */
export function resolveLastTrustedCheckpointTickV0(cursor, scan, bootBefore, explicitCheckpoint) {
  if (Number.isFinite(explicitCheckpoint) && explicitCheckpoint >= 0) {
    return Number(explicitCheckpoint);
  }
  const fromCursor = Number(
    /** @type {{ trustedCheckpointTick?: number }} */ (cursor)?.trustedCheckpointTick
  );
  if (Number.isFinite(fromCursor) && fromCursor >= 0) return fromCursor;
  if (bootBefore?.phase === SUBSTRATE_BOOT_PHASE_V0.RUN) {
    return Number(cursor?.lastTick) >= 0 ? Number(cursor.lastTick) : 0;
  }
  if (scan && scan.lastKnownGoodTick >= 0) return scan.lastKnownGoodTick;
  return -1;
}

/**
 * Deterministic repair vs reject — breach class + fixability (eligibility applied later).
 *
 * @param {string | null} breach
 * @param {{ reanchorable?: boolean } | null} corruption
 * @param {{ lastKnownGoodTick?: number }} [scanHint]
 */
export function selectRepairVsRejectV0(breach, corruption, scanHint = {}) {
  if (!breach) {
    return { action: RECOVERY_ACTION_V0.ACCEPT, reason: "no_breach" };
  }

  if (
    scanHint.lastKnownGoodTick !== undefined &&
    Number(scanHint.lastKnownGoodTick) < 0
  ) {
    return { action: RECOVERY_ACTION_V0.REJECT, reason: "no_known_good_segment" };
  }

  switch (breach) {
    case REPLAY_CORRUPTION_BREACH_V0.HASH_CHAIN_MUTATION:
      return corruption?.reanchorable
        ? { action: RECOVERY_ACTION_V0.REPAIR, reason: "hash_reanchor_eligible" }
        : { action: RECOVERY_ACTION_V0.REPAIR, reason: "lkg_truncation_only" };
    case REPLAY_CORRUPTION_BREACH_V0.PARTIAL_WRITE:
    case REPLAY_CORRUPTION_BREACH_V0.OUT_OF_ORDER_REPLAY:
      return { action: RECOVERY_ACTION_V0.REPAIR, reason: "integrity_rollback" };
    case REPLAY_CORRUPTION_BREACH_V0.DUPLICATE_APPEND:
      return { action: RECOVERY_ACTION_V0.ACCEPT, reason: "idempotent_no_repair" };
    case REPLAY_CORRUPTION_BREACH_V0.STALE_REPLAY:
    case REPLAY_CORRUPTION_BREACH_V0.EPOCH_REGRESSION:
    case REPLAY_CORRUPTION_BREACH_V0.PROFILE_SWITCH:
      return { action: RECOVERY_ACTION_V0.REJECT, reason: "epistemic_boundary_violation" };
    default:
      return { action: RECOVERY_ACTION_V0.REJECT, reason: "unknown_breach" };
  }
}

/**
 * @param {ReturnType<typeof selectRepairVsRejectV0>} decision
 * @param {number} lastKnownGoodTick
 * @param {number} rollbackWindowTicks
 * @param {number} lastTrustedCheckpoint
 */
export function gateRepairWithEligibilityV0(
  decision,
  lastKnownGoodTick,
  rollbackWindowTicks,
  lastTrustedCheckpoint
) {
  if (decision.action !== RECOVERY_ACTION_V0.REPAIR) {
    return { decision, eligibility: { ok: true, skipped: true } };
  }
  const replayFromTick = computeRollbackTargetTickV0(lastKnownGoodTick, rollbackWindowTicks);
  const eligibility = assertRepairEligibilityV0(replayFromTick, lastTrustedCheckpoint);
  if (!eligibility.ok) {
    return {
      decision: {
        action: RECOVERY_ACTION_V0.REJECT,
        reason: "repair_eligibility_denied",
        prior: decision.reason,
        code: eligibility.code
      },
      eligibility,
      replayFromTick
    };
  }
  return { decision, eligibility, replayFromTick };
}

/**
 * Which past is execution-safe? (epistemic authority — not raw event log).
 *
 * @param {{
 *   bootPhase: string,
 *   repairOutcome?: string | null,
 *   lastKnownGoodTick?: number,
 *   rollbackTargetTick?: number,
 *   corruptionTick?: number | null,
 *   cursorTick?: number | null
 * }} ctx
 */
export function resolveEpistemicPastV0(ctx) {
  const lkg = Number(ctx.lastKnownGoodTick);
  const rollback = Number(ctx.rollbackTargetTick);
  const corrupt = ctx.corruptionTick != null ? Number(ctx.corruptionTick) : null;

  if (ctx.bootPhase === SUBSTRATE_BOOT_PHASE_V0.RUN && !ctx.repairOutcome) {
    return {
      past: EPISTEMIC_PAST_V0.CANONICAL_CHAIN,
      trustedThroughTick: ctx.cursorTick ?? lkg,
      replayFromTick: rollback >= 0 ? rollback : 0,
      rejectedFromTick: null,
      statement: "Execution may trust the validated append chain as timeline authority."
    };
  }

  if (
    ctx.repairOutcome === REPAIR_OUTCOME_V0.HASH_REANCHOR ||
    ctx.repairOutcome === REPAIR_OUTCOME_V0.NOT_NEEDED
  ) {
    return {
      past: EPISTEMIC_PAST_V0.REPAIRED_CHAIN,
      trustedThroughTick: ctx.cursorTick ?? lkg,
      replayFromTick: rollback >= 0 ? rollback : Math.max(0, lkg),
      rejectedFromTick: corrupt,
      statement: "Execution may trust re-anchored tail after structural hash repair."
    };
  }

  if (
    ctx.repairOutcome === REPAIR_OUTCOME_V0.CURSOR_FALLBACK ||
    ctx.repairOutcome === REPAIR_OUTCOME_V0.ROLLBACK_WINDOW
  ) {
    return {
      past: EPISTEMIC_PAST_V0.TRUNCATED_TAIL,
      trustedThroughTick: lkg,
      replayFromTick: rollback >= 0 ? rollback : Math.max(0, lkg - DEFAULT_REPLAY_ROLLBACK_WINDOW_TICKS_V0),
      rejectedFromTick: corrupt ?? lkg + 1,
      statement: "Execution limited to truncated timeline; poisoned tail lacks authority."
    };
  }

  return {
    past: EPISTEMIC_PAST_V0.NO_TRUSTED_PAST,
    trustedThroughTick: -1,
    replayFromTick: -1,
    rejectedFromTick: corrupt,
    statement: "No execution-safe past; execution permission withheld (mayRehydrate closed)."
  };
}

/**
 * @param {{
 *   diskKey: string,
 *   readReplayCursor: () => Promise<import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null>,
 *   getWalSegment: (tick: number) => Promise<import('../substrateContinuityIdbV0.js').WalSegmentRecordV0 | null>,
 *   putWalSegment?: (segment: import('../substrateContinuityIdbV0.js').WalSegmentRecordV0) => Promise<{ ok: boolean }>,
 *   writeReplayCursor?: (cursor: import('../substrateContinuityIdbV0.js').ReplayCursorRecordV0) => Promise<{ ok: boolean }>
 * }} ports
 * @param {{
 *   applyRepair?: boolean,
 *   rollbackWindowTicks?: number,
 *   minEpoch?: number,
 *   lastTrustedCheckpoint?: number,
 *   rollbackWindowTicks?: number
 * }} [opts]
 */
import {
  bindTemporalIdentityFromRecoveryV0,
  buildTemporalIdentitySnapshotV0
} from "./temporalIdentityBindingV0.js";

export async function runContinuityRecoveryOrchestratorV0(ports, opts = {}) {
  const applyRepair = opts.applyRepair === true;
  const rollbackWindowTicks =
    Number(opts.rollbackWindowTicks) >= 0
      ? Number(opts.rollbackWindowTicks)
      : DEFAULT_REPLAY_ROLLBACK_WINDOW_TICKS_V0;

  const bootBefore = await resolveSubstrateContinuityBootGuardV0({
    diskKey: ports.diskKey,
    readReplayCursor: ports.readReplayCursor,
    getWalSegment: ports.getWalSegment,
    minEpoch: opts.minEpoch
  });

  const cursor = await ports.readReplayCursor();
  const headTick = cursor != null ? Number(cursor.lastTick) : -1;
  const scan =
    headTick >= 0
      ? await scanWalChainCorruptionV0({
          diskKey: ports.diskKey,
          headTick,
          getWalSegment: ports.getWalSegment
        })
      : null;

  const lastTrustedCheckpoint = resolveLastTrustedCheckpointTickV0(
    cursor,
    scan,
    bootBefore,
    opts.lastTrustedCheckpoint
  );

  /** @type {ReturnType<typeof selectRepairVsRejectV0>} */
  let decision = { action: RECOVERY_ACTION_V0.ACCEPT, reason: "chain_valid" };
  /** @type {Awaited<ReturnType<typeof runReplayRepairKernelV0>> | null} */
  let repair = null;
  /** @type {ReturnType<typeof assertRepairEligibilityV0> | { ok: true, skipped?: boolean }} */
  let repairEligibility = { ok: true, skipped: true };

  if (bootBefore.phase === SUBSTRATE_BOOT_PHASE_V0.QUARANTINE_ISOLATION) {
    decision = selectRepairVsRejectV0(
      bootBefore.reason ?? bootBefore.breach ?? null,
      scan?.firstCorruption ?? null,
      { lastKnownGoodTick: scan?.lastKnownGoodTick }
    );

    const gated = gateRepairWithEligibilityV0(
      decision,
      scan?.lastKnownGoodTick ?? -1,
      rollbackWindowTicks,
      lastTrustedCheckpoint
    );
    decision = gated.decision;
    repairEligibility = gated.eligibility;

    if (decision.action === RECOVERY_ACTION_V0.REPAIR && applyRepair) {
      repair = await runReplayRepairKernelV0(ports, {
        apply: true,
        rollbackWindowTicks,
        allowHashReanchor: true
      });
      if (repair.ok === false || repair.outcome === REPAIR_OUTCOME_V0.FAILED) {
        decision = { action: RECOVERY_ACTION_V0.REJECT, reason: "repair_failed" };
      }
    } else if (decision.action === RECOVERY_ACTION_V0.REPAIR && !applyRepair) {
      repair = await runReplayRepairKernelV0(ports, {
        apply: false,
        rollbackWindowTicks,
        allowHashReanchor: true
      });
    }
  }

  const executionPermission =
    bootBefore.phase === SUBSTRATE_BOOT_PHASE_V0.RUN
      ? { granted: true, basis: "canonical_validity" }
      : decision.action === RECOVERY_ACTION_V0.REJECT
        ? { granted: false, basis: decision.reason }
        : { granted: null, basis: "pending_revalidate" };

  const bootAfter =
    decision.action === RECOVERY_ACTION_V0.REJECT
      ? bootBefore
      : await resolveSubstrateContinuityBootGuardV0({
          diskKey: ports.diskKey,
          readReplayCursor: ports.readReplayCursor,
          getWalSegment: ports.getWalSegment,
          minEpoch: opts.minEpoch
        });

  const phaseAfter = bootAfter.phase;
  const rehydrateGate =
    phaseAfter === SUBSTRATE_BOOT_PHASE_V0.RUN
      ? REHYDRATE_GATE_V0.OPEN
      : REHYDRATE_GATE_V0.CLOSED;

  const epistemic = resolveEpistemicPastV0({
    bootPhase: phaseAfter,
    repairOutcome: repair?.outcome ?? null,
    lastKnownGoodTick: repair?.lastKnownGoodTick ?? scan?.lastKnownGoodTick,
    rollbackTargetTick: repair?.rollbackTargetTick,
    corruptionTick: scan?.firstCorruption?.tick ?? null,
    cursorTick: repair?.cursorAfter?.lastTick ?? cursor?.lastTick
  });

  const suggestedCheckpointTick =
    phaseAfter === SUBSTRATE_BOOT_PHASE_V0.RUN
      ? Number(repair?.cursorAfter?.lastTick ?? cursor?.lastTick ?? epistemic.trustedThroughTick)
      : lastTrustedCheckpoint;

  const recoveryDraft = {
    schema: CONTINUITY_RECOVERY_ORCHESTRATOR_SCHEMA_V0,
    diskKey: ports.diskKey,
    decision,
    bootBefore,
    bootAfter,
    repair,
    scan,
    epistemic,
    rehydrateGate,
    mayRehydrate: rehydrateGate === REHYDRATE_GATE_V0.OPEN,
    executionPermission,
    lastTrustedCheckpoint,
    repairEligibility,
    suggestedCheckpointTick,
    breach: bootBefore.breach ?? null,
    breachAxis: bootBefore.breach ? BREACH_TO_AXIS_V0[bootBefore.breach] : null
  };

  const timeOwnership = bindTemporalIdentityFromRecoveryV0(recoveryDraft, {
    nodeId: opts.nodeId,
    jurisdictionId: opts.jurisdictionId
  });

  return {
    ...recoveryDraft,
    timeOwnership,
    temporalIdentity: buildTemporalIdentitySnapshotV0(timeOwnership)
  };
}

/**
 * @param {Awaited<ReturnType<typeof runContinuityRecoveryOrchestratorV0>>} result
 */
export function buildContinuityRecoverySnapshotV0(result) {
  return {
    schema: CONTINUITY_RECOVERY_ORCHESTRATOR_SCHEMA_V0,
    ts: Date.now(),
    decision: result.decision,
    rehydrateGate: result.rehydrateGate,
    mayRehydrate: result.mayRehydrate,
    epistemic: result.epistemic,
    breach: result.breach,
    breachAxis: result.breachAxis,
    bootPhase: result.bootAfter?.phase,
    repairOutcome: result.repair?.outcome ?? null,
    lastTrustedCheckpoint: result.lastTrustedCheckpoint,
    repairEligibility: result.repairEligibility,
    executionPermission: result.executionPermission
  };
}
