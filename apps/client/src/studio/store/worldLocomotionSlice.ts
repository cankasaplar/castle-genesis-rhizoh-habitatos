/**
 * World Transition Kernel v1 — ties avatar hall locomotion to region graph, chunk lifecycle, ecology hints.
 */
import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
import {
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry,
  ensureBranchRecord
} from "../runtime/causalGraph.js";
import { appendCausalNode } from "../runtime/graphReducer";
import { KernelGuardRun } from "../runtime/kernelGuard";
import {
  buildWorldAvatarRegionEnterCausalNode,
  buildWorldAvatarRegionLeaveCausalNode,
  buildWorldChunkActivateCausalNode,
  buildWorldChunkDeactivateCausalNode,
  buildWorldPortalCrossCausalNode
} from "../runtime/worldCausalFactory.js";
import type { CausalGraphRegistry, CausalNode, WorldRegion, WorldTopologyState } from "../types/rskOntology";
import {
  defaultCausalEconomy,
  defaultPresence,
  defaultSocietyEconomy,
  defaultWorldChunks,
  defaultWorldEcology,
  defaultWorldLocomotion,
  defaultWorldTopology
} from "./initialState.js";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

const PORTAL_DEBOUNCE_MS = 220;

function ensureBranch(
  s: ReturnType<typeof getStudioKernelState>,
  branchId: string,
  causalGraph: CausalGraphRegistry
) {
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

export function pickRegionUidAtWorldPosition(
  topology: WorldTopologyState,
  x: number,
  z: number
): string | undefined {
  const regions = Object.values(topology.regions ?? {});
  const sorted = [...regions].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const r of sorted) {
    const b = r.bounds;
    if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return r.uid;
  }
  return undefined;
}

function findPortalEdgeUid(topology: WorldTopologyState, from: string, to: string): string | undefined {
  for (const e of Object.values(topology.edges ?? {})) {
    if (e.fromRegionUid === from && e.toRegionUid === to) return e.uid;
    if (e.bidirectional && e.fromRegionUid === to && e.toRegionUid === from) return e.uid;
  }
  return undefined;
}

function nextMonotonicTick(
  graph: CausalGraphRegistry,
  branchId: string,
  writerSubject: string,
  s: ReturnType<typeof getStudioKernelState>,
  causeIds: readonly string[]
): number {
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = graph.writerHeads[tailKey];
  const lastTip = lastTipId ? graph.nodes[lastTipId] : undefined;
  let maxCauseTick = -1;
  for (const cid of causeIds) {
    const c = graph.nodes[cid];
    if (c && Number.isFinite(c.tickIndex) && c.tickIndex > maxCauseTick) maxCauseTick = c.tickIndex;
  }
  return Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1, maxCauseTick + 1);
}

function appendWorldTool(input: {
  s: ReturnType<typeof getStudioKernelState>;
  causalGraph: CausalGraphRegistry;
  econ: ReturnType<typeof defaultCausalEconomy>;
  writerSubject: string;
  node: CausalNode;
}): { ok: true; causalGraph: CausalGraphRegistry; econ: ReturnType<typeof defaultCausalEconomy> } | { ok: false; error: string } {
  const charge = estimateEconomyForNodeType("tool");
  const gate = assertEconomyAllowsAppend(input.econ, charge);
  if (!gate.ok) return { ok: false, error: gate.error };
  const node = withEconomyPayload(input.node);
  const appended = appendCausalNode(input.causalGraph, node, input.writerSubject);
  if (!appended.ok) return { ok: false, error: appended.error };
  return { ok: true, causalGraph: appended.graph, econ: accumulateEconomy(input.econ, charge) };
}

/**
 * After `presence.avatar.move` commits, resolves world region from hall xz, emits world causal chain on change.
 */
