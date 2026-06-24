/**
 * Rhizoh Director Engine v1 — event → scene timeline (interpretation only).
 * Rhizoh = director · Studio = edit desk · Sora = render layer (stub).
 * RESEARCH-ONLY — no execution authority · no video API calls.
 */

import { getChessLearningMonitorSnapshotV0 } from "./chessLearningMonitorV0.js";
import { buildRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";
import { buildRhizohStudioVisibilitySnapshotV0 } from "./rhizohStudioVisibilitySnapshotV0.js";
import { buildRhizohChessObservationShortCaptureV0 } from "./rhizohChessObservationShortCaptureV0.js";
import { getWorldSportsTubeSnapshotV0 } from "./worldSportsMediaTubeWireV0.js";

export const RHIZOH_DIRECTOR_ENGINE_SCHEMA_V0 = "castle.rhizoh.director_engine.v0";

/** Policy drift above this → hard scene change (interpretation heuristic). */
export const DIRECTOR_DRIFT_CUT_THRESHOLD_V0 = 0.65;

export const DIRECTOR_SCENE_KIND_V0 = Object.freeze({
  CHESS_MOVE: "chess_move",
  DRIFT_CUT: "drift_cut",
  MEMORY_ANCHOR: "memory_anchor",
  HABITAT_SHIFT: "habitat_shift",
  WORLD_SPORTS_PULSE: "world_sports_pulse",
  PROGRAM_BEAT: "program_beat"
});

/**
 * @param {object} row
 */
function freezeSceneV0(row) {
  return Object.freeze({ ...row });
}

/**
 * @param {"en"|"tr"} locale
 */
function buildLiveEventScenesV0(locale) {
  const tr = locale === "tr";
  const monitor = getChessLearningMonitorSnapshotV0("director");
  const report = buildRhizohChessLearningReportV0();
  const studio = buildRhizohStudioVisibilitySnapshotV0();
  const sports = getWorldSportsTubeSnapshotV0({ locale });
  const scenes = [];

  for (const move of (monitor.recentMoves || []).slice(-4)) {
    scenes.push(
      freezeSceneV0({
        kind: DIRECTOR_SCENE_KIND_V0.CHESS_MOVE,
        source: "chess_arena",
        trigger: "cluster_move",
        cutType: move.critical ? "hard_cut" : "soft_cut",
        label: move.san || "move",
        atMs: move.atMs || Date.now(),
        narratorHint: tr
          ? `${move.san || "hamle"} · ${move.engine || "cluster"}`
          : `${move.san || "move"} · ${move.engine || "cluster"}`
      })
    );
  }

  const lastDiff = (monitor.recentPolicyDiffs || []).slice(-1)[0];
  const driftScore = lastDiff?.drifted ? 1 : report.avgDrift != null ? Number(report.avgDrift) : 0;
  if (lastDiff?.drifted || driftScore >= DIRECTOR_DRIFT_CUT_THRESHOLD_V0) {
    scenes.push(
      freezeSceneV0({
        kind: DIRECTOR_SCENE_KIND_V0.DRIFT_CUT,
        source: "chess_learning",
        trigger: "drift_threshold",
        cutType: "scene_change",
        label: tr ? "drift kesimi" : "drift cut",
        driftScore,
        atMs: lastDiff?.atMs || Date.now(),
        narratorHint: tr
          ? `Drift gözlemi · uyum ${monitor.measurement?.alignmentRate ?? "—"}`
          : `Drift observation · alignment ${monitor.measurement?.alignmentRate ?? "—"}`
      })
    );
  }

  if (studio.worldBridge?.memoryNodeCount > 0) {
    scenes.push(
      freezeSceneV0({
        kind: DIRECTOR_SCENE_KIND_V0.MEMORY_ANCHOR,
        source: "world_bridge",
        trigger: "memory_graph",
        cutType: "narrative_anchor",
        label: tr ? "hafıza ankrajı" : "memory anchor",
        nodeCount: studio.worldBridge.memoryNodeCount,
        atMs: Date.now(),
        narratorHint: tr
          ? `${studio.worldBridge.memoryNodeCount} düğüm · World Bridge`
          : `${studio.worldBridge.memoryNodeCount} nodes · World Bridge`
      })
    );
  }

  if (studio.habitatClimate?.climateLabel) {
    scenes.push(
      freezeSceneV0({
        kind: DIRECTOR_SCENE_KIND_V0.HABITAT_SHIFT,
        source: "habitat",
        trigger: "climate_label",
        cutType: "soft_cut",
        label: studio.habitatClimate.climateLabel,
        atMs: Date.now(),
        narratorHint: tr
          ? `İklim: ${studio.habitatClimate.climateLabel}`
          : `Climate: ${studio.habitatClimate.climateLabel}`
      })
    );
  }

  if (sports.liveMatchCount > 0 || sports.pinCount > 0) {
    const top = sports.recentChips?.[0];
    scenes.push(
      freezeSceneV0({
        kind: DIRECTOR_SCENE_KIND_V0.WORLD_SPORTS_PULSE,
        source: "world_sports",
        trigger: "live_feed",
        cutType: "insert",
        label: top?.label || tr ? "canlı maç" : "live match",
        liveMatchCount: sports.liveMatchCount,
        pinCount: sports.pinCount,
        atMs: Date.now(),
        narratorHint: top?.label || (tr ? "WorldSports beslemesi" : "WorldSports feed")
      })
    );
  }

  return Object.freeze(scenes);
}

/**
 * @param {{ locale?: string }} [opts]
 */
export function buildRhizohDirectorTimelineV0(opts = {}) {
  const locale = opts.locale === "tr" ? "tr" : "en";
  const chessProgram = buildRhizohChessObservationShortCaptureV0({ locale });
  const liveScenes = buildLiveEventScenesV0(locale);

  const programScenes = Object.freeze(
    chessProgram.shotList.map((beat) =>
      freezeSceneV0({
        kind: DIRECTOR_SCENE_KIND_V0.PROGRAM_BEAT,
        source: "chess_short_001",
        trigger: "program",
        cutType: "beat",
        beatId: beat.id,
        durationSec: beat.durationSec,
        label: beat.scene,
        captureUrl: beat.captureUrl,
        consoleHook: beat.consoleHook,
        narratorHint: beat.narratorLine,
        atMs: Date.now()
      })
    )
  );

  const scenes = Object.freeze([...liveScenes, ...programScenes]);

  return Object.freeze({
    schema: RHIZOH_DIRECTOR_ENGINE_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    mode: "director_v1",
    locale,
    sceneCount: scenes.length,
    liveSceneCount: liveScenes.length,
    programSceneCount: programScenes.length,
    scenes,
    program: Object.freeze({
      id: "chess_observation_001",
      readyToRecord: chessProgram.readyToRecord,
      durationSecTarget: chessProgram.durationSecTarget
    }),
    cutTriggers: Object.freeze({
      driftCutArmed: liveScenes.some((s) => s.kind === DIRECTOR_SCENE_KIND_V0.DRIFT_CUT),
      chessMovesSeen: chessProgram.digest.movesSeen,
      memoryAnchored: liveScenes.some((s) => s.kind === DIRECTOR_SCENE_KIND_V0.MEMORY_ANCHOR),
      worldSportsLive: liveScenes.some((s) => s.kind === DIRECTOR_SCENE_KIND_V0.WORLD_SPORTS_PULSE)
    }),
    renderLayer: Object.freeze({
      sora: "stub_only",
      apiAvailable: false,
      honestLabel: "Sora = render layer stub · prompt compiler only · no Sora EP"
    }),
    atMs: Date.now()
  });
}
