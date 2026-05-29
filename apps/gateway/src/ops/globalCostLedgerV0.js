/**
 * Global Cost Ledger (GCL) v0 — fail-closed financial truth for execution (cluster Redis).
 * GCL is not optional observability: when required, memory fallback is forbidden.
 * @see docs/ops/GLOBAL_COST_LEDGER_V1.0.md
 */

import { createClient } from "redis";
import {
  appendGclAuditEventV0,
  GCL_AUDIT_EVENT_KIND_V0,
  listGclAuditEventsV0,
  resetGclAuditTrailV0
} from "./globalCostAuditTrailV0.js";

export const GLOBAL_COST_LEDGER_SCHEMA_V0 = "rhizoh.global_cost_ledger.v0";

/** Mühür cümlesi — execution contract. */
export const GCL_EXECUTION_CONTRACT_V0 = Object.freeze({
  principle:
    "GCL is not an optional observability layer; it is a fail-closed financial truth layer for execution when required.",
  memoryFallbackInProduction: false,
  feedsUxEconomy: false
});

export const GCL_LEDGER_MODE_V0 = Object.freeze({
  CLUSTER: "cluster",
  DEV_MEMORY: "dev_memory",
  UNAVAILABLE: "unavailable"
});

function parseIntEnv(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseFloatEnv(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function isProductionEnvV0() {
  return process.env.NODE_ENV === "production";
}

function readRequireRedisV0() {
  if (process.env.CASTLE_GCL_REQUIRE_REDIS === "0") return false;
  if (process.env.CASTLE_GCL_REQUIRE_REDIS === "1") return true;
  return isProductionEnvV0();
}

function readAllowMemoryFallbackV0() {
  if (process.env.CASTLE_GCL_ALLOW_MEMORY_FALLBACK === "1") return true;
  if (readRequireRedisV0()) return false;
  return !isProductionEnvV0();
}

export function readGlobalCostLedgerConfigV0() {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  const backendEnv = String(process.env.CASTLE_GCL_BACKEND || "").trim().toLowerCase();
  const requireRedis = readRequireRedisV0();
  const allowMemoryFallback = readAllowMemoryFallbackV0();
  let backend = "memory";
  if (backendEnv === "redis" || requireRedis || (backendEnv !== "memory" && redisUrl)) {
    backend = "redis";
  }
  const enforceDrift =
    process.env.CASTLE_GCL_ENFORCE_DRIFT === "1" ||
    (process.env.CASTLE_GCL_ENFORCE_DRIFT !== "0" && isProductionEnvV0());
  const ledgerMode = requireRedis
    ? GCL_LEDGER_MODE_V0.CLUSTER
    : allowMemoryFallback
      ? GCL_LEDGER_MODE_V0.DEV_MEMORY
      : GCL_LEDGER_MODE_V0.CLUSTER;
  return Object.freeze({
    schema: GLOBAL_COST_LEDGER_SCHEMA_V0,
    contract: GCL_EXECUTION_CONTRACT_V0,
    enabled: process.env.CASTLE_GCL_ENABLED !== "0",
    backend,
    requireRedis,
    allowMemoryFallback,
    enforceDrift,
    ledgerMode,
    redisUrl: redisUrl || "redis://127.0.0.1:6379",
    dailyTokenBudget: parseIntEnv("CASTLE_LLM_DAILY_TOKEN_BUDGET", 200_000),
    softBudgetRatio: Math.min(1, Math.max(0.1, Number(process.env.CASTLE_LLM_SOFT_BUDGET_RATIO) || 0.85)),
    hardSpendLimitUsd: Number(process.env.CASTLE_LLM_DAILY_SPEND_LIMIT_USD) || 0,
    downgradeMode: String(process.env.CASTLE_LLM_DOWNGRADE_MODE || "FAST_DIALOGUE").toUpperCase(),
    downgradeModel: String(process.env.CASTLE_LLM_DOWNGRADE_MODEL || "").trim() || null,
    queueFallback: process.env.CASTLE_LLM_QUEUE_FALLBACK === "1",
    usdPer1M: parseFloatEnv("CASTLE_GCL_USD_PER_1M_TOKENS", 0.35),
    driftWarnRatio: Math.min(1, Math.max(0.05, parseFloatEnv("CASTLE_GCL_DRIFT_WARN_RATIO", 0.25))),
    keyPrefix: String(process.env.CASTLE_GCL_REDIS_PREFIX || "castle:gcl:v1")
  });
}

function dayKeyUtc() {
  return new Date().toISOString().slice(0, 10);
}

function emptyBucket(day = dayKeyUtc()) {
  return {
    day,
    tokens: 0,
    tokensIn: 0,
    tokensOut: 0,
    requests: 0,
    estimatedUsd: 0,
    providerUsd: 0,
    lastSource: null
  };
}

/** @type {Map<string, ReturnType<emptyBucket>>} */
const memoryPrincipal = new Map();
/** @type {ReturnType<emptyBucket> | null} */
let memoryGlobal = null;

let redisPromise = null;

async function getRedisClient() {
  const cfg = readGlobalCostLedgerConfigV0();
  if (cfg.backend !== "redis") return null;
  if (!redisPromise) {
    redisPromise = (async () => {
      const connectTimeout = Math.min(
        5000,
        Math.max(200, Math.floor(Number(process.env.CASTLE_GCL_REDIS_CONNECT_MS) || 800))
      );
      const c = createClient({
        url: cfg.redisUrl,
        socket: { connectTimeout, reconnectStrategy: false }
      });
      c.on("error", () => {
        /* fallback handled per call */
      });
      try {
        await c.connect();
        return c;
      } catch {
        redisPromise = null;
        return null;
      }
    })();
  }
  return redisPromise;
}

function redisPrincipalKey(day, principal) {
  const cfg = readGlobalCostLedgerConfigV0();
  const p = String(principal || "anon").slice(0, 256);
  return `${cfg.keyPrefix}:day:${day}:principal:${p}`;
}

function redisGlobalKey(day) {
  const cfg = readGlobalCostLedgerConfigV0();
  return `${cfg.keyPrefix}:day:${day}:global`;
}

function tokensToUsd(tokens, usdPer1M) {
  const t = Math.max(0, Math.floor(Number(tokens) || 0));
  return Math.round((t / 1_000_000) * usdPer1M * 1_000_000) / 1_000_000;
}

function normalizeBucket(raw, day) {
  const b = emptyBucket(day);
  if (!raw || typeof raw !== "object") return b;
  b.tokens = Math.max(0, Math.floor(Number(raw.tokens) || 0));
  b.tokensIn = Math.max(0, Math.floor(Number(raw.tokensIn) || 0));
  b.tokensOut = Math.max(0, Math.floor(Number(raw.tokensOut) || 0));
  b.requests = Math.max(0, Math.floor(Number(raw.requests) || 0));
  b.estimatedUsd = Math.max(0, Number(raw.estimatedUsd) || 0);
  b.providerUsd = Math.max(0, Number(raw.providerUsd) || 0);
  b.lastSource = raw.lastSource != null ? String(raw.lastSource) : null;
  return b;
}

function getMemoryPrincipal(principal) {
  const key = String(principal || "anon");
  const day = dayKeyUtc();
  let b = memoryPrincipal.get(key);
  if (!b || b.day !== day) {
    b = emptyBucket(day);
    memoryPrincipal.set(key, b);
  }
  return b;
}

function getMemoryGlobal() {
  const day = dayKeyUtc();
  if (!memoryGlobal || memoryGlobal.day !== day) {
    memoryGlobal = emptyBucket(day);
  }
  return memoryGlobal;
}

async function loadBucketRedis(key, day) {
  const client = await getRedisClient();
  if (!client) return null;
  try {
    const raw = await client.hGetAll(key);
    if (!raw || !Object.keys(raw).length) return emptyBucket(day);
    return normalizeBucket(
      {
        tokens: raw.tokens,
        tokensIn: raw.tokens_in,
        tokensOut: raw.tokens_out,
        requests: raw.requests,
        estimatedUsd: raw.estimated_usd,
        providerUsd: raw.provider_usd,
        lastSource: raw.last_source
      },
      day
    );
  } catch {
    return null;
  }
}

async function loadPrincipalBucket(principal) {
  const cfg = readGlobalCostLedgerConfigV0();
  const day = dayKeyUtc();
  const redis = await loadBucketRedis(redisPrincipalKey(day, principal), day);
  if (redis) return redis;
  if (cfg.allowMemoryFallback) return getMemoryPrincipal(principal);
  return emptyBucket(day);
}

async function loadGlobalBucket() {
  const cfg = readGlobalCostLedgerConfigV0();
  const day = dayKeyUtc();
  const redis = await loadBucketRedis(redisGlobalKey(day), day);
  if (redis) return redis;
  if (cfg.allowMemoryFallback) return getMemoryGlobal();
  return emptyBucket(day);
}

/**
 * Fail-closed: production requires live Redis for ledger read/write.
 */
export async function resolveGclLedgerHealthV0() {
  const cfg = readGlobalCostLedgerConfigV0();
  if (!cfg.enabled) {
    return { ok: true, mode: "disabled", redisConnected: false };
  }
  if (!cfg.requireRedis && cfg.allowMemoryFallback) {
    return { ok: true, mode: GCL_LEDGER_MODE_V0.DEV_MEMORY, redisConnected: false };
  }
  const client = await getRedisClient();
  if (!client) {
    return {
      ok: false,
      mode: GCL_LEDGER_MODE_V0.UNAVAILABLE,
      redisConnected: false,
      code: "cost_ledger_unavailable",
      reason: "redis_required_not_connected"
    };
  }
  return { ok: true, mode: GCL_LEDGER_MODE_V0.CLUSTER, redisConnected: true };
}

async function denyLedgerUnavailableV0(principal, detail = {}) {
  const cfg = readGlobalCostLedgerConfigV0();
  const health = await resolveGclLedgerHealthV0();
  await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.LEDGER_UNAVAILABLE, {
    ledgerMode: cfg.ledgerMode,
    allowMemoryFallback: cfg.allowMemoryFallback,
    principal,
    health,
    ...detail
  });
  return {
    proceed: false,
    code: "cost_ledger_unavailable",
    gcl: true,
    throttle: true,
    visibleFailure: true,
    ledgerMode: GCL_LEDGER_MODE_V0.UNAVAILABLE,
    reply: "Maliyet defteri geçici olarak kullanılamıyor. Lütfen daha sonra deneyin.",
    health
  };
}

function applyChargeToBucket(bucket, charge, cfg) {
  const tokens = Math.max(0, Math.floor(Number(charge.tokens) || 0));
  const tokensIn = Math.max(0, Math.floor(Number(charge.tokensIn) || 0));
  const tokensOut = Math.max(0, Math.floor(Number(charge.tokensOut) || 0));
  const usd =
    charge.usd != null && Number.isFinite(Number(charge.usd))
      ? Number(charge.usd)
      : tokensToUsd(tokens, cfg.usdPer1M);
  bucket.tokens += tokens;
  bucket.tokensIn += tokensIn || tokens;
  bucket.tokensOut += tokensOut;
  bucket.requests += 1;
  bucket.estimatedUsd = Math.round((bucket.estimatedUsd + usd) * 1_000_000) / 1_000_000;
  if (charge.source === "provider") {
    bucket.providerUsd = Math.round((bucket.providerUsd + usd) * 1_000_000) / 1_000_000;
    bucket.lastSource = "provider";
  } else {
    bucket.lastSource = charge.source || "estimate";
  }
  return bucket;
}

async function persistBucketRedis(key, bucket) {
  const client = await getRedisClient();
  if (!client) return false;
  try {
    await client.hSet(key, {
      day: bucket.day,
      tokens: String(bucket.tokens),
      tokens_in: String(bucket.tokensIn),
      tokens_out: String(bucket.tokensOut),
      requests: String(bucket.requests),
      estimated_usd: String(bucket.estimatedUsd),
      provider_usd: String(bucket.providerUsd),
      last_source: bucket.lastSource || ""
    });
    await client.expire(key, 96 * 3600);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pre-turn financial assessment (async; Redis when configured).
 * @param {string} principal
 * @param {{ estimatedTokens?: number, generationMode?: string | null, provider?: string, model?: string }} [input]
 */
export async function assessGlobalCostBeforeTurnV0(principal, input = {}) {
  const cfg = readGlobalCostLedgerConfigV0();
  if (!cfg.enabled) {
    return {
      proceed: true,
      code: "gcl_disabled",
      gcl: false,
      throttle: false,
      downgrade: false
    };
  }

  const health = await resolveGclLedgerHealthV0();
  if (!health.ok) {
    return await denyLedgerUnavailableV0(principal, { phase: "assess_pre", health });
  }

  const est = Math.max(0, Math.floor(Number(input.estimatedTokens) || 400));
  const estUsd = tokensToUsd(est, cfg.usdPer1M);
  const [principalBucket, globalBucket] = await Promise.all([
    loadPrincipalBucket(principal),
    loadGlobalBucket()
  ]);

  const drift = detectGclDriftV0({ global: globalBucket });
  if (drift.driftDetected) {
    await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.DRIFT_DETECTED, {
      ledgerMode: cfg.ledgerMode,
      allowMemoryFallback: cfg.allowMemoryFallback,
      principal,
      drift
    });
    if (cfg.enforceDrift) {
      await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.DRIFT_ENFORCED, {
        ledgerMode: cfg.ledgerMode,
        allowMemoryFallback: cfg.allowMemoryFallback,
        principal,
        drift
      });
      return {
        proceed: false,
        code: "cost_ledger_drift_enforced",
        gcl: true,
        throttle: true,
        visibleFailure: true,
        drift,
        reply:
          "Maliyet doğrulaması sağlayıcı kayıtlarıyla uyuşmuyor. İşlem geçici olarak durduruldu.",
        ledger: { principal: principalBucket, global: globalBucket }
      };
    }
  }

  const projectedTokens = principalBucket.tokens + est;
  const projectedGlobalUsd = globalBucket.estimatedUsd + estUsd;
  const softCap = Math.floor(cfg.dailyTokenBudget * cfg.softBudgetRatio);

  if (projectedTokens > cfg.dailyTokenBudget) {
    const deny = {
      proceed: false,
      code: "cost_hard_limit",
      gcl: true,
      throttle: true,
      visibleFailure: true,
      queueFallback: cfg.queueFallback,
      reply: "Günlük kullanım tavanına ulaşıldı. Lütfen daha sonra deneyin.",
      ledger: { principal: principalBucket, global: globalBucket, projectedTokens, projectedGlobalUsd }
    };
    await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.ASSESS_DENY, {
      ledgerMode: cfg.ledgerMode,
      allowMemoryFallback: cfg.allowMemoryFallback,
      principal,
      code: deny.code,
      projectedTokens
    });
    return deny;
  }

  if (cfg.hardSpendLimitUsd > 0 && projectedGlobalUsd > cfg.hardSpendLimitUsd) {
    const deny = {
      proceed: false,
      code: "cost_global_usd_hard_limit",
      gcl: true,
      throttle: true,
      visibleFailure: true,
      queueFallback: cfg.queueFallback,
      reply: "Sistem günlük maliyet tavanına ulaştı. Lütfen daha sonra deneyin.",
      ledger: { principal: principalBucket, global: globalBucket, projectedTokens, projectedGlobalUsd }
    };
    await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.ASSESS_DENY, {
      ledgerMode: cfg.ledgerMode,
      allowMemoryFallback: cfg.allowMemoryFallback,
      principal,
      code: deny.code,
      projectedGlobalUsd
    });
    return deny;
  }

  const downgrade =
    projectedTokens > softCap ||
    (cfg.hardSpendLimitUsd > 0 && projectedGlobalUsd > cfg.hardSpendLimitUsd * cfg.softBudgetRatio);

  const ok = {
    proceed: true,
    code: downgrade ? "cost_soft_downgrade" : "ok",
    gcl: true,
    throttle: false,
    downgrade,
    downgradeMode: downgrade ? cfg.downgradeMode : null,
    downgradeModel: downgrade ? cfg.downgradeModel : null,
    bucketTokens: principalBucket.tokens,
    projectedTokens,
    projectedGlobalUsd,
    globalUsd: globalBucket.estimatedUsd,
    drift,
    ledgerMode: health.mode,
    ledger: { principal: principalBucket, global: globalBucket }
  };
  await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.ASSESS_PRE, {
    ledgerMode: cfg.ledgerMode,
    allowMemoryFallback: cfg.allowMemoryFallback,
    principal,
    code: ok.code,
    projectedTokens,
    projectedGlobalUsd
  });
  return ok;
}

