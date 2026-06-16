/**
 * N12 permission gate — PWA may cache app shell always; user topology/memory only after grant.
 */

export const RHIZOH_PWA_PERMISSIONS_SCHEMA_V0 = "rhizoh.pwa_permissions.n12.v0";
export const RHIZOH_PWA_PERMISSIONS_LS_KEY_V0 = "rhizoh.pwa.permissions.n12.v0";

const DEFAULT_PERMISSIONS_V0 = Object.freeze({
  camera: false,
  topology: false,
  memory: false
});

/**
 * @returns {{ camera: boolean, topology: boolean, memory: boolean }}
 */
export function readRhizohPwaPermissionsN12V0() {
  if (typeof window === "undefined") return DEFAULT_PERMISSIONS_V0;
  try {
    const raw = JSON.parse(window.localStorage.getItem(RHIZOH_PWA_PERMISSIONS_LS_KEY_V0) || "{}");
    return Object.freeze({
      camera: raw.camera === true,
      topology: raw.topology === true,
      memory: raw.memory === true
    });
  } catch {
    return DEFAULT_PERMISSIONS_V0;
  }
}

/**
 * @param {{ camera?: boolean, topology?: boolean, memory?: boolean }} patch
 */
export function writeRhizohPwaPermissionsN12V0(patch = {}) {
  const prev = readRhizohPwaPermissionsN12V0();
  const next = Object.freeze({
    camera: patch.camera === true ? true : patch.camera === false ? false : prev.camera,
    topology: patch.topology === true ? true : patch.topology === false ? false : prev.topology,
    memory: patch.memory === true ? true : patch.memory === false ? false : prev.memory
  });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(RHIZOH_PWA_PERMISSIONS_LS_KEY_V0, JSON.stringify(next));
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.pwaPermissionsN12 = Object.freeze({ ...next, schema: RHIZOH_PWA_PERMISSIONS_SCHEMA_V0 });
  }
  return next;
}

/** Camera sync / sensor ingress (N12). */
export function isCameraSyncGrantedN12V0() {
  return readRhizohPwaPermissionsN12V0().camera === true;
}

/** Ghost archive, spatial graph, topology WAL — not cached offline until granted. */
export function canPersistUserTopologyN12V0() {
  return readRhizohPwaPermissionsN12V0().topology === true;
}

/** User memories / engrams — IndexedDB persistence gate. */
export function canPersistUserMemoryN12V0() {
  return readRhizohPwaPermissionsN12V0().memory === true;
}

/** App shell (index, manifest, icons) — always allowed regardless of N12. */
export function canCacheAppShellN12V0() {
  return true;
}

/** @internal vitest */
export function __resetRhizohPwaPermissionsN12ForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RHIZOH_PWA_PERMISSIONS_LS_KEY_V0);
    delete window.__rhizoh?.pwaPermissionsN12;
  }
}
