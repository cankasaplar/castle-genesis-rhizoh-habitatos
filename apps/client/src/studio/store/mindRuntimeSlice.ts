import { KernelGuardRun } from "../runtime/kernelGuard";
import {
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry,
  ensureBranchRecord
} from "../runtime/causalGraph.js";
import { appendCausalNode } from "../runtime/graphReducer";
import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
import { ENTITY_CACHE_KEY, projectEntity } from "../runtime/projectionReducer";
import { buildMindTickCausalNode } from "../runtime/mindCausalFactory";
import { buildTickSeed, computeMindTick, defaultMindRuntimeState } from "../runtime/mindRuntime";
import type { MindInstance, RSKMindRuntimeState, Soul, StudioResult } from "../types/rskOntology";
import { defaultCausalEconomy } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export function ensureMindRuntimeForInstance(instanceId: string): void {
  const s = getStudioKernelState();
  if (!s.registry.mind.instance[instanceId]) return;
  if (s.mindRuntime[instanceId]) return;
  setStudioKernelState({
    ...s,
    mindRuntime: { ...s.mindRuntime, [instanceId]: defaultMindRuntimeState() }
  });
}

export function tickMind(
  instanceId: string,
  context?: unknown,
  explicitSeed?: string
): StudioResult<RSKMindRuntimeState> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "registry.mind.tick",
    payload: { instanceId, context, seed: explicitSeed }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };

  const payload = res.sanitizedPayload as { instanceId: string; context?: unknown; seed?: string };
  const id = payload.instanceId;

  const s = getStudioKernelState();
  const instance = s.registry.mind.instance[id] as MindInstance | undefined;
  if (!instance) return { ok: false, error: "mind_instance_not_found" };

  const prev = s.mindRuntime[id] ?? defaultMindRuntimeState();
  const soul: Soul | undefined = instance.soulUid ? s.registry.soul[instance.soulUid] : undefined;
  const continuity = soul?.continuityHash ?? instance.uid;
  const tickIdx = s.worldPhysics.globalTick;
  const seed = buildTickSeed({
    continuityHash: continuity,
    explicitSeed: payload.seed,
    tickIndex: tickIdx
  });
  const wall = Date.now();
  const next = computeMindTick(prev, instance, soul, {
    context: payload.context ?? context,
    seed,
    tickIndex: tickIdx,
    nowMs: wall
  });

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = s.registry.causalGraph ?? defaultCausalGraphRegistry();
  if (branchId !== CAUSAL_MAIN_BRANCH_ID && !causalGraph.branches[branchId]) {
    const trunkDepth = causalGraph.branches[CAUSAL_MAIN_BRANCH_ID]?.lineageDepth ?? 0;
    causalGraph = ensureBranchRecord(causalGraph, {
      id: branchId,
      parentBranchId: CAUSAL_MAIN_BRANCH_ID,
      forkTick: tickIdx,
      forkCauseNodeId: CAUSAL_GENESIS_NODE_ID,
      status: "active",
      lineageDepth: trunkDepth + 1
    });
  }
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const tailKey = `${branchId}::${id}`;
  const causeTail = causalGraph.writerHeads[tailKey] ?? CAUSAL_GENESIS_NODE_ID;
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const charge = estimateEconomyForNodeType("mind");
  const econGate = assertEconomyAllowsAppend(econBase, charge);
  if (!econGate.ok) {
    return { ok: false, error: econGate.error };
  }

  const causalNode = withEconomyPayload(
    buildMindTickCausalNode({
      branchId,
      mindInstanceId: id,
      tickIndex: tickIdx,
      timestamp: wall,
      actorId,
      causeIds: [causeTail],
      prev,
      next,
      inputContext: payload.context ?? context,
      outputContext: undefined
    })
  );
  const appended = appendCausalNode(causalGraph, causalNode, id);
  if (!appended.ok) {
    return { ok: false, error: appended.error };
  }
  causalGraph = appended.graph;

  let entityProjectionCache = s.entityProjectionCache ?? {};
  if (causalNode.payload.affectsEntityIds?.length) {
    entityProjectionCache = { ...entityProjectionCache };
    for (const eid of causalNode.payload.affectsEntityIds) {
      entityProjectionCache[ENTITY_CACHE_KEY(branchId, eid)] = projectEntity(causalGraph, eid, branchId);
    }
  }

  setStudioKernelState({
    ...s,
    worldPhysics: { ...s.worldPhysics, globalTick: s.worldPhysics.globalTick + 1 },
    mindRuntime: { ...s.mindRuntime, [id]: next },
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    entityProjectionCache
  });
  return { ok: true, value: next };
}
