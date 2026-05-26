/**
 * CORE-ELIGIBLE — Living world instance seed (v0).
 *
 * **Invariant:** SPA route (`pathname`) is NOT used to derive world identity.
 * Seed = browser locale + IANA timezone (+ optional coarse geo cell when applied later).
 *
 * @see locationSeedV0.js
 * @see docs/RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md (projection vs authority)
 */

import { resolveLocationSeedV0 } from "./locationSeedV0.js";

export const WORLD_INSTANCE_SCHEMA_V0 = "castle.rhizoh.world_instance.v0";

const STORAGE_KEY_V0 = "rhizoh.world_instance.v0";

function djb2Base36(input) {
  const s = String(input || "");
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  const n = Math.abs(h >>> 0);
  return n.toString(36).padStart(6, "0").slice(0, 10);
}

/**
 * @returns {{
 *   schema: string,
 *   instanceId: string,
 *   timeZone: string,
 *   locale: string,
 *   seedBasis: string,
 *   routeIndependent: true
 * }}
 */
export function resolveLivingWorldInstanceV0() {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") {
    return Object.freeze({
      schema: WORLD_INSTANCE_SCHEMA_V0,
      instanceId: "wi_ssr",
      timeZone: "UTC",
      locale: "und",
      seedBasis: "ssr_placeholder",
      routeIndependent: true
    });
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_V0);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.schema === WORLD_INSTANCE_SCHEMA_V0 && typeof p.instanceId === "string") {
        return Object.freeze({
          schema: WORLD_INSTANCE_SCHEMA_V0,
          instanceId: p.instanceId,
          timeZone: String(p.timeZone || "UTC"),
          locale: String(p.locale || "und"),
          seedBasis: String(p.seedBasis || "tz_locale"),
          routeIndependent: true
        });
      }
    }
  } catch {
    /* fall through */
  }

  const seed = resolveLocationSeedV0();
  const timeZone = seed.timeZone;
  const locale = seed.locale;
  const basis = `${timeZone}|${locale}`;
  const suffix = djb2Base36(basis);
  const instanceId = `wi_${suffix}`;

  const payload = Object.freeze({
    schema: WORLD_INSTANCE_SCHEMA_V0,
    instanceId,
    timeZone,
    locale,
    seedBasis: "tz_locale",
    routeIndependent: true
  });

  try {
    sessionStorage.setItem(STORAGE_KEY_V0, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }

  return payload;
}

/** Test / hard reset — clears world instance bucket only. */
export function clearWorldInstanceForTestV0() {
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
