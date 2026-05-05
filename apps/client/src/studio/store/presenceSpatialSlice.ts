/**
 * Phase P2 — Room spatial presence: causal `avatar.spawn` / `avatar.move` + `AvatarEntity.projection`.
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
import { buildAvatarMoveCausalNode } from "../runtime/presenceCausalFactory";
import { avatarProjectionWithLookAt } from "../lib/presenceLookAt";
import { clampToZoneBounds, ensureRoomZones } from "../lib/presenceRoomZones";
import type {
  AvatarProjection,
  AvatarSpatialPresenceStatus,
  PresenceZoneId,
  StudioResult
} from "../types/rskOntology.js";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";
import { presenceWithSyncedCompanionTransforms } from "./rhizohCompanionSlice";
import { presenceWithSyncedPetTransforms } from "./ghostPetOrbitSlice";
import { applyWorldLocomotionAfterAvatarMove } from "./worldLocomotionSlice";

/** Matches PresenceStudioViewport grid scale (hall floor). */
export const PRESENCE_HALL_HALF = 11;

export function randomHallSpawn(): { x: number; y: number; z: number; rotY: number } {
  const spread = PRESENCE_HALL_HALF * 0.72;
  const x = (Math.random() * 2 - 1) * spread;
  const z = (Math.random() * 2 - 1) * spread;
  return { x, y: 0, z, rotY: (Math.random() * 2 - 1) * Math.PI };
}

export function clampHallPosition(p: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
  const h = PRESENCE_HALL_HALF;
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  return {
    x: clamp(p.x, -h, h),
    y: clamp(p.y, -0.5, 4),
    z: clamp(p.z, -h, h)
  };
}

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

export function moveAvatarInRoom(payload: {
  avatarUid: string;
  roomUid: string;
  pos: { x: number; y: number; z: number };
  rotY?: number;
  status?: AvatarSpatialPresenceStatus;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.avatar.move", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };

  const p = res.sanitizedPayload as {
    avatarUid: string;
    roomUid: string;
    pos: { x: number; y: number; z: number };
    rotY?: number;
    status?: AvatarSpatialPresenceStatus;
  };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  if (!room.memberAvatarUids.includes(p.avatarUid)) return { ok: false, error: "avatar_not_in_room" };

  const av = pres.avatars[p.avatarUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };
  if (av.currentRoomUid !== p.roomUid) return { ok: false, error: "avatar_room_mismatch" };
  if (!av.projection || av.projection.roomUid !== p.roomUid) return { ok: false, error: "projection_required" };
  if (room.mutedAvatarUids?.includes(p.avatarUid)) return { ok: false, error: "muted" };

  let cpos = clampHallPosition(p.pos);
  const zones = ensureRoomZones(room);
  const zoneId = (av.projection.zoneId ?? "audience") as PresenceZoneId;
  const zdef = zones[zoneId];
  if (zdef) cpos = clampToZoneBounds(cpos, zdef);

  const prev = av.projection?.roomUid === p.roomUid ? av.projection.transform : undefined;
  const rotY = typeof p.rotY === "number" && Number.isFinite(p.rotY) ? p.rotY : (prev?.rotY ?? 0);
  const nextStatus: AvatarSpatialPresenceStatus =
    p.status ??
    (av.projection?.roomUid === p.roomUid ? av.projection.status : "quiet");

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  let causalGraph = ensureBranch(s, branchId, s.registry.causalGraph ?? defaultCausalGraphRegistry());
  const writerSubject = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";

  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const charge = estimateEconomyForNodeType("tool");
  const gate = assertEconomyAllowsAppend(econBase, charge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const node = withEconomyPayload(
    buildAvatarMoveCausalNode({
      avatarUid: p.avatarUid,
      roomUid: p.roomUid,
      zoneId,
      x: cpos.x,
      y: cpos.y,
      z: cpos.z,
      rotY,
      status: nextStatus,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const appended = appendCausalNode(causalGraph, node, writerSubject);
  if (!appended.ok) return { ok: false, error: appended.error };
  causalGraph = appended.graph;

  const rigAnim: AvatarProjection["rigAnimation"] =
    nextStatus === "talking" || nextStatus === "broadcasting" ? "talk" : "walk";
  const projection = avatarProjectionWithLookAt(pres, p.roomUid, p.avatarUid, {
    ...av.projection!,
    roomUid: p.roomUid,
    zoneId,
    transform: { x: cpos.x, y: cpos.y, z: cpos.z, rotY },
    status: nextStatus,
    rigAnimation: rigAnim,
    lastRigEventAt: wall
  });

  const presAv = {
    ...pres,
    avatars: { ...pres.avatars, [p.avatarUid]: { ...av, projection } }
  };
  const presC = presenceWithSyncedCompanionTransforms(presAv, p.avatarUid, projection.transform, p.roomUid);
  const presNext = presenceWithSyncedPetTransforms(presC, p.avatarUid, projection.transform, p.roomUid);

  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, charge),
    presence: presNext
  });

  applyWorldLocomotionAfterAvatarMove({
    avatarUid: p.avatarUid,
    roomUid: p.roomUid,
    worldPos: { x: cpos.x, z: cpos.z },
    lastMoveCauseNodeId: node.id
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

export function nudgeAvatarInHall(payload: { avatarUid: string; roomUid: string; dx: number; dz: number }) {
  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const av = pres.avatars[payload.avatarUid];
  const base = av?.projection?.transform ?? { x: 0, y: 0, z: 0, rotY: 0 };
  return moveAvatarInRoom({
    avatarUid: payload.avatarUid,
    roomUid: payload.roomUid,
    pos: { x: base.x + payload.dx, y: base.y, z: base.z + payload.dz },
    rotY: base.rotY
  });
}
