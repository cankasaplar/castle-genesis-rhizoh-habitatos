export const RHIZOH_RECOVERY_STATE_MACHINE_VERSION = "v1";

export const RHIZOH_RECOVERY_PHASE = Object.freeze({
  NORMAL: "NORMAL",
  FROZEN: "FROZEN",
  SAFE_MODE: "SAFE_MODE",
  ROLLBACK_READY: "ROLLBACK_READY",
  STAGED_REACTIVATION: "STAGED_REACTIVATION"
});

export const RHIZOH_FREEZE_REASON_CLASS = Object.freeze({
  LOGIC: "logic",
  DATA: "data",
  EXTERNAL_SOLVER: "external_solver",
  UNKNOWN: "unknown"
});

export function classifyRecoveryReasonV1(input) {
  const v = String(input ?? "").toLowerCase();
  if (v.includes("solver")) return RHIZOH_FREEZE_REASON_CLASS.EXTERNAL_SOLVER;
  if (v.includes("data") || v.includes("schema")) return RHIZOH_FREEZE_REASON_CLASS.DATA;
  if (v.includes("logic") || v.includes("divergence") || v.includes("replay")) return RHIZOH_FREEZE_REASON_CLASS.LOGIC;
  return RHIZOH_FREEZE_REASON_CLASS.UNKNOWN;
}

export function createRecoveryStateMachineV1() {
  let snapshot = Object.freeze({
    version: RHIZOH_RECOVERY_STATE_MACHINE_VERSION,
    phase: RHIZOH_RECOVERY_PHASE.NORMAL,
    freezeReasonClass: null,
    freezeReasonText: null,
    lastValidReplayPoint: null,
    stagedAgents: Object.freeze([]),
    updatedAtMs: Date.now()
  });

  function set(next) {
    snapshot = Object.freeze({
      ...snapshot,
      ...next,
      updatedAtMs: Date.now()
    });
    return snapshot;
  }

  return Object.freeze({
    getSnapshot() {
      return snapshot;
    },
    onFreeze(reasonText, lastValidReplayPoint = null) {
      return set({
        phase: RHIZOH_RECOVERY_PHASE.FROZEN,
        freezeReasonClass: classifyRecoveryReasonV1(reasonText),
        freezeReasonText: reasonText ?? null,
        lastValidReplayPoint: lastValidReplayPoint ?? snapshot.lastValidReplayPoint
      });
    },
    enterSafeMode() {
      return set({ phase: RHIZOH_RECOVERY_PHASE.SAFE_MODE });
    },
    markRollbackReady(replayPoint) {
      return set({
        phase: RHIZOH_RECOVERY_PHASE.ROLLBACK_READY,
        lastValidReplayPoint: replayPoint ?? snapshot.lastValidReplayPoint
      });
    },
    startStagedReactivation(agentIds) {
      return set({
        phase: RHIZOH_RECOVERY_PHASE.STAGED_REACTIVATION,
        stagedAgents: Object.freeze([...(agentIds ?? [])])
      });
    },
    resetNormal() {
      return set({
        phase: RHIZOH_RECOVERY_PHASE.NORMAL,
        freezeReasonClass: null,
        freezeReasonText: null,
        stagedAgents: Object.freeze([])
      });
    }
  });
}

