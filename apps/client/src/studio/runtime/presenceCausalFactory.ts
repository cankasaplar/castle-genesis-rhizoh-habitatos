import { hashSeed } from "./mindRuntime";
import type { CausalNode } from "../types/rskOntology";

export function computePresenceJoinNodeId(input: {
  tickIndex: number;
  actorId: string;
  branchId: string;
  avatarUid: string;
  linkedEntityUid: string;
}): string {
  const basis = `${input.tickIndex}|${input.actorId}|presence.join|${input.branchId}|${input.avatarUid}|${input.linkedEntityUid}`;
  return `cn:prj:${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

export function buildPresenceJoinCausalNode(input: {
  avatarUid: string;
  linkedEntityUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "presence.join" as const,
    avatarUid: input.avatarUid,
    linkedEntityUid: input.linkedEntityUid
  };
  const id = computePresenceJoinNodeId({
    tickIndex: input.tickIndex,
    actorId: input.actorId,
    branchId: input.branchId,
    avatarUid: input.avatarUid,
    linkedEntityUid: input.linkedEntityUid
  });
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.join", avatarUid: input.avatarUid },
      affectsEntityIds: [input.linkedEntityUid]
    }
  };
}

export function computeAvatarEmoteNodeId(input: {
  tickIndex: number;
  actorId: string;
  branchId: string;
  avatarUid: string;
  emoteId: string;
}): string {
  const basis = `${input.tickIndex}|${input.actorId}|avatar.emote|${input.branchId}|${input.avatarUid}|${input.emoteId}`;
  return `cn:emo:${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

export function buildAvatarEmoteCausalNode(input: {
  avatarUid: string;
  linkedEntityUid?: string;
  emoteId: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.emote" as const,
    avatarUid: input.avatarUid,
    emoteId: input.emoteId
  };
  const id = computeAvatarEmoteNodeId({
    tickIndex: input.tickIndex,
    actorId: input.actorId,
    branchId: input.branchId,
    avatarUid: input.avatarUid,
    emoteId: input.emoteId
  });
  const affects = input.linkedEntityUid ? [input.linkedEntityUid] : [];
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "avatar.emote", avatarUid: input.avatarUid, emoteId: input.emoteId },
      affectsEntityIds: affects
    }
  };
}

export function hashNodeId(prefix: string, basis: string): string {
  return `${prefix}${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

export function buildPresenceRoomCreatedCausalNode(input: {
  roomUid: string;
  title: string;
  topic?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
  ownerSoulUid?: string;
}): CausalNode {
  const delta = {
    kind: "presence.room.created" as const,
    roomUid: input.roomUid,
    title: input.title,
    ...(input.topic !== undefined ? { topic: input.topic } : {})
  };
  const id = hashNodeId(
    "cn:room:",
    `${input.tickIndex}|${input.actorId}|room.created|${input.branchId}|${input.roomUid}|${input.title}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.room.create", roomUid: input.roomUid, ownerSoulUid: input.ownerSoulUid }
    }
  };
}

export function buildPresenceRoomMemberJoinCausalNode(input: {
  roomUid: string;
  avatarUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "presence.room.member_join" as const, roomUid: input.roomUid, avatarUid: input.avatarUid };
  const id = hashNodeId(
    "cn:rmj:",
    `${input.tickIndex}|${input.actorId}|room.join|${input.branchId}|${input.roomUid}|${input.avatarUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.room.join", roomUid: input.roomUid, avatarUid: input.avatarUid }
    }
  };
}

export function buildPresenceRoomMemberLeaveCausalNode(input: {
  roomUid: string;
  avatarUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "presence.room.member_leave" as const, roomUid: input.roomUid, avatarUid: input.avatarUid };
  const id = hashNodeId(
    "cn:rml:",
    `${input.tickIndex}|${input.actorId}|room.leave|${input.branchId}|${input.roomUid}|${input.avatarUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.room.leave", roomUid: input.roomUid, avatarUid: input.avatarUid }
    }
  };
}

