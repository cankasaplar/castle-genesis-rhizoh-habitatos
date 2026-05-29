/**
 * Phased rollout cluster v0 — cluster-wide concurrent turn cap (Redis).
 * Aligns with GCL: single control-plane truth; no per-instance drift.
 * @see docs/ops/PHASED_ROLLOUT_CLUSTER_V1.0.md
 */

import { randomUUID } from "node:crypto";
import { createClient } from "redis";
import {
  getCoordinationSimRedisClientV0,
  isCoordinationSimEnabledV0,
  resetCoordinationSimV0
} from "./inMemoryRedisCoordinationV0.js";

export const PHASED_ROLLOUT_CLUSTER_SCHEMA_V0 = "rhizoh.phased_rollout_cluster.v0";

export const PHASED_ROLLOUT_TIER_LIMITS_V0 = Object.freeze({
  off: 0,
  test2: 2,
  tier50: 50,
  "50": 50,
  tier200: 200,
  "200": 200,
  tier1000: 1000,
  "1000": 1000,
  tier5000: 5000,
  "5000": 5000
});

export const PHASED_ROLLOUT_LEDGER_MODE_V0 = Object.freeze({
  CLUSTER: "cluster",
  COORDINATION_SIM: "coordination_sim",
  DEV_MEMORY: "dev_memory",
  UNAVAILABLE: "unavailable"
});

function isProductionEnvV0() {
  return process.env.NODE_ENV === "production";
}

function readRequireRedisV0() {
  if (process.env.CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS === "0") return false;
  if (process.env.CASTLE_PHASED_ROLLOUT_REQUIRE_REDIS === "1") return true;
  if (process.env.CASTLE_GCL_REQUIRE_REDIS === "1") return true;
  if (process.env.CASTLE_GCL_REQUIRE_REDIS === "0") return false;
  return isProductionEnvV0();
}

function readAllowMemoryFallbackV0() {
  if (process.env.CASTLE_PHASED_ROLLOUT_ALLOW_MEMORY_FALLBACK === "1") return true;
  if (process.env.CASTLE_GCL_ALLOW_MEMORY_FALLBACK === "1") return true;
  if (readRequireRedisV0()) return false;
  return !isProductionEnvV0();
}

export function readPhasedRolloutClusterConfigV0() {
  const requireRedis = readRequireRedisV0();
  const allowMemoryFallback = readAllowMemoryFallbackV0();
  const ledgerMode = requireRedis
    ? PHASED_ROLLOUT_LEDGER_MODE_V0.CLUSTER
    : allowMemoryFallback
      ? PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY
      : PHASED_ROLLOUT_LEDGER_MODE_V0.CLUSTER;
  return Object.freeze({
    schema: PHASED_ROLLOUT_CLUSTER_SCHEMA_V0,
    requireRedis,
    allowMemoryFallback,
    ledgerMode,
    keyPrefix: String(process.env.CASTLE_GCL_REDIS_PREFIX || "castle:gcl:v1"),
    redisUrl: String(process.env.REDIS_URL || "").trim() || "redis://127.0.0.1:6379"
  });
}

export function readPhasedRolloutTierV0() {
  return String(process.env.CASTLE_PHASED_ROLLOUT_TIER || "off").trim().toLowerCase();
}

export function getPhasedRolloutLimitV0() {
  const tier = readPhasedRolloutTierV0();
  return PHASED_ROLLOUT_TIER_LIMITS_V0[tier] ?? 0;
}

function activeInflightKey() {
  const cfg = readPhasedRolloutClusterConfigV0();
  return `${cfg.keyPrefix}:rollout:active_inflight`;
}

function rolloutLeasesKey() {
  const cfg = readPhasedRolloutClusterConfigV0();
  return `${cfg.keyPrefix}:rollout:leases`;
}

/** Default lease TTL — orphaned slots reconcile after turn timeout. */
export function readPhasedRolloutLeaseTtlMsV0() {
  const raw = Number(process.env.CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS);
  if (Number.isFinite(raw) && raw >= 20) {
    const ms = Math.floor(raw);
    if (isProductionEnvV0() && ms < 60_000) {
      console.warn(
        "[phasedRollout] CASTLE_PHASED_ROLLOUT_LEASE_TTL_MS very low in production — reconcile coupling risk"
      );
    }
    return ms;
  }
  return 120_000;
}

