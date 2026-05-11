/**
 * Yerel davranış metrik rollup — `castle:rhizoh-signal` olaylarını sayıya döker (minimal aggregation).
 */

import { CASTLE_RHIZOH_SIGNAL_EVENT } from "./rhizohBehaviorSignalsV1.js";
import { ingestRhizohExternalLossFromSignalDetail } from "../product/rhizohExternalLossFunctionV1.js";

export const RHIZOH_METRICS_ROLLUP_VERSION = "1.0.0";

const LS_KEY = "rhizoh.behavior.metrics.v1";

export function createEmptyRhizohBehaviorMetricsRollup() {
  return {
    schemaVersion: RHIZOH_METRICS_ROLLUP_VERSION,
    updatedAt: Date.now(),
    counts: {},
    phaseDwellMs: {},
    phaseEnterCount: {},
    closureViewCount: 0,
    closureUnlockHintsSum: 0,
    closureDismiss: { timeout: 0, replaced_or_unmount: 0 },
    closureVisibleMsSum: 0,
    closureVisibleMsCount: 0,
    capabilityUnlockSeenEvents: 0,
    capabilityUnlockKeysTotal: 0,
    turnDepthSum: 0,
    turnDepthMax: 0,
    turnDepthCount: 0,
    turnUserCharsSum: 0,
    trustDeltaSum: 0,
    trustDeltaAbsSum: 0,
    trustDeltaCount: 0,
    return24hCount: 0,
    return7dCount: 0
  };
}

/**
 * @param {unknown} raw
 */
function normalizeLoaded(raw) {
  const e = createEmptyRhizohBehaviorMetricsRollup();
  if (!raw || typeof raw !== "object") return e;
  const r = /** @type {Record<string, unknown>} */ (raw);
  Object.assign(e, r);
  e.counts = { ...e.counts, ...(typeof r.counts === "object" && r.counts ? r.counts : {}) };
  e.phaseDwellMs = {
    ...e.phaseDwellMs,
    ...(typeof r.phaseDwellMs === "object" && r.phaseDwellMs ? r.phaseDwellMs : {})
  };
  e.phaseEnterCount = {
    ...e.phaseEnterCount,
    ...(typeof r.phaseEnterCount === "object" && r.phaseEnterCount ? r.phaseEnterCount : {})
  };
  const cd = r.closureDismiss && typeof r.closureDismiss === "object" ? r.closureDismiss : {};
  e.closureDismiss = {
    timeout: Number(cd.timeout) || 0,
    replaced_or_unmount: Number(cd.replaced_or_unmount) || 0
  };
  e.schemaVersion = RHIZOH_METRICS_ROLLUP_VERSION;
  return e;
}

function loadFromStorage() {
  try {
    if (typeof window === "undefined") return createEmptyRhizohBehaviorMetricsRollup();
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return createEmptyRhizohBehaviorMetricsRollup();
    return normalizeLoaded(JSON.parse(raw));
  } catch {
    return createEmptyRhizohBehaviorMetricsRollup();
  }
}

