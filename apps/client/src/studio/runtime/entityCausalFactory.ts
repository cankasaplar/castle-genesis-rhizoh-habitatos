import { hashSeed } from "./mindRuntime";
import type { CausalNode, CollisionResolutionType, EntityPos3 } from "../types/rskOntology";

/**
 * Deterministic entity genesis id (kernel / registry actor — never the entity itself).
 */
export function computeEntityGenesisNodeId(input: {
  tickIndex: number;
  actorId: string;
  branchId: string;
  entityUid: string;
}): string {
  const basis = `${input.tickIndex}|${input.actorId}|entity.genesis|${input.branchId}|${input.entityUid}`;
  return `cn:ent:${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

/**
 * ENTITY GENESIS RULE: existence starts as one causal atom (minds/tools/system — not entity).
 */
export function buildEntityGenesisCausalNode(input: {
  entityUid: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  branchId: string;
  causeIds: string[];
}): CausalNode {
  const delta = { kind: "entity.genesis" as const, entityUid: input.entityUid };
  const id = computeEntityGenesisNodeId({
    tickIndex: input.tickIndex,
    actorId: input.actorId,
    branchId: input.branchId,
    entityUid: input.entityUid
  });
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "entity",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: { source: "registry.entity.register", entityUid: input.entityUid },
      affectsEntityIds: [input.entityUid]
    }
  };
}

export function computeEntityPhysicalMoveNodeId(input: {
  tickIndex: number;
  actorId: string;
  branchId: string;
  entityUid: string;
  pos: EntityPos3;
}): string {
  const basis = `${input.tickIndex}|${input.actorId}|entity.physical|${input.branchId}|${input.entityUid}|${input.pos.x}|${input.pos.y}|${input.pos.z}`;
  return `cn:mv:${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

/**
 * Tool-emitted causal atom for validated absolute placement (movement = event, not registry poke).
 */
export function buildEntityPhysicalMoveCausalNode(input: {
  entityUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
  nextPos: EntityPos3;
}): CausalNode {
  const delta = {
    kind: "entity.physical" as const,
    entityUid: input.entityUid,
    patch: { pos: { x: input.nextPos.x, y: input.nextPos.y, z: input.nextPos.z } }
  };
  const id = computeEntityPhysicalMoveNodeId({
    tickIndex: input.tickIndex,
    actorId: input.actorId,
    branchId: input.branchId,
    entityUid: input.entityUid,
    pos: input.nextPos
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
      input: { intentKind: "entity.move", entityUid: input.entityUid },
      affectsEntityIds: [input.entityUid]
    }
  };
}

export function computeCollisionResolutionNodeId(input: {
  tickIndex: number;
  actorId: string;
  branchId: string;
  initiatorEntityUid: string;
  targetEntityUid: string;
  resolutionType: CollisionResolutionType;
}): string {
  const basis = `${input.tickIndex}|${input.actorId}|collision.resolution|${input.branchId}|${input.initiatorEntityUid}|${input.targetEntityUid}|${input.resolutionType}`;
  return `cn:col:${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

/**
 * Resolution artifact for co-presence violation (same writer tail as a move would use — replay-deterministic sibling outcome).
 */
export function buildCollisionResolutionCausalNode(input: {
  initiatorEntityUid: string;
  targetEntityUid: string;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
  impactVector: EntityPos3;
  resolutionType: CollisionResolutionType;
}): CausalNode {
  const delta = {
    kind: "collision.resolution" as const,
    initiatorEntityUid: input.initiatorEntityUid,
    targetEntityUid: input.targetEntityUid,
    resolutionType: input.resolutionType,
    impactVector: { x: input.impactVector.x, y: input.impactVector.y, z: input.impactVector.z }
  };
  const id = computeCollisionResolutionNodeId({
    tickIndex: input.tickIndex,
    actorId: input.actorId,
    branchId: input.branchId,
    initiatorEntityUid: input.initiatorEntityUid,
    targetEntityUid: input.targetEntityUid,
    resolutionType: input.resolutionType
  });
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "tool.collision",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: {
        intentKind: "entity.move",
        initiatorEntityUid: input.initiatorEntityUid,
        collisionTargetId: input.targetEntityUid,
        resolutionType: input.resolutionType,
        impactVector: delta.impactVector
      },
      affectsEntityIds: [input.initiatorEntityUid, input.targetEntityUid]
    }
  };
}
