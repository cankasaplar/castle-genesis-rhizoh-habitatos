/**
 * Rhizoh chess learning weights — post-game self-update (game + self-analysis priority).
 * RESEARCH-ONLY; not frozen core.
 */

export const CHESS_LEARNING_WEIGHTS_SCHEMA_V0 = "rhizoh.chess_learning_weights.v0";
export const CHESS_LEARNING_WEIGHTS_LS_KEY_V0 = "rhizoh.chess_learning_weights.v0";
export const CHESS_LEARNING_WEIGHTS_EVENT_V0 = "rhizoh:chess-learning-weights-v0";

const DEFAULT_WEIGHTS_V0 = Object.freeze({
  learningMode: true,
  riskPenaltyWeight: 0.55,
  winForcingWeight: 1.0,
  aggressionBias: 0,
  matchesLearned: 0,
  forcedWinCorrections: 0
});

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function clampBias(n) {
  return Math.max(-1, Math.min(1, Number(n) || 0));
}

function readRawV0() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHESS_LEARNING_WEIGHTS_LS_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeWeightsV0(weights) {
  if (typeof window === "undefined") return weights;
  const next = Object.freeze({
    schema: CHESS_LEARNING_WEIGHTS_SCHEMA_V0,
    ...weights,
    updatedAt: new Date().toISOString()
  });
  try {
    window.localStorage.setItem(CHESS_LEARNING_WEIGHTS_LS_KEY_V0, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(CHESS_LEARNING_WEIGHTS_EVENT_V0, { detail: next }));
  } catch {
    /* noop */
  }
  return next;
}

export function readChessLearningWeightsV0() {
  const raw = readRawV0();
  if (!raw) return Object.freeze({ ...DEFAULT_WEIGHTS_V0 });
  return Object.freeze({
    ...DEFAULT_WEIGHTS_V0,
    learningMode: raw.learningMode !== false,
    riskPenaltyWeight: clamp01(raw.riskPenaltyWeight ?? DEFAULT_WEIGHTS_V0.riskPenaltyWeight),
    winForcingWeight: Math.max(0.5, Math.min(2.5, Number(raw.winForcingWeight) || 1)),
    aggressionBias: clampBias(raw.aggressionBias),
    matchesLearned: Math.max(0, Number(raw.matchesLearned) || 0),
    forcedWinCorrections: Math.max(0, Number(raw.forcedWinCorrections) || 0),
    updatedAt: raw.updatedAt || null
  });
}

/**
 * Apply post-match correction from regret / forced-win anomalies.
 * @param {ReturnType<import('./chessRegretAnalysisV0.js').analyzeRhizohRegretV0>} regret
 */
export function applyChessLearningCorrectionV0(regret) {
  const prev = readChessLearningWeightsV0();
  if (!prev.learningMode || !regret) return prev;

  let { riskPenaltyWeight, winForcingWeight, aggressionBias, forcedWinCorrections, matchesLearned } =
    prev;

  matchesLearned += 1;

  if (regret.forcedWinIgnored) {
    winForcingWeight = Math.min(2.5, winForcingWeight * 1.1);
    riskPenaltyWeight = Math.max(0.15, riskPenaltyWeight * 0.9);
    aggressionBias = clampBias(aggressionBias + 0.1);
    forcedWinCorrections += 1;
  } else if (regret.lossAvoidanceBias) {
    winForcingWeight = Math.min(2.5, winForcingWeight * 1.05);
    riskPenaltyWeight = Math.max(0.2, riskPenaltyWeight * 0.95);
    aggressionBias = clampBias(aggressionBias + 0.05);
  }

  return writeWeightsV0({
    learningMode: true,
    riskPenaltyWeight,
    winForcingWeight,
    aggressionBias,
    matchesLearned,
    forcedWinCorrections
  });
}

/**
 * Batch trainer correction — aggregate corpus/live regret signals (PR-C).
 * @param {{ forcedWinIgnored?: boolean, lossAvoidanceBias?: boolean, forcedWinRatio?: number, lossAvoidanceRatio?: number }} aggregate
 * @param {{ gamesTrained?: number }} [opts]
 */
export function applyChessBatchLearningCorrectionV0(aggregate, opts = {}) {
  const prev = readChessLearningWeightsV0();
  if (!prev.learningMode || !aggregate) return prev;

  const gamesTrained = Math.max(0, Number(opts.gamesTrained) || 0);
  let { riskPenaltyWeight, winForcingWeight, aggressionBias, forcedWinCorrections, matchesLearned } =
    prev;

  matchesLearned += Math.min(Math.max(1, gamesTrained), 8);

  const forcedRatio = Number(aggregate.forcedWinRatio) || (aggregate.forcedWinIgnored ? 0.25 : 0);
  const lossRatio =
    Number(aggregate.lossAvoidanceRatio) || (aggregate.lossAvoidanceBias ? 0.2 : 0);

  if (aggregate.forcedWinIgnored || forcedRatio >= 0.2) {
    const mult = 1 + Math.min(0.12, forcedRatio * 0.15);
    winForcingWeight = Math.min(2.5, winForcingWeight * mult);
    riskPenaltyWeight = Math.max(0.15, riskPenaltyWeight * (1 - Math.min(0.08, forcedRatio * 0.1)));
    aggressionBias = clampBias(aggressionBias + Math.min(0.12, forcedRatio * 0.2));
    forcedWinCorrections += Math.max(1, Math.round(forcedRatio * gamesTrained));
  } else if (aggregate.lossAvoidanceBias || lossRatio >= 0.15) {
    winForcingWeight = Math.min(2.5, winForcingWeight * 1.04);
    riskPenaltyWeight = Math.max(0.2, riskPenaltyWeight * 0.97);
    aggressionBias = clampBias(aggressionBias + 0.03);
  }

  return writeWeightsV0({
    learningMode: true,
    riskPenaltyWeight,
    winForcingWeight,
    aggressionBias,
    matchesLearned,
    forcedWinCorrections,
    batchTrainedAt: new Date().toISOString()
  });
}

/**
 * Map learning weights → engine tuning deltas.
 * @param {ReturnType<typeof readChessLearningWeightsV0>} weights
 */
export function resolveLearningWeightDeltasV0(weights = readChessLearningWeightsV0()) {
  if (!weights.learningMode) {
    return Object.freeze({
      contemptDelta: 0,
      skillDelta: 0,
      movetimeMult: 1,
      winForcingActive: false
    });
  }
  const contemptDelta = Math.round(weights.aggressionBias * 18 + (weights.winForcingWeight - 1) * 12);
  const skillDelta = Math.round(weights.aggressionBias * 2 + Math.max(0, weights.winForcingWeight - 1) * 1.5);
  const riskDrag = weights.riskPenaltyWeight * 8;
  return Object.freeze({
    contemptDelta: contemptDelta - Math.round(riskDrag * 0.35),
    skillDelta,
    movetimeMult: 1 + Math.max(0, weights.winForcingWeight - 1) * 0.12,
    winForcingActive: weights.winForcingWeight > 1.05
  });
}

export function resetChessLearningWeightsForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CHESS_LEARNING_WEIGHTS_LS_KEY_V0);
  }
}
