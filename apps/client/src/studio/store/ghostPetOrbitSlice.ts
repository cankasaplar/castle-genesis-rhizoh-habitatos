/**
 * Ghost pet orbit v1 — causal pet.spawn / follow / observe / react + PetProjection (ambient life).
 */

import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
import {
  buildPetDepartCausalNode,
  buildPetFollowCausalNode,
  buildPetObserveCausalNode,
  buildPetReactCausalNode,
  buildPetSpawnCausalNode
} from "../runtime/petGhostCausalFactory.js";
import {
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry,
  ensureBranchRecord
} from "../runtime/causalGraph.js";
import { appendCausalNode } from "../runtime/graphReducer";
import { KernelGuardRun } from "../runtime/kernelGuard";
import { stableRhizohCompanionUid } from "./rhizohCompanionSlice";
import { PET_GHOST_ORBIT_PHASE_DEFAULT, petGhostOrbitTransform } from "../lib/petGhostOrbit";
import type {
  CausalGraphRegistry,
  CausalEconomyLayerState,
  PetProjection,
  PresenceLayerState,
  StudioKernelState,
  StudioResult
} from "../types/rskOntology.js";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export function stablePetSlotUid(ownerAvatarUid: string): string {
  return `pet:bound:${ownerAvatarUid}`;
}