/**
 * @param {string} principal
 * @param {{ tokensUsed?: number, tokensIn?: number, tokensOut?: number, usd?: number, provider?: string, model?: string, source?: "estimate"|"provider"|"reconcile" }} [opts]
 */
export async function recordGlobalCostAfterTurnV0(principal, opts = {}) {
  const cfg = readGlobalCostLedgerConfigV0();
  if (!cfg.enabled) {
    return { ok: true, skipped: true, code: "gcl_disabled" };
  }

  const health = await resolveGclLedgerHealthV0();
  if (!health.ok) {
    await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.RECORD_FAIL, {
      ledgerMode: cfg.ledgerMode,
      allowMemoryFallback: cfg.allowMemoryFallback,
      principal,
      reason: "ledger_unavailable",
      health
    });
    return { ok: false, code: "cost_ledger_unavailable", visibleFailure: true, health };
  }

  const day = dayKeyUtc();
  const tokens = Math.max(0, Math.floor(Number(opts.tokensUsed) || 0));
  const charge = {
    tokens,
    tokensIn: opts.tokensIn,
    tokensOut: opts.tokensOut,
    usd: opts.usd,
    source: opts.source || "estimate"
  };

  const principalBucket = applyChargeToBucket(
    normalizeBucket(await loadPrincipalBucket(principal), day),
    charge,
    cfg
  );
  const globalBucket = applyChargeToBucket(
    normalizeBucket(await loadGlobalBucket(), day),
    charge,
    cfg
  );

  const pKey = redisPrincipalKey(day, principal);
  const gKey = redisGlobalKey(day);
  const redisOkP = await persistBucketRedis(pKey, principalBucket);
  const redisOkG = await persistBucketRedis(gKey, globalBucket);

  if (cfg.requireRedis && (!redisOkP || !redisOkG)) {
    await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.RECORD_FAIL, {
      ledgerMode: cfg.ledgerMode,
      allowMemoryFallback: cfg.allowMemoryFallback,
      principal,
      reason: "redis_persist_failed",
      redisOkP,
      redisOkG
    });
    return {
      ok: false,
      code: "cost_ledger_record_failed",
      visibleFailure: true,
      redisOkP,
      redisOkG
    };
  }

  if (cfg.allowMemoryFallback) {
    if (!redisOkP) memoryPrincipal.set(String(principal || "anon"), principalBucket);
    if (!redisOkG) memoryGlobal = globalBucket;
  }

  const drift = detectGclDriftV0({ global: globalBucket });
  if (drift.driftDetected) {
    await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.DRIFT_DETECTED, {
      ledgerMode: cfg.ledgerMode,
      allowMemoryFallback: cfg.allowMemoryFallback,
      principal,
      drift,
      phase: "record_post"
    });
  }

  await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.RECORD_POST, {
    ledgerMode: cfg.ledgerMode,
    allowMemoryFallback: cfg.allowMemoryFallback,
    principal,
    tokens,
    source: charge.source,
    estimatedUsd: principalBucket.estimatedUsd
  });

  return {
    ok: true,
    day,
    principal: {
      tokens: principalBucket.tokens,
      requests: principalBucket.requests,
      estimatedUsd: principalBucket.estimatedUsd
    },
    global: {
      tokens: globalBucket.tokens,
      requests: globalBucket.requests,
      estimatedUsd: globalBucket.estimatedUsd
    },
    backend: redisOkP && redisOkG ? "redis" : cfg.allowMemoryFallback ? "memory" : "redis",
    drift
  };
}

