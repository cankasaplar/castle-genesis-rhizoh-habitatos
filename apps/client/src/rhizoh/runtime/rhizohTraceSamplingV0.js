/**
 * Trace sampling strategy — reduce observability overhead without losing critical path visibility.
 *
 * critical path → full trace (always)
 * UI / adapter   → sampled trace (success path)
 * spatial        → delta trace (change-only)
 * tensor replay  → explicit only (caller invoked)
 */

export const RHIZOH_TRACE_SAMPLING_SCHEMA_V0 = "rhizoh.trace_sampling.v0";

const TRACE_KIND_V0 = Object.freeze({
  DOMAIN_TRANSITION: "domain_transition",
  DOMAIN_PASS: "domain_pass",
  ADAPTER_RESOLVE: "adapter_resolve",
  ADAPTER_INVOKE: "adapter_invoke",
  TENSOR_DECISION: "tensor_decision",
  TENSOR_REPLAY: "tensor_replay",
  FALLBACK: "fallback",
  SPATIAL_NODE: "spatial_node",
  CONTROL_PLANE: "control_plane",
  CODEX_GHOST: "codex_ghost",
  RUNTIME_SUBSTRATE: "runtime_substrate"
});

export const TRACE_SAMPLE_TIER_V0 = Object.freeze({
  CRITICAL: "critical",
  UI: "ui",
  SPATIAL: "spatial",
  REPLAY: "replay"
});

export const TRACE_SAMPLE_MODE_V0 = Object.freeze({
  FULL: "full",
  SAMPLED: "sampled",
  DELTA: "delta",
  SKIPPED: "skipped"
});

/** Causal completeness vs cost — maps to sampling outcome. */
export const TRACE_CLASS_V0 = Object.freeze({
  CRITICAL: "critical",
  SIGNAL: "signal",
  NOISE: "noise"
});

/** @type {{ critical: number, signal: number, noise: number, byKind: Map<string, number> }} */
const classStats = {
  critical: 0,
  signal: 0,
  noise: 0,
  byKind: new Map()
};

/** @type {Map<string, { fingerprint: string, atMs: number }>} */
const spatialDeltaCache = new Map();

/** @type {{ recorded: number, skipped: number, sampled: number, deltaSkipped: number }} */
const stats = { recorded: 0, skipped: 0, sampled: 0, deltaSkipped: 0 };

/** @type {boolean | null} @internal vitest */
let forceFullTraceForTest = null;
/** @type {number | null} @internal vitest */
let uiSampleRateOverride = null;

/** @type {number | null} */
let flushTimer = null;

const CRITICAL_KINDS_V0 = new Set([
  TRACE_KIND_V0.DOMAIN_TRANSITION,
  TRACE_KIND_V0.DOMAIN_PASS,
  TRACE_KIND_V0.FALLBACK,
  TRACE_KIND_V0.CONTROL_PLANE,
  TRACE_KIND_V0.CODEX_GHOST,
  TRACE_KIND_V0.RUNTIME_SUBSTRATE
]);

const UI_KINDS_V0 = new Set([
  TRACE_KIND_V0.ADAPTER_RESOLVE,
  TRACE_KIND_V0.ADAPTER_INVOKE
]);

const SPATIAL_DELTA_TTL_MS = 5000;

/**
 * @returns {boolean}
 */
export function isTraceSamplingActiveV0() {
  if (forceFullTraceForTest === true) return false;
  if (forceFullTraceForTest === false) return true;
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const full = String(import.meta.env.VITE_RHIZOH_TRACE_FULL ?? "").trim().toLowerCase();
    if (full === "1" || full === "true" || full === "on") return false;
    if (import.meta.env.MODE === "test") return false;
  }
  return true;
}

/**
 * @returns {number} 0–1 inclusive sample rate for UI tier successes
 */
function resolveUiSampleRateV0() {
  if (uiSampleRateOverride !== null) return uiSampleRateOverride;
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const raw = import.meta.env.VITE_RHIZOH_TRACE_SAMPLE_UI_RATE;
    if (raw !== undefined && raw !== "") {
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
    }
  }
  return 0.125;
}

/**
 * Deterministic bucket for UI sampling (stable per domain+capability tick).
 * @param {object} detail
 */
