import type { User } from "firebase/auth";
import { bootstrapKernelRootIfNeeded } from "../lib/bootstrapKernelRoot";
import { patchIdentity } from "../store/identitySlice";
import { getStudioKernelState, resetStudioKernelInternal } from "../store/internalStore";

function defaultStudioPermissions(): Record<string, boolean> {
  return {
    "registry.*": true,
    "sim.*": true,
    "ops.*": true,
    "physics.*": true,
    "presence.*": true,
    "world.*": true
  };
}

/**
 * Firebase Auth → RSK identity shell + session token (ephemeral).
 * Call from onAuthStateChanged / React effect when `user` changes.
 */
export async function patchIdentityFromAuth(user: User | null): Promise<void> {
  if (!user) {
    resetStudioKernelInternal();
    return;
  }

  const prevOwner = getStudioKernelState().identity.ownerId;
  if (prevOwner && prevOwner !== user.uid) {
    resetStudioKernelInternal();
  }

  const token = await user.getIdToken();
  const result = await user.getIdTokenResult();
  const expiresAt = new Date(result.expirationTime).getTime();
  const issuedAt = Date.now();

  patchIdentity({
    ownerId: user.uid,
    actor: {
      id: user.uid,
      kind: "human"
    },
    session: {
      token,
      issuedAt,
      expiresAt
    },
    permissions: defaultStudioPermissions(),
    delegates: [],
    sharedOwnerIds: []
  });

  bootstrapKernelRootIfNeeded(user.uid, { environment: "default" });
}

/** Refresh ID token into session without rebuilding full identity */
export async function refreshStudioSessionFromUser(user: User): Promise<void> {
  const token = await user.getIdToken();
  const result = await user.getIdTokenResult();
  const cur = getStudioKernelState().identity;
  patchIdentity({
    session: {
      token,
      issuedAt: Date.now(),
      expiresAt: new Date(result.expirationTime).getTime()
    },
    ownerId: cur.ownerId ?? user.uid,
    actor: cur.actor ?? { id: user.uid, kind: "human" }
  });
}
