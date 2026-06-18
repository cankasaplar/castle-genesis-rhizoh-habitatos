/**
 * Chess scheduler unify — single global lock + 900ms throttle (window.__rhizoh).
 * Closes race between adaptive cluster tick and overlapping WASM engine calls.
 * RESEARCH-ONLY
 */

export const CHESS_SCHEDULER_UNIFY_SCHEMA_V0 = "castle.rhizoh.chess_scheduler_unify.v0";
export const CHESS_SCHEDULER_MIN_GAP_MS_V0 = 900;

let releaseTimerV0 = null;

function ensureRhizohChessSchedulerNamespaceV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (window.__rhizoh.chessLock == null) window.__rhizoh.chessLock = false;
  if (window.__rhizoh.lastChessCall == null) window.__rhizoh.lastChessCall = 0;
  return window.__rhizoh;
}

export function getChessSchedulerUnifySnapshotV0() {
  const ns = ensureRhizohChessSchedulerNamespaceV0();
  return Object.freeze({
    schema: CHESS_SCHEDULER_UNIFY_SCHEMA_V0,
    chessLock: Boolean(ns?.chessLock),
    lastChessCall: Number(ns?.lastChessCall) || 0,
    minGapMs: CHESS_SCHEDULER_MIN_GAP_MS_V0,
    atMs: Date.now()
  });
}

function publishChessSchedulerUnifyRegistryV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessScheduler = getChessSchedulerUnifySnapshotV0();
}

/**
 * Global chess engine gate — returns false when locked or inside throttle window.
 * @param {{ minGapMs?: number, testFast?: boolean }} [opts]
 */
export function tryBeginChessSchedulerCallV0(opts = {}) {
  const ns = ensureRhizohChessSchedulerNamespaceV0();
  if (!ns) return true;

  const minGap = opts.testFast
    ? Math.max(20, Number(opts.minGapMs) || 50)
    : Math.max(CHESS_SCHEDULER_MIN_GAP_MS_V0, Number(opts.minGapMs) || CHESS_SCHEDULER_MIN_GAP_MS_V0);

  if (ns.chessLock) return false;

  const now = Date.now();
  const lastCall = Number(ns.lastChessCall) || 0;
  if (now - lastCall < minGap) return false;

  ns.lastChessCall = now;
  ns.chessLock = true;
  publishChessSchedulerUnifyRegistryV0();
  return true;
}

/**
 * Release chess lock after cooldown (default 900ms).
 * @param {{ releaseMs?: number, testFast?: boolean }} [opts]
 */
export function endChessSchedulerCallV0(opts = {}) {
  const ns = ensureRhizohChessSchedulerNamespaceV0();
  if (!ns) return;

  const releaseMs = opts.testFast
    ? Math.max(20, Number(opts.releaseMs) || 50)
    : Math.max(CHESS_SCHEDULER_MIN_GAP_MS_V0, Number(opts.releaseMs) || CHESS_SCHEDULER_MIN_GAP_MS_V0);

  if (releaseTimerV0) clearTimeout(releaseTimerV0);
  releaseTimerV0 = setTimeout(() => {
    releaseTimerV0 = null;
    if (typeof window !== "undefined" && window.__rhizoh) {
      window.__rhizoh.chessLock = false;
      publishChessSchedulerUnifyRegistryV0();
    }
  }, releaseMs);
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ minGapMs?: number, releaseMs?: number, testFast?: boolean }} [opts]
 */
export async function runWithChessSchedulerLockV0(fn, opts = {}) {
  if (!tryBeginChessSchedulerCallV0(opts)) return null;
  try {
    return await fn();
  } finally {
    endChessSchedulerCallV0(opts);
  }
}

/** @internal vitest */
export function __resetChessSchedulerUnifyForTestV0() {
  if (releaseTimerV0) {
    clearTimeout(releaseTimerV0);
    releaseTimerV0 = null;
  }
  if (typeof window !== "undefined" && window.__rhizoh) {
    window.__rhizoh.chessLock = false;
    window.__rhizoh.lastChessCall = 0;
    delete window.__rhizoh.chessScheduler;
  }
}
