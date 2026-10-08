/**
 * Rhizoh Server-Authoritative Challenge Lifecycle Engine (Phase 3 - P3-B)
 * 
 * Architectural Standard:
 * "P3-B sosyal niyeti yönetir. P3-A satranç gerçeğini yönetir."
 * 
 * Lifecycle State Machine:
 * CREATE -> PENDING -> ACCEPT  -> ROOM CREATED (P3-A Authority takes over)
 *                   -> DECLINE -> CLOSED
 *                   -> CANCEL  -> CLOSED
 *                   -> EXPIRE  -> CLOSED
 * 
 * Strict Security Boundaries:
 * - Only challenged player can ACCEPT (Attack 1 rejected: 403 Forbidden).
 * - Only challenged player can DECLINE (P3-B3).
 * - Only challenger can CANCEL (Attack 2 rejected: 403 Forbidden).
 * - Expiry is server-enforced based on UTC timestamp (P3-B5).
 * - Double-Accept is atomically rejected (Attack 3 rejected: 409 Conflict, exactly 1 room).
 * - Expired/Invalid challenges cannot spawn rooms (P3-B9).
 * - Challenge -> Room -> Ledger traceability (P3-B10).
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPlayerById, getPlayerByToken, verifyPlayerOwnership } from "./playerIdentityStoreV1.js";
import { createChallengeRoom, TIME_CONTROLS, parseTimeControlPolicy } from "./chessRoomAuthorityV1.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveRepoRoot() {
  const candidates = [
    process.env.RHIZOH_REPO_ROOT,
    path.resolve(__dirname, "..", "..", "..", ".."),
    path.resolve(__dirname, "..", "..", ".."),
    path.resolve(process.cwd(), ".."),
    process.cwd(),
    "/home/castle/castle"
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, "data", "event_ledger.jsonl"))) {
      return c;
    }
  }
  return process.platform === "win32" ? path.resolve(__dirname, "..", "..", "..", "..") : "/home/castle/castle";
}

function resolveChallengesStorePath() {
  const root = resolveRepoRoot();
  const filePath = path.join(root, "data", "challenges_v1.json");
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return filePath;
}

// In-memory challenge registry with disk sync
let challengesLoaded = false;
const activeChallenges = new Map();

export function loadChallengesStore() {
  if (challengesLoaded) return activeChallenges;
  const filePath = resolveChallengesStorePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.challenge_id) {
            activeChallenges.set(item.challenge_id, item);
          }
        }
      }
    } catch (e) {
      console.error("[CHALLENGE_STORE] Error loading challenges_v1.json:", e);
    }
  }
  challengesLoaded = true;
  return activeChallenges;
}

export function saveChallengesStore() {
  const filePath = resolveChallengesStorePath();
  try {
    const list = Array.from(activeChallenges.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("[CHALLENGE_STORE] Failed to persist challenges:", err);
  }
}

/**
 * Checks if a challenge has expired according to server UTC clock.
 */
function isChallengeExpired(challenge) {
  if (!challenge || !challenge.expires_at) return false;
  return Date.now() >= new Date(challenge.expires_at).getTime();
}

/**
 * Periodically or on-demand mark pending expired challenges.
 */
export function checkAndExpireChallenges() {
  loadChallengesStore();
  let mutated = false;
  for (const challenge of activeChallenges.values()) {
    if (challenge.status === "PENDING" && isChallengeExpired(challenge)) {
      challenge.status = "EXPIRED";
      mutated = true;
    }
  }
  if (mutated) saveChallengesStore();
}

/**
 * Sanitizes challenge data for external consumption.
 */
export function sanitizeChallenge(c) {
  if (!c) return null;
  return {
    challenge_id: c.challenge_id,
    challenger_player_id: c.challenger_player_id,
    challenger_handle: c.challenger_handle,
    challenger_display_name: c.challenger_display_name,
    challenged_player_id: c.challenged_player_id,
    challenged_handle: c.challenged_handle,
    challenged_display_name: c.challenged_display_name,
    time_control: c.time_control,
    rated: Boolean(c.rated),
    status: c.status,
    created_at: c.created_at,
    expires_at: c.expires_at,
    accepted_at: c.accepted_at,
    declined_at: c.declined_at,
    cancelled_at: c.cancelled_at,
    room_id: c.room_id,
    is_test: Boolean(c.is_test)
  };
}

/**
 * P3-B1: Challenge Creation
 */
