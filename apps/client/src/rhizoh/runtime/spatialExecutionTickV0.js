/**
 * Spatial execution tick — graph diff consume + spatial emitter commit loop.
 * RESEARCH-ONLY — closes graph→space without replacing epistemic causal runtime.
 *
 * @see causalGraphSpatialBridgeV0.js
 * @see rhizohSpatialEventEmitterV0.js
 * @see spatialWorldSpaceFlushV0.js
 */

import { consumeCausalGraphDiffV0 } from './causalGraphSpatialBridgeV0.js';
import { flushSpatialEmitterCommitsV0 } from './rhizohSpatialEventEmitterV0.js';
import { flushSpatialWorldSpaceBufferV0 } from './spatialWorldSpaceFlushV0.js';
import { isSpatialWorldSyncReadyV0 } from './spatialWorldSyncV0.js';

const DEFAULT_INTERVAL_MS = 50;

let tickTimer = null;
let tickCount = 0;
let lastTickAtMs = 0;
let lastConsume = null;
let lastFlush = null;
let lastWorldFlush = null;

function publishSpatialExecutionTick() {
  if (typeof window === 'undefined') return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.spatialExecutionTick = Object.freeze({
    intervalMs: DEFAULT_INTERVAL_MS,
    running: tickTimer != null,
    tickCount,
    lastTickAtMs,
    lastConsume,
    lastFlush,
    lastWorldFlush,
    worldSyncReady: isSpatialWorldSyncReadyV0(),
    runOnce: runSpatialExecutionTickOnceV0,
    start: startSpatialExecutionTickV0,
    stop: stopSpatialExecutionTickV0,
  });
}

/**
 * Single spatial execution tick: consume graph diff → commit staged emits → flush world buffer.
 */
export function runSpatialExecutionTickOnceV0() {
  const atMs = Date.now();
  lastTickAtMs = atMs;
  tickCount += 1;

  lastConsume = consumeCausalGraphDiffV0({ atMs });
  lastFlush = flushSpatialEmitterCommitsV0({ atMs });
  lastWorldFlush = flushSpatialWorldSpaceBufferV0({ atMs, force: true });

  publishSpatialExecutionTick();
  return Object.freeze({
    ok: true,
    atMs,
    tickCount,
    consume: lastConsume,
    flush: lastFlush,
    worldFlush: lastWorldFlush,
  });
}

/**
 * Start 50ms spatial execution loop (idempotent).
 */
export function startSpatialExecutionTickV0({ intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  if (typeof window === 'undefined') return { ok: false, reason: 'no_window' };
  if (tickTimer != null) {
    publishSpatialExecutionTick();
    return { ok: true, already: true, intervalMs };
  }

  tickTimer = setInterval(() => {
    try {
      runSpatialExecutionTickOnceV0();
    } catch (err) {
      console.warn('[Rhizoh][spatialExecutionTick] tick failed', err?.message || err);
    }
  }, intervalMs);

  runSpatialExecutionTickOnceV0();
  publishSpatialExecutionTick();
  return { ok: true, started: true, intervalMs };
}

/**
 * Stop spatial execution loop.
 */
export function stopSpatialExecutionTickV0() {
  if (tickTimer != null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  publishSpatialExecutionTick();
  return { ok: true, stopped: true };
}

export function getSpatialExecutionTickSnapshotV0() {
  return Object.freeze({
    intervalMs: DEFAULT_INTERVAL_MS,
    running: tickTimer != null,
    tickCount,
    lastTickAtMs,
    lastConsume,
    lastFlush,
    lastWorldFlush,
    worldSyncReady: isSpatialWorldSyncReadyV0(),
  });
}
