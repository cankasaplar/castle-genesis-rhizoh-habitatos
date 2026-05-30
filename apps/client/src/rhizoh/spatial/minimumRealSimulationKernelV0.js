/**
 * SPECFLOW: RESEARCH-ONLY — **Minimum real simulation kernel v0**
 *
 * Beş atomik motor: tek nav solver, tek FSM graph, tek look-at kısıt çözücüsü,
 * tek flock kural seti, tek frame integrator. Bu dosya implementasyon değil;
 * “hangi parçalar aynı anda gerçek olunca substrate tamamlanır?” sözleşmesi.
 *
 * **Coupling notu:** `somaticExecutionCouplingLayerV0` enjeksiyon sırası
 * nav → flock → FSM → look-at (mesh’e yakın çözüm sona); frame integrator bu sırayı `dtMs` ile sarar ve writeback’i tekleştirir (`onFrameIntegratorPost`).
 *
 * **Kayıt:** `registerMinimumRealSimulationKernelHandlersV0` — `studio/lib/minimumRealSimulationKernelRegistrationV0.ts`.
 */

export const MINIMUM_REAL_SIMULATION_KERNEL_SCHEMA_V0 =
  "castle.rhizoh.minimum_real_simulation_kernel.v0";

/**
 * Studio sync tarafında kullanılan handler anahtar sırası (TypeScript katmanı ile aynı isimler).
 * @type {readonly string[]}
 */
export const MINIMUM_KERNEL_SOMATIC_COUPLE_ORDER_V0 = Object.freeze([
  "onNavMeshRuntimeFeed",
  "onFlockSolverStep",
  "onFsmToTransform",
  "onLookAtQuaternionSolve",
  "onFrameIntegratorPost"
]);

/**
 * Beş çekirdek bileşen — her biri tam olarak bir “gerçek motor” örneği taşır (v0 sınırı).
 * @type {readonly Readonly<{
 *   id: string;
 *   title: string;
 *   substrateRole: string;
 *   inputs: string[];
 *   outputs: string[];
 *   invariantNotes: string[];
 *   stubSurfaceHint: string;
 * }>[]>}
 */
export const MINIMUM_REAL_SIMULATION_KERNEL_COMPONENTS_V0 = Object.freeze([
  {
    id: "nav_solver",
    title: "Nav + collision sample solver",
    substrateRole: "Ground / constraint truth: walkable space + blocked samples for FSM and flock.",
    inputs: ["obstacle_segments", "nav_mesh_or_conservative_grid", "room_bounds_from_readiness"],
    outputs: ["valid_world_samples", "blocked_cell_mask", "path_corridor_hints"],
    invariantNotes: [
      "No LLM or coherence field may replace nav samples as authority.",
      "Fake obstacles[] collapses downstream phases into symbolic-only motion."
    ],
    stubSurfaceHint: "resolveRealWorldSpatialBindingReadinessV0 + obstacleAwarenessStub → onNavMeshRuntimeFeed"
  },
  {
    id: "fsm_graph",
    title: "Locomotion finite-state graph",
    substrateRole: "Behavior compiler: intent + nav samples → discrete states → allowed motion deltas.",
    inputs: ["locomotion_hint", "nav_solver.samples", "coherence_locomotion_rails_optional"],
    outputs: ["target_velocity_or_snapped_pose", "transition_guards", "zone_legality_flags"],
    invariantNotes: [
      "Without FSM, locomotion is noise; intent is decoration.",
      "Direct transform writes from non-FSM sources violate simulation integrity target."
    ],
    stubSurfaceHint: "ghostPetLocomotionFsmStubV0 + onFsmToTransform"
  },
  {
    id: "look_at_constraint_solver",
    title: "Look-at / attention constraint solver",
    substrateRole: "Attention allocation: bounded quaternion or aim vector toward targets with continuity.",
    inputs: ["pet_and_target_world_positions", "attention_target_handle", "smooth_lock_params"],
    outputs: ["quaternion_or_yaw_delta", "gaze_lock_error_metric"],
    invariantNotes: [
      "Not cosmetic rotation only: encodes who is attended to and for how long.",
      "Runs after locomotion bias in coupling order so mesh-facing is last."
    ],
    stubSurfaceHint: "ghostPetLookAtSolverStubV0 + onLookAtQuaternionSolve"
  },
  {
    id: "flocking_rule_set",
    title: "Flocking / spacing rule set",
    substrateRole: "Multi-agent physics + social spacing: avoidance, separation, soft grouping.",
    inputs: ["per_agent_pose_velocity", "nav_blocked_cells", "attention_competition_weights"],
    outputs: ["pairwise_repulsion_vectors", "group_center_bias_optional", "pet_offset_deltas"],
    invariantNotes: [
      "Avoidance is hard constraint; spacing carries social semantics.",
      "Without flock, multi-pet is duplicate entities, not a society."
    ],
    stubSurfaceHint: "ghostPetMultiPetSocialPhysicsStubV0 + onFlockSolverStep"
  },
  {
    id: "frame_integrator",
    title: "Frame integrator (continuous substrate)",
    substrateRole:
      "dt-normalized integration, accumulator caps, persistence-in-motion, single writeback gate to presence.",
    inputs: ["dtMs", "nowMs", "kernel_state_snapshot"],
    outputs: ["integrated_entity_state", "coupling_tick_completion"],
    invariantNotes: [
      "Owns frame continuity; bridges discrete FSM steps with continuous pose integration.",
      "Delegates stage calls to somatic coupling handlers in MINIMUM_KERNEL_SOMATIC_COUPLE_ORDER_V0 (integrator = final slot)."
    ],
    stubSurfaceHint: "tickSomaticExecutionCouplingV0 → onFrameIntegratorPost (PresenceStudioViewport sync)"
  }
]);

/**
 * @returns {{
 *   schema: string;
 *   components: typeof MINIMUM_REAL_SIMULATION_KERNEL_COMPONENTS_V0;
 *   somaticCoupleOrder: typeof MINIMUM_KERNEL_SOMATIC_COUPLE_ORDER_V0;
 *   note: string;
 * }}
 */
export function describeMinimumRealSimulationKernelV0() {
  return {
    schema: MINIMUM_REAL_SIMULATION_KERNEL_SCHEMA_V0,
    components: MINIMUM_REAL_SIMULATION_KERNEL_COMPONENTS_V0,
    somaticCoupleOrder: MINIMUM_KERNEL_SOMATIC_COUPLE_ORDER_V0,
    note:
      "Five engines + one inject order: kernel ontology lists nav→FSM→look-at→flock→integrator; " +
      "runtime coupling order is nav→flock→FSM→look-at→onFrameIntegratorPost (spacing before locomotion, integrator last)."
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildMinimumRealSimulationKernelSnapshotV0() {
  return {
    schema: MINIMUM_REAL_SIMULATION_KERNEL_SCHEMA_V0,
    ts: Date.now(),
    ...describeMinimumRealSimulationKernelV0()
  };
}
