/**
 * P3 — Presence roles + moderation (social authority orthogonal to zones).
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
  buildPresenceModerateKickCausalNode,
  buildPresenceModerateMuteCausalNode,
  buildPresenceRoleAssignCausalNode,
  buildPresenceRoleRevokeCausalNode,
  buildPresenceStageInviteCausalNode,
  buildPresenceStagePinCausalNode
} from "../runtime/presenceCausalFactory.js";
import { roleCanModerate } from "../lib/presenceRoles";
import type { CausalGraphRegistry, CausalNode, PresenceRole, StudioResult } from "../types/rskOntology";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";
import { leavePresenceRoom } from "./roomBroadcastSlice";

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

function appendRoomTool(input: {
  s: ReturnType<typeof getStudioKernelState>;
  roomUid: string;
  node: CausalNode;
  charge: ReturnType<typeof estimateEconomyForNodeType>;
}): StudioResult<{ causalGraph: CausalGraphRegistry }> {
  const econBase = input.s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, input.charge);
  if (!gate.ok) return { ok: false, error: gate.error };
  const writerSubject = `room:${input.roomUid}`;
  const appended = appendCausalNode(input.s.registry.causalGraph, input.node, writerSubject);
  if (!appended.ok) return { ok: false, error: appended.error };
  return { ok: true, value: { causalGraph: appended.graph } };
}

function assertModeratorIfActor(
  pres: ReturnType<typeof defaultPresence>,
  roomUid: string,
  actorAvatarUid: string | undefined
): StudioResult<void> {
  if (!actorAvatarUid) return { ok: true, value: undefined };
  const av = pres.avatars[actorAvatarUid];
  const pr = av?.projection;
  if (!pr || pr.roomUid !== roomUid) return { ok: false, error: "actor_not_in_room" };
  if (!roleCanModerate(pr.role)) return { ok: false, error: "moderation_forbidden" };
  return { ok: true, value: undefined };
}

export function assignPresenceRole(payload: {
  roomUid: string;
  targetAvatarUid: string;
  role: PresenceRole;
  assignedByAvatarUid?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.role.assign",
    payload: {
      roomUid: payload.roomUid,
      targetAvatarUid: payload.targetAvatarUid,
      role: payload.role,
      assignedByAvatarUid: payload.assignedByAvatarUid
    }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as {
    roomUid: string;
    targetAvatarUid: string;
    role: PresenceRole;
    assignedByAvatarUid?: string;
  };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  if (!room.memberAvatarUids.includes(p.targetAvatarUid)) return { ok: false, error: "target_not_in_room" };
  const targetAv = pres.avatars[p.targetAvatarUid];
  const proj = targetAv?.projection;
  if (!proj || proj.roomUid !== p.roomUid) return { ok: false, error: "target_projection_required" };

  const modGate = assertModeratorIfActor(pres, p.roomUid, p.assignedByAvatarUid);
  if (!modGate.ok) return modGate;

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
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, charge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildPresenceRoleAssignCausalNode({
      roomUid: p.roomUid,
      targetAvatarUid: p.targetAvatarUid,
      role: p.role,
      assignedByAvatarUid: p.assignedByAvatarUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendRoomTool({ s: { ...s, registry: { ...s.registry, causalGraph } }, roomUid: p.roomUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const nextRoom = { ...room };
  const nextAvatars = { ...pres.avatars };

  if (p.role === "owner") {
    if (room.ownerAvatarUid && room.ownerAvatarUid !== p.targetAvatarUid) {
      const old = room.ownerAvatarUid;
      const oav = nextAvatars[old];
      const op = oav?.projection;
      if (oav && op?.roomUid === p.roomUid) {
        nextAvatars[old] = { ...oav, projection: { ...op, role: "moderator" } };
      }
    }
    nextRoom.ownerAvatarUid = p.targetAvatarUid;
  } else if (room.ownerAvatarUid === p.targetAvatarUid) {
    const dropsOwnerKey = p.role === "guest" || p.role === "observer";
    if (dropsOwnerKey) nextRoom.ownerAvatarUid = undefined;
  }

  const nextProj = { ...proj, role: p.role };
  nextAvatars[p.targetAvatarUid] = { ...targetAv, projection: nextProj };

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: {
      ...pres,
      rooms: { ...pres.rooms, [p.roomUid]: nextRoom },
      avatars: nextAvatars
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function revokePresenceRole(payload: {
  roomUid: string;
  targetAvatarUid: string;
  actorAvatarUid?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.role.revoke",
    payload: {
      roomUid: payload.roomUid,
      targetAvatarUid: payload.targetAvatarUid,
      actorAvatarUid: payload.actorAvatarUid
    }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { roomUid: string; targetAvatarUid: string; actorAvatarUid?: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  if (!room.memberAvatarUids.includes(p.targetAvatarUid)) return { ok: false, error: "target_not_in_room" };
  const targetAv = pres.avatars[p.targetAvatarUid];
  const proj = targetAv?.projection;
  if (!proj || proj.roomUid !== p.roomUid) return { ok: false, error: "target_projection_required" };

  const modGate = assertModeratorIfActor(pres, p.roomUid, p.actorAvatarUid);
  if (!modGate.ok) return modGate;

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
  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const gate = assertEconomyAllowsAppend(econBase, charge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildPresenceRoleRevokeCausalNode({
      roomUid: p.roomUid,
      targetAvatarUid: p.targetAvatarUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendRoomTool({ s: { ...s, registry: { ...s.registry, causalGraph } }, roomUid: p.roomUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  let nextRoom = { ...room };
  if (room.ownerAvatarUid === p.targetAvatarUid) {
    nextRoom.ownerAvatarUid = undefined;
  }

  const nextProj = { ...proj, role: "guest" as PresenceRole };
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: {
      ...pres,
      rooms: { ...pres.rooms, [p.roomUid]: nextRoom },
      avatars: { ...pres.avatars, [p.targetAvatarUid]: { ...targetAv, projection: nextProj } }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function moderateKick(payload: {
  roomUid: string;
  targetAvatarUid: string;
  actorAvatarUid?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.moderate.kick",
    payload: {
      roomUid: payload.roomUid,
      targetAvatarUid: payload.targetAvatarUid,
      actorAvatarUid: payload.actorAvatarUid
    }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { roomUid: string; targetAvatarUid: string; actorAvatarUid?: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const modGate = assertModeratorIfActor(pres, p.roomUid, p.actorAvatarUid);
  if (!modGate.ok) return modGate;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const tailKey = `${branchId}::room:${p.roomUid}`;
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
    buildPresenceModerateKickCausalNode({
      roomUid: p.roomUid,
      targetAvatarUid: p.targetAvatarUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendRoomTool({ s: { ...s, registry: { ...s.registry, causalGraph } }, roomUid: p.roomUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge)
  });

  const leaveRes = leavePresenceRoom({ roomUid: p.roomUid, avatarUid: p.targetAvatarUid });
  if (!leaveRes.ok) return { ok: false, error: leaveRes.error };
  return { ok: true, value: { causalNodeId: node.id } };
}

export function moderateMute(payload: {
  roomUid: string;
  targetAvatarUid: string;
  muted: boolean;
  actorAvatarUid?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.moderate.mute",
    payload: {
      roomUid: payload.roomUid,
      targetAvatarUid: payload.targetAvatarUid,
      muted: payload.muted,
      actorAvatarUid: payload.actorAvatarUid
    }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { roomUid: string; targetAvatarUid: string; muted: boolean; actorAvatarUid?: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  if (!room.memberAvatarUids.includes(p.targetAvatarUid)) return { ok: false, error: "target_not_in_room" };

  const modGate = assertModeratorIfActor(pres, p.roomUid, p.actorAvatarUid);
  if (!modGate.ok) return modGate;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const tailKey = `${branchId}::room:${p.roomUid}`;
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
    buildPresenceModerateMuteCausalNode({
      roomUid: p.roomUid,
      targetAvatarUid: p.targetAvatarUid,
      muted: p.muted,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendRoomTool({ s: { ...s, registry: { ...s.registry, causalGraph } }, roomUid: p.roomUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  const muted = new Set(room.mutedAvatarUids ?? []);
  if (p.muted) muted.add(p.targetAvatarUid);
  else muted.delete(p.targetAvatarUid);

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: {
      ...pres,
      rooms: {
        ...pres.rooms,
        [p.roomUid]: { ...room, mutedAvatarUids: [...muted] }
      }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function stagePin(payload: {
  roomUid: string;
  actorAvatarUid: string;
  summary: string;
  actorAuthorityAvatarUid?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.stage.pin",
    payload: { roomUid: payload.roomUid, actorAvatarUid: payload.actorAvatarUid, summary: payload.summary }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { roomUid: string; actorAvatarUid: string; summary: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  if (!room.memberAvatarUids.includes(p.actorAvatarUid)) return { ok: false, error: "actor_not_in_room" };

  const modGate = assertModeratorIfActor(pres, p.roomUid, payload.actorAuthorityAvatarUid);
  if (!modGate.ok) return modGate;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const tailKey = `${branchId}::room:${p.roomUid}`;
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
    buildPresenceStagePinCausalNode({
      roomUid: p.roomUid,
      actorAvatarUid: p.actorAvatarUid,
      summary: p.summary,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendRoomTool({ s: { ...s, registry: { ...s.registry, causalGraph } }, roomUid: p.roomUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: {
      ...pres,
      rooms: {
        ...pres.rooms,
        [p.roomUid]: {
          ...room,
          stagePin: { summary: p.summary, pinnedByAvatarUid: p.actorAvatarUid, at: wall }
        }
      }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function stageInvite(payload: {
  roomUid: string;
  fromAvatarUid: string;
  toAvatarUid: string;
  actorAuthorityAvatarUid?: string;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.stage.invite",
    payload: { roomUid: payload.roomUid, fromAvatarUid: payload.fromAvatarUid, toAvatarUid: payload.toAvatarUid }
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };
  const p = res.sanitizedPayload as { roomUid: string; fromAvatarUid: string; toAvatarUid: string };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  if (!room.memberAvatarUids.includes(p.fromAvatarUid) || !room.memberAvatarUids.includes(p.toAvatarUid)) {
    return { ok: false, error: "member_required" };
  }

  const modGate = assertModeratorIfActor(pres, p.roomUid, payload.actorAuthorityAvatarUid);
  if (!modGate.ok) return modGate;

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const tailKey = `${branchId}::room:${p.roomUid}`;
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
    buildPresenceStageInviteCausalNode({
      roomUid: p.roomUid,
      fromAvatarUid: p.fromAvatarUid,
      toAvatarUid: p.toAvatarUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const ar = appendRoomTool({ s: { ...s, registry: { ...s.registry, causalGraph } }, roomUid: p.roomUid, node, charge });
  if (!ar.ok) return ar;
  causalGraph = ar.value.causalGraph;

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge)
  });

  return { ok: true, value: { causalNodeId: node.id } };
}
