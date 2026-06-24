/**
 * Studio V1 visibility snapshot — aggregates Life OS observation layer for UI.
 * RESEARCH-ONLY — read-only digest; no execution authority.
 */

import { buildLifeOsV01StatusSnapshotV0 } from "./lifeOsV01StatusV0.js";
import {
  getWorldBridgeMemoryGraphSnapshotV0,
  listWorldBridgeMemoryNodesV0
} from "./worldBridgeMemoryGraphV0.js";
import { getWorldBridgeShadowTraceBridgeSnapshotV0 } from "./worldBridgeShadowTraceBridgeV0.js";
import { buildHabitatClimateSnapshotV0 } from "./habitatClimatePatternEngineV0.js";
import {
  getCrossSpaceFusionLaneAuditV0,
  getCrossSpaceFusionSnapshotV0
} from "./crossSpaceCausalFusionV0.js";
import { buildCalendarShadowTimelineViewV0 } from "./calendarShadowTimelineV0.js";
import { buildMediaShadowTimelineViewV0 } from "./mediaShadowTimelineV0.js";
import { buildLifeShadowDayBranchComparisonV0 } from "./lifeShadowDayBranchesV0.js";
import { buildRhizohChessLearningCameraV0 } from "./rhizohChessLearningCameraV0.js";
import { buildRhizohGoLearningCameraV0 } from "./rhizohGoLearningCameraV0.js";
import { buildRhizohCheckersLearningCameraV0 } from "./rhizohCheckersLearningCameraV0.js";
import { buildRhizohAcademyLearningUnionReportV0 } from "./rhizohAcademyLearningUnionReportV0.js";

export const RHIZOH_STUDIO_VISIBILITY_SCHEMA_V0 = "castle.rhizoh.studio_visibility.v0";

export const STUDIO_VISIBILITY_PANEL_IDS_V0 = Object.freeze([
  "life_os",
  "world_bridge_memory",
  "habitat_climate",
  "fusion_timeline",
  "learning_cameras"
]);

/**
 * Compact learning camera digest for Studio cards (no full pipeline dump).
 * @param {object} camera
 * @param {string} discipline
 */
export function summarizeStudioLearningCameraV0(camera, discipline) {
  if (!camera) {
    return Object.freeze({ discipline, armed: false, movesSeen: 0, batchPending: 0 });
  }
  const pipeline = camera.pipeline || {};
  const arena = camera.arena || {};
  const movesSeen =
    discipline === "chess"
      ? Math.max(Number(pipeline.clusterMovesSeen) || 0, Number(pipeline.movesSeen) || 0)
      : Math.max(Number(pipeline.movesSeen) || 0, Number(arena.moveCount) || 0);

  return Object.freeze({
    discipline,
    armed: movesSeen > 0 || Number(pipeline.batchesFlushed) > 0,
    movesSeen,
    batchPending: Number(pipeline.batchPending) || 0,
    batchesFlushed: Number(pipeline.batchesFlushed) || 0,
    gateAccepted: Number(pipeline.gateAccepted) || 0,
    causalSpaceId: camera.spacetime?.causalSpaceId ?? null,
    backlogHealth: camera.backlogHealth ?? null
  });
}

/**
 * Build unified Studio visibility snapshot from live runtime observability.
 */
export function buildRhizohStudioVisibilitySnapshotV0() {
  const lifeOs = buildLifeOsV01StatusSnapshotV0();
  const memory = getWorldBridgeMemoryGraphSnapshotV0();
  const memoryNodes = listWorldBridgeMemoryNodesV0({ limit: 12 });
  const shadowWriteback = getWorldBridgeShadowTraceBridgeSnapshotV0();
  const habitat = buildHabitatClimateSnapshotV0();
  const fusion = getCrossSpaceFusionSnapshotV0();
  const fusionLanes = getCrossSpaceFusionLaneAuditV0();
  const calendarShadow = buildCalendarShadowTimelineViewV0();
  const mediaShadow = buildMediaShadowTimelineViewV0();
  const lifeShadowDayAb = buildLifeShadowDayBranchComparisonV0();

  const chessCamera = buildRhizohChessLearningCameraV0();
  const goCamera = buildRhizohGoLearningCameraV0();
  const checkersCamera = buildRhizohCheckersLearningCameraV0();
  const academyUnion = buildRhizohAcademyLearningUnionReportV0();

  const learningCameras = Object.freeze({
    chess: summarizeStudioLearningCameraV0(chessCamera, "chess"),
    go: summarizeStudioLearningCameraV0(goCamera, "go"),
    checkers: summarizeStudioLearningCameraV0(checkersCamera, "checkers")
  });

  const armedLearningCount = ["chess", "go", "checkers"].filter(
    (id) => learningCameras[id].armed
  ).length;

  return Object.freeze({
    schema: RHIZOH_STUDIO_VISIBILITY_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    headline: lifeOs.honestLabel,
    lifeOsStatus: lifeOs.status,
    armedLearningCount,
    lifeOs,
    worldBridge: Object.freeze({
      memoryNodeCount: memory.nodeCount,
      memoryBySource: memory.bySource,
      recentNodes: Object.freeze(memoryNodes),
      shadowProjectionCount: shadowWriteback.projectionCount,
      calendarShadowEvents: calendarShadow.eventCount,
      mediaShadowEvents: mediaShadow.eventCount,
      dayADominant: lifeShadowDayAb.comparison.dominantBranch
    }),
    habitatClimate: Object.freeze({
      horizon: habitat.horizon,
      climateLabel: habitat.identity?.climateLabel ?? null,
      dominantBranch: habitat.pattern?.dominantBranch ?? null,
      dayAShare01: habitat.pattern?.dayAShare01 ?? null,
      memoryNodeCount: habitat.evolution?.memoryNodeCount ?? 0,
      calendarLane: habitat.evolution?.calendarLane ?? false,
      mediaLane: habitat.evolution?.mediaLane ?? false
    }),
    fusionTimeline: Object.freeze({
      fusionSeq: fusion.fusionSeq,
      calendarPresent: fusionLanes.calendar.present,
      mediaPresent: fusionLanes.media.present,
      userActivityPresent: fusionLanes.userActivity.present,
      recentFusions: fusion.recentFusions,
      lastFusionAtMs: fusion.lastFusion?.atMs ?? null
    }),
    learningCameras,
    academyUnion: Object.freeze({
      unionLabel: academyUnion.unionLabel,
      dominantDiscipline: academyUnion.dominantDiscipline,
      totalMovesSeen: academyUnion.totalMovesSeen
    }),
    panels: STUDIO_VISIBILITY_PANEL_IDS_V0,
    atMs: Date.now()
  });
}
