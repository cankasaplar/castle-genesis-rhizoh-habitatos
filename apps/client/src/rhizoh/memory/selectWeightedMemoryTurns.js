import {
  RHIZOH_MEMORY_RETRIEVAL_DEFAULT_LIMIT,
  RHIZOH_MEMORY_CANDIDATE_POOL
} from "./constants.js";
import { computeSemanticMemoryCore, computePhysicsMemoryFactor } from "./computeMemoryWeight.js";

/**
 * Semantic geniş havuz → physics collapse ile yeniden sıralama → üst-k kesim (LLM).
 * @param {unknown[]} turns
 * @param {{
 *   now?: number,
 *   queryIntent?: string,
 *   currentBond?: number,
 *   limit?: number,
 *   lambda?: number,
 *   currentPhysics?: Record<string, unknown>,
 *   currentFieldTheory?: Record<string, unknown>
 * }} ctx
 */
export function selectWeightedMemoryTurns(turns, ctx = {}) {
  const list = Array.isArray(turns) ? turns : [];
  const limit = Math.max(4, Math.min(24, Number(ctx.limit) || RHIZOH_MEMORY_RETRIEVAL_DEFAULT_LIMIT));
  const poolCap = Math.max(limit, Math.min(120, Number(ctx.candidatePool) || RHIZOH_MEMORY_CANDIDATE_POOL));
  const baseCtx = {
    now: ctx.now,
    queryIntent: ctx.queryIntent,
    currentBond: ctx.currentBond,
    lambda: ctx.lambda,
    currentPhysics: ctx.currentPhysics,
    currentFieldTheory: ctx.currentFieldTheory
  };
  const scored = list
    .filter((t) => t && typeof t === "object" && Number.isFinite(t.ts))
    .map((turn) => {
      const semanticScore = computeSemanticMemoryCore(turn, baseCtx);
      const physicsCollapse = computePhysicsMemoryFactor(turn, baseCtx);
      const retrievalWeight = Math.max(0, Math.round(semanticScore * physicsCollapse * 1e6) / 1e6);
      return { turn, semanticScore, physicsCollapse, retrievalWeight };
    });
  scored.sort((a, b) => b.retrievalWeight - a.retrievalWeight);
  return scored.slice(0, poolCap).slice(0, limit).map(({ turn, semanticScore, physicsCollapse, retrievalWeight }) => ({
    ...turn,
    retrievalWeight,
    memoryFieldScores: {
      semantic: Math.round(semanticScore * 1e6) / 1e6,
      physicsCollapse: Math.round(physicsCollapse * 1e6) / 1e6
    }
  }));
}