/**
 * Provider billing ingest (async reconcile hook) — does not execute policy.
 * @param {{ day?: string, usdTotal?: number, tokensTotal?: number, provider?: string }} input
 */
export async function ingestProviderTruthV0(input = {}) {
  const cfg = readGlobalCostLedgerConfigV0();
  const day = String(input.day || dayKeyUtc()).slice(0, 10);
  const usd = Math.max(0, Number(input.usdTotal) || 0);
  const tokens = Math.max(0, Math.floor(Number(input.tokensTotal) || 0));
  const global = normalizeBucket(await loadGlobalBucket(), day);
  global.providerUsd = usd;
  if (tokens > 0) global.tokens = Math.max(global.tokens, tokens);
  global.lastSource = "reconcile";
  const redisOk = await persistBucketRedis(redisGlobalKey(day), global);
  if (!redisOk && cfg.requireRedis) {
    return { ok: false, code: "cost_ledger_record_failed", visibleFailure: true };
  }
  if (!redisOk && cfg.allowMemoryFallback) memoryGlobal = global;
  const drift = detectGclDriftV0({ global });
  await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.PROVIDER_RECONCILE, {
    ledgerMode: cfg.ledgerMode,
    allowMemoryFallback: cfg.allowMemoryFallback,
    day,
    providerUsd: usd,
    drift
  });
  if (drift.driftDetected) {
    await appendGclAuditEventV0(GCL_AUDIT_EVENT_KIND_V0.DRIFT_DETECTED, {
      ledgerMode: cfg.ledgerMode,
      allowMemoryFallback: cfg.allowMemoryFallback,
      drift,
      phase: "provider_reconcile"
    });
  }
  return {
    ok: true,
    day,
    providerUsd: usd,
    drift,
    config: { usdPer1M: cfg.usdPer1M }
  };
}

