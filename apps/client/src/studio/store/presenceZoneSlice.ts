/**
 * P2b — Presence room zones: social context (where / which rules) + causal avatar.zone.* .
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
import { buildAvatarZoneTransitionCausalNode } from "../runtime/presenceCausalFactory";
import { avatarProjectionWithLookAt } from "../lib/presenceLookAt";
import { ensureRoomZones, randomPointInZone } from "../lib/presenceRoomZones";
import type {
  AvatarProjection,
  AvatarSpatialPresenceStatus,
  PresenceZoneDef,
  PresenceZoneId,
  PresenceZoneSemantics,
  StudioResult
} from "../types/rskOntology.js";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";
import { presenceWithSyncedCompanionTransforms } from "./rhizohCompanionSlice";
import { presenceWithSyncedPetTransforms } from "./ghostPetOrbitSlice";

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

function statusForZoneSemantics(sem: PresenceZoneSemantics): AvatarSpatialPresenceStatus {
  if (sem.defaultStatus) return sem.defaultStatus;
  if (sem.broadcastingSurface) return "broadcasting";
  if (sem.spectatorTier) return "watching";
  return "quiet";
}

function canEnterVip(room: { vipAllowlistAvatarUids?: string[] }, avatarUid: string, zone: PresenceZoneDef): boolean {
  if (!zone.semantics.vipGated) return true;
  const list = room.vipAllowlistAvatarUids;
  if (!list || list.length === 0) return true;
  return list.includes(avatarUid);
}

export function transitionPresenceZone(payload: {
  avatarUid: string;
  roomUid: string;
  toZoneId: PresenceZoneId;
  fromZoneId?: PresenceZoneId;
}): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({ identity: s0.identity, action: "presence.avatar.zone.transition", payload });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };

  const p = res.sanitizedPayload as {
    avatarUid: string;
    roomUid: string;
    toZoneId: PresenceZoneId;
    fromZoneId?: PresenceZoneId;
  };

  const s = getStudioKernelState();
  const pres = s.presence ?? defaultPresence();
  const room = pres.rooms[p.roomUid];
  if (!room) return { ok: false, error: "room_not_found" };
  if (!room.memberAvatarUids.includes(p.avatarUid)) return { ok: false, error: "avatar_not_in_room" };

  const av = pres.avatars[p.avatarUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };
  if (av.currentRoomUid !== p.roomUid) return { ok: false, error: "avatar_room_mismatch" };
  const proj = av.projection;
  if (!proj || proj.roomUid !== p.roomUid) return { ok: false, error: "projection_required" };

  const fromZoneId = p.fromZoneId ?? proj.zoneId;
  if (fromZoneId !== proj.zoneId) return { ok: false, error: "from_zone_mismatch" };
  if (fromZoneId === p.toZoneId) return { ok: true, value: { causalNodeId: "" } };

  const zones = ensureRoomZones(room);
  const toDef = zones[p.toZoneId];
  if (!toDef) return { ok: false, error: "zone_not_found" };

  if (!canEnterVip(room, p.avatarUid, toDef)) return { ok: false, error: "vip_not_allowed" };

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

  const pt = randomPointInZone(toDef);
  const nextStatus = statusForZoneSemantics(toDef.semantics);

  const node = withEconomyPayload(
    buildAvatarZoneTransitionCausalNode({
      avatarUid: p.avatarUid,
      roomUid: p.roomUid,
      fromZoneId,
      toZoneId: p.toZoneId,
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
    nextStatus === "talking" || nextStatus === "broadcasting" ? "talk" : nextStatus === "quiet" ? "idle" : "walk";
  const projection = avatarProjectionWithLookAt(pres, p.roomUid, p.avatarUid, {
    ...proj,
    zoneId: p.toZoneId,
    transform: { x: pt.x, y: pt.y, z: pt.z, rotY: pt.rotY },
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

  return { ok: true, value: { causalNodeId: node.id } };
}
