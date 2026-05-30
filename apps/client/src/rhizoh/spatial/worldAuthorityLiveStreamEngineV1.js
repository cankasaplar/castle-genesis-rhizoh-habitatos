/**
 * SPECFLOW: RESEARCH-ONLY — **WAL v1 = Live World Stream Engine**
 *
 * Dünya otoritesi v0 (statik yüzey yığını) → v1: **sürekli akış motoru** — sahne, engel diff’i,
 * çok-dünya çatışma tahkimi, deterministik snapshot mührü.
 *
 * Üst katman: `worldAuthorityLayerV0.js`. Simülasyon tüketimi: `realSimulationEngineCouplingV0.ts`.
 *
 * **Sonraki aşama (ROS):** `realityOperatingSystemLayerV0.js` — arbitraj ağı, müzakere otobüsü, dünya sürüm ekseni.
 */

export const WORLD_AUTHORITY_LIVE_STREAM_ENGINE_SCHEMA_V1 =
  "castle.rhizoh.world_authority_live_stream_engine.v1";

/** WAL v1 — dört canlı akış sütunu. */
export const WAL_LIVE_STREAM_ENGINE_PILLARS_V1 = Object.freeze([
  {
    id: "continuous_scene_streaming",
    title: "Continuous scene streaming",
    substrateRole:
      "Incremental mesh / instance graph deltas over time — no single-shot bake as sole truth.",
    inputs: ["scene_node_stream", "lod_policy", "room_uid_scope", "clock_monotonic_ms"],
    outputs: ["spatial_cache_tick", "visible_set_revision", "ingest_backpressure_signal"],
    invariantNotes: [
      "Stream chunks must carry stable node UIDs + schema version.",
      "Stall or gap triggers readiness degradation, not silent geometry reuse."
    ],
    bridgesWALv0Surface: "scene_graph_ingestion"
  },
  {
    id: "real_obstacle_delta_diffing",
    title: "Real obstacle delta diffing",
    substrateRole:
      "Signed add/remove/move of obstacles vs previous sealed world frame — nav consumes diff, not full world each tick.",
    inputs: ["previous_obstacle_set_hash", "signed_delta_frame", "room_scope"],
    outputs: ["merged_obstacle_authority_set", "nav_grid_invalidation_mask", "diff_replay_log"],
    invariantNotes: [
      "Empty delta is valid; fake empty is not — diff source must attest origin (studio vs federated).",
      "Deterministic merge: same ordered diff → same blocked cells."
    ],
    bridgesWALv0Surface: "obstacle_streaming"
  },
  {
    id: "multi_world_conflict_arbitration",
    title: "Multi-world conflict arbitration",
    substrateRole:
      "When two castles / regions assert conflicting topology or obstacles for same federated key, pick winner by policy + precedence clock.",
    inputs: ["castle_identity", "region_uid", "conflict_pair_payload", "precedence_lamport_or_vector_clock"],
    outputs: ["arbitrated_world_patch", "rejected_diff_audit", "downstream_invalidation_scope"],
    invariantNotes: [
      "Never merge unsigned spatial authority from peer.",
      "Arbitration outcome feeds obstacle diff + topology store in one atomic apply."
    ],
    bridgesWALv0Surface: "multi_world_federation"
  },
  {
    id: "deterministic_world_snapshots",
    title: "Deterministic world snapshots",
    substrateRole:
      "After apply: seal canonical world slice (topology + obstacles + scene revision) with hash for replay / rollback alignment.",
    inputs: ["world_topology_revision", "obstacle_set_canonical", "scene_stream_revision"],
    outputs: ["world_snapshot_id", "snapshot_hash_hex", "rollback_ring_key"],
    invariantNotes: [
      "Hash inputs sorted by stable UID — same world state → same hash across clients.",
      "Snapshot id monotonic per castle branch; ties broken by arbitration clock."
    ],
    bridgesWALv0Surface: "room_topology_sync"
  }
]);

/**
 * Canlı akış — veri ve mühür sırası (operational causal chain).
 * @returns {{ nodes: string[], edges: { from: string; to: string; kind: string }[] }}
 */
export function getLiveWorldStreamDependencyGraphV1() {
  return {
    nodes: [
      "scene_chunk_ingress",
      "spatial_cache_ring",
      "obstacle_delta_merge",
      "nav_authority_cache",
      "federation_conflict_arbiter",
      "world_topology_revision",
      "snapshot_seal_hasher",
      "rollback_alignment_bus",
      "simulation_kernel_feed"
    ],
    edges: [
      { from: "scene_chunk_ingress", to: "spatial_cache_ring", kind: "incremental_apply" },
      { from: "spatial_cache_ring", to: "obstacle_delta_merge", kind: "geometry_segments" },
      { from: "federation_conflict_arbiter", to: "obstacle_delta_merge", kind: "pre_merge_gate" },
      { from: "federation_conflict_arbiter", to: "world_topology_revision", kind: "topology_patch" },
      { from: "obstacle_delta_merge", to: "nav_authority_cache", kind: "constraint_truth" },
      { from: "world_topology_revision", to: "snapshot_seal_hasher", kind: "revision_input" },
      { from: "nav_authority_cache", to: "snapshot_seal_hasher", kind: "revision_input" },
      { from: "spatial_cache_ring", to: "snapshot_seal_hasher", kind: "revision_input" },
      { from: "snapshot_seal_hasher", to: "rollback_alignment_bus", kind: "sealed_frame" },
      { from: "snapshot_seal_hasher", to: "simulation_kernel_feed", kind: "deterministic_tick_anchor" }
    ]
  };
}

export function describeLiveWorldStreamEnginePathV1() {
  return {
    schema: WORLD_AUTHORITY_LIVE_STREAM_ENGINE_SCHEMA_V1,
    phases: [
      {
        phase: 1,
        name: "Stream ingress contract",
        do: "Define chunk framing (uid, seq, room, schema); wire gateway → spatial_cache_ring with backpressure.",
        exitCriteria: ["no duplicate seq accepted without idempotency key", "chunk loss surfaces readiness gap"]
      },
      {
        phase: 2,
        name: "Obstacle diff pipeline",
        do: "Implement signed delta list vs last snapshot_hash; merge into nav_authority_cache; invalidate minimal grid cells.",
        exitCriteria: ["replay N diffs == full snapshot hash", "reject malformed delta without mutating cache"]
      },
      {
        phase: 3,
        name: "Arbitration hook",
        do: "On federated spatial conflict, run arbiter → single patch; audit rejected peer.",
        exitCriteria: ["two conflicting unsigned proposals → both rejected", "winner stamped with castle id + clock"]
      },
      {
        phase: 4,
        name: "Snapshot seal",
        do: "After merge: compute snapshot_hash_hex; push rollback_alignment_bus; expose id to simulation integrator.",
        exitCriteria: ["hash stable cross-platform for same inputs", "simulation tick references snapshot_id"]
      }
    ],
    explicitNonGoals: [
      "LLM-generated obstacle streams without human or signed tool attestation",
      "Per-client independent world hashes without federation policy"
    ],
    note: "WAL v1 is the live engine; WAL v0 remains the static capability map. Kernel reads sealed snapshots only."
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildWorldAuthorityLiveStreamEngineSnapshotV1() {
  return {
    schema: WORLD_AUTHORITY_LIVE_STREAM_ENGINE_SCHEMA_V1,
    ts: Date.now(),
    pillars: WAL_LIVE_STREAM_ENGINE_PILLARS_V1,
    dependencyGraph: getLiveWorldStreamDependencyGraphV1(),
    streamPath: describeLiveWorldStreamEnginePathV1()
  };
}
