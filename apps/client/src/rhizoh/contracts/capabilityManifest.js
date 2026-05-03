/**
 * Capability Manifest — mutable-zone registry + mini-roadmap (anti drift within OPEN areas).
 * Complements KERNEL_SEAL_V1: backbone locked here; expansion surfaces stay explicit.
 *
 * Bump zone.version when that surface’s public behavior or data contract changes.
 */

export const CAPABILITY_MANIFEST_V1 = Object.freeze({
  era: "expansion_begins",
  note: "Castle Genesis — Kernel Era complete → Expansion Era (mutable zones explicit).",
  manifestVersion: "1.0.3",
  updatedAt: "2026-05-01T00:00:00.000Z",
  zones: Object.freeze({
    spawn: Object.freeze({
      version: "0.3",
      capabilities: Object.freeze([
        "proto_gestation",
        "phantom_gravity",
        "cognitive_birth",
        "pgl_failure_imprints",
        "cognitive_lifecycle_imprints"
      ]),
      planned: Object.freeze(["mutation_bias", "mesh_embodiment", "spawn_listener_alpha"])
    }),
    embodiment_gate: Object.freeze({
      version: "0.2",
      capabilities: Object.freeze([
        "evaluate_embodiment",
        "triple_seal_capability_field_authority",
        "mesh_eligible_distinct_from_cognitive_candidate"
      ]),
      planned: Object.freeze(["mimar_manual_seal_ui", "wake_style_authority_hook"])
    }),
    conductor: Object.freeze({
      version: "0.2",
      capabilities: Object.freeze(["cognitive_chorus", "merged_intent_bias", "conflict_note"]),
      planned: Object.freeze(["weighted_mutation_bias_in_chorus"])
    }),
    diagnostics: Object.freeze({
      version: "0.2",
      capabilities: Object.freeze([
        "tsge_saturation_streak",
        "attention_curvature_variance",
        "spawn_mitosis_hint_diagnostic"
      ]),
      planned: Object.freeze(["l10_diagnostic_hud"])
    }),
    agents: Object.freeze({
      version: "0.3",
      capabilities: Object.freeze([
        "user_agent_skeleton_v0_1_non_autonomous",
        "agent_ecology_perception_bridge_read_only",
        "reactive_agent_layer_v1_soft_hints",
        "attention_steering_read_only",
        "chorus_soft_bias_prompt_shadow_only",
        "no_ecology_write_back",
        "no_self_spawn_contract"
      ]),
      planned: Object.freeze([
        "user_agent_passive_activation",
        "user_agent_reactive_activation",
        "user_created_agents",
        "agent_keys",
        "agent_memory_scope"
      ])
    }),
    ghost_ecology: Object.freeze({
      version: "0.2",
      capabilities: Object.freeze([
        "ghost_ecology_v1_pairs",
        "ghost_ecology_dynamics_v1_1_decay_kernels",
        "ghost_ecology_snapshot_compact_traces",
        "pollen_ephemeral_store_ttl_half_life",
        "l10_ring_2_5_projection"
      ]),
      planned: Object.freeze([
        "ghost_ecology_continuity_optional_hydrate",
        "ghost_pet_ecology_bridge",
        "user_agent_thread_binding",
        "presence_fusion"
      ])
    }),
    world: Object.freeze({
      version: "0.1",
      capabilities: Object.freeze(["realm_bridge_stubs"]),
      planned: Object.freeze(["ar_surface", "world_mesh_authority", "orbit_entities"])
    }),
    ui: Object.freeze({
      version: "0.1",
      capabilities: Object.freeze(["rhizoh_drawer_social_field"]),
      planned: Object.freeze(["capability_manifest_panel", "kernel_seal_badge"])
    })
  }),
  roadmapOrder: Object.freeze([
    "l10_diagnostic_hud",
    "capability_manifest_governance",
    "user_created_agents",
    "ghost_ecology",
    "ar_world"
  ])
});

/**
 * @returns {typeof CAPABILITY_MANIFEST_V1}
 */
export function getCapabilityManifestSnapshot() {
  return CAPABILITY_MANIFEST_V1;
}
