/**
 * META LAYER → Sovereign Runtime (conductor for Habitat OS · Chronos OS · Sovereign OS)
 * Registry-backed orchestration + Firebase-safe path keys (no secrets).
 *
 * Hedef ürün: Sovereign Multi-Agent World OS (bkz. worldOsArchitecture.js — 5 sütun).
 */

import {
  WORLD_OS_PILLARS,
  GLOBAL_WORLD_TOPOLOGY,
  ADAPTIVE_SPATIAL_STACK,
  MEAN_FIELD_CHANNELS,
  REGION_SHARD_IDS
} from "./worldOsArchitecture.js";
import { WORLD_OS_ARCHETYPES } from "./worldOsArchetypes.js";
import { SOVEREIGNTY_FLOW } from "./llmSovereigntyFlow.js";
import { getRhizohRoadmapManifest } from "../kernel/rhizohExecutionRoadmap.js";
import { VERIFIER_DEPLOYMENT } from "../kernel/sovereignVerifierTiers.js";
import { GPU_RENDER_STRATEGY } from "../kernel/gpuRenderSplit.js";
import { getSabReadiness } from "../kernel/isolationSupport.js";

/** Stable API keys for clients / rules / Cloud Functions (prefix all writes) */
export const SOVEREIGN_API_KEYS = {
  metaLayer: "castle.sovereign.meta.v1",
  boot: "castle.sovereign.boot.v1",
  capability: "castle.sovereign.capability.v1",
  pluginLifecycle: "castle.sovereign.plugin.lifecycle.v1",
  permissionGraph: "castle.sovereign.permission.graph.v1",
  health: "castle.sovereign.health.v1",
  schedule: "castle.sovereign.schedule.distributed.v1",
  chronos: "castle.chronos.engine.v1",
  biome: "castle.biome.ecology.v1",
  memoryEpisodic: "castle.memory.episodic.v1",
  memorySemantic: "castle.memory.semantic.v1",
  memoryProcedural: "castle.memory.procedural.v1",
  memoryCollective: "castle.memory.collective.v1",
  memoryGhost: "castle.memory.ghost.archive.v1",
  narrativeDream: "castle.narrative.dream.protocol.v1",
  economyMarketplace: "castle.economy.marketplace.v1",
  networkMesh: "castle.network.mesh.v1"
};

/**
 * Firebase Realtime Database OR Firestore document paths (single string per bundle).
 * Use security rules to scope `castle/genesis/v1/**`.
 */
export const FIREBASE_PATH_KEYS = {
  root: "castle/genesis/v1",
  kernelRegistry: "castle/genesis/v1/registries/kernel",
  pluginRegistry: "castle/genesis/v1/registries/plugin",
  identityRegistry: "castle/genesis/v1/registries/identity",
  permissionRegistry: "castle/genesis/v1/registries/permission",
  memoryRegistry: "castle/genesis/v1/registries/memory",
  capabilityIndex: "castle/genesis/v1/capabilities/index",
  bootLog: "castle/genesis/v1/runtime/boot_log",
  /** RCIL Live Wiring Sprint — epistemic event ledger (Firestore sub-path; rules: `castle/**`) */
  rcilEventLedger: "castle/genesis/v1/runtime/rcil_events",
  rcilEpistemicTrace: "castle/genesis/v1/runtime/rcil_trace_tail",
  healthMetrics: "castle/genesis/v1/runtime/health",
  scheduleLedger: "castle/genesis/v1/runtime/schedule",
  chronosClocks: "castle/genesis/v1/chronos/clocks",
  biomeState: "castle/genesis/v1/biome/state",
  biomeCycles: "castle/genesis/v1/biome/cycles",
  narrativeTimeline: "castle/genesis/v1/narrative/timeline",
  economyLedger: "castle/genesis/v1/economy/ledger",
  networkTopology: "castle/genesis/v1/network/topology",
  mediaSensorium: "castle/genesis/v1/media/sensorium"
};

