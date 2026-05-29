/**
 * Ontological authority profile — local / staging / production policy separation.
 *
 * Not just API endpoints: quarantine thresholds, seal inflation sensitivity, unsigned WAL tolerance.
 */

export const SUBSTRATE_AUTHORITY_PROFILE_SCHEMA_V0 = "castle.rhizoh.substrate_authority_profile.v0";

/** @typedef {"local" | "staging" | "production"} SubstrateAuthorityProfileIdV0 */

export const SUBSTRATE_AUTHORITY_PROFILES_V0 = Object.freeze({
  local: Object.freeze({
    id: "local",
    peerWalMaxFeedAgeMs: 120_000,
    peerWalEpochAheadTolerance: 2,
    sealInflationHoldOnWarn: false,
    rejectUnsignedWalIngress: false,
    strictConstitutionGate: false
  }),
  staging: Object.freeze({
    id: "staging",
    peerWalMaxFeedAgeMs: 90_000,
    peerWalEpochAheadTolerance: 1,
    sealInflationHoldOnWarn: false,
    rejectUnsignedWalIngress: true,
    strictConstitutionGate: false
  }),
  production: Object.freeze({
    id: "production",
    peerWalMaxFeedAgeMs: 45_000,
    peerWalEpochAheadTolerance: 0,
    sealInflationHoldOnWarn: true,
    rejectUnsignedWalIngress: true,
    strictConstitutionGate: true
  })
});

/**
 * Resolve profile from VITE_CASTLE_AUTHORITY_PROFILE, then VITE_ENV, then MODE.
 *
 * @returns {typeof SUBSTRATE_AUTHORITY_PROFILES_V0[keyof typeof SUBSTRATE_AUTHORITY_PROFILES_V0]}
 */
export function resolveSubstrateAuthorityProfileV0() {
  let raw = "";
  try {
    const env = typeof import.meta !== "undefined" ? import.meta.env : {};
    raw = String(env.VITE_CASTLE_AUTHORITY_PROFILE || env.VITE_ENV || env.MODE || "").trim().toLowerCase();
  } catch {
    raw = "";
  }
  if (raw === "prod") raw = "production";
  if (raw === "stage") raw = "staging";
  if (raw === "dev" || raw === "development") raw = "local";
  if (raw === "test") raw = "staging";
  if (raw in SUBSTRATE_AUTHORITY_PROFILES_V0) {
    return SUBSTRATE_AUTHORITY_PROFILES_V0[/** @type {keyof typeof SUBSTRATE_AUTHORITY_PROFILES_V0} */ (raw)];
  }
  if (raw === "production") return SUBSTRATE_AUTHORITY_PROFILES_V0.production;
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.PROD) {
      return SUBSTRATE_AUTHORITY_PROFILES_V0.production;
    }
  } catch {
    /* noop */
  }
  return SUBSTRATE_AUTHORITY_PROFILES_V0.local;
}

/**
 * Peer WAL defaults merged with active profile.
 */
export function peerWalPolicyFromProfileV0() {
  const p = resolveSubstrateAuthorityProfileV0();
  return {
    maxFeedAgeMs: p.peerWalMaxFeedAgeMs,
    epochAheadTolerance: p.peerWalEpochAheadTolerance
  };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildSubstrateAuthorityProfileSnapshotV0() {
  const profile = resolveSubstrateAuthorityProfileV0();
  return {
    schema: SUBSTRATE_AUTHORITY_PROFILE_SCHEMA_V0,
    ts: Date.now(),
    profileId: profile.id,
    peerWal: peerWalPolicyFromProfileV0(),
    rejectUnsignedWalIngress: profile.rejectUnsignedWalIngress,
    sealInflationHoldOnWarn: profile.sealInflationHoldOnWarn,
    strictConstitutionGate: profile.strictConstitutionGate
  };
}