function saveToStorage(state) {
  try {
    if (typeof window === "undefined") return;
    state.updatedAt = Date.now();
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

/** @type {ReturnType<createEmptyRhizohBehaviorMetricsRollup> | null} */
let memoryRollup = null;

function ensureRollupMemory() {
  if (!memoryRollup) memoryRollup = loadFromStorage();
  return memoryRollup;
}

/**
 * Rollup durumuna tek bir sinyal uygular (mutation).
 * @param {ReturnType<createEmptyRhizohBehaviorMetricsRollup>} state
 * @param {Record<string, unknown>} detail emitRhizohBehaviorSignal detail
 */
export function applyRhizohBehaviorSignalToRollup(state, detail) {
  if (!state || !detail || typeof detail.name !== "string") return;
  const name = detail.name;
  state.counts[name] = (state.counts[name] || 0) + 1;

  switch (name) {
    case "rhizoh.phase.enter": {
      const ph = typeof detail.phase === "string" ? detail.phase : "";
      if (ph) state.phaseEnterCount[ph] = (state.phaseEnterCount[ph] || 0) + 1;
      break;
    }
    case "rhizoh.phase.exit": {
      const ph = typeof detail.phase === "string" ? detail.phase : "";
      const dur = Math.max(0, Number(detail.durationMs) || 0);
      if (ph) state.phaseDwellMs[ph] = (state.phaseDwellMs[ph] || 0) + dur;
      break;
    }
    case "rhizoh.closure.view": {
      state.closureViewCount += 1;
      const uc = Number(detail.unlockCount);
      if (Number.isFinite(uc) && uc > 0) state.closureUnlockHintsSum += uc;
      break;
    }
    case "rhizoh.closure.dismiss": {
      const r = detail.reason === "timeout" ? "timeout" : "replaced_or_unmount";
      state.closureDismiss[r] = (state.closureDismiss[r] || 0) + 1;
      const vm = Number(detail.visibleMs);
      if (Number.isFinite(vm) && vm >= 0) {
        state.closureVisibleMsSum += vm;
        state.closureVisibleMsCount += 1;
      }
      break;
    }
    case "rhizoh.capability.unlock_seen": {
      state.capabilityUnlockSeenEvents += 1;
      const keys = Array.isArray(detail.keys) ? detail.keys.length : 0;
      state.capabilityUnlockKeysTotal += keys;
      break;
    }
    case "rhizoh.conversation.turn_depth": {
      const d01 = Number(detail.depth01);
      const uc = Number(detail.userChars);
      if (Number.isFinite(d01)) {
        state.turnDepthSum += d01;
        state.turnDepthMax = Math.max(state.turnDepthMax || 0, d01);
        state.turnDepthCount += 1;
      }
      if (Number.isFinite(uc) && uc >= 0) state.turnUserCharsSum += uc;
      break;
    }
    case "rhizoh.trust.phase_delta": {
      const dt = Number(detail.delta);
      if (Number.isFinite(dt)) {
        state.trustDeltaSum += dt;
        state.trustDeltaAbsSum += Math.abs(dt);
        state.trustDeltaCount += 1;
      }
      break;
    }
    case "rhizoh.session.return_24h": {
      state.return24hCount += 1;
      break;
    }
    case "rhizoh.session.return_7d": {
      state.return7dCount += 1;
      break;
    }
    default:
      break;
  }
  state.updatedAt = Date.now();
}

let flushTimer = null;
let started = false;

function scheduleFlush() {
  if (typeof window === "undefined") return;
  if (flushTimer != null) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    saveToStorage(ensureRollupMemory());
  }, 450);
}

function onSignal(ev) {
  const d = ev && typeof ev === "object" ? /** @type {CustomEvent} */ (ev).detail : null;
  if (!d || typeof d !== "object") return;
  applyRhizohBehaviorSignalToRollup(ensureRollupMemory(), /** @type {Record<string, unknown>} */ (d));
  ingestRhizohExternalLossFromSignalDetail(/** @type {Record<string, unknown>} */ (d));
  scheduleFlush();
}

/**
 * Dinleyiciyi bağlar; teardown fonksiyonu döner.
 */
export function startRhizohBehaviorMetricsAggregation() {
  if (typeof window === "undefined") return () => {};
  if (started) return () => {};
  started = true;
  memoryRollup = loadFromStorage();
  const handler = (e) => onSignal(e);
  window.addEventListener(CASTLE_RHIZOH_SIGNAL_EVENT, handler);
  return () => {
    window.removeEventListener(CASTLE_RHIZOH_SIGNAL_EVENT, handler);
    started = false;
    if (flushTimer != null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
    saveToStorage(ensureRollupMemory());
  };
}

/** Bellek + LS ile uyumlu anlık rollup (+ türetilmiş ortalamalar). */
export function getRhizohBehaviorMetricsSnapshot() {
  const s = ensureRollupMemory();
  const avgTurnDepth = s.turnDepthCount ? s.turnDepthSum / s.turnDepthCount : 0;
  const avgClosureVisibleMs = s.closureVisibleMsCount ? s.closureVisibleMsSum / s.closureVisibleMsCount : 0;
  const avgTrustDelta = s.trustDeltaCount ? s.trustDeltaSum / s.trustDeltaCount : 0;
  return {
    rollup: { ...s, counts: { ...s.counts }, phaseDwellMs: { ...s.phaseDwellMs }, phaseEnterCount: { ...s.phaseEnterCount } },
    derived: {
      avgTurnDepth: Math.round(avgTurnDepth * 1000) / 1000,
      avgClosureVisibleMs: Math.round(avgClosureVisibleMs),
      avgTrustDelta: Math.round(avgTrustDelta * 1000) / 1000
    }
  };
}

/** Yerel rollup sıfırlama (geliştirici / test). */
export function resetRhizohBehaviorMetricsRollup() {
  memoryRollup = createEmptyRhizohBehaviorMetricsRollup();
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(LS_KEY);
  } catch {
    /* noop */
  }
}
