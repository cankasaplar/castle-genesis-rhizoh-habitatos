/**
 * Strict replay ordering — incoming tick must be lastProcessed + 1.
 */

/**
 * @param {number | null | undefined} lastProcessedTick
 * @param {number} incomingTick
 */
export function assertNextReplayTickV0(lastProcessedTick, incomingTick) {
  const last = lastProcessedTick == null ? -1 : Number(lastProcessedTick);
  const next = Number(incomingTick);
  if (!Number.isFinite(next)) {
    return { ok: false, code: "replay_order_violation", reason: "tick_invalid" };
  }
  if (next !== last + 1) {
    return {
      ok: false,
      code: "replay_order_violation",
      expectedTick: last + 1,
      incomingTick: next
    };
  }
  return { ok: true };
}

/**
 * Stateful replay cursor for apply loop.
 */
export function createReplayApplyCursorV0() {
  let lastProcessedTick = -1;
  return {
    get lastProcessedTick() {
      return lastProcessedTick;
    },
    /** @param {number} incomingTick */
    assertNext(incomingTick) {
      const r = assertNextReplayTickV0(lastProcessedTick, incomingTick);
      if (r.ok) lastProcessedTick = Number(incomingTick);
      return r;
    },
    reset() {
      lastProcessedTick = -1;
    }
  };
}
