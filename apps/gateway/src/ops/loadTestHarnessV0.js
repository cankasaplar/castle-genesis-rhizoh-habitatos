/**
 * Load test harness v0 — consistency under distributed stress (in-process turn path).
 * Exercises GCL + phased rollout cluster without live LLM when CASTLE_LOAD_TEST_DRY=1.
 * @see docs/ops/LOAD_TEST_HARNESS_V1.0.md
 */

import {
  assessGlobalCostBeforeTurnV0,
  recordGlobalCostAfterTurnV0,
  getGlobalCostLedgerSnapshotV0,
  resolveGclLedgerHealthV0,
  resetGlobalCostLedgerV0,
  readGlobalCostLedgerConfigV0
} from "./globalCostLedgerV0.js";
import {
  beginPhasedRolloutTurnV0,
  endPhasedRolloutTurnV0,
  reconcilePhasedRolloutInflightV0,
  getPhasedRolloutStatsV0,
  resolvePhasedRolloutHealthV0,
  resetPhasedRolloutClusterV0,
  readPhasedRolloutClusterConfigV0
} from "./phasedRolloutClusterV0.js";
import {
  createLoadTestMetricsV0,
  recordLoadFailureV0,
  finalizeLoadTestMetricsV0
} from "./loadTestMetricsV0.js";
import { isCoordinationSimEnabledV0, readCoordinationSimConfigV0 } from "./inMemoryRedisCoordinationV0.js";
import { resolveExecutionModeFromReportV0 } from "./simRealDivergenceSignaturesV0.js";
import {
  readLoadTestChaosConfigV0,
  shouldInjectProvider429V0,
  shouldSkipRolloutEndV0,
  shouldFailRolloutReserveV0,
  withRedisChaosLatencyV0
} from "./loadTestChaosV0.js";

export const LOAD_TEST_HARNESS_SCHEMA_V0 = "rhizoh.load_test.harness.v0";

export const LOAD_TEST_SCENARIO_V0 = Object.freeze({
  BASELINE: "baseline",
  GROWTH_RAMP: "growth_ramp",
  STRESS_SPIKE: "stress_spike",
  CHAOS: "chaos_injection"
});

export const LOAD_TEST_PHASE_V0 = Object.freeze({
  SANITY: "phase1_sanity",
  STRUCTURAL: "phase2_structural",
  FAILURE: "phase3_failure"
});

/**
 * Pre-flight checklist before meaningful load test.
 */
