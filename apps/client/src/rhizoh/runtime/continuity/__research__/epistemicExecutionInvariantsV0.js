/**
 * RESEARCH-ONLY: Phase 9 explicit guards — execution single-axis, interpretation multi-axis.
 *
 * Prevents natural drift: coherence preservation → conflict normalization (accept everything, resolve nothing).
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §10
 */

export const EPISTEMIC_EXECUTION_INVARIANTS_SCHEMA_V0 =
  "castle.rhizoh.epistemic_execution_invariants.research.v0";

/**
 * Controlled multiplicity: plural epistemic readings, ONE execution authority axis.
 * @readonly
 */
export const EXECUTION_CONVERGENCE_INVARIANT_V0 = Object.freeze({
  statement:
    "Execution convergence must remain single-axis; interpretation may remain multi-axis.",
  maxInterpretationBranchesWithoutExecutor: 3
});

/**
 * Drift codes when conflict-preserving layer becomes conflict-normalizing.
 * @readonly
 */
export const CONFLICT_NORMALIZATION_DRIFT_V0 = Object.freeze({
  NONE: "none",
  BRANCH_PROLIFERATION: "branch_proliferation",
  EXECUTOR_AMBIGUITY: "executor_ambiguity",
  TRUTH_COLLAPSE_ATTEMPT: "truth_collapse_attempt"
});

/**
 * @param {{
 *   networkExecutorNodeId?: string | null,
 *   interpretationBranchCount?: number,
 *   truthCollapsed?: boolean,
 *   stable?: boolean
 * }} input
 */
export function assertExecutionConvergenceGuardV0(input) {
  const executor = input.networkExecutorNodeId ?? null;
  const branches = Math.max(0, Number(input.interpretationBranchCount) || 0);
  const maxBranches = EXECUTION_CONVERGENCE_INVARIANT_V0.maxInterpretationBranchesWithoutExecutor;

  if (input.truthCollapsed === true) {
    return {
      schema: EPISTEMIC_EXECUTION_INVARIANTS_SCHEMA_V0,
      ok: false,
      drift: CONFLICT_NORMALIZATION_DRIFT_V0.TRUTH_COLLAPSE_ATTEMPT,
      executionAxisUnified: false,
      interpretationPluralismAllowed: false,
      statement: "Truth collapse violates controlled multiplicity invariant."
    };
  }

  if (!executor && input.stable === true && branches > 0) {
    return {
      schema: EPISTEMIC_EXECUTION_INVARIANTS_SCHEMA_V0,
      ok: false,
      drift: CONFLICT_NORMALIZATION_DRIFT_V0.EXECUTOR_AMBIGUITY,
      executionAxisUnified: false,
      interpretationPluralismAllowed: true,
      statement: "Stable plural interpretations without single execution axis — fork bomb risk."
    };
  }

  if (branches > maxBranches) {
    return {
      schema: EPISTEMIC_EXECUTION_INVARIANTS_SCHEMA_V0,
      ok: false,
      drift: CONFLICT_NORMALIZATION_DRIFT_V0.BRANCH_PROLIFERATION,
      executionAxisUnified: Boolean(executor),
      interpretationPluralismAllowed: true,
      statement: `Interpretation branches (${branches}) exceed guard — conflict normalization drift.`
    };
  }

  return {
    schema: EPISTEMIC_EXECUTION_INVARIANTS_SCHEMA_V0,
    ok: true,
    drift: CONFLICT_NORMALIZATION_DRIFT_V0.NONE,
    executionAxisUnified: executor != null || branches === 0,
    interpretationPluralismAllowed: branches > 1,
    statement: "Execution single-axis preserved; interpretation may remain plural."
  };
}

/**
 * Whether multiple epistemic realities may coexist in interpretation without merging.
 * Does NOT grant multiple execution authorities.
 *
 * @param {import('./crossNodeIdentityReconciliationV0.js').COHERENT_DISAGREEMENT_MODE_V0[keyof typeof import('./crossNodeIdentityReconciliationV0.js').COHERENT_DISAGREEMENT_MODE_V0]} stabilizationMode
 * @param {boolean} stable
 */
export function deriveAllowConcurrentExecutionV0(stabilizationMode, stable) {
  if (!stable) {
    return {
      allowConcurrentExecution: false,
      reason: "Unstable disagreement field — no concurrent epistemic runtime."
    };
  }
  if (stabilizationMode === "recommend_quarantine") {
    return {
      allowConcurrentExecution: false,
      reason: "Quarantine recommendation — interpretations not concurrently licensed."
    };
  }
  return {
    allowConcurrentExecution: true,
    reason:
      "Execution unified (single-axis); interpretation pluralized — controlled multiplicity runtime."
  };
}