/**
 * @param {{ principal?: ReturnType<emptyBucket>, global?: ReturnType<emptyBucket> }} buckets
 */
export function detectGclDriftV0(buckets = {}) {
  const cfg = readGlobalCostLedgerConfigV0();
  const g = buckets.global || emptyBucket();
  const estimated = Math.max(0, Number(g.estimatedUsd) || 0);
  const provider = Math.max(0, Number(g.providerUsd) || 0);
  if (provider <= 0) {
    return { driftDetected: false, reason: "no_provider_truth", ratio: 0 };
  }
  const denom = Math.max(0.01, estimated);
  const ratio = Math.abs(provider - estimated) / denom;
  return {
    driftDetected: ratio >= cfg.driftWarnRatio,
    ratio: Math.round(ratio * 1000) / 1000,
    estimatedUsd: estimated,
    providerUsd: provider,
    warnRatio: cfg.driftWarnRatio
  };
}

export async function getGlobalCostLedgerSnapshotV0(principal = null) {
  const cfg = readGlobalCostLedgerConfigV0();
  const health = await resolveGclLedgerHealthV0();
  const global = await loadGlobalBucket();
  const principalBucket = principal != null ? await loadPrincipalBucket(principal) : null;
  const drift = detectGclDriftV0({ global });
  const auditRecent = await listGclAuditEventsV0(24, {
    ledgerMode: health.mode === GCL_LEDGER_MODE_V0.DEV_MEMORY ? GCL_LEDGER_MODE_V0.DEV_MEMORY : GCL_LEDGER_MODE_V0.CLUSTER
  });
  return {
    schema: GLOBAL_COST_LEDGER_SCHEMA_V0,
    contract: GCL_EXECUTION_CONTRACT_V0,
    day: dayKeyUtc(),
    backend: cfg.backend,
    ledgerMode: cfg.ledgerMode,
    health,
    enabled: cfg.enabled,
    requireRedis: cfg.requireRedis,
    enforceDrift: cfg.enforceDrift,
    config: {
      dailyTokenBudget: cfg.dailyTokenBudget,
      hardSpendLimitUsd: cfg.hardSpendLimitUsd,
      usdPer1M: cfg.usdPer1M
    },
    global,
    principal: principalBucket,
    drift,
    auditRecent,
    visibility: buildGclVisibilityV0({ global, principal: principalBucket, cfg, drift })
  };
}

