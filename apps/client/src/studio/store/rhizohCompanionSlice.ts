/**
 * Rhizoh Companion v1 — causal agent.spawn / listen / respond + AgentProjection (intelligence in the hall).
 */

import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
import {
  buildAgentDepartCausalNode,
  buildAgentListenCausalNode,
  buildAgentRespondCausalNode,
  buildAgentSpawnCausalNode
} from "../runtime/companionAgentCausalFactory.js";
import {
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry,
  ensureBranchRecord
} from "../runtime/causalGraph.js";
import { appendCausalNode } from "../runtime/graphReducer";
import { KernelGuardRun } from "../runtime/kernelGuard";
import { companionOrbitTransform, RHIZOH_ORBIT_PHASE_DEFAULT } from "../lib/rhizohCompanionOrbit";
import type {
  AgentProjection,
  CausalGraphRegistry,
  CausalEconomyLayerState,
  PresenceLayerState,
  StudioKernelState,
  StudioResult
} from "../types/rskOntology.js";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export function stableRhizohCompanionUid(ownerAvatarUid: string): string {
  return `rhizoh:companion:${ownerAvatarUid}`;
}

export function isRhizohCompanionInvoke(agentUid: string, intent?: string): boolean {
  if (agentUid.toLowerCase().includes("rhizoh")) return true;
  if (intent && /@rhizoh\b/i.test(intent)) return true;
  return false;
}

function attentionTargetUid(
  pres: PresenceLayerState,
  roomUid: string,
  ownerAvatarUid: string
): string {
  const members = pres.rooms[roomUid]?.memberAvatarUids ?? [];
  for (const uid of members) {
    if (uid === ownerAvatarUid) continue;
    const st = pres.avatars[uid]?.projection?.status;
    if (st === "talking" || st === "broadcasting") return uid;
  }
  return ownerAvatarUid;
}

function stubResponseSummary(intent: string | undefined): string {
  const t = (intent ?? "").trim().slice(0, 160);
  return t ? `Rhizoh · ${t}` : "Rhizoh · here.";
}

function ensureBranch(s: StudioKernelState, branchId: string, causalGraph: CausalGraphRegistry) {
  let cg = causalGraph;
  if (branchId !== CAUSAL_MAIN_BRANCH_ID && !cg.branches[branchId]) {
    const trunkDepth = cg.branches[CAUSAL_MAIN_BRANCH_ID]?.lineageDepth ?? 0;
    cg = ensureBranchRecord(cg, {
      id: branchId,
      parentBranchId: CAUSAL_MAIN_BRANCH_ID,
      forkTick: s.worldPhysics.globalTick,
      forkCauseNodeId: CAUSAL_GENESIS_NODE_ID,
      status: "active",
      lineageDepth: trunkDepth + 1
    });
  }
  return cg;
}

function nextCompanionTick(
  graph: CausalGraphRegistry,
  branchId: string,
  companionKey: string,
  floorTick: number
): number {
  const wkey = `${branchId}::companion:${companionKey}`;
  const tipId = graph.writerHeads[wkey];
  const tip = tipId ? graph.nodes[tipId] : undefined;
  return Math.max(floorTick, (tip?.tickIndex ?? -1) + 1);
}

/**
 * After owner avatar moves in-room, keep companion mesh anchor aligned (kernel projection).
 */
export function presenceWithSyncedCompanionTransforms(
  pres: PresenceLayerState,
  ownerAvatarUid: string,
  ownerTransform: { x: number; y: number; z: number; rotY: number },
  roomUid: string
): PresenceLayerState {
  const agentUid = pres.avatars[ownerAvatarUid]?.companionAgentUid;
  if (!agentUid) return pres;
  const ag = pres.companionAgents?.[agentUid];
  if (!ag || ag.roomUid !== roomUid) return pres;
  const t = companionOrbitTransform(ownerTransform, RHIZOH_ORBIT_PHASE_DEFAULT);
  return {
    ...pres,
    companionAgents: {
      ...(pres.companionAgents ?? {}),
      [agentUid]: { ...ag, transform: t }
    }
  };
}

