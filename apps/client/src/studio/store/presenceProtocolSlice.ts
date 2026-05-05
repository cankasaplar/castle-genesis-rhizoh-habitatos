/**
 * Presence protocol — transport-agnostic causal atoms (voice / pet / agent / reactions sit on top).
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
  buildAvatarAgentInvokeCausalNode,
  buildAvatarPetSummonCausalNode,
  buildAvatarRaiseHandCausalNode,
  buildAvatarReactCausalNode,
  buildAvatarSpeakStartCausalNode,
  buildAvatarSpeakStopCausalNode
} from "../runtime/presenceCausalFactory.js";
import { mapReactionKindToRig } from "../lib/avatarRigHelpers";
import { avatarProjectionWithLookAt } from "../lib/presenceLookAt";
import { ensureRoomZones } from "../lib/presenceRoomZones";
import {
  companionAppendRhizohChain,
  isRhizohCompanionInvoke,
  stableRhizohCompanionUid
} from "./rhizohCompanionSlice.js";
import {
  ghostPetAppendOrbitChain,
  isGhostPetSummon,
  stablePetSlotUid
} from "./ghostPetOrbitSlice.js";
import type {
  AvatarEntity,
  AvatarSpatialPresenceStatus,
  CausalGraphRegistry,
  CausalNode,
  PresenceLayerState,
  PresenceRoom,
  PresenceZoneId,
  StudioKernelState,
  StudioResult
} from "../types/rskOntology.js";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

function ensureBranch(
  s: StudioKernelState,
  branchId: string,
  causalGraph: ReturnType<typeof defaultCausalGraphRegistry>
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

function requireRoomProjection(avatarUid: string): StudioResult<{
  s: StudioKernelState;
  pres: PresenceLayerState;
  av: AvatarEntity;
  roomUid: string;
  room: PresenceRoom;
}> {
  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const av = pres.avatars[avatarUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };
  const pr = av.projection;
  if (!pr || !av.currentRoomUid || pr.roomUid !== av.currentRoomUid) {
    return { ok: false, error: "projection_room_required" };
  }
  const room = pres.rooms[pr.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  if (!room.memberAvatarUids.includes(avatarUid)) return { ok: false, error: "avatar_not_in_room" };
  return { ok: true, value: { s, pres, av, roomUid: pr.roomUid, room } };
}

function appendPresenceWriter(input: {
  s: StudioKernelState;
  avatarUid: string;
  node: CausalNode;
  charge: ReturnType<typeof estimateEconomyForNodeType>;
}): StudioResult<{ causalGraph: CausalGraphRegistry }> {
  const econBase = input.s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, input.charge);
  if (!gate.ok) return { ok: false, error: gate.error };
  const writer = `presence:${input.avatarUid}`;
  const appended = appendCausalNode(input.s.registry.causalGraph, input.node, writer);
  if (!appended.ok) return { ok: false, error: appended.error };
  return { ok: true, value: { causalGraph: appended.graph } };
}

function zoneDefaultStatus(roomUid: string, zoneId: PresenceZoneId): AvatarSpatialPresenceStatus {
  const s = getStudioKernelState();
  const room = (s.presence ?? defaultPresence()).rooms[roomUid];
  if (!room) return "quiet";
  const z = ensureRoomZones(room)[zoneId];
  return z?.semantics?.defaultStatus ?? "quiet";
}

const VOICE_STUB_MAX_SEGMENTS = 64;

/** Close the latest open stub segment for `avatarUid` in `roomUid` (coalesce double speak.start). */
function closeVoiceStubOpenForAvatar(
  pres: PresenceLayerState,
  roomUid: string,
  avatarUid: string,
  endMs: number,
  causalStopNodeId?: string
): PresenceLayerState {
  const byRoom = { ...(pres.voiceStubByRoomUid ?? {}) };
  const rs = byRoom[roomUid];
  if (!rs?.segments.length) return pres;
  let hit = -1;
  for (let i = rs.segments.length - 1; i >= 0; i--) {
    const seg = rs.segments[i]!;
    if (seg.avatarUid === avatarUid && seg.endMs === undefined) {
      hit = i;
      break;
    }
  }
  if (hit < 0) return pres;
  const nextSegs = rs.segments.map((s, i) =>
    i === hit
      ? {
          ...s,
          endMs,
          ...(causalStopNodeId !== undefined ? { causalStopNodeId } : {})
        }
      : s
  );
  byRoom[roomUid] = { ...rs, segments: nextSegs };
  return { ...pres, voiceStubByRoomUid: byRoom };
}