export function createChallenge({
  challengerToken,
  challengerPlayerId,
  challengedPlayerId,
  timeControl = "blitz_5_3",
  rated = true,
  ttlSeconds = 60,
  isTest = false
}) {
  loadChallengesStore();

  if (!challengerToken || !challengerPlayerId) {
    return { ok: false, error: "AUTH_REQUIRED", message: "Challenger session token and player ID required.", statusCode: 401 };
  }

  // 1. Verify caller owns challengerPlayerId
  if (!verifyPlayerOwnership(challengerToken, challengerPlayerId)) {
    return { ok: false, error: "FORBIDDEN", message: "Session token does not match challenger player ID.", statusCode: 403 };
  }

  // 2. Cannot challenge self
  if (challengerPlayerId === challengedPlayerId) {
    return { ok: false, error: "CANNOT_CHALLENGE_SELF", message: "You cannot challenge yourself.", statusCode: 400 };
  }

  // 3. Resolve players
  const challenger = getPlayerById(challengerPlayerId);
  if (!challenger) {
    return { ok: false, error: "CHALLENGER_NOT_FOUND", message: "Challenger player record not found.", statusCode: 404 };
  }

  const challenged = getPlayerById(challengedPlayerId);
  if (!challenged) {
    return { ok: false, error: "CHALLENGED_PLAYER_NOT_FOUND", message: "Challenged target player not found.", statusCode: 404 };
  }

  // 4. Validate time control
  const parsedTc = parseTimeControlPolicy(timeControl);
  const validTc = parsedTc.key;

  // 5. Construct authoritative challenge
  const challengeId = "rhz_chal_" + crypto.randomBytes(6).toString("hex");
  const nowMs = Date.now();
  const clampedTtl = Math.max(1, Math.min(600, Number(ttlSeconds) || 60));
  const expiresAtMs = nowMs + (clampedTtl * 1000);

  const challenge = {
    challenge_id: challengeId,
    challenger_player_id: challenger.player_id,
    challenger_handle: challenger.handle,
    challenger_display_name: challenger.display_name,
    challenged_player_id: challenged.player_id,
    challenged_handle: challenged.handle,
    challenged_display_name: challenged.display_name,
    time_control: validTc,
    rated: Boolean(rated),
    status: "PENDING",
    created_at: new Date(nowMs).toISOString(),
    expires_at: new Date(expiresAtMs).toISOString(),
    accepted_at: null,
    declined_at: null,
    cancelled_at: null,
    room_id: null,
    is_test: Boolean(isTest)
  };

  activeChallenges.set(challengeId, challenge);
  saveChallengesStore();

  return { ok: true, challenge: sanitizeChallenge(challenge) };
}

/**
 * P3-B2, P3-B6, P3-B7: Challenge Acceptance
 */
export function acceptChallenge({ callerToken, callerPlayerId, challengeId }) {
  loadChallengesStore();

  if (!callerToken || !callerPlayerId) {
    return { ok: false, error: "AUTH_REQUIRED", message: "Session token and player ID required.", statusCode: 401 };
  }

  if (!verifyPlayerOwnership(callerToken, callerPlayerId)) {
    return { ok: false, error: "FORBIDDEN", message: "Unauthorized player token.", statusCode: 403 };
  }

  const challenge = activeChallenges.get(challengeId);
  if (!challenge) {
    return { ok: false, error: "CHALLENGE_NOT_FOUND", message: "Challenge does not exist.", statusCode: 404 };
  }

  // Check Expiry (P3-B5, P3-B9)
  if (isChallengeExpired(challenge)) {
    challenge.status = "EXPIRED";
    saveChallengesStore();
    return { ok: false, error: "CHALLENGE_EXPIRED", message: "Challenge has expired and cannot be accepted.", statusCode: 410 };
  }

  // P3-B2 / Attack 1: Only the challenged player can accept
  if (challenge.challenged_player_id !== callerPlayerId) {
    return {
      ok: false,
      error: "FORBIDDEN",
      message: "Only the target challenged player can accept this challenge.",
      statusCode: 403
    };
  }

  // P3-B6 / Attack 3: Cannot accept already processed/accepted challenge (Race / Double-accept guard)
  if (challenge.status !== "PENDING") {
    return {
      ok: false,
      error: "CHALLENGE_ALREADY_PROCESSED",
      message: `Challenge cannot be accepted in state: ${challenge.status}.`,
      currentStatus: challenge.status,
      statusCode: 409
    };
  }

  // Atomic state transition
  challenge.status = "ACCEPTED";
  challenge.accepted_at = new Date().toISOString();

  // P3-B7: Spawn exactly ONE server-authoritative room under P3-A Room Authority
  const roomResult = createChallengeRoom({
    challengerPlayerId: challenge.challenger_player_id,
    challengedPlayerId: challenge.challenged_player_id,
    timeControlName: challenge.time_control,
    rated: challenge.rated,
    challengeId: challenge.challenge_id,
    isTest: challenge.is_test
  });

  if (!roomResult.ok) {
    // Revert state if room creation unexpectedly fails
    challenge.status = "PENDING";
    challenge.accepted_at = null;
    saveChallengesStore();
    return { ok: false, error: "ROOM_CREATION_FAILED", message: roomResult.message || roomResult.error, statusCode: 500 };
  }

  challenge.room_id = roomResult.roomId;
  saveChallengesStore();

  return {
    ok: true,
    challenge: sanitizeChallenge(challenge),
    roomId: roomResult.roomId,
    room: roomResult.room
  };
}

/**
 * P3-B3: Challenge Decline
 */
