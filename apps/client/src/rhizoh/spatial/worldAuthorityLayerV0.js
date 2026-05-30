/**
 * SPECFLOW: RESEARCH-ONLY — **World authority layer**: gerçek scene graph beslemesi,
 * engel akışı (streaming), oda ↔ dünya topolojisi eşlemesi, çok-dünya federasyonu.
 *
 * “Kim dünyayı tanımlar?” — simülasyon motorundan önce; `worldTopology` + mesh ingest + obstacle
 * authority’si tek nedensellik zincirinde toplanır (LLM değil).
 *
 * **Canlı akış (v1):** `worldAuthorityLiveStreamEngineV1.js` — sürekli sahne, engel diff, tahkim, snapshot mührü.
 *
 * **ROS katmanı (aşama 3 spec):** `realityOperatingSystemLayerV0.js` — kontrol düzlemi, arbitraj ağı, müzakere otobüsü, zaman çizelgesi.
 */

export const WORLD_AUTHORITY_LAYER_SCHEMA_V0 = "castle.rhizoh.world_authority_layer.v0";

/**
 * İnşa / güven sırası: önce sahne gerçeği, sonra engel beslemesi, sonra topoloji eşlemesi, en sonda federasyon.
 */
export const WORLD_AUTHORITY_SURFACE_STACK_V0 = Object.freeze([
  {
    id: "scene_graph_ingestion",
    title: "Real scene graph ingestion (THREE / glTF → RSK)",
    codeSurface: "studio viewport loaders + optional glTF scene reducer → kernel-side spatial cache",
    existingHooks: ["PresenceStudioViewport (THREE.Scene)", "presenceMeshIngestSlice (gateway mesh deltas)"],
    blockedBy: ["stable_asset_pipeline_uid", "scene_node_uid_registry", "mesh_delta_schema_version_lock"],
    unlocks: ["nav_static_bake_input", "occlusion_volume_query", "material_zone_tags"],
    priorityRank: 1,
    effort: "L"
  },
  {
    id: "obstacle_streaming",
    title: "Obstacle + nav sample streaming into simulation authority",
    codeSurface: "setRealSimulationDiscObstaclesV0 + onNavMeshRuntimeFeed cache + readiness consumer",
    existingHooks: [
      "realSimulationEngineCouplingV0.ts / setRealSimulationDiscObstaclesV0",
      "resolveRealWorldSpatialBindingReadinessV0"
    ],
    blockedBy: ["scene_graph_ingestion", "bandwidth_budget_per_room", "signed_obstacle_delta_source"],
    unlocks: ["collision_truth_for_fsm", "retreat_guard_non_fake"],
    priorityRank: 2,
    effort: "L"
  },
  {
    id: "room_topology_sync",
    title: "Presence room ↔ world region topology sync",
    codeSurface: "WorldTopologyState.roomBindings + region bounds + portal graph",
    existingHooks: [
      "worldTopologySlice (upsertWorldRegion / bindPresenceRoomToRegion)",
      "ensureCastleWorldTopology",
      "worldLocomotionSlice (route resolution)"
    ],
    blockedBy: ["authoritative_room_uid_namespace", "region_uid_federation_map"],
    unlocks: ["cross_room_nav_corridors", "green_room_route_binding_truth"],
    priorityRank: 3,
    effort: "M"
  },
  {
    id: "multi_world_federation",
    title: "Multi-world / multi-castle federation of topology + obstacle feeds",
    codeSurface: "globalCastleDiffReducer + identity law + cross-castle ACL on spatial deltas",
    existingHooks: ["globalCastleDiffReducerV0", "highLevelRhizohCapabilityGaps (federationIdentityHints)"],
    blockedBy: ["room_topology_sync", "federation_identity_law_runtime", "cross_castle_action_acl"],
    unlocks: ["shared_hall_obstacle_overlay", "prometheus_mesh_spatial_consistency"],
    priorityRank: 4,
    effort: "L"
  }
]);

/**
 * Dünya otoritesi — “hangi kaynak kernel state’e yazabilir?” (yüksek seviye).
 * @returns {{ nodes: string[], edges: { from: string; to: string; kind: string }[] }}
 */
export function getWorldAuthorityDependencyGraphV0() {
  return {
    nodes: [
      "gateway_mesh_stream",
      "presence_mesh_ingest",
      "studio_scene_graph_cache",
      "obstacle_stream_bus",
      "nav_readiness_bridge",
      "world_topology_store",
      "presence_room_binding",
      "federation_diff_reducer",
      "castle_identity_law",
      "simulation_kernel_nav_slot"
    ],
    edges: [
      { from: "gateway_mesh_stream", to: "presence_mesh_ingest", kind: "delta_events" },
      { from: "studio_scene_graph_cache", to: "obstacle_stream_bus", kind: "geometry_segments" },
      { from: "obstacle_stream_bus", to: "nav_readiness_bridge", kind: "constraint_truth" },
      { from: "nav_readiness_bridge", to: "simulation_kernel_nav_slot", kind: "runtime_feed" },
      { from: "world_topology_store", to: "presence_room_binding", kind: "region_bounds" },
      { from: "presence_room_binding", to: "nav_readiness_bridge", kind: "room_scope_filter" },
      { from: "federation_diff_reducer", to: "world_topology_store", kind: "merge_remote_regions_optional" },
      { from: "castle_identity_law", to: "federation_diff_reducer", kind: "acl_gate" },
      { from: "federation_diff_reducer", to: "obstacle_stream_bus", kind: "signed_overlay_optional" }
    ]
  };
}

/**
 * Minimum dünya otoritesi yolu — motorlardan önce.
 */
export function describeWorldAuthorityMinimumPathV0() {
  return {
    schema: WORLD_AUTHORITY_LAYER_SCHEMA_V0,
    phases: [
      {
        phase: 1,
        name: "Scene graph truth",
        do: "Ingest static + dynamic nodes with stable UIDs; fold mesh deltas through presenceMeshIngestSlice causal path.",
        exitCriteria: ["no anonymous mesh nodes in nav input", "roomUid stamped on spatial deltas"]
      },
      {
        phase: 2,
        name: "Obstacle authority stream",
        do: "Stream signed obstacle discs / segments per room into setRealSimulationDiscObstaclesV0 + readiness channels.",
        exitCriteria: ["obstacle source != empty stub", "replay produces identical blocked grid hash"]
      },
      {
        phase: 3,
        name: "Topology sync",
        do: "bindPresenceRoomToRegion for every presence hall; upsertWorldRegion bounds match studio floor extent.",
        exitCriteria: ["PRESENCE_HALL_HALF consistent with region bounds", "portal edges cover backstage routes"]
      },
      {
        phase: 4,
        name: "Federation overlay",
        do: "globalCastleDiffReducer applies only ACL-verified spatial/topology diffs; never raw LLM geometry.",
        exitCriteria: ["cross-castle diff has signature + castle id", "reject unsigned obstacle flood"]
      }
    ],
    explicitNonGoals: [
      "LLM as geometry authority",
      "Per-client divergent nav mesh without merge policy"
    ],
    note: "World authority sits above minimum real simulation kernel: kernel consumes; this layer owns truth ingress."
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildWorldAuthorityLayerSnapshotV0() {
  return {
    schema: WORLD_AUTHORITY_LAYER_SCHEMA_V0,
    ts: Date.now(),
    surfaceStack: WORLD_AUTHORITY_SURFACE_STACK_V0,
    dependencyGraph: getWorldAuthorityDependencyGraphV0(),
    minimumPath: describeWorldAuthorityMinimumPathV0()
  };
}
