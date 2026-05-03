import {
  RHIZOH_TASK_NODE_STATUS,
  recomputeDagReadiness,
  pickNextReadyTask,
  closeTask
} from "./taskDagExecutor.js";
import { reduceRhizohEventLogV1 } from "./rhizohStateReducerV1.js";
import { verifyRhizohReplayTraceV1 } from "./rhizohReplayVerifierV1.js";
import { exportRhizohAuditBundleV1 } from "./rhizohAuditExportV1.js";
import {
  createRecoveryStateMachineV1,
  RHIZOH_RECOVERY_PHASE
} from "./rhizohRecoveryStateMachineV1.js";
import { createRhizohRecoveryPolicyEngineV1 } from "./rhizohRecoveryPolicyEngineV1.js";
import { evaluateRhizohGlobalGovernanceCoherenceV1 } from "./rhizohGlobalGovernanceCoherenceEngineV1.js";
import { evaluateSystemWideCoherenceClosureV1 } from "./rhizohSystemWideCoherenceClosureEngineV1.js";
import {
  evaluateRhizohGovernanceOnlineModeV1,
  evaluateRhizohGovernanceOfflineModeV1
} from "./rhizohGovernanceExecutionSplitV1.js";
import { reconcileGovernanceDecisionsV1 } from "./rhizohGovernanceReconciliationLayerV1.js";
import { createRhizohGovernanceStabilityConstraintLayerV1 } from "./rhizohGovernanceStabilityConstraintLayerV1.js";

export const RHIZOH_AUTONOMY_SUBSTRATE_VERSION = "v0";

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