function withVoiceStubSpeakStart(
  pres: PresenceLayerState,
  roomUid: string,
  avatarUid: string,
  startMs: number,
  causalStartNodeId: string
): PresenceLayerState {
  const closed = closeVoiceStubOpenForAvatar(pres, roomUid, avatarUid, startMs);
  const byRoom = { ...(closed.voiceStubByRoomUid ?? {}) };
  const rs = byRoom[roomUid] ?? { segments: [] };
  const segs = [...rs.segments, { avatarUid, startMs, causalStartNodeId }];
  byRoom[roomUid] = { segments: segs.slice(-VOICE_STUB_MAX_SEGMENTS) };
  return { ...closed, voiceStubByRoomUid: byRoom };
}

/** Read-only: last segments for a room (newest last). */
export function getVoiceStubSegmentsForRoom(roomUid: string) {
  const pres = getStudioKernelState().presence ?? defaultPresence();
  return pres.voiceStubByRoomUid?.[roomUid]?.segments ?? [];
}

export function presenceAvatarSpeakStart(payload: { avatarUid: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.avatar.speak.start", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { avatarUid: string };

  const ctx = requireRoomProjection(p.avatarUid);
  if (!ctx.ok) return ctx;
  const { s, pres, av, roomUid, room } = ctx.value;
  if (room.mutedAvatarUids?.includes(p.avatarUid)) return { ok: false, error: "muted" };

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writer = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writer}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, charge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildAvatarSpeakStartCausalNode({
      avatarUid: p.avatarUid,
      roomUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendPresenceWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, avatarUid: p.avatarUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const projection = avatarProjectionWithLookAt(pres, roomUid, p.avatarUid, {
    ...av.projection!,
    status: "talking" as const,
    rigAnimation: "talk",
    lastRigEventAt: wall
  });
  const voicePres = withVoiceStubSpeakStart(pres, roomUid, p.avatarUid, wall, node.id);
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: {
      ...voicePres,
      avatars: { ...voicePres.avatars, [p.avatarUid]: { ...av, projection } }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function presenceAvatarSpeakStop(payload: { avatarUid: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.avatar.speak.stop", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { avatarUid: string };

  const ctx = requireRoomProjection(p.avatarUid);
  if (!ctx.ok) return ctx;
  const { s, pres, av, roomUid } = ctx.value;
  const proj = av.projection!;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writer = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writer}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, charge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildAvatarSpeakStopCausalNode({
      avatarUid: p.avatarUid,
      roomUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendPresenceWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, avatarUid: p.avatarUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const nextStatus = zoneDefaultStatus(roomUid, proj.zoneId);
  const projection = avatarProjectionWithLookAt(pres, roomUid, p.avatarUid, {
    ...proj,
    status: nextStatus,
    rigAnimation: "idle",
    lastRigEventAt: wall
  });
  const voicePres = closeVoiceStubOpenForAvatar(pres, roomUid, p.avatarUid, wall, node.id);

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: {
      ...voicePres,
      avatars: { ...voicePres.avatars, [p.avatarUid]: { ...av, projection } }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function presenceAvatarReact(payload: { avatarUid: string; kind: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.avatar.react", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { avatarUid: string; kind: string };

  const ctx = requireRoomProjection(p.avatarUid);
  if (!ctx.ok) return ctx;
  const { s, pres, av, roomUid } = ctx.value;
  const proj = av.projection!;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writer = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writer}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, charge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildAvatarReactCausalNode({
      avatarUid: p.avatarUid,
      roomUid,
      kind: p.kind,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendPresenceWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, avatarUid: p.avatarUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const rigAnim = mapReactionKindToRig(p.kind);
  const projection = avatarProjectionWithLookAt(pres, roomUid, p.avatarUid, {
    ...proj,
    lastReactionKind: p.kind,
    lastReactionAt: wall,
    rigAnimation: rigAnim,
    rigMood: p.kind,
    lastRigEventAt: wall
  });

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: { ...pres, avatars: { ...pres.avatars, [p.avatarUid]: { ...av, projection } } }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function presenceAvatarRaiseHand(payload: {
  avatarUid: string;
  raised: boolean;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.avatar.raise_hand", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { avatarUid: string; raised: boolean };

  const ctx = requireRoomProjection(p.avatarUid);
  if (!ctx.ok) return ctx;
  const { s, pres, av, roomUid } = ctx.value;
  const proj = av.projection!;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writer = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writer}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, charge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildAvatarRaiseHandCausalNode({
      avatarUid: p.avatarUid,
      roomUid,
      raised: p.raised,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendPresenceWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, avatarUid: p.avatarUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const nextRig =
    p.raised ? ("think" as const) : proj.status === "talking" || proj.status === "broadcasting" ? ("talk" as const) : ("idle" as const);
  const projection = avatarProjectionWithLookAt(pres, roomUid, p.avatarUid, {
    ...proj,
    raisedHand: p.raised,
    rigAnimation: nextRig,
    rigGesture: p.raised ? "hand_raise" : undefined,
    lastRigEventAt: wall
  });

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: { ...pres, avatars: { ...pres.avatars, [p.avatarUid]: { ...av, projection } } }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function presenceAvatarPetSummon(payload: {
  avatarUid: string;
  petUid: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.avatar.pet.summon", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { avatarUid: string; petUid: string };

  const ctx = requireRoomProjection(p.avatarUid);
  if (!ctx.ok) return ctx;
  const { s, pres, av, roomUid } = ctx.value;
  const proj = av.projection!;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writer = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writer}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const slot = stablePetSlotUid(p.avatarUid);
  const ghost = isGhostPetSummon(p.petUid);
  const petExtras = ghost ? (pres.pets?.[slot] ? 3 : 4) : 0;
  const bundleCharge = {
    computeWeight: charge.computeWeight * (1 + petExtras),
    entropyImpact: charge.entropyImpact * (1 + petExtras)
  };
  const gate = assertEconomyAllowsAppend(econBase, bundleCharge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildAvatarPetSummonCausalNode({
      avatarUid: p.avatarUid,
      roomUid,
      petUid: p.petUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendPresenceWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, avatarUid: p.avatarUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const projection = { ...proj, summonedPetUid: p.petUid };

  let nextPres: PresenceLayerState = {
    ...pres,
    avatars: { ...pres.avatars, [p.avatarUid]: { ...av, projection } }
  };
  let nextGraph = causalGraph;
  let nextEcon = accumulateEconomy(econBase, charge);

  if (ghost) {
    const gr = ghostPetAppendOrbitChain({
      s,
      pres: nextPres,
      causalGraph: nextGraph,
      causalEconomy: nextEcon,
      branchId,
      actorId,
      wall,
      summonNodeId: node.id,
      ownerAvatarUid: p.avatarUid,
      roomUid,
      displayPetUid: p.petUid
    });
    if (!gr.ok) return gr;
    nextGraph = gr.value.causalGraph;
    nextPres = gr.value.presence;
    nextEcon = gr.value.causalEconomy;
  }

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph: nextGraph },
    causalEconomy: nextEcon,
    presence: nextPres
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function presenceAvatarAgentInvoke(payload: {
  avatarUid: string;
  agentUid: string;
  intent?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.avatar.agent.invoke", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { avatarUid: string; agentUid: string; intent?: string };

  const ctx = requireRoomProjection(p.avatarUid);
  if (!ctx.ok) return ctx;
  const { s, pres, av, roomUid } = ctx.value;
  const proj = av.projection!;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writer = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writer}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const companionExtras = isRhizohCompanionInvoke(p.agentUid, p.intent)
    ? pres.companionAgents?.[stableRhizohCompanionUid(p.avatarUid)]
      ? 2
      : 3
    : 0;
  const bundleCharge = {
    computeWeight: charge.computeWeight * (1 + companionExtras),
    entropyImpact: charge.entropyImpact * (1 + companionExtras)
  };
  const gate = assertEconomyAllowsAppend(econBase, bundleCharge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildAvatarAgentInvokeCausalNode({
      avatarUid: p.avatarUid,
      roomUid,
      agentUid: p.agentUid,
      intent: p.intent,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendPresenceWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, avatarUid: p.avatarUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const projection = {
    ...proj,
    lastAgentInvokeUid: p.agentUid,
    lastAgentInvokeIntent: p.intent,
    lastAgentInvokeAt: wall
  };

  let nextPres: PresenceLayerState = {
    ...pres,
    avatars: { ...pres.avatars, [p.avatarUid]: { ...av, projection } }
  };
  let nextGraph = causalGraph;
  let nextEcon = accumulateEconomy(econBase, charge);

  if (isRhizohCompanionInvoke(p.agentUid, p.intent)) {
    const cr = companionAppendRhizohChain({
      s,
      pres: nextPres,
      causalGraph: nextGraph,
      causalEconomy: nextEcon,
      branchId,
      actorId,
      wall,
      invokeNodeId: node.id,
      ownerAvatarUid: p.avatarUid,
      roomUid,
      intent: p.intent
    });
    if (!cr.ok) return cr;
    nextGraph = cr.value.causalGraph;
    nextPres = cr.value.presence;
    nextEcon = cr.value.causalEconomy;
  }

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph: nextGraph },
    causalEconomy: nextEcon,
    presence: nextPres
  });

  return { ok: true, value: { causalNodeId: node.id } };
}
