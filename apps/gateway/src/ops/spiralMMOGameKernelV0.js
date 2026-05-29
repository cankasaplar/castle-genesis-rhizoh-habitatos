/**
 * SpiralMMO Game Kernel v0 — simulation → playable world projection compiler.
 * SpiralMMO is not "just a game"; it maps Rhizoh cultural-risk primitives to world systems.
 * @see docs/ops/APPLIED_SYSTEMS_LAYER_V1.0.md
 */

export const SPIRAL_MMO_GAME_KERNEL_SCHEMA_V0 = "rhizoh.spiral_mmo_game_kernel.v0";

export const SPIRAL_LAYER_V0 = Object.freeze({
  SIMULATION_INTERNAL: "simulation_internal",
  GAME_EXTERNAL: "game_external"
});

/** Rhizoh applied primitive → SpiralMMO world mechanic */
export const RHIZOH_TO_SPIRAL_MAPPING_V0 = Object.freeze({
  propagation_simulation: Object.freeze({
    spiralMechanic: "rumor_viral_event",
    layer: SPIRAL_LAYER_V0.GAME_EXTERNAL
  }),
  trust_decay: Object.freeze({
    spiralMechanic: "faction_belief_shift",
    layer: SPIRAL_LAYER_V0.GAME_EXTERNAL
  }),
  mythology_fork: Object.freeze({
    spiralMechanic: "lore_creation",
    layer: SPIRAL_LAYER_V0.GAME_EXTERNAL
  }),
  divergence: Object.freeze({
    spiralMechanic: "anomaly_event",
    layer: SPIRAL_LAYER_V0.SIMULATION_INTERNAL
  }),
  tenant_isolation: Object.freeze({
    spiralMechanic: "server_shard_world",
    layer: SPIRAL_LAYER_V0.GAME_EXTERNAL
  })
});

export const SPIRAL_INTERNAL_SYSTEMS_V0 = Object.freeze([
  "societyEconomy",
  "causal_graphs",
  "ghost_ecology",
  "spiral_evolution"
]);

export const SPIRAL_EXTERNAL_SYSTEMS_V0 = Object.freeze([
  "player_experience",
  "ui_progression",
  "social_propagation_surface",
  "quest_narrative"
]);

/**
 * @param {object} narrativeExport — operational + cultural risk
 * @param {{ shardId?: string, societyEconomySnapshot?: object }} [opts]
 */
export function compileSimulationToPlayableV0(narrativeExport, opts = {}) {
  const propagation = narrativeExport?.humanOps?.socialPropagationSimulation;
  const trust = narrativeExport?.culturalRisk?.trustDynamics;
  const tenantId = narrativeExport?.tenantScope?.tenantId || opts.shardId || "world-default";

  const rumors = (propagation?.paths || []).map((p) =>
    Object.freeze({
      id: `rumor_${p.id}`,
      sourceChannel: p.channel,
      riskScore: p.pathRiskScore,
      mutationFinal: p.mutation?.finalText,
      halfLifeDays: p.persistence?.narrativeHalfLifeDays
    })
  );

  const worldEvents = [];
  if (trust?.fork === "mythology") {
    worldEvents.push(
      Object.freeze({
        type: "lore_creation",
        trigger: "mythology_fork",
        intensity: trust.scores?.mythology
      })
    );
  }
  if (trust?.fork === "trust_decay") {
    worldEvents.push(
      Object.freeze({
        type: "faction_belief_shift",
        trigger: "trust_decay_fork",
        intensity: trust.scores?.trustDecay
      })
    );
  }
  if (narrativeExport?.validation?.divergence?.flags?.length) {
    worldEvents.push(
      Object.freeze({
        type: "anomaly_event",
        flagIds: narrativeExport.validation.divergence.flags.map((f) => f.id)
      })
    );
  }

  return Object.freeze({
    schema: SPIRAL_MMO_GAME_KERNEL_SCHEMA_V0,
    shardId: tenantId,
    simulationLayer: Object.freeze({
      systems: SPIRAL_INTERNAL_SYSTEMS_V0,
      societyEconomy: opts.societyEconomySnapshot
        ? Object.freeze({ present: true, keys: Object.keys(opts.societyEconomySnapshot).slice(0, 12) })
        : Object.freeze({ present: false, note: "attach studio societyEconomy for full compile" })
    }),
    gameLayer: Object.freeze({
      systems: SPIRAL_EXTERNAL_SYSTEMS_V0,
      rumors,
      worldEvents,
      quests: Object.freeze({
        fromNarrativeHeadline: narrativeExport?.interpretation?.headline,
        nonExecutable: true,
        rumorDriven: rumors.length > 0
      })
    }),
    mapping: Object.freeze({
      propagation_simulation: "rumor_viral_event",
      trust_decay: "faction_belief_shift",
      mythology_fork: "lore_creation",
      divergence: "anomaly_event",
      tenant_isolation: "server_shard_world"
    }),
    compilerNote: "Simulation state → playable projection; does not mutate Operational Rhizoh"
  });
}

export function getRhizohToSpiralMappingV0() {
  return RHIZOH_TO_SPIRAL_MAPPING_V0;
}

export function buildSpiralMMOGameKernelV0(narrativeExport, opts = {}) {
  const playable = compileSimulationToPlayableV0(narrativeExport, opts);
  return Object.freeze({
    ...playable,
    schema: SPIRAL_MMO_GAME_KERNEL_SCHEMA_V0,
    target: "multi_agent_simulation_narrative_economy_spatial_governance",
    notJustAGame: true,
    feedsExecution: false
  });
}
