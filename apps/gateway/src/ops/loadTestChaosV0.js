/**
 * Load test chaos injection v0 — harness-level (no production code mutation).
 */

export const LOAD_TEST_CHAOS_SCHEMA_V0 = "rhizoh.load_test.chaos.v0";

export function readLoadTestChaosConfigV0() {
  const hybrid = process.env.CASTLE_LOAD_TEST_HYBRID_CHAOS === "1";
  return Object.freeze({
    hybridChaos: hybrid,
    redisLatencyMs: Math.max(0, Math.floor(Number(process.env.CASTLE_LOAD_TEST_REDIS_LATENCY_MS) || 0)),
    redisJitterMs: Math.max(0, Math.floor(Number(process.env.CASTLE_LOAD_TEST_REDIS_JITTER_MS) || 40)),
    redisBurstMs: Math.max(0, Math.floor(Number(process.env.CASTLE_LOAD_TEST_REDIS_BURST_MS) || 120)),
    redisBurstRate: Math.min(1, Math.max(0, Number(process.env.CASTLE_LOAD_TEST_REDIS_BURST_RATE) || 0.12)),
    provider429Rate: Math.min(1, Math.max(0, Number(process.env.CASTLE_LOAD_TEST_PROVIDER_429_RATE) || 0)),
    rolloutEndSkipRate: Math.min(1, Math.max(0, Number(process.env.CASTLE_LOAD_TEST_ROLLOUT_END_SKIP_RATE) || 0)),
    partialRolloutFailRate: Math.min(
      1,
      Math.max(0, Number(process.env.CASTLE_LOAD_TEST_ROLLOUT_RESERVE_FAIL_RATE) || 0)
    )
  });
}

export async function applyChaosDelayV0(kind) {
  const cfg = readLoadTestChaosConfigV0();
  if (kind === "redis") {
    let ms = cfg.redisLatencyMs;
    if (cfg.hybridChaos) {
      ms += Math.floor(Math.random() * (cfg.redisJitterMs + 1));
      if (Math.random() < cfg.redisBurstRate) ms += cfg.redisBurstMs;
    }
    if (ms > 0) {
      await sleep(ms);
      return { applied: true, ms, kind: cfg.hybridChaos ? "hybrid_redis_latency" : "redis_latency" };
    }
  }
  return { applied: false, ms: 0, kind };
}

/**
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withRedisChaosLatencyV0(fn) {
  await applyChaosDelayV0("redis");
  return fn();
}

export function shouldInjectProvider429V0() {
  const cfg = readLoadTestChaosConfigV0();
  return cfg.provider429Rate > 0 && Math.random() < cfg.provider429Rate;
}

export function shouldSkipRolloutEndV0() {
  const cfg = readLoadTestChaosConfigV0();
  return cfg.rolloutEndSkipRate > 0 && Math.random() < cfg.rolloutEndSkipRate;
}

export function shouldFailRolloutReserveV0() {
  const cfg = readLoadTestChaosConfigV0();
  return cfg.partialRolloutFailRate > 0 && Math.random() < cfg.partialRolloutFailRate;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
