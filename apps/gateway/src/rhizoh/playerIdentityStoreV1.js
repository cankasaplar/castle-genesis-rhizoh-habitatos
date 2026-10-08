import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

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

function resolvePlayerStorePath() {
  const root = resolveRepoRoot();
  const filePath = path.join(root, "data", "players_identity_v1.json");
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return filePath;
}

let cacheLoaded = false;
let memoryPlayers = {};

export function loadStore(forceReload = false) {
  if (cacheLoaded && !forceReload) {
    return memoryPlayers;
  }
  const filePath = resolvePlayerStorePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      memoryPlayers = JSON.parse(raw);
    } catch {
      memoryPlayers = {};
    }
  } else {
    memoryPlayers = {};
  }
  cacheLoaded = true;
  return memoryPlayers;
}

export function saveStore() {
  const filePath = resolvePlayerStorePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(memoryPlayers, null, 2), "utf8");
  } catch (err) {
    console.error("[PLAYER_STORE] Failed to persist players store:", err);
  }
}

/**
 * Returns player record by session token.
 */
export function getPlayerByToken(token) {
  if (!token) return null;
  loadStore();
  let found = Object.values(memoryPlayers).find(p => p.session_token === token);
  if (!found) {
    loadStore(true);
    found = Object.values(memoryPlayers).find(p => p.session_token === token);
  }
  return found || null;
}

/**
 * Verifies that the caller presenting token owns requestedPlayerId.
 */
export function verifyPlayerOwnership(token, requestedPlayerId) {
  if (!token || !requestedPlayerId) return false;
  loadStore();
  let player = memoryPlayers[requestedPlayerId];
  if (!player) {
    loadStore(true);
    player = memoryPlayers[requestedPlayerId];
  }
  if (!player) return false;
  return player.session_token === token;
}

/**
 * Creates or retrieves a Player Identity session.
 */
export function getOrCreatePlayerSession(token = null) {
  loadStore();
  if (token) {
    const existing = Object.values(memoryPlayers).find(p => p.session_token === token);
    if (existing) {
      return { ok: true, player: sanitizePlayerProfile(existing, true), token: existing.session_token, is_new: false };
    }
  }

  const playerId = "rhz_usr_" + crypto.randomBytes(6).toString("hex");
  const sessionToken = "rhz_tok_" + crypto.randomBytes(16).toString("hex");
  const shortNum = Math.floor(1000 + Math.random() * 9000);
  const handle = `anon-${shortNum}`;

  const newPlayer = {
    player_id: playerId,
    handle,
    display_name: `Anonymous Challenger #${shortNum}`,
    is_anonymous: true,
    avatar_seed: handle,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    session_token: sessionToken,
    account_status: "ACTIVE",
    ratings: {
      blitz: 1200,
      rapid: null,
      classical: null,
      puzzle: null
    },
    ratings_provisional: {
      blitz: true,
      rapid: true,
      classical: true,
      puzzle: true
    },
    stats: {
      games_played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      accuracy_avg: null,
      blunders_total: null,
      mistakes_total: null,
      inaccuracies_total: null
    },
    opening_profile: {
      white: [],
      black: []
    },
    time_profile: {
      avg_move_time_sec: null,
      time_trouble_rate_pct: null
    },
    my_rhizoh: {
      matches_vs_rhizoh: 0,
      wins_vs_rhizoh: 0,
      draws_vs_rhizoh: 0,
      losses_vs_rhizoh: 0,
      first_encounter_utc: null,
      last_encounter_utc: null,
      observed_tendencies: [],
      recommendations: []
    }
  };

  memoryPlayers[playerId] = newPlayer;
  saveStore();

  return { ok: true, player: sanitizePlayerProfile(newPlayer, true), token: sessionToken, is_new: true };
}

/**
 * Upgrades anonymous profile to claimed identity.
 */
export function claimPlayerIdentity({ playerId, sessionToken, newHandle, displayName }) {
  loadStore();
  const player = memoryPlayers[playerId];
  if (!player) {
    return { ok: false, error: "PLAYER_NOT_FOUND" };
  }
  if (player.session_token !== sessionToken) {
    return { ok: false, error: "UNAUTHORIZED_SESSION", message: "Privacy boundary: Session token does not match player ID." };
  }

  const cleanHandle = String(newHandle || "").trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanHandle)) {
    return { ok: false, error: "INVALID_HANDLE", message: "Handle must be 3-20 alphanumeric characters or underscore." };
  }

  const existingWithHandle = Object.values(memoryPlayers).find(p => p.handle.toLowerCase() === cleanHandle && p.player_id !== playerId);
  if (existingWithHandle) {
    return { ok: false, error: "HANDLE_TAKEN", message: "This username is already registered." };
  }

  player.handle = cleanHandle;
  player.display_name = String(displayName || cleanHandle).trim();
  player.is_anonymous = false;
  player.updated_at = new Date().toISOString();

  saveStore();
  return { ok: true, player: sanitizePlayerProfile(player, true) };
}