export function applyWorldLocomotionAfterAvatarMove(input: {
  avatarUid: string;
  roomUid: string;
  worldPos: { x: number; z: number };
  /** Last `avatar.move` causal node id — first world node chains from this. */
  lastMoveCauseNodeId: string;
}): void {
  const s0 = getStudioKernelState();
  const topology = s0.worldTopology ?? defaultWorldTopology();
  const loc0 = s0.worldLocomotion ?? defaultWorldLocomotion();
  const bound = topology.roomBindings[input.roomUid]?.regionUid;
  const picked = pickRegionUidAtWorldPosition(topology, input.worldPos.x, input.worldPos.z);
  const newRegion = picked ?? bound;
  if (!newRegion) return;

  const oldRegion = loc0.avatarRegionUid[input.avatarUid] ?? bound ?? newRegion;
  if (oldRegion === newRegion) {
    const cur = loc0.avatarRegionUid[input.avatarUid];
    if (cur === newRegion && loc0.activeRegionUid === newRegion) return;
    setStudioKernelState({
      ...s0,
      worldLocomotion: {
        ...loc0,
        avatarRegionUid: { ...loc0.avatarRegionUid, [input.avatarUid]: newRegion },
        activeRegionUid: newRegion
      }
    });
    return;
  }

  const now = Date.now();
  if (now - (loc0.lastCrossAtByAvatar[input.avatarUid] ?? 0) < PORTAL_DEBOUNCE_MS) return;

  const branchId = s0.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s0, branchId, s0.registry.causalGraph ?? defaultCausalGraphRegistry());
  let econ = s0.causalEconomy ?? defaultCausalEconomy();
  const wall = Date.now();
  const actorId = s0.identity.actor?.id ?? s0.identity.ownerId ?? "unknown";

  const writerAvatar = `world:avatar:${input.avatarUid}`;

  const tickLeave = nextMonotonicTick(causalGraph, branchId, writerAvatar, s0, [input.lastMoveCauseNodeId]);
  const leaveNode = buildWorldAvatarRegionLeaveCausalNode({
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    regionUid: oldRegion,
    x: input.worldPos.x,
    z: input.worldPos.z,
    branchId,
    tickIndex: tickLeave,
    timestamp: wall,
    actorId,
    causeIds: [input.lastMoveCauseNodeId]
  });
  const r0 = KernelGuardRun({
    identity: s0.identity,
    action: "world.avatar.region.leave",
    payload: leaveNode.payload.input
  });
  if (!r0.allowed) return;
  const ar0 = appendWorldTool({ s: s0, causalGraph, econ, writerSubject: writerAvatar, node: leaveNode });
  if (!ar0.ok) return;
  causalGraph = ar0.causalGraph;
  econ = ar0.econ;

  const portalUid = findPortalEdgeUid(topology, oldRegion, newRegion);
  let lastCause = leaveNode.id;
  let tick = nextMonotonicTick(causalGraph, branchId, writerAvatar, s0, [lastCause]);

  if (portalUid) {
    const crossNode = buildWorldPortalCrossCausalNode({
      avatarUid: input.avatarUid,
      roomUid: input.roomUid,
      fromRegionUid: oldRegion,
      toRegionUid: newRegion,
      portalEdgeUid: portalUid,
      x: input.worldPos.x,
      z: input.worldPos.z,
      branchId,
      tickIndex: tick,
      timestamp: wall,
      actorId,
      causeIds: [lastCause]
    });
    const r1 = KernelGuardRun({ identity: s0.identity, action: "world.portal.cross", payload: crossNode.payload.input });
    if (!r1.allowed) return;
    const ar1 = appendWorldTool({ s: s0, causalGraph, econ, writerSubject: writerAvatar, node: crossNode });
    if (!ar1.ok) return;
    causalGraph = ar1.causalGraph;
    econ = ar1.econ;
    lastCause = crossNode.id;
    tick = nextMonotonicTick(causalGraph, branchId, writerAvatar, s0, [lastCause]);
  }

  const enterNode = buildWorldAvatarRegionEnterCausalNode({
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    regionUid: newRegion,
    x: input.worldPos.x,
    z: input.worldPos.z,
    branchId,
    tickIndex: tick,
    timestamp: wall,
    actorId,
    causeIds: [lastCause]
  });
  const r2 = KernelGuardRun({ identity: s0.identity, action: "world.avatar.region.enter", payload: enterNode.payload.input });
  if (!r2.allowed) return;
  const ar2 = appendWorldTool({ s: s0, causalGraph, econ, writerSubject: writerAvatar, node: enterNode });
  if (!ar2.ok) return;
  causalGraph = ar2.causalGraph;
  econ = ar2.econ;

  const writerChunkOld = `world:chunk:${oldRegion}`;
  const tickCo = nextMonotonicTick(causalGraph, branchId, writerChunkOld, s0, [enterNode.id]);
  const deact = buildWorldChunkDeactivateCausalNode({
    regionUid: oldRegion,
    branchId,
    tickIndex: tickCo,
    timestamp: wall,
    actorId,
    causeIds: [CAUSAL_GENESIS_NODE_ID]
  });
  const r3 = KernelGuardRun({ identity: s0.identity, action: "world.chunk.deactivate", payload: deact.payload.input });
  if (r3.allowed) {
    const ar3 = appendWorldTool({ s: s0, causalGraph, econ, writerSubject: writerChunkOld, node: deact });
    if (ar3.ok) {
      causalGraph = ar3.causalGraph;
      econ = ar3.econ;
    }
  }

  const writerChunkNew = `world:chunk:${newRegion}`;
  const tickCn = nextMonotonicTick(causalGraph, branchId, writerChunkNew, s0, [enterNode.id]);
  const act = buildWorldChunkActivateCausalNode({
    regionUid: newRegion,
    branchId,
    tickIndex: tickCn,
    timestamp: wall,
    actorId,
    causeIds: [enterNode.id]
  });
  const r4 = KernelGuardRun({ identity: s0.identity, action: "world.chunk.activate", payload: act.payload.input });
  if (r4.allowed) {
    const ar4 = appendWorldTool({ s: s0, causalGraph, econ, writerSubject: writerChunkNew, node: act });
    if (ar4.ok) {
      causalGraph = ar4.causalGraph;
      econ = ar4.econ;
    }
  }

  const chunks = s0.worldChunks ?? defaultWorldChunks();
  const eco = s0.worldEcology ?? defaultWorldEcology();
  const prevOld = chunks.chunks[oldRegion];
  const prevNew = chunks.chunks[newRegion];
  const occOld = Math.max(0, (prevOld?.occupancy ?? 1) - 1);
  const occNew = (prevNew?.occupancy ?? 0) + 1;
  const nextChunks = {
    ...chunks,
    chunks: {
      ...chunks.chunks,
      [oldRegion]: {
        regionUid: oldRegion,
        loaded: occOld > 0,
        occupancy: occOld,
        lastUnloadedAt: occOld === 0 ? wall : prevOld?.lastUnloadedAt,
        lastLoadedAt: prevOld?.lastLoadedAt,
        ownerId: prevOld?.ownerId
      },
      [newRegion]: {
        regionUid: newRegion,
        loaded: true,
        occupancy: occNew,
        lastLoadedAt: wall,
        lastUnloadedAt: prevNew?.lastUnloadedAt,
        ownerId: s0.identity.ownerId ?? prevNew?.ownerId
      }
    }
  };

  const healthNew = Math.min(1, (eco.healthByRegionUid[newRegion] ?? 0.7) + 0.012);
  const healthOld = Math.max(0, (eco.healthByRegionUid[oldRegion] ?? 0.7) - 0.004);

  const pres = s0.presence ?? defaultPresence();
  const av = pres.avatars[input.avatarUid];
  const presNext = av
    ? {
        ...pres,
        avatars: {
          ...pres.avatars,
          [input.avatarUid]: { ...av, worldRegionUid: newRegion }
        }
      }
    : pres;

  const dirMap = presNext.directorByRoomUid ?? pres.directorByRoomUid;
  const dir = dirMap?.[input.roomUid];
  const directorByRoomUid =
    dir != null
      ? {
          ...(dirMap ?? {}),
          [input.roomUid]: { ...dir, sceneMode: `world:${newRegion}` }
        }
      : dirMap;

  const s1 = getStudioKernelState();
  const society0 = s1.societyEconomy ?? defaultSocietyEconomy();
  const societyEconomy = {
    ...society0,
    marketHeatByRegionUid: {
      ...society0.marketHeatByRegionUid,
      [newRegion]: Math.max(0, (society0.marketHeatByRegionUid[newRegion] ?? 0) + 0.02)
    }
  };

  setStudioKernelState({
    ...s1,
    registry: { ...s1.registry, causalGraph },
    causalEconomy: econ,
    societyEconomy,
    worldChunks: nextChunks,
    worldEcology: {
      ...eco,
      healthByRegionUid: {
        ...eco.healthByRegionUid,
        [newRegion]: healthNew,
        [oldRegion]: healthOld
      }
    },
    worldLocomotion: {
      ...(s1.worldLocomotion ?? defaultWorldLocomotion()),
      avatarRegionUid: { ...(s1.worldLocomotion ?? loc0).avatarRegionUid, [input.avatarUid]: newRegion },
      lastCrossAtByAvatar: { ...(s1.worldLocomotion ?? loc0).lastCrossAtByAvatar, [input.avatarUid]: now },
      activeRegionUid: newRegion
    },
    presence: { ...presNext, directorByRoomUid: directorByRoomUid ?? presNext.directorByRoomUid }
  });
}
