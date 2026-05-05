/**
 * Projection kernel — branch-scoped, deterministic reconstruction from causal history.
 *
 * Invariants:
 * - Reducer reads ONLY `CausalGraphRegistry` (never `entityProjectionCache`).
 * - **Causal closure:** every folded node must have ancestry to `CAUSAL_GENESIS_NODE_ID`.
 * - **Physics patches:** deterministic JSON only — no RNG, wall-clock, or ambient IO inside patches.
 * - LAW 5: projection cannot append causal nodes (no backward causation).
 */

import type {
  CausalGraphRegistry,
  CausalNode,
  CollisionResolutionType,
  EntityDerivedPhysics,
  EntityPos3,
  EntityProjection
} from "../types/rskOntology.js";
import { CAUSAL_GENESIS_NODE_ID } from "./causalGraph";

export const ENTITY_CACHE_KEY = (branchId: string, entityUid: string) => `${branchId}::${entityUid}`;

/** Kernel rule id — causal closure to genesis (documentation / tests). */
export const KERNEL_PROJECTION_RULE_CAUSAL_CLOSURE = "projection.causal_closure_to_genesis" as const;

export interface ProjectEntityOptions {
  /** Upper bound tickIndex inclusive (Entity(t, branch) slice). */
  tickLimit?: number;
  soulUid?: string;
}

export function defaultEntityPhysics(): EntityDerivedPhysics {
  return { pos: { x: 0, y: 0, z: 0 }, rot: 0, vel: 0 };
}

/**
 * Pure fold step: (prev, patch) → next.
 * Callers MUST supply deterministic patches (no randomness, Date.now, or external reads in patch values).
 */
export function applyPhysicsPatch(prev: EntityDerivedPhysics, patch?: Partial<EntityDerivedPhysics>): EntityDerivedPhysics {
  const pos: EntityPos3 = {
    x: patch?.pos?.x ?? prev.pos.x,
    y: patch?.pos?.y ?? prev.pos.y,
    z: patch?.pos?.z ?? prev.pos.z
  };
  return {
    pos,
    rot: patch?.rot ?? prev.rot,
    vel: patch?.vel ?? prev.vel
  };
}

type ParsedEntityDelta =
  | {
      kind: "entity.genesis";
      entityUid: string;
      physical?: Partial<EntityDerivedPhysics>;
      integrity?: number;
      metadata?: Record<string, unknown>;
    }
  | { kind: "entity.physical"; entityUid: string; patch?: Partial<EntityDerivedPhysics> }
  | { kind: "entity.integrity"; entityUid: string; integrity: number };

type ParsedCollisionDelta = {
  kind: "collision.resolution";
  initiatorEntityUid: string;
  targetEntityUid: string;
  resolutionType: CollisionResolutionType;
  impactVector: EntityPos3;
};

function parseCollisionDelta(delta: unknown): ParsedCollisionDelta | null {
  if (!delta || typeof delta !== "object") return null;
  const o = delta as Record<string, unknown>;
  if (o.kind !== "collision.resolution") return null;
  const initiatorEntityUid = typeof o.initiatorEntityUid === "string" ? o.initiatorEntityUid : "";
  const targetEntityUid = typeof o.targetEntityUid === "string" ? o.targetEntityUid : "";
  if (!initiatorEntityUid || !targetEntityUid) return null;
  const resolutionType = o.resolutionType as CollisionResolutionType;
  if (resolutionType !== "STOP" && resolutionType !== "SLIDE" && resolutionType !== "BOUNCE") return null;
  const iv = o.impactVector as Record<string, unknown> | undefined;
  if (!iv || typeof iv !== "object") return null;
  const x = Number(iv.x);
  const y = Number(iv.y);
  const z = Number(iv.z);
  if (![x, y, z].every((n) => Number.isFinite(n))) return null;
  return {
    kind: "collision.resolution",
    initiatorEntityUid,
    targetEntityUid,
    resolutionType,
    impactVector: { x, y, z }
  };
}

function parseEntityDelta(delta: unknown): ParsedEntityDelta | null {
  if (!delta || typeof delta !== "object") return null;
  const o = delta as Record<string, unknown>;
  const kind = typeof o.kind === "string" ? o.kind : "";
  const entityUid = typeof o.entityUid === "string" ? o.entityUid : "";
  if (!entityUid) return null;
  if (kind === "entity.genesis") {
    return {
      kind: "entity.genesis",
      entityUid,
      physical: o.physical as Partial<EntityDerivedPhysics> | undefined,
      integrity: typeof o.integrity === "number" ? o.integrity : undefined,
      metadata: o.metadata as Record<string, unknown> | undefined
    };
  }
  if (kind === "entity.physical") {
    return { kind: "entity.physical", entityUid, patch: o.patch as Partial<EntityDerivedPhysics> | undefined };
  }
  if (kind === "entity.integrity" && typeof o.integrity === "number") {
    return { kind: "entity.integrity", entityUid, integrity: o.integrity };
  }
  return null;
}

