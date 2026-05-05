import type { CausalNode } from "../types/rskOntology";
import { hashNodeId } from "./presenceCausalFactory";

function broadcastNode(
  prefix: string,
  kind: string,
  basis: string,
  delta: Record<string, unknown>,
  intentKind: string,
  input: Record<string, unknown>,
  inputCommon: {
    branchId: string;
    tickIndex: number;
    timestamp: number;
    actorId: string;
    causeIds: string[];
  }
): CausalNode {
  const id = hashNodeId(prefix, basis);
  return {
    id,
    tickIndex: inputCommon.tickIndex,
    timestamp: inputCommon.timestamp,
    type: "tool",
    causeIds: [...inputCommon.causeIds],
    actorId: inputCommon.actorId,
    branchId: inputCommon.branchId,
    payload: {
      delta: { kind, ...delta },
      input: { intentKind, ...input }
    }
  };
}

export function buildBroadcastStartCausalNode(input: {
  broadcastUid: string;
  roomUid?: string;
  hostAvatarUid?: string;
  sceneMode?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bst:",
    "broadcast.start",
    `${input.tickIndex}|${input.actorId}|broadcast.start|${input.branchId}|${input.broadcastUid}`,
    {
      broadcastUid: input.broadcastUid,
      ...(input.roomUid ? { roomUid: input.roomUid } : {}),
      ...(input.hostAvatarUid ? { hostAvatarUid: input.hostAvatarUid } : {}),
      ...(input.sceneMode ? { sceneMode: input.sceneMode } : {})
    },
    "presence.broadcast.start",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastPauseCausalNode(input: {
  broadcastUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bps:",
    "broadcast.pause",
    `${input.tickIndex}|${input.actorId}|broadcast.pause|${input.branchId}|${input.broadcastUid}`,
    { broadcastUid: input.broadcastUid },
    "presence.broadcast.pause",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastResumeCausalNode(input: {
  broadcastUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:brs:",
    "broadcast.resume",
    `${input.tickIndex}|${input.actorId}|broadcast.resume|${input.branchId}|${input.broadcastUid}`,
    { broadcastUid: input.broadcastUid },
    "presence.broadcast.resume",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastStopCausalNode(input: {
  broadcastUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bsp:",
    "broadcast.stop",
    `${input.tickIndex}|${input.actorId}|broadcast.stop|${input.branchId}|${input.broadcastUid}`,
    { broadcastUid: input.broadcastUid },
    "presence.broadcast.stop",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastSegmentOpenCausalNode(input: {
  broadcastUid: string;
  segmentId: string;
  label?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bsg:",
    "segment.open",
    `${input.tickIndex}|${input.actorId}|segment.open|${input.branchId}|${input.broadcastUid}|${input.segmentId}`,
    {
      broadcastUid: input.broadcastUid,
      segmentId: input.segmentId,
      ...(input.label ? { label: input.label } : {})
    },
    "presence.broadcast.segment.open",
    { broadcastUid: input.broadcastUid, segmentId: input.segmentId },
    input
  );
}

export function buildBroadcastSegmentCloseCausalNode(input: {
  broadcastUid: string;
  segmentId: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bsc:",
    "segment.close",
    `${input.tickIndex}|${input.actorId}|segment.close|${input.branchId}|${input.broadcastUid}|${input.segmentId}`,
    { broadcastUid: input.broadcastUid, segmentId: input.segmentId },
    "presence.broadcast.segment.close",
    { broadcastUid: input.broadcastUid, segmentId: input.segmentId },
    input
  );
}

export function buildBroadcastSpotlightAssignCausalNode(input: {
  broadcastUid: string;
  targetAvatarUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bsa:",
    "spotlight.assign",
    `${input.tickIndex}|${input.actorId}|spotlight.assign|${input.branchId}|${input.broadcastUid}|${input.targetAvatarUid}`,
    { broadcastUid: input.broadcastUid, targetAvatarUid: input.targetAvatarUid },
    "presence.broadcast.spotlight.assign",
    { broadcastUid: input.broadcastUid, targetAvatarUid: input.targetAvatarUid },
    input
  );
}

export function buildBroadcastSpotlightReleaseCausalNode(input: {
  broadcastUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bsr:",
    "spotlight.release",
    `${input.tickIndex}|${input.actorId}|spotlight.release|${input.branchId}|${input.broadcastUid}`,
    { broadcastUid: input.broadcastUid },
    "presence.broadcast.spotlight.release",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastCameraFocusCausalNode(input: {
  broadcastUid: string;
  targetUid?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bcf:",
    "camera.focus",
    `${input.tickIndex}|${input.actorId}|camera.focus|${input.branchId}|${input.broadcastUid}|${input.targetUid ?? ""}`,
    { broadcastUid: input.broadcastUid, ...(input.targetUid ? { targetUid: input.targetUid } : {}) },
    "presence.broadcast.camera.focus",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastCameraFollowCausalNode(input: {
  broadcastUid: string;
  targetUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bfw:",
    "camera.follow",
    `${input.tickIndex}|${input.actorId}|camera.follow|${input.branchId}|${input.broadcastUid}|${input.targetUid}`,
    { broadcastUid: input.broadcastUid, targetUid: input.targetUid },
    "presence.broadcast.camera.follow",
    { broadcastUid: input.broadcastUid, targetUid: input.targetUid },
    input
  );
}

export function buildBroadcastCameraCutCausalNode(input: {
  broadcastUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bcc:",
    "camera.cut",
    `${input.tickIndex}|${input.actorId}|camera.cut|${input.branchId}|${input.broadcastUid}`,
    { broadcastUid: input.broadcastUid },
    "presence.broadcast.camera.cut",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastOverlayPushCausalNode(input: {
  broadcastUid: string;
  overlayId: string;
  overlayKind: string;
  payload?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bop:",
    "overlay.push",
    `${input.tickIndex}|${input.actorId}|overlay.push|${input.branchId}|${input.broadcastUid}|${input.overlayId}|${input.overlayKind}`,
    {
      broadcastUid: input.broadcastUid,
      overlayId: input.overlayId,
      overlayKind: input.overlayKind,
      ...(input.payload !== undefined ? { payload: input.payload } : {})
    },
    "presence.broadcast.overlay.push",
    { broadcastUid: input.broadcastUid, overlayId: input.overlayId },
    input
  );
}

export function buildBroadcastOverlayRemoveCausalNode(input: {
  broadcastUid: string;
  overlayId: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bor:",
    "overlay.remove",
    `${input.tickIndex}|${input.actorId}|overlay.remove|${input.branchId}|${input.broadcastUid}|${input.overlayId}`,
    { broadcastUid: input.broadcastUid, overlayId: input.overlayId },
    "presence.broadcast.overlay.remove",
    { broadcastUid: input.broadcastUid, overlayId: input.overlayId },
    input
  );
}

export function buildBroadcastAudienceWaveCausalNode(input: {
  broadcastUid: string;
  intensity?: number;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:baw:",
    "audience.wave",
    `${input.tickIndex}|${input.actorId}|audience.wave|${input.branchId}|${input.broadcastUid}`,
    {
      broadcastUid: input.broadcastUid,
      ...(typeof input.intensity === "number" && Number.isFinite(input.intensity) ? { intensity: input.intensity } : {})
    },
    "presence.broadcast.audience.wave",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastAudienceApplauseCausalNode(input: {
  broadcastUid: string;
  intensity?: number;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:baa:",
    "audience.applause",
    `${input.tickIndex}|${input.actorId}|audience.applause|${input.branchId}|${input.broadcastUid}`,
    {
      broadcastUid: input.broadcastUid,
      ...(typeof input.intensity === "number" && Number.isFinite(input.intensity) ? { intensity: input.intensity } : {})
    },
    "presence.broadcast.audience.applause",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastAudienceCheerCausalNode(input: {
  broadcastUid: string;
  intensity?: number;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bac:",
    "audience.cheer",
    `${input.tickIndex}|${input.actorId}|audience.cheer|${input.branchId}|${input.broadcastUid}`,
    {
      broadcastUid: input.broadcastUid,
      ...(typeof input.intensity === "number" && Number.isFinite(input.intensity) ? { intensity: input.intensity } : {})
    },
    "presence.broadcast.audience.cheer",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastAudienceEmojiRainCausalNode(input: {
  broadcastUid: string;
  emoji?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bae:",
    "audience.emojiRain",
    `${input.tickIndex}|${input.actorId}|audience.emojiRain|${input.branchId}|${input.broadcastUid}`,
    {
      broadcastUid: input.broadcastUid,
      ...(input.emoji ? { emoji: input.emoji } : {})
    },
    "presence.broadcast.audience.emojiRain",
    { broadcastUid: input.broadcastUid },
    input
  );
}

export function buildBroadcastClipMarkCausalNode(input: {
  broadcastUid: string;
  roomUid: string;
  label: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bcm:",
    "broadcast.clip.mark",
    `${input.tickIndex}|${input.actorId}|clip.mark|${input.branchId}|${input.broadcastUid}|${input.roomUid}|${input.label}`,
    { broadcastUid: input.broadcastUid, roomUid: input.roomUid, label: input.label, atMs: input.timestamp },
    "presence.broadcast.clip.mark",
    { broadcastUid: input.broadcastUid, roomUid: input.roomUid },
    input
  );
}

export function buildBroadcastSceneSetCausalNode(input: {
  broadcastUid: string;
  roomUid: string;
  sceneMode: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  return broadcastNode(
    "cn:bss:",
    "broadcast.scene.set",
    `${input.tickIndex}|${input.actorId}|scene.set|${input.branchId}|${input.broadcastUid}|${input.roomUid}|${input.sceneMode}`,
    { broadcastUid: input.broadcastUid, roomUid: input.roomUid, sceneMode: input.sceneMode },
    "presence.broadcast.scene.set",
    { broadcastUid: input.broadcastUid, roomUid: input.roomUid },
    input
  );
}
