import { hashSeed } from "./mindRuntime";
import type { CausalNode, CompanionAgentArchetype } from "../types/rskOntology";

function hashNodeId(prefix: string, basis: string): string {
  return `${prefix}${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

export function buildAgentSpawnCausalNode(input: {
  agentUid: string;
  ownerAvatarUid: string;
  roomUid: string;
  archetype: CompanionAgentArchetype;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "agent.spawn" as const,
    agentUid: input.agentUid,
    ownerAvatarUid: input.ownerAvatarUid,
    roomUid: input.roomUid,
    archetype: input.archetype
  };
  const id = hashNodeId(
    "cn:ags:",
    `${input.tickIndex}|${input.actorId}|agent.spawn|${input.branchId}|${input.agentUid}|${input.roomUid}`
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
      input: { intentKind: "presence.agent.spawn" as const, ...delta }
    }
  };
}

export function buildAgentListenCausalNode(input: {
  agentUid: string;
  roomUid: string;
  ownerAvatarUid: string;
  attentionTargetUid?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "agent.listen" as const,
    agentUid: input.agentUid,
    roomUid: input.roomUid,
    ownerAvatarUid: input.ownerAvatarUid,
    ...(input.attentionTargetUid !== undefined ? { attentionTargetUid: input.attentionTargetUid } : {})
  };
  const id = hashNodeId(
    "cn:agl:",
    `${input.tickIndex}|${input.actorId}|agent.listen|${input.branchId}|${input.agentUid}|${input.roomUid}`
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
      input: { intentKind: "presence.agent.listen" as const, agentUid: input.agentUid, roomUid: input.roomUid }
    }
  };
}

export function buildAgentRespondCausalNode(input: {
  agentUid: string;
  roomUid: string;
  summary: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "agent.respond" as const,
    agentUid: input.agentUid,
    roomUid: input.roomUid,
    summary: input.summary
  };
  const id = hashNodeId(
    "cn:agr:",
    `${input.tickIndex}|${input.actorId}|agent.respond|${input.branchId}|${input.agentUid}|${input.summary.slice(0, 32)}`
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
      input: { intentKind: "presence.agent.respond" as const, agentUid: input.agentUid, roomUid: input.roomUid, summary: input.summary }
    }
  };
}

export function buildAgentFollowCausalNode(input: {
  agentUid: string;
  roomUid: string;
  ownerAvatarUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "agent.follow" as const,
    agentUid: input.agentUid,
    roomUid: input.roomUid,
    ownerAvatarUid: input.ownerAvatarUid
  };
  const id = hashNodeId(
    "cn:agf:",
    `${input.tickIndex}|${input.actorId}|agent.follow|${input.branchId}|${input.agentUid}`
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
      input: { intentKind: "presence.agent.follow" as const, ...delta }
    }
  };
}

export function buildAgentObserveCausalNode(input: {
  agentUid: string;
  roomUid: string;
  subjectAvatarUid?: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = {
    kind: "agent.observe" as const,
    agentUid: input.agentUid,
    roomUid: input.roomUid,
    ...(input.subjectAvatarUid !== undefined ? { subjectAvatarUid: input.subjectAvatarUid } : {})
  };
  const id = hashNodeId(
    "cn:ago:",
    `${input.tickIndex}|${input.actorId}|agent.observe|${input.branchId}|${input.agentUid}`
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
      input: { intentKind: "presence.agent.observe" as const, agentUid: input.agentUid, roomUid: input.roomUid }
    }
  };
}

export function buildAgentDepartCausalNode(input: {
  agentUid: string;
  roomUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "agent.depart" as const, agentUid: input.agentUid, roomUid: input.roomUid };
  const id = hashNodeId(
    "cn:agd:",
    `${input.tickIndex}|${input.actorId}|agent.depart|${input.branchId}|${input.agentUid}`
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
      input: { intentKind: "presence.agent.depart" as const, ...delta }
    }
  };
}
