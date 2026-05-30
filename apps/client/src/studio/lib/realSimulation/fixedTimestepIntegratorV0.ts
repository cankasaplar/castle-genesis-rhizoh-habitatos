/**
 * Fixed timestep accumulator — optional rollback ring stores opaque snapshots.
 */

export type FixedTimestepAccumulatorV0 = {
  accMs: number;
  fixedDtMs: number;
};

export function createFixedTimestepAccumulatorV0(fixedDtMs: number): FixedTimestepAccumulatorV0 {
  return { accMs: 0, fixedDtMs };
}

/** @returns number of physics substeps to run this frame (capped). */
export function pumpFixedTimestepV0(acc: FixedTimestepAccumulatorV0, dtMs: number, maxSteps = 5): number {
  acc.accMs += dtMs;
  let n = 0;
  while (acc.accMs >= acc.fixedDtMs && n < maxSteps) {
    acc.accMs -= acc.fixedDtMs;
    n += 1;
  }
  return n;
}

/** FIFO rollback buffer — oldest dropped when over cap. */
export type RollbackQueueV0<T> = { cap: number; frames: T[] };

export function createRollbackQueueV0<T>(cap: number): RollbackQueueV0<T> {
  return { cap: Math.max(1, cap | 0), frames: [] };
}

export function pushRollbackQueueV0<T>(q: RollbackQueueV0<T>, snap: T): void {
  q.frames.push(snap);
  while (q.frames.length > q.cap) q.frames.shift();
}

/** steps=1 → snapshot one frame before the newest recorded. */
export function rewindRollbackQueueV0<T>(q: RollbackQueueV0<T>, steps: number): T | null {
  if (steps < 1 || q.frames.length < steps + 1) return null;
  const idx = q.frames.length - 1 - steps;
  return q.frames[idx] ?? null;
}
