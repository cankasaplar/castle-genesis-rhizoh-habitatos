/**
 * Life OS v0.1 status observability — honest closure snapshot from live runtime.
 * RESEARCH-ONLY — interpretation only; not execution authority.
 */

import { getExecutionPermissionLayerSnapshotV0 } from "./executionPermissionLayerV0.js";
import { getWorldBridgeMemoryGraphSnapshotV0 } from "./worldBridgeMemoryGraphV0.js";
import { getWorldBridgeShadowTraceBridgeSnapshotV0 } from "./worldBridgeShadowTraceBridgeV0.js";
import { buildHabitatClimateSnapshotV0 } from "./habitatClimatePatternEngineV0.js";
import { getCalendarEventAdapterSnapshotV0 } from "./calendarEventAdapterV0.js";
import { getMediaEventAdapterSnapshotV0 } from "./mediaEventAdapterV0.js";
import { getUserActivityAdapterSnapshotV0 } from "./userActivityEventAdapterV0.js";
import { buildRhizohAcademyLearningUnionReportV0 } from "./rhizohAcademyLearningUnionReportV0.js";
import { getGoLearningTubeSnapshotV0 } from "./goLearningMediaTubeWireV0.js";
import { getCheckersLearningTubeSnapshotV0 } from "./checkersLearningMediaTubeWireV0.js";

export const RHIZOH_LIFE_OS_V01_STATUS_SCHEMA_V0 = "castle.rhizoh.life_os_v0_1_status.v0";

export const LIFE_OS_V01_SCOPE_DELIVERED_V0 = Object.freeze([
  "world_bridge_layer_2",
  "memory_graph",
  "habitat_climate_session",
  "shadow_governance",
  "interpretation_only_boundary"
]);

export const LIFE_OS_V01_SCOPE_EXCLUDED_V0 = Object.freeze([
  "autonomous_scheduling",
  "executive_decision_engine",
  "life_automation",
  "nine_lane_habitat",
  "full_spatial_activation"
]);

/**
 * Build Life OS v0.1 closure status from live observability (no fabricated totals).
 */
export function buildLifeOsV01StatusSnapshotV0() {
  const permission = getExecutionPermissionLayerSnapshotV0();
  const memory = getWorldBridgeMemoryGraphSnapshotV0();
  const shadowWriteback = getWorldBridgeShadowTraceBridgeSnapshotV0();
  const habitat = buildHabitatClimateSnapshotV0();
  const calendar = getCalendarEventAdapterSnapshotV0();
  const media = getMediaEventAdapterSnapshotV0();
  const userActivity = getUserActivityAdapterSnapshotV0();
  const academy = buildRhizohAcademyLearningUnionReportV0();
  const goTube = getGoLearningTubeSnapshotV0();
  const checkersTube = getCheckersLearningTubeSnapshotV0();

  const worldBridgeLanesLive =
    (calendar.recentCount || 0) > 0 ||
    (media.recentCount || 0) > 0 ||
    (userActivity.recentCount || 0) > 0;

  const goParity =
    typeof goTube.moveCount === "number" &&
    Boolean(goTube.spacetime?.causalSpaceId) &&
    academy.disciplines.go.armed !== undefined;

  const checkersParity =
    typeof checkersTube.moveCount === "number" &&
    Boolean(checkersTube.spacetime?.causalSpaceId) &&
    academy.disciplines.checkers.armed !== undefined;

  const achieved =
    worldBridgeLanesLive || memory.nodeCount > 0 || habitat.evolution?.memoryNodeCount > 0;

  return Object.freeze({
    schema: RHIZOH_LIFE_OS_V01_STATUS_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    status: achieved ? "ACHIEVED" : "DORMANT",
    honestLabel: "World Bridge observation layer — not executive Life OS",
    scope: Object.freeze({
      delivered: LIFE_OS_V01_SCOPE_DELIVERED_V0,
      excluded: LIFE_OS_V01_SCOPE_EXCLUDED_V0
    }),
    worldBridge: Object.freeze({
      calendarEvents: calendar.recentCount,
      mediaEvents: media.recentCount,
      userActivityEvents: userActivity.recentCount,
      memoryNodeCount: memory.nodeCount,
      memoryBySource: memory.bySource,
      shadowProjectionCount: shadowWriteback.projectionCount
    }),
    habitatClimate: Object.freeze({
      horizon: habitat.horizon,
      climateLabel: habitat.identity?.climateLabel ?? null,
      dominantBranch: habitat.pattern?.dominantBranch ?? null
    }),
    governance: Object.freeze({
      governanceMode: permission.governanceMode,
      mutationPermitted: permission.mutationPermitted,
      admissionVerdict: habitat.identity?.admissionVerdict ?? "hold",
      executionClass: permission.executionClass
    }),
    academy: Object.freeze({
      unionLabel: academy.unionLabel,
      goParity,
      checkersParity,
      chessMovesSeen: academy.disciplines.chess.movesSeen,
      goMovesSeen: academy.disciplines.go.movesSeen,
      checkersMovesSeen: academy.disciplines.checkers.movesSeen
    }),
    atMs: Date.now()
  });
}

export function ensureLifeOsV01StatusDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.lifeOsStatus = () => buildLifeOsV01StatusSnapshotV0();
  return window.__rhizoh.lifeOsStatus;
}

/** @internal vitest */
export function resetLifeOsV01StatusForTestV0() {
  /* stateless — noop */
}