/** Mega-stack taxonomy (above L0–L11 kernel strip) */
export const SOVEREIGN_RUNTIME_STACK = [
  {
    id: "M0",
    code: "META",
    name: "Sovereign Runtime — orchestration",
    conducts: ["Habitat OS", "Chronos OS", "Sovereign OS"],
    responsibilities: ["boot sequence", "capability registry", "plugin lifecycle", "permission graph", "system health", "distributed scheduling"]
  },
  {
    id: "M1",
    code: "KERNEL",
    name: "Core Kernel Layer",
    subsystems: [
      "Deterministic ECS Kernel",
      "transform · velocity · ownership · interaction · causality ids",
      "Physics Worker Cluster (parallel)",
      "Physics Worker 1 · Physics Worker 2 · Collision · Pathfinding · Fluid",
      "SharedArrayBuffer IPC (target)"
    ]
  },
  {
    id: "M2",
    code: "FABRIC",
    name: "World Fabric Layer",
    subsystems: [
      "Living Map Engine — weather · traffic · social · financial · sensor pulse",
      "Spatial Index — GPU octree · quadtree · navmesh · spatial hash — GIS Sync",
      "Cesium + GIS + satellite → digital twin"
    ]
  },
  {
    id: "M3",
    code: "COGNITION",
    name: "Agentic Cognition Layer",
    sublayers: ["Persona", "Cognition (LLM scheduling)", "Social (negotiation · alliance · trust)", "Agency (world actions)"]
  },
  {
    id: "M4",
    code: "MEMORY",
    name: "Memory Layer",
    lanes: ["Episodic", "Semantic", "Procedural", "Collective", "Ghost archive"]
  },
  {
    id: "M5",
    code: "SENSORIUM",
    name: "Media / Sensorium Layer",
    channels: ["voice", "vision", "screen", "camera", "world audio", "sensor stream", "livestream ingest"]
  },
  {
    id: "M6",
    code: "NARRATIVE",
    name: "Narrative / Timeline Layer",
    engines: ["Dream Protocol", "causal graph", "alternate futures", "prophecy", "ghost replay", "dream synthesis"]
  },
  {
    id: "M7",
    code: "ECONOMY",
    name: "Economy Layer",
    markets: ["agent minting", "pet ownership", "memory artifacts", "data contracts", "skill licensing", "compute marketplace"]
  },
  {
    id: "M8",
    code: "INTERFACE",
    name: "Interface Layer — Sovereign OS",
    panels: ["Commander", "Observer", "Citizen", "Creator", "Research"]
  },
  {
    id: "M9",
    code: "NETWORK",
    name: "Network / Distributed Layer",
    mesh: ["edge", "city", "regional", "global", "LLM nodes", "sim nodes"]
  },
  {
    id: "M10",
    code: "BIOME",
    name: "Biome / Ecology Layer",
    dimensions: ["resource cycles", "food webs", "climate pressure", "entropy", "disease", "evolution pressure"]
  }
];

export const PHYSICS_WORKER_ROLES = ["physics_a", "physics_b", "collision", "pathfinding", "fluid"];

export const CHRONOS_CLOCK_IDS = ["simTime", "realTime", "eventTime", "memoryTime", "dreamTime"];

export const BOOT_SEQUENCE_PHASES = [
  { id: "init_registries", label: "Bind KernelRegistry · PluginRegistry · IdentityRegistry · PermissionRegistry · MemoryRegistry", capability: SOVEREIGN_API_KEYS.boot },
  { id: "chrono_sync", label: "Chronos Engine — 5 clocks mapped", capability: SOVEREIGN_API_KEYS.chronos },
  { id: "worker_mesh", label: "Physics worker slots + SharedArrayBuffer negotiation", capability: SOVEREIGN_API_KEYS.metaLayer },
  { id: "capability_graph", label: "Capability registry + permission graph", capability: SOVEREIGN_API_KEYS.capability },
  { id: "biome_seed", label: "Biome / Ecology default tensors", capability: SOVEREIGN_API_KEYS.biome },
  { id: "health_ping", label: "System health probe + schedule ledger", capability: SOVEREIGN_API_KEYS.health }
];

export const DEFAULT_BIOME_STATE = {
  resourceCyclePhase: 0,
  foodWebStability: 0.72,
  climatePressure: 0.41,
  entropy: 0.18,
  diseaseLoad: 0.06,
  evolutionRate: 0.004
};

