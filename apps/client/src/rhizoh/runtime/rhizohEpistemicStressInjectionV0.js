/**
 * Epistemic Stress Injection v0 — Phase 4 shadow pipeline validation.
 * Synthetic uncertainty spikes (eval variance, policy_diff, topology mismatch)
 * without feeding drift detection or move selection.
 * RESEARCH-ONLY
 */

import {
  projectStressConflictGraphToEpistemicMemoryV0
} from "./rhizohEpistemicMemoryGraphV0.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";
import {
  appendShadowTraceFromDriftEventV0,
  appendShadowTraceFromStockfishTimeoutV0,
  appendShadowTraceRecordV0,
  isRhizohShadowModeActiveV0,
  resolveShadowModeReasonV0,
  setLastStressRunForComplianceV0,
  SHADOW_SOURCE_SYSTEM_V0,
  SHADOW_TRUST_CLASS_V0
} from "./rhizohShadowTraceLedgerV0.js";
import {
  COUNCIL_TRIGGER_KIND_V0,
  evaluateCouncilTriggerV0,
  maybeEnqueueEpistemicCouncilV0,
  runEpistemicCouncilPipelineV0
} from "./rhizohEpistemicCouncilV0.js";
import { recordStressRunForInflationGuardV0 } from "./rhizohEpistemicGraphInflationGuardV0.js";
import { TOPOLOGY_EVENT_TYPES_V0 } from "./rhizohTopologyEventEmitterV0.js";
import {
  assertInvitedUserEpistemicAuthorityV0,
  EPISTEMIC_AUTHORITY_KIND_V0,
  GOVERNANCE_ACTOR_V0
} from "./rhizohInvitedUserAuthorityGateV0.js";

export const EPISTEMIC_STRESS_INJECTION_SCHEMA_V0 =
  "castle.rhizoh.epistemic_stress_injection.v0";

export const EPISTEMIC_STRESS_PROFILE_V0 = Object.freeze({
  LIGHT: "light",
  MEDIUM: "medium",
  ADVERSARIAL: "adversarial"
});

/** Stress output must never close feedback loops. */
export const EPISTEMIC_STRESS_GOVERNANCE_V0 = Object.freeze({
  feedsDriftDetection: false,
  feedsMoveSelection: false,
  feedsPolicyDiff: false,
  executionEffect: false,
  uiEffect: false,
  epistemicRole: "stress_injection"
});

const PROFILE_PRESETS_V0 = Object.freeze({
  [EPISTEMIC_STRESS_PROFILE_V0.LIGHT]: Object.freeze({
    evalVariance: 0.38,
    driftEntropy: 0.55,
    topologyMagnitude: 0.52,
    lensCount: 2,
    injectTimeout: false,
    adversarialStream: false
  }),
  [EPISTEMIC_STRESS_PROFILE_V0.MEDIUM]: Object.freeze({
    evalVariance: 0.58,
    driftEntropy: 0.72,
    topologyMagnitude: 0.68,
    lensCount: 3,
    injectTimeout: true,
    adversarialStream: false
  }),
  [EPISTEMIC_STRESS_PROFILE_V0.ADVERSARIAL]: Object.freeze({
    evalVariance: 0.88,
    driftEntropy: 0.95,
    topologyMagnitude: 0.92,
    lensCount: 4,
    injectTimeout: true,
    adversarialStream: true
  })
});

/** @type {object|null} */
let lastStressRunV0 = null;

let stressRunSeqV0 = 0;
let lastStressInjectAtMsV0 = 0;
const STRESS_MIN_INTERVAL_MS_V0 = 30_000;

/**
 * Heuristic multi-lens disagreement — not gateway LLM wire yet.
 * @param {{ profile: string, evalVariance: number, lensCount: number }} input
 */
export function buildEpistemicConflictGraphV0(input = {}) {
  const lensCount = Math.max(2, Number(input.lensCount) || 2);
  const spread = Number(input.evalVariance) || 0.4;
  const baseStances = ["material_balance", "king_safety", "initiative", "structure"];
  const nodes = [];
  const edges = [];

  for (let i = 0; i < lensCount; i += 1) {
    const confidence = Math.max(0.15, Math.min(0.95, 0.55 + (i - lensCount / 2) * spread * 0.35));
    nodes.push(
      Object.freeze({
        lensId: `heuristic_lens_${i}`,
        stance: baseStances[i % baseStances.length],
        confidence: Number(confidence.toFixed(3)),
        rank: i + 1
      })
    );
  }

  for (let i = 0; i < nodes.length - 1; i += 1) {
    const delta = Math.abs(nodes[i].confidence - nodes[i + 1].confidence);
    if (delta < 0.08) continue;
    edges.push(
      Object.freeze({
        from: nodes[i].lensId,
        to: nodes[i + 1].lensId,
        conflictType: delta >= 0.25 ? "stance_divergence" : "confidence_skew",
        delta: Number(delta.toFixed(3))
      })
    );
  }

  const maxDisagreement = edges.reduce((m, e) => Math.max(m, e.delta), 0);

  return Object.freeze({
    schema: "castle.rhizoh.epistemic_conflict_graph.v0",
    profile: input.profile || EPISTEMIC_STRESS_PROFILE_V0.LIGHT,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    maxDisagreement: Number(maxDisagreement.toFixed(3)),
    lensCount: nodes.length
  });
}