export function companionAppendRhizohChain(input: {
  s: StudioKernelState;
  pres: PresenceLayerState;
  causalGraph: CausalGraphRegistry;
  causalEconomy: CausalEconomyLayerState;
  branchId: string;
  actorId: string;
  wall: number;
  invokeNodeId: string;
  ownerAvatarUid: string;
  roomUid: string;
  intent?: string;
}): StudioResult<{
  causalGraph: CausalGraphRegistry;
  presence: PresenceLayerState;
  causalEconomy: CausalEconomyLayerState;
}> {
  const companionKey = stableRhizohCompanionUid(input.ownerAvatarUid);
  const writer = `companion:${companionKey}`;
  const invokeNode = input.causalGraph.nodes[input.invokeNodeId];
  if (!invokeNode) return { ok: false, error: "invoke_node_missing" };

  let graph = input.causalGraph;
  let econ = input.causalEconomy;
  const charge = estimateEconomyForNodeType("tool");
  let pres: PresenceLayerState = input.pres;
  const floorTick = Math.max(input.s.worldPhysics.globalTick, invokeNode.tickIndex + 1);
  let causeId = input.invokeNodeId;

  const ownerAv = pres.avatars[input.ownerAvatarUid];
  const ownerT = ownerAv?.projection?.transform;
  if (!ownerT) return { ok: false, error: "owner_transform_required" };

  const attention = attentionTargetUid(pres, input.roomUid, input.ownerAvatarUid);
  const existing = pres.companionAgents?.[companionKey];

  if (!existing) {
    const spawnTick = nextCompanionTick(graph, input.branchId, companionKey, floorTick);
    const spawnPayload = {
      agentUid: companionKey,
      ownerAvatarUid: input.ownerAvatarUid,
      roomUid: input.roomUid,
      archetype: "rhizoh" as const
    };
    const g0 = KernelGuardRun({
      identity: input.s.identity,
      action: "presence.agent.spawn",
      payload: spawnPayload
    });
    if (!g0.allowed) return { ok: false, error: g0.error ?? "kernel_guard_denied" };

    const spawnNode = withEconomyPayload(
      buildAgentSpawnCausalNode({
        ...spawnPayload,
        branchId: input.branchId,
        tickIndex: spawnTick,
        timestamp: input.wall,
        actorId: input.actorId,
        causeIds: [causeId]
      })
    );
    const ap0 = appendCausalNode(graph, spawnNode, writer);
    if (!ap0.ok) return ap0;
    graph = ap0.graph;
    econ = accumulateEconomy(econ, charge);
    causeId = spawnNode.id;

    const proj0: AgentProjection = {
      uid: companionKey,
      archetype: "rhizoh",
      ownerAvatarUid: input.ownerAvatarUid,
      roomUid: input.roomUid,
      state: "listening",
      transform: companionOrbitTransform(ownerT, RHIZOH_ORBIT_PHASE_DEFAULT),
      attentionTargetUid: attention,
      lastStateAt: input.wall
    };
    pres = {
      ...pres,
      companionAgents: { ...(pres.companionAgents ?? {}), [companionKey]: proj0 },
      avatars: {
        ...pres.avatars,
        [input.ownerAvatarUid]: {
          ...ownerAv,
          companionAgentUid: companionKey
        }
      }
    };
  }

  const listenTick = nextCompanionTick(graph, input.branchId, companionKey, floorTick);
  const listenPayload = {
    agentUid: companionKey,
    roomUid: input.roomUid,
    ownerAvatarUid: input.ownerAvatarUid,
    attentionTargetUid: attention
  };
  const g1 = KernelGuardRun({ identity: input.s.identity, action: "presence.agent.listen", payload: listenPayload });
  if (!g1.allowed) return { ok: false, error: g1.error ?? "kernel_guard_denied" };

  const listenNode = withEconomyPayload(
    buildAgentListenCausalNode({
      ...listenPayload,
      branchId: input.branchId,
      tickIndex: listenTick,
      timestamp: input.wall,
      actorId: input.actorId,
      causeIds: [causeId]
    })
  );
  const ap1 = appendCausalNode(graph, listenNode, writer);
  if (!ap1.ok) return ap1;
  graph = ap1.graph;
  econ = accumulateEconomy(econ, charge);
  causeId = listenNode.id;

  const summary = stubResponseSummary(input.intent);
  const respondTick = nextCompanionTick(graph, input.branchId, companionKey, listenNode.tickIndex + 1);
  const respondPayload = { agentUid: companionKey, roomUid: input.roomUid, summary };
  const g2 = KernelGuardRun({ identity: input.s.identity, action: "presence.agent.respond", payload: respondPayload });
  if (!g2.allowed) return { ok: false, error: g2.error ?? "kernel_guard_denied" };

  const respondNode = withEconomyPayload(
    buildAgentRespondCausalNode({
      ...respondPayload,
      branchId: input.branchId,
      tickIndex: respondTick,
      timestamp: input.wall,
      actorId: input.actorId,
      causeIds: [causeId]
    })
  );
  const ap2 = appendCausalNode(graph, respondNode, writer);
  if (!ap2.ok) return ap2;
  graph = ap2.graph;
  econ = accumulateEconomy(econ, charge);

  const prevAg = pres.companionAgents![companionKey]!;
  const ownerT2 = pres.avatars[input.ownerAvatarUid]?.projection?.transform ?? ownerT;
  pres = {
    ...pres,
    companionAgents: {
      ...(pres.companionAgents ?? {}),
      [companionKey]: {
        ...prevAg,
        state: "orbiting",
        attentionTargetUid: attention,
        lastResponseSummary: summary,
        lastStateAt: input.wall,
        transform: companionOrbitTransform(ownerT2, RHIZOH_ORBIT_PHASE_DEFAULT)
      }
    }
  };

  return { ok: true, value: { causalGraph: graph, presence: pres, causalEconomy: econ } };
}

