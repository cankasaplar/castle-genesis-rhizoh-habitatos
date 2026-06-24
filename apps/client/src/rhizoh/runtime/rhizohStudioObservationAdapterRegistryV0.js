/**
 * Studio observation adapter registry — binds studioVisibility cameras to UI consumers.
 * RESEARCH-ONLY · interpretation only · no execution authority.
 *
 * Chrome console "No available adapters" = WebGPU GPU probe — NOT this registry.
 * See studioCapabilityProbeV0 / voiceInputAdapterRegistryV0.
 */

import { STUDIO_EIGHT_CAMERA_IDS_V0 } from "./rhizohStudioVisibilitySnapshotV0.js";
import { buildRhizohStudioVisibilitySnapshotV0 } from "./rhizohStudioVisibilitySnapshotV0.js";
import { buildRhizohChessLearningCameraV0 } from "./rhizohChessLearningCameraV0.js";
import { buildRhizohGoLearningCameraV0 } from "./rhizohGoLearningCameraV0.js";
import { buildRhizohCheckersLearningCameraV0 } from "./rhizohCheckersLearningCameraV0.js";
import { buildRhizohAcademyLearningUnionReportV0 } from "./rhizohAcademyLearningUnionReportV0.js";
import { buildHabitatClimateSnapshotV0 } from "./habitatClimatePatternEngineV0.js";
import {
  getWorldBridgeMemoryGraphSnapshotV0,
  listWorldBridgeMemoryNodesV0
} from "./worldBridgeMemoryGraphV0.js";
import { getWorldSportsTubeSnapshotV0 } from "./worldSportsMediaTubeWireV0.js";
import { resolveWorldLayerActivationStatusV0 } from "./rhizohWorldLayerActivationStatusV0.js";
import { getChessLearningMonitorSnapshotV0 } from "./chessLearningMonitorV0.js";
import { isChessGameClusterRunningV0 } from "./chessGameClusterV0.js";

export const STUDIO_OBSERVATION_ADAPTER_SCHEMA_V0 =
  "castle.rhizoh.studio_observation_adapter_registry.v0";

export const STUDIO_OBSERVATION_ADAPTER_KIND_V0 = Object.freeze({
  VISUAL_ARENA: "visual_arena",
  FEED_ARENA: "feed_arena",
  SPARSE_ARENA: "sparse_arena",
  CLIMATE: "climate",
  GRAPH: "graph",
  UNION_DIGEST: "union_digest",
  LIVE_FEED: "live_feed",
  HELD_PLACEHOLDER: "held_placeholder"
});

export const STUDIO_OBSERVATION_ADAPTER_WEBGPU_NOTE_V0 =
  "Chrome 'No available adapters' = WebGPU GPU probe — studio observation adapters are separate.";

/** @type {Readonly<Record<string, { id: string, kind: string, cameraId: string }>>} */
const ADAPTER_DEFS_V0 = Object.freeze({
  chess_arena: Object.freeze({
    id: "chess_arena",
    cameraId: "chess_arena",
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.VISUAL_ARENA
  }),
  go_arena: Object.freeze({
    id: "go_arena",
    cameraId: "go_arena",
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.FEED_ARENA
  }),
  checkers_arena: Object.freeze({
    id: "checkers_arena",
    cameraId: "checkers_arena",
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.SPARSE_ARENA
  }),
  habitat: Object.freeze({
    id: "habitat",
    cameraId: "habitat",
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.CLIMATE
  }),
  memory: Object.freeze({
    id: "memory",
    cameraId: "memory",
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.GRAPH
  }),
  academy: Object.freeze({
    id: "academy",
    cameraId: "academy",
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.UNION_DIGEST
  }),
  world_sports: Object.freeze({
    id: "world_sports",
    cameraId: "world_sports",
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.LIVE_FEED
  }),
  spatial: Object.freeze({
    id: "spatial",
    cameraId: "spatial",
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.HELD_PLACEHOLDER
  })
});

function buildChessAdapterFrameV0() {
  const monitor = getChessLearningMonitorSnapshotV0("studio_adapter");
  const camera = buildRhizohChessLearningCameraV0();
  const spectator = monitor.spectator;
  const recentMoves = (monitor.recentMoves || []).slice(-4).map((m) => m.san).filter(Boolean);
  const movesSeen = Math.max(
    Number(camera.pipeline?.clusterMovesSeen) || 0,
    Number(camera.pipeline?.movesSeen) || 0,
    monitor.measurement?.movesMeasured || 0
  );
  const clusterRunning = isChessGameClusterRunningV0() || Boolean(monitor.clusterRunning);

  return Object.freeze({
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.VISUAL_ARENA,
    armed: movesSeen > 0 || clusterRunning,
    consumerReady: true,
    clusterRunning,
    movesSeen,
    fen: spectator?.fen ?? null,
    ply: spectator?.ply ?? 0,
    lastMove: spectator?.lastMove?.san ?? recentMoves[recentMoves.length - 1] ?? null,
    recentMoves: Object.freeze(recentMoves),
    alignmentRate: monitor.measurement?.alignmentRate ?? null
  });
}

function buildGoAdapterFrameV0() {
  const camera = buildRhizohGoLearningCameraV0();
  const movesSeen = Number(camera.pipeline?.movesSeen) || Number(camera.arena?.moveCount) || 0;

  return Object.freeze({
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.FEED_ARENA,
    armed: movesSeen > 0,
    consumerReady: true,
    movesSeen,
    stoneCount: camera.arena?.stoneCount ?? 0,
    activeColor: camera.arena?.activeColor ?? null,
    boardHash: camera.arena?.boardHash ?? null,
    causalSpaceId: camera.spacetime?.causalSpaceId ?? null
  });
}

