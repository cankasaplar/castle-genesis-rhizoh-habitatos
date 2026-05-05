/**
 * Phase P1 — Presence / avatar: bind soul+entity to shell, emote causal, move delegates to entity physics.
 */

import {
  accumulateEconomy,
  assertEconomyAllowsAppend,
  estimateEconomyForNodeType,
  withEconomyPayload
} from "../runtime/causalEconomy.js";
import {
  CAUSAL_GENESIS_NODE_ID,
  CAUSAL_MAIN_BRANCH_ID,
  defaultCausalGraphRegistry,
  ensureBranchRecord
} from "../runtime/causalGraph.js";
import { appendCausalNode } from "../runtime/graphReducer";
import { KernelGuardRun } from "../runtime/kernelGuard";
import { buildAvatarEmoteCausalNode, buildPresenceJoinCausalNode } from "../runtime/presenceCausalFactory";
import type { AvatarEntity, EntityPos3, StudioResult } from "../types/rskOntology";
import { applyEntityMoveIntent } from "./entityMoveSlice";
import type { ApplyEntityMoveIntentResult } from "./entityMoveSlice";
import { defaultCausalEconomy, defaultPresence } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export function bindAvatarToEntity(input: {
  avatarUid: string;
  linkedEntityUid: string;
  soulUid?: string;
}): StudioResult<AvatarEntity> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.avatar.bind",
    payload: input
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };

  const p = res.sanitizedPayload as { avatarUid: string; linkedEntityUid: string; soulUid?: string };
  const s = getStudioKernelState();
  if (!s.registry.entity[p.linkedEntityUid]) {
    return { ok: false, error: "linked_entity_not_found" };
  }

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
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

  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const joinCharge = estimateEconomyForNodeType("tool");
  const gate = assertEconomyAllowsAppend(econBase, joinCharge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const writerSubject = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";

  const joinNode = withEconomyPayload(
    buildPresenceJoinCausalNode({
      avatarUid: p.avatarUid,
      linkedEntityUid: p.linkedEntityUid,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const appended = appendCausalNode(causalGraph, joinNode, writerSubject);
  if (!appended.ok) return { ok: false, error: appended.error };
  causalGraph = appended.graph;

  const ownerId = s.identity.ownerId ?? undefined;
  const avatar: AvatarEntity = {
    uid: p.avatarUid,
    ownerId,
    soulUid: p.soulUid,
    linkedEntityUid: p.linkedEntityUid
  };

  const pres = s.presence ?? defaultPresence();
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, joinCharge),
    presence: {
      ...pres,
      avatars: { ...pres.avatars, [p.avatarUid]: avatar }
    }
  });

  return { ok: true, value: avatar };
}

export function emitAvatarEmote(payload: { avatarUid: string; emoteId: string }): StudioResult<{ causalNodeId: string }> {
  const s0 = getStudioKernelState();
  const res = KernelGuardRun({
    identity: s0.identity,
    action: "presence.avatar.emote",
    payload
  });
  if (!res.allowed) return { ok: false, error: res.error ?? "kernel_guard_denied" };

  const p = res.sanitizedPayload as { avatarUid: string; emoteId: string };
  const s = getStudioKernelState();
  const av = (s.presence ?? defaultPresence()).avatars[p.avatarUid];
  if (!av) return { ok: false, error: "avatar_not_bound" };

  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
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

  const econBase = s.causalEconomy ?? defaultCausalEconomy();
  const emoteCharge = estimateEconomyForNodeType("tool");
  const gate = assertEconomyAllowsAppend(econBase, emoteCharge);
  if (!gate.ok) return { ok: false, error: gate.error };

  const writerSubject = `presence:${p.avatarUid}`;
  const tailKey = `${branchId}::${writerSubject}`;
  const lastTipId = causalGraph.writerHeads[tailKey];
  const lastTip = lastTipId ? causalGraph.nodes[lastTipId] : undefined;
  const tickIndex = Math.max(s.worldPhysics.globalTick, (lastTip?.tickIndex ?? -1) + 1);
  const wall = Date.now();
  const actorId = s.identity.actor?.id ?? s.identity.ownerId ?? "unknown";

  const node = withEconomyPayload(
    buildAvatarEmoteCausalNode({
      avatarUid: p.avatarUid,
      linkedEntityUid: av.linkedEntityUid,
      emoteId: p.emoteId,
      branchId,
      tickIndex,
      timestamp: wall,
      actorId,
      causeIds: lastTipId ? [lastTipId] : [CAUSAL_GENESIS_NODE_ID]
    })
  );

  const appended = appendCausalNode(causalGraph, node, writerSubject);
  if (!appended.ok) return { ok: false, error: appended.error };
  causalGraph = appended.graph;

  const nextAvatar: AvatarEntity = { ...av, lastEmoteId: p.emoteId, animationState: `emote:${p.emoteId}` };

  const pres2 = s.presence ?? defaultPresence();
  setStudioKernelState({
    ...s,
    registry: { ...s.registry, causalGraph },
    causalEconomy: accumulateEconomy(econBase, emoteCharge),
    presence: {
      ...pres2,
      avatars: { ...pres2.avatars, [p.avatarUid]: nextAvatar }
    }
  });

  return { ok: true, value: { causalNodeId: node.id } };
}

/** Delegates to entity physics — avatar must be bound to `linkedEntityUid`. */
export function applyAvatarMoveIntent(payload: { avatarUid: string; dpos: EntityPos3 }): ApplyEntityMoveIntentResult {
  const s = getStudioKernelState();
  const avatars = (s.presence ?? defaultPresence()).avatars;
  const av = avatars[payload.avatarUid];
  if (!av?.linkedEntityUid) {
    return { ok: false, error: "avatar_no_entity_link", rejectionTrace: ["presence:unbound_avatar"] };
  }
  return applyEntityMoveIntent({ entityUid: av.linkedEntityUid, dpos: payload.dpos });
}