function nodeTouchesEntity(n: CausalNode, entityUid: string): boolean {
  if (n.payload.affectsEntityIds?.includes(entityUid)) return true;
  const c = parseCollisionDelta(n.payload.delta);
  if (c && (c.initiatorEntityUid === entityUid || c.targetEntityUid === entityUid)) return true;
  const d = parseEntityDelta(n.payload.delta);
  return d?.entityUid === entityUid;
}

/** Per-node cause sanity (orphan / future-cause guard inside projection pass). */
export function validateCausalStep(n: CausalNode, all: Record<string, CausalNode>): boolean {
  for (const cid of n.causeIds) {
    const c = all[cid];
    if (!c) return false;
    if (c.tickIndex >= n.tickIndex) return false;
  }
  return true;
}

export function validateCausalChain(nodes: CausalNode[], all: Record<string, CausalNode>): boolean {
  return nodes.every((n) => validateCausalStep(n, all));
}

/**
 * Every cause id must transitively reach kernel genesis (no orphan / floating subgraph).
 */
export function validateCausalClosureToGenesis(n: CausalNode, all: Record<string, CausalNode>): boolean {
  const visiting = new Set<string>();
  for (const cid of n.causeIds) {
    if (!walkCausesReachGenesis(cid, all, visiting)) return false;
  }
  return true;
}

function walkCausesReachGenesis(id: string, all: Record<string, CausalNode>, visiting: Set<string>): boolean {
  if (id === CAUSAL_GENESIS_NODE_ID) return true;
  if (visiting.has(id)) return false;
  const node = all[id];
  if (!node) return false;
  visiting.add(id);
  if (node.causeIds.length === 0) {
    visiting.delete(id);
    return false;
  }
  for (const c of node.causeIds) {
    if (!walkCausesReachGenesis(c, all, visiting)) {
      visiting.delete(id);
      return false;
    }
  }
  visiting.delete(id);
  return true;
}

/**
 * Branch-scoped fold: only nodes with `branchId` and tick ≤ tickLimit (if set).
 * Cache must never be passed in — graph is sole source of truth.
 */
export function projectEntity(
  graph: CausalGraphRegistry,
  entityUid: string,
  branchId: string,
  opts?: ProjectEntityOptions
): EntityProjection {
  const tickLimit = opts?.tickLimit;
  const lineageDepth = graph.branches[branchId]?.lineageDepth ?? 0;

  let physics = defaultEntityPhysics();
  let integrity = 1;
  let metadata: Record<string, unknown> = {};
  let genesisNodeId = "";
  let lastProjectionNodeId: string | undefined;
  let lastTick = -1;

  const relevant = Object.values(graph.nodes).filter((n) => {
    if (n.branchId !== branchId) return false;
    if (tickLimit !== undefined && n.tickIndex > tickLimit) return false;
    return nodeTouchesEntity(n, entityUid);
  });
  relevant.sort((a, b) => a.tickIndex - b.tickIndex || a.timestamp - b.timestamp);
  const chain = relevant.filter(
    (n) => validateCausalStep(n, graph.nodes) && validateCausalClosureToGenesis(n, graph.nodes)
  );

  for (const n of chain) {
    lastProjectionNodeId = n.id;
    lastTick = n.tickIndex;
    const col = parseCollisionDelta(n.payload.delta);
    if (col && (col.initiatorEntityUid === entityUid || col.targetEntityUid === entityUid)) {
      const role = entityUid === col.initiatorEntityUid ? "initiator" : "target";
      metadata = {
        ...metadata,
        lastCollision: {
          role,
          counterpart: role === "initiator" ? col.targetEntityUid : col.initiatorEntityUid,
          resolutionType: col.resolutionType,
          impactVector: { ...col.impactVector },
          causalNodeId: n.id
        }
      };
      continue;
    }

    const d = parseEntityDelta(n.payload.delta);
    if (!d || d.entityUid !== entityUid) continue;
    if (d.kind === "entity.genesis") {
      if (!genesisNodeId) genesisNodeId = n.id;
      physics = applyPhysicsPatch(defaultEntityPhysics(), d.physical);
      if (typeof d.integrity === "number") integrity = Math.max(0, Math.min(1, d.integrity));
      if (d.metadata) metadata = { ...metadata, ...d.metadata };
    } else if (d.kind === "entity.physical") {
      physics = applyPhysicsPatch(physics, d.patch);
    } else if (d.kind === "entity.integrity") {
      integrity = Math.max(0, Math.min(1, d.integrity));
    }
  }

  return {
    uid: entityUid,
    genesisNodeId: genesisNodeId || "",
    soulUid: opts?.soulUid,
    anchors: {
      lastAppliedBranchId: branchId,
      lastAppliedTickIndex: lastTick,
      lineageDepth
    },
    state: { physical: physics, integrity, metadata },
    lastProjectionNodeId
  };
}

/** @deprecated prefer {@link projectEntity} */
export function projectEntityFromCausalGraph(
  graph: CausalGraphRegistry,
  entityUid: string,
  branchId: string
): EntityProjection {
  return projectEntity(graph, entityUid, branchId);
}