function buildCheckersAdapterFrameV0() {
  const camera = buildRhizohCheckersLearningCameraV0();
  const movesSeen = Number(camera.pipeline?.movesSeen) || Number(camera.arena?.moveCount) || 0;

  return Object.freeze({
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.SPARSE_ARENA,
    armed: movesSeen > 0,
    consumerReady: true,
    movesSeen,
    causalSpaceId: camera.spacetime?.causalSpaceId ?? null
  });
}

function buildHabitatAdapterFrameV0() {
  const habitat = buildHabitatClimateSnapshotV0();
  const label = habitat.identity?.climateLabel ?? null;

  return Object.freeze({
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.CLIMATE,
    armed: Boolean(label),
    consumerReady: true,
    climateLabel: label,
    horizon: habitat.horizon ?? null,
    dominantBranch: habitat.pattern?.dominantBranch ?? null,
    dayAShare01: habitat.pattern?.dayAShare01 ?? null
  });
}

function buildMemoryAdapterFrameV0() {
  const graph = getWorldBridgeMemoryGraphSnapshotV0();
  const nodes = listWorldBridgeMemoryNodesV0({ limit: 4 });

  return Object.freeze({
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.GRAPH,
    armed: graph.nodeCount > 0,
    consumerReady: true,
    nodeCount: graph.nodeCount,
    bySource: graph.bySource,
    nodes: Object.freeze(
      nodes.map((n) =>
        Object.freeze({
          id: n.id,
          source: n.source,
          title: n.title || n.branchId || "—"
        })
      )
    )
  });
}

function buildAcademyAdapterFrameV0() {
  const union = buildRhizohAcademyLearningUnionReportV0();

  return Object.freeze({
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.UNION_DIGEST,
    armed: union.armedDisciplineCount > 0,
    consumerReady: true,
    unionLabel: union.unionLabel,
    dominantDiscipline: union.dominantDiscipline,
    totalMovesSeen: union.totalMovesSeen,
    armedDisciplineCount: union.armedDisciplineCount
  });
}

function buildWorldSportsAdapterFrameV0() {
  const sports = getWorldSportsTubeSnapshotV0();
  const live = sports?.liveMatchCount ?? 0;
  const pins = sports?.pinCount ?? 0;

  return Object.freeze({
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.LIVE_FEED,
    armed: live > 0 || pins > 0,
    consumerReady: true,
    feedEmpty: live === 0 && pins === 0,
    liveMatchCount: live,
    pinCount: pins,
    recentChips: Object.freeze((sports?.recentChips || []).slice(0, 4)),
    feedFetchedAt: sports?.feedFetchedAt ?? null
  });
}

function buildSpatialAdapterFrameV0() {
  const world = resolveWorldLayerActivationStatusV0();

  return Object.freeze({
    kind: STUDIO_OBSERVATION_ADAPTER_KIND_V0.HELD_PLACEHOLDER,
    armed: false,
    consumerReady: true,
    legalHold: true,
    phase: world?.phase ?? null
  });
}

const FRAME_BUILDERS_V0 = Object.freeze({
  chess_arena: buildChessAdapterFrameV0,
  go_arena: buildGoAdapterFrameV0,
  checkers_arena: buildCheckersAdapterFrameV0,
  habitat: buildHabitatAdapterFrameV0,
  memory: buildMemoryAdapterFrameV0,
  academy: buildAcademyAdapterFrameV0,
  world_sports: buildWorldSportsAdapterFrameV0,
  spatial: buildSpatialAdapterFrameV0
});

/**
 * @param {string} cameraId
 */
export function buildStudioObservationAdapterFrameV0(cameraId) {
  const def = ADAPTER_DEFS_V0[cameraId];
  const build = FRAME_BUILDERS_V0[cameraId];
  if (!def || !build) {
    return Object.freeze({
      id: cameraId,
      kind: "unknown",
      armed: false,
      consumerReady: false
    });
  }
  const frame = build();
  return Object.freeze({
    id: def.id,
    cameraId: def.cameraId,
    ...frame
  });
}

export function listStudioObservationAdapterIdsV0() {
  return [...STUDIO_EIGHT_CAMERA_IDS_V0];
}

export function getStudioObservationAdapterRegistrySnapshotV0() {
  const studio = buildRhizohStudioVisibilitySnapshotV0();
  const adapters = Object.freeze(
    Object.fromEntries(
      STUDIO_EIGHT_CAMERA_IDS_V0.map((id) => {
        const def = ADAPTER_DEFS_V0[id];
        const frame = buildStudioObservationAdapterFrameV0(id);
        const camera = studio.eightCameras[id] || { id, armed: false };
        return [
          id,
          Object.freeze({
            ...def,
            ...frame,
            cameraArmed: Boolean(camera.armed),
            camera
          })
        ];
      })
    )
  );

  const consumerReadyCount = Object.values(adapters).filter((a) => a.consumerReady).length;
  const armedCount = Object.values(adapters).filter((a) => a.armed || a.cameraArmed).length;

  return Object.freeze({
    schema: STUDIO_OBSERVATION_ADAPTER_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    hydrated: true,
    adapterCount: STUDIO_EIGHT_CAMERA_IDS_V0.length,
    consumerReadyCount,
    armedCount,
    webGpuNote: STUDIO_OBSERVATION_ADAPTER_WEBGPU_NOTE_V0,
    adapters,
    studioVisibilitySchema: studio.schema,
    atMs: Date.now()
  });
}
