/**
 * User-consented geo — voice/local feeds must not assume Istanbul env defaults.
 */

import { readCastleNexusGeoV0, readUserCastleAnchorGeoV0 } from "./worldMapBootstrapGeoV0.js";

export const RHIZOH_USER_GEO_CONSENT_SCHEMA_V0 = "castle.rhizoh.user_geo_consent.v0";

/**
 * GPS nexus or user-placed castle anchor — not Serencebey seed / env lat-lon.
 * @returns {{ lat: number, lon: number, label?: string, source: string } | null}
 */
export function readUserConsentedGeoForLocalFeedsV0() {
  const nexus = readCastleNexusGeoV0();
  if (nexus) return nexus;
  const castle = readUserCastleAnchorGeoV0();
  if (castle) return castle;
  return null;
}

export function hasUserGeoForLocalFeedsV0() {
  return readUserConsentedGeoForLocalFeedsV0() != null;
}
