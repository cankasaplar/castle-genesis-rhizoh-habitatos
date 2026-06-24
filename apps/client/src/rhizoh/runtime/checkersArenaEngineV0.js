/**
 * Checkers arena engine v0 — minimal 8×8 demo board. RESEARCH-ONLY
 */

export const CHECKERS_ARENA_ENGINE_SCHEMA_V0 = "castle.rhizoh.checkers_arena_engine.v0";
export const CHECKERS_ARENA_MOVE_EVENT_V0 = "rhizoh:checkers-arena-move-v0";

const BOARD_SIZE_V0 = 8;

/** @type {Map<string, 'R'|'B'>} */
const piecesV0 = new Map();
let moveCountV0 = 0;
let activeColorV0 = "R";

function coordKeyV0(x, y) {
  return `${x},${y}`;
}

function boardHashV0() {
  const keys = [...piecesV0.keys()].sort();
  return `chk8:${keys.map((k) => `${k}=${piecesV0.get(k)}`).join("|") || "empty"}`;
}

/**
 * @param {{ x?: number, y?: number, color?: 'R'|'B' }} [move]
 */
export function applyCheckersArenaMoveV0(move = {}) {
  const x = Number(move.x);
  const y = Number(move.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y >= BOARD_SIZE_V0) {
    return Object.freeze({ ok: false, reason: "invalid_coord" });
  }
  const color = move.color === "B" ? "B" : activeColorV0;
  const key = coordKeyV0(x, y);
  if (piecesV0.has(key)) {
    return Object.freeze({ ok: false, reason: "occupied" });
  }
  piecesV0.set(key, color);
  moveCountV0 += 1;
  activeColorV0 = color === "R" ? "B" : "R";

  const detail = Object.freeze({
    schema: CHECKERS_ARENA_ENGINE_SCHEMA_V0,
    move: Object.freeze({ x, y, color, n: moveCountV0 }),
    boardHash: boardHashV0(),
    moveCount: moveCountV0,
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHECKERS_ARENA_MOVE_EVENT_V0, { detail }));
  }

  return Object.freeze({ ok: true, ...detail });
}

export function getCheckersArenaEngineSnapshotV0() {
  return Object.freeze({
    schema: `${CHECKERS_ARENA_ENGINE_SCHEMA_V0}.snapshot`,
    boardSize: BOARD_SIZE_V0,
    moveCount: moveCountV0,
    activeColor: activeColorV0,
    boardHash: boardHashV0(),
    pieceCount: piecesV0.size,
    atMs: Date.now()
  });
}

/**
 * @returns {ReadonlyArray<{ x: number, y: number, color: 'R'|'B' }>}
 */
export function listCheckersArenaPiecesV0() {
  return Object.freeze(
    [...piecesV0.entries()].map(([key, color]) => {
      const [x, y] = key.split(",").map(Number);
      return Object.freeze({ x, y, color });
    })
  );
}

/** @internal vitest */
export function resetCheckersArenaEngineForTestV0() {
  piecesV0.clear();
  moveCountV0 = 0;
  activeColorV0 = "R";
}