/**
 * @param {{ global: ReturnType<emptyBucket>, principal: ReturnType<emptyBucket> | null, cfg: ReturnType<readGlobalCostLedgerConfigV0>, drift: ReturnType<detectGclDriftV0> }} input
 */
export function buildGclVisibilityV0(input) {
  const { global, principal, cfg, drift } = input;
  const tokenUtil =
    cfg.dailyTokenBudget > 0 ? Math.min(1, (principal?.tokens || 0) / cfg.dailyTokenBudget) : 0;
  const usdUtil =
    cfg.hardSpendLimitUsd > 0 ? Math.min(1, global.estimatedUsd / cfg.hardSpendLimitUsd) : null;
  return Object.freeze({
    principalTokenUtilization01: Math.round(tokenUtil * 1000) / 1000,
    globalUsdUtilization01: usdUtil != null ? Math.round(usdUtil * 1000) / 1000 : null,
    globalRequests: global.requests,
    globalTokens: global.tokens,
    globalEstimatedUsd: global.estimatedUsd,
    providerReconcileUsd: global.providerUsd,
    drift,
    cannotAutoScaleRevenue: true,
    feedsExecution: false
  });
}

export function resetGlobalCostLedgerV0() {
  memoryPrincipal.clear();
  memoryGlobal = null;
  redisPromise = null;
  resetGclAuditTrailV0();
}

