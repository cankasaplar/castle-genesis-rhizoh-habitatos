/**
 * Chess cluster observer — Rhizoh watches moves (does not play).
 * Observation → pattern tags → attention weight; spatial-independent.
 * RESEARCH-ONLY
 */

import { detectChessOpeningV0 } from "./chessOpeningDetectV0.js";
import { estimateChessMaterialBalanceV0 } from "./chessArenaEngineV0.js";
import { writeChessClusterMemoryNodeV0 } from "./chessClusterMemoryGraphV0.js";

export const CHESS_CLUSTER_OBSERVER_SCHEMA_V0 = "castle.rhizoh.chess_cluster_observer.v0";
export const CHESS_CLUSTER_OBSERVATION_EVENT_V0 = "rhizoh:chess-cluster-observation-v0";

const patternCountsV0 = new Map();

/**
 * Heuristic eval delta from material + check (no blocking Stockfish in hot path).
 * @param {object} slot
 * @param {object} moveRow
 */
function estimateEvalDeltaV0(slot, moveRow) {
  const balance = estimateChessMaterialBalanceV0(slot.game, "w");
  const san = String(moveRow.san || "");
  let delta = balance * 0.04;
  if (san.includes("x")) delta += san.includes("Q") ? 0.35 : 0.12;
  if (san.includes("+")) delta += 0.08;
  if (san.includes("#")) delta += 1;
  if (san.includes("O-O")) delta += 0.03;
  return Number(delta.toFixed(3));
}

/**
 * @param {string} san
 */
function extractTacticTagsV0(san) {
  const tags = [];
  const s = String(san || "");
  if (s.includes("x") && /[NBR]/.test(s)) tags.push("fork_candidate");
  if (s.includes("x") && s.includes("Q")) tags.push("queen_trade");
  if (s.includes("+") && !s.includes("#")) tags.push("check");
  if (s.includes("#")) tags.push("mate");
  if (s.includes("O-O")) tags.push("castling");
  if (/^[a-h]/.test(s) && s.includes("x")) tags.push("pawn_structure");
  return tags;
}

/**
 * @param {object} slot
 * @param {object} moveRow
 * @param {object} policy
 */
export function observeChessClusterMoveV0(slot, moveRow, policy) {
  const evalDelta = estimateEvalDeltaV0(slot, moveRow);
  const tacticTags = extractTacticTagsV0(moveRow.san);
  const opening =
    slot.ply <= 12
      ? detectChessOpeningV0(
          slot.moveHistory.map((m) => Object.freeze({ san: m.san, before: m.fenBefore }))
        )
      : null;

  const critical =
    Math.abs(evalDelta) >= 0.35 ||
    tacticTags.includes("mate") ||
    tacticTags.includes("fork_candidate");

  for (const tag of tacticTags) {
    patternCountsV0.set(tag, (patternCountsV0.get(tag) || 0) + 1);
  }

  const observation = Object.freeze({
    schema: CHESS_CLUSTER_OBSERVER_SCHEMA_V0,
    slotId: slot.slotId,
    matchId: slot.matchId,
    ply: moveRow.ply,
    san: moveRow.san,
    agentId: moveRow.agentId,
    policyRisk: policy?.riskProfile || null,
    evalDelta,
    tacticTags: Object.freeze(tacticTags),
    openingEco: opening?.eco || null,
    openingName: opening?.name || null,
    critical,
    attentionWeight: slot.attentionWeight,
    atMs: Date.now()
  });

  writeChessClusterMemoryNodeV0({
    kind: "move_observation",
    slotId: slot.slotId,
    matchId: slot.matchId,
    observation
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(CHESS_CLUSTER_OBSERVATION_EVENT_V0, { detail: observation })
      );
    } catch {
      /* noop */
    }
  }

  return observation;
}

export function getChessClusterPatternCountsV0() {
  return Object.freeze([...patternCountsV0.entries()].map(([tag, count]) => ({ tag, count })));
}

/** @internal vitest */
export function __resetChessClusterObserverForTestV0() {
  patternCountsV0.clear();
}
