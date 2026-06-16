/**
 * Chess Intelligence Pipeline v0 — Play → Observe → Analyze → Learn → Teach → Civilization.
 */

import { appendCastleChronicleEntryV0, CASTLE_CHRONICLE_KIND_V0, recordChessMatchChronicleV0 } from "./castleChronicleV0.js";
import { appendGhostMemoryV0 } from "./ghostMemoryPersistenceV0.js";
import { upsertRhizohKnowledgeV0, RHIZOH_TEACHER_SOURCE_V0 } from "./rhizohKnowledgeStoreV0.js";
import { learnOpeningFromObservationV0 } from "./rhizohOpeningBookV0.js";
import { observeChessMatchV0 } from "./chessMatchObserverV0.js";
import { runRhizohChessLearningLoopV0 } from "./chessLearningLoopV0.js";
import { runRhizohUgeSilentObserverV0 } from "./rhizohUgeSilentObserverV0.js";
import { readRhizohObservationPhaseV0 } from "./rhizohObservationPhaseV0.js";
import { teachChessLessonV0 } from "./rhizohChessTeacherV0.js";
import { recordChessCivilizationMatchV0 } from "./chessCivilizationV0.js";
import { incrementCastleIdentityStatV0, readCastleIdentityV0 } from "./castleIdentityV0.js";
import { rememberGhostNetworkMomentV0 } from "./livingCastleMemoryV0.js";

export const CHESS_INTELLIGENCE_PIPELINE_SCHEMA_V0 = "castle.chess_intelligence_pipeline.v0";
export const CHESS_MATCH_ANALYZED_EVENT_V0 = "rhizoh:chess-match-analyzed-v0";

/**
 * Full 5-layer chess intelligence run after a game ends.
 * Layer 1 (Play) is assumed complete before this is called.
 *
 * @param {{
 *   moves: ReadonlyArray<object|string>,
 *   localColor?: 'w' | 'b',
 *   opponentCastleId?: string,
 *   matchId?: string,
 *   gameId?: string,
 *   outcome?: string,
 *   won?: boolean,
 *   draw?: boolean,
 *   locale?: string,
 *   castleId?: string,
 *   policyMode?: string,
 *   mindId?: string,
 *   runLearningLoop?: boolean
 * }} opts
 */
export async function runChessIntelligencePipelineV0(opts = {}) {
  const observation = await observeChessMatchV0(opts);
  let learningLoop = null;
  let ugeObservation = null;
  if (opts.runLearningLoop !== false && (opts.moves?.length || 0) > 0) {
    try {
      learningLoop = await runRhizohChessLearningLoopV0({
        moves: opts.moves,
        outcome: opts.outcome,
        localColor: opts.localColor,
        matchId: opts.matchId || opts.gameId,
        policyMode: opts.policyMode,
        mindId: opts.mindId
      });
    } catch {
      learningLoop = null;
    }
    try {
      ugeObservation = await runRhizohUgeSilentObserverV0({
        moves: opts.moves,
        outcome: opts.outcome,
        localColor: opts.localColor,
        matchId: opts.matchId || opts.gameId,
        regret: learningLoop?.regret || null
      });
    } catch {
      ugeObservation = null;
    }
  }
  const openingEntry = learnOpeningFromObservationV0(observation);
  const lesson = teachChessLessonV0(observation, { locale: opts.locale });
  const civilization = recordChessCivilizationMatchV0(observation, {
    castleId: opts.castleId || readCastleIdentityV0()?.castleId,
    lesson
  });

  recordChessMatchChronicleV0({
    opponentCastleId: opts.opponentCastleId,
    matchId: observation.gameId,
    won: opts.won === true,
    body: lesson.body
  });
  incrementCastleIdentityStatV0("matchesPlayed", 1);
  rememberGhostNetworkMomentV0({
    peerCastleId: opts.opponentCastleId,
    kind: "chess",
    summary: `${observation.openingName}: ${lesson.title}`,
    tags: ["chess", "stockfish", observation.winner === "local" ? "victory" : "match"]
  });

  appendGhostMemoryV0({
    summary: `Chess: ${observation.openingName} — ${lesson.title}`,
    tags: ["chess", "teacher", observation.eco || "opening"],
    peerCastleId: opts.opponentCastleId || null
  });

  const isMistakeLesson = (observation.mistakes?.length || 0) > 0;
  appendCastleChronicleEntryV0({
    kind: isMistakeLesson ? CASTLE_CHRONICLE_KIND_V0.CUSTOM : CASTLE_CHRONICLE_KIND_V0.CHESS_MATCH,
    title: lesson.title,
    body: lesson.body,
    dedupeKey: observation.gameId ? `chronicle:chess_teacher:${observation.gameId}` : undefined,
    payload: {
      eco: observation.eco,
      opening: observation.openingName,
      theme: lesson.theme,
      alternative: lesson.alternative
    }
  });

  upsertRhizohKnowledgeV0({
    question: `What happened in chess game ${observation.gameId}?`,
    answer: `${observation.openingName}${observation.eco ? ` (${observation.eco})` : ""}. ${lesson.body}`,
    teacher: RHIZOH_TEACHER_SOURCE_V0.STOCKFISH,
    tags: ["chess", "opening", observation.eco || "eco"],
    confidence: 0.88
  });

  if (lesson.alternative) {
    upsertRhizohKnowledgeV0({
      question: `What should I have played at move ${lesson.moveNumber} in ${observation.openingName}?`,
      answer: lesson.body,
      teacher: RHIZOH_TEACHER_SOURCE_V0.STOCKFISH,
      tags: ["chess", "lesson", lesson.theme],
      confidence: 0.85
    });
  }

  const result = Object.freeze({
    schema: CHESS_INTELLIGENCE_PIPELINE_SCHEMA_V0,
    observation,
    learningLoop,
    ugeObservation,
    observationPhase: readRhizohObservationPhaseV0(),
    openingEntry,
    lesson,
    civilization,
    layers: Object.freeze(
      learningLoop
        ? ugeObservation
          ? ["play", "observe", "uge_silent_observer", "analyze", "teach", "civilization"]
          : ["play", "observe", "analyze", "teach", "civilization"]
        : ["play", "observe", "teach", "civilization"]
    )
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(CHESS_MATCH_ANALYZED_EVENT_V0, {
          detail: Object.freeze({ result, observation, lesson })
        })
      );
    } catch {
      /* noop */
    }
  }

  return result;
}

/** @deprecated use runChessIntelligencePipelineV0 */
export async function recordChessMatchLearningV0(opts = {}) {
  const result = await runChessIntelligencePipelineV0(opts);
  return Object.freeze({
    ...result.observation,
    lesson: result.lesson,
    opening: Object.freeze({
      name: result.observation.openingName,
      eco: result.observation.eco
    }),
    won: result.observation.winner === "local",
    phase: result.observation.phase,
    criticalMove: result.observation.mistakes?.[0] || result.observation.criticalMoves?.[0] || null,
    isBlunder: (result.observation.mistakes?.length || 0) > 0
  });
}