export async function getGclBackendStatusV0() {
  const cfg = readGlobalCostLedgerConfigV0();
  const health = await resolveGclLedgerHealthV0();
  return {
    backend: cfg.backend,
    ledgerMode: cfg.ledgerMode,
    requireRedis: cfg.requireRedis,
    allowMemoryFallback: cfg.allowMemoryFallback,
    enforceDrift: cfg.enforceDrift,
    redisConnected: health.redisConnected,
    enabled: cfg.enabled,
    health,
    contract: GCL_EXECUTION_CONTRACT_V0
  };
}

export { listGclAuditEventsV0 };

/** Sync memory-only assess (tests / legacy). */
export function assessGlobalCostBeforeTurnSyncV0(principal, input = {}) {
  const cfg = readGlobalCostLedgerConfigV0();
  const est = Math.max(0, Math.floor(Number(input.estimatedTokens) || 400));
  const estUsd = tokensToUsd(est, cfg.usdPer1M);
  const principalBucket = getMemoryPrincipal(principal);
  const globalBucket = getMemoryGlobal();
  const projectedTokens = principalBucket.tokens + est;
  const projectedGlobalUsd = globalBucket.estimatedUsd + estUsd;
  const softCap = Math.floor(cfg.dailyTokenBudget * cfg.softBudgetRatio);

  if (projectedTokens > cfg.dailyTokenBudget) {
    return { proceed: false, code: "cost_hard_limit", throttle: true, queueFallback: cfg.queueFallback };
  }
  if (cfg.hardSpendLimitUsd > 0 && projectedGlobalUsd > cfg.hardSpendLimitUsd) {
    return { proceed: false, code: "cost_global_usd_hard_limit", throttle: true, queueFallback: cfg.queueFallback };
  }
  const downgrade =
    projectedTokens > softCap ||
    (cfg.hardSpendLimitUsd > 0 && projectedGlobalUsd > cfg.hardSpendLimitUsd * cfg.softBudgetRatio);
  return {
    proceed: true,
    code: downgrade ? "cost_soft_downgrade" : "ok",
    throttle: false,
    downgrade,
    downgradeMode: downgrade ? cfg.downgradeMode : null,
    downgradeModel: downgrade ? cfg.downgradeModel : null,
    bucketTokens: principalBucket.tokens,
    projected: projectedTokens
  };
}

export function recordGlobalCostAfterTurnSyncV0(principal, opts = {}) {
  const cfg = readGlobalCostLedgerConfigV0();
  const charge = {
    tokens: Math.max(0, Math.floor(Number(opts.tokensUsed) || 0)),
    tokensIn: opts.tokensIn,
    tokensOut: opts.tokensOut,
    usd: opts.usd,
    source: opts.source || "estimate"
  };
  const p = applyChargeToBucket(getMemoryPrincipal(principal), charge, cfg);
  const g = applyChargeToBucket(getMemoryGlobal(), charge, cfg);
  memoryPrincipal.set(String(principal || "anon"), p);
  memoryGlobal = g;
  return { day: p.day, tokens: p.tokens, requests: p.requests, globalUsd: g.estimatedUsd };
}
