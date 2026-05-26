/**
 * B3 — Live runtime orchestrator (v0): tek ritim (heartbeat) altında
 * hava stale kontrolü → world presence → projection → yüzeyler (+ isteğe bağlı Cesium tüketici tetik).
 *
 * **Temporal consistency lock:** `liveRuntimeTemporalLockV0` — tick drift, missed-frame Cesium recovery,
 * `setTimeout` ile lag telafisi, Cesium sink süre / sync lag ölçümü.
 *
 * - **Perception / B2 bu dosyada yok** (gözlem katmanı ayrı saat).
 * - Cesium **state üretmez**; yalnızca kayıtlı `requestRender` sink’i ile **tüketici** senkronu.
 * - İsteğe bağlı **projection consumer** (`registerLiveRuntimeProjectionConsumerV0`) — Cesium/map gibi görsel
 *   tüketicilere `state` + `hints` verir; yine **truth üretmez** (sadece tüketim).
 * - `worldPresenceState` mutate edilmez.
 *
 * @see liveRuntimeStreamingCoreV0.js — tek zincir giriş noktası (barrel)
 *
 * @see liveRuntimeTemporalLockV0.js
 * @see RhizohAtmosphereRuntime.jsx
 * @see worldExecutionGateV0.js
 */

import {
  refreshWeatherAtmosphereFeedIfStaleV0,
  getCachedWeatherAtmosphereFeedV0
} from "./worldPresenceStoreV0.js";
import { buildWorldPresenceStateV0 } from "./worldPresenceRuntimeV0.js";
import {
  deriveProjectionHintsV0,
  applyProjectionHintsToHostV0,
  applyProjectionHintsToCastleAuraSurfaceV0
} from "./sceneProjectionAdapterV0.js";
import { smoothProjectionHintsV0 } from "./projectionSmoothingV0.js";
import {
  beginLiveRuntimeOrchestratorTickTemporalV0,
  clampLiveRuntimeOrchestratorIntervalMsV0,
  completeLiveRuntimeOrchestratorTickTemporalV0,
  getLiveRuntimeTemporalSnapshotV0,
  resetLiveRuntimeTemporalLockForTestsV0
} from "./liveRuntimeTemporalLockV0.js";
import {
  getWorldExecutionModeV0,
  isWorldExecutionOffV0
} from "./worldExecutionGateV0.js";
import { clearAtmosphereRuntimeLastTickForUiV0 } from "./atmosphereRuntimeSnapshotV0.js";
import { resetObservationLaneDriftForTestsV0 } from "./observationLaneDriftV0.js";

/** Varsayılan tick: projection + Cesium requestRender için anlamlı; hâlâ TTL ile ağ kısıtlı. */
export const LIVE_RUNTIME_ORCHESTRATOR_DEFAULT_TICK_MS = 4000;

/** @type {import("./sceneProjectionAdapterV0.js").ProjectionHintsV0 | null} */
let _smoothedProjectionHints = null;

/** @type {(() => void) | null} */
let _cesiumRenderSink = null;

/**
 * Optional: receives `{ state, hints }` each ACTIVE tick after DOM projection apply (smoothed hints).
 * @type {null | ((io: { state: unknown, hints: import("./sceneProjectionAdapterV0.js").ProjectionHintsV0 }) => void)}
 */
let _liveRuntimeProjectionConsumer = null;

export function registerLiveRuntimeCesiumRenderSinkV0(fn) {
  _cesiumRenderSink = typeof fn === "function" ? fn : null;
}

export function unregisterLiveRuntimeCesiumRenderSinkV0() {
  _cesiumRenderSink = null;
}

/**
 * @param {null | ((io: { state: unknown, hints: import("./sceneProjectionAdapterV0.js").ProjectionHintsV0 }) => void)} fn
 */
export function registerLiveRuntimeProjectionConsumerV0(fn) {
  _liveRuntimeProjectionConsumer = typeof fn === "function" ? fn : null;
}

export function unregisterLiveRuntimeProjectionConsumerV0() {
  _liveRuntimeProjectionConsumer = null;
}

export function clearLiveRuntimeOrchestratorProjectionStateV0() {
  _smoothedProjectionHints = null;
}