function hashStringFNV1a(value) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function createRhizohAutonomySubstrateV0() {
  const state = {
    version: RHIZOH_AUTONOMY_SUBSTRATE_VERSION,
    contracts: new Map(),
    tasks: [],
    approvalQueue: [],
    budgets: new Map(),
    memoryArtifacts: [],
    proofRecords: [],
    killState: Object.freeze({ level: "L0", active: false, reason: null, atMs: null }),
    agentSetFrozen: false,
    requiresHumanApprovalReset: false,
    governancePolicyState: {
      revision: 1,
      lastConflictKind: null,
      lastPatchedAtMs: null
    },
    governanceStability: createRhizohGovernanceStabilityConstraintLayerV1(),
    invalidatedTaskIds: new Set(),
    events: [],
    eventSeq: 0,
    frameSeq: 0,
    recovery: createRecoveryStateMachineV1(),
    recoveryPolicy: createRhizohRecoveryPolicyEngineV1()
  };

  function computeSnapshotHash() {
    return hashStringFNV1a(
      JSON.stringify({
        contracts: state.contracts.size,
        tasks: state.tasks.map((t) => ({ taskId: t.taskId, status: t.status, traceId: t.traceId })),
        approvals: state.approvalQueue.map((a) => ({ taskId: a.taskId, status: a.status })),
        memoryArtifacts: state.memoryArtifacts.length,
        proofRecords: state.proofRecords.length,
        killState: state.killState,
        agentSetFrozen: state.agentSetFrozen,
        requiresHumanApprovalReset: state.requiresHumanApprovalReset
      })
    );
  }

  function logEvent(type, data = {}) {
    state.eventSeq += 1;
    state.frameSeq += 1;
    const ev = Object.freeze({
      eventId: id("evt"),
      seq: state.eventSeq,
      frameId: state.frameSeq,
      atMs: Date.now(),
      type,
      traceId: data.traceId ?? null,
      taskId: data.taskId ?? null,
      agentId: data.agentId ?? null,
      payload: data.payload ?? null,
      snapshotHash: computeSnapshotHash()
    });
    state.events.push(ev);
    return ev;
  }

  function registerAgentContract(contract) {
    if (!contract?.identity?.agent_id) throw new Error("rhizohSubstrate: contract.identity.agent_id required");
    if (!contract.mission) throw new Error("rhizohSubstrate: mission required");
    if (!contract.permissions) throw new Error("rhizohSubstrate: permissions required");
    if (!contract.budget) throw new Error("rhizohSubstrate: budget required");
    if (!contract.kill_switch) throw new Error("rhizohSubstrate: kill_switch required");
    state.contracts.set(contract.identity.agent_id, Object.freeze({ ...contract }));
    if (!state.budgets.has(contract.identity.agent_id)) {
      state.budgets.set(contract.identity.agent_id, {
        spentUnits: 0,
        hardCap: Number(contract.budget.token_limit_daily ?? 0) || 0
      });
    }
    logEvent("AGENT_CONTRACT_REGISTERED", {
      agentId: contract.identity.agent_id,
      payload: { mission: contract.mission }
    });
    return true;
  }

  function submitTaskProposal(input) {
    if (state.killState.active) return { ok: false, reason: "kill_switch_active" };
    if (state.agentSetFrozen) return { ok: false, reason: "agent_set_frozen" };
    if (state.recovery.getSnapshot().phase === RHIZOH_RECOVERY_PHASE.SAFE_MODE && input.kind !== "recovery_safe_task") {
      return { ok: false, reason: "safe_mode_restricts_new_tasks" };
    }
    const contract = state.contracts.get(input.agentId);
    if (!contract) return { ok: false, reason: "missing_agent_contract" };

    const task = {
      taskId: id("task"),
      agentId: input.agentId,
      kind: input.kind ?? "proposal",
      status: RHIZOH_TASK_NODE_STATUS.PENDING,
      requiresApproval: !!input.requiresApproval,
      traceId: input.traceId ?? id("trc"),
      dependsOn: [],
      payload: input.payload ?? {},
      createdAtMs: Date.now()
    };
    state.tasks.push(task);
    logEvent("TASK_CREATED", { traceId: task.traceId, taskId: task.taskId, agentId: task.agentId, payload: { kind: task.kind } });
    if (task.requiresApproval) {
      state.approvalQueue.push({
        requestId: id("apr"),
        taskId: task.taskId,
        agentId: task.agentId,
        status: "pending",
        createdAtMs: Date.now()
      });
      task.status = RHIZOH_TASK_NODE_STATUS.BLOCKED;
      logEvent("TASK_BLOCKED_AWAITING_APPROVAL", { traceId: task.traceId, taskId: task.taskId, agentId: task.agentId });
    }
    return { ok: true, taskId: task.taskId, traceId: task.traceId };
  }

  function approveTask(taskId, approved, reason = null) {
    const req = state.approvalQueue.find((r) => r.taskId === taskId && r.status === "pending");
    if (!req) return { ok: false, reason: "approval_request_not_found" };
    req.status = approved ? "approved" : "rejected";
    req.reviewedAtMs = Date.now();
    req.reason = reason;
    const task = state.tasks.find((t) => t.taskId === taskId);
    if (task) {
      task.status = approved ? RHIZOH_TASK_NODE_STATUS.PENDING : RHIZOH_TASK_NODE_STATUS.FAILED;
      logEvent(approved ? "TASK_APPROVED" : "TASK_REJECTED", {
        traceId: task.traceId,
        taskId: task.taskId,
        agentId: task.agentId,
        payload: { reason: reason ?? null }
      });
    }
    return { ok: true };
  }

  function executeNextReadyTask() {
    if (state.killState.active) return { ok: false, reason: "kill_switch_active" };
    if (state.agentSetFrozen) return { ok: false, reason: "agent_set_frozen" };
    recomputeDagReadiness(state.tasks);
    const task = pickNextReadyTask(state.tasks);
    if (!task) return { ok: false, reason: "no_ready_task" };

    const budget = state.budgets.get(task.agentId);
    const cost = 1;
    if (budget && budget.hardCap > 0 && budget.spentUnits + cost > budget.hardCap) {
      task.status = RHIZOH_TASK_NODE_STATUS.FAILED;
      logEvent("TASK_FAILED_BUDGET_CAP", { traceId: task.traceId, taskId: task.taskId, agentId: task.agentId });
      return { ok: false, reason: "budget_cap_exceeded", taskId: task.taskId };
    }
    task.status = RHIZOH_TASK_NODE_STATUS.RUNNING;
    logEvent("TASK_EXECUTION_STARTED", { traceId: task.traceId, taskId: task.taskId, agentId: task.agentId });
    if (budget) budget.spentUnits += cost;

    closeTask(task, "completed");
    logEvent("TASK_EXECUTED", { traceId: task.traceId, taskId: task.taskId, agentId: task.agentId });
    state.memoryArtifacts.push({
      artifactId: id("mem"),
      taskId: task.taskId,
      agentId: task.agentId,
      traceId: task.traceId,
      kind: `${task.kind}_result`,
      createdAtMs: Date.now()
    });
    logEvent("MEMORY_COMMITTED", { traceId: task.traceId, taskId: task.taskId, agentId: task.agentId });
    state.proofRecords.push({
      proofId: id("prf"),
      taskId: task.taskId,
      traceId: task.traceId,
      verifierStatus: "STUB_OK",
      createdAtMs: Date.now()
    });
    logEvent("PROOF_ATTACHED", {
      traceId: task.traceId,
      taskId: task.taskId,
      agentId: task.agentId,
      payload: { verifierStatus: "STUB_OK" }
    });
    return { ok: true, taskId: task.taskId, traceId: task.traceId };
  }

  function emitKillSignal(level, reason) {
    state.killState = Object.freeze({
      level: level ?? "L1",
      active: true,
      reason: reason ?? "manual",
      atMs: Date.now()
    });
    logEvent("KILL_SWITCH_EMITTED", { payload: { level: state.killState.level, reason: state.killState.reason } });
    return state.killState;
  }

  function resetKillSignal(options = {}) {
    const approvedByHuman = options.approvedByHuman === true;
    if (state.requiresHumanApprovalReset && !approvedByHuman) {
      return { ok: false, reason: "human_approval_reset_required" };
    }
    state.killState = Object.freeze({ level: "L0", active: false, reason: null, atMs: null });
    state.agentSetFrozen = false;
    state.requiresHumanApprovalReset = false;
    state.recovery.resetNormal();
    logEvent("KILL_SWITCH_RESET");
    return { ok: true, killState: state.killState };
  }

  function replayTraceV0(traceId) {
    const events = state.events.filter((e) => e.traceId === traceId);
    const replay = {
      traceId,
      eventCount: events.length,
      taskCreated: 0,
      taskApproved: 0,
      taskRejected: 0,
      taskExecuted: 0,
      proofAttached: 0,
      memoryCommitted: 0
    };
    for (const e of events) {
      if (e.type === "TASK_CREATED") replay.taskCreated += 1;
      if (e.type === "TASK_APPROVED") replay.taskApproved += 1;
      if (e.type === "TASK_REJECTED") replay.taskRejected += 1;
      if (e.type === "TASK_EXECUTED") replay.taskExecuted += 1;
      if (e.type === "PROOF_ATTACHED") replay.proofAttached += 1;
      if (e.type === "MEMORY_COMMITTED") replay.memoryCommitted += 1;
    }
    return Object.freeze({
      ...replay,
      deterministicSnapshotHash: events.length ? events[events.length - 1].snapshotHash : null,
      events: Object.freeze(events)
    });
  }

  function replayTraceV1(traceId) {
    const events = state.events.filter((e) => e.traceId === traceId);
    return reduceRhizohEventLogV1(events);
  }

  function verifyReplayTraceV1(traceId) {
    const events = state.events.filter((e) => e.traceId === traceId);
    return verifyRhizohReplayTraceV1(events);
  }

  function exportTraceAuditV1(traceId, context = {}) {
    const events = state.events.filter((e) => e.traceId === traceId);
    return exportRhizohAuditBundleV1({
      traceId,
      events,
      context: {
        runtimeVersion: RHIZOH_AUTONOMY_SUBSTRATE_VERSION,
        ...context
      }
    });
  }

  function enforceReplaySafetyV1(traceId, options = {}) {
    const verification = verifyReplayTraceV1(traceId);
    if (verification.ok) {
      logEvent("REPLAY_VERIFIED_OK", {
        traceId,
        payload: { frameCount: verification.frameCount }
      });
      return Object.freeze({
        ok: true,
        traceId,
        action: "none",
        verification
      });
    }
    const l3Threshold = Number(options.l3DivergenceThreshold ?? 3);
    const escalationLevel = verification.divergenceCount >= l3Threshold ? "L3" : "L2";
    state.agentSetFrozen = true;
    state.requiresHumanApprovalReset = true;
    const lastOkFrame = verification.checks.filter((c) => c.ok).at(-1) ?? null;
    const lastValidReplayPoint = lastOkFrame?.frameId ?? null;
    const reasonText = options.reasonText ?? "replay_divergence_detected";
    state.recoveryPolicy.addJustificationNode({
      kind: "safe_mode_entry_justification",
      traceId,
      payload: {
        reasonText,
        divergenceCount: verification.divergenceCount,
        lastValidReplayPoint
      }
    });
    state.recovery.onFreeze(reasonText, lastValidReplayPoint);
    emitKillSignal(escalationLevel, "replay_divergence_detected");
    logEvent("REPLAY_DIVERGENCE_DETECTED", {
      traceId,
      payload: { divergenceCount: verification.divergenceCount, escalationLevel }
    });
    logEvent("AGENT_SET_FROZEN", { traceId, payload: { escalationLevel } });
    logEvent("HUMAN_RESET_REQUIRED", { traceId, payload: { required: true } });
    return Object.freeze({
      ok: false,
      traceId,
      action: "escalated_and_frozen",
      escalationLevel,
      lastValidReplayPoint,
      verification
    });
  }

  async function reconcileGovernancePlanesV1(inputs = {}) {
    const nowMs = Date.now();
    const online = evaluateRhizohGovernanceOnlineModeV1({
      events: state.events,
      snapshot: getSnapshot(),
      ...inputs
    });
    const offline = await evaluateRhizohGovernanceOfflineModeV1({
      events: state.events,
      snapshot: getSnapshot(),
      ...inputs
    });
    const rec = reconcileGovernanceDecisionsV1({
      online,
      offline,
      riskTier: inputs.riskTier ?? "high"
    });

    const proposedDirection = rec.conflictKind === "online_approved_offline_invalid" ? "strict" : rec.conflictKind === "online_blocked_offline_valid" ? "relax" : "hold";
    const hysteresis = state.governanceStability.applyPolicyHysteresis(proposedDirection, nowMs, inputs.minFlipIntervalMs ?? 8000);
    const aging = state.governanceStability.applyConflictAging(rec.conflictKind, nowMs, inputs.conflictAgingWindowMs ?? 20000);
    const patchRate = state.governanceStability.applyPatchRateLimit(nowMs, inputs.minPatchIntervalMs ?? 6000);
    const momentum = state.governanceStability.updateGovernanceMomentum(hysteresis.decision);

    if (rec.conflictKind !== "online_offline_consistent") {
      if (patchRate.allowPatch) {
        state.governancePolicyState = {
          revision: state.governancePolicyState.revision + 1,
          lastConflictKind: rec.conflictKind,
          lastPatchedAtMs: Date.now()
        };
        logEvent("GOVERNANCE_POLICY_PATCH_APPLIED", {
          payload: {
            revision: state.governancePolicyState.revision,
            conflictKind: rec.conflictKind
          }
        });
      } else {
        logEvent("GOVERNANCE_POLICY_PATCH_DEFERRED", {
          payload: { conflictKind: rec.conflictKind, reason: "stabilization_threshold_rate_limit" }
        });
      }
    }

    if (rec.retroactiveInvalidationRules.enabled) {
      for (const t of state.tasks) {
        if (rec.retroactiveInvalidationRules.invalidateStatuses.includes(t.status)) {
          state.invalidatedTaskIds.add(t.taskId);
          t.status = RHIZOH_TASK_NODE_STATUS.FAILED;
        }
      }
      logEvent("GOVERNANCE_RETROACTIVE_INVALIDATION_APPLIED", {
        payload: { invalidatedCount: state.invalidatedTaskIds.size }
      });
    }

    if (rec.requiresImmediateFreeze && aging.allowEscalation) {
      state.agentSetFrozen = true;
      state.requiresHumanApprovalReset = true;
      emitKillSignal("L2", "governance_reconciliation_conflict");
      logEvent("GOVERNANCE_RECONCILIATION_FREEZE", {
        payload: { conflictKind: rec.conflictKind }
      });
    } else if (rec.requiresImmediateFreeze && !aging.allowEscalation) {
      logEvent("GOVERNANCE_RECONCILIATION_ESCALATION_DEFERRED", {
        payload: { conflictKind: rec.conflictKind, reason: "conflict_aging_window" }
      });
    }

    return Object.freeze({ online, offline, reconciliation: rec, constraints: { hysteresis, aging, patchRate, momentum } });
  }

  function enterRecoverySafeModeV1(reason = "manual_safe_mode") {
    const snap = state.recovery.enterSafeMode();
    state.recoveryPolicy.addJustificationNode({
      kind: "safe_mode_entry",
      payload: { reason, phase: snap.phase }
    });
    logEvent("RECOVERY_SAFE_MODE_ENTERED", { payload: { reason, phase: snap.phase } });
    return snap;
  }

  function rollbackToLastValidReplayPointV1() {
    const current = state.recovery.getSnapshot();
    const safety = state.recoveryPolicy.validateRollbackSafety({
      replayVerification: verifyRhizohReplayTraceV1(state.events),
      recoverySnapshot: current
    });
    if (!safety.safe) {
      logEvent("RECOVERY_ROLLBACK_REJECTED", { payload: { reason: safety.reason } });
      return Object.freeze({ ok: false, safety });
    }
    const snap = state.recovery.markRollbackReady(current.lastValidReplayPoint);
    logEvent("RECOVERY_ROLLBACK_MARKED", {
      payload: { replayPoint: snap.lastValidReplayPoint, phase: snap.phase }
    });
    return Object.freeze({ ok: true, safety, recovery: snap });
  }

  function stagedReactivationV1(agentIds = []) {
    const verification = verifyRhizohReplayTraceV1(state.events);
    const scoring = state.recoveryPolicy.scoreStagedReactivationPermissions({
      agentIds,
      replayVerification: verification
    });
    const allowed = scoring.filter((s) => s.decision === "ALLOW_STAGE").map((s) => s.agentId);
    const trustDecay = state.recoveryPolicy.applyPartialTrustReallocation({
      agentIds,
      replayVerification: verification
    });
    const snap = state.recovery.startStagedReactivation(allowed);
    logEvent("RECOVERY_STAGED_REACTIVATION_STARTED", {
      payload: { requestedCount: agentIds.length, allowedCount: allowed.length, phase: snap.phase }
    });
    return Object.freeze({
      recovery: snap,
      scoring,
      trustDecay
    });
  }

  function getRecoveryStateSnapshotV1() {
    return state.recovery.getSnapshot();
  }

  function getRecoveryJustificationGraphV1() {
    return state.recoveryPolicy.getJustificationGraph();
  }

  function getRecoveryTrustSnapshotV1() {
    return state.recoveryPolicy.getTrustSnapshot();
  }

  function recoverAgentTrustV1(agentId, delta = 0.1) {
    const out = state.recoveryPolicy.recoverAgentTrust(agentId, delta);
    logEvent("RECOVERY_TRUST_RECOVERED", { agentId, payload: { delta, nextTrust: out.nextTrust } });
    return out;
  }

  function getSnapshot() {
    const pendingApprovals = state.approvalQueue.filter((q) => q.status === "pending");
    const recentTasks = state.tasks.slice(-6).map((t) => ({
      taskId: t.taskId,
      agentId: t.agentId,
      kind: t.kind,
      status: t.status,
      traceId: t.traceId
    }));
    return {
      version: state.version,
      contractCount: state.contracts.size,
      taskCounts: {
        pending: state.tasks.filter((t) => t.status === RHIZOH_TASK_NODE_STATUS.PENDING).length,
        ready: state.tasks.filter((t) => t.status === RHIZOH_TASK_NODE_STATUS.READY).length,
        blocked: state.tasks.filter((t) => t.status === RHIZOH_TASK_NODE_STATUS.BLOCKED).length,
        running: state.tasks.filter((t) => t.status === RHIZOH_TASK_NODE_STATUS.RUNNING).length,
        completed: state.tasks.filter((t) => t.status === RHIZOH_TASK_NODE_STATUS.COMPLETED).length,
        failed: state.tasks.filter((t) => t.status === RHIZOH_TASK_NODE_STATUS.FAILED).length
      },
      approvalPending: pendingApprovals.length,
      pendingApprovalTaskIds: pendingApprovals.map((q) => q.taskId),
      recentTasks,
      eventCount: state.events.length,
      latestEventType: state.events.length ? state.events[state.events.length - 1].type : null,
      snapshotHash: computeSnapshotHash(),
      memoryArtifacts: state.memoryArtifacts.length,
      proofRecords: state.proofRecords.length,
      killState: state.killState,
      agentSetFrozen: state.agentSetFrozen,
      requiresHumanApprovalReset: state.requiresHumanApprovalReset,
      recovery: state.recovery.getSnapshot(),
      recoveryTrust: state.recoveryPolicy.getTrustSnapshot(),
      governancePolicyState: state.governancePolicyState,
      governanceStability: state.governanceStability.getSnapshot(),
      invalidatedTaskCount: state.invalidatedTaskIds.size
    };
  }

  return Object.freeze({
    registerAgentContract,
    submitTaskProposal,
    approveTask,
    executeNextReadyTask,
    emitKillSignal,
    resetKillSignal,
    listPendingApprovals: () => state.approvalQueue.filter((q) => q.status === "pending").map((q) => ({ ...q })),
    getEventLog: ({ limit = 50, type = null } = {}) => {
      let out = state.events;
      if (type) out = out.filter((e) => e.type === type);
      return Object.freeze(out.slice(-Math.max(1, limit)));
    },
    getTraceFrames: (traceId) => Object.freeze(state.events.filter((e) => e.traceId === traceId)),
    replayTraceV0,
    replayTraceV1,
    verifyReplayTraceV1,
    enforceReplaySafetyV1,
    enterRecoverySafeModeV1,
    rollbackToLastValidReplayPointV1,
    stagedReactivationV1,
    getRecoveryStateSnapshotV1,
    getRecoveryJustificationGraphV1,
    getRecoveryTrustSnapshotV1,
    recoverAgentTrustV1,
    evaluateGlobalGovernanceCoherenceV1: async (inputs = {}) =>
      evaluateRhizohGlobalGovernanceCoherenceV1({
        events: state.events,
        snapshot: getSnapshot(),
        ...inputs
      }),
    evaluateGovernanceOnlineModeV1: (inputs = {}) =>
      evaluateRhizohGovernanceOnlineModeV1({
        events: state.events,
        snapshot: getSnapshot(),
        ...inputs
      }),
    evaluateGovernanceOfflineModeV1: async (inputs = {}) =>
      evaluateRhizohGovernanceOfflineModeV1({
        events: state.events,
        snapshot: getSnapshot(),
        ...inputs
      }),
    reconcileGovernancePlanesV1,
    evaluateSystemWideCoherenceClosureV1: async (inputs = {}) =>
      evaluateSystemWideCoherenceClosureV1({
        events: state.events,
        snapshot: getSnapshot(),
        ...inputs
      }),
    exportTraceAuditV1,
    getSnapshot
  });
}

