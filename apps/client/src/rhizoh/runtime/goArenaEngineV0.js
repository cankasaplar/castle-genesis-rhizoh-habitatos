/**
 * Go arena engine v0 — minimal board state + demo move stream for learning skeleton.
 * RESEARCH-ONLY — not a rules-complete Go engine; KataGo bridge is future work.
 */

export const GO_ARENA_ENGINE_SCHEMA_V0 = "castle.rhizoh.go_arena_engine.v0";
export const GO_ARENA_MOVE_EVENT_V0 = "rhizoh:go-arena-move-v0";

const BOARD_SIZE_V0 = 19;

/** @type {Map<string, 'B'|'W'>} */
const stonesV0 = new Map();
let moveCountV0 = 0;
let activeColorV0 = "B";

function coordKeyV0(x, y) {
  return `${x},${y}`;
}

function boardHashV0() {
  const keys = [...stonesV0.keys()].sort();
  return `go19:${keys.map((k) => `${k}=${stonesV0.get(k)}`).join("|") || "empty"}`;
}

/**
 * @param {{ x?: number, y?: number, color?: 'B'|'W' }} [move]
 */
export function applyGoArenaMoveV0(move = {}) {
  const x = Number(move.x);
  const y = Number(move.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y >= BOARD_SIZE_V0) {
    return Object.freeze({ ok: false, reason: "invalid_coord" });
  }
  const color = move.color === "W" ? "W" : activeColorV0;
  const key = coordKeyV0(x, y);
  if (stonesV0.has(key)) {
    return Object.freeze({ ok: false, reason: "occupied" });
  }
  stonesV0.set(key, color);
  moveCountV0 += 1;
  activeColorV0 = color === "B" ? "W" : "B";

  const detail = Object.freeze({
    schema: GO_ARENA_ENGINE_SCHEMA_V0,
    move: Object.freeze({ x, y, color, n: moveCountV0 }),
    boardHash: boardHashV0(),
    moveCount: moveCountV0,
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(GO_ARENA_MOVE_EVENT_V0, { detail }));
  }

  return Object.freeze({ ok: true, ...detail });
}

export function getGoArenaEngineSnapshotV0() {
  return Object.freeze({
    schema: `${GO_ARENA_ENGINE_SCHEMA_V0}.snapshot`,
    boardSize: BOARD_SIZE_V0,
    moveCount: moveCountV0,
    activeColor: activeColorV0,
    boardHash: boardHashV0(),
    stoneCount: stonesV0.size,
    atMs: Date.now()
  });
}

/**
 * @returns {ReadonlyArray<{ x: number, y: number, color: 'B'|'W' }>}
 */
export function listGoArenaStonesV0() {
  return Object.freeze(
    [...stonesV0.entries()].map(([key, color]) => {
      const [x, y] = key.split(",").map(Number);
      return Object.freeze({ x, y, color });
    })
  );
}

/** @internal vitest */
export function resetGoArenaEngineForTestV0() {
  stonesV0.clear();
  moveCountV0 = 0;
  activeColorV0 = "B";
}
