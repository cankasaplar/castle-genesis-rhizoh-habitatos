import type { Branch, CausalGraphRegistry, CausalNode } from "../types/rskOntology";
import { CAUSAL_GENESIS_NODE_ID } from "./causalGraph";

export type CausalAppendResult =
  | { ok: true; graph: CausalGraphRegistry }
  | { ok: false; error: string };

/**
 * Append-only causal write + kernel laws (no retroactive mutation of existing nodes).
 */
export function appendCausalNode(
  graph: CausalGraphRegistry,
  node: CausalNode,
  writerSubjectId: string,
  opts?: { causeLookup?: Record<string, CausalNode> }
): CausalAppendResult {
  const tailKey = `${node.branchId}::${writerSubjectId}`;
  const resolve = (id: string): CausalNode | undefined => graph.nodes[id] ?? opts?.causeLookup?.[id];

  if (graph.nodes[node.id]) {
    return { ok: false, error: "causal_duplicate_id" };
  }

  const br: Branch | undefined = graph.branches[node.branchId];
  if (br && node.tickIndex < br.forkTick) {
    return { ok: false, error: "causal_node_before_fork" };
  }

  const lastTipId = graph.writerHeads[tailKey];
  if (lastTipId) {
    const last = graph.nodes[lastTipId];
    if (last && node.tickIndex <= last.tickIndex) {
      return { ok: false, error: "causal_tick_not_monotonic" };
    }
  }

  for (const cid of node.causeIds) {
    const c = resolve(cid);
    if (!c) {
      return { ok: false, error: `causal_unknown_cause:${cid}` };
    }
    if (c.tickIndex >= node.tickIndex) {
      return { ok: false, error: "causal_future_cause" };
    }
    if (
      br &&
      c.branchId === node.branchId &&
      cid !== CAUSAL_GENESIS_NODE_ID &&
      c.tickIndex >= 0 &&
      c.tickIndex < br.forkTick
    ) {
      return { ok: false, error: "causal_same_branch_before_fork" };
    }
  }

  return {
    ok: true,
    graph: {
      ...graph,
      nodes: { ...graph.nodes, [node.id]: node },
      writerHeads: { ...graph.writerHeads, [tailKey]: node.id }
    }
  };
}
