/**
 * Chess learning bridge v0 — persist Stockfish analysis to Opening Book, Ghost, Chronicle, Knowledge.
 */

import { appendCastleChronicleEntryV0, CASTLE_CHRONICLE_KIND_V0 } from "./castleChronicleV0.js";
import { appendGhostMemoryV0 } from "./ghostMemoryPersistenceV0.js";
import { upsertRhizohKnowledgeV0, RHIZOH_TEACHER_SOURCE_V0 } from "./rhizohKnowledgeStoreV0.js";
import { recordOpeningFromMatchV0 } from "./rhizohOpeningBookV0.js";
import { analyzeChessMatchV0, buildMatchMovesWithFenV0 } from "./stockfishMatchAnalysisV0.js";
import { incrementCastleIdentityStatV0 } from "./castleIdentityV0.js";
import { recordChessMatchChronicleV0 } from "./castleChronicleV0.js";
import { rememberGhostNetworkMomentV0 } from "./livingCastleMemoryV0.js";

export const CHESS_LEARNING_BRIDGE_SCHEMA_V0 = "castle.chess_learning_bridge.v0";
export const CHESS_MATCH_ANALYZED_EVENT_V0 = "rhizoh:chess-match-analyzed-v0";

/**
 * @param {{
 *   moves: ReadonlyArray<object|string>,
 *   localColor?: 'w' | 'b',
 *   opponentCastleId?: string,
 *   matchId?: string,
 *   outcome?: string,
 *   won?: boolean,
 *   draw?: boolean
 * }} opts
 */
export async function recordChessMatchLearningV0(opts = {}) {
  const rows = buildMatchMovesWithFenV0(opts.moves || []);
  const analysis = await analyzeChessMatchV0({
    moves: rows,
    localColor: opts.localColor,
    opponentCastleId: opts.opponentCastleId,
    matchId: opts.matchId,
    outcome: opts.outcome,
    won: opts.won,
    draw: opts.draw
  });

  recordChessMatchChronicleV0({
    opponentCastleId: opts.opponentCastleId,
    matchId: opts.matchId,
    won: opts.won === true,
    body: analysis.lesson.body
  });
  incrementCastleIdentityStatV0("matchesPlayed", 1);
  rememberGhostNetworkMomentV0({
    peerCastleId: opts.opponentCastleId,
    kind: "chess",
    summary: `${analysis.opening.name}: ${analysis.lesson.title}`,
    tags: ["chess", "stockfish", analysis.won ? "victory" : "match"]
  });

  recordOpeningFromMatchV0({
    name: analysis.opening.name,
    eco: analysis.opening.eco,
    moves: analysis.opening.moves,
    won: analysis.won,
    opponentCastleId: opts.opponentCastleId,
    lesson: analysis.lesson
  });

  appendGhostMemoryV0({
    summary: `Chess: ${analysis.opening.name} — ${analysis.lesson.title}`,
    tags: ["chess", "stockfish", analysis.phase, analysis.opening.eco || "opening"],
    peerCastleId: opts.opponentCastleId || null
  });

  appendCastleChronicleEntryV0({
    kind: analysis.isBlunder ? CASTLE_CHRONICLE_KIND_V0.CUSTOM : CASTLE_CHRONICLE_KIND_V0.CHESS_MATCH,
    title: analysis.lesson.title,
    body: analysis.lesson.body,
    dedupeKey: opts.matchId ? `chronicle:chess_analysis:${opts.matchId}` : undefined,
    payload: {
      opening: analysis.opening.name,
      eco: analysis.opening.eco,
      criticalMove: analysis.criticalMove?.san || null,
      alternative: analysis.lesson.alternative
    }
  });

  upsertRhizohKnowledgeV0({
    question: `What opening was played in match ${opts.matchId || "recent"}?`,
    answer: `The match used ${analysis.opening.name}${analysis.opening.eco ? ` (${analysis.opening.eco})` : ""}. ${analysis.lesson.body}`,
    teacher: RHIZOH_TEACHER_SOURCE_V0.STOCKFISH,
    tags: ["chess", "opening", analysis.opening.eco || "eco"],
    confidence: 0.88
  });

  if (analysis.criticalMove?.alternative) {
    upsertRhizohKnowledgeV0({
      question: `What was the alternative at move ${analysis.criticalMove.moveNumber} in ${analysis.opening.name}?`,
      answer: `Instead of ${analysis.criticalMove.san}, consider ${analysis.criticalMove.alternative}.`,
      teacher: RHIZOH_TEACHER_SOURCE_V0.STOCKFISH,
      tags: ["chess", "lesson"],
      confidence: 0.85
    });
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(CHESS_MATCH_ANALYZED_EVENT_V0, {
          detail: Object.freeze({ analysis })
        })
      );
    } catch {
      /* noop */
    }
  }

  return analysis;
}
