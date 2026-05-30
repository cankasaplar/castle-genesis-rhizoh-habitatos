/**
 * B phase — 10K / 100K capacity reality curve (planning model, not load test).
 * Grounded in gateway env defaults + GCL + phased rollout code paths.
 * @see docs/ops/CAPACITY_10K_100K_REALITY_CURVE_V1.0.md
 */

import { readGlobalCostLedgerConfigV0 } from "./globalCostLedgerV0.js";
import { readAgentContainmentConfigV0 } from "./agentContainmentV0.js";
import {
  getPhasedRolloutLimitV0,
  readPhasedRolloutTierV0,
  readPhasedRolloutClusterConfigV0
} from "./phasedRolloutV0.js";
import { readCostContainmentConfigV0 } from "./costContainmentV0.js";

export const CAPACITY_REALITY_CURVE_SCHEMA_V0 = "rhizoh.capacity_reality_curve.v0";

const GENERATION_MODE_TOKENS_V0 = Object.freeze({
  FAST_DIALOGUE: 120,
  STANDARD: 320,
  REFLECTIVE: 900,
  NARRATIVE: 1600,
  DEEP_REASONING: 2600
});

function numEnv(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readHttpLimitsV0() {
  return Object.freeze({
    rhizohLlmPerMinPerPrincipal: Math.max(5, numEnv("CASTLE_RL_RHIZOH_LLM_PER_MIN", 40)),
    windowMs: 60_000,
    note: "Process-local Map — multi-replica multiplies effective ceiling unless Redis rate limit added"
  });
}

/**
 * Concurrent turn envelope from phased rollout (per process).
 */
export function computeThroughputEnvelopeV0(opts = {}) {
  const agent = readAgentContainmentConfigV0();
  const rolloutLimit = getPhasedRolloutLimitV0();
  const rolloutTier = readPhasedRolloutTierV0();
  const http = readHttpLimitsV0();
  const turnP50Ms = Math.max(500, Math.floor(Number(opts.turnP50Ms) || 3500));
  const turnP95Ms = Math.max(turnP50Ms, Math.floor(Number(opts.turnP95Ms) || 14_000));
  const instances = Math.max(1, Math.floor(Number(opts.gatewayInstances) || 1));
  const rolloutCfg = readPhasedRolloutClusterConfigV0();
  const clusterWideRollout =
    rolloutLimit > 0 &&
    (rolloutCfg.requireRedis || rolloutCfg.ledgerMode === "cluster");

  const concurrentCapPerInstance = rolloutLimit > 0 && !clusterWideRollout ? rolloutLimit : null;
  const maxInFlightCluster =
    rolloutLimit > 0 && clusterWideRollout
      ? rolloutLimit
      : concurrentCapPerInstance != null
        ? concurrentCapPerInstance * instances
        : null;

  const turnsPerSecPerInstanceAtP50 =
    concurrentCapPerInstance != null ? concurrentCapPerInstance / (turnP50Ms / 1000) : null;
  const turnsPerSecClusterAtP50 =
    turnsPerSecPerInstanceAtP50 != null ? turnsPerSecPerInstanceAtP50 * instances : null;

  const perPrincipalTurnsPerSec = http.rhizohLlmPerMinPerPrincipal / 60;
  const providerCollapseTurnMs = Math.max(turnP95Ms * 2, 45_000);

  return Object.freeze({
    schema: CAPACITY_REALITY_CURVE_SCHEMA_V0,
    rolloutTier,
    concurrentCapPerInstance,
    maxInFlightCluster,
    agentTurnTimeoutMs: agent.turnTimeoutMs,
    turnsPerSecPerInstanceAtP50: round3(turnsPerSecPerInstanceAtP50),
    turnsPerSecClusterAtP50: round3(turnsPerSecClusterAtP50),
    perPrincipalMaxTurnsPerSec: round3(perPrincipalTurnsPerSec),
    providerLatencyCollapsePointMs: providerCollapseTurnMs,
    bottleneckOrder: inferBottleneckOrderV0({
      rolloutLimit,
      perPrincipalTurnsPerSec,
      turnsPerSecClusterAtP50
    }),
    clusterGap: Object.freeze({
      phasedRolloutProcessLocal: rolloutLimit > 0 && !clusterWideRollout,
      phasedRolloutClusterWide: clusterWideRollout,
      httpRateLimitProcessLocal: true,
      gclClusterWide: readGlobalCostLedgerConfigV0().requireRedis,
      warning: clusterWideRollout
        ? "HTTP rate limit remains per-instance; rollout + GCL cluster-wide when Redis required."
        : "Enable CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS=1 for cluster-wide rollout truth."
    })
  });
}

function inferBottleneckOrderV0({ rolloutLimit, perPrincipalTurnsPerSec, turnsPerSecClusterAtP50 }) {
  /** @type {string[]} */
  const order = [];
  if (rolloutLimit > 0 && turnsPerSecClusterAtP50 != null && turnsPerSecClusterAtP50 < 20) {
    order.push("phased_rollout_concurrency");
  }
  order.push("per_principal_rate_limit");
  order.push("provider_latency_tail");
  order.push("agent_session_token_ceiling");
  return order;
}

/**
 * DAU → peak turn demand model (honest planning assumptions).
 */
export function computeDauPeakDemandV0(dau, opts = {}) {
  const activeRatio = clamp01(Number(opts.activeRatio) || 0.4);
  const peakHourShare = clamp01(Number(opts.peakHourShare) || 0.12);
  const turnsPerActivePerHour = Math.max(0, Number(opts.turnsPerActivePerHour) || 6);
  const active = Math.floor(dau * activeRatio);
  const peakActive = Math.max(1, Math.floor(active * peakHourShare));
  const turnsPerHourPeak = peakActive * turnsPerActivePerHour;
  const turnsPerSecPeak = turnsPerHourPeak / 3600;
  return Object.freeze({
    dau,
    activeUsers: active,
    peakConcurrentActiveUsers: peakActive,
    turnsPerHourPeak,
    turnsPerSecPeak: round3(turnsPerSecPeak)
  });
}

/**
 * Cost spike scenarios (GCL cluster-wide when Redis required).
 */
export function computeCostSpikeTopologyV0(opts = {}) {
  const gcl = readGlobalCostLedgerConfigV0();
  const cost = readCostContainmentConfigV0();
  const usdPer1M = gcl.usdPer1M;
  const avgTokensPerTurn = Math.max(200, Math.floor(Number(opts.avgTokensPerTurn) || 2500));
  const viralMultiplier = Math.max(1, Number(opts.viralMultiplier) || 8);
  const sessionClusterUsers = Math.max(1, Math.floor(Number(opts.sessionClusterUsers) || 40));

  const usdPerTurn = (avgTokensPerTurn / 1_000_000) * usdPer1M;
  const steadyDayUsd = (Number(opts.steadyTurnsPerDay) || 80_000) * usdPerTurn;
  const viralBurstTurns = Math.floor((Number(opts.steadyTurnsPerDay) || 80_000) * (viralMultiplier / 24));
  const viralBurstUsd = viralBurstTurns * usdPerTurn;

  const globalCap = cost.hardSpendLimitUsd;
  const minutesToCap =
    globalCap > 0 && viralBurstUsd > 0
      ? Math.floor((globalCap / viralBurstUsd) * 5)
      : null;

  return Object.freeze({
    usdPer1M,
    avgTokensPerTurn,
    usdPerTurn: round6(usdPerTurn),
    steadyDayUsd: round2(steadyDayUsd),
    viralBurstPattern: Object.freeze({
      description: "5-minute window × viralMultiplier on hourly steady rate",
      burstTurns5m: viralBurstTurns,
      burstUsd5m: round2(viralBurstUsd),
      globalCapUsd: globalCap,
      minutesToGlobalCap: minutesToCap,
      gclEnforcement: globalCap > 0 ? "cluster_hard_stop" : "token_budget_only"
    }),
    sessionClustering: Object.freeze({
      usersInRoom: sessionClusterUsers,
      perSessionTokenCeiling: readAgentContainmentConfigV0().maxSessionTokens,
      risk: "High iteration same sessionKey — agent iteration + session token ceiling before GCL"
    })
  });
}

/**
 * Redis footprint estimator (GCL hashes + audit LIST trim 4096).
 */
export function computeRedisSaturationV0(opts = {}) {
  const principals = Math.max(1, Math.floor(Number(opts.dailyActivePrincipals) || 10_000));
  const turnsPerDay = Math.max(0, Math.floor(Number(opts.turnsPerDay) || 80_000));
  const auditEventsPerTurn = 2.5;
  const bytesPerAuditEntry = 480;
  const bytesPerPrincipalHash = 220;
  const auditCap = 4096;

  const principalHashesMb = (principals * bytesPerPrincipalHash) / (1024 * 1024);
  const auditDayMb = (Math.min(turnsPerDay * auditEventsPerTurn, auditCap) * bytesPerAuditEntry) / (1024 * 1024);
  const globalHashMb = 0.05;

  return Object.freeze({
    principals,
    turnsPerDay,
    estimatedMb: round2(principalHashesMb + auditDayMb + globalHashMb),
    auditListTrimCap: auditCap,
    auditHistoryLoss: turnsPerDay * auditEventsPerTurn > auditCap,
    recommendation:
      turnsPerDay * auditEventsPerTurn > auditCap
        ? "Archive audit stream to cold storage (S3/Firestore) daily"
        : "In-trim cap sufficient"
  });
}

/**
 * Phased rollout tier vs demand (per-instance vs cluster demand).
 */
export function computePhasedRolloutStabilityV0(dau, opts = {}) {
  const demand = computeDauPeakDemandV0(dau, opts);
  const envelope = computeThroughputEnvelopeV0(opts);
  const instances = Math.max(1, Math.floor(Number(opts.gatewayInstances) || 1));
  const clusterCap = envelope.maxInFlightCluster;
  const requiredInFlight = Math.ceil(demand.turnsPerSecPeak * (Number(opts.avgTurnDurationSec) || 8));
  const headroom =
    clusterCap != null && clusterCap > 0 ? round3(clusterCap / Math.max(1, requiredInFlight)) : null;
  const tierDriftRisk = envelope.clusterGap.phasedRolloutProcessLocal === true;

  return Object.freeze({
    dau,
    demand,
    envelope,
    requiredInFlightAtPeak: requiredInFlight,
    clusterConcurrentCap: clusterCap,
    headroomRatio: headroom,
    stable: headroom != null ? headroom >= 1.2 : false,
    tierDriftRisk,
    instances,
    recommendation: pickRolloutRecommendationV0({ headroom, dau, instances, tierDriftRisk })
  });
}

function pickRolloutRecommendationV0({ headroom, dau, instances, tierDriftRisk }) {
  if (tierDriftRisk && dau >= 10_000) {
    return "Move phased rollout counter to Redis (cluster envelope) before 10k DAU peak.";
  }
  if (headroom != null && headroom < 1) {
    return `Increase CASTLE_PHASED_ROLLOUT_TIER or gateway instances (current headroom ${headroom}).`;
  }
  if (dau >= 100_000) {
    return "Multi-region: GCL key prefix per region + global reconcile job; separate rollout tiers per region.";
  }
  return "Current tier likely adequate for stated peak if provider latency stable.";
}

/**
 * Full B-phase report for ops export / CLI.
 */
export function runCapacityRealityCurveReportV0(opts = {}) {
  const dauList = Array.isArray(opts.dauList) ? opts.dauList : [100, 1_000, 10_000, 100_000];
  const instances = Math.max(1, Math.floor(Number(opts.gatewayInstances) || 1));
  const envelope = computeThroughputEnvelopeV0({ ...opts, gatewayInstances: instances });
  const cost = computeCostSpikeTopologyV0(opts);
  const byDau = dauList.map((dau) => ({
    dau,
    demand: computeDauPeakDemandV0(dau, opts),
    rollout: computePhasedRolloutStabilityV0(dau, { ...opts, gatewayInstances: instances }),
    redis: computeRedisSaturationV0({
      dailyActivePrincipals: Math.floor(dau * (opts.activeRatio || 0.4)),
      turnsPerDay: Math.floor(dau * (opts.turnsPerActivePerHour || 6) * (opts.activeRatio || 0.4))
    })
  }));

  return Object.freeze({
    schema: CAPACITY_REALITY_CURVE_SCHEMA_V0,
    generatedAtMs: Date.now(),
    assumptions: Object.freeze({
      activeRatio: opts.activeRatio ?? 0.4,
      peakHourShare: opts.peakHourShare ?? 0.12,
      turnsPerActivePerHour: opts.turnsPerActivePerHour ?? 6,
      avgTurnDurationSec: opts.avgTurnDurationSec ?? 8,
      gatewayInstances: instances,
      note: "Planning model — validate with load test before launch."
    }),
    throughputEnvelope: envelope,
    costSpikeTopology: cost,
    byDau,
    verdict: Object.freeze({
      at10k: byDau.find((x) => x.dau === 10_000)?.rollout?.stable ?? null,
      at100k: byDau.find((x) => x.dau === 100_000)?.rollout?.stable ?? null,
      primaryRisk: "http_rate_limit_process_local",
      gclMitigates: "global_usd_and_token_truth_cluster_wide_when_redis_required"
    })
  });
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function round3(n) {
  if (n == null) return null;
  return Math.round((Number(n) || 0) * 1000) / 1000;
}
function round6(n) {
  return Math.round((Number(n) || 0) * 1_000_000) / 1_000_000;
}
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}