let redisPromise = null;
let memoryActiveTurns = 0;
/** @type {Map<string, number>} leaseId -> expiresAtMs */
const memoryLeases = new Map();

async function getRolloutRedisClient() {
  if (isCoordinationSimEnabledV0()) {
    const sim = getCoordinationSimRedisClientV0();
    await sim.connect();
    return sim;
  }
  const cfg = readPhasedRolloutClusterConfigV0();
  if (!redisPromise) {
    const connectTimeout = Math.min(
      5000,
      Math.max(200, Math.floor(Number(process.env.CASTLE_GCL_REDIS_CONNECT_MS) || 800))
    );
    redisPromise = (async () => {
      const c = createClient({
        url: cfg.redisUrl,
        socket: { connectTimeout, reconnectStrategy: false }
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

export async function resolvePhasedRolloutHealthV0() {
  const cfg = readPhasedRolloutClusterConfigV0();
  const limit = getPhasedRolloutLimitV0();
  if (limit <= 0) {
    return { ok: true, mode: "off", redisConnected: false, limit: 0 };
  }
  if (isCoordinationSimEnabledV0()) {
    const sim = getCoordinationSimRedisClientV0();
    await sim.connect();
    return {
      ok: true,
      mode: PHASED_ROLLOUT_LEDGER_MODE_V0.COORDINATION_SIM,
      redisConnected: false,
      simConnected: true,
      limit
    };
  }
  const client = await getRolloutRedisClient();
  if (client) {
    return {
      ok: true,
      mode: PHASED_ROLLOUT_LEDGER_MODE_V0.CLUSTER,
      redisConnected: true,
      limit
    };
  }
  if (cfg.requireRedis) {
    return {
      ok: false,
      mode: PHASED_ROLLOUT_LEDGER_MODE_V0.UNAVAILABLE,
      redisConnected: false,
      limit,
      code: "phased_rollout_unavailable",
      reason: "redis_required_not_connected"
    };
  }
  if (cfg.allowMemoryFallback) {
    return { ok: true, mode: PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY, redisConnected: false, limit };
  }
  return {
    ok: false,
    mode: PHASED_ROLLOUT_LEDGER_MODE_V0.UNAVAILABLE,
    redisConnected: false,
    limit,
    code: "phased_rollout_unavailable",
    reason: "redis_or_memory_fallback_required"
  };
}

/** Purge expired leases and decrement counter for each removed member. */
const PURGE_EXPIRED_LEASES_LUA = `
local leases_key = KEYS[1]
local counter_key = KEYS[2]
local now = tonumber(ARGV[1])
local expired = redis.call('ZRANGEBYSCORE', leases_key, '-inf', now)
local purged = 0
for i = 1, #expired do
  if redis.call('ZREM', leases_key, expired[i]) == 1 then
    purged = purged + 1
  end
end
if purged > 0 then
  local cur = tonumber(redis.call('GET', counter_key) or '0')
  local next = cur - purged
  if next < 0 then next = 0 end
  redis.call('SET', counter_key, next)
end
return purged
`;

const RESERVE_WITH_LEASE_LUA = `
local leases_key = KEYS[1]
local counter_key = KEYS[2]
local lim = tonumber(ARGV[1])
local lease = ARGV[2]
local expire_at = tonumber(ARGV[3])
local now = tonumber(ARGV[4])
local expired = redis.call('ZRANGEBYSCORE', leases_key, '-inf', now)
local purged = 0
for i = 1, #expired do
  if redis.call('ZREM', leases_key, expired[i]) == 1 then
    purged = purged + 1
  end
end
if purged > 0 then
  local cur = tonumber(redis.call('GET', counter_key) or '0')
  local next = cur - purged
  if next < 0 then next = 0 end
  redis.call('SET', counter_key, next)
end
local cur = tonumber(redis.call('GET', counter_key) or '0')
if cur >= lim then return -1 end
redis.call('INCR', counter_key)
redis.call('ZADD', leases_key, expire_at, lease)
return tonumber(redis.call('GET', counter_key))
`;

const RELEASE_LEASE_LUA = `
local leases_key = KEYS[1]
local counter_key = KEYS[2]
local lease = ARGV[1]
if redis.call('ZREM', leases_key, lease) == 1 then
  local cur = tonumber(redis.call('GET', counter_key) or '0')
  if cur <= 0 then return 0 end
  return redis.call('DECR', counter_key)
end
return tonumber(redis.call('GET', counter_key) or '0')
`;

const RELEASE_LEGACY_LUA = `
local counter_key = KEYS[1]
local cur = tonumber(redis.call('GET', counter_key) or '0')
if cur <= 0 then return 0 end
return redis.call('DECR', counter_key)
`;

async function evalRolloutV0(client, scriptTag, lua, { keys, arguments: args }) {
  if (typeof client.evalScript === "function") {
    return client.evalScript(scriptTag, { keys, arguments: args });
  }
  return client.eval(lua, { keys, arguments: args });
}

function buildRolloutLeaseIdV0(traceId) {
  const tid = String(traceId || randomUUID()).replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 64);
  return `rollout:${tid}:${Date.now()}:${randomUUID().slice(0, 8)}`;
}

function purgeExpiredMemoryLeasesV0() {
  const now = Date.now();
  let purged = 0;
  for (const [leaseId, expiresAt] of memoryLeases) {
    if (expiresAt <= now) {
      memoryLeases.delete(leaseId);
      memoryActiveTurns = Math.max(0, memoryActiveTurns - 1);
      purged += 1;
    }
  }
  return purged;
}

/**
 * @param {{ traceId?: string }} [opts]
 */
function beginPhasedRolloutTurnMemoryV0(limit, opts = {}) {
  purgeExpiredMemoryLeasesV0();
  const ttlMs = readPhasedRolloutLeaseTtlMsV0();
  const leaseId = buildRolloutLeaseIdV0(opts.traceId);
  if (limit <= 0) {
    return {
      ok: true,
      tier: "off",
      limit: 0,
      activeTurns: 0,
      leaseId: null,
      leaseTtlMs: ttlMs,
      ledgerMode: PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY
    };
  }
  if (memoryActiveTurns >= limit) {
    return {
      ok: false,
      code: "phased_rollout_capacity",
      tier: readPhasedRolloutTierV0(),
      limit,
      activeTurns: memoryActiveTurns,
      trackedLeases: memoryLeases.size,
      ledgerMode: PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY
    };
  }
  memoryLeases.set(leaseId, Date.now() + ttlMs);
  memoryActiveTurns += 1;
  return {
    ok: true,
    tier: readPhasedRolloutTierV0(),
    limit,
    activeTurns: memoryActiveTurns,
    leaseId,
    leaseTtlMs: ttlMs,
    trackedLeases: memoryLeases.size,
    ledgerMode: PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY
  };
}

/**
 * @param {string | null | undefined} leaseId
 */
function endPhasedRolloutTurnMemoryV0(leaseId) {
  if (leaseId && memoryLeases.has(leaseId)) {
    memoryLeases.delete(leaseId);
    memoryActiveTurns = Math.max(0, memoryActiveTurns - 1);
    return { released: true, leaseId };
  }
  if (!leaseId) {
    memoryActiveTurns = Math.max(0, memoryActiveTurns - 1);
    return { released: true, legacy: true };
  }
  return { released: false, leaseId, reason: "lease_not_found" };
}

/**
 * Reserve cluster-wide in-flight slot (async) with lease id for guaranteed release.
 * @param {{ traceId?: string }} [opts]
 */
export async function beginPhasedRolloutTurnV0(opts = {}) {
  const limit = getPhasedRolloutLimitV0();
  const tier = readPhasedRolloutTierV0();
  const ttlMs = readPhasedRolloutLeaseTtlMsV0();

  if (limit <= 0) {
    return {
      ok: true,
      tier: "off",
      limit: 0,
      activeTurns: 0,
      leaseId: null,
      leaseTtlMs: ttlMs,
      ledgerMode: "off"
    };
  }

  const health = await resolvePhasedRolloutHealthV0();
  if (!health.ok) {
    return {
      ok: false,
      code: "phased_rollout_unavailable",
      tier,
      limit,
      visibleFailure: true,
      ledgerMode: PHASED_ROLLOUT_LEDGER_MODE_V0.UNAVAILABLE,
      reply: "Kapasite denetimi geçici olarak kullanılamıyor."
    };
  }

  if (health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY) {
    return beginPhasedRolloutTurnMemoryV0(limit, opts);
  }

  const client = await getRolloutRedisClient();
  const ledgerMode =
    health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.COORDINATION_SIM
      ? PHASED_ROLLOUT_LEDGER_MODE_V0.COORDINATION_SIM
      : PHASED_ROLLOUT_LEDGER_MODE_V0.CLUSTER;
  const counterKey = activeInflightKey();
  const leasesKey = rolloutLeasesKey();
  const leaseId = buildRolloutLeaseIdV0(opts.traceId);
  const now = Date.now();
  try {
    const n = await evalRolloutV0(client, "reserve_with_lease", RESERVE_WITH_LEASE_LUA, {
      keys: [leasesKey, counterKey],
      arguments: [String(limit), leaseId, String(now + ttlMs), String(now)]
    });
    const active = Number(n);
    if (active < 0) {
      const cur = Number(await client.get(counterKey)) || 0;
      let trackedLeases = 0;
      try {
        trackedLeases = Number(await client.zCard(leasesKey)) || 0;
      } catch {
        trackedLeases = 0;
      }
      return {
        ok: false,
        code: "phased_rollout_capacity",
        tier,
        limit,
        activeTurns: cur,
        trackedLeases,
        ledgerMode
      };
    }
    return {
      ok: true,
      tier,
      limit,
      activeTurns: active,
      leaseId,
      leaseTtlMs: ttlMs,
      ledgerMode
    };
  } catch {
    return {
      ok: false,
      code: "phased_rollout_unavailable",
      tier,
      limit,
      visibleFailure: true,
      ledgerMode: PHASED_ROLLOUT_LEDGER_MODE_V0.UNAVAILABLE
    };
  }
}

/**
 * Release in-flight slot by lease (preferred) or legacy DECR when leaseId omitted.
 * @param {string | null | undefined} [leaseId]
 */
export async function endPhasedRolloutTurnV0(leaseId) {
  const limit = getPhasedRolloutLimitV0();
  if (limit <= 0) return { released: false, reason: "tier_off" };

  const health = await resolvePhasedRolloutHealthV0();
  if (health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY) {
    return endPhasedRolloutTurnMemoryV0(leaseId);
  }

  const client = await getRolloutRedisClient();
  if (!client) return { released: false, reason: "redis_unavailable" };
  const counterKey = activeInflightKey();
  const leasesKey = rolloutLeasesKey();
  try {
    if (leaseId) {
      const active = await evalRolloutV0(client, "release_lease", RELEASE_LEASE_LUA, {
        keys: [leasesKey, counterKey],
        arguments: [leaseId]
      });
      return { released: true, leaseId, activeTurns: Number(active) || 0 };
    }
    const active = await evalRolloutV0(client, "release_legacy", RELEASE_LEGACY_LUA, {
      keys: [counterKey],
      arguments: []
    });
    return { released: true, legacy: true, activeTurns: Number(active) || 0 };
  } catch {
    return { released: false, reason: "release_error" };
  }
}

/**
 * Timeout reconciliation — reclaims expired leases (crash / skipped release paths).
 */
export async function reconcilePhasedRolloutInflightV0() {
  const limit = getPhasedRolloutLimitV0();
  const now = Date.now();
  if (limit <= 0) {
    return { purged: 0, activeTurns: 0, trackedLeases: 0, leaseTtlMs: readPhasedRolloutLeaseTtlMsV0() };
  }

  const health = await resolvePhasedRolloutHealthV0();
  if (health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY) {
    const purged = purgeExpiredMemoryLeasesV0();
    return {
      purged,
      activeTurns: memoryActiveTurns,
      trackedLeases: memoryLeases.size,
      leaseTtlMs: readPhasedRolloutLeaseTtlMsV0(),
      ledgerMode: PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY
    };
  }

  const client = await getRolloutRedisClient();
  const ledgerMode =
    isCoordinationSimEnabledV0()
      ? PHASED_ROLLOUT_LEDGER_MODE_V0.COORDINATION_SIM
      : PHASED_ROLLOUT_LEDGER_MODE_V0.CLUSTER;
  if (!client) {
    return { purged: 0, activeTurns: 0, trackedLeases: 0, ok: false, code: "phased_rollout_unavailable" };
  }
  try {
    const purged = Number(
      await evalRolloutV0(client, "purge_expired_leases", PURGE_EXPIRED_LEASES_LUA, {
        keys: [rolloutLeasesKey(), activeInflightKey()],
        arguments: [String(now)]
      })
    );
    const activeTurns = Number(await client.get(activeInflightKey())) || 0;
    const trackedLeases = Number(await client.zCard(rolloutLeasesKey())) || 0;
    return {
      purged: purged || 0,
      activeTurns,
      trackedLeases,
      leaseTtlMs: readPhasedRolloutLeaseTtlMsV0(),
      ledgerMode
    };
  } catch {
    return { purged: 0, activeTurns: 0, trackedLeases: 0, ok: false, code: "reconcile_failed" };
  }
}

export async function getPhasedRolloutStatsV0() {
  const tier = readPhasedRolloutTierV0();
  const limit = getPhasedRolloutLimitV0();
  const health = await resolvePhasedRolloutHealthV0();
  let activeTurns = memoryActiveTurns;

  if (health.redisConnected || health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.COORDINATION_SIM) {
    const client = await getRolloutRedisClient();
    if (client) {
      try {
        activeTurns = Number(await client.get(activeInflightKey())) || 0;
      } catch {
        activeTurns = 0;
      }
    }
  }

  const trackedLeases =
    health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.DEV_MEMORY
      ? memoryLeases.size
      : health.redisConnected || health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.COORDINATION_SIM
        ? await (async () => {
            const client = await getRolloutRedisClient();
            if (!client) return 0;
            try {
              return Number(await client.zCard(rolloutLeasesKey())) || 0;
            } catch {
              return 0;
            }
          })()
        : 0;

  const leaseTtlMs = readPhasedRolloutLeaseTtlMsV0();
  const leaseSkew = trackedLeases > 0 ? trackedLeases - activeTurns : 0;
  const zsetPressure =
    limit > 0 && trackedLeases > limit * 1.5
      ? "elevated"
      : leaseSkew > Math.max(3, limit * 0.1)
        ? "watch"
        : "ok";

  return {
    tier,
    limit,
    activeTurns,
    trackedLeases,
    leaseTtlMs,
    leaseSkew,
    zsetPressure,
    ledgerMode: health.mode,
    clusterWide:
      health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.CLUSTER ||
      health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.COORDINATION_SIM,
    coordinationSim: health.mode === PHASED_ROLLOUT_LEDGER_MODE_V0.COORDINATION_SIM,
    health
  };
}

export function resetPhasedRolloutClusterV0() {
  memoryActiveTurns = 0;
  memoryLeases.clear();
  redisPromise = null;
  resetCoordinationSimV0();
}

/** Sync memory path for unit tests. */
export function beginPhasedRolloutTurnSyncV0(opts = {}) {
  return beginPhasedRolloutTurnMemoryV0(getPhasedRolloutLimitV0(), opts);
}

/** @param {string | null | undefined} [leaseId] */
export function endPhasedRolloutTurnSyncV0(leaseId) {
  return endPhasedRolloutTurnMemoryV0(leaseId);
}

/**
 * @param {string} code
 */
export function phasedRolloutErrorV0(code) {
  const err = new Error(code);
  err.code = code;
  err.reply = "Sistem geçici kapasite sınırında. Lütfen kısa süre sonra tekrar deneyin.";
  err.directive = "NONE";
  return err;
}
