/**
 * Academy Learning Union v0 — cross-discipline observation aggregate.
 * Unifies chess + go + checkers learning reports without execution authority.
 * RESEARCH-ONLY — interpretation only.
 */

import { buildRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";
import { buildRhizohGoLearningReportV0 } from "./rhizohGoLearningReportV0.js";
import { buildRhizohCheckersLearningReportV0 } from "./rhizohCheckersLearningReportV0.js";

export const RHIZOH_ACADEMY_LEARNING_UNION_SCHEMA_V0 = "castle.rhizoh.academy_learning_union.v0";

export const ACADEMY_DISCIPLINE_IDS_V0 = Object.freeze(["chess", "go", "checkers"]);

/**
 * @param {"chess" | "go" | "checkers"} discipline
 * @param {object | null} report
 */
export function summarizeAcademyDisciplineV0(discipline, report) {
  const id = String(discipline || "").trim();
  if (!report) {
    return Object.freeze({
      discipline: id,
      armed: false,
      movesSeen: 0,
      batchesFlushed: 0,
      batchPending: 0,
      gateAccepted: null,
      gateRejected: null,
      causalSpaceId: null,
      channelId: null
    });
  }

  const movesSeen =
    id === "chess"
      ? Math.max(Number(report.totalMovesSeen) || 0, Number(report.clusterMovesSeen) || 0)
      : Math.max(Number(report.movesSeen) || 0, Number(report.arenaMoveCount) || 0);

  const batchesFlushed =
    id === "chess"
      ? Number(report.batchFlushesSeen) || 0
      : Number(report.batchesFlushed) || 0;

  const batchPending =
    id === "chess"
      ? Number(report.learningV2?.batchLearning?.pending) || 0
      : Number(report.batchPending) || 0;

  const gateAccepted =
    id === "chess"
      ? Number(report.learningV2?.agreementGate?.accepted) || 0
      : Number(report.gateAccepted) || 0;

  const gateRejected =
    id === "chess"
      ? Number(report.learningV2?.agreementGate?.rejected) || 0
      : Number(report.gateRejected) || 0;

  const spacetime = report.spacetimeSample || null;

  return Object.freeze({
    discipline: id,
    armed: movesSeen > 0 || batchesFlushed > 0 || gateAccepted > 0,
    movesSeen,
    batchesFlushed,
    batchPending,
    gateAccepted,
    gateRejected,
    causalSpaceId: spacetime?.causalSpaceId ?? null,
    channelId: spacetime?.worldAnchor?.channelId ?? null
  });
}

/**
 * @param {Readonly<Record<string, { movesSeen: number }>>} disciplines
 */
export function resolveAcademyDominantDisciplineV0(disciplines) {
  let dominant = null;
  let maxMoves = 0;
  for (const id of ACADEMY_DISCIPLINE_IDS_V0) {
    const moves = Number(disciplines[id]?.movesSeen) || 0;
    if (moves > maxMoves) {
      maxMoves = moves;
      dominant = id;
    }
  }
  return maxMoves > 0 ? dominant : null;
}

/**
 * @param {string[]} armedDisciplines
 */
export function resolveAcademyUnionLabelV0(armedDisciplines) {
  const count = armedDisciplines.length;
  if (count === 0) return "dormant";
  if (count === 1) return `${armedDisciplines[0]}_solo`;
  if (count === ACADEMY_DISCIPLINE_IDS_V0.length) return "triad_active";
  return "multi_active";
}

/**
 * Build union report from live discipline observability (no fabricated totals).
 */
export function buildRhizohAcademyLearningUnionReportV0() {
  const chessReport = buildRhizohChessLearningReportV0();
  const goReport = buildRhizohGoLearningReportV0();
  const checkersReport = buildRhizohCheckersLearningReportV0();

  const disciplines = Object.freeze({
    chess: summarizeAcademyDisciplineV0("chess", chessReport),
    go: summarizeAcademyDisciplineV0("go", goReport),
    checkers: summarizeAcademyDisciplineV0("checkers", checkersReport)
  });

  const armedDisciplines = ACADEMY_DISCIPLINE_IDS_V0.filter((id) => disciplines[id].armed);
  const totalMovesSeen = ACADEMY_DISCIPLINE_IDS_V0.reduce(
    (sum, id) => sum + disciplines[id].movesSeen,
    0
  );
  const totalBatchesFlushed = ACADEMY_DISCIPLINE_IDS_V0.reduce(
    (sum, id) => sum + disciplines[id].batchesFlushed,
    0
  );

  return Object.freeze({
    schema: RHIZOH_ACADEMY_LEARNING_UNION_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    horizon: "session_v0",
    unionLabel: resolveAcademyUnionLabelV0(armedDisciplines),
    dominantDiscipline: resolveAcademyDominantDisciplineV0(disciplines),
    armedDisciplineCount: armedDisciplines.length,
    armedDisciplines: Object.freeze([...armedDisciplines]),
    totalMovesSeen,
    totalBatchesFlushed,
    disciplines,
    digests: Object.freeze({
      chess: Object.freeze({
        schema: chessReport.schema,
        gamesObserved: chessReport.gamesObserved,
        totalMovesSeen: chessReport.totalMovesSeen,
        stockfishAgreement: chessReport.stockfishAgreement
      }),
      go: Object.freeze({
        schema: goReport.schema,
        movesSeen: goReport.movesSeen,
        arenaMoveCount: goReport.arenaMoveCount,
        boardHash: goReport.boardHash
      }),
      checkers: Object.freeze({
        schema: checkersReport.schema,
        movesSeen: checkersReport.movesSeen,
        arenaMoveCount: checkersReport.arenaMoveCount,
        boardHash: checkersReport.boardHash
      })
    }),
    atMs: Date.now()
  });
}
