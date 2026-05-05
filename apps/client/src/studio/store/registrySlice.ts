import { computeSoulContinuityHash } from "../lib/soulHash";
import {
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry
} from "../runtime/causalGraph.js";
import { buildEntityGenesisCausalNode } from "../runtime/entityCausalFactory";
import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
import { appendCausalNode } from "../runtime/graphReducer";
import { ENTITY_CACHE_KEY, projectEntity } from "../runtime/projectionReducer";
import { ensureMindRuntimeForInstance } from "./mindRuntimeSlice";
import { KernelGuardRun } from "../runtime/kernelGuard";
import { RSK_KERNEL_VERSION } from "../types/rskOntology";
import type {
  EntityRecord,
  GhostProfile,
  MindAlignment,
  MindDefinition,
  MindInstance,
  MindLifecycle,
  MindLink,
  MindPolicy,
  MemoryProfile,
  RegisterMindDefinitionInput,
  Soul,
  SoulMindBinding,
  SpawnMindInstanceInput,
  SpiralNode,
  StudioResult,
  ToolSpec
} from "../types/rskOntology.js";
import { defaultCausalEconomy } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export const DEFAULT_MIND_LIFECYCLE: MindLifecycle = {
  state: "draft",
  energy: 1,
  decay: 0
};

export const DEFAULT_MIND_ALIGNMENT: MindAlignment = {
  kernel: 0.55,
  creator: 0.35,
  autonomy: 0.1
};

function mergeLifecycle(partial?: Partial<MindLifecycle>): MindLifecycle {
  return { ...DEFAULT_MIND_LIFECYCLE, ...partial };
}

function mergeAlignment(partial?: Partial<MindAlignment>): MindAlignment {
  return { ...DEFAULT_MIND_ALIGNMENT, ...partial };
}

