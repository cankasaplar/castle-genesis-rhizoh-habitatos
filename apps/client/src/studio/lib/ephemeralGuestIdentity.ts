/**
 * Anon / ön-giriş: `identity.ownerId` yokken Green Room presence bind için kalıcı `guest:<uuid>` kabuğu.
 * Firebase oturumu gelince `patchIdentityFromAuth` tüm kernel’i sıfırlar — yerel guest id kalır ama yeni oturum önceliklidir.
 */
import { bootstrapKernelRootIfNeeded } from "./bootstrapKernelRoot";
import { patchIdentity } from "../store/identitySlice";
import { getStudioKernelState } from "../store/internalStore";

const LS_KEY = "castle_ephemeral_owner_v1";

function defaultGuestPermissions(): Record<string, boolean> {
  return {
    "registry.*": true,
    "presence.*": true,
    "physics.*": true,
    "world.*": true
  };
}

export function getOrCreateEphemeralGuestOwnerId(): string {
  if (typeof window === "undefined") {
    return `guest:anon-${Date.now().toString(36)}`;
  }
  try {
    let id = window.localStorage.getItem(LS_KEY);
    if (!id || !String(id).startsWith("guest:")) {
      const uuid =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      id = `guest:${uuid}`;
      window.localStorage.setItem(LS_KEY, id);
    }
    return id;
  } catch {
    return `guest:mem-${Date.now().toString(36)}`;
  }
}

/** `ownerId` yoksa guest kimlik + izinler + hafif kernel tohumu yükler. */
export function ensureEphemeralGuestKernelIdentity(): void {
  const cur = getStudioKernelState().identity?.ownerId;
  if (cur) return;
  const ownerId = getOrCreateEphemeralGuestOwnerId();
  patchIdentity({
    ownerId,
    actor: { id: ownerId, kind: "human" },
    session: null,
    permissions: defaultGuestPermissions(),
    delegates: [],
    sharedOwnerIds: []
  });
  bootstrapKernelRootIfNeeded(ownerId, { environment: "guest" });
}
