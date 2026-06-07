/**
 * World drawer domain — SPACE · SOCIAL · MODES at the same drawer level.
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */

export const RHIZOH_WORLD_DRAWER_DOMAIN_V0 = Object.freeze({
  SPACE: "space",
  SOCIAL: "social",
  MODES: "modes"
});

export const RHIZOH_WORLD_DRAWER_DOMAIN_EVENT_V0 = "rhizoh:world-drawer-domain-v0";

const STORAGE_KEY_V0 = "rhizoh.world.drawer.domain.v0";

/** @type {"space" | "social" | "modes"} */
let cachedDomainV0 = RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE;

/**
 * @param {unknown} raw
 * @returns {"space" | "social" | "modes"}
 */
export function normalizeRhizohWorldDrawerDomainV0(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (s === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL) return RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL;
  if (s === RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES) return RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES;
  return RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE;
}

/**
 * @returns {"space" | "social" | "modes"}
 */
export function readRhizohWorldDrawerDomainV0() {
  if (typeof localStorage === "undefined") return cachedDomainV0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V0);
    if (!raw) return cachedDomainV0;
    cachedDomainV0 = normalizeRhizohWorldDrawerDomainV0(raw);
    return cachedDomainV0;
  } catch {
    return cachedDomainV0;
  }
}

/**
 * @param {"space" | "social" | "modes"} domain
 */
export function writeRhizohWorldDrawerDomainV0(domain) {
  const next = normalizeRhizohWorldDrawerDomainV0(domain);
  cachedDomainV0 = next;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_V0, next);
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    window.__RHIZOH_WORLD_DRAWER__ = Object.freeze({
      schema: "castle.rhizoh.world_drawer.v0",
      domain: next,
      atMs: Date.now()
    });
    window.dispatchEvent(
      new CustomEvent(RHIZOH_WORLD_DRAWER_DOMAIN_EVENT_V0, {
        detail: Object.freeze({ domain: next })
      })
    );
  }
  return next;
}

/** @param {() => void} onChange */
export function subscribeRhizohWorldDrawerDomainV0(onChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onChange();
  window.addEventListener(RHIZOH_WORLD_DRAWER_DOMAIN_EVENT_V0, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY_V0 || e.key === null) handler();
  });
  return () => window.removeEventListener(RHIZOH_WORLD_DRAWER_DOMAIN_EVENT_V0, handler);
}

/** @internal vitest */
export function __resetRhizohWorldDrawerDomainForTestV0() {
  cachedDomainV0 = RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