function createRegistry(name) {
  const entries = new Map();
  return {
    name,
    register(id, meta = {}) {
      entries.set(id, { ...meta, registeredAt: Date.now() });
      return id;
    },
    unregister(id) {
      entries.delete(id);
    },
    has(id) {
      return entries.has(id);
    },
    list() {
      return Array.from(entries.entries()).map(([id, v]) => ({ id, ...v }));
    },
    size: () => entries.size
  };
}

export function createSovereignRegistries() {
  return {
    kernel: createRegistry("KernelRegistry"),
    plugin: createRegistry("PluginRegistry"),
    identity: createRegistry("IdentityRegistry"),
    permission: createRegistry("PermissionRegistry"),
    memory: createRegistry("MemoryRegistry")
  };
}

export class SovereignRuntimeOrchestrator {
  constructor() {
    this.registries = createSovereignRegistries();
    this.bootComplete = false;
    this.bootLog = [];
    this.healthScore = 1;
    this.biome = { ...DEFAULT_BIOME_STATE };
    this.chronos = {
      simTime: 0,
      realTime: 0,
      eventTime: 0,
      memoryTime: 0,
      dreamTime: 0
    };
    this.permissionEdges = [];
  }

  seedDemoCapabilities() {
    this.registries.kernel.register("ecs_kernel_v1", { shard: "default" });
    this.registries.plugin.register("greenroom_bridge", { version: "1" });
    this.registries.identity.register("user:anon", { roles: ["citizen"] });
    this.registries.permission.register("role:citizen", { caps: ["world.read", "command.basic"] });
    this.registries.memory.register("collective:istanbul", { type: "collective" });
  }

  async runBootSequence(onPhase) {
    this.bootLog = [];
    for (const phase of BOOT_SEQUENCE_PHASES) {
      await new Promise((r) => setTimeout(r, 40));
      this.bootLog.push({ ...phase, ts: Date.now() });
      onPhase?.(phase);
    }
    this.seedDemoCapabilities();
    this.bootComplete = true;
    this.healthScore = 0.94;
    return this.bootLog;
  }

  syncChronosFromSim(simTime, realNow = performance.now()) {
    this.chronos.simTime = simTime;
    this.chronos.realTime = realNow / 1000;
    this.chronos.eventTime = simTime * 1.05;
    this.chronos.memoryTime = simTime * 0.92;
    this.chronos.dreamTime = simTime * 0.65 + Math.sin(simTime * 0.2) * 0.1;
  }

  setBiome(partial) {
    this.biome = { ...this.biome, ...partial };
    const e = this.biome.entropy + this.biome.diseaseLoad * 0.5;
    this.healthScore = Math.max(0.2, Math.min(1, 1 - e * 0.4));
    return this.biome;
  }

  getManifestPayload() {
    return {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      apiKeys: SOVEREIGN_API_KEYS,
      firebasePaths: FIREBASE_PATH_KEYS,
      stack: SOVEREIGN_RUNTIME_STACK.map(({ id, code, name }) => ({ id, code, name })),
      chronosClocks: CHRONOS_CLOCK_IDS,
      physicsWorkers: PHYSICS_WORKER_ROLES,
      biomeDefaults: DEFAULT_BIOME_STATE,
      worldOs: getWorldOsManifestSlice()
    };
  }
}

export const sovereignRuntimeSingleton = new SovereignRuntimeOrchestrator();

/** Manifest’e World OS özetini eklemek için (isteğe bağlı import, döngüsel bağımlılık yok). */
/** Manifest / API için World OS özeti (senkron). */
export function getWorldOsManifestSlice() {
  return {
    pillars: WORLD_OS_PILLARS,
    topology: GLOBAL_WORLD_TOPOLOGY,
    spatialStack: ADAPTIVE_SPATIAL_STACK,
    meanFieldChannels: MEAN_FIELD_CHANNELS,
    regionShards: REGION_SHARD_IDS,
    archetypes: WORLD_OS_ARCHETYPES,
    sovereigntyFlow: SOVEREIGNTY_FLOW,
    executionRoadmap: getRhizohRoadmapManifest(),
    verifierDeployment: VERIFIER_DEPLOYMENT,
    gpuRenderStrategy: GPU_RENDER_STRATEGY,
    sabReadiness: typeof globalThis !== "undefined" ? getSabReadiness() : null
  };
}
