/**
 * Causal economy integrator v1 — deterministic per-node weights + optional budget enforcement.
 * Caps live on `StudioKernelState.causalEconomy`; unset caps = no enforcement.
 */

import type { CausalEconomyLayerState, CausalNode, CausalNodeKind } from "../types/rskOntology";

export interface EconomyCharge {
  computeWeight: number;
  entropyImpact: number;
}

export function estimateEconomyForNodeType(kind: CausalNodeKind): EconomyCharge {
  switch (kind) {
    case "mind":
      return { computeWeight: 2, entropyImpact: 1.25 };
    case "entity":
      return { computeWeight: 0.35, entropyImpact: 0.22 };
    case "tool":
      return { computeWeight: 0.9, entropyImpact: 0.48 };
    case "tool.collision":
      return { computeWeight: 1.15, entropyImpact: 0.82 };
    case "system":
      return { computeWeight: 0.12, entropyImpact: 0.06 };
    default:
      return { computeWeight: 0.5, entropyImpact: 0.3 };
  }
}

/** Stamp `payload.economy` from node type (id / delta unchanged). */
export function withEconomyPayload<N extends CausalNode>(node: N): N {
  const e = estimateEconomyForNodeType(node.type);
  return {
    ...node,
    payload: {
      ...node.payload,
      economy: { computeWeight: e.computeWeight, entropyImpact: e.entropyImpact }
    }
  };
}

export function assertEconomyAllowsAppend(
  cur: CausalEconomyLayerState,
  charge: EconomyCharge
): { ok: true } | { ok: false; error: string } {
  const nextC = cur.cumulativeComputeWeight + charge.computeWeight;
  const nextE = cur.cumulativeEntropyImpact + charge.entropyImpact;
  if (cur.maxComputeWeight !== undefined && nextC > cur.maxComputeWeight) {
    return { ok: false, error: "causal_economy_compute_cap" };
  }
  if (cur.maxEntropyImpact !== undefined && nextE > cur.maxEntropyImpact) {
    return { ok: false, error: "causal_economy_entropy_cap" };
  }
  return { ok: true };
}

export function accumulateEconomy(cur: CausalEconomyLayerState, charge: EconomyCharge): CausalEconomyLayerState {
  return {
    ...cur,
    cumulativeComputeWeight: cur.cumulativeComputeWeight + charge.computeWeight,
    cumulativeEntropyImpact: cur.cumulativeEntropyImpact + charge.entropyImpact
  };
}

const SHADOW_LINEAGE_COMPUTE = 0.08;
const SHADOW_LINEAGE_ENTROPY = 0.12;

/** Charge for shadow pack: each simulated mind node + small lineage tax (fork depth). */
export function estimateShadowPackCharge(nodeCount: number, lineageDepth: number): EconomyCharge {
  const unit = estimateEconomyForNodeType("mind");
  const depth = Math.max(0, lineageDepth);
  return {
    computeWeight: nodeCount * unit.computeWeight + depth * SHADOW_LINEAGE_COMPUTE,
    entropyImpact: nodeCount * unit.entropyImpact + depth * SHADOW_LINEAGE_ENTROPY
  };
}
