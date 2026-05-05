import type { CausalNode, IdentityCausalEventV0 } from "../types/rskOntology";
import { CAUSAL_GENESIS_NODE_ID } from "./causalGraph";
import { hashNodeId } from "./presenceCausalFactory";

type IdentityEventType = IdentityCausalEventV0["type"];

export function buildIdentityCausalEventV0(input: {
  type: IdentityEventType;
  actorUid: string;
  targetUid: string;
  patch: Record<string, unknown>;
  causeNodeId?: string;
  timestamp: number;
}): IdentityCausalEventV0 {
  return {
    type: input.type,
    actorUid: input.actorUid,
    targetUid: input.targetUid,
    patch: input.patch,
    causeNodeId: input.causeNodeId,
    timestamp: input.timestamp
  };
}

export function buildIdentityCausalNode(input: {
  event: IdentityCausalEventV0;
  branchId: string;
  tickIndex: number;
  actorId: string;
  causeIds: string[];
}): CausalNode {
  const id = hashNodeId(
    "cn:idn:",
    `${input.tickIndex}|${input.actorId}|${input.event.type}|${input.branchId}|${input.event.targetUid}|${JSON.stringify(input.event.patch)}`
  );
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.event.timestamp,
    type: "tool",
    causeIds: input.causeIds.length ? [...input.causeIds] : [CAUSAL_GENESIS_NODE_ID],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta: {
        kind: input.event.type,
        targetUid: input.event.targetUid,
        patch: input.event.patch
      },
      input: {
        intentKind: input.event.type,
        actorUid: input.event.actorUid
      }
    }
  };
}
