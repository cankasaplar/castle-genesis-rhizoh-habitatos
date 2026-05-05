/**
 * Validated entity move → causal append → projection cache refresh.
 * Movement is event emission (tool node), not registry mutation.
 */

import { buildCollisionResolutionCausalNode, buildEntityPhysicalMoveCausalNode } from "../runtime/entityCausalFactory";
import {
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry,
  ensureBranchRecord
} from "../runtime/causalGraph.js";
import { appendCausalNode } from "../runtime/graphReducer";
import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
import { KernelGuardRun } from "../runtime/kernelGuard";
import { ENTITY_CACHE_KEY, projectEntity } from "../runtime/projectionReducer";
import { validateMoveIntent } from "../runtime/physicsValidator";
import type { CollisionResolutionType, EntityMoveIntent, EntityPos3 } from "../types/rskOntology";
import { defaultCausalEconomy } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export type ApplyEntityMoveIntentResult =
  | {
      ok: true;
      value:
        | { causalNodeId: string; outcome: "moved" }
        | {
            causalNodeId: string;
            outcome: "collision_stop";
            collisionTargetId: string;
            resolutionType: CollisionResolutionType;
            impactVector: EntityPos3;
          };
    }
  | { ok: false; error: string; rejectionTrace?: string[] };

export function applyEntityMoveIntent(payload: { entityUid: string; dpos: EntityPos3 }): ApplyEntityMoveIntentResult {
  const s0 = getStudioKernelState();
  const guard = KernelGuardRun({
    identity: s0.identity,
    action: "physics.entity.move.apply",
    payload
  });
  if (!guard.allowed) {
    return { ok: false, error: guard.error ?? "kernel_guard_denied", rejectionTrace: [`kernel:${guard.stage ?? "deny"}`] };
  }

  const p = guard.sanitizedPayload as { entityUid: string; dpos: EntityPos3 };
  const actorId = s0.identity.actor?.id ?? s0.identity.ownerId ?? "unknown";
  const intent: EntityMoveIntent = {
    kind: "entity.move",
    actorId,
    entityUid: p.entityUid,
    dpos: p.dpos
  };

  const s = getStudioKernelState();
  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  const val = validateMoveIntent(s, intent, branchId);

  if (val.collisionResolution) {
    const cr = val.collisionResolution;
    let causalGraph = s.registry.causalGraph ?? defaultCausalGraphRegistry();
    if (branchId !== CAUSAL_MAIN_BRANCH_ID && !causalGraph.branches[branchId]) {
      const trunkDepth = causalGraph.branches[CAUSAL_MAIN_BRANCH_ID]?.lineageDepth ?? 0;
      causalGraph = ensureBranchRecord(causalGraph, {
        id: branchId,
        parentBranchId: CAUSAL_MAIN_BRANCH_ID,
        forkTick: s.worldPhysics.globalTick,
        forkCauseNodeId: CAUSAL_GENESIS_NODE_ID,
        status: "active",
        lineageDepth: trunkDepth + 1
      });
    }

    const writerSubject = `entity:${p.entityUid}`;
    const tailKey = `${branchId}::${writerSubject}`;
    const lastTipId = causalGraph.writerHeads[tailKey];
    const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
    const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
    const wall = Date.now();

    const econBase = s.causalEconomy ?? defaultCausalEconomy();
    const colCharge = estimateEconomyForNodeType("tool.collision");
    const econCol = assertEconomyAllowsAppend(econBase, colCharge);
    if (!econCol.ok) {
      return { ok: false, error: econCol.error, rejectionTrace: [`economy:${econCol.error}`] };
    }

    const collisionNode = withEconomyPayload(
      buildCollisionResolutionCausalNode({
        initiatorEntityUid: p.entityUid,
        targetEntityUid: cr.targetEntityUid,
        branchId,
        tickIndex,
        timestamp: wall,
        actorId,
        causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID],
        impactVector: cr.impactVector,
        resolutionType: cr.resolutionType
      })
    );

    const appended = appendCausalNode(causalGraph, collisionNode, writerSubject);
    if (!appended.ok) {
      return {
        ok: false,
        error: appended.error,
        rejectionTrace: [`append:${appended.error}`]
      };
    }
    causalGraph = appended.graph;

    const soulA = s.registry.entity[p.entityUid]?.soulUid;
    const soulB = s.registry.entity[cr.targetEntityUid]?.soulUid;
    const projA = projectEntity(causalGraph, p.entityUid, branchId, { soulUid: soulA });
    const projB = projectEntity(causalGraph, cr.targetEntityUid, branchId, { soulUid: soulB });
    const cacheKeyA = ENTITY_CACHE_KEY(branchId, p.entityUid);
    const cacheKeyB = ENTITY_CACHE_KEY(branchId, cr.targetEntityUid);

    setStudioKernelState({
      ...s,
      worldPhysics: { ...s.worldPhysics, globalTick: s.worldPhysics.globalTick + 1 },
      registry: { ...s.registry, causalGraph },
      causalEconomy: accumulateEconomy(econBase, colCharge),
      entityProjectionCache: {
        ...(s.entityProjectionCache ?? {}),
        [cacheKeyA]: projA,
        [cacheKeyB]: projB
      }
    });

    return {
      ok: true,
      value: {
        causalNodeId: collisionNode.id,
        outcome: "collision_stop",
        collisionTargetId: cr.targetEntityUid,
        resolutionType: cr.resolutionType,
        impactVector: cr.impactVector
      }
    };
  }

  if (!val.ok || !val.predictedProjection) {
    return { ok: false, error: "physics_rejected", rejectionTrace: val.rejectionTrace };
  }

  const nextPos = val.predictedProjection.state.physical.pos;
  let causalGraph = s.registry.causalGraph ?? defaultCausalGraphRegistry();
  if (branchId !== CAUSAL_MAIN_BRANCH_ID && !causalGraph.branches[branchId]) {
    const trunkDepth = causalGraph.branches[CAUSAL_MAIN_BRANCH_ID]?.lineageDepth ?? 0;
    causalGraph = ensureBranchRecord(causalGraph, {
      id: branchId,
      parentBranchId: CAUSAL_MAIN_BRANCH_ID,
      forkTick: s.worldPhysics.globalTick,
      forkCauseNodeId: CAUSAL_GENESIS_NODE_ID,
      status: "active",
      lineageDepth: trunkDepth + 1
    });
  }

  const writerSubject = `entity:${p.entityUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();

  const econMoveBase = s.causalEconomy ?? defaultCausalEconomy();
  const moveCharge = estimateEconomyForNodeType("tool");
  const econMove = assertEconomyAllowsAppend(econMoveBase, moveCharge);
  if (!econMove.ok) {
    return { ok: false, error: econMove.error, rejectionTrace: [`economy:${econMove.error}`] };
  }

  const causalNode = withEconomyPayload(
    buildEntityPhysicalMoveCausalNode({
      entityUid: p.entityUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID],
      nextPos
    })
  );

  const appended = appendCausalNode(causalGraph, causalNode, writerSubject);
  if (!appended.ok) {
    return {
      ok: false,
      error: appended.error,
      rejectionTrace: [`append:${appended.error}`]
    };
  }
  causalGraph = appended.graph;

  const soulUid = s.registry.entity[p.entityUid]?.soulUid;
  const proj = projectEntity(causalGraph, p.entityUid, branchId, { soulUid });
  const cacheKey = ENTITY_CACHE_KEY(branchId, p.entityUid);

  setStudioKernelState({
    ...s,
    worldPhysics: { ...s.worldPhysics, globalTick: s.worldPhysics.globalTick + 1 },
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econMoveBase, moveCharge),
    entityProjectionCache: {
      ...(s.entityProjectionCache ?? {}),
      [cacheKey]: proj
    }
  });

  return { ok: true, value: { causalNodeId: causalNode.id, outcome: "moved" } };
}