/**
 * @param {{
 *   profile?: string,
 *   matchId?: string,
 *   slotId?: number,
 *   forceCouncil?: boolean,
 *   fen?: string,
 *   force?: boolean,
 *   actor?: string
 * }} opts
 */
export async function injectEpistemicStressV0(opts = {}) {
  const actor = String(opts.actor || GOVERNANCE_ACTOR_V0.USER).toLowerCase();
  const authority = assertInvitedUserEpistemicAuthorityV0(
    EPISTEMIC_AUTHORITY_KIND_V0.STRESS_INJECTION,
    { actor }
  );
  if (!authority.permitted) {
    return Object.freeze({
      schema: EPISTEMIC_STRESS_INJECTION_SCHEMA_V0,
      ok: false,
      reason: authority.reason,
      shadowModeReason: resolveShadowModeReasonV0()
    });
  }

  if (!isRhizohShadowModeActiveV0()) {
    return Object.freeze({
      schema: EPISTEMIC_STRESS_INJECTION_SCHEMA_V0,
      ok: false,
      reason: "shadow_mode_inactive",
      shadowModeReason: resolveShadowModeReasonV0()
    });
  }

  if (opts.force !== true && Date.now() - lastStressInjectAtMsV0 < STRESS_MIN_INTERVAL_MS_V0) {
    return Object.freeze({
      schema: EPISTEMIC_STRESS_INJECTION_SCHEMA_V0,
      ok: false,
      reason: "stress_repetition_throttled",
      retryAfterMs: STRESS_MIN_INTERVAL_MS_V0 - (Date.now() - lastStressInjectAtMsV0),
      shadowModeReason: resolveShadowModeReasonV0()
    });
  }

  lastStressInjectAtMsV0 = Date.now();
  recordStressRunForInflationGuardV0();

  const profile = String(opts.profile || EPISTEMIC_STRESS_PROFILE_V0.LIGHT).toLowerCase();
  const preset =
    PROFILE_PRESETS_V0[profile] || PROFILE_PRESETS_V0[EPISTEMIC_STRESS_PROFILE_V0.LIGHT];
  const matchId = opts.matchId || "cluster_0_stress";
  const slotId = opts.slotId ?? CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0;
  const forceCouncil = opts.forceCouncil !== false;

  stressRunSeqV0 += 1;
  const stressRunId = `stress_${stressRunSeqV0}_${Date.now().toString(36)}`;
  const records = [];

  const policyDrift = appendShadowTraceFromDriftEventV0({
    kind: "DRIFT_EVENT",
    severity: "warn",
    eventType: "POLICY_DIFF_DRIFT",
    causalChainId: `${stressRunId}_policy`,
    matchId,
    slotId,
    entropyScore: preset.driftEntropy,
    canonicalPattern: "cluster",
    mirrorPattern: profile === EPISTEMIC_STRESS_PROFILE_V0.ADVERSARIAL ? "jump" : "mirror",
    playedFamily: "cluster",
    expectedFamily: profile === EPISTEMIC_STRESS_PROFILE_V0.ADVERSARIAL ? "jump" : "cluster"
  });
  if (policyDrift) records.push(policyDrift);

  const topologyDrift = appendShadowTraceFromDriftEventV0({
    kind: "DRIFT_EVENT",
    severity: profile === EPISTEMIC_STRESS_PROFILE_V0.LIGHT ? "info" : "warn",
    eventType: "TOPOLOGY_DRIFT_DETECTED",
    causalChainId: `${stressRunId}_topology`,
    matchId,
    slotId,
    entropyScore: preset.topologyMagnitude,
    canonicalPattern: "cluster",
    mirrorPattern: "topology_mismatch"
  });
  if (topologyDrift) records.push(topologyDrift);

  const evalRecord = appendShadowTraceRecordV0({
    sourceSystem: SHADOW_SOURCE_SYSTEM_V0.CHESS,
    eventType: "EVAL_VARIANCE_STRESS",
    entropyScore: preset.evalVariance,
    causalChainId: `${stressRunId}_eval`,
    matchId,
    slotId,
    policyContext: Object.freeze({
      evalVariance: preset.evalVariance,
      multiPvSpread: preset.evalVariance,
      profile
    }),
    hypotheticalOutcome:
      "If executed in live kernel: eval spread would flag uncertainty; no move override in shadow.",
    payload: Object.freeze({ stressRunId, profile, evalVariance: preset.evalVariance })
  });
  if (evalRecord) records.push(evalRecord);

  if (preset.injectTimeout) {
    const timeout = appendShadowTraceFromStockfishTimeoutV0({
      matchId,
      slotId,
      movetimeMs: profile === EPISTEMIC_STRESS_PROFILE_V0.ADVERSARIAL ? 2420 : 320,
      depth: profile === EPISTEMIC_STRESS_PROFILE_V0.ADVERSARIAL ? 21 : 14,
      fen: opts.fen || "stress_synthetic"
    });
    if (timeout) records.push(timeout);
  }

  if (preset.adversarialStream) {
    const adversarial = appendShadowTraceRecordV0({
      sourceSystem: SHADOW_SOURCE_SYSTEM_V0.STREAM,
      eventType: "ADVERSARIAL_STREAM_HINT",
      entropyScore: 0.9,
      causalChainId: `${stressRunId}_adversarial`,
      matchId,
      slotId,
      trustClass: SHADOW_TRUST_CLASS_V0.ADVERSARIAL,
      policyContext: Object.freeze({ profile, stressRunId }),
      hypotheticalOutcome:
        "If executed in live kernel: stream would be quarantined before council; shadow records only.",
      payload: Object.freeze({ stressRunId, profile })
    });
    if (adversarial) records.push(adversarial);
  }

  const conflictGraph = buildEpistemicConflictGraphV0({
    profile,
    evalVariance: preset.evalVariance,
    lensCount: preset.lensCount
  });

  const councilCtx = Object.freeze({
    policyDiff: { drifted: true },
    topologyEventType: TOPOLOGY_EVENT_TYPES_V0.DRIFT_DETECTED,
    driftMagnitude: preset.topologyMagnitude,
    stockfishTimeout: preset.injectTimeout,
    evalVariance: preset.evalVariance,
    matchId,
    slotId,
    fen: opts.fen || null
  });

  let councilTrigger = evaluateCouncilTriggerV0(councilCtx);
  let councilObservation = null;

  if (forceCouncil && councilTrigger?.shouldInvoke) {
    councilObservation = await runEpistemicCouncilPipelineV0({
      ...councilTrigger,
      bypassCooldown: true,
      stressRunId,
      conflictGraph,
      triggers: Object.freeze([
        ...new Set([
          ...(councilTrigger.triggers || []),
          COUNCIL_TRIGGER_KIND_V0.EVAL_VARIANCE
        ])
      ])
    });
    if (councilObservation && conflictGraph.nodes.length) {
      councilObservation = Object.freeze({
        ...councilObservation,
        lenses: conflictGraph.nodes,
        conflictGraph,
        stressRunId
      });
    }
  } else if (forceCouncil) {
    councilTrigger = maybeEnqueueEpistemicCouncilV0(councilCtx);
  }

  const result = Object.freeze({
    schema: EPISTEMIC_STRESS_INJECTION_SCHEMA_V0,
    ok: true,
    stressRunId,
    profile,
    recordCount: records.length,
    records: Object.freeze(records),
    conflictGraph,
    councilTrigger: councilTrigger || null,
    councilObservation,
    governance: EPISTEMIC_STRESS_GOVERNANCE_V0,
    shadowModeReason: resolveShadowModeReasonV0(),
    atMs: Date.now()
  });

  lastStressRunV0 = result;
  setLastStressRunForComplianceV0(result);

  projectStressConflictGraphToEpistemicMemoryV0(
    {
      stressRunId,
      conflictGraph,
      councilObservation,
      matchId,
      slotId
    },
    { trustedCaller: true }
  );

  void import("./rhizohShadowDevToolsRefreshV0.js")
    .then((mod) => mod.refreshRhizohShadowDevToolsV0())
    .catch(() => null);

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.epistemicStress = Object.freeze({
      lastRun: result,
      inject: injectEpistemicStressV0,
      conflictGraph,
      stressRunId
    });
  }

  return result;
}

/**
 * @returns {object|null}
 */
export function getLastEpistemicStressRunV0() {
  return lastStressRunV0;
}

/** @internal vitest */
export function __resetEpistemicStressInjectionForTestV0() {
  lastStressRunV0 = null;
  stressRunSeqV0 = 0;
  lastStressInjectAtMsV0 = 0;
  setLastStressRunForComplianceV0(null);
  if (typeof window !== "undefined") {
    delete window.__rhizoh?.epistemicStress;
  }
}
