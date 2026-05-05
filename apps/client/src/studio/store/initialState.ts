import type {
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
  WorldPhysicsLayerState
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
    permissions: {},
    delegates: [],
    sharedOwnerIds: []
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
