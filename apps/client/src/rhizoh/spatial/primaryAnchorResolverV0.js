/**
 * PR: HOME ANCHOR AUTHORITY — `primaryAnchorResolverV0`
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Resolves **identity-relevant** primary geographic anchor from authenticated profile input only.
 * Does **not** read UI, localStorage, or demo config — caller must pass profile-derived `userHomeAnchor`
 * (see `homeAnchorAuthorityV0.js`).
 *
 * Guest sessions: explicit `EPHEMERAL_EXPLORE` — no persistent Castle, no HOME_BASE claim.
 *
 * @see anchorTruthTableV0.js — world calibration id must never become HOME_BASE id.
 */

import { assertIdentityPrimaryNotCalibrationWorldSeedV0 } from "./anchorTruthTableV0.js";

export const PRIMARY_ANCHOR_RESOLVER_SCHEMA_V0 = "primaryAnchorResolver.v0";

/**
 * Secure profile slice (Firestore / backend contract — shape only here).
 * @typedef {{
 *   lat: number,
 *   lon: number,
 *   anchorId?: string,
 *   placeLabel?: string,
 *   verifiedAt?: number,
 *   revision?: number
 * }} UserHomeAnchorV0
 */

function clampLatLon(lat, lon) {
  const la = typeof lat === "number" && Number.isFinite(lat) ? lat : NaN;
  const lo = typeof lon === "number" && Number.isFinite(lon) ? lon : NaN;
  return { lat: la, lon: lo };
}

/**
 * @param {{ authMode: "guest" | "authenticated", userHomeAnchor?: UserHomeAnchorV0 | null }} io
 * @returns {Readonly<
 *   | { kind: "HOME_BASE"; schema: string; anchor: Readonly<UserHomeAnchorV0 & { id: string; provenance: "user_profile" }> }
 *   | { kind: "EPHEMERAL_EXPLORE"; schema: string; reason: string }
 *   | { kind: "NONE"; schema: string; reason: string }
 * >}
 */
export function resolvePrimaryAnchorForIdentityV0(io = {}) {
  const schema = PRIMARY_ANCHOR_RESOLVER_SCHEMA_V0;
  const mode = io.authMode === "authenticated" ? "authenticated" : "guest";

  if (mode === "guest") {
    return Object.freeze({
      kind: /** @type {const} */ ("EPHEMERAL_EXPLORE"),
      schema,
      reason: "guest_world_explore_no_persistent_home_anchor"
    });
  }

  const raw = io.userHomeAnchor;
  if (!raw || typeof raw !== "object") {
    return Object.freeze({ kind: /** @type {const} */ ("NONE"), schema, reason: "missing_user_home_anchor" });
  }
  const { lat, lon } = clampLatLon(raw.lat, raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Object.freeze({ kind: /** @type {const} */ ("NONE"), schema, reason: "invalid_lat_lon_in_profile_home_anchor" });
  }

  const id = typeof raw.anchorId === "string" && raw.anchorId.length > 0 ? raw.anchorId : "user_home_profile";
  const placeLabel = typeof raw.placeLabel === "string" && raw.placeLabel.length > 0 ? raw.placeLabel : "HOME";

  const verifiedAt =
    typeof raw.verifiedAt === "number" && Number.isFinite(raw.verifiedAt) ? raw.verifiedAt : undefined;
  const revision =
    typeof raw.revision === "number" && Number.isFinite(raw.revision) ? Math.floor(raw.revision) : undefined;

  const candidate = {
    kind: /** @type {const} */ ("HOME_BASE"),
    schema,
    anchor: Object.freeze({
      id,
      lat,
      lon,
      anchorId: id,
      placeLabel,
      provenance: /** @type {const} */ ("user_profile"),
      authoritySource: /** @type {const} */ ("user_profile"),
      ...(verifiedAt !== undefined ? { verifiedAt } : {}),
      ...(revision !== undefined ? { revision } : {})
    })
  };

  const guard = assertIdentityPrimaryNotCalibrationWorldSeedV0(candidate);
  if (!guard.ok) {
    return Object.freeze({
      kind: /** @type {const} */ ("NONE"),
      schema,
      reason: String(guard.code ?? "identity_calibration_alias_rejected")
    });
  }

  return Object.freeze(candidate);
}
