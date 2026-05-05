import type {
  ActorState,
  AvatarIdentity,
  CompanionIdentity,
  GhostPetIdentity,
  IdentityCausalEventV0,
  IdentityGraphState,
  IdentityState,
  SessionState
} from "../types/rskOntology";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";
import { defaultCausalEconomy, defaultIdentityGraph } from "./initialState";
import { buildIdentityCausalEventV0, buildIdentityCausalNode } from "../runtime/identityCausalFactory";
import { appendCausalNode } from "../runtime/graphReducer";
import { CAUSAL_GENESIS_NODE_ID, CAUSAL_MAIN_BRANCH_ID } from "../runtime/causalGraph";
import { accumulateEconomy, estimateEconomyForNodeType } from "../runtime/causalEconomy";
import { routeIdentityInfluence } from "../runtime/identityInfluenceRouter";

function mergeSession(
  cur: SessionState | null | undefined,
  patch: SessionState | null | undefined
): SessionState | null | undefined {
  if (patch === undefined) return cur;
  if (patch === null) return undefined;
  return { ...(cur || {}), ...patch } as SessionState;
}

function mergeActor(cur: ActorState | null, patch: ActorState | null | undefined): ActorState | null {
  if (patch === undefined) return cur;
  if (patch === null) return null;
  return { ...(cur || { id: "", kind: "human" }), ...patch };
}

/**
 * Deep-merge identity fields (actor, session, permissions map).
 */
export function patchIdentity(patch: Partial<IdentityState>): void {
  const s = getStudioKernelState();
  const cur = s.identity;
  const {
    actor: patchActor,
    session: patchSession,
    identityGraph: patchIdentityGraph,
    permissions: patchPermissions,
    delegates: patchDelegates,
    sharedOwnerIds: patchShared,
    ...rest
  } = patch;

  const nextPermissions =
    patchPermissions !== undefined ? { ...cur.permissions, ...patchPermissions } : cur.permissions;

  const next: IdentityState = {
    ...cur,
    ...rest,
    actor: patchActor !== undefined ? mergeActor(cur.actor, patchActor) : cur.actor,
    session: patchSession !== undefined ? mergeSession(cur.session ?? undefined, patchSession) : cur.session,
    identityGraph:
      patchIdentityGraph !== undefined
        ? {
            ...(cur.identityGraph || {}),
            ...patchIdentityGraph,
            root: {
              ...(cur.identityGraph?.root || {}),
              ...(patchIdentityGraph.root || {}),
              profileMeta: {
                ...(cur.identityGraph?.root?.profileMeta || {}),
                ...(patchIdentityGraph.root?.profileMeta || {}),
                updatedAt: Date.now()
              }
            }
          }
        : cur.identityGraph,
    permissions: nextPermissions,
    delegates: patchDelegates !== undefined ? [...patchDelegates] : cur.delegates,
    sharedOwnerIds: patchShared !== undefined ? [...patchShared] : cur.sharedOwnerIds
  };
  setStudioKernelState({ ...s, identity: next });
}

function ensureIdentityGraph(cur: IdentityState): IdentityGraphState {
  return cur.identityGraph || defaultIdentityGraph(String(cur.ownerId || "guest"));
}

let identityMeshPublishEnabled = false;
let identityMeshPublisher: ((event: IdentityCausalEventV0) => void) | null = null;

export function setIdentityMeshPublishEnabled(enabled: boolean): void {
  identityMeshPublishEnabled = !!enabled;
}

export function registerIdentityMeshPublisher(publisher: ((event: IdentityCausalEventV0) => void) | null): void {
  identityMeshPublisher = publisher;
}

