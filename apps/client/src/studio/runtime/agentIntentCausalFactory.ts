/**
 * Causal atom for agent-bridge intents (fallback when no dedicated slice handles the action).
 */
import { hashSeed } from "./mindRuntime";
import type { CausalNode, RhizohAgentToolIntentV0 } from "../types/rskOntology";

export function buildRhizohAgentIntentCommitCausalNode(input: {
  intent: RhizohAgentToolIntentV0;
  branchId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
  dispatchOk: boolean;
  dispatchError?: string;
}): CausalNode {
  const intent = input.intent;
  const delta = {
    kind: "agent.bridge.intent" as const,
    toolId: intent.toolId,
    kernelAction: intent.kernelAction ?? null,
    dispatchOk: input.dispatchOk,
    dispatchError: input.dispatchError ?? null,
    attentionFocus: intent.attentionFocus ?? null
  };
  const basis = `${input.tickIndex}|${input.actorId}|${intent.toolId}|${intent.kernelAction ?? ""}|${input.dispatchOk}`;
  const id = `cn:abi:${hashSeed(basis).toString(16).padStart(8, "0")}`;
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "system",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: {
        intentKind: "agent.bridge.intent",
        toolId: intent.toolId,
        kernelAction: intent.kernelAction,
        payload: intent.payload,
        confidence: intent.confidence,
        rationale: intent.rationale,
        attentionFocus: intent.attentionFocus
      }
    }
  };
}
