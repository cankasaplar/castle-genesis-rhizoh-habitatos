/**
 * Policy Evolution Collider V0.1 — dual-reality observation after chess regret loop.
 * RESEARCH-ONLY Reality Collider: adaptive anchor + mirror preservation.
 * We maintain a dual-reality policy system where truth is emergent, not given.
 */

import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
import { getChessTeacherStatusV0 } from "./chessTeacherInterfaceV0.js";
import {
  buildRegretVectorsFromTraceV0,
  enrichRegretVectorWithTopologyV0
} from "./regretVectorSystemV0.js";
import { encodeChessTopologyEventV0 } from "./rhizohGeometryChessEncoderV0.js";
import {
  applyMatchOutcomeToAdaptiveFieldV0,
  resolveGeometricDriftFieldV0,
  readAdaptiveDriftStateV0
} from "./geometricDriftFieldV0.js";
import { emitPolicyEvolutionTickV0 } from "./mirrorPolicyDiffTrackerV0.js";

export const POLICY_EVOLUTION_COLLIDER_SCHEMA_V0 = "rhizoh.policy_evolution_collider.v0.1";
export const POLICY_EVOLUTION_COLLIDER_EVENT_V0 = "rhizoh:policy-evolution-collider-v0";

/**
 * @param {{
 *   regret: object,
 *   moves?: ReadonlyArray<string|object>,
 *   matchId?: string|null,
 *   outcome?: string|null,
 *   localColor?: 'w'|'b',
 *   engineStatus?: string
 * }} opts
 */
export function observePolicyEvolutionColliderV0(opts = {}) {
  const engineStatus = opts.engineStatus || getChessTeacherStatusV0();
  if (engineStatus === "heuristic_fallback") {
    return Object.freeze({
      schema: POLICY_EVOLUTION_COLLIDER_SCHEMA_V0,
      skipped: true,
      reason: "teacher_offline",
      tickCount: 0,
      ticks: Object.freeze([])
    });
  }

  const fenRows = buildMatchMovesWithFenV0(opts.moves || []);
  const vectors = buildRegretVectorsFromTraceV0({ regret: opts.regret, fenRows });
  /** @type {object[]} */
  const ticks = [];

  for (const baseVector of vectors) {
    if (!baseVector.beforeFen || !baseVector.san) continue;
    const teacherTopology = baseVector.bestMove
      ? encodeChessTopologyEventV0(baseVector.beforeFen, baseVector.bestMove)
      : null;
    const mirrorTopology = encodeChessTopologyEventV0(baseVector.beforeFen, baseVector.san);
    const regretVector = enrichRegretVectorWithTopologyV0({
      regretVector: baseVector,
      teacherTopology,
      mirrorTopology
    });
    const driftField = resolveGeometricDriftFieldV0({
      teacherTopology,
      mirrorTopology,
      regretVector
    });

    const tick = emitPolicyEvolutionTickV0({
      layer: regretVector.moveNumber,
      matchId: opts.matchId || null,
      canonicalTeacher: driftField.canonicalPattern,
      mirrorDivergence: driftField.mirrorPattern,
      driftVectorMagnitude: driftField.driftBlendMagnitude,
      canonicalWeight: driftField.canonicalWeight,
      mirrorWeight: driftField.mirrorWeight,
      status: driftField.status,
      regretVector,
      driftField
    });
    ticks.push(tick);
  }

  const adaptiveState = applyMatchOutcomeToAdaptiveFieldV0({
    outcome: opts.outcome || null,
    localColor: opts.localColor || "w",
    ticks
  });

  const result = Object.freeze({
    schema: POLICY_EVOLUTION_COLLIDER_SCHEMA_V0,
    skipped: false,
    matchId: opts.matchId || null,
    tickCount: ticks.length,
    ticks: Object.freeze(ticks),
    alternativePreservedCount: ticks.filter(
      (t) => t.status === "ALTERNATIVE_UNIVERSE_PRESERVED"
    ).length,
    latentExpansionCount: ticks.filter((t) => t.status === "LATENT_SPACE_EXPANSION").length,
    adaptiveState,
    governance: Object.freeze({
      canonicalRole: "anchor",
      explorationNeverPunishedAsError: true,
      truthModel: "emergent_dual_reality"
    })
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(POLICY_EVOLUTION_COLLIDER_EVENT_V0, { detail: result }));
    } catch {
      /* noop */
    }
  }

  return result;
}

export { readAdaptiveDriftStateV0 };
