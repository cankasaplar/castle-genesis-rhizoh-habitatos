/**
 * Epistemic Council anomaly reasoning v0 — Karpathy collect/rank/synthesize (heuristic).
 * Observation-only; no move authority. RESEARCH-ONLY
 */

export const RHIZOH_COUNCIL_ANOMALY_SCHEMA_V0 = "castle.rhizoh.council_anomaly_reasoning.v0";

export const COUNCIL_ANOMALY_PHASE_V0 = Object.freeze({
  COLLECT: "COLLECT",
  RANK: "RANK",
  SYNTHESIZE: "SYNTHESIZE"
});

const TRIGGER_WEIGHT_V0 = Object.freeze({
  policy_diff_drift: 0.28,
  topology_drift: 0.24,
  stockfish_timeout: 0.22,
  eval_variance: 0.18
});

const STANCE_BY_TRIGGER_V0 = Object.freeze({
  policy_diff_drift: "policy_alignment",
  topology_drift: "topology_coherence",
  stockfish_timeout: "compute_reliability",
  eval_variance: "eval_stability"
});

/**
 * @param {{ triggers?: string[], conflictGraph?: object|null, memoryGraph?: object|null }} input
 */
export function computeCouncilAnomalyScoreV0(input = {}) {
  const triggers = Array.isArray(input.triggers) ? input.triggers : [];
  let score = 0;
  for (const t of triggers) {
    score += TRIGGER_WEIGHT_V0[t] || 0.08;
  }
  const disagreement = Number(input.conflictGraph?.maxDisagreement) || 0;
  score += disagreement * 0.25;
  const nodePressure = Math.min(1, (Number(input.memoryGraph?.nodeCount) || 0) / 512);
  score += nodePressure * 0.12;
  return Number(Math.max(0, Math.min(1, score)).toFixed(4));
}

/**
 * @param {{ triggers?: string[], fen?: string|null, matchId?: string|null, conflictGraph?: object|null }} request
 */
export function runCouncilCollectPhaseV0(request = {}) {
  const triggers = Array.isArray(request.triggers) ? request.triggers : [];
  const lenses = triggers.map((trigger, i) =>
    Object.freeze({
      lensId: `gateway_collect_${i}`,
      trigger,
      stance: STANCE_BY_TRIGGER_V0[trigger] || "general_uncertainty",
      confidence: Number((0.45 + (TRIGGER_WEIGHT_V0[trigger] || 0.1)).toFixed(3)),
      evidence: Object.freeze({
        fen: request.fen ? String(request.fen).slice(0, 48) : null,
        matchId: request.matchId || null
      })
    })
  );

  if (request.conflictGraph?.nodes?.length) {
    for (const node of request.conflictGraph.nodes) {
      lenses.push(
        Object.freeze({
          lensId: `conflict_${node.lensId}`,
          trigger: "conflict_graph",
          stance: node.stance,
          confidence: Number(node.confidence) || 0.5,
          evidence: Object.freeze({ source: "stress_conflict_graph" })
        })
      );
    }
  }

  return Object.freeze({
    phase: COUNCIL_ANOMALY_PHASE_V0.COLLECT,
    lensCount: lenses.length,
    lenses: Object.freeze(lenses)
  });
}

/**
 * @param {object} collectPhase
 */
export function runCouncilRankPhaseV0(collectPhase) {
  const lenses = [...(collectPhase.lenses || [])].sort(
    (a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0)
  );
  const ranked = lenses.map((lens, i) =>
    Object.freeze({
      ...lens,
      rank: i + 1,
      anonymousId: `lens_rank_${i + 1}`
    })
  );
  const spread =
    ranked.length >= 2
      ? Math.abs((ranked[0].confidence || 0) - (ranked[ranked.length - 1].confidence || 0))
      : 0;

  return Object.freeze({
    phase: COUNCIL_ANOMALY_PHASE_V0.RANK,
    rankedLenses: Object.freeze(ranked),
    confidenceSpread: Number(spread.toFixed(3))
  });
}

/**
 * @param {object} request
 * @param {object} collectPhase
 * @param {object} rankPhase
 */
export function runCouncilSynthesizePhaseV0(request, collectPhase, rankPhase) {
  const top = rankPhase.rankedLenses?.[0];
  const triggers = request.triggers || [];
  const anomalyScore = computeCouncilAnomalyScoreV0({
    triggers,
    conflictGraph: request.conflictGraph,
    memoryGraph: request.memoryGraph
  });

  const severity =
    anomalyScore >= 0.75 ? "high" : anomalyScore >= 0.45 ? "elevated" : "watch";

  const synthesis = [
    `Council anomaly ${severity} (score=${anomalyScore}).`,
    triggers.length ? `Triggers: ${triggers.join(", ")}.` : "No explicit triggers.",
    top?.stance ? `Dominant lens: ${top.stance}.` : "No dominant lens."
  ].join(" ");

  return Object.freeze({
    phase: COUNCIL_ANOMALY_PHASE_V0.SYNTHESIZE,
    anomalyScore,
    severity,
    synthesis,
    chairmanLens: top || null,
    confidenceSpread: rankPhase.confidenceSpread
  });
}

/**
 * Full pipeline — gateway wire for Phase 5.
 * @param {object} request
 */
export function runCouncilAnomalyReasoningV0(request = {}) {
  const collect = runCouncilCollectPhaseV0(request);
  const rank = runCouncilRankPhaseV0(collect);
  const synthesize = runCouncilSynthesizePhaseV0(request, collect, rank);

  const reasoningChain = Object.freeze([
    Object.freeze({
      step: COUNCIL_ANOMALY_PHASE_V0.COLLECT,
      atMs: Date.now(),
      lensCount: collect.lensCount
    }),
    Object.freeze({
      step: COUNCIL_ANOMALY_PHASE_V0.RANK,
      atMs: Date.now(),
      confidenceSpread: rank.confidenceSpread,
      topRank: rank.rankedLenses?.[0]?.anonymousId || null
    }),
    Object.freeze({
      step: COUNCIL_ANOMALY_PHASE_V0.SYNTHESIZE,
      atMs: Date.now(),
      anomalyScore: synthesize.anomalyScore,
      severity: synthesize.severity
    })
  ]);

  return Object.freeze({
    schema: RHIZOH_COUNCIL_ANOMALY_SCHEMA_V0,
    ok: true,
    status: "heuristic_v0",
    request: Object.freeze({
      matchId: request.matchId || null,
      slotId: request.slotId ?? null,
      fen: request.fen || null,
      triggers: Object.freeze([...(request.triggers || [])]),
      stressRunId: request.stressRunId || null
    }),
    phases: Object.freeze({
      collect,
      rank,
      synthesize
    }),
    anomalyScore: synthesize.anomalyScore,
    severity: synthesize.severity,
    synthesis: synthesize.synthesis,
    lenses: rank.rankedLenses,
    reasoningChain,
    governance: Object.freeze({
      feedsDriftDetection: false,
      feedsMoveSelection: false,
      feedsPolicyDiff: false,
      epistemicRole: "contextual_annotation"
    }),
    atMs: Date.now()
  });
}