/**
 * Retrieves player profile with strict privacy boundary (P2-H).
 * If callerToken matches playerId, returns complete private profile.
 * If not matching, and player is anonymous, returns null (404).
 * If not matching, and player is public/claimed, returns public profile only.
 */
export function getPlayerProfile(playerId, callerToken = null) {
  loadStore();
  const player = memoryPlayers[playerId];
  if (!player) return null;

  const isOwner = callerToken && player.session_token === callerToken;
  if (!isOwner && player.is_anonymous) {
    // Privacy Boundary: Anonymous provisional profiles cannot be queried by third parties
    return null;
  }

  return sanitizePlayerProfile(player, isOwner);
}

/**
 * Records game outcome and calculates Elo delta vs anchor.
 */
export function recordGameToPlayer({ playerId, gameId, timeControl, result, termination, userColor }) {
  loadStore();
  const player = memoryPlayers[playerId];
  if (!player) return null;

  player.stats.games_played++;
  player.my_rhizoh.matches_vs_rhizoh++;

  const isUserWhite = userColor === "w";
  let outcome = "draw";
  if (result === "1-0") {
    outcome = isUserWhite ? "win" : "loss";
  } else if (result === "0-1") {
    outcome = isUserWhite ? "loss" : "win";
  }

  if (outcome === "win") {
    player.stats.wins++;
    player.my_rhizoh.wins_vs_rhizoh++;
  } else if (outcome === "draw") {
    player.stats.draws++;
    player.my_rhizoh.draws_vs_rhizoh++;
  } else {
    player.stats.losses++;
    player.my_rhizoh.losses_vs_rhizoh++;
  }

  const now = new Date().toISOString();
  if (!player.my_rhizoh.first_encounter_utc) {
    player.my_rhizoh.first_encounter_utc = now;
  }
  player.my_rhizoh.last_encounter_utc = now;

  // Simple calibrated Elo delta vs Rhizoh Anchor (~1600 level challenge anchor)
  const opponentAnchorRating = 1600;
  const currentRating = player.ratings.blitz || 1200;
  const isProvisional = player.ratings_provisional.blitz;
  const kFactor = isProvisional ? 32 : 16;
  
  const expectedScore = 1 / (1 + Math.pow(10, (opponentAnchorRating - currentRating) / 400));
  const actualScore = outcome === "win" ? 1 : (outcome === "draw" ? 0.5 : 0);
  const ratingDelta = Math.round(kFactor * (actualScore - expectedScore));
  const newRating = Math.max(400, currentRating + ratingDelta);

  player.ratings.blitz = newRating;
  if (player.stats.games_played >= 5) {
    player.ratings_provisional.blitz = false;
  }
  player.updated_at = now;

  saveStore();

  const ratingEvent = {
    event_type: "RATING_UPDATE",
    timestamp_utc: now,
    player_id: playerId,
    game_id: gameId,
    time_control: timeControl,
    old_rating: currentRating,
    new_rating: newRating,
    delta: ratingDelta,
    is_provisional: player.ratings_provisional.blitz,
    algorithm_version: "rhizoh_elo_anchor_v1.0"
  };

  return { player: sanitizePlayerProfile(player, true), ratingEvent };
}

function sanitizePlayerProfile(p, isOwner = false) {
  if (isOwner) {
    return {
      player_id: p.player_id,
      handle: p.handle,
      display_name: p.display_name,
      is_anonymous: p.is_anonymous,
      avatar_seed: p.avatar_seed,
      created_at: p.created_at,
      account_status: p.account_status,
      ratings: p.ratings,
      ratings_provisional: p.ratings_provisional,
      stats: p.stats,
      opening_profile: p.opening_profile,
      time_profile: p.time_profile,
      my_rhizoh: p.my_rhizoh
    };
  }

  // Public sanitized view for third-party queries
  return {
    handle: p.handle,
    display_name: p.display_name,
    is_anonymous: false,
    avatar_seed: p.avatar_seed,
    created_at: p.created_at,
    ratings: {
      blitz: p.ratings.blitz,
      rapid: null,
      classical: null,
      puzzle: null
    },
    stats: {
      games_played: p.stats.games_played,
      wins: p.stats.wins,
      draws: p.stats.draws,
      losses: p.stats.losses
    }
  };
}

/**
 * Internal lookup by player ID (without privacy redaction, for server engines).
 */
export function getPlayerById(playerId) {
  if (!playerId) return null;
  loadStore();
  let player = memoryPlayers[playerId];
  if (!player) {
    loadStore(true);
    player = memoryPlayers[playerId];
  }
  return player || null;
}

/**
 * Returns all active players in memory (internal server access).
 */
export function getAllPlayers() {
  loadStore();
  return Object.values(memoryPlayers);
}