function commitIdentityCausal(input: {
  eventType: IdentityCausalEventV0["type"];
  targetUid: string;
  patch: Record<string, unknown>;
  graphPatch: Partial<IdentityGraphState>;
  injectMemoryFocus?: boolean;
}): void {
  const s = getStudioKernelState();
  const g = ensureIdentityGraph(s.identity);
  const actorUid = String(s.identity.ownerId || "guest");
  const branchId = s.runtime.activeBranchId ?? CAUSAL_MAIN_BRANCH_ID;
  const writer = `identity:${actorUid}`;
  const prevHead = s.registry.causalGraph.writerHeads[writer];
  const event = buildIdentityCausalEventV0({
    type: input.eventType,
    actorUid,
    targetUid: input.targetUid,
    patch: input.patch,
    causeNodeId: prevHead,
    timestamp: Date.now()
  });
  const node = buildIdentityCausalNode({
    event,
    branchId,
    tickIndex: s.worldPhysics.globalTick,
    actorId: actorUid,
    causeIds: prevHead ? [prevHead] : [CAUSAL_GENESIS_NODE_ID]
  });
  const appended = appendCausalNode(s.registry.causalGraph, node, writer);
  if (!appended.ok) return;
  const charge = estimateEconomyForNodeType(node.type);
  const econ = accumulateEconomy(s.causalEconomy ?? defaultCausalEconomy(), charge);
  const nextIdentityGraph: IdentityGraphState = {
    ...g,
    ...input.graphPatch,
    root: {
      ...g.root,
      ...(input.graphPatch.root || {}),
      profileMeta: {
        ...g.root.profileMeta,
        ...(input.graphPatch.root?.profileMeta || {}),
        updatedAt: Date.now()
      }
    }
  };
  const baseNext = {
    ...s,
    identity: {
      ...s.identity,
      identityGraph: nextIdentityGraph
    },
    registry: {
      ...s.registry,
      causalGraph: appended.graph
    },
    causalEconomy: econ,
    agentRuntime: input.injectMemoryFocus ? { ...s.agentRuntime, lastAttentionFocus: "memory" as const } : s.agentRuntime
  };
  setStudioKernelState(routeIdentityInfluence(baseNext, event));
  if (identityMeshPublishEnabled && identityMeshPublisher) {
    try {
      identityMeshPublisher(event);
    } catch {
      /* noop */
    }
  }
}

export function updateAvatarIdentity(patch: Partial<AvatarIdentity>): void {
  const s = getStudioKernelState();
  const g = ensureIdentityGraph(s.identity);
  const nextAvatar = { ...g.avatar, ...patch };
  commitIdentityCausal({
    eventType: "identity.avatar.update",
    targetUid: g.root.avatarUid,
    patch,
    graphPatch: { avatar: nextAvatar }
  });
}

export function updateCompanionIdentity(patch: Partial<CompanionIdentity>): void {
  const s = getStudioKernelState();
  const g = ensureIdentityGraph(s.identity);
  const nextCompanion = { ...g.companion, ...patch };
  commitIdentityCausal({
    eventType: "identity.companion.update",
    targetUid: g.root.companionUid,
    patch,
    graphPatch: { companion: nextCompanion }
  });
}

export function updateGhostPetIdentity(patch: Partial<GhostPetIdentity>): void {
  const s = getStudioKernelState();
  const g = ensureIdentityGraph(s.identity);
  const nextGhostPet = { ...g.ghostPet, ...patch };
  commitIdentityCausal({
    eventType: "identity.ghostpet.update",
    targetUid: g.root.ghostPetUid,
    patch,
    graphPatch: { ghostPet: nextGhostPet }
  });
}

export function appendJournalClip(clip: string): void {
  const c = String(clip || "").trim();
  if (!c) return;
  const s = getStudioKernelState();
  const g = ensureIdentityGraph(s.identity);
  const nextJournal = { ...g.journal, clips: [...g.journal.clips, c] };
  commitIdentityCausal({
    eventType: "identity.journal.append",
    targetUid: g.root.journalUid,
    patch: { clip: c },
    graphPatch: { journal: nextJournal },
    injectMemoryFocus: true
  });
}

export function grantVaultUnlock(unlockId: string): void {
  const id = String(unlockId || "").trim();
  if (!id) return;
  const s = getStudioKernelState();
  const g = ensureIdentityGraph(s.identity);
  if (g.vault.permanentUnlocks.includes(id)) return;
  const nextVault = {
    ...g.vault,
    permanentUnlocks: [...g.vault.permanentUnlocks, id]
  };
  commitIdentityCausal({
    eventType: "identity.vault.unlock",
    targetUid: g.root.vaultUid,
    patch: { unlockId: id },
    graphPatch: { vault: nextVault }
  });
}

export function updateSignatureIdentity(patch: Partial<IdentityGraphState["signature"]>): void {
  const s = getStudioKernelState();
  const g = ensureIdentityGraph(s.identity);
  const nextSig = { ...g.signature, ...patch };
  commitIdentityCausal({
    eventType: "identity.signature.update",
    targetUid: g.root.signatureUid,
    patch,
    graphPatch: { signature: nextSig }
  });
}