export async function verifyLoadTestReadinessV0() {
  const gcl = readGlobalCostLedgerConfigV0();
  const rollout = readPhasedRolloutClusterConfigV0();
  const gclHealth = await resolveGclLedgerHealthV0();
  const rolloutHealth = await resolvePhasedRolloutHealthV0();
  const items = [
    {
      id: "gcl_fail_closed",
      ok: gcl.requireRedis ? gclHealth.ok : true,
      detail: gcl.requireRedis ? "GCL requires Redis" : "GCL memory/dev mode"
    },
    {
      id: "rollout_cluster_redis",
      ok: rollout.requireRedis
        ? rolloutHealth.ok || isCoordinationSimEnabledV0()
        : rollout.allowMemoryFallback,
      detail: isCoordinationSimEnabledV0()
        ? "Rollout coordination sim (in-memory Redis)"
        : rollout.requireRedis
          ? "Rollout cluster Redis"
          : "Rollout dev memory"
    },
    {
      id: "http_rl_cluster",
      ok: false,
      optional: true,
      detail: "HTTP rate limit still process-local (known gap)"
    },
    {
      id: "audit_trail",
      ok: true,
      detail: "GCL audit append-only enabled in globalCostAuditTrailV0"
    }
  ];
  const requiredOk = items.filter((i) => !i.optional).every((i) => i.ok);
  return Object.freeze({
    schema: LOAD_TEST_HARNESS_SCHEMA_V0,
    ready: requiredOk,
    items,
    gclHealth,
    rolloutHealth
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Simulate one logical user turn through rollout + GCL path.
 * @param {string} userId
 * @param {ReturnType<createLoadTestMetricsV0>} metrics
 * @param {{ estimatedTokens?: number, simulatedLatencyMs?: number, queueDepth?: number }} opts
 */
export async function simulateHarnessTurnV0(userId, metrics, opts = {}) {
  const t0 = Date.now();
  const principal = `load:${userId}`;
  metrics.turnsAttempted += 1;
  const queueDepth = Math.max(0, Math.floor(Number(opts.queueDepth) || 0));
  metrics.queueDepthSum += queueDepth;
  if (queueDepth > metrics.queueDepthMax) metrics.queueDepthMax = queueDepth;

  if (shouldInjectProvider429V0()) {
    recordLoadFailureV0(metrics, "provider_http_429");
    return { ok: false, code: "provider_http_429", latencyMs: Date.now() - t0 };
  }

  if (shouldFailRolloutReserveV0()) {
    recordLoadFailureV0(metrics, "phased_rollout_unavailable");
    return { ok: false, code: "phased_rollout_unavailable", latencyMs: Date.now() - t0 };
  }

  let rolloutBefore = 0;
  /** @type {string | null} */
  let rolloutLeaseId = null;
  try {
    const rolloutPre = await withRedisChaosLatencyV0(() => getPhasedRolloutStatsV0());
    rolloutBefore = rolloutPre.activeTurns;

    const phased = await withRedisChaosLatencyV0(() => beginPhasedRolloutTurnV0({ traceId: principal }));
    if (!phased.ok) {
      metrics.rolloutReserveDeny += 1;
      recordLoadFailureV0(metrics, phased.code || "phased_rollout_capacity");
      return { ok: false, code: phased.code, latencyMs: Date.now() - t0 };
    }
    rolloutLeaseId = phased.leaseId ?? null;
    metrics.rolloutReserveOk += 1;
    const rolloutMid = await getPhasedRolloutStatsV0();
    if (
      rolloutMid.trackedLeases != null &&
      Math.abs(rolloutMid.activeTurns - rolloutMid.trackedLeases) > 1
    ) {
      metrics.rolloutCoherenceErrors += 1;
    }

    const est = Math.max(100, Math.floor(Number(opts.estimatedTokens) || 800));
    const costPre = await withRedisChaosLatencyV0(() =>
      assessGlobalCostBeforeTurnV0(principal, { estimatedTokens: est })
    );
    if (!costPre.proceed) {
      metrics.gclAssessDeny += 1;
      recordLoadFailureV0(metrics, costPre.code || "cost_hard_limit");
      if (rolloutLeaseId) await endPhasedRolloutTurnV0(rolloutLeaseId);
      return { ok: false, code: costPre.code, latencyMs: Date.now() - t0 };
    }

    const simLat = Math.max(0, Math.floor(Number(opts.simulatedLatencyMs) || 1200));
    await sleep(simLat);
    if (simLat >= 45_000) metrics.tailOver45s += 1;

    const costRec = await withRedisChaosLatencyV0(() =>
      recordGlobalCostAfterTurnV0(principal, { tokensUsed: est, source: "estimate" })
    );
    if (costRec?.ok === false) {
      metrics.gclRecordFail += 1;
      recordLoadFailureV0(metrics, costRec.code || "cost_ledger_record_failed");
      if (rolloutLeaseId) await endPhasedRolloutTurnV0(rolloutLeaseId);
      return { ok: false, code: costRec.code, latencyMs: Date.now() - t0 };
    }

    const hadRolloutSlot = phased.ok;
    const hadCostRecord = costRec?.ok !== false;
    if (hadRolloutSlot && !hadCostRecord) metrics.gclRolloutSyncDrift += 1;
    if (!hadRolloutSlot && hadCostRecord) metrics.gclRolloutSyncDrift += 1;

    if (!shouldSkipRolloutEndV0()) {
      await withRedisChaosLatencyV0(() => endPhasedRolloutTurnV0(rolloutLeaseId));
    } else {
      metrics.chaosEvents.push({ kind: "rollout_release_orphaned", userId, leaseId: rolloutLeaseId });
    }

    const rolloutAfter = await getPhasedRolloutStatsV0();
    if (
      rolloutAfter.trackedLeases != null &&
      Math.abs(rolloutAfter.activeTurns - rolloutAfter.trackedLeases) > 1
    ) {
      metrics.rolloutCoherenceErrors += 1;
    }

    const latencyMs = Date.now() - t0;
    metrics.latencyMsSamples.push(latencyMs);
    metrics.turnsSucceeded += 1;
    return { ok: true, latencyMs, rolloutAfter: rolloutAfter.activeTurns };
  } catch (e) {
    recordLoadFailureV0(metrics, "harness_exception");
    if (rolloutLeaseId) {
      try {
        await endPhasedRolloutTurnV0(rolloutLeaseId);
      } catch {
        /* noop */
      }
    }
    return { ok: false, code: "harness_exception", error: String(e?.message || e) };
  }
}

/**
 * Run concurrent virtual users for one scenario slice.
 */
export async function runVirtualUsersV0(userCount, metrics, opts = {}) {
  const concurrency = Math.max(1, Math.floor(Number(opts.concurrency) || 16));
  const burstMultiplier = Math.max(1, Number(opts.burstMultiplier) || 1);
  const totalTurns = Math.floor(userCount * burstMultiplier);
  let inFlight = 0;
  let idx = 0;

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= totalTurns) break;
      inFlight += 1;
      await simulateHarnessTurnV0(`u${i % userCount}`, metrics, {
        estimatedTokens: opts.estimatedTokens,
        simulatedLatencyMs: opts.simulatedLatencyMs,
        queueDepth: inFlight
      });
      inFlight = Math.max(0, inFlight - 1);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, totalTurns) }, () => worker());
  await Promise.all(workers);
  const lifecycleReconcile = await reconcilePhasedRolloutInflightV0();
  const fin = finalizeLoadTestMetricsV0(metrics);
  return Object.freeze({ ...fin, lifecycleReconcile });
}

