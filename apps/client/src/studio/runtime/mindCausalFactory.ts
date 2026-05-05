import { hashSeed } from "./mindRuntime";
import type { CausalNode, RSKMindRuntimeState } from "../types/rskOntology";

function stableDeltaForId(delta: Record<string, number>): string {
  const keys = Object.keys(delta).sort();
  return keys.map((k) => `${k}:${delta[k]!.toFixed(6)}`).join("|");
}

/**
 * Deterministic id: tickIndex + actorId + payload.delta (immutable delta fingerprint).
 */
export function computeMindCausalNodeId(input: {
  tickIndex: number;
  actorId: string;
  delta: Record<string, number>;
  branchId: string;
  mindInstanceId: string;
}): string {
  const basis = `${input.tickIndex}|${input.actorId}|${stableDeltaForId(input.delta)}|${input.branchId}|${input.mindInstanceId}`;
  return `cn:${hashSeed(basis).toString(16).padStart(8, "0")}`;
}

/**
 * Pure factory — no store I/O. Mind runtime transition → causal atom.
 */
export function buildMindTickCausalNode(input: {
  branchId: string;
  mindInstanceId: string;
  tickIndex: number;
  timestamp: number;
  actorId: string;
  causeIds: string[];
  prev: RSKMindRuntimeState;
  next: RSKMindRuntimeState;
  inputContext: unknown;
  outputContext?: unknown;
  /** When set, projection reducer may refresh cached entity slices (Phase 3). */
  affectsEntityIds?: string[];
}): CausalNode {
  const delta = {
    entropy: input.next.internal.entropy - input.prev.internal.entropy,
    mood: input.next.internal.mood - input.prev.internal.mood,
    focus: input.next.internal.focus - input.prev.internal.focus,
    energy: input.next.internal.energy - input.prev.internal.energy,
    load: input.next.internal.load - input.prev.internal.load
  };
  const id = computeMindCausalNodeId({
    tickIndex: input.tickIndex,
    actorId: input.actorId,
    delta,
    branchId: input.branchId,
    mindInstanceId: input.mindInstanceId
  });
  return {
    id,
    tickIndex: input.tickIndex,
    timestamp: input.timestamp,
    type: "mind",
    causeIds: [...input.causeIds],
    actorId: input.actorId,
    branchId: input.branchId,
    payload: {
      delta,
      input: input.inputContext ?? null,
      output: input.outputContext,
      ...(input.affectsEntityIds?.length ? { affectsEntityIds: [...input.affectsEntityIds] } : {})
    }
  };
}
