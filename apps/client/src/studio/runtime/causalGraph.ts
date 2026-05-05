import type { Branch, CausalGraphRegistry, CausalNode, CausalNodePayload } from "../types/rskOntology";

export const CAUSAL_GENESIS_NODE_ID = "cn:kernel:genesis";
export const CAUSAL_MAIN_BRANCH_ID = "branch:main";

export const CAUSAL_DEFAULT_MERGE_POLICY = "deterministic-diff-resolution" as const;

function coercePayload(raw: unknown): CausalNodePayload {
  if (raw && typeof raw === "object" && "delta" in (raw as object) && "input" in (raw as object)) {
    const p = raw as {
      delta: unknown;
      input: unknown;
      output?: unknown;
      affectsEntityIds?: unknown;
    };
    const affectsEntityIds = Array.isArray(p.affectsEntityIds)
      ? (p.affectsEntityIds as unknown[]).map((x) => String(x))
      : undefined;
    return { delta: p.delta, input: p.input, output: p.output, affectsEntityIds };
  }
  return { delta: raw ?? {}, input: {} };
}

/** Normalize persisted / legacy nodes into nihai schema (drops effectIds / targetId). */
export function coerceCausalNode(id: string, raw: unknown): CausalNode | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const pl = coercePayload(o.payload);
  return {
    id: String(o.id ?? id),
    tickIndex: Number(o.tickIndex),
    timestamp: Number(o.timestamp),
    type: (o.type as CausalNode["type"]) ?? "system",
    causeIds: Array.isArray(o.causeIds) ? (o.causeIds as string[]) : [],
    actorId: String(o.actorId ?? "unknown"),
    branchId: String(o.branchId ?? CAUSAL_MAIN_BRANCH_ID),
    payload: pl
  };
}

function coerceBranch(id: string, raw: unknown): Branch | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  return {
    id: String(b.id ?? id),
    parentBranchId: b.parentBranchId !== undefined ? (b.parentBranchId as string | undefined) : undefined,
    forkTick: Number(b.forkTick ?? 0),
    forkCauseNodeId: String(b.forkCauseNodeId ?? CAUSAL_GENESIS_NODE_ID),
    status: (b.status as Branch["status"]) ?? "active",
    lineageDepth: typeof b.lineageDepth === "number" ? b.lineageDepth : 0
  };
}

export function defaultCausalGraphRegistry(): CausalGraphRegistry {
  const genesis: CausalNode = {
    id: CAUSAL_GENESIS_NODE_ID,
    tickIndex: -1,
    timestamp: 0,
    type: "system",
    causeIds: [],
    actorId: "system",
    branchId: CAUSAL_MAIN_BRANCH_ID,
    payload: { delta: { kind: "kernel.genesis" }, input: {} }
  };
  const mainBranch: Branch = {
    id: CAUSAL_MAIN_BRANCH_ID,
    parentBranchId: undefined,
    forkTick: 0,
    forkCauseNodeId: CAUSAL_GENESIS_NODE_ID,
    status: "active",
    lineageDepth: 0
  };
  return {
    nodes: { [CAUSAL_GENESIS_NODE_ID]: genesis },
    branches: { [CAUSAL_MAIN_BRANCH_ID]: mainBranch },
    writerHeads: {}
  };
}

export function ensureBranchRecord(graph: CausalGraphRegistry, branch: Branch): CausalGraphRegistry {
  if (graph.branches[branch.id]) return graph;
  return { ...graph, branches: { ...graph.branches, [branch.id]: branch } };
}

/** Hydration: merge + coerce legacy shapes. */
export function mergePersistedCausalGraph(existing?: CausalGraphRegistry): CausalGraphRegistry {
  const def = defaultCausalGraphRegistry();
  if (!existing) return def;

  const nodes: Record<string, CausalNode> = { ...def.nodes };
  for (const [id, raw] of Object.entries(existing.nodes ?? {})) {
    const n = coerceCausalNode(id, raw);
    if (n) nodes[n.id] = n;
  }

  const branches: Record<string, Branch> = { ...def.branches };
  for (const [id, raw] of Object.entries(existing.branches ?? {})) {
    const b = coerceBranch(id, raw);
    if (b) branches[b.id] = b;
  }

  return {
    nodes,
    branches,
    writerHeads: { ...def.writerHeads, ...(existing.writerHeads ?? {}) }
  };
}