/**
 * @internal Vitest — effector smoothing belleği; PASSIVE tick’ler bunu değiştirmemeli.
 * @returns {import("./sceneProjectionAdapterV0.js").ProjectionHintsV0 | null}
 */
export function getSmoothedProjectionHintsSnapshotForTestsV0() {
  return _smoothedProjectionHints;
}

export function resetLiveRuntimeOrchestratorForTestsV0() {
  clearLiveRuntimeOrchestratorProjectionStateV0();
  unregisterLiveRuntimeCesiumRenderSinkV0();
  unregisterLiveRuntimeProjectionConsumerV0();
  resetLiveRuntimeTemporalLockForTestsV0();
  clearAtmosphereRuntimeLastTickForUiV0();
  resetObservationLaneDriftForTestsV0();
}

function notifyLiveRuntimeProjectionConsumersV0(io) {
  try {
    _liveRuntimeProjectionConsumer?.(io);
  } catch {
    /* noop */
  }
}

/** @param {number} [times] */
function requestCesiumRenderViaSinkV0(times = 1) {
  const n = Math.min(4, Math.max(1, times));
  for (let i = 0; i < n; i++) {
    try {
      _cesiumRenderSink?.();
    } catch {
      /* noop */
    }
  }
}

/**
 * Tek tick: `worldExecutionGateV0` moduna göre —
 * **OFF:** ağ/ingest yok; salt okunur cache + ham hints (smoothing belleği dokunulmaz).
 * **PASSIVE (OBSERVER):** ingest (cache + provenance) + presence + **ham** hints; smoothing / DOM / Cesium yok.
 * **ACTIVE (EFFECTOR):** aynı ingest + ham türetim, ardından smoothing belleği + DOM + projection consumer + Cesium sink.
 * @param {{
 *   ttlMs?: number,
 *   signal?: AbortSignal,
 *   extraCesiumSinkInvocations?: number,
 *   intervalMsForTemporalSnapshot?: number,
 *   livingContext?: {
 *     locationSeed?: { timeZone?: string, locale?: string, seedBasis?: string },
 *     worldInstance?: { instanceId?: string, timeZone?: string, locale?: string }
 *   }
 * }} [opts]
 */
export async function runLiveRuntimeOrchestratorTickV0(opts = {}) {
  const ttlMs = typeof opts.ttlMs === "number" && opts.ttlMs > 0 ? opts.ttlMs : 10 * 60 * 1000;
  const tWall0 = performance.now();
  const mode = getWorldExecutionModeV0();
  const snapInterval =
    typeof opts.intervalMsForTemporalSnapshot === "number" && opts.intervalMsForTemporalSnapshot > 0
      ? opts.intervalMsForTemporalSnapshot
      : 0;

  const presenceIo = { livingContext: opts.livingContext };

  if (mode === "OFF") {
    const feed = getCachedWeatherAtmosphereFeedV0();
    const state = buildWorldPresenceStateV0({ weatherFeed: feed, ...presenceIo });
    const raw = deriveProjectionHintsV0(state);
    const tickWallMs = performance.now() - tWall0;
    completeLiveRuntimeOrchestratorTickTemporalV0(
      {
        tickWallMs,
        projectionWallMs: 0,
        cesiumSinkWallMs: 0,
        cesiumSyncLagMs: 0
      },
      snapInterval
    );
    return {
      state,
      hints: raw,
      temporal: getLiveRuntimeTemporalSnapshotV0(snapInterval)
    };
  }

  await refreshWeatherAtmosphereFeedIfStaleV0({ ttlMs, signal: opts.signal });
  const tAfterRefresh = performance.now();

  const feed = getCachedWeatherAtmosphereFeedV0();
  const state = buildWorldPresenceStateV0({ weatherFeed: feed, ...presenceIo });
  const raw = deriveProjectionHintsV0(state);

  if (mode === "PASSIVE") {
    const tPassiveEnd = performance.now();
    const tickWallMs = tPassiveEnd - tWall0;
    completeLiveRuntimeOrchestratorTickTemporalV0(
      {
        tickWallMs,
        projectionWallMs: 0,
        cesiumSinkWallMs: 0,
        cesiumSyncLagMs: 0
      },
      snapInterval
    );
    return {
      state,
      hints: raw,
      temporal: getLiveRuntimeTemporalSnapshotV0(snapInterval)
    };
  }

  const hints = smoothProjectionHintsV0(_smoothedProjectionHints, raw);
  _smoothedProjectionHints = hints;

  const root = typeof document !== "undefined" ? document.documentElement : null;
  if (root) applyProjectionHintsToHostV0(root, hints);
  const castle =
    typeof document !== "undefined" ? document.querySelector("[data-rhizoh-atmosphere-castle-surface]") : null;
  applyProjectionHintsToCastleAuraSurfaceV0(castle, hints);
  const tDomEnd = performance.now();

  notifyLiveRuntimeProjectionConsumersV0({ state, hints });

  const tSink0 = performance.now();
  const extra = Math.max(0, Math.min(2, Number(opts.extraCesiumSinkInvocations) || 0));
  requestCesiumRenderViaSinkV0(1 + extra);
  const tSink1 = performance.now();

  const tickWallMs = tSink1 - tWall0;
  completeLiveRuntimeOrchestratorTickTemporalV0(
    {
      tickWallMs,
      projectionWallMs: tDomEnd - tAfterRefresh,
      cesiumSinkWallMs: tSink1 - tSink0,
      cesiumSyncLagMs: tSink0 - tDomEnd
    },
    snapInterval
  );

  return {
    state,
    hints,
    temporal: getLiveRuntimeTemporalSnapshotV0(snapInterval)
  };
}

