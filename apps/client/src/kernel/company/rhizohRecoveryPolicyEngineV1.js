export const RHIZOH_RECOVERY_POLICY_ENGINE_VERSION = "v1";

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

export function createRhizohRecoveryPolicyEngineV1() {
  const state = {
    justificationGraph: [],
    trustByAgent: new Map()
  };

  function ensureAgentTrust(agentId) {
    if (!state.trustByAgent.has(agentId)) state.trustByAgent.set(agentId, 1);
    return state.trustByAgent.get(agentId);
  }

  function addJustificationNode(node) {
    const entry = Object.freeze({
      nodeId: `jst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      atMs: Date.now(),
      kind: node.kind ?? "generic",
      traceId: node.traceId ?? null,
      payload: node.payload ?? {}
    });
    state.justificationGraph.push(entry);
    return entry;
  }

  function validateRollbackSafety({ replayVerification, recoverySnapshot }) {
    const divergenceCount = Number(replayVerification?.divergenceCount ?? 0);
    const lastValidReplayPoint = recoverySnapshot?.lastValidReplayPoint ?? null;
    const safe = divergenceCount > 0 && lastValidReplayPoint !== null;
    return Object.freeze({
      safe,
      divergenceCount,
      lastValidReplayPoint,
      reason: safe ? "rollback_point_available" : "missing_valid_replay_point"
    });
  }

  function scoreStagedReactivationPermissions({ agentIds, replayVerification }) {
    const div = Number(replayVerification?.divergenceCount ?? 0);
    const maxPenalty = Math.min(0.6, div * 0.08);
    const scores = (agentIds ?? []).map((agentId, i) => {
      const baseTrust = ensureAgentTrust(agentId);
      const orderPenalty = i * 0.03;
      const score = clamp01(baseTrust - maxPenalty - orderPenalty);
      return Object.freeze({
        agentId,
        score,
        decision: score >= 0.55 ? "ALLOW_STAGE" : "HOLD"
      });
    });
    return Object.freeze(scores);
  }

  function applyPartialTrustReallocation({ agentIds, replayVerification }) {
    const div = Number(replayVerification?.divergenceCount ?? 0);
    const decay = Math.min(0.45, 0.1 + div * 0.05);
    const touched = [];
    for (const agentId of agentIds ?? []) {
      const current = ensureAgentTrust(agentId);
      const next = clamp01(current - decay);
      state.trustByAgent.set(agentId, next);
      touched.push(Object.freeze({ agentId, previousTrust: current, nextTrust: next }));
    }
    return Object.freeze(touched);
  }

  function recoverAgentTrust(agentId, delta = 0.1) {
    const current = ensureAgentTrust(agentId);
    const next = clamp01(current + delta);
    state.trustByAgent.set(agentId, next);
    return Object.freeze({ agentId, previousTrust: current, nextTrust: next });
  }

  function getTrustSnapshot() {
    return Object.freeze(
      [...state.trustByAgent.entries()].map(([agentId, trust]) => Object.freeze({ agentId, trust }))
    );
  }

  return Object.freeze({
    addJustificationNode,
    validateRollbackSafety,
    scoreStagedReactivationPermissions,
    applyPartialTrustReallocation,
    recoverAgentTrust,
    getTrustSnapshot,
    getJustificationGraph: () => Object.freeze([...state.justificationGraph])
  });
}