export function isGhostPetSummon(petUid: string): boolean {
  return String(petUid || "").toLowerCase().startsWith("ghost:");
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

function nextPetTick(
  graph: CausalGraphRegistry,
  branchId: string,
  petSlotUid: string,
  floorTick: number
): number {
  const wkey = `${branchId}::pet:${petSlotUid}`;
  const tipId = graph.writerHeads[wkey];
  const tip = tipId ? graph.nodes[tipId] : undefined;
  return Math.max(floorTick, (tip?.tickIndex ?? -1) + 1);
}

export function presenceWithSyncedPetTransforms(
  pres: PresenceLayerState,
  ownerAvatarUid: string,
  ownerTransform: { x: number; y: number; z: number; rotY: number },
  roomUid: string
): PresenceLayerState {
  const slot = stablePetSlotUid(ownerAvatarUid);
  const pet = pres.pets?.[slot];
  if (!pet || pet.roomUid !== roomUid) return pres;
  const t = petGhostOrbitTransform(ownerTransform, PET_GHOST_ORBIT_PHASE_DEFAULT);
  return {
    ...pres,
    pets: {
      ...(pres.pets ?? {}),
      [slot]: { ...pet, transform: t }
    }
  };
}

export function ghostPetAppendOrbitChain(input: {
  s: StudioKernelState;
  pres: PresenceLayerState;
  causalGraph: CausalGraphRegistry;
  causalEconomy: CausalEconomyLayerState;
  branchId: string;
  actorId: string;
  wall: number;
  summonNodeId: string;
  ownerAvatarUid: string;
  roomUid: string;
  displayPetUid: string;
}): StudioResult<{
  causalGraph: CausalGraphRegistry;
  presence: PresenceLayerState;
  causalEconomy: CausalEconomyLayerState;
}> {
  const slot = stablePetSlotUid(input.ownerAvatarUid);
  const writer = `pet:${slot}`;
  const summonNode = input.causalGraph.nodes[input.summonNodeId];
  if (!summonNode) return { ok: false, error: "summon_node_missing" };

  let graph = input.causalGraph;
  let econ = input.causalEconomy;
  const charge = estimateEconomyForNodeType("tool");
  let pres: PresenceLayerState = input.pres;
  const floorTick = Math.max(input.s.worldPhysics.globalTick, summonNode.tickIndex + 1);
  let causeId = input.summonNodeId;

  const ownerAv = pres.avatars[input.ownerAvatarUid];
  const ownerT = ownerAv?.projection?.transform;
  if (!ownerT) return { ok: false, error: "owner_transform_required" };

  const rhizohUid = pres.avatars[input.ownerAvatarUid]?.companionAgentUid ?? stableRhizohCompanionUid(input.ownerAvatarUid);
  const rhizohPresent = !!pres.companionAgents?.[rhizohUid];
  const rhizohRef = rhizohPresent ? rhizohUid : undefined;

  const echoKind = ownerAv.projection?.lastReactionKind ?? "calm";
  const existing = pres.pets?.[slot];

  if (!existing) {
    const spawnTick = nextPetTick(graph, input.branchId, slot, floorTick);
    const spawnPayload = {
      petSlotUid: slot,
      petUid: input.displayPetUid,
      ownerAvatarUid: input.ownerAvatarUid,
      roomUid: input.roomUid
    };
    const g0 = KernelGuardRun({ identity: input.s.identity, action: "presence.pet.spawn", payload: spawnPayload });
    if (!g0.allowed) return { ok: false, error: g0.error ?? "kernel_guard_denied" };

    const spawnNode = withEconomyPayload(
      buildPetSpawnCausalNode({
        petSlotUid: slot,
        displayPetUid: input.displayPetUid,
        ownerAvatarUid: input.ownerAvatarUid,
        roomUid: input.roomUid,
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

    const proj0: PetProjection = {
      uid: slot,
      displayPetUid: input.displayPetUid,
      ownerAvatarUid: input.ownerAvatarUid,
      roomUid: input.roomUid,
      kind: "ghost",
      state: "orbit",
      transform: petGhostOrbitTransform(ownerT, PET_GHOST_ORBIT_PHASE_DEFAULT),
      rhizohAgentUid: rhizohRef,
      lastStateAt: input.wall
    };
    pres = {
      ...pres,
      pets: { ...(pres.pets ?? {}), [slot]: proj0 },
      avatars: {
        ...pres.avatars,
        [input.ownerAvatarUid]: {
          ...ownerAv,
          ghostPetSlotUid: slot
        }
      }
    };
  }

  const followTick = nextPetTick(graph, input.branchId, slot, floorTick);
  const followPayload = {
    petSlotUid: slot,
    ownerAvatarUid: input.ownerAvatarUid,
    roomUid: input.roomUid
  };
  const g1 = KernelGuardRun({ identity: input.s.identity, action: "presence.pet.follow", payload: followPayload });
  if (!g1.allowed) return { ok: false, error: g1.error ?? "kernel_guard_denied" };

  const followNode = withEconomyPayload(
    buildPetFollowCausalNode({
      ...followPayload,
      branchId: input.branchId,
      tickIndex: followTick,
      timestamp: input.wall,
      actorId: input.actorId,
      causeIds: [causeId]
    })
  );
  const ap1 = appendCausalNode(graph, followNode, writer);
  if (!ap1.ok) return ap1;
  graph = ap1.graph;
  econ = accumulateEconomy(econ, charge);
  causeId = followNode.id;

  const observeTick = nextPetTick(graph, input.branchId, slot, followNode.tickIndex + 1);
  const observePayload = { petSlotUid: slot, roomUid: input.roomUid, rhizohAgentUid: rhizohRef };
  const g2 = KernelGuardRun({ identity: input.s.identity, action: "presence.pet.observe", payload: observePayload });
  if (!g2.allowed) return { ok: false, error: g2.error ?? "kernel_guard_denied" };

  const observeNode = withEconomyPayload(
    buildPetObserveCausalNode({
      ...observePayload,
      branchId: input.branchId,
      tickIndex: observeTick,
      timestamp: input.wall,
      actorId: input.actorId,
      causeIds: [causeId]
    })
  );
  const ap2 = appendCausalNode(graph, observeNode, writer);
  if (!ap2.ok) return ap2;
  graph = ap2.graph;
  econ = accumulateEconomy(econ, charge);
  causeId = observeNode.id;

  const reactTick = nextPetTick(graph, input.branchId, slot, observeNode.tickIndex + 1);
  const reactPayload = { petSlotUid: slot, roomUid: input.roomUid, echoKind };
  const g3 = KernelGuardRun({ identity: input.s.identity, action: "presence.pet.react", payload: reactPayload });
  if (!g3.allowed) return { ok: false, error: g3.error ?? "kernel_guard_denied" };

  const reactNode = withEconomyPayload(
    buildPetReactCausalNode({
      ...reactPayload,
      branchId: input.branchId,
      tickIndex: reactTick,
      timestamp: input.wall,
      actorId: input.actorId,
      causeIds: [causeId]
    })
  );
  const ap3 = appendCausalNode(graph, reactNode, writer);
  if (!ap3.ok) return ap3;
  graph = ap3.graph;
  econ = accumulateEconomy(econ, charge);

  const prevPet = pres.pets![slot]!;
  const ownerT2 = pres.avatars[input.ownerAvatarUid]?.projection?.transform ?? ownerT;
  pres = {
    ...pres,
    pets: {
      ...(pres.pets ?? {}),
      [slot]: {
        ...prevPet,
        displayPetUid: input.displayPetUid,
        state: "orbit",
        lastEchoKind: echoKind,
        rhizohAgentUid: rhizohRef,
        lastStateAt: input.wall,
        transform: petGhostOrbitTransform(ownerT2, PET_GHOST_ORBIT_PHASE_DEFAULT)
      }
    }
  };

  return { ok: true, value: { causalGraph: graph, presence: pres, causalEconomy: econ } };
}

export function ghostPetDepart(payload: { ownerAvatarUid: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const pres0 = s0.presence ?? defaultPresence();
  const av0 = pres0.avatars[payload.ownerAvatarUid];
  const slot = av0?.ghostPetSlotUid ?? stablePetSlotUid(payload.ownerAvatarUid);
  if (!pres0.pets?.[slot]) return { ok: false, error: "ghost_pet_not_spawned" };
  const roomUid = pres0.pets[slot]!.roomUid;

  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.pet.depart",
    payload: { petSlotUid: slot, roomUid }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const av = pres.avatars[payload.ownerAvatarUid];
  const p = res.sanitizedPayload as { petSlotUid: string; roomUid: string };

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writer = `pet:${p.petSlotUid}`;
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
    buildPetDepartCausalNode({
      petSlotUid: p.petSlotUid,
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

  const restPets = { ...(pres.pets ?? {}) };
  delete restPets[p.petSlotUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };
  const proj = av.projection;
  const nextProj = proj ? { ...proj, summonedPetUid: undefined } : undefined;
  const nextAv = {
    ...av,
    ghostPetSlotUid: undefined,
    ...(nextProj ? { projection: nextProj } : {})
  };

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: {
      ...pres,
      pets: restPets,
      avatars: { ...pres.avatars, [payload.ownerAvatarUid]: nextAv }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}
