/**
 * Apply gateway mesh deltas into RSK: projectionPatch hint first, causal append (replica, no economy charge), then fold from node.
 */
import { avatarProjectionWithLookAt } from "../lib/presenceLookAt";
import { coerceCausalNode, CAUSAL_GENESIS_NODE_ID, CAUSAL_MAIN_BRANCH_ID } from "../runtime/causalGraph";
import { appendCausalNode } from "../runtime/graphReducer";
import type {
  AvatarProjection,
  CausalNode,
  PresenceLayerState,
  PresenceZoneId,
  StudioKernelState,
  StudioResult
} from "../types/rskOntology.js";
import { bindAvatarToEntity } from "./presenceSlice";
import { defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";
import { registerEntity } from "./registrySlice";
import { presenceWithSyncedCompanionTransforms } from "./rhizohCompanionSlice";
import { presenceWithSyncedPetTransforms } from "./ghostPetOrbitSlice";
import type { PresenceMeshDeltaEvent } from "../runtime/presenceMeshClient";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export function inferMeshWriterSubject(
  node: CausalNode,
  meshRoomUid: string,
  explicit?: string | null
): string {
  const ex = explicit?.trim();
  if (ex) return ex;
  const d = asRecord(asRecord(node.payload)?.delta) ?? {};
  const kind = typeof d.kind === "string" ? d.kind : "";
  const roomUid = typeof d.roomUid === "string" ? d.roomUid : meshRoomUid;
  if (
    kind === "presence.room.created" ||
    kind === "presence.room.member_join" ||
    kind === "presence.room.member_leave" ||
    kind === "role.assign" ||
    kind === "role.revoke" ||
    kind === "moderate.kick" ||
    kind === "moderate.mute" ||
    kind === "stage.pin" ||
    kind === "stage.invite"
  ) {
    return `room:${roomUid}`;
  }
  if (kind.startsWith("presence.broadcast")) {
    const ch = typeof d.channelUid === "string" ? d.channelUid : "";
    return ch ? `broadcast:${ch}` : `room:${meshRoomUid}`;
  }
  const av = typeof d.avatarUid === "string" ? d.avatarUid : "";
  if (av) return `presence:${av}`;
  return `room:${meshRoomUid}`;
}

function applyProjectionPatchHint(
  pres: PresenceLayerState,
  roomUid: string,
  patch: unknown
): PresenceLayerState {
  const p = asRecord(patch);
  if (!p) return pres;
  const avatarUid = typeof p.avatarUid === "string" ? p.avatarUid : "";
  if (!avatarUid) return pres;
  const av = pres.avatars[avatarUid];
  if (!av?.projection) return pres;
  const { avatarUid: _a, ...rest } = p;
  const nextProj = { ...av.projection, ...rest } as AvatarProjection;
  const probe = {
    ...pres,
    avatars: { ...pres.avatars, [avatarUid]: { ...av, projection: nextProj } }
  };
  const projection = avatarProjectionWithLookAt(probe, roomUid, avatarUid, nextProj);
  return {
    ...pres,
    avatars: { ...pres.avatars, [avatarUid]: { ...av, projection } }
  };
}

/** Local-owned shell so kernel accepts registry writes; remote social id stays in `avatarUid`. */
function ensureRemoteAvatarShell(avatarUid: string): void {
  const s = getStudioKernelState();
  if (s.presence?.avatars?.[avatarUid]) return;
  const localOwner = s.identity.ownerId;
  if (!localOwner) return;
  const safe = avatarUid.replace(/[^a-z0-9:_-]/gi, "_");
  const entityUid = `ent:mesh-shell:${safe}`.slice(0, 96);
  const re = registerEntity({ uid: entityUid, ownerId: localOwner });
  if (!re.ok && re.error !== "entity_uid_collision") return;
  void bindAvatarToEntity({ avatarUid, linkedEntityUid: entityUid });
}

function rewireReplicaNode(
  s: StudioKernelState,
  graph: StudioKernelState["registry"]["causalGraph"],
  node: CausalNode,
  writerSubject: string
): CausalNode {
  const branchId = node.branchId || (s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID);
  const tailKey = `${branchId}::${writerSubject}`;
  const localTipId = graph.writerHeads[tailKey];
  const localTip = localTipId ? graph.nodes[localTipId] : undefined;
  const tickIndex = Math.max(
    s.worldPhysics.globalTick,
    (localTip?.tickIndex ?? -1) + 1,
    typeof node.tickIndex === "number" ? node.tickIndex : 0
  );
  return {
    ...node,
    branchId,
    causeIds: [localTipId || CAUSAL_GENESIS_NODE_ID],
    tickIndex
  };
}

function syncPresenceFromFold(
  s: StudioKernelState,
  pres: PresenceLayerState,
  roomUid: string,
  node: CausalNode
): PresenceLayerState {
  const d = asRecord(asRecord(node.payload)?.delta) ?? {};
  const kind = typeof d.kind === "string" ? d.kind : "";

  if (kind === "avatar.move") {
    const avatarUid = typeof d.avatarUid === "string" ? d.avatarUid : "";
    const ru = typeof d.roomUid === "string" ? d.roomUid : roomUid;
    const zoneId = (typeof d.zoneId === "string" ? d.zoneId : "audience") as PresenceZoneId;
    const x = typeof d.x === "number" ? d.x : 0;
    const y = typeof d.y === "number" ? d.y : 0;
    const z = typeof d.z === "number" ? d.z : 0;
    const rotY = typeof d.rotY === "number" ? d.rotY : 0;
    const status = typeof d.status === "string" ? d.status : "quiet";
    const av = pres.avatars[avatarUid];
    if (!av?.projection) return pres;
    const rigAnim: AvatarProjection["rigAnimation"] =
      status === "talking" || status === "broadcasting" ? "talk" : "walk";
    const projection = avatarProjectionWithLookAt(pres, ru, avatarUid, {
      ...av.projection,
      roomUid: ru,
      zoneId,
      transform: { x, y, z, rotY },
      status: status as AvatarProjection["status"],
      rigAnimation: rigAnim,
      lastRigEventAt: node.timestamp
    });
    const presAv = {
      ...pres,
      avatars: { ...pres.avatars, [avatarUid]: { ...av, projection } }
    };
    const presC = presenceWithSyncedCompanionTransforms(presAv, avatarUid, projection.transform, ru);
    return presenceWithSyncedPetTransforms(presC, avatarUid, projection.transform, ru);
  }

  if (kind === "avatar.emote") {
    const avatarUid = typeof d.avatarUid === "string" ? d.avatarUid : "";
    const emoteId = typeof d.emoteId === "string" ? d.emoteId : "";
    const av = pres.avatars[avatarUid];
    if (!av) return pres;
    return {
      ...pres,
      avatars: {
        ...pres.avatars,
        [avatarUid]: { ...av, lastEmoteId: emoteId, animationState: `emote:${emoteId}` }
      }
    };
  }

  if (kind === "presence.room.member_join") {
    const avatarUid = typeof d.avatarUid === "string" ? d.avatarUid : "";
    const ru = typeof d.roomUid === "string" ? d.roomUid : roomUid;
    const room = pres.rooms[ru];
    if (!room || !avatarUid) return pres;
    ensureRemoteAvatarShell(avatarUid);
    const s2 = getStudioKernelState();
    const pr = s2.presence ?? defaultPresence();
    const room2 = pr.rooms[ru];
    if (!room2) return pr;
    const memberSet = new Set(room2.memberAvatarUids);
    memberSet.add(avatarUid);
    const av = pr.avatars[avatarUid];
    const baseProj: AvatarProjection =
      av?.projection ??
      ({
        roomUid: ru,
        zoneId: "audience",
        role: "guest",
        transform: { x: 0, y: 0, z: 0, rotY: 0 },
        status: "quiet",
        rigAnimation: "idle",
        lastRigEventAt: node.timestamp
      } as AvatarProjection);
    const projection = avatarProjectionWithLookAt(pr, ru, avatarUid, { ...baseProj, roomUid: ru });
    const nextAv =
      av ??
      ({
        uid: avatarUid,
        ownerId: avatarUid.startsWith("avatar:") ? avatarUid.slice(7) : undefined,
        projection,
        currentRoomUid: ru
      } as PresenceLayerState["avatars"][string]);
    return {
      ...pr,
      rooms: {
        ...pr.rooms,
        [ru]: { ...room2, memberAvatarUids: [...memberSet] }
      },
      avatars: {
        ...pr.avatars,
        [avatarUid]: { ...nextAv, projection, currentRoomUid: ru }
      }
    };
  }

  if (kind === "presence.room.member_leave") {
    const avatarUid = typeof d.avatarUid === "string" ? d.avatarUid : "";
    const ru = typeof d.roomUid === "string" ? d.roomUid : roomUid;
    const room = pres.rooms[ru];
    if (!room) return pres;
    const memberSet = new Set(room.memberAvatarUids);
    memberSet.delete(avatarUid);
    const av = pres.avatars[avatarUid];
    return {
      ...pres,
      rooms: {
        ...pres.rooms,
        [ru]: { ...room, memberAvatarUids: [...memberSet] }
      },
      avatars: av
        ? {
            ...pres.avatars,
            [avatarUid]: { ...av, currentRoomUid: undefined, projection: undefined }
          }
        : pres.avatars
    };
  }

  return pres;
}

export function ingestPresenceMeshDelta(ev: PresenceMeshDeltaEvent): StudioResult<{ duplicate?: boolean }> {
  const roomUid = ev.roomUid;
  const coerced = coerceCausalNode(String((ev.node as { id?: string })?.id ?? "mesh"), ev.node);
  if (!coerced) return { ok: false, error: "mesh_invalid_node" };

  let s = getStudioKernelState();
  let pres = s.presence ?? defaultPresence();
  if (ev.projectionPatch !== undefined && ev.projectionPatch !== null) {
    pres = applyProjectionPatchHint(pres, roomUid, ev.projectionPatch);
    setStudioKernelState({ ...s, presence: pres });
    s = getStudioKernelState();
    pres = s.presence ?? defaultPresence();
  }

  const writerSubject = inferMeshWriterSubject(coerced, roomUid, ev.writerSubject);
  const graph = s.registry.causalGraph;
  const patched = rewireReplicaNode(s, graph, coerced, writerSubject);
  const appended = appendCausalNode(graph, patched, writerSubject);
  if (!appended.ok) {
    if (appended.error === "causal_duplicate_id") return { ok: true, value: { duplicate: true } };
    return { ok: false, error: appended.error };
  }

  let nextPres = syncPresenceFromFold({ ...s, registry: { ...s.registry, causalGraph: appended.graph } }, pres, roomUid, patched);
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph: appended.graph },
    presence: nextPres
  });
  return { ok: true, value: {} };
}