/**
 * @param {{
 *   intervalMs?: number,
 *   ttlMs?: number,
 *   signal?: AbortSignal,
 *   livingContext?: import("./worldPresenceRuntimeV0.js").buildWorldPresenceStateV0 extends never ? never : Parameters<typeof import("./worldPresenceRuntimeV0.js").buildWorldPresenceStateV0>[0]["livingContext"],
 *   onPostTick?: (result: Awaited<ReturnType<typeof runLiveRuntimeOrchestratorTickV0>>) => void | Promise<void>
 * }} [opts]
 * @returns {() => void} stop
 */
export function startLiveRuntimeOrchestratorV0(opts = {}) {
  if (isWorldExecutionOffV0()) {
    return () => {};
  }
  const envTick =
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_RHIZOH_LIVE_ORCHESTRATOR_TICK_MS;
  const parsedEnv = Number(envTick);
  const fromEnv =
    Number.isFinite(parsedEnv) && parsedEnv >= 500 && parsedEnv <= 600_000 ? parsedEnv : LIVE_RUNTIME_ORCHESTRATOR_DEFAULT_TICK_MS;
  const intervalMs = clampLiveRuntimeOrchestratorIntervalMsV0(
    typeof opts.intervalMs === "number" && opts.intervalMs > 0 ? opts.intervalMs : fromEnv
  );
  const ttlMs = typeof opts.ttlMs === "number" && opts.ttlMs > 0 ? opts.ttlMs : 10 * 60 * 1000;
  const signal = opts.signal;
  const onPostTick = opts.onPostTick;

  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeoutId = null;
  let stopped = false;

  const runScheduled = async () => {
    if (stopped || signal?.aborted) return;
    const tickStarted = performance.now();
    const temporal = beginLiveRuntimeOrchestratorTickTemporalV0(intervalMs);
    try {
      const result = await runLiveRuntimeOrchestratorTickV0({
        ttlMs,
        signal,
        livingContext: opts.livingContext,
        extraCesiumSinkInvocations: temporal.extraCesiumSinkInvocations,
        intervalMsForTemporalSnapshot: intervalMs
      });
      if (!stopped && !signal?.aborted) await onPostTick?.(result);
    } catch {
      /* noop */
    } finally {
      const elapsed = performance.now() - tickStarted;
      if (!stopped && !signal?.aborted) {
        const nextDelay = Math.max(0, intervalMs - elapsed);
        timeoutId = setTimeout(runScheduled, nextDelay);
      }
    }
  };

  void runScheduled();

  return () => {
    stopped = true;
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}
