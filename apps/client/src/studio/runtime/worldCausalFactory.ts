import { hashSeed } from "./mindRuntime";
import type { CausalNode } from "../types/rskOntology";

function hashNodeId(prefix: string, basis: string): string {
  return `${prefix}${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

export function buildWorldAvatarRegionLeaveCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  regionUid: string;
  x: number;
  z: number;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "world.avatar.region.leave" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    regionUid: input.regionUid,
    x: input.x,
    z: input.z
  };
  const id = hashNodeId(
    "cn:wrl:",
    `${input.tickIndex}|${input.actorId}|world.avatar.region.leave|${input.branchId}|${input.avatarUid}|${input.regionUid}`
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
      input: { intentKind: "world.avatar.region.leave", ...delta }
    }
  };
}

export function buildWorldPortalCrossCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  fromRegionUid: string;
  toRegionUid: string;
  portalEdgeUid: string;
  x: number;
  z: number;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "world.portal.cross" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    fromRegionUid: input.fromRegionUid,
    toRegionUid: input.toRegionUid,
    portalEdgeUid: input.portalEdgeUid,
    x: input.x,
    z: input.z
  };
  const id = hashNodeId(
    "cn:wpc:",
    `${input.tickIndex}|${input.actorId}|world.portal.cross|${input.branchId}|${input.avatarUid}|${input.fromRegionUid}|${input.toRegionUid}`
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
      input: { intentKind: "world.portal.cross", ...delta }
    }
  };
}

export function buildWorldAvatarRegionEnterCausalNode(input: {
  avatarUid: string;
  roomUid: string;
  regionUid: string;
  x: number;
  z: number;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "world.avatar.region.enter" as const,
    avatarUid: input.avatarUid,
    roomUid: input.roomUid,
    regionUid: input.regionUid,
    x: input.x,
    z: input.z
  };
  const id = hashNodeId(
    "cn:wre:",
    `${input.tickIndex}|${input.actorId}|world.avatar.region.enter|${input.branchId}|${input.avatarUid}|${input.regionUid}`
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
      input: { intentKind: "world.avatar.region.enter", ...delta }
    }
  };
}

export function buildWorldChunkDeactivateCausalNode(input: {
  regionUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "world.chunk.deactivate" as const, regionUid: input.regionUid };
  const id = hashNodeId(
    "cn:wcd:",
    `${input.tickIndex}|${input.actorId}|world.chunk.deactivate|${input.branchId}|${input.regionUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: { delta, input: { intentKind: "world.chunk.deactivate", ...delta } }
  };
}

export function buildWorldChunkActivateCausalNode(input: {
  regionUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "world.chunk.activate" as const, regionUid: input.regionUid };
  const id = hashNodeId(
    "cn:wca:",
    `${input.tickIndex}|${input.actorId}|world.chunk.activate|${input.branchId}|${input.regionUid}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: { delta, input: { intentKind: "world.chunk.activate", ...delta } }
  };
}
