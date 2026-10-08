import { apiFetch } from "./client.js";

export const chessApi = {
  /** Health & Engine Identity verification */
  getHealth: () => apiFetch("/api/chess/health"),

  /** Request best move from Castle Core engine */
  getMove: ({ fen, movetime = 100, wtime, btime, winc = 0, binc = 0, moves = [], useBook = true }) =>
    apiFetch("/api/chess/move", {
      method: "POST",
      body: { fen, movetime, wtime, btime, winc, binc, moves, useBook }
    }),

  /** Game completion & PGN persistence */
  completeGame: (gameData) =>
    apiFetch("/api/chess/game/complete", {
      method: "POST",
      body: gameData
    }),

  /** PGN Chronicle Archive */
  getChronicle: (page = 1, limit = 20) =>
    apiFetch(`/api/chess/chronicle?page=${page}&limit=${limit}`),

  /** Puzzle System */
  getNextPuzzle: (rating = 1500) =>
    apiFetch(`/api/chess/puzzle/next?rating=${rating}`),

  solvePuzzle: (puzzleId, moves) =>
    apiFetch("/api/chess/puzzle/solve", {
      method: "POST",
      body: { puzzleId, moves }
    }),

  getPuzzleStats: () =>
    apiFetch("/api/chess/puzzle/stats"),

  /** Leaderboards & Ratings */
  getLeaderboard: () =>
    apiFetch("/api/chess/leaderboard"),

  /** Rooms & Live Play */
  getRooms: () =>
    apiFetch("/api/chess/room/list"),

  createRoom: (params) =>
    apiFetch("/api/chess/room/create", {
      method: "POST",
      body: params
    }),

  joinRoom: (roomId, player) =>
    apiFetch("/api/chess/room/join", {
      method: "POST",
      body: { roomId, player }
    })
};
