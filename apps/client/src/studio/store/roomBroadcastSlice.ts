/**
 * Phase P1b — Social space: rooms + broadcast channels (causal append + kernel-local membership).
 * Gateway multi-user sync is a separate transport layer.
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
  buildAvatarSpawnCausalNode,
  buildAvatarZoneEnterCausalNode,
  buildAvatarZoneLeaveCausalNode,
  buildBroadcastChannelCreatedCausalNode,
  buildBroadcastMemberJoinCausalNode,
  buildBroadcastMemberLeaveCausalNode,
  buildPresenceRoomCreatedCausalNode,
  buildPresenceRoomMemberJoinCausalNode,
  buildPresenceRoomMemberLeaveCausalNode
} from "../runtime/presenceCausalFactory.js";
import { avatarProjectionWithLookAt } from "../lib/presenceLookAt";
import { defaultMainHallZones, ensureRoomZones, randomPointInZone } from "../lib/presenceRoomZones";
import type {
  AvatarProjection,
  BroadcastChannel,
  CausalGraphRegistry,
  CausalNode,
  PresenceRoom,
  StudioResult
} from "../types/rskOntology.js";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";
import { patchPresenceWithBroadcastFold } from "./broadcastDirectorSlice";

function ensureBranch(
  s: ReturnType<typeof getStudioKernelState>,
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

function appendToolForWriter(input: {
  s: ReturnType<typeof getStudioKernelState>;
  writerSubject: string;
  node: CausalNode;
  charge: ReturnType<typeof estimateEconomyForNodeType>;
}): StudioResult<{ causalGraph: CausalGraphRegistry }> {
  const econBase = input.s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, input.charge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const appended = appendCausalNode(input.s.registry.causalGraph, input.node, input.writerSubject);
  if (!appended.ok) return { ok: false, error: appended.error };
  return { ok: true, value: { causalGraph: appended.graph } };
}

export function createPresenceRoom(input: {
  roomUid: string;
  title: string;
  topic?: string;
  ownerSoulUid?: string;
}): StudioResult<PresenceRoom> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.room.create", payload: input });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { roomUid: string; title: string; topic?: string; ownerSoulUid?: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  if (pres.rooms[p.roomUid]) return { ok: false, error: "room_uid_collision" };

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writerSubject = `room:${p.roomUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";

  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildPresenceRoomCreatedCausalNode({
      roomUid: p.roomUid,
      title: p.title,
      topic: p.topic,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID],
      ownerSoulUid: p.ownerSoulUid
    })
  );

  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const room: PresenceRoom = {
    uid: p.roomUid,
    ownerSoulUid: p.ownerSoulUid,
    title: p.title,
    topic: p.topic,
    memberAvatarUids: [],
    createdAt: wall,
    zones: defaultMainHallZones()
  };

  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: { ...pres, rooms: { ...pres.rooms, [p.roomUid]: room } }
  });

  return { ok: true, value: room };
}

export function joinPresenceRoom(payload: { roomUid: string; avatarUid: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.room.join", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { roomUid: string; avatarUid: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  const av = pres.avatars[p.avatarUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };

  const wasMember = room.memberAvatarUids.includes(p.avatarUid);
  if (wasMember && av.currentRoomUid === p.roomUid) {
    return { ok: true, value: { causalNodeId: "" } };
  }

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writerSubject = `room:${p.roomUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";

  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildPresenceRoomMemberJoinCausalNode({
      roomUid: p.roomUid,
      avatarUid: p.avatarUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const memberSet = new Set(room.memberAvatarUids);
  memberSet.add(p.avatarUid);
  const members = [...memberSet];

  const isFirstJoin = room.memberAvatarUids.length === 0;
  const zones = ensureRoomZones(room);
  const entryZoneId = "audience" as const;
  const entryDef = zones[entryZoneId];
  const spawn = randomPointInZone(entryDef);
  const entryStatus = entryDef.semantics.defaultStatus ?? "watching";
  const entryRole = isFirstJoin ? ("owner" as const) : ("guest" as const);
  const projectionBase: AvatarProjection = {
    roomUid: p.roomUid,
    zoneId: entryZoneId,
    role: entryRole,
    transform: { x: spawn.x, y: spawn.y, z: spawn.z, rotY: spawn.rotY },
    status: entryStatus,
    rigAnimation: "idle",
    lastRigEventAt: wall
  };
  const presProbe = {
    ...pres,
    rooms: {
      ...pres.rooms,
      [p.roomUid]: {
        ...room,
        memberAvatarUids: members,
        ownerAvatarUid: isFirstJoin ? p.avatarUid : room.ownerAvatarUid
      }
    },
    avatars: { ...pres.avatars, [p.avatarUid]: { ...av, projection: projectionBase, currentRoomUid: p.roomUid } }
  };
  const projection = avatarProjectionWithLookAt(presProbe, p.roomUid, p.avatarUid, projectionBase);

  const presenceWriter = `presence:${p.avatarUid}`;
  const tailP = `${branchId}::${presenceWriter}`;
  const lastPid = causalGraph.writerHeads[tailP];
  const lastTipP = lastPid ? causalGraph.nodes[lastPid] : undefined;
  const tickSpawn = Math.max(s.worldPhysics.globalTick, (lastTipP?.tickIndex ?? -1) + 1, tickIndex + 1);

  const spawnNode = withEconomyPayload(
    buildAvatarSpawnCausalNode({
      avatarUid: p.avatarUid,
      roomUid: p.roomUid,
      zoneId: entryZoneId,
      role: entryRole,
      x: projection.transform.x,
      y: projection.transform.y,
      z: projection.transform.z,
      rotY: projection.transform.rotY,
      status: projection.status,
      branchId,
      tickIndex: tickSpawn,
      timestamp: wall,
      actorId,
      causeIds: lastTipP ? [lastTipP.id] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar2 = appendToolForWriter({
    s: { ...s, registry: { ...s.registry, causalGraph } },
    writerSubject: presenceWriter,
    node: spawnNode,
    charge
  });
  if (!ar2.ok) return ar2;
  causalGraph = ar2.value.causalGraph;

  const lastPid2 = causalGraph.writerHeads[tailP];
  const lastTipP2 = lastPid2 ? causalGraph.nodes[lastPid2] : undefined;
  const tickEnter = Math.max(s.worldPhysics.globalTick, (lastTipP2?.tickIndex ?? -1) + 1);

  const enterNode = withEconomyPayload(
    buildAvatarZoneEnterCausalNode({
      avatarUid: p.avatarUid,
      roomUid: p.roomUid,
      zoneId: entryZoneId,
      branchId,
      tickIndex: tickEnter,
      timestamp: wall,
      actorId,
      causeIds: lastTipP2 ? [lastTipP2.id] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar3 = appendToolForWriter({
    s: { ...s, registry: { ...s.registry, causalGraph } },
    writerSubject: presenceWriter,
    node: enterNode,
    charge
  });
  if (!ar3.ok) return ar3;
  causalGraph = ar3.value.causalGraph;

  const nextAvatar = { ...av, currentRoomUid: p.roomUid, projection };
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const econ1 = accumulateEconomy(econBase, charge);
  const econ2 = accumulateEconomy(econ1, charge);

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econ2, charge),
    presence: {
      ...pres,
      rooms: {
        ...pres.rooms,
        [p.roomUid]: {
          ...room,
          memberAvatarUids: members,
          ownerAvatarUid: isFirstJoin ? p.avatarUid : room.ownerAvatarUid
        }
      },
      avatars: { ...pres.avatars, [p.avatarUid]: nextAvatar }
    }
  });

  return { ok: true, value: { causalNodeId: enterNode.id } };
}

export function leavePresenceRoom(payload: { roomUid: string; avatarUid: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.room.leave", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { roomUid: string; avatarUid: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  const av = pres.avatars[p.avatarUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";
  const charge = estimateEconomyForNodeType("tool");
  const econBase = s.causalEconomy ?? defaultCausalEconomy();

  let econAcc = econBase;
  const presenceWriter = `presence:${p.avatarUid}`;
  const tailP = `${branchId}::${presenceWriter}`;

  if (av.projection?.roomUid === p.roomUid && av.projection.zoneId) {
    const lastPidZ = causalGraph.writerHeads[tailP];
    const lastTipZ = lastPidZ ? causalGraph.nodes[lastPidZ] : undefined;
    const tickZ = Math.max(s.worldPhysics.globalTick, (lastTipZ?.tickIndex ?? -1) + 1);
    const zNode = withEconomyPayload(
      buildAvatarZoneLeaveCausalNode({
        avatarUid: p.avatarUid,
        roomUid: p.roomUid,
        zoneId: av.projection.zoneId,
        branchId,
        tickIndex: tickZ,
        timestamp: wall,
        actorId,
        causeIds: lastTipZ ? [lastTipZ.id] : [CAUSAL_GENESIS_NODE_ID]
      })
    );
    const arz = appendToolForWriter({
      s: { ...s, registry: { ...s.registry, causalGraph } },
      writerSubject: presenceWriter,
      node: zNode,
      charge
    });
    if (!arz.ok) return arz;
    causalGraph = arz.value.causalGraph;
    econAcc = accumulateEconomy(econAcc, charge);
  }

  const writerSubject = `room:${p.roomUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);

  const node = withEconomyPayload(
    buildPresenceRoomMemberLeaveCausalNode({
      roomUid: p.roomUid,
      avatarUid: p.avatarUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;
  econAcc = accumulateEconomy(econAcc, charge);

  const members = room.memberAvatarUids.filter((id) => id !== p.avatarUid);
  const nextAvatar =
    av.currentRoomUid === p.roomUid
      ? {
          ...av,
          currentRoomUid: undefined,
          projection: av.projection?.roomUid === p.roomUid ? undefined : av.projection
        }
      : { ...av };

  const mutedNext = (room.mutedAvatarUids ?? []).filter((id) => id !== p.avatarUid);
  const nextRoomLeave = {
    ...room,
    memberAvatarUids: members,
    ownerAvatarUid: room.ownerAvatarUid === p.avatarUid ? undefined : room.ownerAvatarUid,
    mutedAvatarUids: mutedNext,
    stagePin: room.stagePin?.pinnedByAvatarUid === p.avatarUid ? undefined : room.stagePin
  };

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: econAcc,
    presence: {
      ...pres,
      rooms: { ...pres.rooms, [p.roomUid]: nextRoomLeave },
      avatars: { ...pres.avatars, [p.avatarUid]: nextAvatar }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function createBroadcastChannel(input: {
  channelUid: string;
  title: string;
  topic?: string;
  ownerSoulUid?: string;
  roomUid?: string;
}): StudioResult<BroadcastChannel> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.create", payload: input });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as {
    channelUid: string;
    title: string;
    topic?: string;
    ownerSoulUid?: string;
    roomUid?: string;
  };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  if (pres.broadcasts[p.channelUid]) return { ok: false, error: "broadcast_uid_collision" };

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writerSubject = `broadcast:${p.channelUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";

  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastChannelCreatedCausalNode({
      channelUid: p.channelUid,
      title: p.title,
      topic: p.topic,
      roomUid: p.roomUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID],
      ownerSoulUid: p.ownerSoulUid
    })
  );

  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const ch: BroadcastChannel = {
    uid: p.channelUid,
    ownerSoulUid: p.ownerSoulUid,
    title: p.title,
    topic: p.topic,
    speakerAvatarUids: [],
    audienceAvatarUids: [],
    streamState: "idle",
    createdAt: wall
  };

  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const presWithCh = { ...pres, broadcasts: { ...pres.broadcasts, [p.channelUid]: ch } };
  const presenceNext = patchPresenceWithBroadcastFold({
    pres: presWithCh,
    causalGraph,
    branchId,
    broadcastUid: p.channelUid
  });
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: presenceNext
  });

  return { ok: true, value: ch };
}

export function joinBroadcastChannel(payload: {
  channelUid: string;
  avatarUid: string;
  role: "speaker" | "audience";
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.join", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { channelUid: string; avatarUid: string; role: "speaker" | "audience" };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const ch = pres.broadcasts[p.channelUid];
  if (!ch) return { ok: false, error: "broadcast_not_found" };
  const av = pres.avatars[p.avatarUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writerSubject = `broadcast:${p.channelUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";

  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastMemberJoinCausalNode({
      channelUid: p.channelUid,
      avatarUid: p.avatarUid,
      role: p.role,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  let speakers = [...ch.speakerAvatarUids];
  let audience = [...ch.audienceAvatarUids];
  if (p.role === "speaker" && !speakers.includes(p.avatarUid)) speakers.push(p.avatarUid);
  if (p.role === "audience" && !audience.includes(p.avatarUid)) audience.push(p.avatarUid);
  const nextAvatar = { ...av, currentBroadcastUid: p.channelUid };
  const econBase = s.causalEconomy ?? defaultCausalEconomy();

  const presJoined = {
    ...pres,
    broadcasts: {
      ...pres.broadcasts,
      [p.channelUid]: { ...ch, speakerAvatarUids: speakers, audienceAvatarUids: audience }
    },
    avatars: { ...pres.avatars, [p.avatarUid]: nextAvatar }
  };
  const presenceNext = patchPresenceWithBroadcastFold({
    pres: presJoined,
    causalGraph,
    branchId,
    broadcastUid: p.channelUid
  });
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: presenceNext
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function leaveBroadcastChannel(payload: { channelUid: string; avatarUid: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.broadcast.leave", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { channelUid: string; avatarUid: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const ch = pres.broadcasts[p.channelUid];
  if (!ch) return { ok: false, error: "broadcast_not_found" };
  const av = pres.avatars[p.avatarUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writerSubject = `broadcast:${p.channelUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";

  const charge = estimateEconomyForNodeType("tool");
  const node = withEconomyPayload(
    buildBroadcastMemberLeaveCausalNode({
      channelUid: p.channelUid,
      avatarUid: p.avatarUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendToolForWriter({ s: { ...s, registry: { ...s.registry, causalGraph } }, writerSubject, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const speakers = ch.speakerAvatarUids.filter((id) => id !== p.avatarUid);
  const audience = ch.audienceAvatarUids.filter((id) => id !== p.avatarUid);
  const nextAvatar =
    av.currentBroadcastUid === p.channelUid ? { ...av, currentBroadcastUid: undefined } : { ...av };
  const econBase = s.causalEconomy ?? defaultCausalEconomy();

  const presLeft = {
    ...pres,
    broadcasts: {
      ...pres.broadcasts,
      [p.channelUid]: { ...ch, speakerAvatarUids: speakers, audienceAvatarUids: audience }
    },
    avatars: { ...pres.avatars, [p.avatarUid]: nextAvatar }
  };
  const presenceNext = patchPresenceWithBroadcastFold({
    pres: presLeft,
    causalGraph,
    branchId,
    broadcastUid: p.channelUid
  });
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: presenceNext
  });

  return { ok: true, value: { causalNodeId: node.id } };
}
