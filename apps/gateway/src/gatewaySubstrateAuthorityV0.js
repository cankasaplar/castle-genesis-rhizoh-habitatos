/**
 * Gateway substrate authority — single production authority path + unsigned WAL ingress closure.
 *
 * Authority precedence (production): Firebase Admin verifyIdToken → CASTLE_JWT_SECRET HS256 → CASTLE_GATEWAY_TOKEN (transport only).
 * CASTLE_GATEWAY_TOKEN alone does NOT satisfy CASTLE_REQUIRE_AUTH; it gates WS connect when set.
 */

export const GATEWAY_SUBSTRATE_AUTHORITY_SCHEMA_V0 = "castle.gateway.substrate_authority.v0";

const MIN_GATEWAY_TOKEN_LEN = 16;

/**
 * @returns {"firebase" | "jwt" | "gateway_token_only" | "none"}
 */
export function resolveGatewayAuthorityPathV0() {
  const firebaseOk =
    String(process.env.FIREBASE_PROJECT_ID || "").trim() &&
    String(process.env.FIREBASE_CLIENT_EMAIL || "").trim() &&
    String(process.env.FIREBASE_PRIVATE_KEY || "").trim();
  if (firebaseOk) return "firebase";
  const jwt = String(process.env.CASTLE_JWT_SECRET || "").trim();
  if (jwt.length >= MIN_GATEWAY_TOKEN_LEN) return "jwt";
  const tok = String(process.env.CASTLE_GATEWAY_TOKEN || "").trim();
  if (tok.length >= MIN_GATEWAY_TOKEN_LEN) return "gateway_token_only";
  return "none";
}

/**
 * Production substrate: at least one identity verifier beyond shared WS token.
 */
export function isProductionSubstrateAuthoritySatisfiedV0() {
  const path = resolveGatewayAuthorityPathV0();
  if (path === "firebase" || path === "jwt") return true;
  if (process.env.CASTLE_REQUIRE_AUTH !== "true") return path === "gateway_token_only";
  return false;
}

/**
 * WAL peer feeds require authenticated socket when enabled (default on in production).
 */
export function isWalPeerAuthRequiredV0() {
  if (process.env.CASTLE_REQUIRE_WAL_PEER_AUTH === "false") return false;
  if (process.env.CASTLE_REQUIRE_WAL_PEER_AUTH === "true") return true;
  return String(process.env.NODE_ENV || "").toLowerCase() === "production";
}

/**
 * Reject unsigned WAL payloads at the relay boundary.
 */
export function isWalPeerSignatureRequiredV0() {
  if (process.env.CASTLE_REJECT_UNSIGNED_WAL === "false") return false;
  if (process.env.CASTLE_REJECT_UNSIGNED_WAL === "true") return true;
  return String(process.env.NODE_ENV || "").toLowerCase() === "production";
}

/**
 * @param {import("ws").WebSocket & { auth?: { ok?: boolean }, clientId?: string }} socket
 * @returns {{ ok: boolean, code?: string, reason?: string }}
 */
export function assertWalPeerSocketAuthorityV0(socket) {
  if (!isWalPeerAuthRequiredV0()) return { ok: true };
  if (socket?.auth?.ok === true) return { ok: true };
  return {
    ok: false,
    code: "wal_peer_unauthenticated",
    reason: "WAL peer feed requires authenticated socket (Firebase or CASTLE_JWT_SECRET)."
  };
}

/**
 * @param {Record<string, unknown>} walPeerFeed
 * @returns {{ ok: boolean, code?: string, reason?: string }}
 */
export function validateWalPeerFeedSignatureV0(walPeerFeed) {
  if (!isWalPeerSignatureRequiredV0()) return { ok: true };
  const feed = walPeerFeed && typeof walPeerFeed === "object" ? walPeerFeed : {};
  if (feed.signed === false) {
    return { ok: false, code: "wal_feed_unsigned", reason: "walPeerFeed.signed must not be false in production." };
  }
  const history = Array.isArray(feed.history) ? feed.history : [];
  for (let i = 0; i < history.length; i++) {
    const row = history[i];
    if (row && typeof row === "object" && row.signed === false) {
      return {
        ok: false,
        code: "wal_history_unsigned",
        reason: `history[${i}] is unsigned — rejected at gateway ingress.`
      };
    }
  }
  return { ok: true };
}

/**
 * @returns {Record<string, unknown>}
 */
export function buildGatewaySubstrateAuthoritySnapshotV0() {
  const path = resolveGatewayAuthorityPathV0();
  const gatewayTokenLen = String(process.env.CASTLE_GATEWAY_TOKEN || "").trim().length;
  return {
    schema: GATEWAY_SUBSTRATE_AUTHORITY_SCHEMA_V0,
    ts: Date.now(),
    authorityPath: path,
    productionAuthoritySatisfied: isProductionSubstrateAuthoritySatisfiedV0(),
    requireAuth: process.env.CASTLE_REQUIRE_AUTH === "true",
    requireWalPeerAuth: isWalPeerAuthRequiredV0(),
    rejectUnsignedWal: isWalPeerSignatureRequiredV0(),
    gatewayTokenConfigured: gatewayTokenLen >= MIN_GATEWAY_TOKEN_LEN,
    nodeEnv: process.env.NODE_ENV || "development"
  };
}

/**
 * Log once at boot in production when authority posture is weak.
 */
export function logGatewaySubstrateAuthorityGuardsV0() {
  if (String(process.env.NODE_ENV || "").toLowerCase() !== "production") return;
  const tag = "[GATEWAY_SUBSTRATE_AUTH]";
  const snap = buildGatewaySubstrateAuthoritySnapshotV0();
  if (!snap.productionAuthoritySatisfied) {
    console.warn(
      `${tag} Production authority incomplete: set Firebase Admin OR CASTLE_JWT_SECRET (>=16); CASTLE_GATEWAY_TOKEN is transport-only.`
    );
  }
  if (!snap.gatewayTokenConfigured) {
    console.warn(`${tag} CASTLE_GATEWAY_TOKEN missing or short — WS is open to unauthenticated connect.`);
  }
  if (snap.requireWalPeerAuth && snap.authorityPath === "none") {
    console.warn(`${tag} WAL peer auth required but no identity verifier configured.`);
  }
}