export async function runLoadScenarioV0(scenarioId, opts = {}) {
  resetGlobalCostLedgerV0();
  resetPhasedRolloutClusterV0();
  const metrics = createLoadTestMetricsV0();
  const chaos = readLoadTestChaosConfigV0();

  /** @type {Record<string, unknown>} */
  let result = { scenarioId, metrics: finalizeLoadTestMetricsV0(metrics) };

  switch (scenarioId) {
    case LOAD_TEST_SCENARIO_V0.BASELINE:
      result.metrics = await runVirtualUsersV0(opts.users ?? 100, metrics, {
        concurrency: opts.concurrency ?? 8,
        simulatedLatencyMs: opts.simulatedLatencyMs ?? 800,
        estimatedTokens: 400
      });
      break;
    case LOAD_TEST_SCENARIO_V0.GROWTH_RAMP: {
      const steps = opts.rampSteps ?? [1000, 3000, 10_000];
      /** @type {Record<string, unknown>[]} */
      const stepsOut = [];
      for (const users of steps) {
        const m = createLoadTestMetricsV0();
        const fin = await runVirtualUsersV0(users, m, {
          concurrency: opts.concurrency ?? 24,
          burstMultiplier: opts.burstMultiplier ?? 1.2,
          simulatedLatencyMs: opts.simulatedLatencyMs ?? 1500
        });
        stepsOut.push({ users, metrics: fin });
      }
      result = { scenarioId, steps: stepsOut };
      break;
    }
    case LOAD_TEST_SCENARIO_V0.STRESS_SPIKE:
      result.metrics = await runVirtualUsersV0(opts.users ?? 10_000, metrics, {
        concurrency: opts.concurrency ?? 48,
        burstMultiplier: opts.burstMultiplier ?? 3,
        simulatedLatencyMs: opts.simulatedLatencyMs ?? 2000,
        estimatedTokens: 600
      });
      break;
    case LOAD_TEST_SCENARIO_V0.CHAOS:
      process.env.CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS = String(opts.rolloutLeaseTtlMs ?? 100);
      process.env.CASTLE_LOAD_TEST_REDIS_LATENCY_MS = String(
        opts.redisLatencyMs ?? (chaos.redisLatencyMs || 200)
      );
      process.env.CASTLE_LOAD_TEST_PROVIDER_429_RATE = String(opts.provider429Rate ?? 0.08);
      process.env.CASTLE_LOAD_TEST_ROLLOUT_END_SKIP_RATE = String(opts.rolloutEndSkipRate ?? 0.02);
      result.metrics = await runVirtualUsersV0(opts.users ?? 2000, metrics, {
        concurrency: opts.concurrency ?? 32,
        burstMultiplier: 2,
        simulatedLatencyMs: 3000
      });
      break;
    default:
      throw new Error(`unknown_load_scenario:${scenarioId}`);
  }

  if (scenarioId === LOAD_TEST_SCENARIO_V0.CHAOS) {
    await sleep(150);
  }
  const lifecycleReconcile = await reconcilePhasedRolloutInflightV0();
  const snapshot = await getGlobalCostLedgerSnapshotV0();
  const rollout = await getPhasedRolloutStatsV0();
  return Object.freeze({
    schema: LOAD_TEST_HARNESS_SCHEMA_V0,
    scenarioId,
    result,
    postSnapshot: { gcl: snapshot.global, rollout },
    lifecycleReconcile,
    chaos: readLoadTestChaosConfigV0()
  });
}

