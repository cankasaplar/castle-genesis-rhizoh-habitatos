/**
 * PR-2.5 — Resolve observation **identity lane** without importing React or UI stores.
 *
 * Priority: `guest` (demo path, **DEV only**) → `replay` (explicit session flag) → `system` (explicit session flag) → `owner`.
 *
 * Replay seed (optional): `sessionStorage` key `castle.replay_seed.v1` (UTF-8 string), when replay lane active.
 *
 * @see observationEnvelopeV0.js
 */

/** @typedef {import("./observationEnvelopeV0.js").ObservationIdentityLaneV0} ObservationIdentityLaneV0 */

const SS_REPLAY_LANE = "castle.observation.replay_lane.v1";
const SS_SYSTEM_LANE = "castle.observation.system_lane.v1";
const SS_REPLAY_SEED = "castle.replay_seed.v1";

/**
 * @returns {ObservationIdentityLaneV0}
 */
export function resolveObservationIdentityLaneV0() {
  try {
    const p = typeof window !== "undefined" && window.location?.pathname ? String(window.location.pathname) : "";
    const dev =
      typeof import.meta !== "undefined" && import.meta.env && Boolean(import.meta.env.DEV);
    if (dev && (p === "/demo" || p.startsWith("/demo/"))) return "guest";
  } catch {
    /* noop */
  }
  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SS_REPLAY_LANE) === "1") {
      return "replay";
    }
  } catch {
    /* noop */
  }
  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(SS_SYSTEM_LANE) === "1") {
      return "system";
    }
  } catch {
    /* noop */
  }
  return "owner";
}

/**
 * @returns {string | undefined}
 */
export function readObservationReplaySeedV0() {
  try {
    if (typeof sessionStorage === "undefined") return undefined;
    const s = sessionStorage.getItem(SS_REPLAY_SEED);
    const t = typeof s === "string" ? s.trim() : "";
    return t.length ? t : undefined;
  } catch {
    return undefined;
  }
}
