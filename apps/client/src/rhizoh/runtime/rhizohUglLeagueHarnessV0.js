/**
 * UGL League Harness v0 — Stockfish tier ladder + training cohort.
 * Not about winning — collects Position / Expected / Played / EvalDelta / Outcome.
 * RESEARCH-ONLY
 */

import { CHESS_STOCKFISH_PRESET_V0 } from "./chessStockfishPresetsV0.js";
import { getUglTrainingRecordSnapshotV0, readUglTrainingRecordsV0 } from "./rhizohUglTrainingRecordV0.js";
import { buildRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";

export const RHIZOH_UGL_LEAGUE_HARNESS_SCHEMA_V0 = "castle.rhizoh.ugl_league_harness.v0";
export const RHIZOH_UGL_LEAGUE_TIERS_V0 = Object.freeze([
  "WARMUP",
  "TEACHER_BACKUP",
  "ARENA",
  "STRONG",
  "MAX"
]);

const TIER_PROMOTION_ACCURACY_V0 = Object.freeze({
  WARMUP: 0.35,
  TEACHER_BACKUP: 0.45,
  ARENA: 0.55,
  STRONG: 0.65,
  MAX: 1
});

let activeTierIndexV0 = 2;

/**
 * @param {number} accuracy
 */
export function resolveUglLeagueTierIndexV0(accuracy = null) {
  if (accuracy == null) return activeTierIndexV0;
  let idx = 0;
  for (let i = 0; i < RHIZOH_UGL_LEAGUE_TIERS_V0.length; i += 1) {
    const tier = RHIZOH_UGL_LEAGUE_TIERS_V0[i];
    const threshold = TIER_PROMOTION_ACCURACY_V0[tier] ?? 1;
    if (accuracy >= threshold) idx = i;
  }
  activeTierIndexV0 = Math.max(activeTierIndexV0, idx);
  return activeTierIndexV0;
}

export function getActiveUglLeagueTierV0() {
  return RHIZOH_UGL_LEAGUE_TIERS_V0[activeTierIndexV0] || "ARENA";
}

export function getUglLeagueTierPresetV0(tierId = getActiveUglLeagueTierV0()) {
  const preset = CHESS_STOCKFISH_PRESET_V0[tierId] || CHESS_STOCKFISH_PRESET_V0.ARENA;
  return Object.freeze({
    tierId,
    skill: preset.skill,
    movetimeMs: preset.movetimeMs,
    depth: preset.depth
  });
}

export function buildUglLeagueHarnessReportV0() {
  const learning = buildRhizohChessLearningReportV0();
  const accuracy = learning.predictionAccuracy;
  const tierIndex = resolveUglLeagueTierIndexV0(accuracy);
  const activeTier = RHIZOH_UGL_LEAGUE_TIERS_V0[tierIndex];
  const training = getUglTrainingRecordSnapshotV0();
  const tiers = RHIZOH_UGL_LEAGUE_TIERS_V0.map((id, i) =>
    Object.freeze({
      id,
      preset: CHESS_STOCKFISH_PRESET_V0[id] || null,
      promotionAccuracy: TIER_PROMOTION_ACCURACY_V0[id] ?? 1,
      active: i === tierIndex,
      unlocked: i <= tierIndex
    })
  );

  return Object.freeze({
    schema: RHIZOH_UGL_LEAGUE_HARNESS_SCHEMA_V0,
    note: "Collect training signal across engine tiers — win rate is not the goal",
    activeTier,
    activeTierIndex: tierIndex,
    predictionAccuracy: accuracy,
    tiers: Object.freeze(tiers),
    training,
    sampleFields: Object.freeze([
      "position",
      "expectedMove",
      "playedMove",
      "evalDelta",
      "outcome"
    ]),
    apis: Object.freeze({
      report: "window.__rhizoh.uglLeagueHarness()",
      records: "window.__rhizoh.uglTrainingRecords()",
      exportJson: "window.__rhizoh.exportUglTrainingRecordsJson()"
    }),
    atMs: Date.now()
  });
}

export function exportUglTrainingRecordsJsonV0(limit = 128) {
  const records = readUglTrainingRecordsV0(limit);
  return JSON.stringify(
    Object.freeze({
      schema: `${RHIZOH_UGL_LEAGUE_HARNESS_SCHEMA_V0}.export`,
      exportedAt: new Date().toISOString(),
      activeTier: getActiveUglLeagueTierV0(),
      records
    }),
    null,
    2
  );
}

/** @internal vitest */
export function __resetUglLeagueHarnessForTestV0() {
  activeTierIndexV0 = 2;
}
