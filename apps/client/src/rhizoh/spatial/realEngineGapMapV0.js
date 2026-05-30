/**
 * SPECFLOW: RESEARCH-ONLY — **Real engine gap map**: hangi stub önce motor olmalı,
 * hangi bağımlılık blokluyor, “true simulation layer” için minimum sıra.
 *
 * Tahmin değil ürün kararı — mevcut kod omurgasına (readiness, coupling, presence, coherence) göre sıralanır.
 */

export const REAL_ENGINE_GAP_MAP_SCHEMA_V0 = "castle.rhizoh.real_engine_gap_map.v0";

/** Önce motor — blokaj çözülünce açılan yüzeyler. */
export const REAL_ENGINE_STUB_PRIORITY_STACK_V0 = Object.freeze([
    {
      id: "nav_collision_feed",
      title: "Nav mesh + obstacle segment feed → readiness",
      stubSurface: "resolveRealWorldSpatialBindingReadinessV0 + obstacleAwarenessStub",
      blockedBy: ["studio_world_obstacle_authoring", "nav_mesh_bake_or_stream"],
      unlocks: ["path_fsm_integration", "occlusion_aware_look_at", "retreat_guard_truth"],
      priorityRank: 1,
      effort: "L"
    },
    {
      id: "locomotion_fsm_tick",
      title: "Locomotion FSM tick → presence projection / entity velocity",
      stubSurface: "ghostPetLocomotionFsmStub + somaticExecutionCoupling onFsmToTransform",
      blockedBy: ["nav_collision_feed", "deterministic_tick_clock_shared_with_coherence"],
      unlocks: ["acceleration_continuity", "path_memory", "multi_pet_non_overlapping_paths"],
      priorityRank: 2,
      effort: "L"
    },
    {
      id: "quaternion_look_at",
      title: "Quaternion look-at + smooth lock (pet + avatar)",
      stubSurface: "ghostPetLookAtSolverStub + coupling onLookAtQuaternionSolve",
      blockedBy: ["stable_three_context_in_handlers", "target_position_per_frame"],
      unlocks: ["head_aim_rig", "eye_tracking", "predictive_gaze"],
      priorityRank: 3,
      effort: "M"
    },
    {
      id: "flock_spacing_solver",
      title: "Multi-pet flock / attention competition",
      stubSurface: "ghostPetMultiPetSocialPhysicsStub + coupling onFlockSolverStep",
      blockedBy: ["nav_collision_feed", "per_pet_uid_world_state", "locomotion_fsm_tick"],
      unlocks: ["social_grouping", "pet_to_pet_signaling"],
      priorityRank: 4,
      effort: "L"
    },
    {
      id: "prometheus_agent_ecology",
      title: "Long-running independent agents (Prometheus mesh)",
      stubSurface: "highLevelRhizohCapabilityGaps / multi-agent flags",
      blockedBy: ["federation_identity_law_runtime", "agent_lifecycle_store", "cross_castle_action_acl"],
      unlocks: ["operator_parallel_agents", "shared_coherence_field_writes"],
      priorityRank: 5,
      effort: "L"
    },
    {
      id: "studio_autonomous_director",
      title: "Clip + scene + publish motor",
      stubSurface: "autonomousStudioDirectorIntentV0 + YouTube feedback",
      blockedBy: ["media_pipeline_binding", "scene_graph_timeline_store"],
      unlocks: ["publishing_intelligence_closed_loop"],
      priorityRank: 6,
      effort: "L"
    }
]);

/**
 * Sistem bağımlılığı — “kim kimi bekliyor” (yüksek seviye).
 * @returns {{ nodes: string[], edges: { from: string, to: string, kind: string }[] }}
 */
export function getSimulationLayerDependencyGraphV0() {
  return {
    nodes: [
      "coherence_kernel",
      "presence_projection",
      "spatial_readiness_bridge",
      "somatic_coupling_tick",
      "nav_obstacle_feed",
      "locomotion_fsm",
      "look_at_solver",
      "flock_solver",
      "llm_gateway"
    ],
    edges: [
      { from: "coherence_kernel", to: "presence_projection", kind: "intent_focus_peers" },
      { from: "presence_projection", to: "spatial_readiness_bridge", kind: "transforms_room_bounds" },
      { from: "spatial_readiness_bridge", to: "nav_obstacle_feed", kind: "readiness_missing_channels" },
      { from: "nav_obstacle_feed", to: "locomotion_fsm", kind: "valid_samples" },
      { from: "locomotion_fsm", to: "presence_projection", kind: "write_transform_delta" },
      { from: "somatic_coupling_tick", to: "look_at_solver", kind: "frame_order" },
      { from: "somatic_coupling_tick", to: "flock_solver", kind: "frame_order" },
      { from: "flock_solver", to: "presence_projection", kind: "pet_offsets" },
      { from: "coherence_kernel", to: "llm_gateway", kind: "rails_only_no_sim" }
    ]
  };
}

/**
 * Minimum “true simulation layer” — tek hatlı yol (motor değil, sıra sözleşmesi).
 */
export function describeMinimumTrueSimulationLayerPathV0() {
  return {
    schema: REAL_ENGINE_GAP_MAP_SCHEMA_V0,
    phases: [
      {
        phase: 1,
        name: "World feed",
        do: "Obstacle segments + nav mesh (or conservative AABB grid) written into readiness consumer; coupling onNavMeshRuntimeFeed updates cache.",
        exitCriteria: ["readiness01 >= 0.72 without fake obstacles:[]", "collision_resolve_tick fed"]
      },
      {
        phase: 2,
        name: "Integrate FSM output",
        do: "FSM consumes nav samples + coherence locomotionHint; writes target velocity or snapped position into AvatarEntity.projection / pet slot via guarded reducer.",
        exitCriteria: ["no teleport across zones without transition", "dtMs bounded coupling"]
      },
      {
        phase: 3,
        name: "Look-at truth",
        do: "onLookAtQuaternionSolve reads pet+target world positions from presence; slerp toward target; head/eyes later.",
        exitCriteria: ["pet.rotY replaced or quaternion blended", "smooth lock error metric < threshold"]
      },
      {
        phase: 4,
        name: "Flock coupling",
        do: "onFlockSolverStep adjusts pet transforms before presenceWithSyncedPetTransforms; respects nav blocked cells.",
        exitCriteria: ["N pets min separation in hall", "attention competition resolves without jitter explosion"]
      }
    ],
    explicitNonGoals: [
      "LLM does not become simulation authority",
      "Coherence kernel does not own Three.js objects"
    ],
    note: "Smallest true simulation is nav+FSM+writeback to presence; everything else layers on."
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildRealEngineGapMapSnapshotV0() {
  return {
    schema: REAL_ENGINE_GAP_MAP_SCHEMA_V0,
    ts: Date.now(),
    priorityStack: REAL_ENGINE_STUB_PRIORITY_STACK_V0,
    dependencyGraph: getSimulationLayerDependencyGraphV0(),
    minimumPath: describeMinimumTrueSimulationLayerPathV0()
  };
}