export function rhizohCompanionDepart(payload: { ownerAvatarUid: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const pres0 = s0.presence ?? defaultPresence();
  const av0 = pres0.avatars[payload.ownerAvatarUid];
  const key0 = av0?.companionAgentUid;
  if (!key0 || !pres0.companionAgents?.[key0]) return { ok: false, error: "companion_not_spawned" };
  const roomUid0 = pres0.companionAgents[key0]!.roomUid;

  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.agent.depart",
    payload: { agentUid: key0, roomUid: roomUid0 }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const av = pres.avatars[payload.ownerAvatarUid];
  const key = av?.companionAgentUid;
  if (!key || !pres.companionAgents?.[key]) return { ok: false, error: "companion_not_spawned" };
  const roomUid = pres.companionAgents[key]!.roomUid;

  const p = res.sanitizedPayload as { agentUid: string; roomUid: string };
  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writer = `companion:${p.agentUid}`;
  const tailKey = `${branchId}::${writer}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, charge);
  if (!gate.ok) return gate;

  const node = withEconomyPayload(
    buildAgentDepartCausalNode({
      agentUid: p.agentUid,
      roomUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );
  const appended = appendCausalNode(causalGraph, node, writer);
  if (!appended.ok) return appended;
  causalGraph = appended.graph;

  const restAgents = { ...(pres.companionAgents ?? {}) };
  delete restAgents[key];
  const nextAv = { ...av, companionAgentUid: undefined };

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: {
      ...pres,
      companionAgents: restAgents,
      avatars: { ...pres.avatars, [payload.ownerAvatarUid]: nextAv }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}