export function buildBroadcastChannelCreatedCausalNode(input: {
  channelUid: string;
  title: string;
  topic?: string;
  roomUid?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
  ownerSoulUid?: string;
}): CausalNode {
  const delta = {
    kind: "presence.broadcast.created" as const,
    channelUid: input.channelUid,
    title: input.title,
    ...(input.topic !== undefined ? { topic: input.topic } : {}),
    ...(input.roomUid !== undefined ? { roomUid: input.roomUid } : {})
  };
  const id = hashNodeId(
    "cn:bcr:",
    `${input.tickIndex}|${input.actorId}|broadcast.create|${input.branchId}|${input.channelUid}|${input.title}|${input.roomUid ?? ""}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.broadcast.create", channelUid: input.channelUid }
    }
  };
}

export function buildBroadcastMemberJoinCausalNode(input: {
  channelUid: string;
  avatarUid: string;
  role: "speaker" | "audience";
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "presence.broadcast.join" as const,
    channelUid: input.channelUid,
    avatarUid: input.avatarUid,
    role: input.role
  };
  const id = hashNodeId(
    "cn:bcj:",
    `${input.tickIndex}|${input.actorId}|broadcast.join|${input.branchId}|${input.channelUid}|${input.avatarUid}|${input.role}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: {
        intentKind: "presence.broadcast.join",
        channelUid: input.channelUid,
        avatarUid: input.avatarUid,
        role: input.role
      }
    }
  };
}

export function buildBroadcastMemberLeaveCausalNode(input: {
  channelUid: string;
  avatarUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "presence.broadcast.leave" as const, channelUid: input.channelUid, avatarUid: input.avatarUid };
  const id = hashNodeId(
    "cn:bcl:",
    `${input.tickIndex}|${input.actorId}|broadcast.leave|${input.branchId}|${input.channelUid}|${input.avatarUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.broadcast.leave", channelUid: input.channelUid, avatarUid: input.avatarUid }
    }
  };
}

export function buildAvatarSpawnCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  zoneId: string;
  role: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  status: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.spawn" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    zoneId: input.zoneId,
    role: input.role,
    x: input.x,
    y: input.y,
    z: input.z,
    rotY: input.rotY,
    status: input.status
  };
  const id = hashNodeId(
    "cn:asp:",
    `${input.tickIndex}|${input.actorId}|avatar.spawn|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.zoneId}|${input.role}|${input.x}|${input.y}|${input.z}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: {
        intentKind: "presence.avatar.spawn",
        avatarUid: input.avatarUid,
        roomUid: input.roomUid,
        role: input.role
      }
    }
  };
}

export function buildPresenceRoleAssignCausalNode(input: {
  roomUid: string;
  targetAvatarUid: string;
  role: string;
  assignedByAvatarUid?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "role.assign" as const,
    roomUid: input.roomUid,
    targetAvatarUid: input.targetAvatarUid,
    role: input.role,
    ...(input.assignedByAvatarUid ? { assignedByAvatarUid: input.assignedByAvatarUid } : {})
  };
  const id = hashNodeId(
    "cn:ras:",
    `${input.tickIndex}|${input.actorId}|role.assign|${input.branchId}|${input.roomUid}|${input.targetAvatarUid}|${input.role}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.role.assign", ...delta }
    }
  };
}

export function buildPresenceRoleRevokeCausalNode(input: {
  roomUid: string;
  targetAvatarUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "role.revoke" as const,
    roomUid: input.roomUid,
    targetAvatarUid: input.targetAvatarUid
  };
  const id = hashNodeId(
    "cn:rrv:",
    `${input.tickIndex}|${input.actorId}|role.revoke|${input.branchId}|${input.roomUid}|${input.targetAvatarUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.role.revoke", ...delta }
    }
  };
}

export function buildPresenceModerateKickCausalNode(input: {
  roomUid: string;
  targetAvatarUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "moderate.kick" as const, roomUid: input.roomUid, targetAvatarUid: input.targetAvatarUid };
  const id = hashNodeId(
    "cn:mdk:",
    `${input.tickIndex}|${input.actorId}|moderate.kick|${input.branchId}|${input.roomUid}|${input.targetAvatarUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.moderate.kick", ...delta }
    }
  };
}

export function buildPresenceModerateMuteCausalNode(input: {
  roomUid: string;
  targetAvatarUid: string;
  muted: boolean;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "moderate.mute" as const,
    roomUid: input.roomUid,
    targetAvatarUid: input.targetAvatarUid,
    muted: input.muted
  };
  const id = hashNodeId(
    "cn:mdm:",
    `${input.tickIndex}|${input.actorId}|moderate.mute|${input.branchId}|${input.roomUid}|${input.targetAvatarUid}|${input.muted}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.moderate.mute", ...delta }
    }
  };
}

