/**
 * Cohort release snapshot — export observability + replay artifacts for freeze/audit.
 */

import { readCastleLatencyViolationsV0 } from "./rhizohCastleLatencyBudgetV0.js";
import { CASTLE_EXECUTION_INVARIANT_V0 } from "./castleExecutionInvariantV0.js";
import { CASTLE_COMMAND_INVARIANT_V0 } from "./castleCommandInvariantV0.js";
import { CASTLE_LANGUAGE_INVARIANT_V0 } from "./rhizohLanguageInvariantV0.js";
import { listExecutionReplayTapesV0 } from "./rhizohExecutionGraphReplayEngineV0.js";
import { runHybridLeakageAttackSuiteV0 } from "./rhizohHybridLeakageAttackSuiteV0.js";
import { readCommandStateMachineV0 } from "./rhizohCommandStateMachineV0.js";

export const COHORT_RUNTIME_SNAPSHOT_SCHEMA_V0 = "castle.cohort_runtime_snapshot.v0";

/**
 * @param {{ maxReplayTapes?: number, runAttackSuite?: boolean }} [opts]
 */
export function exportCohortRuntimeSnapshotV0(opts = {}) {
  const maxTapes = Math.max(1, Number(opts.maxReplayTapes) || 20);
  const attackReport =
    opts.runAttackSuite === false ? null : runHybridLeakageAttackSuiteV0();

  const graphBundle =
    typeof window !== "undefined" ? window.__CASTLE_COMMAND_EXECUTION_GRAPH__ : null;
  const replayTapes = listExecutionReplayTapesV0().slice(-maxTapes);
  const traceIds = replayTapes.map((t) => t.traceId).filter(Boolean);

  const snapshot = Object.freeze({
    schema: COHORT_RUNTIME_SNAPSHOT_SCHEMA_V0,
    exportedAtMs: Date.now(),
    core: Object.freeze({
      commandExecutionGraph: graphBundle,
      languageLastCommit:
        typeof window !== "undefined" ? window.__CASTLE_LANGUAGE_LAST_COMMIT__ || null : null,
      commandState: readCommandStateMachineV0(),
      languageInvariant:
        typeof window !== "undefined" ? window.__CASTLE_LANGUAGE_INVARIANT__ || null : null,
      languageRuntime:
        typeof window !== "undefined"
          ? window.__CASTLE_LANGUAGE_RUNTIME__ || window.__RHIZOH_LANGUAGE_RUNTIME__ || null
          : null
    }),
    stability: Object.freeze({
      latencyViolations: readCastleLatencyViolationsV0(),
      languageViolations:
        typeof window !== "undefined" ? window.__RHIZOH_LANGUAGE_VIOLATIONS__ || [] : [],
      hybridLeakageAttackReport:
        attackReport ||
        (typeof window !== "undefined" ? window.__CASTLE_HYBRID_LEAKAGE_ATTACK_REPORT__ : null),
      executionInvariant: CASTLE_EXECUTION_INVARIANT_V0,
      commandInvariant: CASTLE_COMMAND_INVARIANT_V0,
      languageInvariantContract: CASTLE_LANGUAGE_INVARIANT_V0
    }),
    replay: Object.freeze({
      tapes: replayTapes,
      lastReplay: typeof window !== "undefined" ? window.__CASTLE_EXECUTION_REPLAY_LAST__ || null : null,
      traceIds: Object.freeze(traceIds)
    })
  });

  if (typeof window !== "undefined") {
    window.__CASTLE_COHORT_RUNTIME_SNAPSHOT__ = snapshot;
  }
  return snapshot;
}

/**
 * JSON string for file export / cohort handoff.
 * @param {{ maxReplayTapes?: number, runAttackSuite?: boolean }} [opts]
 */
export function exportCohortRuntimeSnapshotJsonV0(opts = {}) {
  const snap = exportCohortRuntimeSnapshotV0(opts);
  return JSON.stringify(snap, null, 2);
}
