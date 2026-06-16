/**
 * Policy Evolution Collider V0 — dual-reality observation after chess regret loop.
 * RESEARCH-ONLY Reality Collider: 70% canonical teacher + 30% mirror preservation.
 */

import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
import { getChessStockfishEngineStatusV0 } from "./chessStockfishEngineV0.js";
import { buildRegretVectorsFromTraceV0 } from "./regretVectorSystemV0.js";
import { encodeChessTopologyEventV0 } from "./rhizohGeometryChessEncoderV0.js";
import { resolveGeometricDriftFieldV0 } from "./geometricDriftFieldV0.js";
import { emitPolicyEvolutionTickV0 } from "./mirrorPolicyDiffTrackerV0.js";

export const POLICY_EVOLUTION_COLLIDER_SCHEMA_V0 = "rhizoh.policy_evolution_collider.v0";
export const POLICY_EVOLUTION_COLLIDER_EVENT_V0 = "rhizoh:policy-evolution-collider-v0";

/**
 * @param {{
 *   regret: object,
 *   moves?: ReadonlyArray<string|object>,
 *   matchId?: string|null,
 *   engineStatus?: string
 * }} opts
 */
export function observePolicyEvolutionColliderV0(opts = {}) {
  const engineStatus = opts.engineStatus || getChessStockfishEngineStatusV0();
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

  for (const vector of vectors) {
    if (!vector.beforeFen || !vector.san) continue;
    const teacherTopology = vector.bestMove
      ? encodeChessTopologyEventV0(vector.beforeFen, vector.bestMove)
      : null;
    const mirrorTopology = encodeChessTopologyEventV0(vector.beforeFen, vector.san);
    const driftField = resolveGeometricDriftFieldV0({
      teacherTopology,
      mirrorTopology,
      regretVector: vector
    });

    const tick = emitPolicyEvolutionTickV0({
      layer: vector.moveNumber,
      matchId: opts.matchId || null,
      canonicalTeacher: driftField.canonicalPattern,
      mirrorDivergence: driftField.mirrorPattern,
      driftVectorMagnitude: driftField.driftBlendMagnitude,
      canonicalWeight: driftField.canonicalWeight,
      mirrorWeight: driftField.mirrorWeight,
      status: driftField.status,
      regretVector: vector,
      driftField
    });
    ticks.push(tick);
  }

  const result = Object.freeze({
    schema: POLICY_EVOLUTION_COLLIDER_SCHEMA_V0,
    skipped: false,
    matchId: opts.matchId || null,
    tickCount: ticks.length,
    ticks: Object.freeze(ticks),
    alternativePreservedCount: ticks.filter(
      (t) => t.status === "ALTERNATIVE_UNIVERSE_PRESERVED"
    ).length
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