function uiSampleBucketV0(detail) {
  const key = `${detail.domain ?? ""}:${detail.capability ?? detail.adapterId ?? ""}`;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

/**
 * @param {object} detail
 */
function isFailureDetailV0(detail) {
  if (detail.blocked === true) return true;
  if (detail.resultOk === false) return true;
  if (detail.fallback && detail.fallback !== "none" && detail.fallback !== "idle_adapter") return true;
  if (detail.resultReason && detail.resultReason !== "null_adapter") return true;
  if (detail.adapterId === "null") return true;
  return false;
}

/**
 * @param {string} tier
 * @param {string} nodeId
 * @param {object} detail
 */
export function resolveSpatialDeltaV0(tier, nodeId, detail = {}) {
  const t = String(tier || "static");
  const id = String(nodeId || "").trim();
  const key = `${t}:${id}`;
  const fingerprint = JSON.stringify({
    kind: detail.kind ?? null,
    sourceDomain: detail.sourceDomain ?? null,
    projectionOnly: detail.projectionOnly === true
  });
  const prev = spatialDeltaCache.get(key);
  const now = Date.now();
  if (prev && prev.fingerprint === fingerprint && now - prev.atMs < SPATIAL_DELTA_TTL_MS) {
    return Object.freeze({ record: false, mode: TRACE_SAMPLE_MODE_V0.SKIPPED, tier: TRACE_SAMPLE_TIER_V0.SPATIAL });
  }
  spatialDeltaCache.set(key, { fingerprint, atMs: now });
  return Object.freeze({ record: true, mode: TRACE_SAMPLE_MODE_V0.DELTA, tier: TRACE_SAMPLE_TIER_V0.SPATIAL });
}

/**
 * Map sampling outcome → trace class (CRITICAL | SIGNAL | NOISE).
 * @param {string} kind
 * @param {{ record: boolean, mode: string, tier: string }} sampling
 */
export function resolveTraceClassV0(kind, sampling) {
  if (!sampling.record) return TRACE_CLASS_V0.NOISE;
  if (
    sampling.tier === TRACE_SAMPLE_TIER_V0.CRITICAL ||
    sampling.tier === TRACE_SAMPLE_TIER_V0.REPLAY ||
    sampling.mode === TRACE_SAMPLE_MODE_V0.FULL
  ) {
    return TRACE_CLASS_V0.CRITICAL;
  }
  if (
    sampling.mode === TRACE_SAMPLE_MODE_V0.SAMPLED ||
    sampling.mode === TRACE_SAMPLE_MODE_V0.DELTA
  ) {
    return TRACE_CLASS_V0.SIGNAL;
  }
  return TRACE_CLASS_V0.CRITICAL;
}

/**
 * @param {string} traceClass
 * @param {string} kind
 */
export function noteTraceClassV0(traceClass, kind) {
  if (traceClass === TRACE_CLASS_V0.CRITICAL) classStats.critical += 1;
  else if (traceClass === TRACE_CLASS_V0.SIGNAL) classStats.signal += 1;
  else classStats.noise += 1;
  const k = String(kind || "unknown");
  classStats.byKind.set(k, (classStats.byKind.get(k) || 0) + 1);
}

/**
 * @param {string} kind
 * @param {object} [detail]
 */
export function resolveTraceSamplingV0(kind, detail = {}) {
  const k = String(kind || "");

  if (!isTraceSamplingActiveV0()) {
    const base = Object.freeze({
      record: true,
      mode: TRACE_SAMPLE_MODE_V0.FULL,
      tier: TRACE_SAMPLE_TIER_V0.CRITICAL
    });
    return Object.freeze({ ...base, traceClass: TRACE_CLASS_V0.CRITICAL });
  }

  let sampling;

  if (k === TRACE_KIND_V0.TENSOR_REPLAY) {
    sampling = Object.freeze({
      record: true,
      mode: TRACE_SAMPLE_MODE_V0.FULL,
      tier: TRACE_SAMPLE_TIER_V0.REPLAY
    });
  } else if (CRITICAL_KINDS_V0.has(k)) {
    sampling = Object.freeze({
      record: true,
      mode: TRACE_SAMPLE_MODE_V0.FULL,
      tier: TRACE_SAMPLE_TIER_V0.CRITICAL
    });
  } else if (k === TRACE_KIND_V0.TENSOR_DECISION) {
    if (detail.blocked === true || (detail.fallback && detail.fallback !== "none")) {
      sampling = Object.freeze({
        record: true,
        mode: TRACE_SAMPLE_MODE_V0.FULL,
        tier: TRACE_SAMPLE_TIER_V0.CRITICAL
      });
    } else {
      const rate = resolveUiSampleRateV0();
      const bucket = uiSampleBucketV0({ domain: detail.domain, capability: "tensor" });
      if (bucket <= rate) {
        sampling = Object.freeze({
          record: true,
          mode: TRACE_SAMPLE_MODE_V0.SAMPLED,
          tier: TRACE_SAMPLE_TIER_V0.UI
        });
      } else {
        stats.skipped += 1;
        stats.sampled += 1;
        sampling = Object.freeze({
          record: false,
          mode: TRACE_SAMPLE_MODE_V0.SKIPPED,
          tier: TRACE_SAMPLE_TIER_V0.UI
        });
      }
    }
  } else if (UI_KINDS_V0.has(k)) {
    if (isFailureDetailV0(detail)) {
      sampling = Object.freeze({
        record: true,
        mode: TRACE_SAMPLE_MODE_V0.FULL,
        tier: TRACE_SAMPLE_TIER_V0.CRITICAL
      });
    } else {
      const rate = resolveUiSampleRateV0();
      const bucket = uiSampleBucketV0(detail);
      if (bucket <= rate) {
        sampling = Object.freeze({
          record: true,
          mode: TRACE_SAMPLE_MODE_V0.SAMPLED,
          tier: TRACE_SAMPLE_TIER_V0.UI
        });
      } else {
        stats.skipped += 1;
        stats.sampled += 1;
        sampling = Object.freeze({
          record: false,
          mode: TRACE_SAMPLE_MODE_V0.SKIPPED,
          tier: TRACE_SAMPLE_TIER_V0.UI
        });
      }
    }
  } else if (k === TRACE_KIND_V0.SPATIAL_NODE) {
    if (detail.tier === "temporal") {
      sampling = Object.freeze({
        record: true,
        mode: TRACE_SAMPLE_MODE_V0.FULL,
        tier: TRACE_SAMPLE_TIER_V0.CRITICAL
      });
    } else {
      const delta = resolveSpatialDeltaV0(detail.tier, detail.nodeId, detail);
      if (!delta.record) {
        stats.skipped += 1;
        stats.deltaSkipped += 1;
      }
      sampling = delta;
    }
  } else {
    sampling = Object.freeze({
      record: true,
      mode: TRACE_SAMPLE_MODE_V0.FULL,
      tier: TRACE_SAMPLE_TIER_V0.CRITICAL
    });
  }

  const traceClass = resolveTraceClassV0(k, sampling);
  if (!sampling.record && traceClass === TRACE_CLASS_V0.NOISE) {
    noteTraceClassV0(TRACE_CLASS_V0.NOISE, k);
  }
  return Object.freeze({ ...sampling, traceClass });
}

/**
 * Throttle non-critical window snapshot updates.
 * @param {() => void} flush
 * @param {string} mode
 */
export function scheduleTraceFlushV0(flush, mode = TRACE_SAMPLE_MODE_V0.FULL) {
  if (typeof window === "undefined") return;
  if (mode === TRACE_SAMPLE_MODE_V0.FULL) {
    flush();
    return;
  }
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 250);
}

