import type { AvatarEntity, CausalGraphRegistry, StudioKernelState } from "../types/rskOntology";
import { RSK_ONTOLOGY_VERSION } from "../types/rskOntology";
import {
  createInitialStudioKernelState,
  defaultAgentRuntime,
  defaultCausalEconomy,
  defaultPresence,
  defaultSocietyEconomy,
  defaultWorldChunks,
  defaultWorldEcology,
  defaultWorldLocomotion,
  defaultWorldTopology
} from "../store/initialState.js";
import { mergePersistedCausalGraph } from "../runtime/causalGraph";
import { defaultMainHallZones } from "./presenceRoomZones";

/**
 * Constitution migration entry — expand with versioned transforms.
 * v0: cold import → current empty kernel if unknown / legacy.
 */
export function upgradeOntology(snapshot: unknown): StudioKernelState {
  if (!snapshot || typeof snapshot !== "object") {
    return createInitialStudioKernelState();
  }
  const s = snapshot as Partial<StudioKernelState> & { meta?: { ontologyVersion?: string } };
  const v = s.meta?.ontologyVersion ?? "";
  if (!v || v !== RSK_ONTOLOGY_VERSION) {
    const fresh = createInitialStudioKernelState();
    return {
      ...fresh,
      meta: { ...fresh.meta, ontologyVersion: RSK_ONTOLOGY_VERSION }
    };
  }
  const base = s as StudioKernelState;
  const reg = base.registry as typeof base.registry & { causalGraph?: CausalGraphRegistry };
  return {
    ...base,
    mindRuntime: base.mindRuntime ?? {},
    worldPhysics: base.worldPhysics ?? { globalTick: 0, timeDilation: 1 },
    worldTopology: base.worldTopology ?? defaultWorldTopology(),
    worldLocomotion: base.worldLocomotion ?? defaultWorldLocomotion(),
    worldChunks: base.worldChunks ?? defaultWorldChunks(),
    worldEcology: base.worldEcology ?? defaultWorldEcology(),
    agentRuntime: (() => {
      const d = defaultAgentRuntime();
      const a = base.agentRuntime ?? d;
      return {
        ...d,
        ...a,
        toolCooldownUntilByToolId: a.toolCooldownUntilByToolId ?? d.toolCooldownUntilByToolId ?? {},
        rationaleLog: a.rationaleLog ?? d.rationaleLog ?? []
      };
    })(),
    societyEconomy: base.societyEconomy ?? defaultSocietyEconomy(),
    causalEconomy: base.causalEconomy ?? defaultCausalEconomy(),
    presence: (() => {
      const p = base.presence ?? defaultPresence();
      const rooms = p.rooms ?? {};
      const roomsWithZones = Object.fromEntries(
        Object.entries(rooms).map(([k, r]) => [k, { ...r, zones: r.zones ?? defaultMainHallZones() }])
      );
      const avatars = p.avatars ?? {};
      const avatarsZ = Object.fromEntries(
        Object.entries(avatars).map(([k, av]) => {
          const a = av as AvatarEntity;
          if (a.projection && (!a.projection.zoneId || !a.projection.role)) {
            return [
              k,
              {
                ...a,
                projection: {
                  ...a.projection,
                  zoneId: a.projection.zoneId ?? ("audience" as const),
                  role: a.projection.role ?? ("guest" as const)
                }
              }
            ];
          }
          return [k, a];
        })
      );
      return {
        avatars: avatarsZ,
        rooms: roomsWithZones,
        roomFieldEdges: p.roomFieldEdges ?? [],
        broadcasts: p.broadcasts ?? {},
        broadcastProjections: p.broadcastProjections ?? {},
        directorByRoomUid: p.directorByRoomUid ?? {},
        voiceStubByRoomUid: p.voiceStubByRoomUid ?? {},
        companionAgents: p.companionAgents ?? {},
        pets: p.pets ?? {}
      };
    })(),
    runtime: {
      ...base.runtime,
      currentPanel: base.runtime?.currentPanel ?? "kernel-console",
      activeBranchId: base.runtime?.activeBranchId ?? "branch:main"
    },
    registry: {
      ...base.registry,
      causalGraph: mergePersistedCausalGraph(reg.causalGraph)
    },
    entityProjectionCache: base.entityProjectionCache ?? {}
  };
}
