import type {
  IdentityGraphState,
  RhizohAgentRuntimeState,
  CausalEconomyLayerState,
  IdentityState,
  PresenceLayerState,
  RegistryState,
  RuntimeState,
  SocietyEconomyState,
  SimulationState,
  StudioKernelMeta,
  StudioKernelState,
  WorldChunkRuntimeState,
  WorldEcologyRuntimeState,
  WorldLocomotionState,
  WorldTopologyState,
  WorldPhysicsLayerState,
  RealitySealLayerState,
  WorldAuthorityRuntimeStateV0
} from "../types/rskOntology.js";
import { RSK_KERNEL_VERSION, RSK_ONTOLOGY_VERSION } from "../types/rskOntology";
import { defaultCausalGraphRegistry } from "../runtime/causalGraph";

export function defaultMeta(): StudioKernelMeta {
  return {
    productName: "Castle Studio",
    kernelName: "Rhizoh Studio Kernel",
    kernelVersion: RSK_KERNEL_VERSION,
    ontologyVersion: RSK_ONTOLOGY_VERSION
  };
}

export function emptyIdentity(): IdentityState {
  return {
    ownerId: null,
    actor: null,
    session: null,
    identityGraph: defaultIdentityGraph("guest"),
    permissions: {},
    delegates: [],
    sharedOwnerIds: []
  };
}

export function defaultIdentityGraph(ownerUid: string): IdentityGraphState {
  const userUid = ownerUid || "guest";
  return {
    root: {
      userUid,
      avatarUid: `avatar:${userUid}`,
      companionUid: `companion:${userUid}:rhizoh`,
      ghostPetUid: `pet:${userUid}:seed`,
      inventoryUid: `inventory:${userUid}`,
      vaultUid: `vault:${userUid}`,
      journalUid: `journal:${userUid}`,
      signatureUid: `signature:${userUid}`,
      profileMeta: {
        displayName: "Castle Operator",
        homeRegionUid: "region:istanbul:fatih",
        updatedAt: Date.now()
      }
    },
    avatar: {
      bodyArchetype: "sovereign-scout",
      palette: "indigo-cyan",
      motionStyle: "orbit-calm",
      aura: "signal-lattice",
      badges: ["founder", "atlas"],
      homeRegion: "region:istanbul:fatih"
    },
    companion: {
      name: "Rhizoh",
      voice: "tr-neutral",
      archetype: "guide",
      tone: "supportive",
      memoryBias: "episodic-social",
      preferredRole: "companion"
    },
    ghostPet: {
      species: "lumen-fox",
      temperament: "curious",
      orbitStyle: "spiral-soft",
      bondLevel: 0.42
    },
    inventory: {
      tools: ["scanner", "broadcast-kit"],
      artifacts: ["fatih-beacon-fragment"],
      wearables: ["operator-cloak"],
      keys: ["greenroom-main"]
    },
    vault: {
      permanentUnlocks: ["world-shell-v1"],
      creatorLicenses: ["broadcast-alpha"],
      rareMemories: ["first-istanbul-anchor"]
    },
    journal: {
      clips: [],
      bookmarks: ["welcome-route"],
      milestones: ["alpha-runtime-online"],
      notes: []
    },
    signature: {
      crest: "castle-sigil",
      colorSystem: "indigo-cyan",
      motif: "orbital-lines",
      publicCard: "Castle Operator · Rhizoh Companion"
    },
    reputation: {
      score: 100,
      tier: "founder-alpha"
    }
  };
}

export function emptyRegistry(): RegistryState {
  return {
    mind: { definition: {}, instance: {} },
    ghost: {},
    spiral: {},
    link: {},
    entity: {},
    tool: {},
    memoryProfile: {},
    policy: {},
    soul: {},
    soulMind: {},
    causalGraph: defaultCausalGraphRegistry()
  };
}

export function defaultSimulation(): SimulationState {
  return {
    mode: "observe"
  };
}

export function defaultRuntime(): RuntimeState {
  return {
    currentPanel: "kernel-console",
    shellMode: "observe",
    activeBranchId: "branch:main"
  };
}

export function defaultWorldPhysics(): WorldPhysicsLayerState {
  return {
    globalTick: 0,
    timeDilation: 1
  };
}

import { defaultWorldAuthorityRuntimeV0 } from "../../rhizoh/runtime/worldAuthorityRuntimeDefaultsV0.js";

export function defaultWorldAuthorityRuntime(): WorldAuthorityRuntimeStateV0 {
  return defaultWorldAuthorityRuntimeV0();
}

export function defaultRealitySeal(nowMs = 0): RealitySealLayerState {
  return {
    realityEpoch: 0,
    sealHashHead: "h00000000",
    sealQueue: [],
    auditTrail: [],
    budget: {
      windowStartMs: nowMs,
      windowMs: 1000,
      maxSealsPerWindow: 8,
      sealsInWindow: 0
    },
    streamSeq: 0,
    intentSeq: 0,
    scheduler: {
      lastDrainAtMs: 0,
      lastScheduleEvalAtMs: nowMs,
      coalesceHoldUntilMs: 0,
      drainPassesThisSession: 0
    }
  };
}

export function defaultWorldTopology(): WorldTopologyState {
  return {
    regions: {},
    edges: {},
    roomBindings: {}
  };
}

export function defaultWorldLocomotion(): WorldLocomotionState {
  return {
    avatarRegionUid: {},
    lastCrossAtByAvatar: {}
  };
}

export function defaultWorldChunks(): WorldChunkRuntimeState {
  return {
    chunks: {}
  };
}

export function defaultWorldEcology(): WorldEcologyRuntimeState {
  return {
    weatherByRegionUid: {},
    biomeByRegionUid: {},
    healthByRegionUid: {}
  };
}

export function defaultAgentRuntime(): RhizohAgentRuntimeState {
  return {
    enabled: false,
    heartbeatMs: 4500,
    lastTickAt: 0,
    schedulerState: "idle",
    toolCooldownUntilByToolId: {},
    rationaleLog: []
  };
}

export function defaultSocietyEconomy(): SocietyEconomyState {
  return {
    reputationByAvatarUid: {},
    marketHeatByRegionUid: {},
    civicCohesion: 0.5
  };
}

export function defaultCausalEconomy(): CausalEconomyLayerState {
  return {
    cumulativeComputeWeight: 0,
    cumulativeEntropyImpact: 0
  };
}

export function defaultPresence(): PresenceLayerState {
  return {
    avatars: {},
    rooms: {},
    broadcasts: {},
    broadcastProjections: {},
    directorByRoomUid: {},
    voiceStubByRoomUid: {},
    companionAgents: {},
    pets: {}
  };
}

export function createInitialStudioKernelState(): StudioKernelState {
  return {
    meta: defaultMeta(),
    identity: emptyIdentity(),
    registry: emptyRegistry(),
    simulation: defaultSimulation(),
    runtime: defaultRuntime(),
    mindRuntime: {},
    worldPhysics: defaultWorldPhysics(),
    realitySeal: defaultRealitySeal(),
    worldAuthorityRuntime: defaultWorldAuthorityRuntime(),
    worldTopology: defaultWorldTopology(),
    worldLocomotion: defaultWorldLocomotion(),
    worldChunks: defaultWorldChunks(),
    worldEcology: defaultWorldEcology(),
    agentRuntime: defaultAgentRuntime(),
    societyEconomy: defaultSocietyEconomy(),
    causalEconomy: defaultCausalEconomy(),
    presence: defaultPresence(),
    entityProjectionCache: {}
  };
}
