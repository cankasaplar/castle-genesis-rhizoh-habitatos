/**
 * Load test KPI collectors v0 — distributed coherence under stress.
 */

export const LOAD_TEST_METRICS_SCHEMA_V0 = "rhizoh.load_test.metrics.v0";

export function createLoadTestMetricsV0() {
  return {
    schema: LOAD_TEST_METRICS_SCHEMA_V0,
    startedAtMs: Date.now(),
    turnsAttempted: 0,
    turnsSucceeded: 0,
    turnsFailed: 0,
    /** @type {Record<string, number>} */
    failureCodes: {},
    rolloutReserveOk: 0,
    rolloutReserveDeny: 0,
    rolloutCoherenceErrors: 0,
    gclAssessDeny: 0,
    gclRecordFail: 0,
    gclRolloutSyncDrift: 0,
    capacityViolations: 0,
    latencyMsSamples: [],
    queueDepthMax: 0,
    queueDepthSum: 0,
    tailOver45s: 0,
    chaosEvents: [],
    /** @type {Record<string, unknown>[]} */
    samples: []
  };
}

/**
 * @param {ReturnType<createLoadTestMetricsV0>} m
 * @param {string} code
 */
export function recordLoadFailureV0(m, code) {
  m.turnsFailed += 1;
  const k = String(code || "unknown");
  m.failureCodes[k] = (m.failureCodes[k] || 0) + 1;
  if (k === "phased_rollout_capacity") m.capacityViolations += 1;
}

/**
 * @param {ReturnType<createLoadTestMetricsV0>} m
 */
export function finalizeLoadTestMetricsV0(m) {
  const n = m.latencyMsSamples.length || 1;
  const sorted = [...m.latencyMsSamples].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const avgQueue = m.turnsAttempted > 0 ? m.queueDepthSum / m.turnsAttempted : 0;
  const tailAmp = p50 > 0 ? Math.round((p95 / p50) * 1000) / 1000 : 0;
  const durationMin = Math.max(1 / 60, (Date.now() - m.startedAtMs) / 60_000);
  return Object.freeze({
    ...m,
    durationMs: Date.now() - m.startedAtMs,
    durationMin: Math.round(durationMin * 1000) / 1000,
    latencyP50Ms: p50,
    latencyP95Ms: p95,
    tailAmplificationFactor: tailAmp,
    avgQueueDepth: Math.round(avgQueue * 1000) / 1000,
    capacityViolationsPerMin: Math.round((m.capacityViolations / durationMin) * 1000) / 1000,
    rolloutCoherenceErrorRate:
      m.turnsAttempted > 0 ? Math.round((m.rolloutCoherenceErrors / m.turnsAttempted) * 10000) / 10000 : 0,
    gclRolloutSyncDriftRate:
      m.turnsAttempted > 0 ? Math.round((m.gclRolloutSyncDrift / m.turnsAttempted) * 10000) / 10000 : 0,
    successRate: m.turnsAttempted > 0 ? Math.round((m.turnsSucceeded / m.turnsAttempted) * 10000) / 10000 : 0
  });
}
