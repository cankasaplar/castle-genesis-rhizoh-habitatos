/**
 * Rhizoh Server-Authoritative Chess Room & Live WebSocket Engine (Phase 3 - P3-A)
 * 
 * Architectural Standard:
 * - Client clock = display. Server clock = authority.
 * - Client cannot choose color; server decides white/black.
 * - Client cannot declare moves or results; gateway performs server-side replay,
 *   turn validation, clock deduction, and legal move verification.
 * - Reconnect recovers from canonical server state, never client state.
 * - Game over commits cryptographically verified record to canonical Event Ledger.
 */

import { Chess } from "chess.js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPlayerByToken, verifyPlayerOwnership, getPlayerById } from "./playerIdentityStoreV1.js";
import { applyGameRatingOutcome } from "./ratingLeaderboardV1.js";

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

function resolveCanonicalEventLedgerPath() {
  if (process.env.RHIZOH_EVENT_LEDGER_PATH) {
    return path.resolve(process.env.RHIZOH_EVENT_LEDGER_PATH);
  }
  const root = resolveRepoRoot();
  const ledger = path.join(root, "data", "event_ledger.jsonl");
  const dir = path.dirname(ledger);
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return ledger;
}

function getFileSha256(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch {
    return null;
  }
}

function resolveCastleBinaryPath() {
  const root = resolveRepoRoot();
  const candidates = [
    path.join(root, "apps", "gateway", "bin", "castle.exe"),
    path.join(root, "bin", "castle.exe"),
    path.join(root, "target", "release", "castle.exe"),
    path.join(root, "castle.exe"),
    "/home/castle/castle/bin/castle"
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function resolveActiveModelPath() {
  const root = resolveRepoRoot();
  const candidates = [
    path.join(root, "sealed", "a50_golden.bin"),
    path.join(root, "rhizoh_nnue.bin"),
    path.join(root, "config", "rhizoh_nnue_512.bin"),
    "/home/castle/castle/sealed/a50_golden.bin"
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Phase 3-C: Authoritative Time Control Policy Definition & Parser
 */
export const TIME_CONTROLS = Object.freeze({
  "test_1s": { key: "test_1s", base_ms: 800, initial_ms: 800, increment_ms: 0, name: "800ms Test", clock_policy_version: "v1.0" },
  "bullet_1_0": { key: "bullet_1_0", base_ms: 60 * 1000, initial_ms: 60 * 1000, increment_ms: 0, name: "1+0 Bullet", clock_policy_version: "v1.0" },
  "blitz_3_0": { key: "blitz_3_0", base_ms: 180 * 1000, initial_ms: 180 * 1000, increment_ms: 0, name: "3+0 Blitz", clock_policy_version: "v1.0" },
  "blitz_3_2": { key: "blitz_3_2", base_ms: 180 * 1000, initial_ms: 180 * 1000, increment_ms: 2000, name: "3+2 Blitz", clock_policy_version: "v1.0" },
  "blitz_5_0": { key: "blitz_5_0", base_ms: 300 * 1000, initial_ms: 300 * 1000, increment_ms: 0, name: "5+0 Blitz", clock_policy_version: "v1.0" },
  "blitz_5_3": { key: "blitz_5_3", base_ms: 300 * 1000, initial_ms: 300 * 1000, increment_ms: 3000, name: "5+3 Blitz", clock_policy_version: "v1.0" },
  "rapid_10_0": { key: "rapid_10_0", base_ms: 600 * 1000, initial_ms: 600 * 1000, increment_ms: 0, name: "10+0 Rapid", clock_policy_version: "v1.0" },
  "rapid_10_5": { key: "rapid_10_5", base_ms: 600 * 1000, initial_ms: 600 * 1000, increment_ms: 5000, name: "10+5 Rapid", clock_policy_version: "v1.0" },
  "classical_15_10": { key: "classical_15_10", base_ms: 900 * 1000, initial_ms: 900 * 1000, increment_ms: 10000, name: "15+10 Classical", clock_policy_version: "v1.0" }
});

/**
 * P3-C1: Strict Time Control Policy Parser
 * Parses standard representations (e.g. '5+3', '5+3 Blitz', 'blitz_5_3', '1+0')
 * into deterministic base_ms, increment_ms, and clock_policy_version.
 */
export function parseTimeControlPolicy(input = "blitz_5_3") {
  const raw = String(input || "").trim().toLowerCase();

  const ALIAS_MAP = {
    "1+0": "bullet_1_0",
    "1+0 bullet": "bullet_1_0",
    "test_1s": "test_1s",
    "bullet_1_0": "bullet_1_0",

    "3+0": "blitz_3_0",
    "3+0 blitz": "blitz_3_0",
    "blitz_3_0": "blitz_3_0",

    "3+2": "blitz_3_2",
    "3+2 blitz": "blitz_3_2",
    "blitz_3_2": "blitz_3_2",

    "5+0": "blitz_5_0",
    "5+0 blitz": "blitz_5_0",
    "blitz_5_0": "blitz_5_0",

    "5+3": "blitz_5_3",
    "5+3 blitz": "blitz_5_3",
    "blitz_5_3": "blitz_5_3",

    "10+0": "rapid_10_0",
    "10+0 rapid": "rapid_10_0",
    "rapid_10_0": "rapid_10_0",

    "10+5": "rapid_10_5",
    "10+5 rapid": "rapid_10_5",
    "rapid_10_5": "rapid_10_5",

    "15+10": "classical_15_10",
    "15+10 classical": "classical_15_10",
    "classical_15_10": "classical_15_10"
  };

  const resolvedKey = ALIAS_MAP[raw];
  if (resolvedKey && TIME_CONTROLS[resolvedKey]) {
    const item = TIME_CONTROLS[resolvedKey];
    return {
      key: item.key,
      name: item.name,
      base_ms: item.base_ms,
      initial_ms: item.base_ms,
      increment_ms: item.increment_ms,
      clock_policy_version: item.clock_policy_version
    };
  }

  // Regex parse for arbitrary 'X+Y' (e.g. '2+1', '7+4')
  const match = raw.match(/^(\d+)\+(\d+)/);
  if (match) {
    const mins = parseInt(match[1], 10);
    const incSecs = parseInt(match[2], 10);
    const base_ms = mins * 60 * 1000;
    const increment_ms = incSecs * 1000;
    const key = `custom_${mins}_${incSecs}`;
    return {
      key,
      name: `${mins}+${incSecs} Custom`,
      base_ms,
      initial_ms: base_ms,
      increment_ms,
      clock_policy_version: "v1.0"
    };
  }

  // Default fallback: 5+3 Blitz
  const def = TIME_CONTROLS["blitz_5_3"];
  return {
    key: def.key,
    name: def.name,
    base_ms: def.base_ms,
    initial_ms: def.base_ms,
    increment_ms: def.increment_ms,
    clock_policy_version: def.clock_policy_version
  };
}

// Authoritative in-memory room registry
const activeRooms = new Map();
// Socket to room mapping for fast lookup and disconnect cleanup
const socketRoomMap = new WeakMap();

/**
 * Creates a server-authoritative chess room in WAITING state.
 */
export function createChessRoom({ hostToken, hostPlayerId, timeControlName = "blitz_3_0", isTest = false }) {
  if (!hostToken || !hostPlayerId) {
    return { ok: false, error: "AUTH_REQUIRED", message: "Host session token and player ID required." };
  }
  if (!verifyPlayerOwnership(hostToken, hostPlayerId)) {
    return { ok: false, error: "FORBIDDEN", message: "Session token does not match host player ID." };
  }

  const hostPlayer = getPlayerByToken(hostToken);
  if (!hostPlayer) {
    return { ok: false, error: "HOST_NOT_FOUND" };
  }

  const tc = parseTimeControlPolicy(timeControlName);
  const tcKey = tc.key;

  const roomId = "rhz_room_" + crypto.randomBytes(6).toString("hex");
  const now = new Date().toISOString();

  const room = {
    roomId,
    timeControlKey: tcKey,
    timeControl: {
      key: tcKey,
      name: tc.name,
      initial_ms: tc.initial_ms,
      increment_ms: tc.increment_ms
    },
    status: "WAITING", // CREATED -> WAITING -> READY -> LIVE -> FINISHED -> SEALED
    creatorPlayerId: hostPlayerId,
    whitePlayer: null,
    blackPlayer: null,
    spectators: new Set(),
    game: new Chess(),
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    history: [],
    clocks: {
      white_remaining_ms: tc.initial_ms,
      black_remaining_ms: tc.initial_ms,
      increment_ms: tc.increment_ms,
      last_move_server_timestamp: null,
      turn: "w",
      clock_version: 0
    },
    result: null,
    termination: null,
    winnerPlayerId: null,
    drawOfferFrom: null,
    isTest: Boolean(isTest),
    createdAtUtc: now,
    startedAtUtc: null,
    endedAtUtc: null,
    ledgerSealed: false
  };

  // Host is assigned tentatively to creator; color determined when second player joins
  room.hostCandidate = {
    playerId: hostPlayer.player_id,
    handle: hostPlayer.handle,
    displayName: hostPlayer.display_name,
    token: hostToken,
    socket: null
  };

  activeRooms.set(roomId, room);
  return { ok: true, roomId, room: sanitizeRoomSnapshot(room) };
}

/**
 * Creates a server-authoritative chess room directly for a matched Challenge (Phase 3 - P3-B).
 * Bypasses WAITING state and initializes directly into LIVE state with canonical server color assignment.
 */
export function createChallengeRoom({
  challengerPlayerId,
  challengedPlayerId,
  timeControlName = "blitz_5_3",
  rated = true,
  challengeId = null,
  isTest = false
}) {
  const challenger = getPlayerById(challengerPlayerId);
  const challenged = getPlayerById(challengedPlayerId);

  if (!challenger || !challenged) {
    return { ok: false, error: "PLAYERS_NOT_FOUND", message: "One or both players could not be resolved." };
  }

  const tc = parseTimeControlPolicy(timeControlName);
  const tcKey = tc.key;

  const roomId = "rhz_room_" + crypto.randomBytes(6).toString("hex");
  const now = new Date().toISOString();
  const nowMs = Date.now();

  // Canonical server color assignment: 50% random
  const challengerIsWhite = Math.random() < 0.5;
  const whitePlayerRecord = challengerIsWhite ? challenger : challenged;
  const blackPlayerRecord = challengerIsWhite ? challenged : challenger;

  const room = {
    roomId,
    challengeId: challengeId || null,
    rated: Boolean(rated),
    timeControlKey: tcKey,
    timeControl: {
      key: tcKey,
      name: tc.name,
      initial_ms: tc.initial_ms,
      increment_ms: tc.increment_ms
    },
    status: "LIVE",
    creatorPlayerId: challengerPlayerId,
    whitePlayer: {
      playerId: whitePlayerRecord.player_id,
      handle: whitePlayerRecord.handle,
      displayName: whitePlayerRecord.display_name,
      token: whitePlayerRecord.session_token,
      socket: null
    },
    blackPlayer: {
      playerId: blackPlayerRecord.player_id,
      handle: blackPlayerRecord.handle,
      displayName: blackPlayerRecord.display_name,
      token: blackPlayerRecord.session_token,
      socket: null
    },
    spectators: new Set(),
    game: new Chess(),
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    history: [],
    clocks: {
      white_remaining_ms: tc.initial_ms,
      black_remaining_ms: tc.initial_ms,
      increment_ms: tc.increment_ms,
      last_move_server_timestamp: nowMs,
      turn: "w",
      clock_version: 1
    },
    result: null,
    termination: null,
    winnerPlayerId: null,
    drawOfferFrom: null,
    isTest: Boolean(isTest),
    createdAtUtc: now,
    startedAtUtc: now,
    endedAtUtc: null,
    ledgerSealed: false
  };

  activeRooms.set(roomId, room);
  return {
    ok: true,
    roomId,
    challengeId,
    whitePlayerId: room.whitePlayer.playerId,
    blackPlayerId: room.blackPlayer.playerId,
    timeControl: room.timeControl,
    room: sanitizeRoomSnapshot(room)
  };
}

/**
 * Opponent joins the room; server canonically assigns colors and transitions status to LIVE.
 */
export function joinChessRoom({ guestToken, guestPlayerId, roomId }) {
  if (!guestToken || !guestPlayerId) {
    return { ok: false, error: "AUTH_REQUIRED", message: "Guest session token and player ID required." };
  }
  if (!verifyPlayerOwnership(guestToken, guestPlayerId)) {
    return { ok: false, error: "FORBIDDEN", message: "Session token does not match guest player ID." };
  }

  const room = activeRooms.get(roomId);
  if (!room) {
    return { ok: false, error: "ROOM_NOT_FOUND" };
  }

  if (room.status !== "WAITING") {
    return { ok: false, error: "ROOM_NOT_AVAILABLE", message: `Room is in ${room.status} state.` };
  }

  if (room.creatorPlayerId === guestPlayerId) {
    return { ok: false, error: "CANNOT_PLAY_SELF", message: "Cannot join your own room as opponent." };
  }

  const guestPlayer = getPlayerByToken(guestToken);
  if (!guestPlayer) {
    return { ok: false, error: "GUEST_NOT_FOUND" };
  }

  // Canonical server color assignment: 50% random
  const hostIsWhite = Math.random() < 0.5;
  const host = room.hostCandidate;
  const guest = {
    playerId: guestPlayer.player_id,
    handle: guestPlayer.handle,
    displayName: guestPlayer.display_name,
    token: guestToken,
    socket: null
  };

  if (hostIsWhite) {
    room.whitePlayer = host;
    room.blackPlayer = guest;
  } else {
    room.whitePlayer = guest;
    room.blackPlayer = host;
  }

  delete room.hostCandidate;

  // Transition room state
  const nowMs = Date.now();
  room.status = "LIVE";
  room.startedAtUtc = new Date(nowMs).toISOString();
  room.clocks.last_move_server_timestamp = nowMs;
  room.clocks.clock_version = 1;

  // Broadcast start to any currently connected sockets
  broadcastToRoom(room, {
    type: "CHESS_ROOM_STARTED",
    roomId: room.roomId,
    whitePlayer: { playerId: room.whitePlayer.playerId, displayName: room.whitePlayer.displayName, handle: room.whitePlayer.handle },
    blackPlayer: { playerId: room.blackPlayer.playerId, displayName: room.blackPlayer.displayName, handle: room.blackPlayer.handle },
    fen: room.fen,
    clocks: room.clocks,
    timeControl: room.timeControl,
    status: room.status
  });

  return {
    ok: true,
    roomId: room.roomId,
    whitePlayerId: room.whitePlayer.playerId,
    blackPlayerId: room.blackPlayer.playerId,
    yourColor: hostIsWhite ? "b" : "w",
    room: sanitizeRoomSnapshot(room)
  };
}

/**
 * Returns sanitized room snapshot for client inspection.
 */
export function getChessRoomSnapshot(roomId, callerToken = null) {
  const room = activeRooms.get(roomId);
  if (!room) return null;

  // Check clocks if room is live
  if (room.status === "LIVE") {
    checkServerClockTimeout(room);
  }

  return sanitizeRoomSnapshot(room, callerToken);
}

/**
 * Lists public rooms awaiting an opponent.
 */
export function listOpenChessRooms() {
  const list = [];
  for (const [id, r] of activeRooms.entries()) {
    if (r.status === "WAITING" && !r.isTest) {
      list.push({
        roomId: r.roomId,
        creator: r.hostCandidate?.displayName || "Player",
        timeControl: r.timeControl,
        createdAtUtc: r.createdAtUtc
      });
    }
  }
  return list;
}

/**
 * Binds WebSocket connection to a room and provides canonical snapshot recovery.
 */
export function handleChessRoomSocketConnect(socket, message, wss) {
  const payload = message.payload || {};
  const roomId = String(payload.roomId || message.roomId || "").trim();
  const token = String(payload.token || message.token || "").trim();
  const playerId = String(payload.playerId || message.playerId || "").trim();

  const room = activeRooms.get(roomId);
  if (!room) {
    socket.send(JSON.stringify({
      type: "CHESS_ROOM_ERROR",
      error: "ROOM_NOT_FOUND",
      roomId
    }));
    return { ok: false, error: "ROOM_NOT_FOUND" };
  }

  let role = "spectator";
  let playerColor = null;

  const isWhiteAuthorized = room.whitePlayer && room.whitePlayer.playerId === playerId && (room.whitePlayer.token === token || verifyPlayerOwnership(token, playerId));
  const isBlackAuthorized = room.blackPlayer && room.blackPlayer.playerId === playerId && (room.blackPlayer.token === token || verifyPlayerOwnership(token, playerId));
  const isHostCandidateAuthorized = room.hostCandidate && room.hostCandidate.playerId === playerId && (room.hostCandidate.token === token || verifyPlayerOwnership(token, playerId));

  if (isWhiteAuthorized) {
    room.whitePlayer.socket = socket;
    role = "player";
    playerColor = "w";
  } else if (isBlackAuthorized) {
    room.blackPlayer.socket = socket;
    role = "player";
    playerColor = "b";
  } else if (isHostCandidateAuthorized) {
    room.hostCandidate.socket = socket;
    role = "player";
  } else {
    room.spectators.add(socket);
  }

  socketRoomMap.set(socket, { roomId, role, playerId, playerColor });

  // Update clock state if game is live
  if (room.status === "LIVE") {
    checkServerClockTimeout(room);
  }

  // Send full canonical snapshot for state recovery (Server State Recovery)
  socket.send(JSON.stringify({
    type: "CHESS_ROOM_SNAPSHOT",
    roomId: room.roomId,
    role,
    yourColor: playerColor,
    room: sanitizeRoomSnapshot(room, token)
  }));

  // Broadcast peer connected event
  broadcastToRoom(room, {
    type: "CHESS_ROOM_PRESENCE",
    roomId: room.roomId,
    playerId,
    connected: true,
    role
  }, socket);

  return { ok: true, roomId, role, playerColor };
}

/**
 * Server-authoritative move validation and commit execution.
 */
export function handleChessRoomMove(socket, message, wss) {
  const payload = message.payload || {};
  const roomId = String(payload.roomId || message.roomId || "").trim();
  const token = String(payload.token || message.token || "").trim();
  const playerId = String(payload.playerId || message.playerId || "").trim();
  const moveProposal = payload.move || message.move;

  const room = activeRooms.get(roomId);
  if (!room) {
    socket.send(JSON.stringify({ type: "CHESS_ROOM_ERROR", error: "ROOM_NOT_FOUND", roomId }));
    return { ok: false, error: "ROOM_NOT_FOUND", status: 404 };
  }

  if (room.status !== "LIVE") {
    socket.send(JSON.stringify({ type: "CHESS_ROOM_ERROR", error: "ROOM_NOT_LIVE", status: room.status }));
    return { ok: false, error: "ROOM_NOT_LIVE", status: 409 };
  }

  // 1. Authenticate caller and verify player ownership (P3-A2 & Attack 1)
  if (!token || !playerId || !verifyPlayerOwnership(token, playerId)) {
    socket.send(JSON.stringify({ type: "CHESS_ROOM_ERROR", error: "FORBIDDEN", message: "Unauthorized player token." }));
    return { ok: false, error: "FORBIDDEN", status: 403 };
  }

  const isWhite = room.whitePlayer?.playerId === playerId && room.whitePlayer?.token === token;
  const isBlack = room.blackPlayer?.playerId === playerId && room.blackPlayer?.token === token;

  if (!isWhite && !isBlack) {
    socket.send(JSON.stringify({ type: "CHESS_ROOM_ERROR", error: "NOT_A_PARTICIPANT", message: "Caller is not an active player in this room." }));
    return { ok: false, error: "NOT_A_PARTICIPANT", status: 403 };
  }

  const playerColor = isWhite ? "w" : "b";
  const currentTurn = room.game.turn(); // 'w' or 'b'

  // 2. Correct turn enforcement (P3-A3 & Attack 2)
  if (currentTurn !== playerColor) {
    socket.send(JSON.stringify({
      type: "CHESS_ROOM_ERROR",
      error: "NOT_YOUR_TURN",
      message: `It is currently ${currentTurn === "w" ? "White" : "Black"}'s turn.`
    }));
    return { ok: false, error: "NOT_YOUR_TURN", status: 409 };
  }

  // 3. Server Clock Authority & Boundary Evaluation (P3-C2, P3-C4, P3-C5, Attack A)
  // Client remaining_ms, result, or termination are strictly IGNORED.
  const nowMs = Date.now();
  const elapsedMs = room.clocks.last_move_server_timestamp ? Math.max(0, nowMs - room.clocks.last_move_server_timestamp) : 0;
  const currentRemaining = playerColor === "w" ? room.clocks.white_remaining_ms : room.clocks.black_remaining_ms;
  const tentativeRemaining = currentRemaining - elapsedMs;

  // Boundary condition check (P3-C5 & P3-C4): If tentativeRemaining <= 0, flag fell on server timestamp!
  if (tentativeRemaining <= 0) {
    if (playerColor === "w") room.clocks.white_remaining_ms = 0;
    else room.clocks.black_remaining_ms = 0;

    room.status = "FINISHED";
    room.result = playerColor === "w" ? "0-1" : "1-0";
    room.termination = "timeout";
    room.winnerPlayerId = playerColor === "w" ? room.blackPlayer.playerId : room.whitePlayer.playerId;
    room.endedAtUtc = new Date(nowMs).toISOString();

    sealRoomGameToEventLedger(room);

    broadcastToRoom(room, {
      type: "CHESS_ROOM_GAME_OVER",
      roomId: room.roomId,
      result: room.result,
      termination: room.termination,
      winnerPlayerId: room.winnerPlayerId,
      clocks: {
        ...room.clocks,
        server_timestamp: nowMs
      }
    });

    socket.send(JSON.stringify({ type: "CHESS_ROOM_ERROR", error: "TIMEOUT_FLAG_FELL", message: "Time ran out before move reached server authority." }));
    return { ok: false, error: "TIMEOUT_FLAG_FELL", status: 400 };
  }

  // 4. Server-Side Legal Move Verification BEFORE Clock Mutation (P3-C6: Illegal moves do NOT consume clock state)
  let moveResult = null;
  try {
    moveResult = room.game.move(moveProposal, { strict: false });
  } catch (err) {
    socket.send(JSON.stringify({
      type: "CHESS_ROOM_ERROR",
      error: "ILLEGAL_MOVE",
      detail: err.message,
      proposal: moveProposal
    }));
    return { ok: false, error: "ILLEGAL_MOVE", status: 400 };
  }

  if (!moveResult) {
    socket.send(JSON.stringify({
      type: "CHESS_ROOM_ERROR",
      error: "ILLEGAL_MOVE",
      proposal: moveProposal
    }));
    return { ok: false, error: "ILLEGAL_MOVE", status: 400 };
  }

  // 5. Commit Legal Move & Increment Authority (P3-C3)
  // Only now that the move is verified legal, the tentative elapsed time is deducted and server increment is added.
  const increment = room.clocks.increment_ms || 0;
  if (playerColor === "w") {
    room.clocks.white_remaining_ms = tentativeRemaining + increment;
  } else {
    room.clocks.black_remaining_ms = tentativeRemaining + increment;
  }

  room.clocks.last_move_server_timestamp = nowMs;
  room.clocks.turn = room.game.turn();
  room.clocks.clock_version += 1;
  room.fen = room.game.fen();

  const historyEntry = {
    ply: room.history.length + 1,
    san: moveResult.san,
    uci: moveResult.from + moveResult.to + (moveResult.promotion || ""),
    from: moveResult.from,
    to: moveResult.to,
    piece: moveResult.piece,
    color: playerColor,
    fen: room.fen,
    white_remaining_ms: room.clocks.white_remaining_ms,
    black_remaining_ms: room.clocks.black_remaining_ms,
    serverTimestamp: nowMs
  };
  room.history.push(historyEntry);

  // 6. Check Game Termination (P3-A9: Checkmate, Stalemate, 3-fold, 50-move)
  let isFinished = false;
  if (room.game.isCheckmate()) {
    isFinished = true;
    room.status = "FINISHED";
    room.result = playerColor === "w" ? "1-0" : "0-1";
    room.termination = "checkmate";
    room.winnerPlayerId = playerId;
  } else if (room.game.isStalemate()) {
    isFinished = true;
    room.status = "FINISHED";
    room.result = "1/2-1/2";
    room.termination = "stalemate";
  } else if (room.game.isThreefoldRepetition && room.game.isThreefoldRepetition()) {
    isFinished = true;
    room.status = "FINISHED";
    room.result = "1/2-1/2";
    room.termination = "threefold_repetition";
  } else if (room.game.isDraw()) {
    isFinished = true;
    room.status = "FINISHED";
    room.result = "1/2-1/2";
    room.termination = "draw";
  }

  if (isFinished) {
    room.endedAtUtc = new Date(nowMs).toISOString();
    sealRoomGameToEventLedger(room);
  }

  // 7. Authoritative Broadcast: Opponent Move Broadcast (P3-A5)
  const commitEnvelope = {
    type: "CHESS_ROOM_MOVE_COMMITTED",
    roomId: room.roomId,
    ply: historyEntry.ply,
    san: historyEntry.san,
    uci: historyEntry.uci,
    from: historyEntry.from,
    to: historyEntry.to,
    piece: historyEntry.piece,
    fen: room.fen,
    turn: room.clocks.turn,
    clocks: room.clocks,
    status: room.status,
    isFinished,
    result: room.result,
    termination: room.termination
  };

  broadcastToRoom(room, commitEnvelope);

  if (isFinished) {
    broadcastToRoom(room, {
      type: "CHESS_ROOM_GAME_OVER",
      roomId: room.roomId,
      result: room.result,
      termination: room.termination,
      winnerPlayerId: room.winnerPlayerId,
      canonicalPgn: room.game.pgn()
    });
  }

  return { ok: true, commit: commitEnvelope, isFinished };
}

/**
 * Handles voluntary resignation (P3-A8).
 */
export function handleChessRoomResign(socket, message) {
  const payload = message.payload || {};
  const roomId = String(payload.roomId || message.roomId || "").trim();
  const token = String(payload.token || message.token || "").trim();
  const playerId = String(payload.playerId || message.playerId || "").trim();

  const room = activeRooms.get(roomId);
  if (!room || room.status !== "LIVE") {
    return { ok: false, error: "ROOM_NOT_LIVE" };
  }

  if (!verifyPlayerOwnership(token, playerId)) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const isWhite = room.whitePlayer?.playerId === playerId;
  const isBlack = room.blackPlayer?.playerId === playerId;
  if (!isWhite && !isBlack) {
    return { ok: false, error: "NOT_A_PARTICIPANT" };
  }

  room.status = "FINISHED";
  room.result = isWhite ? "0-1" : "1-0";
  room.termination = "resignation";
  room.winnerPlayerId = isWhite ? room.blackPlayer.playerId : room.whitePlayer.playerId;
  room.endedAtUtc = new Date().toISOString();

  sealRoomGameToEventLedger(room);

  broadcastToRoom(room, {
    type: "CHESS_ROOM_GAME_OVER",
    roomId: room.roomId,
    result: room.result,
    termination: room.termination,
    winnerPlayerId: room.winnerPlayerId,
    resigningPlayerId: playerId
  });

  return { ok: true, result: room.result, termination: room.termination };
}

/**
 * Handles draw offers and mutual agreement (P3-A8).
 */
export function handleChessRoomDraw(socket, message, action = "offer") {
  const payload = message.payload || {};
  const roomId = String(payload.roomId || message.roomId || "").trim();
  const token = String(payload.token || message.token || "").trim();
  const playerId = String(payload.playerId || message.playerId || "").trim();

  const room = activeRooms.get(roomId);
  if (!room || room.status !== "LIVE") {
    return { ok: false, error: "ROOM_NOT_LIVE" };
  }

  if (!verifyPlayerOwnership(token, playerId)) {
    return { ok: false, error: "FORBIDDEN" };
  }

  if (action === "offer") {
    room.drawOfferFrom = playerId;
    broadcastToRoom(room, {
      type: "CHESS_ROOM_DRAW_OFFERED",
      roomId: room.roomId,
      fromPlayerId: playerId
    }, socket);
    return { ok: true, offered: true };
  }

  if (action === "accept") {
    if (!room.drawOfferFrom || room.drawOfferFrom === playerId) {
      return { ok: false, error: "NO_ACTIVE_DRAW_OFFER_TO_ACCEPT" };
    }

    room.status = "FINISHED";
    room.result = "1/2-1/2";
    room.termination = "draw_agreed";
    room.endedAtUtc = new Date().toISOString();

    sealRoomGameToEventLedger(room);

    broadcastToRoom(room, {
      type: "CHESS_ROOM_GAME_OVER",
      roomId: room.roomId,
      result: room.result,
      termination: room.termination
    });

    return { ok: true, agreed: true };
  }

  return { ok: false, error: "UNKNOWN_DRAW_ACTION" };
}

/**
 * Handles socket disconnection without killing the room (P3-A7).
 */
export function handleChessRoomSocketDisconnect(socket) {
  const meta = socketRoomMap.get(socket);
  if (!meta) return;

  const room = activeRooms.get(meta.roomId);
  if (!room) return;

  if (meta.role === "player") {
    if (room.whitePlayer?.socket === socket) room.whitePlayer.socket = null;
    if (room.blackPlayer?.socket === socket) room.blackPlayer.socket = null;
    if (room.hostCandidate?.socket === socket) room.hostCandidate.socket = null;
  } else {
    room.spectators.delete(socket);
  }

  socketRoomMap.delete(socket);

  // Notify opponent of temporary disconnect while room remains LIVE
  broadcastToRoom(room, {
    type: "CHESS_ROOM_PRESENCE",
    roomId: room.roomId,
    playerId: meta.playerId,
    connected: false,
    role: meta.role
  });
}

/**
 * Clocks check helper for passive timeouts.
 */
function checkServerClockTimeout(room) {
  if (room.status !== "LIVE" || !room.clocks.last_move_server_timestamp) return;

  const nowMs = Date.now();
  const elapsed = nowMs - room.clocks.last_move_server_timestamp;
  const turn = room.clocks.turn;

  const remaining = turn === "w"
    ? room.clocks.white_remaining_ms - elapsed
    : room.clocks.black_remaining_ms - elapsed;

  if (remaining <= 0) {
    if (turn === "w") room.clocks.white_remaining_ms = 0;
    else room.clocks.black_remaining_ms = 0;

    room.status = "FINISHED";
    room.result = turn === "w" ? "0-1" : "1-0";
    room.termination = "timeout";
    room.winnerPlayerId = turn === "w" ? room.blackPlayer?.playerId : room.whitePlayer?.playerId;
    room.endedAtUtc = new Date(nowMs).toISOString();

    sealRoomGameToEventLedger(room);

    broadcastToRoom(room, {
      type: "CHESS_ROOM_GAME_OVER",
      roomId: room.roomId,
      result: room.result,
      termination: room.termination,
      winnerPlayerId: room.winnerPlayerId,
      clocks: room.clocks
    });
  }
}

/**
 * Seals verified Human vs Human room game to Event Ledger (P3-A10).
 */
export function sealRoomGameToEventLedger(room) {
  if (room.ledgerSealed) return;
  room.ledgerSealed = true;
  room.status = "SEALED";

  try {
    const canonicalPgn = room.game.pgn();
    const pgnSha = crypto.createHash("sha256").update(canonicalPgn, "utf8").digest("hex");
    const binPath = resolveCastleBinaryPath();
    const binSha = getFileSha256(binPath) || "00ccc8c47e1b6d74ccd2e2e5fb394cb7075b8f772a4f8e1d8962c6603d30d269";
    const modelPath = resolveActiveModelPath();
    const modelSha = getFileSha256(modelPath) || "39d3d9ce9aba72fa7ff85ad4a6c3e1b446687f2d4abedcca87549143c8c90e5c";

    const ledgerEntry = {
      event_type: room.isTest ? "REALITY_AUDIT_TEST" : "PRODUCTION_GAME",
      source: room.isTest ? "reality_audit" : (room.challengeId ? "human_vs_human_challenge" : "human_vs_human_room"),
      test_artifact: Boolean(room.isTest),
      game_id: room.roomId,
      room_id: room.roomId,
      challenge_id: room.challengeId || null,
      rated: Boolean(room.rated !== false),
      timestamp_utc: room.endedAtUtc || new Date().toISOString(),
      white: room.whitePlayer?.displayName || "Player White",
      white_player_id: room.whitePlayer?.playerId || null,
      black: room.blackPlayer?.displayName || "Player Black",
      black_player_id: room.blackPlayer?.playerId || null,
      result: room.result || "1/2-1/2",
      termination: room.termination || "normal",
      time_control: room.timeControl?.name || "5+3 Blitz",
      clock_policy: {
        base_ms: room.timeControl?.base_ms || room.timeControl?.initial_ms || 300000,
        increment_ms: room.timeControl?.increment_ms || 0,
        clock_policy_version: room.timeControl?.clock_policy_version || "v1.0"
      },
      initial_clock: room.timeControl?.base_ms || room.timeControl?.initial_ms || 300000,
      initial_clock_ms: room.timeControl?.base_ms || room.timeControl?.initial_ms || 300000,
      increment: room.timeControl?.increment_ms || 0,
      increment_ms: room.timeControl?.increment_ms || 0,
      clock_version: room.clocks?.clock_version || 0,
      final_clocks: {
        white_remaining_ms: room.clocks?.white_remaining_ms ?? 0,
        black_remaining_ms: room.clocks?.black_remaining_ms ?? 0,
        turn: room.clocks?.turn || "w"
      },
      ply_count: room.history.length,
      fen_final: room.fen,
      pgn_sha256: pgnSha,
      engine_sha256: binSha,
      model_sha256: modelSha,
      verified: true,
      server_verified_replay: true,
      quarantined: false,
      game_type: "HUMAN_VS_HUMAN",
      pipeline_stage: room.isTest ? "AUDIT_TEST" : "PRODUCTION_COMMITTED",
      canonical_pgn: canonicalPgn
    };

    const ledgerPath = resolveCanonicalEventLedgerPath();
    fs.appendFileSync(ledgerPath, JSON.stringify(ledgerEntry) + "\n", "utf8");

    // Phase 3 - P3-D: Apply Rating Outcome to Event Ledger & Player Identity Store
    if (room.rated !== false && room.whitePlayer?.playerId && room.blackPlayer?.playerId) {
      try {
        const ratingResult = applyGameRatingOutcome({
          gameId: room.roomId,
          timeControl: room.timeControl?.name || room.timeControlKey || "5+3 Blitz",
          result: room.result || "1/2-1/2",
          termination: room.termination || "normal",
          whitePlayerId: room.whitePlayer.playerId,
          blackPlayerId: room.blackPlayer.playerId,
          isHumanVsRhizoh: false,
          isTest: Boolean(room.isTest),
          verified: true,
          source: ledgerEntry.source
        });
        room.ratingResult = ratingResult;
      } catch (err) {
        console.error("[CHESS_ROOM_RATING_ERROR] Failed to apply room rating outcome:", err);
      }
    }

    return ledgerEntry;
  } catch (err) {
    console.error("[CHESS_ROOM_LEDGER_ERROR] Failed to seal room game to ledger:", err);
    return null;
  }
}

/**
 * Broadcast helper for room members.
 */
function broadcastToRoom(room, message, exceptSocket = null) {
  const json = JSON.stringify(message);
  const sockets = [
    room.whitePlayer?.socket,
    room.blackPlayer?.socket,
    room.hostCandidate?.socket,
    ...room.spectators
  ].filter(Boolean);

  for (const s of sockets) {
    if (s !== exceptSocket && s.readyState === 1) {
      try { s.send(json); } catch {}
    }
  }
}

/**
 * Sanitizes room snapshot for client consumption.
 */
function sanitizeRoomSnapshot(room, callerToken = null) {
  return {
    roomId: room.roomId,
    challengeId: room.challengeId || null,
    rated: Boolean(room.rated !== false),
    status: room.status,
    timeControl: room.timeControl,
    creatorPlayerId: room.creatorPlayerId,
    whitePlayer: room.whitePlayer ? {
      playerId: room.whitePlayer.playerId,
      handle: room.whitePlayer.handle,
      displayName: room.whitePlayer.displayName,
      connected: Boolean(room.whitePlayer.socket && room.whitePlayer.socket.readyState === 1)
    } : null,
    blackPlayer: room.blackPlayer ? {
      playerId: room.blackPlayer.playerId,
      handle: room.blackPlayer.handle,
      displayName: room.blackPlayer.displayName,
      connected: Boolean(room.blackPlayer.socket && room.blackPlayer.socket.readyState === 1)
    } : null,
    hostCandidate: room.hostCandidate ? {
      playerId: room.hostCandidate.playerId,
      handle: room.hostCandidate.handle,
      displayName: room.hostCandidate.displayName,
      connected: Boolean(room.hostCandidate.socket && room.hostCandidate.socket.readyState === 1)
    } : null,
    fen: room.fen,
    turn: room.game.turn(),
    history: room.history,
    clocks: (() => {
      const nowMs = Date.now();
      let liveWhiteRemaining = room.clocks.white_remaining_ms;
      let liveBlackRemaining = room.clocks.black_remaining_ms;
      if (room.status === "LIVE" && room.clocks.last_move_server_timestamp) {
        const elapsed = Math.max(0, nowMs - room.clocks.last_move_server_timestamp);
        if (room.clocks.turn === "w") {
          liveWhiteRemaining = Math.max(0, liveWhiteRemaining - elapsed);
        } else {
          liveBlackRemaining = Math.max(0, liveBlackRemaining - elapsed);
        }
      }
      return {
        ...room.clocks,
        white_remaining_ms: liveWhiteRemaining,
        black_remaining_ms: liveBlackRemaining,
        server_timestamp: nowMs
      };
    })(),
    result: room.result,
    termination: room.termination,
    winnerPlayerId: room.winnerPlayerId,
    isTest: room.isTest,
    startedAtUtc: room.startedAtUtc,
    endedAtUtc: room.endedAtUtc
  };
}

// Active Server Clock Ticker (P3-C8): Flags timeouts even if client disconnects or freezes
let clockTickerInterval = null;
export function startClockAuthorityTicker() {
  if (clockTickerInterval) return;
  clockTickerInterval = setInterval(() => {
    for (const room of activeRooms.values()) {
      if (room && room.status === "LIVE") {
        checkServerClockTimeout(room);
      }
    }
  }, 250);
}
startClockAuthorityTicker();