/**
 * Full phased run: sanity → structural → failure injection.
 */
export async function runLoadTestPhasesV0(opts = {}) {
  const readiness = await verifyLoadTestReadinessV0();
  const phase1a = await runLoadScenarioV0(LOAD_TEST_SCENARIO_V0.BASELINE, {
    users: opts.sanityUsers ?? 100,
    concurrency: 8
  });
  const phase1b = await runLoadScenarioV0(LOAD_TEST_SCENARIO_V0.BASELINE, {
    users: opts.sanityUsersHigh ?? 500,
    concurrency: 16
  });
  const phase2 = await runLoadScenarioV0(LOAD_TEST_SCENARIO_V0.GROWTH_RAMP, {
    rampSteps: opts.rampSteps ?? [1000, 3000, 10_000],
    concurrency: opts.concurrency ?? 32
  });
  const phase3 = await runLoadScenarioV0(LOAD_TEST_SCENARIO_V0.CHAOS, {
    users: opts.chaosUsers ?? 2000,
    redisLatencyMs: 200,
    provider429Rate: 0.05,
    rolloutEndSkipRate: 0.03
  });
  const spike = await runLoadScenarioV0(LOAD_TEST_SCENARIO_V0.STRESS_SPIKE, {
    users: opts.spikeUsers ?? 10_000,
    burstMultiplier: 3,
    concurrency: 48
  });

  const phases = Object.freeze({
      phase1_sanity_100: phase1a,
      phase1_sanity_500: phase1b,
      phase2_structural_ramp: phase2,
      phase3_chaos: phase3,
      stress_spike: spike
    });

  const draft = {
    schema: LOAD_TEST_HARNESS_SCHEMA_V0,
    readiness,
    coordinationSim: isCoordinationSimEnabledV0(),
    coordinationSimConfig: readCoordinationSimConfigV0(),
    phases,
    expectedFailurePatterns: Object.freeze([
      "soft_saturation_illusion",
      "rollout_hysteresis",
      "redis_coordination_lag"
    ]),
    systemClass:
      "distributed_bounded_execution_system_with_financial_and_capacity_coherence_constraints"
  };

  return Object.freeze({
    ...draft,
    executionMode: resolveExecutionModeFromReportV0(draft)
  });
}
