import { hashSeed } from "./mindRuntime";
import type { CausalNode } from "../types/rskOntology";

function hashNodeId(prefix: string, basis: string): string {
  return `${prefix}${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

export function buildPetSpawnCausalNode(input: {
  petSlotUid: string;
  displayPetUid: string;
  ownerAvatarUid: string;
  roomUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "pet.spawn" as const,
    petSlotUid: input.petSlotUid,
    petUid: input.displayPetUid,
    ownerAvatarUid: input.ownerAvatarUid,
    roomUid: input.roomUid
  };
  const id = hashNodeId(
    "cn:psp:",
    `${input.tickIndex}|${input.actorId}|pet.spawn|${input.branchId}|${input.petSlotUid}|${input.displayPetUid}`
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
      input: { intentKind: "presence.pet.spawn" as const, ...delta }
    }
  };
}

export function buildPetFollowCausalNode(input: {
  petSlotUid: string;
  ownerAvatarUid: string;
  roomUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "pet.follow" as const,
    petSlotUid: input.petSlotUid,
    ownerAvatarUid: input.ownerAvatarUid,
    roomUid: input.roomUid
  };
  const id = hashNodeId(
    "cn:pfl:",
    `${input.tickIndex}|${input.actorId}|pet.follow|${input.branchId}|${input.petSlotUid}`
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
      input: { intentKind: "presence.pet.follow" as const, ...delta }
    }
  };
}

export function buildPetObserveCausalNode(input: {
  petSlotUid: string;
  roomUid: string;
  rhizohAgentUid?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "pet.observe" as const,
    petSlotUid: input.petSlotUid,
    roomUid: input.roomUid,
    ...(input.rhizohAgentUid !== undefined ? { rhizohAgentUid: input.rhizohAgentUid } : {})
  };
  const id = hashNodeId(
    "cn:pob:",
    `${input.tickIndex}|${input.actorId}|pet.observe|${input.branchId}|${input.petSlotUid}`
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
      input: { intentKind: "presence.pet.observe" as const, petSlotUid: input.petSlotUid, roomUid: input.roomUid }
    }
  };
}

export function buildPetReactCausalNode(input: {
  petSlotUid: string;
  roomUid: string;
  echoKind: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "pet.react" as const,
    petSlotUid: input.petSlotUid,
    roomUid: input.roomUid,
    echoKind: input.echoKind
  };
  const id = hashNodeId(
    "cn:prc:",
    `${input.tickIndex}|${input.actorId}|pet.react|${input.branchId}|${input.petSlotUid}|${input.echoKind}`
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
      input: { intentKind: "presence.pet.react" as const, petSlotUid: input.petSlotUid, roomUid: input.roomUid, echoKind: input.echoKind }
    }
  };
}

export function buildPetDepartCausalNode(input: {
  petSlotUid: string;
  roomUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "pet.depart" as const, petSlotUid: input.petSlotUid, roomUid: input.roomUid };
  const id = hashNodeId(
    "cn:pdp:",
    `${input.tickIndex}|${input.actorId}|pet.depart|${input.branchId}|${input.petSlotUid}`
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
      input: { intentKind: "presence.pet.depart" as const, ...delta }
    }
  };
}
