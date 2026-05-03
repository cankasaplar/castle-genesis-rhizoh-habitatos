/**
 * Temporal isolation — physics (fast lane) vs memory / consolidation (buffered & delayed).
 * Avoids coupling slow work to the 250ms spine call stack so jitter does not infect CSPE.
 */

/**
 * @param {() => void} fn
 * @param {{ delayMs?: number, idleTimeoutMs?: number }} [opts]
 *   delayMs > 0 → delayed lane (consolidation). Else → idle-coalesced lane (memory).
 */
export function scheduleCastleFieldDeferredTask(fn, opts = {}) {
  const delayMs = Math.max(0, Number(opts.delayMs) || 0);
  const idleTimeoutMs = Math.min(280, Math.max(50, Number(opts.idleTimeoutMs) || 120));
  const wrap = () => {
    try {
      fn();
    } catch (err) {
      console.error("[CASTLE_FIELD_DEFERRED]", err);
    }
  };
  if (delayMs > 0) {
    window.setTimeout(wrap, delayMs);
    return;
  }
  const ric = window.requestIdleCallback;
  if (typeof ric === "function") {
    ric(() => wrap(), { timeout: idleTimeoutMs });
  } else {
    window.setTimeout(wrap, 0);
  }
}

/** @returns {{ busy: boolean, skipped: number, lastPhysicsMs: number }} */
export function createFieldTickBackpressure() {
  return {
    busy: false,
    skipped: 0,
    lastPhysicsMs: 0
  };
}

/**
 * @template T
 * @param {{ busy: boolean, skipped: number, lastPhysicsMs: number }} bp
 * @param {() => T} run
 * @returns {T | null}
 */
export function withFieldPhysicsBackpressure(bp, run) {
  if (!bp || bp.busy) {
    if (bp) bp.skipped += 1;
    return null;
  }
  bp.busy = true;
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    return run();
  } finally {
    bp.busy = false;
    if (typeof performance !== "undefined") {
      bp.lastPhysicsMs = performance.now() - t0;
    } else {
      bp.lastPhysicsMs = Date.now() - t0;
    }
  }
}
