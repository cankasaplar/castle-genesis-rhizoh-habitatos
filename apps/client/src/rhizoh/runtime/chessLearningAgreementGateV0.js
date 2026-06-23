/**
 * Chess learning agreement gate — reject noisy / ambiguous positions.
 * learning = f(agreement, not events)
 * RESEARCH-ONLY
 */

import { normalizeChessEvalCpV0 } from "./chessEvalFusionV0.js";

export const CHESS_LEARNING_AGREEMENT_GATE_SCHEMA_V0 =
  "castle.rhizoh.chess_learning_agreement_gate.v0";

/** Normalized eval variance ceiling — above = ambiguous, no weight update. */
export const CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0 = 0.35;

/** Minimum fused sources required for learning eligibility. */
export const CHESS_LEARNING_AGREEMENT_MIN_SOURCES_V0 = 2;

let acceptedCountV0 = 0;
let rejectedCountV0 = 0;
let ambiguousCountV0 = 0;

function resolveAgreementVarianceV0(fusion, ctx = {}) {
  if (!fusion) return { variance: null, sourceCount: 0 };

  if (ctx.truthAuthoritative === true) {
    const values = [];
    const stockfishNorm = normalizeChessEvalCpV0(fusion.stockfishCp);
    const dbRate = Number(fusion.databaseWinrate);
    const databaseNorm = Number.isFinite(dbRate) ? dbRate * 2 - 1 : null;
    if (stockfishNorm != null) values.push(stockfishNorm);
    if (databaseNorm != null) values.push(databaseNorm);
    if (values.length >= 2) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
      return { variance, sourceCount: values.length };
    }
  }

  return {
    variance: Number(fusion.variance) || 0,
    sourceCount: Number(fusion.sourceCount) || 0
  };
}

/**
 * @param {ReturnType<import('./chessEvalFusionV0.js').fuseChessEvalSourcesV0>} fusion
 * @param {{ drifted?: boolean, matchedRank?: number | null, truthAuthoritative?: boolean }} [ctx]
 */
export function evaluateChessLearningAgreementGateV0(fusion, ctx = {}) {
  if (ctx.truthAuthoritative === false) {
    return Object.freeze({
      schema: CHESS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      ambiguous: false,
      reason: "heuristic_preview",
      variance: null,
      threshold: CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0,
      atMs: Date.now()
    });
  }

  if (!fusion) {
    rejectedCountV0 += 1;
    return Object.freeze({
      schema: CHESS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      ambiguous: true,
      reason: "no_fusion",
      variance: null,
      threshold: CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0,
      atMs: Date.now()
    });
  }

  const { variance, sourceCount } = resolveAgreementVarianceV0(fusion, ctx);
  const ambiguous =
    variance > CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0 ||
    sourceCount < CHESS_LEARNING_AGREEMENT_MIN_SOURCES_V0;

  if (ambiguous) {
    ambiguousCountV0 += 1;
    rejectedCountV0 += 1;
    return Object.freeze({
      schema: CHESS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
      accepted: false,
      learningEligible: false,
      ambiguous: true,
      reason:
        sourceCount < CHESS_LEARNING_AGREEMENT_MIN_SOURCES_V0
          ? "insufficient_sources"
          : "high_variance",
      variance,
      threshold: CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0,
      fusion,
      atMs: Date.now()
    });
  }

  acceptedCountV0 += 1;
  return Object.freeze({
    schema: CHESS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
    accepted: true,
    learningEligible: true,
    ambiguous: false,
    reason: ctx.drifted ? "consensus_ok_drift_signal" : "consensus_ok",
    variance,
    threshold: CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0,
    fusion,
    drifted: Boolean(ctx.drifted),
    atMs: Date.now()
  });
}

export function getChessLearningAgreementGateSnapshotV0() {
  const total = acceptedCountV0 + rejectedCountV0;
  return Object.freeze({
    schema: CHESS_LEARNING_AGREEMENT_GATE_SCHEMA_V0,
    accepted: acceptedCountV0,
    rejected: rejectedCountV0,
    ambiguous: ambiguousCountV0,
    acceptanceRate: total > 0 ? Number((acceptedCountV0 / total).toFixed(3)) : null,
    varianceThreshold: CHESS_LEARNING_AGREEMENT_VARIANCE_THRESHOLD_V0,
    batchSize: 32,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetChessLearningAgreementGateForTestV0() {
  acceptedCountV0 = 0;
  rejectedCountV0 = 0;
  ambiguousCountV0 = 0;
}
