import type { ActorState, IdentityState, SessionState } from "../types/rskOntology";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

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
    permissions: nextPermissions,
    delegates: patchDelegates !== undefined ? [...patchDelegates] : cur.delegates,
    sharedOwnerIds: patchShared !== undefined ? [...patchShared] : cur.sharedOwnerIds
  };
  setStudioKernelState({ ...s, identity: next });
}