export function buildPresenceStagePinCausalNode(input: {
  roomUid: string;
  actorAvatarUid: string;
  summary: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "stage.pin" as const,
    roomUid: input.roomUid,
    actorAvatarUid: input.actorAvatarUid,
    summary: input.summary
  };
  const id = hashNodeId(
    "cn:spn:",
    `${input.tickIndex}|${input.actorId}|stage.pin|${input.branchId}|${input.roomUid}|${input.actorAvatarUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.stage.pin", ...delta }
    }
  };
}

export function buildPresenceStageInviteCausalNode(input: {
  roomUid: string;
  fromAvatarUid: string;
  toAvatarUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "stage.invite" as const,
    roomUid: input.roomUid,
    fromAvatarUid: input.fromAvatarUid,
    toAvatarUid: input.toAvatarUid
  };
  const id = hashNodeId(
    "cn:siv:",
    `${input.tickIndex}|${input.actorId}|stage.invite|${input.branchId}|${input.roomUid}|${input.fromAvatarUid}|${input.toAvatarUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.stage.invite", ...delta }
    }
  };
}

export function buildAvatarMoveCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  zoneId: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  status: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.move" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    zoneId: input.zoneId,
    x: input.x,
    y: input.y,
    z: input.z,
    rotY: input.rotY,
    status: input.status
  };
  const id = hashNodeId(
    "cn:amv:",
    `${input.tickIndex}|${input.actorId}|avatar.move|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.zoneId}|${input.x}|${input.y}|${input.z}|${input.rotY}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: {
        intentKind: "presence.avatar.move",
        avatarUid: input.avatarUid,
        roomUid: input.roomUid,
        zoneId: input.zoneId
      }
    }
  };
}

export function buildAvatarZoneEnterCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  zoneId: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.zone.enter" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    zoneId: input.zoneId
  };
  const id = hashNodeId(
    "cn:aze:",
    `${input.tickIndex}|${input.actorId}|avatar.zone.enter|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.zoneId}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.avatar.zone.enter", ...delta }
    }
  };
}

export function buildAvatarZoneLeaveCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  zoneId: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.zone.leave" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    zoneId: input.zoneId
  };
  const id = hashNodeId(
    "cn:azl:",
    `${input.tickIndex}|${input.actorId}|avatar.zone.leave|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.zoneId}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.avatar.zone.leave", ...delta }
    }
  };
}

export function buildAvatarZoneTransitionCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  fromZoneId: string;
  toZoneId: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.zone.transition" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    fromZoneId: input.fromZoneId,
    toZoneId: input.toZoneId
  };
  const id = hashNodeId(
    "cn:azt:",
    `${input.tickIndex}|${input.actorId}|avatar.zone.transition|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.fromZoneId}|${input.toZoneId}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.avatar.zone.transition", ...delta }
    }
  };
}

export function buildAvatarSpeakStartCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "avatar.speak.start" as const, avatarUid: input.avatarUid, roomUid: input.roomUid };
  const id = hashNodeId(
    "cn:spk:",
    `${input.tickIndex}|${input.actorId}|avatar.speak.start|${input.branchId}|${input.avatarUid}|${input.roomUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.avatar.speak.start", ...delta }
    }
  };
}

export function buildAvatarSpeakStopCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "avatar.speak.stop" as const, avatarUid: input.avatarUid, roomUid: input.roomUid };
  const id = hashNodeId(
    "cn:spx:",
    `${input.tickIndex}|${input.actorId}|avatar.speak.stop|${input.branchId}|${input.avatarUid}|${input.roomUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.avatar.speak.stop", ...delta }
    }
  };
}

export function buildAvatarReactCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  kind: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.react" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    reactKind: input.kind
  };
  const id = hashNodeId(
    "cn:arx:",
    `${input.tickIndex}|${input.actorId}|avatar.react|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.kind}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: {
        intentKind: "presence.avatar.react" as const,
        avatarUid: input.avatarUid,
        roomUid: input.roomUid,
        kind: input.kind
      }
    }
  };
}

export function buildAvatarRaiseHandCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  raised: boolean;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.raise_hand" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    raised: input.raised
  };
  const id = hashNodeId(
    "cn:arh:",
    `${input.tickIndex}|${input.actorId}|avatar.raise_hand|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.raised}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.avatar.raise_hand", ...delta }
    }
  };
}

export function buildAvatarPetSummonCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  petUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.pet.summon" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    petUid: input.petUid
  };
  const id = hashNodeId(
    "cn:pts:",
    `${input.tickIndex}|${input.actorId}|avatar.pet.summon|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.petUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.avatar.pet.summon", ...delta }
    }
  };
}

export function buildAvatarAgentInvokeCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  agentUid: string;
  intent?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "avatar.agent.invoke" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    agentUid: input.agentUid,
    ...(input.intent !== undefined ? { intent: input.intent } : {})
  };
  const id = hashNodeId(
    "cn:agi:",
    `${input.tickIndex}|${input.actorId}|avatar.agent.invoke|${input.branchId}|${input.avatarUid}|${input.roomUid}|${input.agentUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { intentKind: "presence.avatar.agent.invoke", ...delta }
    }
  };
}