function withGuard<T>(
  action: string,
  payload: unknown,
  apply: (sanitized: unknown) => StudioResult<T>
): StudioResult<T> {
  const id = getStudioKernelState().identity;
  const res = KernelGuardRun({ identity: id, action, payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  return apply(res.sanitizedPayload ?? payload);
}

export function registerMindDefinition(
  input: RegisterMindDefinitionInput
): StudioResult<MindDefinition> {
  return withGuard("registry.mind.definition.register", input, (raw) => {
    const input = raw as RegisterMindDefinitionInput;
    const s = getStudioKernelState();
    if (s.registry.mind.definition[input.uid]) {
      return { ok: false, error: "mind_definition_uid_collision" };
    }
    const now = Date.now();
    const def: MindDefinition = {
      uid: input.uid,
      version: RSK_KERNEL_VERSION,
      label: input.label,
      metadata: {
        ...input.metadata,
        createdAt: input.metadata.createdAt ?? now
      },
      engine: input.engine,
      dna: input.dna,
      capabilities: input.capabilities,
      ...(input.defaultAlignment !== undefined ? { defaultAlignment: input.defaultAlignment } : {}),
      ...(input.soulUid !== undefined ? { soulUid: input.soulUid } : {}),
      ...(input.societyMindRole !== undefined ? { societyMindRole: input.societyMindRole } : {})
    };
    setStudioKernelState({
      ...s,
      registry: {
        ...s.registry,
        mind: {
          ...s.registry.mind,
          definition: { ...s.registry.mind.definition, [def.uid]: def }
        }
      }
    });
    return { ok: true, value: def };
  });
}

/** @deprecated use registerMindDefinition */
export function registerMind(input: RegisterMindDefinitionInput): StudioResult<MindDefinition> {
  return registerMindDefinition(input);
}

export function spawnMindInstance(input: SpawnMindInstanceInput): StudioResult<MindInstance> {
  return withGuard("registry.mind.instance.spawn", input, (raw) => {
    const input = raw as SpawnMindInstanceInput;
    const s = getStudioKernelState();
    const def = s.registry.mind.definition[input.definitionUid];
    if (!def) return { ok: false, error: "mind_definition_not_found" };
    if (s.registry.mind.instance[input.uid]) {
      return { ok: false, error: "mind_instance_uid_collision" };
    }
    const now = Date.now();
    const meta: MindInstance["metadata"] = {
      ...def.metadata,
      ...input.metadata,
      alias: input.metadata?.alias ?? def.metadata.alias,
      createdAt: input.metadata?.createdAt ?? now
    };
    const inst: MindInstance = {
      uid: input.uid,
      definitionUid: def.uid,
      version: RSK_KERNEL_VERSION,
      metadata: meta,
      engine: { ...def.engine },
      dna: { ...def.dna },
      capabilities: { ...def.capabilities },
      lifecycle: mergeLifecycle(input.lifecycle),
      alignment: mergeAlignment({
        ...DEFAULT_MIND_ALIGNMENT,
        ...def.defaultAlignment,
        ...input.alignment
      }),
      ...(input.soulUid !== undefined
        ? { soulUid: input.soulUid }
        : def.soulUid !== undefined
          ? { soulUid: def.soulUid }
          : {}),
      ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
      ...(input.sharedWith !== undefined ? { sharedWith: input.sharedWith } : {}),
      ...(input.societyMindRole !== undefined
        ? { societyMindRole: input.societyMindRole }
        : def.societyMindRole !== undefined
          ? { societyMindRole: def.societyMindRole }
          : {})
    };
    setStudioKernelState({
      ...s,
      registry: {
        ...s.registry,
        mind: {
          ...s.registry.mind,
          instance: { ...s.registry.mind.instance, [inst.uid]: inst }
        }
      }
    });
    ensureMindRuntimeForInstance(inst.uid);
    return { ok: true, value: inst };
  });
}

export function linkSoulToEntity(
  entityId: string,
  soulUid: string
): StudioResult<{ entity: EntityRecord; soul: Soul }> {
  return withGuard("registry.soul.entity.link", { entityId, soulUid }, (raw) => {
    const row = raw as { entityId: string; soulUid: string };
    const s = getStudioKernelState();
    const soul = s.registry.soul[row.soulUid];
    if (!soul) return { ok: false, error: "soul_not_found" };
    let entity = s.registry.entity[row.entityId];
    if (!entity) {
      entity = { uid: row.entityId, soulUid: row.soulUid, ownerId: soul.ownerId };
    } else {
      entity = { ...entity, soulUid: row.soulUid };
    }
    const linked = new Set([...(soul.linkedEntityIds ?? []), row.entityId]);
    const nextSoul: Soul = { ...soul, linkedEntityIds: [...linked] };
    setStudioKernelState({
      ...s,
      registry: {
        ...s.registry,
        entity: { ...s.registry.entity, [row.entityId]: entity },
        soul: { ...s.registry.soul, [row.soulUid]: nextSoul }
      }
    });
    return { ok: true, value: { entity, soul: nextSoul } };
  });
}

export function registerTool(spec: ToolSpec): StudioResult<ToolSpec> {
  return withGuard("registry.tool.register", spec, (raw) => {
    const spec = raw as ToolSpec;
    const s = getStudioKernelState();
    if (s.registry.tool[spec.uid]) return { ok: false, error: "tool_uid_collision" };
    setStudioKernelState({
      ...s,
      registry: { ...s.registry, tool: { ...s.registry.tool, [spec.uid]: spec } }
    });
    return { ok: true, value: spec };
  });
}

export function registerMemoryProfile(profile: MemoryProfile): StudioResult<MemoryProfile> {
  return withGuard("registry.memoryProfile.register", profile, (raw) => {
    const profile = raw as MemoryProfile;
    const s = getStudioKernelState();
    if (s.registry.memoryProfile[profile.uid]) return { ok: false, error: "memory_profile_uid_collision" };
    setStudioKernelState({
      ...s,
      registry: {
        ...s.registry,
        memoryProfile: { ...s.registry.memoryProfile, [profile.uid]: profile }
      }
    });
    return { ok: true, value: profile };
  });
}

export function registerPolicy(policy: MindPolicy): StudioResult<MindPolicy> {
  return withGuard("registry.policy.register", policy, (raw) => {
    const policy = raw as MindPolicy;
    const s = getStudioKernelState();
    if (s.registry.policy[policy.uid]) return { ok: false, error: "policy_uid_collision" };
    setStudioKernelState({
      ...s,
      registry: { ...s.registry, policy: { ...s.registry.policy, [policy.uid]: policy } }
    });
    return { ok: true, value: policy };
  });
}

export function registerEntity(entity: EntityRecord): StudioResult<EntityRecord> {
  return withGuard("registry.entity.register", entity, (raw) => {
    const entity = raw as EntityRecord;
    const s = getStudioKernelState();
    if (s.registry.entity[entity.uid]) return { ok: false, error: "entity_uid_collision" };

    const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
    let cg = s.registry.causalGraph ?? defaultCausalGraphRegistry();
    const tickIdx = s.worldPhysics.globalTick;
    const wall = Date.now();
    const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "system";
    const econBase = s.causalEconomy ?? defaultCausalEconomy();
    const entCharge = estimateEconomyForNodeType("entity");
    const econGate = assertEconomyAllowsAppend(econBase, entCharge);
    if (!econGate.ok) {
      return { ok: false, error: econGate.error };
    }

    const genesis = withEconomyPayload(
      buildEntityGenesisCausalNode({
        entityUid: entity.uid,
        tickIndex: tickIdx,
        timestamp: wall,
        actorId,
        branchId,
        causeIds: [CAUSAL_GENESIS_NODE_ID]
      })
    );
    const writerSubject = `entity:${entity.uid}`;
    const appended = appendCausalNode(cg, genesis, writerSubject);
    if (!appended.ok) {
      return { ok: false, error: `${appended.error}_entity_genesis` };
    }
    cg = appended.graph;
    const proj = projectEntity(cg, entity.uid, branchId, { soulUid: entity.soulUid });
    const cacheKey = ENTITY_CACHE_KEY(branchId, entity.uid);

    setStudioKernelState({
      ...s,
      registry: {
        ...s.registry,
        entity: { ...s.registry.entity, [entity.uid]: entity },
        causalGraph: cg
      },
      causalEconomy: accumulateEconomy(econBase, entCharge),
      entityProjectionCache: {
        ...(s.entityProjectionCache ?? {}),
        [cacheKey]: proj
      }
    });
    return { ok: true, value: entity };
  });
}

export function registerMindLink(link: MindLink): StudioResult<MindLink> {
  return withGuard("registry.link.attach", link, (raw) => {
    const row = raw as MindLink;
    const s = getStudioKernelState();
    if (!s.registry.mind.instance[row.mindInstanceId]) {
      return { ok: false, error: "mind_instance_not_found" };
    }
    if (s.registry.link[row.uid]) return { ok: false, error: "mind_link_uid_collision" };
    setStudioKernelState({
      ...s,
      registry: { ...s.registry, link: { ...s.registry.link, [row.uid]: row } }
    });
    return { ok: true, value: row };
  });
}

export function linkMindToEntity(
  mindInstanceId: string,
  entityId: string,
  partial?: Pick<MindLink, "bond" | "authority" | "sync" | "ownerId">
): StudioResult<MindLink> {
  const ownerId = partial?.ownerId ?? getStudioKernelState().identity.ownerId ?? "";
  if (!ownerId) return { ok: false, error: "owner_required_for_link" };
  const uid = `link:${ownerId}:${entityId}:${mindInstanceId}`;
  return registerMindLink({
    uid,
    ownerId,
    entityId,
    mindInstanceId,
    bond: partial?.bond ?? 0.5,
    authority: partial?.authority ?? 0.5,
    sync: partial?.sync ?? 1,
    state: "active",
    startedAt: Date.now()
  });
}

/** Entity first, then MindInstance (legacy arg order). */
export function linkMind(entityId: string, mindInstanceId: string): StudioResult<MindLink> {
  return linkMindToEntity(mindInstanceId, entityId);
}

/** @deprecated use {@link linkMindToEntity} */
export const attachMindToEntity = linkMindToEntity;
/** @deprecated use {@link linkMind} */
export const attachMind = linkMind;

export function registerSoul(soul: Soul): StudioResult<Soul> {
  return withGuard("registry.soul.register", soul, (raw) => {
    let soul = raw as Soul;
    const s = getStudioKernelState();
    if (!soul.ownerId || !String(soul.ownerId).trim()) {
      return { ok: false, error: "soul_owner_required" };
    }
    if (s.registry.soul[soul.uid]) return { ok: false, error: "soul_uid_collision" };
    if (!soul.continuityHash || !String(soul.continuityHash).trim()) {
      soul = {
        ...soul,
        continuityHash: computeSoulContinuityHash({
          mindUids: soul.linkedMindIds ?? [],
          entityUids: soul.linkedEntityIds ?? [],
          milestones: [
            ...(soul.history ?? []),
            soul.ownerId,
            JSON.stringify(soul.metadata ?? {})
          ]
        })
      };
    }
    setStudioKernelState({
      ...s,
      registry: { ...s.registry, soul: { ...s.registry.soul, [soul.uid]: soul } }
    });
    return { ok: true, value: soul };
  });
}

export function registerSoulMindBinding(row: SoulMindBinding): StudioResult<SoulMindBinding> {
  return withGuard("registry.soulMind.bind", row, (raw) => {
    const row = raw as SoulMindBinding;
    const s = getStudioKernelState();
    if (!s.registry.soul[row.soulUid]) return { ok: false, error: "soul_not_found" };
    if (!s.registry.mind.instance[row.mindInstanceUid]) return { ok: false, error: "mind_instance_not_found" };
    if (s.registry.soulMind[row.uid]) return { ok: false, error: "soul_mind_uid_collision" };
    setStudioKernelState({
      ...s,
      registry: { ...s.registry, soulMind: { ...s.registry.soulMind, [row.uid]: row } }
    });
    return { ok: true, value: row };
  });
}

export function linkSoulToMind(
  soulUid: string,
  mindInstanceUid: string,
  uid?: string
): StudioResult<SoulMindBinding> {
  const id = uid ?? `smb:${soulUid}:${mindInstanceUid}`;
  return registerSoulMindBinding({
    uid: id,
    soulUid,
    mindInstanceUid,
    state: "active"
  });
}

export function registerGhost(ghost: GhostProfile): StudioResult<GhostProfile> {
  return withGuard("registry.ghost.register", ghost, (raw) => {
    const ghost = raw as GhostProfile;
    const s = getStudioKernelState();
    if (!s.registry.soul[ghost.soulUid]) return { ok: false, error: "soul_not_found" };
    if (s.registry.ghost[ghost.uid]) return { ok: false, error: "ghost_uid_collision" };
    setStudioKernelState({
      ...s,
      registry: { ...s.registry, ghost: { ...s.registry.ghost, [ghost.uid]: ghost } }
    });
    return { ok: true, value: ghost };
  });
}

/** @deprecated alias */
export function registerGhostProfile(ghost: GhostProfile): StudioResult<GhostProfile> {
  return registerGhost(ghost);
}

export function upsertSpiralNode(node: SpiralNode): StudioResult<SpiralNode> {
  return withGuard("registry.spiral.upsert", node, (raw) => {
    const node = raw as SpiralNode;
    const s = getStudioKernelState();
    setStudioKernelState({
      ...s,
      registry: { ...s.registry, spiral: { ...s.registry.spiral, [node.id]: node } }
    });
    return { ok: true, value: node };
  });
}

export function upsertMindInstance(mind: MindInstance): StudioResult<MindInstance> {
  return withGuard("registry.mind.instance.upsert", mind, (raw) => {
    const mind = raw as MindInstance;
    const s = getStudioKernelState();
    setStudioKernelState({
      ...s,
      registry: {
        ...s.registry,
        mind: {
          ...s.registry.mind,
          instance: { ...s.registry.mind.instance, [mind.uid]: mind }
        }
      }
    });
    return { ok: true, value: mind };
  });
}
