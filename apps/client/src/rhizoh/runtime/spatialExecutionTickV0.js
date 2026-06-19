/**
 * Spatial execution tick — delegates to Spatial Execution Governor.
 * @see spatialExecutionGovernorV0.js
 */

import { runSpatialExecutionGovernorTickV0 } from './spatialExecutionGovernorV0.js';
import { isSpatialWorldSyncReadyV0 } from './spatialWorldSyncV0.js';

const DEFAULT_INTERVAL_MS = 50;

let tickTimer = null;
let tickCount = 0;
let lastTickAtMs = 0;
let lastGovernorTick = null;

function publishSpatialExecutionTick() {
  if (typeof window === 'undefined') return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.spatialExecutionTick = Object.freeze({
    intervalMs: DEFAULT_INTERVAL_MS,
    running: tickTimer != null,
    tickCount,
    lastTickAtMs,
    lastGovernorTick,
    worldSyncReady: isSpatialWorldSyncReadyV0(),
    runOnce: runSpatialExecutionTickOnceV0,
    start: startSpatialExecutionTickV0,
    stop: stopSpatialExecutionTickV0,
  });
}

/**
 * Single spatial execution tick — governor orchestrates emitter activation.
 */
export function runSpatialExecutionTickOnceV0() {
  const atMs = Date.now();
  lastTickAtMs = atMs;
  tickCount += 1;

  lastGovernorTick = runSpatialExecutionGovernorTickV0({ atMs });

  publishSpatialExecutionTick();
  return Object.freeze({
    ok: true,
    atMs,
    tickCount,
    governor: lastGovernorTick,
    consume: lastGovernorTick?.emitterTick?.consume ?? null,
    flush: lastGovernorTick?.emitterTick?.flush ?? null,
    worldFlush: lastGovernorTick?.emitterTick?.worldFlush ?? null
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
    lastGovernorTick,
    worldSyncReady: isSpatialWorldSyncReadyV0()
  });
}