export function declineChallenge({ callerToken, callerPlayerId, challengeId }) {
  loadChallengesStore();

  if (!callerToken || !callerPlayerId) {
    return { ok: false, error: "AUTH_REQUIRED", message: "Session token and player ID required.", statusCode: 401 };
  }

  if (!verifyPlayerOwnership(callerToken, callerPlayerId)) {
    return { ok: false, error: "FORBIDDEN", message: "Unauthorized player token.", statusCode: 403 };
  }

  const challenge = activeChallenges.get(challengeId);
  if (!challenge) {
    return { ok: false, error: "CHALLENGE_NOT_FOUND", message: "Challenge does not exist.", statusCode: 404 };
  }

  if (isChallengeExpired(challenge)) {
    challenge.status = "EXPIRED";
    saveChallengesStore();
    return { ok: false, error: "CHALLENGE_EXPIRED", message: "Challenge has expired.", statusCode: 410 };
  }

  // P3-B3: Only the challenged player can decline
  if (challenge.challenged_player_id !== callerPlayerId) {
    return {
      ok: false,
      error: "FORBIDDEN",
      message: "Only the target challenged player can decline this challenge.",
      statusCode: 403
    };
  }

  if (challenge.status !== "PENDING") {
    return {
      ok: false,
      error: "CHALLENGE_ALREADY_PROCESSED",
      message: `Challenge cannot be declined in state: ${challenge.status}.`,
      currentStatus: challenge.status,
      statusCode: 409
    };
  }

  challenge.status = "DECLINED";
  challenge.declined_at = new Date().toISOString();
  saveChallengesStore();

  return { ok: true, challenge: sanitizeChallenge(challenge) };
}

/**
 * P3-B4 / Attack 2: Challenge Cancellation
 */
export function cancelChallenge({ callerToken, callerPlayerId, challengeId }) {
  loadChallengesStore();

  if (!callerToken || !callerPlayerId) {
    return { ok: false, error: "AUTH_REQUIRED", message: "Session token and player ID required.", statusCode: 401 };
  }

  if (!verifyPlayerOwnership(callerToken, callerPlayerId)) {
    return { ok: false, error: "FORBIDDEN", message: "Unauthorized player token.", statusCode: 403 };
  }

  const challenge = activeChallenges.get(challengeId);
  if (!challenge) {
    return { ok: false, error: "CHALLENGE_NOT_FOUND", message: "Challenge does not exist.", statusCode: 404 };
  }

  if (isChallengeExpired(challenge)) {
    challenge.status = "EXPIRED";
    saveChallengesStore();
    return { ok: false, error: "CHALLENGE_EXPIRED", message: "Challenge has expired.", statusCode: 410 };
  }

  // P3-B4 / Attack 2: Only the challenger can cancel
  if (challenge.challenger_player_id !== callerPlayerId) {
    return {
      ok: false,
      error: "FORBIDDEN",
      message: "Only the challenger can cancel this challenge.",
      statusCode: 403
    };
  }

  if (challenge.status !== "PENDING") {
    return {
      ok: false,
      error: "CHALLENGE_ALREADY_PROCESSED",
      message: `Challenge cannot be cancelled in state: ${challenge.status}.`,
      currentStatus: challenge.status,
      statusCode: 409
    };
  }

  challenge.status = "CANCELLED";
  challenge.cancelled_at = new Date().toISOString();
  saveChallengesStore();

  return { ok: true, challenge: sanitizeChallenge(challenge) };
}

/**
 * Retrieves a single challenge snapshot.
 */
export function getChallenge(challengeId, callerToken = null) {
  loadChallengesStore();
  const challenge = activeChallenges.get(challengeId);
  if (!challenge) return null;

  if (challenge.status === "PENDING" && isChallengeExpired(challenge)) {
    challenge.status = "EXPIRED";
    saveChallengesStore();
  }

  return sanitizeChallenge(challenge);
}

/**
 * Lists player challenges (active incoming, active outgoing, and recent).
 */
export function listPlayerChallenges(playerId, callerToken = null) {
  loadChallengesStore();

  if (!playerId || !callerToken) {
    return { ok: false, error: "AUTH_REQUIRED", statusCode: 401 };
  }

  if (!verifyPlayerOwnership(callerToken, playerId)) {
    return { ok: false, error: "FORBIDDEN", message: "Cannot view challenges of another player.", statusCode: 403 };
  }

  checkAndExpireChallenges();

  const incoming = [];
  const outgoing = [];
  const history = [];

  for (const c of activeChallenges.values()) {
    if (c.challenged_player_id === playerId) {
      if (c.status === "PENDING") {
        incoming.push(sanitizeChallenge(c));
      } else {
        history.push(sanitizeChallenge(c));
      }
    } else if (c.challenger_player_id === playerId) {
      if (c.status === "PENDING") {
        outgoing.push(sanitizeChallenge(c));
      } else {
        history.push(sanitizeChallenge(c));
      }
    }
  }

  return {
    ok: true,
    playerId,
    incoming,
    outgoing,
    history: history.slice(-20)
  };
}