/** @param {string} mode */
export function noteTraceRecordedV0(mode, traceClass = TRACE_CLASS_V0.CRITICAL, kind = "") {
  stats.recorded += 1;
  if (mode === TRACE_SAMPLE_MODE_V0.SAMPLED) stats.sampled += 1;
  noteTraceClassV0(traceClass, kind);
}

/**
 * @returns {object}
 */
export function getTraceSamplingSnapshotV0() {
  const noiseByKind = Object.fromEntries(classStats.byKind);
  return Object.freeze({
    schema: RHIZOH_TRACE_SAMPLING_SCHEMA_V0,
    active: isTraceSamplingActiveV0(),
    uiSampleRate: resolveUiSampleRateV0(),
    spatialDeltaEntries: spatialDeltaCache.size,
    classification: Object.freeze({
      critical: classStats.critical,
      signal: classStats.signal,
      noise: classStats.noise,
      noiseByKind: Object.freeze(noiseByKind)
    }),
    stats: Object.freeze({ ...stats })
  });
}

/** @internal vitest */
export function __forceFullTraceForTestV0(full) {
  forceFullTraceForTest = full === true ? true : full === false ? false : null;
}

/** @internal vitest */
export function __setTraceUiSampleRateForTestV0(rate) {
  uiSampleRateOverride = typeof rate === "number" ? rate : null;
}

/** @internal vitest */
export function __resetTraceSamplingForTestV0() {
  spatialDeltaCache.clear();
  stats.recorded = 0;
  stats.skipped = 0;
  stats.sampled = 0;
  stats.deltaSkipped = 0;
  classStats.critical = 0;
  classStats.signal = 0;
  classStats.noise = 0;
  classStats.byKind.clear();
  forceFullTraceForTest = null;
  uiSampleRateOverride = null;
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
